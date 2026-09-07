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
