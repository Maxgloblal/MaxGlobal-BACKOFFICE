-- ============================================================================
-- TAREA-17 · BAJA DE SOCIO CON REENGANCHE DE RED
-- 1. Función de Vista Previa en Seco: fn_vista_previa_baja_socio
-- 2. Función Atómica de Ejecución: fn_dar_de_baja_socio
-- ============================================================================

-- 1. VISTA PREVIA EN SECO
CREATE OR REPLACE FUNCTION public.fn_vista_previa_baja_socio(p_socio_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_socio record;
  v_patrocinador_id bigint := NULL;
  v_patrocinador_codigo text := NULL;
  v_patrocinador_nombres text := NULL;
  v_patrocinador_apellidos text := NULL;
  v_patrocinador_estado text := NULL;
  v_frontales jsonb;
  v_frontales_count integer := 0;
  v_descendencia_total integer := 0;
  v_profundidad integer := 0;
  v_comisiones_cent bigint := 0;
  v_saldo_billetera_cent bigint := 0;
  v_es_raiz boolean := false;
  v_puede_dar_baja boolean := true;
  v_motivo_bloqueo text := NULL;
BEGIN
  -- 1. Validar permisos de administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para consultar la vista previa de baja.';
  END IF;

  -- 2. Obtener datos del socio
  SELECT id, codigo, nombres, apellidos, documento, estado, patrocinador_id
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

  -- 3. Validar si es raíz o ya está en baja
  IF v_socio.patrocinador_id IS NULL THEN
    v_es_raiz := true;
    v_puede_dar_baja := false;
    v_motivo_bloqueo := 'El socio es la raíz de la red (no tiene patrocinador). Su red no tiene a dónde subir y no puede darse de baja.';
  ELSIF v_socio.estado = 'baja' THEN
    v_puede_dar_baja := false;
    v_motivo_bloqueo := 'El socio ya se encuentra en estado de baja.';
  END IF;

  -- 4. Obtener datos del patrocinador receptor si existe
  IF v_socio.patrocinador_id IS NOT NULL THEN
    SELECT id, codigo, nombres, apellidos, estado
    INTO v_patrocinador_id, v_patrocinador_codigo, v_patrocinador_nombres, v_patrocinador_apellidos, v_patrocinador_estado
    FROM public.socio
    WHERE id = v_socio.patrocinador_id;
  END IF;

  -- 5. Obtener frontales directos
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'codigo', codigo,
        'nombres', nombres,
        'apellidos', apellidos,
        'estado', estado
      ) ORDER BY id
    ), '[]'::jsonb),
    COUNT(*)
  INTO v_frontales, v_frontales_count
  FROM public.socio
  WHERE patrocinador_id = p_socio_id;

  -- 6. Obtener métricas del subárbol desde red_ancestro
  SELECT 
    COUNT(*),
    COALESCE(MAX(nivel), 0)
  INTO v_descendencia_total, v_profundidad
  FROM public.red_ancestro
  WHERE ancestro_id = p_socio_id;

  -- 7. Histórico financiero: comisiones que ya cobró
  SELECT COALESCE(SUM(monto_cent), 0)
  INTO v_comisiones_cent
  FROM public.comision
  WHERE beneficiario_id = p_socio_id;

  -- 8. Saldo actual en su billetera
  SELECT COALESCE(SUM(monto_cent), 0)
  INTO v_saldo_billetera_cent
  FROM public.wallet_movimiento
  WHERE socio_id = p_socio_id;

  -- 9. Retornar vista previa sin modificar ningún dato
  RETURN jsonb_build_object(
    'exito', true,
    'socio', jsonb_build_object(
      'id', v_socio.id,
      'codigo', v_socio.codigo,
      'nombres', v_socio.nombres,
      'apellidos', v_socio.apellidos,
      'documento', v_socio.documento,
      'estado', v_socio.estado,
      'patrocinador_id', v_socio.patrocinador_id
    ),
    'es_raiz', v_es_raiz,
    'puede_dar_baja', v_puede_dar_baja,
    'motivo_bloqueo', v_motivo_bloqueo,
    'patrocinador', CASE WHEN v_patrocinador_id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_patrocinador_id,
        'codigo', v_patrocinador_codigo,
        'nombres', v_patrocinador_nombres,
        'apellidos', v_patrocinador_apellidos,
        'estado', v_patrocinador_estado
      ) ELSE NULL END,
    'frontales_count', v_frontales_count,
    'frontales', v_frontales,
    'descendencia_total', v_descendencia_total,
    'profundidad_subarbol', v_profundidad,
    'total_cobrado_cent', v_comisiones_cent,
    'saldo_disponible_cent', v_saldo_billetera_cent,
    'comisiones_cent', v_comisiones_cent,
    'saldo_billetera_cent', v_saldo_billetera_cent
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_vista_previa_baja_socio(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_vista_previa_baja_socio(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_vista_previa_baja_socio(bigint) TO authenticated, service_role;


-- 2. FUNCIÓN ATÓMICA DE BAJA Y REENGANCHE
CREATE OR REPLACE FUNCTION public.fn_dar_de_baja_socio(
  p_socio_id bigint,
  p_motivo text,
  p_admin_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint := p_admin_id;
  v_socio record;
  v_patrocinador record;
  v_frontales_ids bigint[] := ARRAY[]::bigint[];
  v_descendientes_ids bigint[] := ARRAY[]::bigint[];
  v_frontales_movidos integer := 0;
  v_filas_ancestro_insertadas integer := 0;
  v_datos_antes jsonb;
  v_datos_despues jsonb;
BEGIN
  -- 1. Validar permisos de administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para dar de baja a un socio.';
  END IF;

  -- 2. Validar que el motivo no esté vacío (Regla S-4)
  IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
    RAISE EXCEPTION 'El motivo de la baja es obligatorio (regla S-4).';
  END IF;

  -- 3. Identificar al administrador que ejecuta la acción
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

  -- 4. Validar y bloquear la fila del socio a dar de baja
  SELECT id, codigo, nombres, apellidos, documento, estado, patrocinador_id
  INTO v_socio
  FROM public.socio
  WHERE id = p_socio_id
  FOR UPDATE;

  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'El socio con ID % no existe.', p_socio_id;
  END IF;

  IF v_socio.patrocinador_id IS NULL THEN
    RAISE EXCEPTION 'No se puede dar de baja al socio raíz (sin patrocinador). Su descendencia no tiene a dónde subir.';
  END IF;

  IF v_socio.estado = 'baja' THEN
    RAISE EXCEPTION 'El socio con código % ya se encuentra en estado de baja.', v_socio.codigo;
  END IF;

  -- Obtener patrocinador receptor
  SELECT id, codigo, nombres, apellidos, estado
  INTO v_patrocinador
  FROM public.socio
  WHERE id = v_socio.patrocinador_id;

  -- 5. Identificar el subárbol completo y los frontales directos
  SELECT COALESCE(array_agg(id ORDER BY id ASC), ARRAY[]::bigint[])
  INTO v_frontales_ids
  FROM public.socio
  WHERE patrocinador_id = p_socio_id;

  SELECT COALESCE(array_agg(descendiente_id ORDER BY nivel ASC), ARRAY[]::bigint[])
  INTO v_descendientes_ids
  FROM public.red_ancestro
  WHERE ancestro_id = p_socio_id;

  -- 6. AUDITORÍA: Capturar la estructura previa completa en jsonb
  SELECT jsonb_build_object(
    'socio_baja', jsonb_build_object(
      'id', v_socio.id,
      'codigo', v_socio.codigo,
      'nombres', v_socio.nombres,
      'apellidos', v_socio.apellidos,
      'documento', v_socio.documento,
      'estado', v_socio.estado,
      'patrocinador_id', v_socio.patrocinador_id
    ),
    'patrocinador_receptor', jsonb_build_object(
      'id', v_patrocinador.id,
      'codigo', v_patrocinador.codigo,
      'nombres', v_patrocinador.nombres,
      'apellidos', v_patrocinador.apellidos
    ),
    'motivo', trim(p_motivo),
    'frontales_ids', v_frontales_ids,
    'descendientes_subarbol_ids', v_descendientes_ids,
    'red_ancestro_previa', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'descendiente_id', ra.descendiente_id,
          'ancestro_id', ra.ancestro_id,
          'nivel', ra.nivel
        )
      ), '[]'::jsonb)
      FROM public.red_ancestro ra
      WHERE ra.descendiente_id = p_socio_id
         OR ra.ancestro_id = p_socio_id
         OR (cardinality(v_descendientes_ids) > 0 AND ra.descendiente_id = ANY(v_descendientes_ids))
    )
  ) INTO v_datos_antes;

  -- 7. REENGANCHE DE RED: Mover a los frontales directos hacia el patrocinador receptor
  IF cardinality(v_frontales_ids) > 0 THEN
    UPDATE public.socio
       SET patrocinador_id = v_socio.patrocinador_id,
           actualizado_en = now()
     WHERE patrocinador_id = p_socio_id;

    GET DIAGNOSTICS v_frontales_movidos = ROW_COUNT;
  END IF;

  -- 8. Actualizar estado del socio dado de baja (conservando su patrocinador_id para trazabilidad)
  UPDATE public.socio
     SET estado = 'baja',
         actualizado_en = now()
   WHERE id = p_socio_id;

  -- 9. RECONSTRUCCIÓN DE red_ancestro DEL SUBÁRBOL COMPLETO
  -- a. Borrar filas de red_ancestro del socio dado de baja y de todos sus descendientes
  DELETE FROM public.red_ancestro
   WHERE descendiente_id = p_socio_id
      OR ancestro_id = p_socio_id
      OR (cardinality(v_descendientes_ids) > 0 AND descendiente_id = ANY(v_descendientes_ids));

  -- b. Reinsertar la jerarquía de ancestros limpia para cada descendiente del subárbol
  IF cardinality(v_descendientes_ids) > 0 THEN
    WITH RECURSIVE cadena AS (
      -- Nivel 1: El nuevo patrocinador directo
      SELECT 
        s.id AS desc_id,
        s.patrocinador_id AS anc_id,
        1::smallint AS lvl
      FROM public.socio s
      WHERE s.id = ANY(v_descendientes_ids)
        AND s.patrocinador_id IS NOT NULL

      UNION ALL

      -- Subir por la cadena de patrocinio ascendente
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

  -- 10. AUDITORÍA: Guardar datos_despues e insertar en auditoria
  v_datos_despues := jsonb_build_object(
    'socio_id', p_socio_id,
    'nuevo_estado', 'baja',
    'nuevo_patrocinador_frontales_id', v_socio.patrocinador_id,
    'frontales_movidos', v_frontales_movidos,
    'descendientes_reconstruidos', cardinality(v_descendientes_ids),
    'filas_ancestro_insertadas', v_filas_ancestro_insertadas
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
    'baja_con_reenganche',
    'socio',
    p_socio_id,
    v_datos_antes,
    v_datos_despues,
    now()
  );

  -- 11. Devolver resumen de la operación atómica
  RETURN jsonb_build_object(
    'exito', true,
    'codigo', 'OK',
    'mensaje', 'Socio dado de baja y red reenganchada exitosamente.',
    'socio_id', p_socio_id,
    'socio_codigo', v_socio.codigo,
    'nuevo_patrocinador_id', v_socio.patrocinador_id,
    'frontales_movidos', v_frontales_movidos,
    'descendientes_reconstruidos', cardinality(v_descendientes_ids),
    'filas_red_ancestro_insertadas', v_filas_ancestro_insertadas
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_dar_de_baja_socio(bigint, text, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_dar_de_baja_socio(bigint, text, bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_dar_de_baja_socio(bigint, text, bigint) TO authenticated, service_role;
