-- =====================================================================
-- MAX GLOBAL CORPORATION · TAREA-12 / TAREA-13: RANGO Y LÍNEAS DEL SOCIO
-- Fecha original: 2026-09-04
-- Rescatado para TAREA-35 (Hallazgo 1)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_rango_lineas_socio(p_socio_id bigint, p_ciclo_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rango_ciclo record;
  v_rango_ciclo_anterior record;
  v_rango_honorifico record;
  v_rango_siguiente record;
  v_rango_objetivo record;
  v_lineas jsonb := '[]'::jsonb;
  v_rangos_escala jsonb := '[]'::jsonb;
  v_puntos_evaluar integer := 500;
  v_tope_linea integer := 250;
BEGIN
  -- 1. Control de acceso RLS / Ley 29733
  IF auth.jwt() IS NOT NULL AND NOT public.fn_is_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.socio
      WHERE id = p_socio_id AND email = auth.jwt() ->> 'email'
    ) THEN
      RAISE EXCEPTION 'No autorizado: solo puedes consultar tu propio rango.';
    END IF;
  END IF;

  -- 2. Obtener rango_ciclo actual
  SELECT rc.*, r.nombre AS rango_nombre, r.codigo AS rango_codigo, r.orden AS rango_orden,
         r.puntos_grupales AS rango_puntos_req, r.frontales_activos AS rango_frontales_req
  INTO v_rango_ciclo
  FROM public.rango_ciclo rc
  LEFT JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.ciclo_id = p_ciclo_id;

  -- 2.1 Obtener rango_ciclo del ciclo anterior (para detectar descenso de rango)
  SELECT rc.*, r.nombre AS rango_nombre, r.codigo AS rango_codigo, r.orden AS rango_orden,
         r.puntos_grupales AS rango_puntos_req, r.frontales_activos AS rango_frontales_req
  INTO v_rango_ciclo_anterior
  FROM public.rango_ciclo rc
  LEFT JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.ciclo_id = (p_ciclo_id - 1);

  -- 3. Rango honorífico máximo calificado
  SELECT r.* INTO v_rango_honorifico
  FROM public.rango_ciclo rc
  JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.califica = true
  ORDER BY r.orden DESC
  LIMIT 1;

  -- 4. Rango siguiente / objetivo
  IF v_rango_ciclo.rango_id IS NOT NULL AND v_rango_ciclo.califica THEN
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = v_rango_ciclo.rango_orden + 1 AND definido = true;
  ELSIF v_rango_ciclo.rango_id IS NOT NULL THEN
    -- Si alcanzó un rango pero no calificó (ej. bajó de rango), el siguiente es el siguiente nivel sobre el alcanzado
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = v_rango_ciclo.rango_orden + 1 AND definido = true;
  ELSE
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = 1 AND definido = true;
  END IF;

  -- Si v_rango_siguiente es nulo (ej. rango Diamante), usar el rango actual o Jade
  IF v_rango_siguiente.id IS NULL THEN
    SELECT * INTO v_rango_siguiente FROM public.rango WHERE orden = 1 AND definido = true;
  END IF;

  IF v_rango_siguiente.puntos_grupales IS NOT NULL THEN
    v_puntos_evaluar := v_rango_siguiente.puntos_grupales;
    v_tope_linea := v_puntos_evaluar / 2;
  END IF;

  -- 5. Frontales y puntos por rama
  WITH ramas AS (
    SELECT
      f.id AS frontal_id,
      f.nombres || ' ' || f.apellidos AS frontal_nombre,
      f.codigo AS frontal_codigo,
      COALESCE(act.activo, false) AS activo,
      COALESCE(SUM(o.puntos_total), 0)::integer AS puntos_totales_rama
    FROM public.socio f
    LEFT JOIN public.activacion act ON act.socio_id = f.id AND act.ciclo_id = p_ciclo_id
    LEFT JOIN (
      SELECT descendiente_id, ancestro_id FROM public.red_ancestro
      UNION ALL
      SELECT id AS descendiente_id, id AS ancestro_id FROM public.socio
    ) arbol ON arbol.ancestro_id = f.id
    LEFT JOIN public.orden o ON o.socio_id = arbol.descendiente_id
                            AND o.ciclo_id = p_ciclo_id
                            AND o.estado IN ('confirmada', 'pagada')
    WHERE f.patrocinador_id = p_socio_id
    GROUP BY f.id, f.nombres, f.apellidos, f.codigo, act.activo
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'frontal_id', r.frontal_id,
      'frontal_nombre', r.frontal_nombre,
      'frontal_codigo', r.frontal_codigo,
      'activo', r.activo,
      'puntos_totales_rama', r.puntos_totales_rama,
      'puntos_computados', LEAST(r.puntos_totales_rama, v_tope_linea),
      'tope_alcanzado', (r.puntos_totales_rama > v_tope_linea),
      'tope_maximo_linea', v_tope_linea
    ) ORDER BY r.puntos_totales_rama DESC
  ), '[]'::jsonb)
  INTO v_lineas
  FROM ramas r;

  -- 6. Escala completa de rangos
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'orden', r.orden,
      'codigo', r.codigo,
      'nombre', r.nombre,
      'puntos_grupales', r.puntos_grupales,
      'frontales_activos', r.frontales_activos,
      'bono_cent', r.bono_cent,
      'definido', r.definido
    ) ORDER BY r.orden ASC
  )
  INTO v_rangos_escala
  FROM public.rango r;

  RETURN jsonb_build_object(
    'exito', true,
    'ciclo_id', p_ciclo_id,
    'rango_ciclo', to_jsonb(v_rango_ciclo),
    'rango_ciclo_anterior', to_jsonb(v_rango_ciclo_anterior),
    'rango_honorifico', to_jsonb(v_rango_honorifico),
    'rango_siguiente', to_jsonb(v_rango_siguiente),
    'tope_linea_evaluado', v_tope_linea,
    'puntos_objetivo_evaluado', v_puntos_evaluar,
    'lineas', v_lineas,
    'rangos_escala', v_rangos_escala
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_rango_lineas_socio(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_rango_lineas_socio(bigint, bigint) TO authenticated;
