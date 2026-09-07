-- ============================================================================
-- TAREA-26 · UPGRADE DE PACK (FLUJO 9)
-- 1. fn_registrar_orden_upgrade: creación segura de órdenes de upgrade
-- 2. Modificación de fn_confirmar_orden_pago: actualización de pack y auditoría
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. fn_registrar_orden_upgrade
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_orden_upgrade(
  p_socio_id bigint,
  p_pack_id bigint,
  p_voucher jsonb DEFAULT NULL::jsonb,
  p_canal text DEFAULT 'oficina'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_socio record;
  v_pack_actual record;
  v_pack_nuevo record;
  v_ciclo_id bigint;
  v_orden_id bigint;
  v_codigo_orden text;
BEGIN
  -- 1. Verificar si el usuario autenticado es administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para registrar upgrades de pack.';
  END IF;

  -- 2. Obtener el ID del admin
  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id
    FROM public.socio
    WHERE rol IN ('admin', 'superadmin')
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  -- 3. Obtener el socio
  SELECT * INTO v_socio FROM public.socio WHERE id = p_socio_id;
  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'Socio con ID % no encontrado.', p_socio_id;
  END IF;

  IF v_socio.estado = 'baja' THEN
    RAISE EXCEPTION 'No se puede registrar un upgrade para un socio dado de baja.';
  END IF;

  -- 4. Obtener pack actual y pack nuevo
  SELECT * INTO v_pack_actual FROM public.pack WHERE id = v_socio.pack_id;
  SELECT * INTO v_pack_nuevo FROM public.pack WHERE id = p_pack_id AND activo = true;

  IF v_pack_nuevo.id IS NULL THEN
    RAISE EXCEPTION 'Pack destino con ID % no encontrado o inactivo.', p_pack_id;
  END IF;

  -- 5. Validar que el pack nuevo tenga precio estrictamente superior (Regla 1 / 6)
  IF v_pack_actual.id IS NOT NULL AND v_pack_nuevo.precio_cent <= v_pack_actual.precio_cent THEN
    RAISE EXCEPTION 'El pack % (S/. %) no tiene un precio superior al pack actual % (S/. %). Solo se permite subir de pack.',
      v_pack_nuevo.nombre, (v_pack_nuevo.precio_cent / 100.0),
      v_pack_actual.nombre, (v_pack_actual.precio_cent / 100.0);
  END IF;

  -- 6. Obtener ciclo abierto
  SELECT id INTO v_ciclo_id
  FROM public.ciclo
  WHERE estado = 'abierto'
  ORDER BY id DESC
  LIMIT 1;

  IF v_ciclo_id IS NULL THEN
    v_ciclo_id := 4;
  END IF;

  -- 7. Generar orden inicial de tipo 'afiliacion' con el total completo del pack nuevo (RF-509)
  v_orden_id := nextval('public.orden_id_seq'::regclass);
  v_codigo_orden := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(v_orden_id::text, 6, '0');

  INSERT INTO public.orden (
    id, codigo, socio_id, ciclo_id, tipo, pack_id,
    subtotal_cent, descuento_cent, total_cent, puntos_total,
    estado, canal, asesor_id, creada_en
  ) VALUES (
    v_orden_id, v_codigo_orden, v_socio.id, v_ciclo_id, 'afiliacion', v_pack_nuevo.id,
    v_pack_nuevo.precio_cent, 0, v_pack_nuevo.precio_cent, COALESCE(v_pack_nuevo.puntos_rango, 0),
    'por_confirmar', COALESCE(p_canal, 'oficina'), v_admin_id, now()
  );

  -- 8. socio.pack_id NO se toca todavía (Regla 4)

  -- 9. Insertar voucher si viene provisto
  IF p_voucher IS NOT NULL THEN
    INSERT INTO public.voucher (
      orden_id, imagen_url, banco, numero_operacion,
      monto_cent, fecha_deposito, estado, subido_en
    ) VALUES (
      v_orden_id,
      NULLIF(trim(p_voucher->>'imagen_url'), ''),
      p_voucher->>'banco',
      p_voucher->>'numero_operacion',
      COALESCE((p_voucher->>'monto_cent')::bigint, v_pack_nuevo.precio_cent),
      COALESCE((p_voucher->>'fecha_deposito')::date, current_date),
      'pendiente',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'orden_id', v_orden_id,
    'orden_codigo', v_codigo_orden,
    'socio_id', v_socio.id,
    'pack_anterior_id', v_socio.pack_id,
    'pack_nuevo_id', v_pack_nuevo.id,
    'total_cent', v_pack_nuevo.precio_cent,
    'puntos_total', COALESCE(v_pack_nuevo.puntos_rango, 0),
    'estado', 'por_confirmar'
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.fn_registrar_orden_upgrade TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_registrar_orden_upgrade FROM anon;

-- ----------------------------------------------------------------------------
-- 2. Modificación de fn_confirmar_orden_pago (Bloque 2)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_confirmar_orden_pago(p_orden_id bigint, p_comisiones jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_orden record;
  v_comisiones_insertadas integer := 0;
  v_puntos_min_activacion integer := 70;
  v_socio_activo boolean;
  v_datos_antes jsonb;
  v_datos_despues jsonb;
  v_total_comisiones_cent bigint := 0;
  -- Variables para gestión de Upgrade de Pack (TAREA-26 / FLUJO 9)
  v_socio record;
  v_pack_actual record;
  v_pack_nuevo record;
  v_datos_antes_upgrade jsonb;
  v_datos_despues_upgrade jsonb;
BEGIN
  -- 1. Verificar si el usuario autenticado es administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para confirmar pagos.';
  END IF;

  -- 2. Obtener el ID del administrador autenticado
  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id
    FROM public.socio
    WHERE rol IN ('admin', 'superadmin')
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  -- 3. UPDATE condicional sobre orden (PROTECCIÓN CONTRA DOBLE CONFIRMACIÓN RF-347)
  UPDATE public.orden
     SET estado = 'confirmada',
         aprobada_en = now(),
         aprobada_por = v_admin_id
   WHERE id = p_orden_id
     AND estado = 'por_confirmar'
  RETURNING * INTO v_orden;

  -- Si devuelve 0 filas, alguien ya la confirmó o no está pendiente
  IF v_orden.id IS NULL THEN
    RETURN jsonb_build_object(
      'exito', false,
      'codigo', 'YA_CONFIRMADA',
      'mensaje', 'La orden ya fue confirmada o no se encuentra en estado por_confirmar (0 filas afectadas).'
    );
  END IF;

  -- Capturar datos_antes
  v_datos_antes := jsonb_build_object(
    'orden_id', v_orden.id,
    'codigo', v_orden.codigo,
    'socio_id', v_orden.socio_id,
    'estado', 'por_confirmar',
    'tipo', v_orden.tipo,
    'total_cent', v_orden.total_cent,
    'subtotal_cent', v_orden.subtotal_cent
  );

  -- 4. Actualizar voucher a aprobado
  UPDATE public.voucher
     SET estado = 'aprobado',
         revisado_por = v_admin_id,
         revisado_en = now()
   WHERE orden_id = p_orden_id;

  -- 5. Acreditar puntos en movimiento_puntos
  IF v_orden.puntos_total > 0 THEN
    INSERT INTO public.movimiento_puntos (
      socio_id, ciclo_id, orden_id, origen, puntos,
      cuenta_activacion, cuenta_residual, cuenta_rango, nota, creado_en
    ) VALUES (
      v_orden.socio_id,
      v_orden.ciclo_id,
      v_orden.id,
      CASE WHEN v_orden.tipo = 'afiliacion' THEN 'afiliacion' ELSE 'recompra' END,
      v_orden.puntos_total,
      true,
      (v_orden.tipo <> 'afiliacion'),
      true,
      'Confirmado desde P-23',
      now()
    );
  END IF;

  -- 6. Obtener umbral de activación desde config
  SELECT COALESCE(valor::integer, 70) INTO v_puntos_min_activacion
  FROM public.config
  WHERE clave = 'activacion_puntos_mes';

  -- 7. Actualizar o crear registro en activacion
  IF v_orden.tipo = 'afiliacion' OR v_orden.puntos_total > 0 THEN
    v_socio_activo := (v_orden.tipo = 'afiliacion' OR v_orden.puntos_total >= v_puntos_min_activacion);

    INSERT INTO public.activacion (
      socio_id, ciclo_id, activo, puntos_personales, calculado_en
    ) VALUES (
      v_orden.socio_id,
      v_orden.ciclo_id,
      v_socio_activo,
      v_orden.puntos_total,
      now()
    )
    ON CONFLICT (socio_id, ciclo_id) DO UPDATE
    SET puntos_personales = activacion.puntos_personales + EXCLUDED.puntos_personales,
        activo = (
          (activacion.puntos_personales + EXCLUDED.puntos_personales) >= v_puntos_min_activacion
          OR v_orden.tipo = 'afiliacion'
        ),
        calculado_en = now();
  END IF;

  -- 8. Si es orden de afiliación, activar al socio (RF-349) y procesar upgrade si aplica (TAREA-26)
  IF v_orden.tipo = 'afiliacion' THEN
    UPDATE public.socio
       SET estado = 'activo'
     WHERE id = v_orden.socio_id
       AND estado = 'pendiente';

    -- TAREA-26 · UPGRADE DE PACK (FLUJO 9)
    -- Si la orden tiene un pack distinto al del socio, es un upgrade
    SELECT * INTO v_socio FROM public.socio WHERE id = v_orden.socio_id;

    IF v_orden.pack_id IS NOT NULL AND v_socio.pack_id IS NOT NULL AND v_orden.pack_id <> v_socio.pack_id THEN
      SELECT * INTO v_pack_actual FROM public.pack WHERE id = v_socio.pack_id;
      SELECT * INTO v_pack_nuevo FROM public.pack WHERE id = v_orden.pack_id;

      -- 🔴 Guarda de precio: Si el pack nuevo NO cuesta más, la función FALLA con mensaje claro
      IF v_pack_nuevo.precio_cent <= v_pack_actual.precio_cent THEN
        RAISE EXCEPTION 'No se puede degradar o mantener el pack del socio: pack nuevo % (S/. %) no supera el precio del pack actual % (S/. %).',
          v_pack_nuevo.nombre, (v_pack_nuevo.precio_cent / 100.0),
          v_pack_actual.nombre, (v_pack_actual.precio_cent / 100.0);
      END IF;

      -- Preparar auditoría con el valor anterior completo
      v_datos_antes_upgrade := jsonb_build_object(
        'pack_id', v_pack_actual.id,
        'nombre', v_pack_actual.nombre,
        'codigo', v_pack_actual.codigo,
        'precio_cent', v_pack_actual.precio_cent,
        'puntos_rango', v_pack_actual.puntos_rango,
        'niveles_patrocinio', v_pack_actual.niveles_patrocinio,
        'niveles_residual', v_pack_actual.niveles_residual,
        'descuento_recompra_pct', v_pack_actual.descuento_recompra_pct
      );

      v_datos_despues_upgrade := jsonb_build_object(
        'pack_id', v_pack_nuevo.id,
        'nombre', v_pack_nuevo.nombre,
        'codigo', v_pack_nuevo.codigo,
        'precio_cent', v_pack_nuevo.precio_cent,
        'puntos_rango', v_pack_nuevo.puntos_rango,
        'niveles_patrocinio', v_pack_nuevo.niveles_patrocinio,
        'niveles_residual', v_pack_nuevo.niveles_residual,
        'descuento_recompra_pct', v_pack_nuevo.descuento_recompra_pct
      );

      -- Actualizar pack_id del socio
      UPDATE public.socio
         SET pack_id = v_orden.pack_id,
             actualizado_en = now()
       WHERE id = v_orden.socio_id;

      -- Registrar auditoría del upgrade
      INSERT INTO public.auditoria (
        usuario_id,
        accion,
        tabla,
        registro_id,
        datos_antes,
        datos_despues,
        creado_en
      ) VALUES (
        v_admin_id,
        'upgrade_pack',
        'socio',
        v_orden.socio_id,
        v_datos_antes_upgrade,
        v_datos_despues_upgrade,
        now()
      );
    END IF;
  END IF;

  -- 9. Insertar las comisiones calculadas en comision (RF-348)
  IF p_comisiones IS NOT NULL AND jsonb_array_length(p_comisiones) > 0 THEN
    INSERT INTO public.comision (
      ciclo_id, beneficiario_id, generador_id, orden_id, tipo, nivel,
      base_cent, base_puntos, porcentaje, monto_cent, estado, detalle, creado_en
    )
    SELECT
      (c->>'ciclo_id')::bigint,
      (c->>'beneficiario_id')::bigint,
      (c->>'generador_id')::bigint,
      v_orden.id,
      c->>'tipo',
      (c->>'nivel')::integer,
      (c->>'base_cent')::bigint,
      CASE WHEN c->>'base_puntos' IS NOT NULL AND c->>'base_puntos' <> 'null' THEN (c->>'base_puntos')::integer ELSE NULL END,
      (c->>'porcentaje')::numeric,
      (c->>'monto_cent')::bigint,
      'confirmada',
      (c->'detalle')::jsonb,
      now()
    FROM jsonb_array_elements(p_comisiones) AS c;

    GET DIAGNOSTICS v_comisiones_insertadas = ROW_COUNT;

    SELECT COALESCE(SUM((c->>'monto_cent')::bigint), 0) INTO v_total_comisiones_cent
    FROM jsonb_array_elements(p_comisiones) AS c;
  END IF;

  -- 10. AUDITORÍA
  v_datos_despues := jsonb_build_object(
    'orden_id', v_orden.id,
    'codigo', v_orden.codigo,
    'estado', 'confirmada',
    'puntos_acreditados', v_orden.puntos_total,
    'comisiones_insertadas', v_comisiones_insertadas,
    'total_comisiones_cent', v_total_comisiones_cent
  );

  INSERT INTO public.auditoria (
    usuario_id,
    accion,
    tabla,
    registro_id,
    datos_antes,
    datos_despues,
    creado_en
  ) VALUES (
    v_admin_id,
    'confirmar_pago',
    'orden',
    v_orden.id,
    v_datos_antes,
    v_datos_despues,
    now()
  );

  RETURN jsonb_build_object(
    'exito', true,
    'codigo', 'OK',
    'mensaje', 'Pago confirmado y comisiones acreditadas exitosamente.',
    'orden_id', v_orden.id,
    'comisiones_insertadas', v_comisiones_insertadas
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.fn_confirmar_orden_pago TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_confirmar_orden_pago FROM anon;
