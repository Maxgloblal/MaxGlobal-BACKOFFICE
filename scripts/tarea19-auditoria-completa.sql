-- ==============================================================================
-- SISTEMA MAX GLOBAL · TAREA-19: AUDITORÍA COMPLETA DEL SISTEMA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BLOQUE 1: CERRAR EL BORRADO DE LA AUDITORÍA
-- Una bitácora que el admin puede borrar no prueba nada.
-- Solo se permiten operaciones de INSERT y SELECT.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS auditoria_admin_delete ON public.auditoria;

-- Verificación de políticas:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'auditoria';
-- Debe retornar únicamente auditoria_admin_insert y auditoria_admin_select.

-- ------------------------------------------------------------------------------
-- BLOQUE 2.1: AUDITORÍA EN CONFIRMAR Y RECHAZAR PAGOS DE ÓRDENES
-- ------------------------------------------------------------------------------

-- 1. fn_confirmar_orden_pago
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

  -- 8. Si es orden de afiliación, activar al socio (RF-349)
  IF v_orden.tipo = 'afiliacion' THEN
    UPDATE public.socio
       SET estado = 'activo'
     WHERE id = v_orden.socio_id
       AND estado = 'pendiente';
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

-- 2. fn_rechazar_orden_pago
CREATE OR REPLACE FUNCTION public.fn_rechazar_orden_pago(p_orden_id bigint, p_motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_orden record;
  v_datos_antes jsonb;
  v_datos_despues jsonb;
BEGIN
  -- 1. Verificar si el usuario autenticado es administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para rechazar pagos.';
  END IF;

  IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
    RAISE EXCEPTION 'El motivo de rechazo es obligatorio para auditar la operación (RF-350).';
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

  -- 3. UPDATE condicional sobre orden
  UPDATE public.orden
     SET estado = 'rechazada'
   WHERE id = p_orden_id
     AND estado = 'por_confirmar'
  RETURNING * INTO v_orden;

  IF v_orden.id IS NULL THEN
    RETURN jsonb_build_object(
      'exito', false,
      'codigo', 'NO_POR_CONFIRMAR',
      'mensaje', 'La orden ya fue procesada o no se encuentra en estado por_confirmar.'
    );
  END IF;

  -- Capturar datos_antes
  v_datos_antes := jsonb_build_object(
    'orden_id', v_orden.id,
    'codigo', v_orden.codigo,
    'socio_id', v_orden.socio_id,
    'estado', 'por_confirmar',
    'total_cent', v_orden.total_cent
  );

  -- 4. Actualizar voucher a rechazado con motivo
  UPDATE public.voucher
     SET estado = 'rechazado',
         motivo_rechazo = trim(p_motivo),
         revisado_por = v_admin_id,
         revisado_en = now()
   WHERE orden_id = p_orden_id;

  -- 5. AUDITORÍA
  v_datos_despues := jsonb_build_object(
    'orden_id', v_orden.id,
    'codigo', v_orden.codigo,
    'estado', 'rechazada',
    'motivo', trim(p_motivo)
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
    'rechazar_pago',
    'orden',
    v_orden.id,
    v_datos_antes,
    v_datos_despues,
    now()
  );

  RETURN jsonb_build_object(
    'exito', true,
    'codigo', 'OK',
    'mensaje', 'Orden rechazada exitosamente.'
  );
END;
$function$;

-- ------------------------------------------------------------------------------
-- BLOQUE 2.2: AUDITORÍA EN CIERRE DE CICLO
-- ------------------------------------------------------------------------------

-- 3. fn_ejecutar_cierre_ciclo
CREATE OR REPLACE FUNCTION public.fn_ejecutar_cierre_ciclo(p_ciclo_id integer, p_admin_id integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_ciclo RECORD;
    v_nuevo_anio INT;
    v_nuevo_mes INT;
    v_inicio DATE;
    v_fin DATE;
    v_nuevo_ciclo_id BIGINT;
    r_com RECORD;
    v_saldo_previo BIGINT;
    v_nuevo_saldo BIGINT;
    v_total_abonado BIGINT := 0;
    v_cant_abonos INT := 0;
    v_admin_id BIGINT := p_admin_id;
    v_total_comisiones_a_abonar BIGINT := 0;
    v_datos_antes JSONB;
    v_datos_despues JSONB;
BEGIN
    -- 1. Validar permisos de administrador
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden ejecutar el cierre de ciclo.';
    END IF;

    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id
      FROM public.socio
      WHERE email = auth.jwt() ->> 'email'
        AND rol IN ('admin', 'superadmin')
      LIMIT 1;
    END IF;

    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id
      FROM public.socio
      WHERE rol IN ('admin', 'superadmin')
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    -- 2. Obtener y bloquear el ciclo a cerrar
    SELECT * INTO v_ciclo FROM ciclo WHERE id = p_ciclo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ciclo % no existe.', p_ciclo_id;
    END IF;

    IF v_ciclo.estado <> 'abierto' THEN
        RAISE EXCEPTION 'El ciclo % ya se encuentra cerrado o no está en estado abierto.', p_ciclo_id;
    END IF;

    -- Calcular comisiones a abonar antes de cerrar
    SELECT COALESCE(SUM(monto_cent), 0) INTO v_total_comisiones_a_abonar
    FROM comision
    WHERE ciclo_id = p_ciclo_id
      AND monto_cent > 0
      AND (estado IN ('confirmada', 'pagada') OR estado IS NULL);

    v_datos_antes := jsonb_build_object(
      'ciclo_id', p_ciclo_id,
      'anio', v_ciclo.anio,
      'mes', v_ciclo.mes,
      'estado', 'abierto',
      'total_comisiones_cent', v_total_comisiones_a_abonar
    );

    -- 3. Protección contra doble cierre: UPDATE condicional
    UPDATE ciclo
       SET estado = 'cerrado',
           cerrado_en = now(),
           cerrado_por = v_admin_id
     WHERE id = p_ciclo_id
       AND estado = 'abierto';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ciclo ya fue cerrado por otra transacción.';
    END IF;

    -- 4. RF-379: Abonar las comisiones a las billeteras (wallet_movimiento)
    FOR r_com IN (
        SELECT id, beneficiario_id, tipo, monto_cent, ciclo_id
        FROM comision
        WHERE ciclo_id = p_ciclo_id
          AND monto_cent > 0
          AND (estado IN ('confirmada', 'pagada') OR estado IS NULL)
        ORDER BY id ASC
    ) LOOP
        -- Obtener el saldo acumulado actual del socio
        SELECT COALESCE(saldo_despues_cent, 0) INTO v_saldo_previo
        FROM wallet_movimiento
        WHERE socio_id = r_com.beneficiario_id
        ORDER BY id DESC
        LIMIT 1;

        IF v_saldo_previo IS NULL THEN
            v_saldo_previo := 0;
        END IF;

        v_nuevo_saldo := v_saldo_previo + r_com.monto_cent;

        INSERT INTO wallet_movimiento (
            socio_id,
            ciclo_id,
            comision_id,
            tipo,
            concepto,
            monto_cent,
            saldo_despues_cent,
            creado_en
        ) VALUES (
            r_com.beneficiario_id,
            p_ciclo_id,
            r_com.id,
            'abono',
            'Bono de ' || r_com.tipo || ', ciclo ' || p_ciclo_id,
            r_com.monto_cent,
            v_nuevo_saldo,
            now()
        );

        v_total_abonado := v_total_abonado + r_com.monto_cent;
        v_cant_abonos := v_cant_abonos + 1;
    END LOOP;

    -- 5. RF-383: Apertura automática del ciclo siguiente
    IF v_ciclo.mes = 12 THEN
        v_nuevo_anio := v_ciclo.anio + 1;
        v_nuevo_mes := 1;
    ELSE
        v_nuevo_anio := v_ciclo.anio;
        v_nuevo_mes := v_ciclo.mes + 1;
    END IF;

    v_inicio := make_date(v_nuevo_anio, v_nuevo_mes, 1);
    v_fin := (v_inicio + INTERVAL '1 month - 1 day')::DATE;

    -- Verificar que no haya otro ciclo abierto
    IF EXISTS (SELECT 1 FROM ciclo WHERE estado = 'abierto') THEN
        RAISE EXCEPTION 'Inconsistencia: ya existe otro ciclo abierto.';
    END IF;

    INSERT INTO ciclo (anio, mes, fecha_inicio, fecha_fin, estado)
    VALUES (v_nuevo_anio, v_nuevo_mes, v_inicio, v_fin, 'abierto')
    RETURNING id INTO v_nuevo_ciclo_id;

    -- 6. AUDITORÍA
    v_datos_despues := jsonb_build_object(
      'ciclo_cerrado_id', p_ciclo_id,
      'estado', 'cerrado',
      'total_abonado_cent', v_total_abonado,
      'cantidad_abonos', v_cant_abonos,
      'nuevo_ciclo_id', v_nuevo_ciclo_id,
      'nuevo_ciclo_mes', v_nuevo_mes,
      'nuevo_ciclo_anio', v_nuevo_anio
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
      'cerrar_ciclo',
      'ciclo',
      p_ciclo_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
        'exito', true,
        'ciclo_cerrado_id', p_ciclo_id,
        'total_abonado_cent', v_total_abonado,
        'total_abonado_soles', (v_total_abonado::NUMERIC / 100.0),
        'cantidad_abonos', v_cant_abonos,
        'nuevo_ciclo_id', v_nuevo_ciclo_id,
        'nuevo_ciclo_mes', v_nuevo_mes,
        'nuevo_ciclo_anio', v_nuevo_anio
    );
END;
$function$;
