-- =====================================================================
-- MAX GLOBAL CORPORATION · TAREA-07: DESGLOSE DE COMISIONES DEL SOCIO
-- Fecha original: 2026-09-02
-- Rescatado para TAREA-35 (Hallazgo 1)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_desglose_comisiones_socio(
  p_socio_id bigint,
  p_ciclo_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_socio record;
  v_activacion record;
  v_pack record;
  v_resumen jsonb;
  v_items jsonb := '[]'::jsonb;
  v_total_cobrado_cent bigint := 0;
  v_total_patrocinio_cent bigint := 0;
  v_total_residual_cent bigint := 0;
  v_total_rango_cent bigint := 0;
  v_total_comisiones_count integer := 0;
BEGIN
  -- 1. Control de acceso RLS / Ley 29733
  IF auth.jwt() IS NOT NULL AND NOT public.fn_is_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.socio
      WHERE id = p_socio_id AND email = auth.jwt() ->> 'email'
    ) THEN
      RAISE EXCEPTION 'No autorizado: solo puedes consultar tus propias comisiones.';
    END IF;
  END IF;

  -- 2. Obtener datos del socio y su pack
  SELECT s.*, p.codigo AS pack_codigo, p.nombre AS pack_nombre,
         p.niveles_patrocinio, p.niveles_residual, p.aplica_bono_global
  INTO v_socio
  FROM public.socio s
  JOIN public.pack p ON p.id = s.pack_id
  WHERE s.id = p_socio_id;

  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'Socio con ID % no encontrado.', p_socio_id;
  END IF;

  -- 3. Obtener estado de activación en el ciclo
  SELECT * INTO v_activacion
  FROM public.activacion
  WHERE socio_id = p_socio_id AND ciclo_id = p_ciclo_id;

  -- 4. Construir lista de comisiones e ítems explicativos
  -- a) Comisiones pagadas reales en el ciclo
  WITH pagadas AS (
    SELECT
      c.id AS comision_id,
      c.orden_id,
      o.codigo AS orden_codigo,
      o.creada_en AS orden_fecha,
      o.tipo AS orden_tipo,
      c.tipo AS tipo_bono,
      c.generador_id,
      gen.nombres || ' ' || gen.apellidos AS generador_nombre,
      gen.codigo AS generador_codigo,
      c.nivel,
      c.porcentaje,
      c.base_cent,
      c.base_puntos,
      c.monto_cent,
      true AS pagado,
      'Pagado exitosamente' AS motivo,
      c.detalle
    FROM public.comision c
    LEFT JOIN public.orden o ON o.id = c.orden_id
    LEFT JOIN public.socio gen ON gen.id = c.generador_id
    WHERE c.beneficiario_id = p_socio_id
      AND c.ciclo_id = p_ciclo_id
  ),
  -- b) Órdenes de la red en ese ciclo que NO generaron comisión para este socio
  no_pagadas AS (
    SELECT
      NULL::bigint AS comision_id,
      o.id AS orden_id,
      o.codigo AS orden_codigo,
      o.creada_en AS orden_fecha,
      o.tipo AS orden_tipo,
      CASE WHEN o.tipo = 'afiliacion' THEN 'patrocinio' ELSE 'residual' END AS tipo_bono,
      o.socio_id AS generador_id,
      gen.nombres || ' ' || gen.apellidos AS generador_nombre,
      gen.codigo AS generador_codigo,
      ra.nivel::integer AS nivel,
      nc.porcentaje,
      o.total_cent AS base_cent,
      o.puntos_total AS base_puntos,
      0::bigint AS monto_cent,
      false AS pagado,
      CASE
        WHEN o.tipo = 'afiliacion' AND ra.nivel > v_socio.niveles_patrocinio THEN
          'No cobrado · tu pack ' || v_socio.pack_nombre || ' habilita hasta el nivel ' || v_socio.niveles_patrocinio
        WHEN o.tipo = 'recompra' AND ra.nivel > v_socio.niveles_residual THEN
          'No cobrado · tu pack ' || v_socio.pack_nombre || ' habilita hasta el nivel ' || v_socio.niveles_residual
        WHEN COALESCE(v_activacion.activo, false) = false THEN
          'No cobrado · no estabas activo este ciclo (se requieren 70 pts)'
        ELSE
          'No cobrado · fuera de escala o regla de negocio'
      END AS motivo,
      jsonb_build_object(
        'motivo_codigo',
        CASE
          WHEN (o.tipo = 'afiliacion' AND ra.nivel > v_socio.niveles_patrocinio)
            OR (o.tipo = 'recompra' AND ra.nivel > v_socio.niveles_residual) THEN 'PACK_NIVEL_LIMITE'
          WHEN COALESCE(v_activacion.activo, false) = false THEN 'SOCIO_INACTIVO'
          ELSE 'FUERA_DE_ESCALA'
        END,
        'puntos_orden', o.puntos_total,
        'pack_socio', v_socio.pack_nombre
      ) AS detalle
    FROM public.red_ancestro ra
    JOIN public.orden o ON o.socio_id = ra.descendiente_id
    JOIN public.socio gen ON gen.id = o.socio_id
    LEFT JOIN public.nivel_comision nc ON nc.tipo = (CASE WHEN o.tipo = 'afiliacion' THEN 'patrocinio' ELSE 'residual' END) AND nc.nivel = ra.nivel
    WHERE ra.ancestro_id = p_socio_id
      AND o.ciclo_id = p_ciclo_id
      AND o.estado IN ('confirmada', 'pagada')
      AND ra.nivel <= 10
      AND NOT EXISTS (
        SELECT 1 FROM public.comision c
        WHERE c.beneficiario_id = p_socio_id
          AND c.orden_id = o.id
          AND c.tipo = (CASE WHEN o.tipo = 'afiliacion' THEN 'patrocinio' ELSE 'residual' END)
      )
  ),
  todo AS (
    SELECT * FROM pagadas
    UNION ALL
    SELECT * FROM no_pagadas
    ORDER BY pagado DESC, orden_fecha DESC, nivel ASC
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  INTO v_items
  FROM todo t;

  -- 5. Calcular totales
  SELECT
    COALESCE(SUM(monto_cent), 0),
    COALESCE(SUM(CASE WHEN tipo = 'patrocinio' THEN monto_cent ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'residual' THEN monto_cent ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'rango' THEN monto_cent ELSE 0 END), 0),
    COUNT(*)
  INTO
    v_total_cobrado_cent,
    v_total_patrocinio_cent,
    v_total_residual_cent,
    v_total_rango_cent,
    v_total_comisiones_count
  FROM public.comision
  WHERE beneficiario_id = p_socio_id
    AND ciclo_id = p_ciclo_id;

  v_resumen := jsonb_build_object(
    'socio_id', p_socio_id,
    'ciclo_id', p_ciclo_id,
    'socio_nombre', v_socio.nombres || ' ' || v_socio.apellidos,
    'socio_codigo', v_socio.codigo,
    'pack_codigo', v_socio.pack_codigo,
    'pack_nombre', v_socio.pack_nombre,
    'niveles_patrocinio', v_socio.niveles_patrocinio,
    'niveles_residual', v_socio.niveles_residual,
    'activo', COALESCE(v_activacion.activo, false),
    'puntos_personales', COALESCE(v_activacion.puntos_personales, 0),
    'total_cobrado_cent', v_total_cobrado_cent,
    'total_patrocinio_cent', v_total_patrocinio_cent,
    'total_residual_cent', v_total_residual_cent,
    'total_rango_cent', v_total_rango_cent,
    'comisiones_count', v_total_comisiones_count
  );

  RETURN jsonb_build_object(
    'exito', true,
    'resumen', v_resumen,
    'items', v_items
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_desglose_comisiones_socio(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_desglose_comisiones_socio(bigint, bigint) TO authenticated;
