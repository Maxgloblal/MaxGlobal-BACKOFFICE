-- ============================================================================
-- TAREA-66 · SINCRONIZACIÓN DE RANGO EN VIVO, META DINÁMICA Y CIERRE CONTABLE
-- 1. fn_rango_lineas_socio: cálculo reactivo de rango alcanzado en vivo
-- 2. fn_calcular_y_persistir_rangos: persistencia del cierre contable con tope exclusivo a línea mayor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FN_RANGO_LINEAS_SOCIO (Consultas en vivo / P-15 / Armazón)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_rango_lineas_socio(p_socio_id bigint, p_ciclo_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rango_ciclo record;
  v_rango_ciclo_json jsonb;
  v_rango_ciclo_anterior record;
  v_rango_honorifico record;
  v_rango_alcanzado_en_vivo public.rango%ROWTYPE;
  v_rango_siguiente public.rango%ROWTYPE;
  v_lineas jsonb := '[]'::jsonb;
  v_rangos_escala jsonb := '[]'::jsonb;
  v_puntos_evaluar integer := 500;
  v_tope_linea integer := 250;
  v_linea_estirada_pct numeric := 50;
  v_puntos_min_activacion integer := 70;
  v_activo_personal boolean := false;
  v_puntos_personales integer := 0;
  v_frontales_activos integer := 0;
  v_puntos_grupales integer := 0;
  v_puntos_mayor integer := 0;
  v_puntos_resto integer := 0;
  v_r record;
  v_computable_temp integer;
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

  -- 2. Cargar parámetros del sistema
  BEGIN
    SELECT COALESCE(valor::numeric, 50) INTO v_linea_estirada_pct
    FROM public.config WHERE clave = 'linea_estirada_pct';
  EXCEPTION WHEN OTHERS THEN
    v_linea_estirada_pct := 50;
  END;

  BEGIN
    SELECT COALESCE(valor::integer, 70) INTO v_puntos_min_activacion
    FROM public.config WHERE clave = 'activacion_puntos_mes';
  EXCEPTION WHEN OTHERS THEN
    v_puntos_min_activacion := 70;
  END;

  -- 3. Obtener activación personal del socio en el ciclo
  SELECT
    COALESCE(puntos_personales, 0),
    (COALESCE(activo, false) OR COALESCE(puntos_personales, 0) >= v_puntos_min_activacion)
  INTO v_puntos_personales, v_activo_personal
  FROM public.activacion
  WHERE socio_id = p_socio_id AND ciclo_id = p_ciclo_id;

  -- 4. Obtener rango_ciclo actual (si el ciclo ya fue cerrado previamente)
  SELECT rc.*, r.nombre AS rango_nombre, r.codigo AS rango_codigo, r.orden AS rango_orden,
         r.puntos_grupales AS rango_puntos_req, r.frontales_activos AS rango_frontales_req
  INTO v_rango_ciclo
  FROM public.rango_ciclo rc
  LEFT JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.ciclo_id = p_ciclo_id;

  -- 4.1 Obtener rango_ciclo del ciclo anterior
  SELECT rc.*, r.nombre AS rango_nombre, r.codigo AS rango_codigo, r.orden AS rango_orden,
         r.puntos_grupales AS rango_puntos_req, r.frontales_activos AS rango_frontales_req
  INTO v_rango_ciclo_anterior
  FROM public.rango_ciclo rc
  LEFT JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.ciclo_id = (p_ciclo_id - 1);

  -- 4.2 Rango honorífico máximo calificado históricamente
  SELECT r.* INTO v_rango_honorifico
  FROM public.rango_ciclo rc
  JOIN public.rango r ON r.id = rc.rango_id
  WHERE rc.socio_id = p_socio_id AND rc.califica = true
  ORDER BY r.orden DESC
  LIMIT 1;

  -- 5. Calcular totales consolidados de ramas frontales
  WITH ramas_base AS (
    SELECT
      f.id AS frontal_id,
      (COALESCE(act.activo, false) OR COALESCE(act.puntos_personales, 0) >= v_puntos_min_activacion) AS activo,
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
    GROUP BY f.id, act.activo, act.puntos_personales
  )
  SELECT
    COALESCE(SUM(puntos_totales_rama), 0),
    COALESCE(MAX(puntos_totales_rama), 0),
    COALESCE(SUM(puntos_totales_rama) - MAX(puntos_totales_rama), 0),
    COALESCE(COUNT(*) FILTER (WHERE activo = true), 0)
  INTO v_puntos_grupales, v_puntos_mayor, v_puntos_resto, v_frontales_activos
  FROM ramas_base;

  -- 6. EVALUACIÓN DINÁMICA DE RANGO EN VIVO (Ciclo Abierto)
  v_rango_alcanzado_en_vivo.id := NULL;

  FOR v_r IN
    SELECT * FROM public.rango
    WHERE activo = true AND definido = true AND puntos_grupales IS NOT NULL AND frontales_activos IS NOT NULL
    ORDER BY orden DESC
  LOOP
    v_tope_linea := FLOOR((v_r.puntos_grupales * v_linea_estirada_pct) / 100);
    v_computable_temp := LEAST(v_puntos_mayor, v_tope_linea) + v_puntos_resto;

    IF v_computable_temp >= v_r.puntos_grupales AND v_frontales_activos >= v_r.frontales_activos THEN
      v_rango_alcanzado_en_vivo := v_r;
      EXIT; -- Rango más alto conquistado hoy
    END IF;
  END LOOP;

  -- Determinar Rango Siguiente (Meta Real)
  IF v_rango_alcanzado_en_vivo.id IS NOT NULL THEN
    -- Siguiente escalón sobre lo ya alcanzado hoy
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = v_rango_alcanzado_en_vivo.orden + 1 AND definido = true;
  ELSIF v_rango_honorifico.id IS NOT NULL THEN
    -- Si aún no califica en este ciclo pero tiene honorífico previo
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = v_rango_honorifico.orden + 1 AND definido = true;
  ELSE
    -- Nuevo socio: su primera meta es Jade
    SELECT * INTO v_rango_siguiente
    FROM public.rango
    WHERE orden = 1 AND definido = true;
  END IF;

  -- Fallback de seguridad si llegó al rango máximo
  IF v_rango_siguiente.id IS NULL THEN
    IF v_rango_alcanzado_en_vivo.id IS NOT NULL THEN
      v_rango_siguiente := v_rango_alcanzado_en_vivo;
    ELSE
      SELECT * INTO v_rango_siguiente FROM public.rango WHERE orden = 1 AND definido = true;
    END IF;
  END IF;

  v_puntos_evaluar := v_rango_siguiente.puntos_grupales;
  v_tope_linea := FLOOR((v_puntos_evaluar * v_linea_estirada_pct) / 100);

  -- 7. Armar desglose línea por línea con tope respecto a v_rango_siguiente
  WITH ramas_detalladas AS (
    SELECT
      f.id AS frontal_id,
      f.nombres || ' ' || f.apellidos AS frontal_nombre,
      f.codigo AS frontal_codigo,
      (COALESCE(act.activo, false) OR COALESCE(act.puntos_personales, 0) >= v_puntos_min_activacion) AS activo,
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
    GROUP BY f.id, f.nombres, f.apellidos, f.codigo, act.activo, act.puntos_personales
  ),
  ramas_ordenadas AS (
    SELECT
      r.*,
      ROW_NUMBER() OVER (ORDER BY r.puntos_totales_rama DESC, r.frontal_id ASC) AS rn
    FROM ramas_detalladas r
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'frontal_id', r.frontal_id,
      'frontal_nombre', r.frontal_nombre,
      'frontal_codigo', r.frontal_codigo,
      'activo', r.activo,
      'puntos_totales_rama', r.puntos_totales_rama,
      'puntos_computados', CASE WHEN r.rn = 1 THEN LEAST(r.puntos_totales_rama, v_tope_linea) ELSE r.puntos_totales_rama END,
      'tope_alcanzado', (r.rn = 1 AND r.puntos_totales_rama > v_tope_linea),
      'es_linea_mayor', (r.rn = 1),
      'tope_maximo_linea', v_tope_linea
    ) ORDER BY r.puntos_totales_rama DESC, r.frontal_id ASC
  ), '[]'::jsonb)
  INTO v_lineas
  FROM ramas_ordenadas r;

  -- 8. Escala oficial de rangos
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

  -- 9. En ciclo abierto, enriquecer v_rango_ciclo con el cálculo en vivo como jsonb estructurado
  IF v_rango_ciclo.rango_id IS NULL AND v_rango_alcanzado_en_vivo.id IS NOT NULL THEN
    v_rango_ciclo_json := jsonb_build_object(
      'id', NULL,
      'socio_id', p_socio_id,
      'ciclo_id', p_ciclo_id,
      'rango_id', v_rango_alcanzado_en_vivo.id,
      'puntos_grupales', v_puntos_grupales,
      'puntos_linea_mayor', v_puntos_mayor,
      'puntos_computables', (LEAST(v_puntos_mayor, FLOOR((v_rango_alcanzado_en_vivo.puntos_grupales * v_linea_estirada_pct) / 100)) + v_puntos_resto),
      'frontales_activos', v_frontales_activos,
      'califica', v_activo_personal,
      'bono_cent', v_rango_alcanzado_en_vivo.bono_cent,
      'motivo_bono', CASE WHEN v_activo_personal THEN 'asciende' ELSE 'inactivo' END,
      'detalle', '{}'::jsonb,
      'calculado_en', now(),
      'rango_nombre', v_rango_alcanzado_en_vivo.nombre,
      'rango_codigo', v_rango_alcanzado_en_vivo.codigo,
      'rango_orden', v_rango_alcanzado_en_vivo.orden,
      'rango_puntos_req', v_rango_alcanzado_en_vivo.puntos_grupales,
      'rango_frontales_req', v_rango_alcanzado_en_vivo.frontales_activos
    );
  ELSE
    v_rango_ciclo_json := to_jsonb(v_rango_ciclo);
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'ciclo_id', p_ciclo_id,
    'rango_ciclo', v_rango_ciclo_json,
    'rango_ciclo_anterior', to_jsonb(v_rango_ciclo_anterior),
    'rango_honorifico', to_jsonb(v_rango_honorifico),
    'rango_alcanzado_en_vivo', to_jsonb(v_rango_alcanzado_en_vivo),
    'rango_siguiente', to_jsonb(v_rango_siguiente),
    'tope_linea_evaluado', v_tope_linea,
    'puntos_objetivo_evaluado', v_puntos_evaluar,
    'lineas', v_lineas,
    'rangos_escala', v_rangos_escala,
    'puntos_personales', v_puntos_personales,
    'activo', v_activo_personal
  );
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. FN_CALCULAR_Y_PERSISTIR_RANGOS (Cierre Contable Definitivo)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calcular_y_persistir_rangos(
  p_ciclo_id bigint,
  p_solo_calculo boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count_rc integer;
  v_count_com integer;
  v_total_existente_cent bigint;
  v_count_califican integer;
  v_linea_estirada_pct numeric := 50;
  v_rango record;
  v_socio record;
  v_rango_ant_orden integer;
  v_rango_ant_codigo text;
  v_califica boolean;
  v_bono_cent bigint;
  v_motivo_bono text;
  v_rango_calificado public.rango%ROWTYPE;
  v_computables_calificado integer;
  v_evaluados integer := 0;
  v_califican integer := 0;
  v_total_bono_cent bigint := 0;
  v_comisiones_creadas integer := 0;
  v_puntos_personales integer;
  v_activo boolean;
  v_puntos_grupales integer;
  v_puntos_linea_mayor integer;
  v_puntos_resto integer;
  v_frontales_activos integer;
  v_rango_menor public.rango%ROWTYPE;
  v_computable_ref integer;
  v_tope_linea integer;
  v_computable_rango integer;
  v_lista_comisiones jsonb := '[]'::jsonb;
  v_puntos_min_activacion integer := 70;
BEGIN
  -- 1. Validar permisos de administrador
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden calcular o persistir rangos.';
  END IF;

  IF p_ciclo_id IS NULL OR p_ciclo_id <= 0 THEN
    RAISE EXCEPTION 'cicloId inválido: %', p_ciclo_id;
  END IF;

  -- 2. Idempotencia y protección
  IF NOT p_solo_calculo THEN
    SELECT COUNT(*) INTO v_count_rc FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id;
    IF v_count_rc > 0 THEN
      SELECT COUNT(*) INTO v_count_califican FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id AND califica = true;
      SELECT COUNT(*), COALESCE(SUM(monto_cent), 0) INTO v_count_com, v_total_existente_cent
      FROM public.comision WHERE ciclo_id = p_ciclo_id AND tipo = 'rango';

      RETURN jsonb_build_object(
        'yaExistia', true,
        'evaluados', v_count_rc,
        'califican', v_count_califican,
        'totalBonoCent', v_total_existente_cent,
        'comisionesCreadas', v_count_com,
        'mensaje', 'Idempotencia: El ciclo ' || p_ciclo_id || ' ya cuenta con registros de rango previamente calculados.'
      );
    END IF;
  END IF;

  -- 3. Cargar configuración de línea estirada y umbral de activación
  BEGIN
    SELECT COALESCE(valor::numeric, 50) INTO v_linea_estirada_pct
    FROM public.config WHERE clave = 'linea_estirada_pct';
    IF v_linea_estirada_pct IS NULL OR v_linea_estirada_pct <= 0 THEN
      v_linea_estirada_pct := 50;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_linea_estirada_pct := 50;
  END;

  BEGIN
    SELECT COALESCE(valor::integer, 70) INTO v_puntos_min_activacion
    FROM public.config WHERE clave = 'activacion_puntos_mes';
    IF v_puntos_min_activacion IS NULL OR v_puntos_min_activacion <= 0 THEN
      v_puntos_min_activacion := 70;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_puntos_min_activacion := 70;
  END;

  -- Rango menor activo y definido para referencia de no calificados (Jade)
  SELECT * INTO v_rango_menor
  FROM public.rango
  WHERE activo = true AND definido = true AND puntos_grupales IS NOT NULL
  ORDER BY orden ASC
  LIMIT 1;

  -- 4. Evaluar a cada socio del padrón
  FOR v_socio IN SELECT id, codigo, nombres, apellidos FROM public.socio ORDER BY id ASC LOOP
    v_evaluados := v_evaluados + 1;

    -- Obtener activación del socio en el ciclo
    SELECT COALESCE(puntos_personales, 0), (COALESCE(activo, false) OR COALESCE(puntos_personales, 0) >= v_puntos_min_activacion)
    INTO v_puntos_personales, v_activo
    FROM public.activacion
    WHERE socio_id = v_socio.id AND ciclo_id = p_ciclo_id;

    IF NOT FOUND THEN
      v_puntos_personales := 0;
      v_activo := false;
    END IF;

    -- Métricas de ramas frontales del socio evaluado
    WITH ramas_socio AS (
      SELECT
        f.id AS frontal_id,
        (COALESCE(act.activo, false) OR COALESCE(act.puntos_personales, 0) >= v_puntos_min_activacion) AS activo,
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
      WHERE f.patrocinador_id = v_socio.id
      GROUP BY f.id, act.activo, act.puntos_personales
    )
    SELECT
      COALESCE(SUM(puntos_totales_rama), 0),
      COALESCE(MAX(puntos_totales_rama), 0),
      COALESCE(SUM(puntos_totales_rama) - MAX(puntos_totales_rama), 0),
      COALESCE(COUNT(*) FILTER (WHERE activo = true), 0)
    INTO v_puntos_grupales, v_puntos_linea_mayor, v_puntos_resto, v_frontales_activos
    FROM ramas_socio;

    v_rango_calificado.id := NULL;
    v_rango_calificado.orden := NULL;
    v_rango_calificado.codigo := NULL;
    v_rango_calificado.nombre := NULL;
    v_rango_calificado.bono_cent := NULL;
    v_rango_calificado.puntos_grupales := NULL;
    v_rango_calificado.frontales_activos := NULL;
    v_computables_calificado := 0;

    IF v_activo THEN
      -- Evaluar rangos de mayor a menor jerarquía
      FOR v_rango IN
        SELECT * FROM public.rango
        WHERE activo = true AND definido = true AND puntos_grupales IS NOT NULL AND frontales_activos IS NOT NULL
        ORDER BY orden DESC
      LOOP
        v_tope_linea := FLOOR((v_rango.puntos_grupales * v_linea_estirada_pct) / 100);
        
        -- RF-256: Tope aplicado EXCLUSIVAMENTE a la línea de mayor volumen
        v_computable_rango := LEAST(v_puntos_linea_mayor, v_tope_linea) + v_puntos_resto;

        IF v_computable_rango >= v_rango.puntos_grupales AND v_frontales_activos >= v_rango.frontales_activos THEN
          v_rango_calificado := v_rango;
          v_computables_calificado := v_computable_rango;
          EXIT; -- Rango más alto alcanzado
        END IF;
      END LOOP;
    END IF;

    -- Obtener rango del ciclo anterior
    SELECT rc.rango_id, r.orden, r.codigo
    INTO v_rango_ant_orden, v_rango_ant_orden, v_rango_ant_codigo
    FROM public.rango_ciclo rc
    JOIN public.rango r ON r.id = rc.rango_id
    WHERE rc.socio_id = v_socio.id AND rc.ciclo_id = (p_ciclo_id - 1);

    IF NOT FOUND THEN
      v_rango_ant_orden := NULL;
      v_rango_ant_codigo := NULL;
    END IF;

    -- Determinar cobro de bono y persistencia
    IF NOT v_activo THEN
      -- Inactivo
      v_tope_linea := FLOOR((COALESCE(v_rango_menor.puntos_grupales, 500) * v_linea_estirada_pct) / 100);
      v_computable_ref := LEAST(v_puntos_linea_mayor, v_tope_linea) + v_puntos_resto;

      IF NOT p_solo_calculo THEN
        INSERT INTO public.rango_ciclo (
          socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
          puntos_linea_mayor, puntos_computables, frontales_activos, califica,
          bono_cent, calculado_en
        ) VALUES (
          v_socio.id, p_ciclo_id, NULL, v_puntos_personales, v_puntos_grupales,
          v_puntos_linea_mayor, v_computable_ref, v_frontales_activos, false,
          0, now()
        );
      END IF;
    ELSIF v_rango_calificado.id IS NULL THEN
      -- No califica
      v_tope_linea := FLOOR((COALESCE(v_rango_menor.puntos_grupales, 500) * v_linea_estirada_pct) / 100);
      v_computable_ref := LEAST(v_puntos_linea_mayor, v_tope_linea) + v_puntos_resto;

      IF NOT p_solo_calculo THEN
        INSERT INTO public.rango_ciclo (
          socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
          puntos_linea_mayor, puntos_computables, frontales_activos, califica,
          bono_cent, calculado_en
        ) VALUES (
          v_socio.id, p_ciclo_id, NULL, v_puntos_personales, v_puntos_grupales,
          v_puntos_linea_mayor, v_computable_ref, v_frontales_activos, false,
          0, now()
        );
      END IF;
    ELSE
      -- Califica métricamente
      IF v_rango_ant_orden IS NULL THEN
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'primer_ciclo';
        v_califica := true;
      ELSIF v_rango_calificado.orden < v_rango_ant_orden THEN
        v_bono_cent := 0;
        v_motivo_bono := 'baja';
        v_califica := false;
      ELSIF v_rango_calificado.orden = v_rango_ant_orden THEN
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'mantiene';
        v_califica := true;
      ELSE
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'asciende';
        v_califica := true;
      END IF;

      IF NOT p_solo_calculo THEN
        INSERT INTO public.rango_ciclo (
          socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
          puntos_linea_mayor, puntos_computables, frontales_activos, califica,
          bono_cent, calculado_en
        ) VALUES (
          v_socio.id, p_ciclo_id, v_rango_calificado.id, v_puntos_personales, v_puntos_grupales,
          v_puntos_linea_mayor, v_computables_calificado, v_frontales_activos, v_califica,
          v_bono_cent, now()
        );
      END IF;

      IF v_califica THEN
        v_califican := v_califican + 1;
      END IF;

      IF v_bono_cent > 0 THEN
        v_total_bono_cent := v_total_bono_cent + v_bono_cent;
        v_comisiones_creadas := v_comisiones_creadas + 1;

        v_detalle_comision := jsonb_build_object(
          'motivo', 'calificado',
          'formula', 'Bono de rango ' || v_rango_calificado.codigo || ': ' || v_bono_cent || ' cent',
          'motivo_bono', v_motivo_bono,
          'rango_orden', v_rango_calificado.orden,
          'rango_codigo', v_rango_calificado.codigo,
          'rango_nombre', v_rango_calificado.nombre,
          'puntos_grupales', v_puntos_grupales,
          'frontales_activos', v_frontales_activos,
          'puntos_computables', v_computables_calificado,
          'puntos_linea_mayor', v_puntos_linea_mayor,
          'puntos_requeridos', v_rango_calificado.puntos_grupales,
          'frontales_requeridos', v_rango_calificado.frontales_activos,
          'bono_nominal_cent', v_rango_calificado.bono_cent,
          'rango_anterior_orden', v_rango_ant_orden,
          'motivo_pago', CASE 
            WHEN v_motivo_bono = 'baja' THEN 'Baja de rango respecto al ciclo anterior: bono = 0'
            ELSE 'Calificación válida (' || v_motivo_bono || '): bono = ' || v_bono_cent || ' cent'
          END
        );

        v_lista_comisiones := v_lista_comisiones || jsonb_build_object(
          'beneficiario_id', v_socio.id,
          'socio_codigo', v_socio.codigo,
          'socio_nombre', v_socio.nombres || ' ' || v_socio.apellidos,
          'tipo', 'rango',
          'monto_cent', v_bono_cent,
          'rango_codigo', v_rango_calificado.codigo,
          'rango_nombre', v_rango_calificado.nombre,
          'rango_orden', v_rango_calificado.orden,
          'motivo_bono', v_motivo_bono,
          'puntos_computables', v_computables_calificado,
          'puntos_grupales', v_puntos_grupales,
          'frontales_activos', v_frontales_activos,
          'detalle', v_detalle_comision
        );

        IF NOT p_solo_calculo THEN
          INSERT INTO public.comision (
            ciclo_id, beneficiario_id, generador_id, orden_id,
            tipo, nivel, base_cent, base_puntos, porcentaje,
            monto_cent, estado, detalle, creado_en
          ) VALUES (
            p_ciclo_id, v_socio.id, NULL, NULL,
            'rango', NULL, v_computables_calificado * 100, v_computables_calificado, NULL,
            v_bono_cent, 'confirmada', v_detalle_comision, now()
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'exito', true,
    'ciclo_id', p_ciclo_id,
    'soloCalculo', p_solo_calculo,
    'evaluados', v_evaluados,
    'califican', v_califican,
    'totalBonoCent', v_total_bono_cent,
    'comisionesCreadas', v_comisiones_creadas,
    'comisiones', v_lista_comisiones
  );
END;
$$;
