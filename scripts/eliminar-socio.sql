-- ========================================================================
-- FUNCIONALIDAD: ELIMINAR SOCIO DEFINITIVAMENTE (HARD DELETE CON CANDADOS)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.fn_vista_previa_eliminar_socio(p_socio_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_socio record;
  v_patrocinador record;
  v_frontales_count int := 0;
  v_ordenes_count int := 0;
  v_ordenes_monto_cent bigint := 0;
  v_comisiones_generadas_count int := 0;
  v_comisiones_generadas_cent bigint := 0;
  v_comisiones_beneficiario_count int := 0;
  v_comisiones_beneficiario_cent bigint := 0;
  v_tiene_ciclos_cerrados boolean := false;
  v_tiene_retiros boolean := false;
  v_puede_eliminar boolean := true;
  v_motivo_bloqueo text := NULL;
  v_es_raiz boolean := false;
BEGIN
  -- 1. Validar admin
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para consultar la vista previa de eliminación.';
  END IF;

  -- 2. Obtener socio
  SELECT id, codigo, nombres, apellidos, documento, email, estado, patrocinador_id, creado_en
  INTO v_socio
  FROM public.socio
  WHERE id = p_socio_id;

  IF v_socio.id IS NULL THEN
    RETURN jsonb_build_object(
      'exito', false,
      'codigo', 'SOCIO_NO_ENCONTRADO',
      'mensaje', 'El socio especificado no existe.'
    );
  END IF;

  -- 3. Validar si es raíz
  IF v_socio.patrocinador_id IS NULL THEN
    v_es_raiz := true;
    v_puede_eliminar := false;
    v_motivo_bloqueo := 'El socio es la raíz del sistema (no tiene patrocinador) y no puede ser eliminado.';
  END IF;

  -- 4. Obtener patrocinador superior
  IF v_socio.patrocinador_id IS NOT NULL THEN
    SELECT id, codigo, nombres, apellidos
    INTO v_patrocinador
    FROM public.socio
    WHERE id = v_socio.patrocinador_id;
  END IF;

  -- 5. Contar frontales directos que se reengancharán
  SELECT COUNT(*) INTO v_frontales_count
  FROM public.socio
  WHERE patrocinador_id = p_socio_id;

  -- 6. Candado contable: Verificar si tiene comisiones en ciclos CERRADOS
  SELECT EXISTS (
    SELECT 1
    FROM public.comision c
    JOIN public.ciclo ci ON ci.id = c.ciclo_id
    WHERE (c.beneficiario_id = p_socio_id OR c.generador_id = p_socio_id)
      AND ci.estado = 'cerrado'
  ) INTO v_tiene_ciclos_cerrados;

  -- Candado de retiros: Verificar si tiene solicitudes de retiro procesadas o pagadas
  SELECT EXISTS (
    SELECT 1
    FROM public.solicitud_retiro
    WHERE socio_id = p_socio_id
      AND estado IN ('aprobado', 'pagado', 'procesando')
  ) INTO v_tiene_retiros;

  IF v_tiene_ciclos_cerrados THEN
    v_puede_eliminar := false;
    v_motivo_bloqueo := 'El socio cuenta con comisiones registradas en ciclos cerrados (contabilidad histórica consolidada). No se puede eliminar físicamente; debe usar "Dar de baja con reenganche".';
  ELSIF v_tiene_retiros THEN
    v_puede_eliminar := false;
    v_motivo_bloqueo := 'El socio cuenta con solicitudes de retiro de dinero aprobadas o pagadas. No se puede eliminar físicamente; debe usar "Dar de baja con reenganche".';
  END IF;

  -- 7. Contar órdenes del socio
  SELECT COUNT(*), COALESCE(SUM(total_cent), 0)
  INTO v_ordenes_count, v_ordenes_monto_cent
  FROM public.orden
  WHERE socio_id = p_socio_id;

  -- 8. Contar comisiones que generó hacia la red en ciclos abiertos
  SELECT COUNT(*), COALESCE(SUM(monto_cent), 0)
  INTO v_comisiones_generadas_count, v_comisiones_generadas_cent
  FROM public.comision c
  JOIN public.ciclo ci ON ci.id = c.ciclo_id
  WHERE c.generador_id = p_socio_id
    AND ci.estado = 'abierto';

  -- 9. Contar comisiones que recibió en ciclos abiertos
  SELECT COUNT(*), COALESCE(SUM(monto_cent), 0)
  INTO v_comisiones_beneficiario_count, v_comisiones_beneficiario_cent
  FROM public.comision c
  JOIN public.ciclo ci ON ci.id = c.ciclo_id
  WHERE c.beneficiario_id = p_socio_id
    AND ci.estado = 'abierto';

  RETURN jsonb_build_object(
    'exito', true,
    'puede_eliminar', v_puede_eliminar,
    'motivo_bloqueo', v_motivo_bloqueo,
    'es_raiz', v_es_raiz,
    'socio', jsonb_build_object(
      'id', v_socio.id,
      'codigo', v_socio.codigo,
      'nombres', v_socio.nombres,
      'apellidos', v_socio.apellidos,
      'documento', v_socio.documento,
      'email', v_socio.email,
      'estado', v_socio.estado
    ),
    'patrocinador', CASE WHEN v_patrocinador.id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_patrocinador.id,
        'codigo', v_patrocinador.codigo,
        'nombres', v_patrocinador.nombres,
        'apellidos', v_patrocinador.apellidos
      ) ELSE NULL END,
    'frontales_count', v_frontales_count,
    'ordenes_count', v_ordenes_count,
    'ordenes_monto_cent', v_ordenes_monto_cent,
    'comisiones_generadas_count', v_comisiones_generadas_count,
    'comisiones_generadas_cent', v_comisiones_generadas_cent,
    'comisiones_beneficiario_count', v_comisiones_beneficiario_count,
    'comisiones_beneficiario_cent', v_comisiones_beneficiario_cent
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_eliminar_socio_definitivo(
  p_socio_id bigint,
  p_motivo text,
  p_admin_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_id bigint := p_admin_id;
  v_socio record;
  v_patrocinador record;
  v_frontales_ids bigint[] := ARRAY[]::bigint[];
  v_descendientes_ids bigint[] := ARRAY[]::bigint[];
  v_frontales_movidos integer := 0;
  v_filas_ancestro_insertadas integer := 0;
  v_comisiones_borradas integer := 0;
  v_ordenes_borradas integer := 0;
  v_tiene_ciclos_cerrados boolean := false;
  v_tiene_retiros boolean := false;
  v_datos_antes jsonb;
  v_user_id uuid;
  v_orden_ids bigint[];
BEGIN
  -- 1. Validar permisos de administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para eliminar socios definitivamente.';
  END IF;

  -- 2. Validar motivo obligatorio
  IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
    RAISE EXCEPTION 'El motivo de la eliminación es obligatorio.';
  END IF;

  -- 3. Identificar admin ejecutor
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

  -- 4. Validar y bloquear fila del socio
  SELECT *
  INTO v_socio
  FROM public.socio
  WHERE id = p_socio_id
  FOR UPDATE;

  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'El socio con ID % no existe.', p_socio_id;
  END IF;

  IF v_socio.patrocinador_id IS NULL THEN
    RAISE EXCEPTION 'No se puede eliminar al socio raíz (sin patrocinador).';
  END IF;

  -- 5. Candados contables estrictos
  SELECT EXISTS (
    SELECT 1
    FROM public.comision c
    JOIN public.ciclo ci ON ci.id = c.ciclo_id
    WHERE (c.beneficiario_id = p_socio_id OR c.generador_id = p_socio_id)
      AND ci.estado = 'cerrado'
  ) INTO v_tiene_ciclos_cerrados;

  IF v_tiene_ciclos_cerrados THEN
    RAISE EXCEPTION 'No se puede eliminar al socio %: cuenta con comisiones en ciclos cerrados. Utilice dar de baja.', v_socio.codigo;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.solicitud_retiro
    WHERE socio_id = p_socio_id
      AND estado IN ('aprobado', 'pagado', 'procesando')
  ) INTO v_tiene_retiros;

  IF v_tiene_retiros THEN
    RAISE EXCEPTION 'No se puede eliminar al socio %: cuenta con retiros de dinero procesados. Utilice dar de baja.', v_socio.codigo;
  END IF;

  -- Obtener patrocinador receptor
  SELECT * INTO v_patrocinador
  FROM public.socio
  WHERE id = v_socio.patrocinador_id;

  -- 6. Obtener subárbol y frontales
  SELECT COALESCE(array_agg(id ORDER BY id ASC), ARRAY[]::bigint[])
  INTO v_frontales_ids
  FROM public.socio
  WHERE patrocinador_id = p_socio_id;

  SELECT COALESCE(array_agg(descendiente_id ORDER BY nivel ASC), ARRAY[]::bigint[])
  INTO v_descendientes_ids
  FROM public.red_ancestro
  WHERE ancestro_id = p_socio_id;

  -- Obtener IDs de órdenes del socio
  SELECT COALESCE(array_agg(id), ARRAY[]::bigint[])
  INTO v_orden_ids
  FROM public.orden
  WHERE socio_id = p_socio_id;

  -- 7. Snapshot de auditoría antes de borrar
  v_datos_antes := jsonb_build_object(
    'socio_eliminado', to_jsonb(v_socio),
    'patrocinador_receptor', to_jsonb(v_patrocinador),
    'motivo', trim(p_motivo),
    'frontales_ids', v_frontales_ids,
    'descendientes_subarbol_ids', v_descendientes_ids,
    'ordenes_ids', v_orden_ids
  );

  -- 8. Reenganche de frontales directos hacia el patrocinador superior si tuviera
  IF cardinality(v_frontales_ids) > 0 THEN
    UPDATE public.socio
       SET patrocinador_id = v_socio.patrocinador_id,
           actualizado_en = now()
     WHERE patrocinador_id = p_socio_id;

    GET DIAGNOSTICS v_frontales_movidos = ROW_COUNT;
  END IF;

  -- 9. Reconstrucción de red_ancestro
  DELETE FROM public.red_ancestro
   WHERE descendiente_id = p_socio_id
      OR ancestro_id = p_socio_id
      OR (cardinality(v_descendientes_ids) > 0 AND descendiente_id = ANY(v_descendientes_ids));

  IF cardinality(v_descendientes_ids) > 0 THEN
    WITH RECURSIVE cadena AS (
      SELECT 
        s.id AS desc_id,
        s.patrocinador_id AS anc_id,
        1::smallint AS lvl
      FROM public.socio s
      WHERE s.id = ANY(v_descendientes_ids)
        AND s.patrocinador_id IS NOT NULL

      UNION ALL

      SELECT 
        c.desc_id,
        p.patrocinador_id AS anc_id,
        (c.lvl + 1)::smallint AS lvl
      FROM cadena c
      JOIN public.socio p ON p.id = c.anc_id
      WHERE p.patrocinador_id IS NOT NULL
        AND c.lvl + 1 <= 50
    )
    INSERT INTO public.red_ancestro (descendiente_id, ancestro_id, nivel)
    SELECT desc_id, anc_id, lvl
    FROM cadena
    WHERE anc_id <> p_socio_id
    ON CONFLICT (descendiente_id, ancestro_id) DO UPDATE
    SET nivel = EXCLUDED.nivel;

    GET DIAGNOSTICS v_filas_ancestro_insertadas = ROW_COUNT;
  END IF;

  -- 9.5 Eliminar movimientos de wallet vinculados a comisiones del socio o de sus órdenes (TAREA-51)
  DELETE FROM public.wallet_movimiento
   WHERE comision_id IN (
     SELECT id FROM public.comision
      WHERE beneficiario_id = p_socio_id
         OR generador_id = p_socio_id
         OR (cardinality(v_orden_ids) > 0 AND orden_id = ANY(v_orden_ids))
   );
  DELETE FROM public.wallet_movimiento WHERE socio_id = p_socio_id;

  -- 10. Eliminar comisiones del ciclo abierto (beneficiario o generador)
  DELETE FROM public.comision
   WHERE beneficiario_id = p_socio_id
      OR generador_id = p_socio_id
      OR (cardinality(v_orden_ids) > 0 AND orden_id = ANY(v_orden_ids));

  GET DIAGNOSTICS v_comisiones_borradas = ROW_COUNT;

  -- 11. Eliminar activaciones y puntos
  DELETE FROM public.activacion WHERE socio_id = p_socio_id;
  DELETE FROM public.movimiento_puntos WHERE socio_id = p_socio_id;
  DELETE FROM public.solicitud_retiro WHERE socio_id = p_socio_id;

  -- 12. Eliminar vouchers y órdenes
  IF cardinality(v_orden_ids) > 0 THEN
    DELETE FROM public.voucher WHERE orden_id = ANY(v_orden_ids);
    DELETE FROM public.orden WHERE id = ANY(v_orden_ids);
    GET DIAGNOSTICS v_ordenes_borradas = ROW_COUNT;
  END IF;

  -- 13. Desvincular en solicitud_afiliacion
  UPDATE public.solicitud_afiliacion
     SET socio_id = NULL
   WHERE socio_id = p_socio_id;

  UPDATE public.solicitud_afiliacion
     SET patrocinador_id = v_socio.patrocinador_id
   WHERE patrocinador_id = p_socio_id;

  -- 14. Eliminar cuenta de auth.users y auth.identities
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(v_socio.email));

  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 15. Eliminar la fila del socio físicamente
  DELETE FROM public.socio WHERE id = p_socio_id;

  -- 16. Auditoría
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
    'eliminar_socio',
    'socio',
    p_socio_id,
    v_datos_antes,
    jsonb_build_object(
      'socio_id', p_socio_id,
      'codigo', v_socio.codigo,
      'accion', 'eliminacion_definitiva',
      'frontales_movidos', v_frontales_movidos,
      'ordenes_borradas', v_ordenes_borradas,
      'comisiones_borradas', v_comisiones_borradas
    ),
    now()
  );

  RETURN jsonb_build_object(
    'exito', true,
    'codigo', 'OK',
    'mensaje', 'Socio eliminado definitivamente y red reenganchada.',
    'socio_id', p_socio_id,
    'socio_codigo', v_socio.codigo,
    'frontales_movidos', v_frontales_movidos,
    'ordenes_borradas', v_ordenes_borradas,
    'comisiones_borradas', v_comisiones_borradas
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_vista_previa_eliminar_socio(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_eliminar_socio_definitivo(bigint, text, bigint) TO authenticated, service_role;
