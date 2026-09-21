-- =====================================================================
-- TAREA-45: FUNCIONES POSTGRESQL PARA CIERRE ATÓMICO Y GESTIÓN DE PRODUCTOS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FN_CALCULAR_Y_PERSISTIR_RANGOS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calcular_y_persistir_rangos(p_ciclo_id bigint)
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
  v_rango_anterior record;
  v_califica boolean;
  v_bono_cent bigint;
  v_motivo_bono text;
  v_rango_calificado record;
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
  v_rango_menor record;
  v_computable_ref integer;
  v_tope_linea integer;
  v_computable_rango integer;
  v_detalle_comision jsonb;
BEGIN
  -- 1. Validar permisos de administrador
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden calcular o persistir rangos.';
  END IF;

  IF p_ciclo_id IS NULL OR p_ciclo_id <= 0 THEN
    RAISE EXCEPTION 'cicloId inválido: %', p_ciclo_id;
  END IF;

  -- 2. Validar IDEMPOTENCIA: si ya existen filas de rango_ciclo o comisiones de rango, no duplicar
  SELECT count(*) INTO v_count_rc FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id;
  SELECT count(*), COALESCE(SUM(monto_cent), 0) INTO v_count_com, v_total_existente_cent
  FROM public.comision WHERE ciclo_id = p_ciclo_id AND tipo = 'rango';

  IF v_count_rc > 0 OR v_count_com > 0 THEN
    SELECT count(*) INTO v_count_califican FROM public.rango_ciclo WHERE ciclo_id = p_ciclo_id AND califica = true;
    RETURN jsonb_build_object(
      'yaExistia', true,
      'evaluados', v_count_rc,
      'califican', COALESCE(v_count_califican, v_count_com),
      'totalBonoCent', v_total_existente_cent,
      'comisionesCreadas', v_count_com,
      'mensaje', 'Idempotencia: El ciclo ' || p_ciclo_id || ' ya cuenta con registros de rango previamente calculados.'
    );
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
    SELECT rc.rango_id, r.orden AS rango_orden, r.codigo AS rango_codigo
    INTO v_rango_anterior
    FROM public.rango_ciclo rc
    JOIN public.rango r ON r.id = rc.rango_id
    WHERE rc.socio_id = v_socio.id AND rc.ciclo_id = (p_ciclo_id - 1);

    IF NOT v_activo THEN
      -- Inactivo en el ciclo: no califica a rango ni genera comisión
      v_tope_linea := CASE WHEN v_rango_menor.id IS NOT NULL THEN FLOOR((v_rango_menor.puntos_grupales * v_linea_estirada_pct) / 100) ELSE 250 END;
      SELECT COALESCE(SUM(LEAST(puntos_totales_rama, v_tope_linea)), 0) INTO v_computable_ref FROM temp_ramas_ciclo WHERE socio_id = v_socio.id;

      INSERT INTO public.rango_ciclo (
        socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
        puntos_linea_mayor, puntos_computables, frontales_activos, califica,
        bono_cent, calculado_en
      ) VALUES (
        v_socio.id, p_ciclo_id, NULL, v_puntos_personales, v_puntos_grupales,
        v_puntos_linea_mayor, v_computable_ref, v_frontales_activos, false,
        0, now()
      );
    ELSIF v_rango_calificado.id IS NULL THEN
      -- Activo pero no alcanza requisitos para rango base
      v_tope_linea := CASE WHEN v_rango_menor.id IS NOT NULL THEN FLOOR((v_rango_menor.puntos_grupales * v_linea_estirada_pct) / 100) ELSE 250 END;
      SELECT COALESCE(SUM(LEAST(puntos_totales_rama, v_tope_linea)), 0) INTO v_computable_ref FROM temp_ramas_ciclo WHERE socio_id = v_socio.id;

      INSERT INTO public.rango_ciclo (
        socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
        puntos_linea_mayor, puntos_computables, frontales_activos, califica,
        bono_cent, calculado_en
      ) VALUES (
        v_socio.id, p_ciclo_id, NULL, v_puntos_personales, v_puntos_grupales,
        v_puntos_linea_mayor, v_computable_ref, v_frontales_activos, false,
        0, now()
      );
    ELSE
      -- Califica métricamente: evaluar según historial del ciclo anterior
      IF v_rango_anterior.rango_orden IS NULL THEN
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'primer_ciclo';
        v_califica := true;
      ELSIF v_rango_calificado.orden < v_rango_anterior.rango_orden THEN
        -- Descenso de rango: bono = 0 y no califica para cobro por regla de negocio
        v_bono_cent := 0;
        v_motivo_bono := 'baja';
        v_califica := false;
      ELSIF v_rango_calificado.orden = v_rango_anterior.rango_orden THEN
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'mantiene';
        v_califica := true;
      ELSE
        v_bono_cent := COALESCE(v_rango_calificado.bono_cent, 0);
        v_motivo_bono := 'asciende';
        v_califica := true;
      END IF;

      INSERT INTO public.rango_ciclo (
        socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
        puntos_linea_mayor, puntos_computables, frontales_activos, califica,
        bono_cent, calculado_en
      ) VALUES (
        v_socio.id, p_ciclo_id, v_rango_calificado.id, v_puntos_personales, v_puntos_grupales,
        v_puntos_linea_mayor, v_computables_calificado, v_frontales_activos, v_califica,
        v_bono_cent, now()
      );

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
          'rango_anterior_orden', v_rango_anterior.rango_orden,
          'motivo_pago', CASE 
            WHEN v_motivo_bono = 'baja' THEN 'Baja de rango respecto al ciclo anterior: bono = 0'
            ELSE 'Calificación válida (' || v_motivo_bono || '): bono = ' || v_bono_cent || ' cent'
          END
        );

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
  END LOOP;

  RETURN jsonb_build_object(
    'yaExistia', false,
    'evaluados', v_evaluados,
    'califican', v_califican,
    'totalBonoCent', v_total_bono_cent,
    'comisionesCreadas', v_comisiones_creadas
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_calcular_y_persistir_rangos(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_calcular_y_persistir_rangos(bigint) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. FN_EJECUTAR_CIERRE_CICLO (Actualizada: Cierre 100% Atómico)
-- ---------------------------------------------------------------------
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
    v_resumen_rango JSONB;
BEGIN
    -- 1. Validar permisos de administrador
    IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
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

    -- 2.1 CALCULAR Y PERSISTIR RANGOS Y COMISIONES DE RANGO EN LA MISMA TRANSACCIÓN
    v_resumen_rango := public.fn_calcular_y_persistir_rangos(p_ciclo_id::bigint);

    -- Calcular comisiones a abonar antes de cerrar (incluye el bono de rango recién persistido)
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
      'nuevo_ciclo_anio', v_nuevo_anio,
      'resumen_rango', v_resumen_rango
    );

    INSERT INTO auditoria (
      usuario_id,
      accion,
      tabla,
      registro_id,
      datos_antes,
      datos_despues
    ) VALUES (
      v_admin_id,
      'cerrar_ciclo',
      'ciclo',
      p_ciclo_id,
      v_datos_antes,
      v_datos_despues
    );

    RETURN jsonb_build_object(
        'exito', true,
        'ciclo_cerrado_id', p_ciclo_id,
        'total_abonado_cent', v_total_abonado,
        'cantidad_abonos', v_cant_abonos,
        'nuevo_ciclo_id', v_nuevo_ciclo_id,
        'nuevo_ciclo_mes', v_nuevo_mes,
        'nuevo_ciclo_anio', v_nuevo_anio,
        'resumenRango', v_resumen_rango
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo(integer, integer) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. FN_CREAR_PRODUCTO_ADMIN (P-32)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_crear_producto_admin(
  p_datos jsonb,
  p_admin_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_codigo text;
  v_nombre text;
  v_slug text;
  v_descripcion text;
  v_categoria text;
  v_presentacion text;
  v_precio_lista_cent bigint;
  v_puntos integer;
  v_imagen_url text;
  v_orden integer;
  v_activo boolean;
  v_producto record;
  v_admin_id bigint := p_admin_id;
BEGIN
  -- Validar admin
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden crear productos.';
  END IF;

  v_codigo := UPPER(REGEXP_REPLACE(COALESCE(p_datos->>'codigo', ''), '\s+', '', 'g'));
  IF v_codigo IS NULL OR v_codigo = '' THEN
    RAISE EXCEPTION 'El código del producto es obligatorio.';
  END IF;

  v_nombre := TRIM(COALESCE(p_datos->>'nombre', ''));
  IF v_nombre IS NULL OR v_nombre = '' THEN
    RAISE EXCEPTION 'El nombre comercial del producto es obligatorio.';
  END IF;

  v_slug := LOWER(TRIM(COALESCE(p_datos->>'slug', '')));
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'El slug del producto es obligatorio.';
  END IF;

  v_precio_lista_cent := (p_datos->>'precio_lista_cent')::bigint;
  IF v_precio_lista_cent IS NULL OR v_precio_lista_cent <= 0 THEN
    RAISE EXCEPTION 'El precio público debe ser mayor a 0.';
  END IF;

  v_puntos := (p_datos->>'puntos')::integer;
  IF v_puntos IS NULL OR v_puntos < 0 THEN
    RAISE EXCEPTION 'Los puntos deben ser un número entero mayor o igual a 0.';
  END IF;

  -- Comprobar unicidad
  IF EXISTS (SELECT 1 FROM public.producto WHERE codigo = v_codigo) THEN
    RAISE EXCEPTION 'Ese código ya existe';
  END IF;

  IF EXISTS (SELECT 1 FROM public.producto WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'Ese slug ya existe';
  END IF;

  v_descripcion := NULLIF(TRIM(p_datos->>'descripcion'), '');
  v_categoria := NULLIF(TRIM(p_datos->>'categoria'), '');
  v_presentacion := NULLIF(TRIM(p_datos->>'presentacion'), '');
  v_imagen_url := NULLIF(TRIM(p_datos->>'imagen_url'), '');
  v_orden := COALESCE((p_datos->>'orden')::integer, 10);
  v_activo := COALESCE((p_datos->>'activo')::boolean, true);

  INSERT INTO public.producto (
    codigo, nombre, slug, descripcion, categoria, presentacion,
    precio_lista_cent, puntos, imagen_url, orden, activo
  ) VALUES (
    v_codigo, v_nombre, v_slug, v_descripcion, v_categoria, v_presentacion,
    v_precio_lista_cent, v_puntos, v_imagen_url, v_orden, v_activo
  )
  RETURNING * INTO v_producto;

  -- Auditoría interna
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

  INSERT INTO public.auditoria (
    usuario_id,
    accion,
    tabla,
    registro_id,
    datos_despues
  ) VALUES (
    v_admin_id,
    'crear_producto',
    'producto',
    v_producto.id,
    to_jsonb(v_producto)
  );

  RETURN to_jsonb(v_producto);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_crear_producto_admin(jsonb, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_crear_producto_admin(jsonb, bigint) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. FN_EDITAR_PRODUCTO_ADMIN (P-32)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_editar_producto_admin(
  p_id bigint,
  p_datos jsonb,
  p_admin_id bigint DEFAULT NULL,
  p_datos_antes jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_codigo text;
  v_nombre text;
  v_slug text;
  v_descripcion text;
  v_categoria text;
  v_presentacion text;
  v_precio_lista_cent bigint;
  v_puntos integer;
  v_imagen_url text;
  v_orden integer;
  v_activo boolean;
  v_producto record;
  v_admin_id bigint := p_admin_id;
  v_antes jsonb := p_datos_antes;
BEGIN
  -- Validar admin
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden editar productos.';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'ID de producto no especificado.';
  END IF;

  v_codigo := UPPER(REGEXP_REPLACE(COALESCE(p_datos->>'codigo', ''), '\s+', '', 'g'));
  IF v_codigo IS NULL OR v_codigo = '' THEN
    RAISE EXCEPTION 'El código del producto es obligatorio.';
  END IF;

  v_nombre := TRIM(COALESCE(p_datos->>'nombre', ''));
  IF v_nombre IS NULL OR v_nombre = '' THEN
    RAISE EXCEPTION 'El nombre comercial del producto es obligatorio.';
  END IF;

  v_slug := LOWER(TRIM(COALESCE(p_datos->>'slug', '')));
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'El slug del producto es obligatorio.';
  END IF;

  v_precio_lista_cent := (p_datos->>'precio_lista_cent')::bigint;
  IF v_precio_lista_cent IS NULL OR v_precio_lista_cent <= 0 THEN
    RAISE EXCEPTION 'El precio público debe ser mayor a 0.';
  END IF;

  v_puntos := (p_datos->>'puntos')::integer;
  IF v_puntos IS NULL OR v_puntos < 0 THEN
    RAISE EXCEPTION 'Los puntos deben ser un número entero mayor o igual a 0.';
  END IF;

  -- Comprobar unicidad excluyendo este producto
  IF EXISTS (SELECT 1 FROM public.producto WHERE codigo = v_codigo AND id <> p_id) THEN
    RAISE EXCEPTION 'Ese código ya existe';
  END IF;

  IF EXISTS (SELECT 1 FROM public.producto WHERE slug = v_slug AND id <> p_id) THEN
    RAISE EXCEPTION 'Ese slug ya existe';
  END IF;

  -- Recuperar datos antes si no se enviaron
  IF v_antes IS NULL THEN
    SELECT to_jsonb(p) INTO v_antes FROM public.producto p WHERE id = p_id;
  END IF;

  v_descripcion := NULLIF(TRIM(p_datos->>'descripcion'), '');
  v_categoria := NULLIF(TRIM(p_datos->>'categoria'), '');
  v_presentacion := NULLIF(TRIM(p_datos->>'presentacion'), '');
  v_imagen_url := NULLIF(TRIM(p_datos->>'imagen_url'), '');
  v_orden := COALESCE((p_datos->>'orden')::integer, (v_antes->>'orden')::integer, 10);
  v_activo := COALESCE((p_datos->>'activo')::boolean, (v_antes->>'activo')::boolean, true);

  UPDATE public.producto
  SET
    codigo = v_codigo,
    nombre = v_nombre,
    slug = v_slug,
    descripcion = v_descripcion,
    categoria = v_categoria,
    presentacion = v_presentacion,
    precio_lista_cent = v_precio_lista_cent,
    puntos = v_puntos,
    imagen_url = v_imagen_url,
    orden = v_orden,
    activo = v_activo
  WHERE id = p_id
  RETURNING * INTO v_producto;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto con ID % no existe.', p_id;
  END IF;

  -- Auditoría interna
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

  INSERT INTO public.auditoria (
    usuario_id,
    accion,
    tabla,
    registro_id,
    datos_antes,
    datos_despues
  ) VALUES (
    v_admin_id,
    'editar_producto',
    'producto',
    p_id,
    v_antes,
    to_jsonb(v_producto)
  );

  RETURN to_jsonb(v_producto);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_editar_producto_admin(bigint, jsonb, bigint, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_editar_producto_admin(bigint, jsonb, bigint, jsonb) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. FN_CAMBIAR_ESTADO_PRODUCTO_ADMIN (P-32)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cambiar_estado_producto_admin(
  p_id bigint,
  p_activo boolean,
  p_admin_id bigint DEFAULT NULL,
  p_datos_antes jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_producto record;
  v_admin_id bigint := p_admin_id;
  v_antes jsonb := p_datos_antes;
  v_accion text;
BEGIN
  -- Validar admin
  IF auth.jwt() IS NOT NULL AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden cambiar estado de productos.';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'ID de producto no especificado.';
  END IF;

  IF v_antes IS NULL THEN
    SELECT to_jsonb(p) INTO v_antes FROM public.producto p WHERE id = p_id;
  END IF;

  UPDATE public.producto
  SET activo = p_activo
  WHERE id = p_id
  RETURNING * INTO v_producto;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto con ID % no existe.', p_id;
  END IF;

  IF p_activo THEN
    v_accion := 'activar_producto';
  ELSE
    v_accion := 'desactivar_producto';
  END IF;

  -- Auditoría interna
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

  INSERT INTO public.auditoria (
    usuario_id,
    accion,
    tabla,
    registro_id,
    datos_antes,
    datos_despues
  ) VALUES (
    v_admin_id,
    v_accion,
    'producto',
    p_id,
    v_antes,
    to_jsonb(v_producto)
  );

  RETURN to_jsonb(v_producto);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_cambiar_estado_producto_admin(bigint, boolean, bigint, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_cambiar_estado_producto_admin(bigint, boolean, bigint, jsonb) TO authenticated;
