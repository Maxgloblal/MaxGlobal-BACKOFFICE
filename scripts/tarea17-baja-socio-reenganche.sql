-- ============================================================================
-- TAREA-17 · BAJA DE SOCIO CON REENGANCHE DE RED
-- 1. Función de Vista Previa en Seco: fn_vista_previa_baja_socio
-- ============================================================================

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
    'comisiones_cent', v_comisiones_cent,
    'saldo_billetera_cent', v_saldo_billetera_cent
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_vista_previa_baja_socio(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_vista_previa_baja_socio(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_vista_previa_baja_socio(bigint) TO authenticated, service_role;
