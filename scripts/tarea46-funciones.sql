-- =====================================================================
-- TAREA-46: UNIFICACIÓN DEL MOTOR DE BONO DE RANGO (SOLO CÁLCULO Y PERSISTENCIA)
-- =====================================================================

DROP FUNCTION IF EXISTS public.fn_calcular_y_persistir_rangos(bigint);

CREATE OR REPLACE FUNCTION public.fn_calcular_y_persistir_rangos(
  p_ciclo_id bigint,
  p_solo_calculo boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
  v_frontales_activos integer;
  v_rango_menor public.rango%ROWTYPE;
  v_computable_ref integer;
  v_tope_linea integer;
  v_computable_rango integer;
  v_detalle_comision jsonb;
  v_lista_comisiones jsonb := '[]'::jsonb;
BEGIN
  -- 1. Validar permisos de administrador
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden calcular o persistir rangos.';
  END IF;

  IF p_ciclo_id IS NULL OR p_ciclo_id <= 0 THEN
    RAISE EXCEPTION 'cicloId inválido: %', p_ciclo_id;
  END IF;

  -- 2. Validar IDEMPOTENCIA solo si se va a persistir (p_solo_calculo = false)
  IF NOT p_solo_calculo THEN
    SELECT count(*) INTO v_count_rc FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id;
    SELECT count(*), COALESCE(SUM(monto_cent), 0) INTO v_count_com, v_total_existente_cent
    FROM public.comision WHERE ciclo_id = p_ciclo_id AND tipo = 'rango';

    IF v_count_rc > 0 OR v_count_com > 0 THEN
      SELECT count(*) INTO v_count_califican FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id AND califica = true;
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

  -- 3. Cargar configuración de línea estirada
  BEGIN
    SELECT COALESCE(valor::numeric, 50) INTO v_linea_estirada_pct
    FROM public.config WHERE clave = 'linea_estirada_pct';
    IF v_linea_estirada_pct IS NULL OR v_linea_estirada_pct <= 0 THEN
      v_linea_estirada_pct := 50;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_linea_estirada_pct := 50;
  END;

  -- Rango menor activo y definido para referencia de no calificados (Jade)
  SELECT * INTO v_rango_menor
  FROM public.rango
  WHERE activo = true AND definido = true AND puntos_grupales IS NOT NULL
  ORDER BY orden ASC
  LIMIT 1;

  -- Tabla temporal de ramas frontales del ciclo para optimizar cálculo
  CREATE TEMP TABLE temp_ramas_ciclo ON COMMIT DROP AS
  SELECT
    f.patrocinador_id AS socio_id,
    f.id AS frontal_id,
    (COALESCE(act.activo, false) OR COALESCE(act.puntos_personales, 0) >= 70) AS activo,
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
  WHERE f.patrocinador_id IS NOT NULL
  GROUP BY f.patrocinador_id, f.id, act.activo, act.puntos_personales;

  CREATE INDEX ON temp_ramas_ciclo(socio_id);

  -- 4. Evaluar a cada socio del padrón
  FOR v_socio IN SELECT id, codigo, nombres, apellidos FROM public.socio ORDER BY id ASC LOOP
    v_evaluados := v_evaluados + 1;

    -- Obtener activación del socio en el ciclo
    SELECT COALESCE(puntos_personales, 0), (COALESCE(activo, false) OR COALESCE(puntos_personales, 0) >= 70)
    INTO v_puntos_personales, v_activo
    FROM public.activacion
    WHERE socio_id = v_socio.id AND ciclo_id = p_ciclo_id;

    IF NOT FOUND THEN
      v_puntos_personales := 0;
      v_activo := false;
    END IF;

    -- Métricas de ramas frontales
    SELECT
      COALESCE(SUM(puntos_totales_rama), 0),
      COALESCE(MAX(puntos_totales_rama), 0),
      COALESCE(COUNT(*) FILTER (WHERE activo = true), 0)
    INTO v_puntos_grupales, v_puntos_linea_mayor, v_frontales_activos
    FROM temp_ramas_ciclo
    WHERE socio_id = v_socio.id;

    v_rango_calificado := NULL;
    v_computables_calificado := 0;

    IF v_activo THEN
      -- Evaluar rangos de mayor a menor jerarquía
      FOR v_rango IN
        SELECT * FROM public.rango
        WHERE activo = true AND definido = true AND puntos_grupales IS NOT NULL AND frontales_activos IS NOT NULL
        ORDER BY orden DESC
      LOOP
        v_tope_linea := FLOOR((v_rango.puntos_grupales * v_linea_estirada_pct) / 100);
        
        SELECT COALESCE(SUM(LEAST(puntos_totales_rama, v_tope_linea)), 0)
        INTO v_computable_rango
        FROM temp_ramas_ciclo
        WHERE socio_id = v_socio.id;

        IF v_computable_rango >= v_rango.puntos_grupales AND v_frontales_activos >= v_rango.frontales_activos THEN
          v_rango_calificado := v_rango;
          v_computables_calificado := v_computable_rango;
          EXIT; -- Rango más alto alcanzado
        END IF;
      END LOOP;
    END IF;

    -- Rango del ciclo anterior para detectar ascensos, mantenimiento o descensos
    v_rango_ant_orden := NULL;
    v_rango_ant_codigo := NULL;

    SELECT r.orden, r.codigo
    INTO v_rango_ant_orden, v_rango_ant_codigo
    FROM public.rango_ciclo rc
    JOIN public.rango r ON r.id = rc.rango_id
    WHERE rc.socio_id = v_socio.id AND rc.ciclo_id = (p_ciclo_id - 1);

    IF NOT v_activo THEN
      -- Inactivo en el ciclo: no califica a rango ni genera comisión
      v_tope_linea := CASE WHEN v_rango_menor.id IS NOT NULL THEN FLOOR((v_rango_menor.puntos_grupales * v_linea_estirada_pct) / 100) ELSE 250 END;
      SELECT COALESCE(SUM(LEAST(puntos_totales_rama, v_tope_linea)), 0) INTO v_computable_ref FROM temp_ramas_ciclo WHERE socio_id = v_socio.id;

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
      -- Activo pero no alcanza requisitos para rango base
      v_tope_linea := CASE WHEN v_rango_menor.id IS NOT NULL THEN FLOOR((v_rango_menor.puntos_grupales * v_linea_estirada_pct) / 100) ELSE 250 END;
      SELECT COALESCE(SUM(LEAST(puntos_totales_rama, v_tope_linea)), 0) INTO v_computable_ref FROM temp_ramas_ciclo WHERE socio_id = v_socio.id;

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
      -- Califica métricamente: evaluar según historial del ciclo anterior
      IF v_rango_ant_orden IS NULL THEN
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'primer_ciclo';
        v_califica := true;
      ELSIF v_rango_calificado.orden < v_rango_ant_orden THEN
        -- Descenso de rango: bono = 0 y no califica para cobro por regla de negocio
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

        -- Agregar a la lista para el detalle de la vista previa y comparaciones
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
            ciclo_id,
            beneficiario_id,
            generador_id,
            orden_id,
            tipo,
            nivel,
            base_cent,
            base_puntos,
            porcentaje,
            monto_cent,
            estado,
            detalle,
            creado_en
          ) VALUES (
            p_ciclo_id,
            v_socio.id,
            NULL,
            NULL,
            'rango',
            NULL,
            v_computables_calificado * 100,
            v_computables_calificado,
            NULL,
            v_bono_cent,
            'confirmada',
            v_detalle_comision,
            now()
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'yaExistia', false,
    'soloCalculo', p_solo_calculo,
    'evaluados', v_evaluados,
    'califican', v_califican,
    'totalBonoCent', v_total_bono_cent,
    'comisionesCreadas', v_comisiones_creadas,
    'comisiones', v_lista_comisiones
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_calcular_y_persistir_rangos(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_calcular_y_persistir_rangos(bigint, boolean) TO authenticated;
