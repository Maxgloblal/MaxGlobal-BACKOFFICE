-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 02-FUNCIONES.SQL
-- Las 25 funciones oficiales consolidadas en su versión definitiva
-- Idempotente: CREATE OR REPLACE FUNCTION
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FN_CURRENT_SOCIO_ID
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_current_socio_id()
RETURNS BIGINT AS $$
    SELECT id FROM public.socio WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 2. FN_IS_ADMIN
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.socio
        WHERE email = auth.jwt() ->> 'email'
          AND rol IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 3. FN_BLOQUEAR_CICLO_CERRADO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_bloquear_ciclo_cerrado()
RETURNS TRIGGER AS $$
DECLARE v_estado VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado FROM ciclo WHERE id = NEW.ciclo_id;
    IF v_estado IN ('cerrado','pagado') THEN
        RAISE EXCEPTION 'El ciclo % está cerrado. No admite nuevos registros.', NEW.ciclo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 4. FN_CONSTRUIR_RED_ANCESTRO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_construir_red_ancestro()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patrocinador_id IS NULL THEN RETURN NEW; END IF;

    INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
    VALUES (NEW.id, NEW.patrocinador_id, 1);

    INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
    SELECT NEW.id, ra.ancestro_id, (ra.nivel + 1)::smallint
      FROM red_ancestro ra
     WHERE ra.descendiente_id = NEW.patrocinador_id
       AND ra.nivel + 1 <= 50;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 5. FN_PROTEGER_COLUMNAS_INMUTABLES_SOCIO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_proteger_columnas_inmutables_socio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.fn_is_admin() THEN
    IF NEW.patrocinador_id IS DISTINCT FROM OLD.patrocinador_id THEN
      RAISE EXCEPTION 'No está permitido modificar el patrocinador de un socio';
    END IF;
    IF NEW.pack_id IS DISTINCT FROM OLD.pack_id THEN
      RAISE EXCEPTION 'El pack de afiliación solo puede ser modificado por Administración al confirmar la orden';
    END IF;
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
      RAISE EXCEPTION 'No está permitido modificar el rol del socio';
    END IF;
    IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
      RAISE EXCEPTION 'No está permitido modificar el código del socio';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'No está permitido modificar el correo electrónico del socio';
    END IF;
  END IF;
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- 6. FN_VALIDAR_PACK_SOLICITUD
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validar_pack_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_codigo_normalizado TEXT;
  v_existe BOOLEAN;
BEGIN
  IF NEW.pack_codigo IS NULL OR TRIM(NEW.pack_codigo) = '' THEN
    RAISE EXCEPTION 'El campo pack_codigo es obligatorio';
  END IF;

  v_codigo_normalizado := CASE LOWER(TRIM(NEW.pack_codigo))
    WHEN 'kit-emprendedor' THEN 'EMPRENDEDOR'
    WHEN 'pack-ejecutivo' THEN 'EJECUTIVO'
    WHEN 'pack-gold' THEN 'GOLD'
    WHEN 'pack-familiar' THEN 'FAMILIAR'
    WHEN 'pack-empresarial' THEN 'EMPRESARIAL'
    ELSE UPPER(TRIM(NEW.pack_codigo))
  END;

  SELECT EXISTS(
    SELECT 1 FROM pack WHERE UPPER(codigo) = v_codigo_normalizado AND activo = true
  ) INTO v_existe;

  IF NOT v_existe THEN
    RAISE EXCEPTION 'El pack_codigo "%" no existe en la tabla pack', NEW.pack_codigo;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 7. FN_MARCAR_PASSWORD_CAMBIADA
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_marcar_password_cambiada()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.socio
  SET password_cambiada = true,
      actualizado_en = now()
  WHERE email = auth.jwt() ->> 'email';
END;
$$;

-- ---------------------------------------------------------------------
-- 8. FN_ACTUALIZAR_CONFIG_AJUSTABLE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_actualizar_config_ajustable(p_clave text, p_valor text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_valor_anterior text;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar la configuración.';
    END IF;

    IF p_clave NOT IN (
        'activacion_puntos_mes',
        'monto_minimo_retiro_cent',
        'dia_pago_comisiones',
        'dias_hasta_pago',
        'umbral_detraccion_cent',
        'pct_detraccion',
        'url_landing'
    ) THEN
        RAISE EXCEPTION 'La clave % es una regla dura y no puede modificarse directamente.', p_clave;
    END IF;

    -- Obtener valor anterior antes de actualizar
    SELECT valor INTO v_valor_anterior
    FROM public.config
    WHERE clave = p_clave;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La clave % no existe en config.', p_clave;
    END IF;

    -- Obtener administrador
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

    v_datos_antes := jsonb_build_object(p_clave, v_valor_anterior);

    UPDATE public.config
       SET valor = CASE WHEN p_clave = 'pct_detraccion' AND (p_valor IS NULL OR trim(p_valor) = '' OR p_valor = 'null') THEN NULL ELSE p_valor END,
           actualizado_en = now()
     WHERE clave = p_clave;

    v_datos_despues := jsonb_build_object(p_clave, p_valor);

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
      'cambiar_config',
      'config',
      0,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object('exito', true, 'clave', p_clave, 'valor', p_valor);
END;
$function$;

-- ---------------------------------------------------------------------
-- 9. FN_GUARDAR_RANGO_CONFIG
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_guardar_rango_config(p_rango_id integer, p_nombre text, p_puntos_grupales integer, p_frontales_activos integer, p_bono_cent bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_rango_previo record;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar la configuración de rangos.';
    END IF;

    IF p_rango_id < 9 OR p_rango_id > 16 THEN
        RAISE EXCEPTION 'Solo los rangos 9 al 16 pueden configurarse desde este formulario.';
    END IF;

    SELECT * INTO v_rango_previo
    FROM public.rango
    WHERE id = p_rango_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rango % no encontrado.', p_rango_id;
    END IF;

    -- Obtener administrador
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

    v_datos_antes := jsonb_build_object(
      'rango_id', p_rango_id,
      'nombre', v_rango_previo.nombre,
      'puntos_grupales', v_rango_previo.puntos_grupales,
      'frontales_activos', v_rango_previo.frontales_activos,
      'bono_cent', v_rango_previo.bono_cent,
      'definido', v_rango_previo.definido
    );

    UPDATE public.rango
       SET nombre = COALESCE(NULLIF(TRIM(p_nombre), ''), nombre),
           puntos_grupales = p_puntos_grupales,
           frontales_activos = p_frontales_activos,
           bono_cent = p_bono_cent,
           definido = true
     WHERE id = p_rango_id;

    v_datos_despues := jsonb_build_object(
      'rango_id', p_rango_id,
      'nombre', COALESCE(NULLIF(TRIM(p_nombre), ''), v_rango_previo.nombre),
      'puntos_grupales', p_puntos_grupales,
      'frontales_activos', p_frontales_activos,
      'bono_cent', p_bono_cent,
      'definido', true
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
      'cambiar_rango',
      'rango',
      p_rango_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object('exito', true, 'rango_id', p_rango_id);
END;
$function$;

-- ---------------------------------------------------------------------
-- 10. FN_APROBAR_SOLICITUD_RETIRO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_aprobar_solicitud_retiro(p_solicitud_id bigint, p_admin_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_solicitud record;
    v_ciclo_id bigint;
    v_saldo_actual bigint;
    v_saldo_anterior bigint;
    v_saldo_nuevo bigint;
    v_movimiento_id bigint;
    v_admin_id bigint := p_admin_id;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden aprobar retiros.';
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

    SELECT * INTO v_solicitud
    FROM public.solicitud_retiro
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de retiro % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado <> 'pendiente' THEN
        RAISE EXCEPTION 'La solicitud % ya fue procesada (estado actual: %).', p_solicitud_id, v_solicitud.estado;
    END IF;

    SELECT id INTO v_ciclo_id
    FROM public.ciclo
    WHERE estado = 'abierto'
    ORDER BY id DESC
    LIMIT 1;

    IF v_ciclo_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún ciclo abierto para registrar el retiro.';
    END IF;

    SELECT COALESCE(saldo_cent, 0) INTO v_saldo_actual
    FROM public.v_wallet_saldo
    WHERE socio_id = v_solicitud.socio_id;

    IF v_saldo_actual IS NULL THEN
        v_saldo_actual := 0;
    END IF;

    IF v_solicitud.monto_cent > v_saldo_actual THEN
        RAISE EXCEPTION 'Saldo insuficiente: el socio tiene S/. % pero solicitó S/. %.',
            (v_saldo_actual / 100.0), (v_solicitud.monto_cent / 100.0);
    END IF;

    SELECT saldo_despues_cent INTO v_saldo_anterior
    FROM public.wallet_movimiento
    WHERE socio_id = v_solicitud.socio_id
    ORDER BY id DESC
    LIMIT 1;

    IF v_saldo_anterior IS NULL THEN
        v_saldo_anterior := 0;
    END IF;

    v_saldo_nuevo := v_saldo_anterior - v_solicitud.monto_cent;

    -- Capturar datos_antes
    v_datos_antes := jsonb_build_object(
      'solicitud_id', p_solicitud_id,
      'socio_id', v_solicitud.socio_id,
      'monto_cent', v_solicitud.monto_cent,
      'saldo_anterior_cent', v_saldo_anterior,
      'estado', 'pendiente'
    );

    INSERT INTO public.wallet_movimiento (
        socio_id,
        ciclo_id,
        comision_id,
        tipo,
        concepto,
        monto_cent,
        saldo_despues_cent,
        creado_en
    ) VALUES (
        v_solicitud.socio_id,
        v_ciclo_id,
        NULL,
        'retiro',
        'Retiro aprobado',
        -v_solicitud.monto_cent,
        v_saldo_nuevo,
        now()
    ) RETURNING id INTO v_movimiento_id;

    UPDATE public.solicitud_retiro
       SET estado = 'aprobado',
           procesado_por = v_admin_id,
           procesado_en = now()
     WHERE id = p_solicitud_id;

    -- AUDITORÍA
    v_datos_despues := jsonb_build_object(
      'solicitud_id', p_solicitud_id,
      'estado', 'aprobado',
      'saldo_nuevo_cent', v_saldo_nuevo,
      'movimiento_id', v_movimiento_id
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
      'aprobar_retiro',
      'solicitud_retiro',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
        'exito', true,
        'solicitud_id', p_solicitud_id,
        'socio_id', v_solicitud.socio_id,
        'monto_cent', v_solicitud.monto_cent,
        'movimiento_id', v_movimiento_id,
        'saldo_anterior_cent', v_saldo_anterior,
        'saldo_nuevo_cent', v_saldo_nuevo
    );
END;
$function$;

-- ---------------------------------------------------------------------
-- 11. FN_RECHAZAR_SOLICITUD_RETIRO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_rechazar_solicitud_retiro(p_solicitud_id bigint, p_admin_id bigint, p_motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_solicitud record;
    v_admin_id bigint := p_admin_id;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden rechazar retiros.';
    END IF;

    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de rechazo es obligatorio.';
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

    SELECT * INTO v_solicitud
    FROM public.solicitud_retiro
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de retiro % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado <> 'pendiente' THEN
        RAISE EXCEPTION 'La solicitud % ya fue procesada (estado actual: %).', p_solicitud_id, v_solicitud.estado;
    END IF;

    v_datos_antes := jsonb_build_object(
      'solicitud_id', p_solicitud_id,
      'socio_id', v_solicitud.socio_id,
      'monto_cent', v_solicitud.monto_cent,
      'estado', 'pendiente'
    );

    UPDATE public.solicitud_retiro
       SET estado = 'rechazado',
           motivo_rechazo = trim(p_motivo),
           procesado_por = v_admin_id,
           procesado_en = now()
     WHERE id = p_solicitud_id;

    v_datos_despues := jsonb_build_object(
      'solicitud_id', p_solicitud_id,
      'estado', 'rechazado',
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
      'rechazar_retiro',
      'solicitud_retiro',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
        'exito', true,
        'solicitud_id', p_solicitud_id,
        'estado', 'rechazado',
        'motivo', trim(p_motivo)
    );
END;
$function$;

-- ---------------------------------------------------------------------
-- 12. FN_VISTA_PREVIA_BAJA_SOCIO
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 13. FN_DAR_DE_BAJA_SOCIO
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 13.1 FN_ACTUALIZAR_DATOS_SOCIO_ADMIN (P-27)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_actualizar_datos_socio_admin(
  p_socio_id bigint,
  p_nombres text,
  p_apellidos text,
  p_email text DEFAULT NULL::text,
  p_telefono text DEFAULT NULL::text,
  p_direccion text DEFAULT NULL::text,
  p_ciudad text DEFAULT NULL::text,
  p_banco text DEFAULT NULL::text,
  p_cuenta_bancaria text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_socio RECORD;
  v_email_anterior text;
  v_nuevo_email text;
  v_user_id uuid;
  v_resultado RECORD;
BEGIN
  -- 1. Verificar privilegios de administrador
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar datos de socios';
  END IF;

  -- 2. Obtener socio existente
  SELECT * INTO v_socio FROM public.socio WHERE id = p_socio_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Socio con ID % no encontrado', p_socio_id;
  END IF;

  v_email_anterior := lower(trim(v_socio.email));
  
  -- Determinar nuevo email (si es nulo o vacío, conserva el anterior)
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    v_nuevo_email := lower(trim(p_email));
  ELSE
    v_nuevo_email := v_email_anterior;
  END IF;

  -- 3. Validar formato básico de email
  IF v_nuevo_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'El formato del correo electrónico es inválido';
  END IF;

  -- 4. Si el correo cambió, verificar unicidad y sincronizar en Supabase Auth
  IF v_nuevo_email <> v_email_anterior THEN
    -- A. Verificar unicidad en public.socio
    IF EXISTS (
      SELECT 1 FROM public.socio 
      WHERE lower(email) = v_nuevo_email AND id <> p_socio_id
    ) THEN
      RAISE EXCEPTION 'El correo % ya está registrado para otro socio', v_nuevo_email;
    END IF;

    -- B. Buscar ID de usuario en auth.users correspondiente al correo anterior
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE lower(email) = v_email_anterior 
    LIMIT 1;

    -- C. Si el nuevo email ya existe en auth.users asignado a otro usuario distinto, rechazar
    IF EXISTS (
      SELECT 1 FROM auth.users 
      WHERE lower(email) = v_nuevo_email 
        AND (v_user_id IS NULL OR id <> v_user_id)
    ) THEN
      RAISE EXCEPTION 'El correo % ya existe en el sistema de autenticación para otro usuario', v_nuevo_email;
    END IF;

    -- D. Si el usuario existe en auth.users, actualizar email y metadatos
    IF v_user_id IS NOT NULL THEN
      UPDATE auth.users
      SET email = v_nuevo_email,
          raw_user_meta_data = jsonb_set(
            coalesce(raw_user_meta_data, '{}'::jsonb),
            '{email}',
            to_jsonb(v_nuevo_email)
          ),
          updated_at = now()
      WHERE id = v_user_id;

      -- E. Actualizar auth.identities (la columna email es GENERATED ALWAYS a partir de identity_data)
      UPDATE auth.identities
      SET identity_data = jsonb_set(
            identity_data,
            '{email}',
            to_jsonb(v_nuevo_email)
          ),
          updated_at = now()
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  -- 5. Actualizar public.socio (preservando patrocinador_id, codigo, pack_id y rol)
  UPDATE public.socio
  SET nombres = upper(trim(p_nombres)),
      apellidos = upper(trim(p_apellidos)),
      email = v_nuevo_email,
      telefono = trim(p_telefono),
      direccion = trim(p_direccion),
      ciudad = trim(p_ciudad),
      banco = trim(p_banco),
      cuenta_bancaria = trim(p_cuenta_bancaria),
      actualizado_en = now()
  WHERE id = p_socio_id
  RETURNING * INTO v_resultado;

  RETURN to_jsonb(v_resultado);
END;
$function$;

-- ---------------------------------------------------------------------
-- 13.2 FN_VISTA_PREVIA_ELIMINAR_SOCIO (P-27)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_vista_previa_eliminar_socio(p_socio_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_socio record;
  v_patrocinador_id bigint := NULL;
  v_patrocinador_codigo text := NULL;
  v_patrocinador_nombres text := NULL;
  v_patrocinador_apellidos text := NULL;
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
  ELSE
    -- 4. Obtener patrocinador superior
    SELECT id, codigo, nombres, apellidos
    INTO v_patrocinador_id, v_patrocinador_codigo, v_patrocinador_nombres, v_patrocinador_apellidos
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
    'patrocinador', CASE WHEN v_patrocinador_id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_patrocinador_id,
        'codigo', v_patrocinador_codigo,
        'nombres', v_patrocinador_nombres,
        'apellidos', v_patrocinador_apellidos
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
$function$;

-- ---------------------------------------------------------------------
-- 13.3 FN_ELIMINAR_SOCIO_DEFINITIVO (P-27)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_eliminar_socio_definitivo(
  p_socio_id bigint,
  p_motivo text,
  p_admin_id bigint DEFAULT NULL::bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
    'descendientes_totales', cardinality(v_descendientes_ids),
    'filas_ancestro_reconstruidas', v_filas_ancestro_insertadas,
    'ordenes_borradas', v_ordenes_borradas,
    'comisiones_borradas', v_comisiones_borradas
  );
END;
$function$;

-- ---------------------------------------------------------------------
-- 14. FN_DESCARTAR_SOLICITUD_AFILIACION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_descartar_solicitud_afiliacion(p_solicitud_id bigint, p_motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_solicitud record;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden descartar solicitudes.';
    END IF;

    IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
        RAISE EXCEPTION 'El motivo de descarte es obligatorio para auditar la operación.';
    END IF;

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

    SELECT * INTO v_solicitud
    FROM public.solicitud_afiliacion
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de afiliación % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado = 'descartada' THEN
        RAISE EXCEPTION 'La solicitud % ya fue descartada previamente.', p_solicitud_id;
    END IF;

    v_datos_antes := jsonb_build_object(
      'id', v_solicitud.id,
      'estado', v_solicitud.estado,
      'motivo_descarte', v_solicitud.motivo_descarte
    );

    UPDATE public.solicitud_afiliacion
       SET estado = 'descartada',
           motivo_descarte = trim(p_motivo),
           atendida_por = v_admin_id,
           atendida_en = now()
     WHERE id = p_solicitud_id;

    v_datos_despues := jsonb_build_object(
      'id', p_solicitud_id,
      'estado', 'descartada',
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
      'descartar_solicitud',
      'solicitud_afiliacion',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
      'exito', true,
      'solicitud_id', p_solicitud_id,
      'estado', 'descartada',
      'motivo', trim(p_motivo)
    );
END;
$function$;

-- ---------------------------------------------------------------------
-- 15. FN_CONVERTIR_SOLICITUD_AFILIACION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_convertir_solicitud_afiliacion(p_solicitud_id bigint, p_socio_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_admin_id bigint;
    v_solicitud record;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden convertir solicitudes.';
    END IF;

    IF p_socio_id IS NULL THEN
        RAISE EXCEPTION 'El socio_id es obligatorio para convertir la solicitud.';
    END IF;

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

    SELECT * INTO v_solicitud
    FROM public.solicitud_afiliacion
    WHERE id = p_solicitud_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de afiliación % no encontrada.', p_solicitud_id;
    END IF;

    IF v_solicitud.estado = 'convertida' THEN
        RAISE EXCEPTION 'La solicitud % ya fue convertida previamente al socio %.', p_solicitud_id, v_solicitud.socio_id;
    END IF;

    v_datos_antes := jsonb_build_object(
      'id', v_solicitud.id,
      'estado', v_solicitud.estado,
      'socio_id', v_solicitud.socio_id
    );

    UPDATE public.solicitud_afiliacion
       SET estado = 'convertida',
           socio_id = p_socio_id,
           atendida_por = v_admin_id,
           atendida_en = now()
     WHERE id = p_solicitud_id;

    v_datos_despues := jsonb_build_object(
      'id', p_solicitud_id,
      'estado', 'convertida',
      'socio_id', p_socio_id
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
      'convertir_solicitud',
      'solicitud_afiliacion',
      p_solicitud_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
      'exito', true,
      'solicitud_id', p_solicitud_id,
      'socio_id', p_socio_id,
      'estado', 'convertida'
    );
END;
$function$;

-- ---------------------------------------------------------------------
-- 16. FN_REGISTRAR_AFILIACION_SOCIO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_afiliacion_socio(
  p_patrocinador_id bigint,
  p_pack_id bigint,
  p_tipo_documento text,
  p_documento text,
  p_nombres text,
  p_apellidos text,
  p_email text,
  p_telefono text,
  p_fecha_nacimiento date,
  p_direccion text,
  p_departamento text,
  p_provincia text,
  p_distrito text,
  p_voucher jsonb,
  p_canal text DEFAULT 'oficina'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_patrocinador record;
  v_pack record;
  v_ciclo_id bigint;
  v_socio_id bigint;
  v_codigo_socio text;
  v_orden_id bigint;
  v_codigo_orden text;
  v_user_id uuid;
  v_email_limpio text;
  v_doc_limpio text;

  -- Variables para generación de contraseña aleatoria de 10 caracteres (TAREA-25)
  -- Sin caracteres ambiguos: sin O, 0, l, 1, I
  v_upper text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_lower text := 'abcdefghijkmnopqrstuvwxyz';
  v_digits text := '23456789';
  v_all text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  v_pwd_chars text[];
  v_password_temporal text;
  v_idx int;
  v_swap int;
  v_tmp text;
BEGIN
  -- 1. Verificar si es admin
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para afiliar nuevos socios.';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  v_email_limpio := lower(trim(p_email));
  v_doc_limpio := trim(p_documento);

  -- 2. Validar unicidad (RF-333)
  IF EXISTS (SELECT 1 FROM public.socio WHERE documento = v_doc_limpio) THEN
    RAISE EXCEPTION 'Ya existe un socio registrado con el documento % (RF-333).', v_doc_limpio;
  END IF;

  IF EXISTS (SELECT 1 FROM public.socio WHERE email = v_email_limpio) THEN
    RAISE EXCEPTION 'Ya existe un socio registrado con el correo electrónico % (RF-333).', v_email_limpio;
  END IF;

  -- 3. Obtener y validar patrocinador (RF-331)
  SELECT s.*, p.codigo AS pack_codigo, p.solo_afilia_igual, p.nombre AS pack_nombre
  INTO v_patrocinador
  FROM public.socio s
  JOIN public.pack p ON p.id = s.pack_id
  WHERE s.id = p_patrocinador_id;

  IF v_patrocinador.id IS NULL THEN
    RAISE EXCEPTION 'Patrocinador con ID % no encontrado.', p_patrocinador_id;
  END IF;

  -- 4. Obtener pack a afiliar
  SELECT * INTO v_pack FROM public.pack WHERE id = p_pack_id AND activo = true;
  IF v_pack.id IS NULL THEN
    RAISE EXCEPTION 'Pack con ID % no encontrado o inactivo.', p_pack_id;
  END IF;

  -- RF-332: Restricción del Kit Emprendedor
  IF (v_patrocinador.solo_afilia_igual = true OR v_patrocinador.pack_codigo = 'EMPRENDEDOR') AND v_pack.codigo <> 'EMPRENDEDOR' THEN
    RAISE EXCEPTION 'Restricción RF-332: El patrocinador cuenta con Kit Emprendedor y solo puede afiliar a nuevos socios con Kit Emprendedor.';
  END IF;

  -- 5. Obtener ciclo abierto
  SELECT id INTO v_ciclo_id
  FROM public.ciclo
  WHERE estado = 'abierto'
  ORDER BY id DESC
  LIMIT 1;

  IF v_ciclo_id IS NULL THEN
    v_ciclo_id := 3;
  END IF;

  -- 6. Generar código y nuevo ID de socio (RF-335)
  SELECT COALESCE(MAX(id), 0) + 1 INTO v_socio_id FROM public.socio;
  v_codigo_socio := 'MG' || lpad(v_socio_id::text, 5, '0');

  -- Generación de contraseña aleatoria de 10 caracteres sin caracteres ambiguos (TAREA-25)
  v_pwd_chars := array[
    substr(v_upper, floor(random() * length(v_upper) + 1)::int, 1),
    substr(v_lower, floor(random() * length(v_lower) + 1)::int, 1),
    substr(v_digits, floor(random() * length(v_digits) + 1)::int, 1)
  ];
  FOR v_idx IN 1..7 LOOP
    v_pwd_chars := array_append(v_pwd_chars, substr(v_all, floor(random() * length(v_all) + 1)::int, 1));
  END LOOP;
  -- Fisher-Yates shuffle
  FOR v_idx IN REVERSE 10..2 LOOP
    v_swap := floor(random() * v_idx + 1)::int;
    v_tmp := v_pwd_chars[v_idx];
    v_pwd_chars[v_idx] := v_pwd_chars[v_swap];
    v_pwd_chars[v_swap] := v_tmp;
  END LOOP;
  v_password_temporal := array_to_string(v_pwd_chars, '');

  -- 7. Crear usuario en auth.users y auth.identities con la contraseña generada
  v_user_id := gen_random_uuid();
  
  DELETE FROM auth.identities WHERE identity_data->>'email' = v_email_limpio;
  DELETE FROM auth.users WHERE email = v_email_limpio;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, phone_change, phone_change_token,
    email_change_token_current, reauthentication_token,
    email_change_confirm_status,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email_limpio,
    extensions.crypt(v_password_temporal, extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombres', upper(trim(p_nombres)), 'apellidos', upper(trim(p_apellidos))),
    now(),
    now(),
    false,
    false,
    false
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email_limpio),
    'email',
    now(),
    now(),
    now()
  );

  -- 8. Insertar socio en estado 'pendiente' (RF-334)
  INSERT INTO public.socio (
    id, codigo, documento, nombres, apellidos,
    email, password_hash, telefono, fecha_nacimiento, direccion, ciudad,
    pack_id, patrocinador_id, fecha_afiliacion, estado, rol, creado_en, actualizado_en
  ) VALUES (
    v_socio_id, v_codigo_socio, v_doc_limpio, upper(trim(p_nombres)), upper(trim(p_apellidos)),
    v_email_limpio, 'AUTH_MANAGED', p_telefono, p_fecha_nacimiento, p_direccion, p_departamento,
    v_pack.id, v_patrocinador.id, current_date, 'pendiente', 'socio', now(), now()
  );

  -- 9. Generar orden inicial de afiliación en 'por_confirmar'
  v_orden_id := nextval('public.orden_id_seq'::regclass);
  v_codigo_orden := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(v_orden_id::text, 6, '0');

  INSERT INTO public.orden (
    id, codigo, socio_id, ciclo_id, tipo, pack_id,
    subtotal_cent, descuento_cent, total_cent, puntos_total,
    estado, canal, asesor_id, creada_en
  ) VALUES (
    v_orden_id, v_codigo_orden, v_socio_id, v_ciclo_id, 'afiliacion', v_pack.id,
    v_pack.precio_cent, 0, v_pack.precio_cent, COALESCE(v_pack.puntos_rango, 0),
    'por_confirmar', p_canal, v_admin_id, now()
  );

  -- 10. Insertar voucher de la afiliación (RF-315)
  IF p_voucher IS NOT NULL THEN
    INSERT INTO public.voucher (
      orden_id, imagen_url, banco, numero_operacion,
      monto_cent, fecha_deposito, estado, subido_en
    ) VALUES (
      v_orden_id,
      NULLIF(trim(p_voucher->>'imagen_url'), ''),
      p_voucher->>'banco',
      p_voucher->>'numero_operacion',
      COALESCE((p_voucher->>'monto_cent')::bigint, v_pack.precio_cent),
      COALESCE((p_voucher->>'fecha_deposito')::date, current_date),
      'pendiente',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'socio_id', v_socio_id,
    'codigo', v_codigo_socio,
    'nombres', upper(trim(p_nombres)) || ' ' || upper(trim(p_apellidos)),
    'email', v_email_limpio,
    'password_temporal', v_password_temporal,
    'pack_nombre', v_pack.nombre,
    'orden_id', v_orden_id,
    'orden_codigo', v_codigo_orden,
    'total_cent', v_pack.precio_cent,
    'puntos_total', COALESCE(v_pack.puntos_rango, 0),
    'estado', 'pendiente'
  );
END;
$function$;

-- ---------------------------------------------------------------------
-- 17. FN_REGISTRAR_PEDIDO_RECOMPRA
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_pedido_recompra(
  p_socio_id bigint,
  p_items jsonb,
  p_voucher jsonb,
  p_envio jsonb DEFAULT NULL::jsonb,
  p_canal text DEFAULT 'oficina'::text,
  p_tipo_venta text DEFAULT 'socio'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_id bigint;
  v_socio record;
  v_pack record;
  v_ciclo_id bigint;
  v_orden_id bigint;
  v_codigo_orden text;
  v_descuento_pct numeric;
  v_subtotal_cent bigint := 0;
  v_total_cent bigint := 0;
  v_descuento_cent bigint := 0;
  v_puntos_total integer := 0;
  v_item record;
  v_prod record;
  v_item_subtotal bigint;
  v_item_precio_final bigint;
  v_item_puntos integer;
  v_detalles jsonb := '[]'::jsonb;
  v_tipo_venta text;
BEGIN
  -- 1. Verificar si es admin
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol de administrador para registrar pedidos de recompra.';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.socio
  WHERE email = auth.jwt() ->> 'email'
    AND rol IN ('admin', 'superadmin')
  LIMIT 1;

  -- 2. Obtener socio y su pack
  SELECT s.*, p.descuento_recompra_pct, p.nombre AS pack_nombre
  INTO v_socio
  FROM public.socio s
  JOIN public.pack p ON p.id = s.pack_id
  WHERE s.id = p_socio_id;

  IF v_socio.id IS NULL THEN
    RAISE EXCEPTION 'Socio no encontrado.';
  END IF;

  v_tipo_venta := LOWER(COALESCE(p_tipo_venta, 'socio'));
  IF v_tipo_venta NOT IN ('socio', 'cliente') THEN
    v_tipo_venta := 'socio';
  END IF;

  -- TAREA-16: Si es venta a cliente final, el descuento es estrictamente 0%
  IF v_tipo_venta = 'cliente' THEN
    v_descuento_pct := 0;
  ELSE
    v_descuento_pct := v_socio.descuento_recompra_pct;
  END IF;

  -- 3. Obtener ciclo abierto
  SELECT id INTO v_ciclo_id
  FROM public.ciclo
  WHERE estado = 'abierto'
  ORDER BY id DESC
  LIMIT 1;

  IF v_ciclo_id IS NULL THEN
    v_ciclo_id := 3;
  END IF;

  -- 4. Validar y calcular cada item de orden_detalle
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (producto_id bigint, cantidad integer) LOOP
    IF v_item.cantidad <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a 0.';
    END IF;

    SELECT * INTO v_prod FROM public.producto WHERE id = v_item.producto_id AND activo = true;
    IF v_prod.id IS NULL THEN
      RAISE EXCEPTION 'Producto con ID % no encontrado o inactivo.', v_item.producto_id;
    END IF;

    -- RF-313: precio_lista_cent (precio público), precio_final_cent = round(lista * (1 - pct/100))
    v_item_subtotal := v_prod.precio_lista_cent * v_item.cantidad;
    v_item_precio_final := round(v_prod.precio_lista_cent * (1.0 - (v_descuento_pct / 100.0)))::bigint;
    v_item_puntos := v_prod.puntos * v_item.cantidad;

    v_subtotal_cent := v_subtotal_cent + v_item_subtotal;
    v_total_cent := v_total_cent + (v_item_precio_final * v_item.cantidad);
    v_puntos_total := v_puntos_total + v_item_puntos;

    v_detalles := v_detalles || jsonb_build_object(
      'producto_id', v_prod.id,
      'cantidad', v_item.cantidad,
      'precio_lista_cent', v_prod.precio_lista_cent,
      'descuento_pct', v_descuento_pct,
      'precio_final_cent', v_item_precio_final,
      'puntos_unitario', v_prod.puntos,
      'puntos_subtotal', v_item_puntos
    );
  END LOOP;

  -- RF-313: descuento_cent = subtotal_cent - total_cent (una resta)
  v_descuento_cent := v_subtotal_cent - v_total_cent;

  -- 5. Generar código de orden único
  v_orden_id := nextval('public.orden_id_seq'::regclass);
  v_codigo_orden := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(v_orden_id::text, 6, '0');

  -- 6. Insertar orden en estado 'por_confirmar' con tipo_venta (RF-319, RF-320 y TAREA-16)
  INSERT INTO public.orden (
    id, codigo, socio_id, ciclo_id, tipo, tipo_venta, pack_id,
    subtotal_cent, descuento_cent, total_cent, puntos_total,
    estado, canal, asesor_id, creada_en
  ) VALUES (
    v_orden_id, v_codigo_orden, v_socio.id, v_ciclo_id, 'recompra', v_tipo_venta, v_socio.pack_id,
    v_subtotal_cent, v_descuento_cent, v_total_cent, v_puntos_total,
    'por_confirmar', p_canal, v_admin_id, now()
  );

  -- 7. Insertar orden_detalle
  INSERT INTO public.orden_detalle (
    orden_id, producto_id, cantidad, precio_lista_cent,
    descuento_pct, precio_final_cent, puntos_unitario, puntos_subtotal
  )
  SELECT
    v_orden_id,
    (d->>'producto_id')::bigint,
    (d->>'cantidad')::integer,
    (d->>'precio_lista_cent')::bigint,
    (d->>'descuento_pct')::numeric,
    (d->>'precio_final_cent')::bigint,
    (d->>'puntos_unitario')::integer,
    (d->>'puntos_subtotal')::integer
  FROM jsonb_array_elements(v_detalles) AS d;

  -- 8. Insertar comprobante / voucher (RF-315) - NULL si no hay imagen
  IF p_voucher IS NOT NULL THEN
    INSERT INTO public.voucher (
      orden_id, imagen_url, banco, numero_operacion,
      monto_cent, fecha_deposito, estado, subido_en
    ) VALUES (
      v_orden_id,
      NULLIF(trim(p_voucher->>'imagen_url'), ''),
      p_voucher->>'banco',
      p_voucher->>'numero_operacion',
      (p_voucher->>'monto_cent')::bigint,
      COALESCE((p_voucher->>'fecha_deposito')::date, current_date),
      'pendiente',
      now()
    );
  END IF;

  -- 9. Insertar envío si aplica (RF-316, RF-317: costo_cent va aparte y no genera puntos)
  IF p_envio IS NOT NULL AND (p_envio->>'direccion') IS NOT NULL AND length(trim(p_envio->>'direccion')) > 0 THEN
    INSERT INTO public.envio (
      orden_id, destinatario, telefono, departamento, provincia, distrito,
      direccion, referencia, agencia, costo_cent, estado, creado_en
    ) VALUES (
      v_orden_id,
      COALESCE(p_envio->>'destinatario', v_socio.nombres || ' ' || v_socio.apellidos),
      p_envio->>'telefono',
      p_envio->>'departamento',
      p_envio->>'provincia',
      p_envio->>'distrito',
      p_envio->>'direccion',
      p_envio->>'referencia',
      p_envio->>'agencia',
      COALESCE((p_envio->>'costo_cent')::bigint, 0),
      'pendiente',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'orden_id', v_orden_id,
    'codigo', v_codigo_orden,
    'tipo_venta', v_tipo_venta,
    'subtotal_cent', v_subtotal_cent,
    'descuento_cent', v_descuento_cent,
    'total_cent', v_total_cent,
    'puntos_total', v_puntos_total
  );
END;
$function$;

-- ---------------------------------------------------------------------
-- 18. FN_REGISTRAR_ORDEN_UPGRADE
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 19. FN_CONFIRMAR_ORDEN_PAGO
-- ---------------------------------------------------------------------
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
  -- Variables para gestión de Upgrade de Pack (TAREA-26 / FLUJO 9)
  v_socio record;
  v_pack_actual record;
  v_pack_nuevo record;
  v_datos_antes_upgrade jsonb;
  v_datos_despues_upgrade jsonb;
  -- Variables para TAREA-51 (Patrocinio al instante y Guarda Local)
  v_tope_pct integer := 50;
  v_base_pack_cent bigint := 0;
  v_total_patrocinio_cent bigint := 0;
  v_tope_patrocinio_cent bigint := 0;
  r_pat record;
  v_saldo_previo_pat bigint := 0;
  v_nuevo_saldo_pat bigint := 0;
  v_total_patrocinio_abonado_cent bigint := 0;
  v_cant_patrocinio_abonado integer := 0;
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

  -- 8. Si es orden de afiliación, activar al socio (RF-349) y procesar upgrade si aplica (TAREA-26)
  IF v_orden.tipo = 'afiliacion' THEN
    UPDATE public.socio
       SET estado = 'activo'
     WHERE id = v_orden.socio_id
       AND estado = 'pendiente';

    -- TAREA-26 · UPGRADE DE PACK (FLUJO 9)
    -- Si la orden tiene un pack distinto al del socio, es un upgrade
    SELECT * INTO v_socio FROM public.socio WHERE id = v_orden.socio_id;

    IF v_orden.pack_id IS NOT NULL AND v_socio.pack_id IS NOT NULL AND v_orden.pack_id <> v_socio.pack_id THEN
      SELECT * INTO v_pack_actual FROM public.pack WHERE id = v_socio.pack_id;
      SELECT * INTO v_pack_nuevo FROM public.pack WHERE id = v_orden.pack_id;

      -- 🔴 Guarda de precio: Si el pack nuevo NO cuesta más, la función FALLA con mensaje claro
      IF v_pack_nuevo.precio_cent <= v_pack_actual.precio_cent THEN
        RAISE EXCEPTION 'No se puede degradar o mantener el pack del socio: pack nuevo % (S/. %) no supera el precio del pack actual % (S/. %).',
          v_pack_nuevo.nombre, (v_pack_nuevo.precio_cent / 100.0),
          v_pack_actual.nombre, (v_pack_actual.precio_cent / 100.0);
      END IF;

      -- Preparar auditoría con el valor anterior completo
      v_datos_antes_upgrade := jsonb_build_object(
        'pack_id', v_pack_actual.id,
        'nombre', v_pack_actual.nombre,
        'codigo', v_pack_actual.codigo,
        'precio_cent', v_pack_actual.precio_cent,
        'puntos_rango', v_pack_actual.puntos_rango,
        'niveles_patrocinio', v_pack_actual.niveles_patrocinio,
        'niveles_residual', v_pack_actual.niveles_residual,
        'descuento_recompra_pct', v_pack_actual.descuento_recompra_pct
      );

      v_datos_despues_upgrade := jsonb_build_object(
        'pack_id', v_pack_nuevo.id,
        'nombre', v_pack_nuevo.nombre,
        'codigo', v_pack_nuevo.codigo,
        'precio_cent', v_pack_nuevo.precio_cent,
        'puntos_rango', v_pack_nuevo.puntos_rango,
        'niveles_patrocinio', v_pack_nuevo.niveles_patrocinio,
        'niveles_residual', v_pack_nuevo.niveles_residual,
        'descuento_recompra_pct', v_pack_nuevo.descuento_recompra_pct
      );

      -- Actualizar pack_id del socio
      UPDATE public.socio
         SET pack_id = v_orden.pack_id,
             actualizado_en = now()
       WHERE id = v_orden.socio_id;

      -- Registrar auditoría del upgrade
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
        'upgrade_pack',
        'socio',
        v_orden.socio_id,
        v_datos_antes_upgrade,
        v_datos_despues_upgrade,
        now()
      );
    END IF;
  END IF;

  -- 9. Insertar las comisiones calculadas en comision (RF-348)
  IF p_comisiones IS NOT NULL AND jsonb_array_length(p_comisiones) > 0 THEN
    -- 9.1 GUARDA DE SEGURIDAD (TAREA-51): Validar tope de patrocinio por orden contra precio del pack (RF-412)
    SELECT COALESCE(valor::integer, 50) INTO v_tope_pct
    FROM public.config
    WHERE clave = 'tope_patrocinio_por_orden_pct';
    IF v_tope_pct IS NULL OR v_tope_pct <= 0 THEN
      v_tope_pct := 50;
    END IF;

    -- Base de cálculo: precio del pack (RF-412: sin costo de envío)
    IF v_orden.pack_id IS NOT NULL THEN
      SELECT precio_cent INTO v_base_pack_cent
      FROM public.pack
      WHERE id = v_orden.pack_id;
    END IF;

    IF v_base_pack_cent IS NULL OR v_base_pack_cent <= 0 THEN
      v_base_pack_cent := COALESCE(v_orden.subtotal_cent, v_orden.total_cent);
    END IF;

    SELECT COALESCE(SUM((c->>'monto_cent')::bigint), 0) INTO v_total_patrocinio_cent
    FROM jsonb_array_elements(p_comisiones) AS c
    WHERE c->>'tipo' = 'patrocinio';

    IF v_base_pack_cent > 0 AND v_total_patrocinio_cent > 0 THEN
      v_tope_patrocinio_cent := (v_base_pack_cent * v_tope_pct) / 100;
      IF v_total_patrocinio_cent > v_tope_patrocinio_cent THEN
        RAISE EXCEPTION 'Tope de patrocinio excedido: la suma de comisiones de patrocinio (S/. %) supera el % %% del precio del pack (S/. %; tope permitido: S/. %). Transacción cancelada.',
          (v_total_patrocinio_cent / 100.0),
          v_tope_pct,
          (v_base_pack_cent / 100.0),
          (v_tope_patrocinio_cent / 100.0);
      END IF;
    END IF;

    -- Insertar en comision
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
      COALESCE(c->>'estado', 'confirmada'),
      (c->'detalle')::jsonb,
      now()
    FROM jsonb_array_elements(p_comisiones) AS c;

    GET DIAGNOSTICS v_comisiones_insertadas = ROW_COUNT;

    SELECT COALESCE(SUM((c->>'monto_cent')::bigint), 0) INTO v_total_comisiones_cent
    FROM jsonb_array_elements(p_comisiones) AS c;

    -- 9.2 TAREA-51: ABONO INMEDIATO DE PATROCINIO (MISMA TRANSACCIÓN)
    FOR r_pat IN (
      SELECT id, beneficiario_id, monto_cent, ciclo_id
      FROM public.comision
      WHERE orden_id = v_orden.id
        AND tipo = 'patrocinio'
        AND estado = 'confirmada'
        AND monto_cent > 0
      ORDER BY id ASC
    ) LOOP
      SELECT COALESCE(saldo_despues_cent, 0) INTO v_saldo_previo_pat
      FROM public.wallet_movimiento
      WHERE socio_id = r_pat.beneficiario_id
      ORDER BY id DESC
      LIMIT 1;

      IF v_saldo_previo_pat IS NULL THEN
        v_saldo_previo_pat := 0;
      END IF;

      v_nuevo_saldo_pat := v_saldo_previo_pat + r_pat.monto_cent;

      INSERT INTO public.wallet_movimiento (
        socio_id,
        ciclo_id,
        comision_id,
        tipo,
        concepto,
        monto_cent,
        saldo_despues_cent,
        creado_en
      ) VALUES (
        r_pat.beneficiario_id,
        r_pat.ciclo_id,
        r_pat.id,
        'abono',
        'Bono de patrocinio inmediato · Orden ' || v_orden.codigo,
        r_pat.monto_cent,
        v_nuevo_saldo_pat,
        now()
      );

      UPDATE public.comision
         SET estado = 'abonada'
       WHERE id = r_pat.id;

      v_total_patrocinio_abonado_cent := v_total_patrocinio_abonado_cent + r_pat.monto_cent;
      v_cant_patrocinio_abonado := v_cant_patrocinio_abonado + 1;
    END LOOP;
  END IF;

  -- 10. AUDITORÍA
  v_datos_despues := jsonb_build_object(
    'orden_id', v_orden.id,
    'codigo', v_orden.codigo,
    'estado', 'confirmada',
    'puntos_acreditados', v_orden.puntos_total,
    'comisiones_insertadas', v_comisiones_insertadas,
    'total_comisiones_cent', v_total_comisiones_cent,
    'patrocinio_abonado_cent', v_total_patrocinio_abonado_cent,
    'cant_patrocinio_abonado', v_cant_patrocinio_abonado
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
    'comisiones_insertadas', v_comisiones_insertadas,
    'patrocinio_abonado_cent', v_total_patrocinio_abonado_cent,
    'cant_patrocinio_abonado', v_cant_patrocinio_abonado
  );
END;
$function$;

-- ---------------------------------------------------------------------
-- 20. FN_RECHAZAR_ORDEN_PAGO
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 21. FN_EJECUTAR_CIERRE_CICLO
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_ejecutar_cierre_ciclo(
  p_ciclo_id bigint,
  p_admin_id bigint DEFAULT NULL
)
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

    -- 2.2 RESOLVER COMISIONES RETENIDAS DEL CICLO (TAREA-49)
    -- Motivo 'inactivo': pasa a 'confirmada' si el socio terminó el ciclo activo; de lo contrario a 'anulada'.
    -- Motivo 'pack_insuficiente' (y cualquier otra retención no subsanada): pasa a 'anulada' siempre.
    UPDATE public.comision c
       SET estado = CASE
             WHEN COALESCE(c.detalle->>'motivo', '') = 'inactivo' AND EXISTS (
               SELECT 1 FROM public.activacion act
                WHERE act.ciclo_id = p_ciclo_id
                  AND act.socio_id = c.beneficiario_id
                  AND act.activo = true
             ) THEN 'confirmada'
             ELSE 'anulada'
           END
     WHERE c.ciclo_id = p_ciclo_id
       AND c.estado = 'retenida';

    -- Calcular comisiones a abonar en este cierre (solo 'confirmada', 'abonada' ya fue abonada)
    SELECT COALESCE(SUM(monto_cent), 0) INTO v_total_comisiones_a_abonar
    FROM comision
    WHERE ciclo_id = p_ciclo_id
      AND monto_cent > 0
      AND (estado = 'confirmada' OR estado IS NULL);

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
    -- TAREA-51: Solo se abonan las comisiones en 'confirmada'. Las 'abonada' (patrocinio al instante) ya están en billetera.
    FOR r_com IN (
        SELECT id, beneficiario_id, tipo, monto_cent, ciclo_id
        FROM comision
        WHERE ciclo_id = p_ciclo_id
          AND monto_cent > 0
          AND (estado = 'confirmada' OR estado IS NULL)
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
      'admin_id', v_admin_id
    );

    INSERT INTO auditoria (
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
        'nuevo_ciclo_id', v_nuevo_ciclo_id,
        'total_abonado_cent', v_total_abonado,
        'cantidad_abonos', v_cant_abonos,
        'nuevo_ciclo_mes', v_nuevo_mes,
        'nuevo_ciclo_anio', v_nuevo_anio
    );
END;
$function$;

-- ---------------------------------------------------------------------
-- 22. FN_DESGLOSE_COMISIONES_SOCIO
-- ---------------------------------------------------------------------
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
      c.estado,
      CASE
        WHEN c.estado IN ('confirmada', 'pagada', 'abonada') THEN true
        ELSE false
      END AS pagado,
      CASE
        WHEN c.estado = 'abonada' THEN 'Ya en tu billetera'
        WHEN c.estado = 'confirmada' THEN 'Se abona al cierre'
        WHEN c.estado = 'retenida' THEN 'Esperando tu activación'
        WHEN c.estado = 'anulada' THEN COALESCE('No se pagó · ' || (c.detalle->>'motivo'), 'No se pagó')
        WHEN c.estado = 'pagada' THEN 'Pagado exitosamente'
        ELSE c.estado
      END AS motivo,
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
      'no_generada' AS estado,
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

  -- 5. Calcular totales (comisiones que se cobran o ya se cobraron: confirmada, pagada, abonada)
  SELECT
    COALESCE(SUM(CASE WHEN estado IN ('confirmada', 'pagada', 'abonada') THEN monto_cent ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'patrocinio' AND estado IN ('confirmada', 'pagada', 'abonada') THEN monto_cent ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'residual' AND estado IN ('confirmada', 'pagada', 'abonada') THEN monto_cent ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'rango' AND estado IN ('confirmada', 'pagada', 'abonada') THEN monto_cent ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE estado IN ('confirmada', 'pagada', 'abonada'))
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

-- ---------------------------------------------------------------------
-- 23. FN_RANGO_LINEAS_SOCIO
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 24. FN_OBTENER_AUDITORIA_ADMIN
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_obtener_auditoria_admin(
    p_pagina INT DEFAULT 1,
    p_limite INT DEFAULT 25,
    p_accion TEXT DEFAULT NULL,
    p_tabla TEXT DEFAULT NULL,
    p_fecha_desde TIMESTAMPTZ DEFAULT NULL,
    p_fecha_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_offset INT;
    v_total BIGINT;
    v_eventos JSONB;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden ver la auditoría.';
    END IF;

    v_offset := (p_pagina - 1) * p_limite;

    SELECT count(*)
      INTO v_total
      FROM auditoria a
     WHERE (p_accion IS NULL OR a.accion = p_accion)
       AND (p_tabla IS NULL OR a.tabla = p_tabla)
       AND (p_fecha_desde IS NULL OR a.creado_en >= p_fecha_desde)
       AND (p_fecha_hasta IS NULL OR a.creado_en <= p_fecha_hasta);

    SELECT jsonb_agg(row_to_json(sub))
      INTO v_eventos
      FROM (
        SELECT a.id, a.usuario_id, a.accion, a.tabla, a.registro_id,
               a.datos_antes, a.datos_despues, a.ip, a.creado_en,
               s.codigo AS socio_codigo,
               s.nombres AS socio_nombres,
               s.apellidos AS socio_apellidos
          FROM auditoria a
          LEFT JOIN socio s ON s.id = a.usuario_id
         WHERE (p_accion IS NULL OR a.accion = p_accion)
           AND (p_tabla IS NULL OR a.tabla = p_tabla)
           AND (p_fecha_desde IS NULL OR a.creado_en >= p_fecha_desde)
           AND (p_fecha_hasta IS NULL OR a.creado_en <= p_fecha_hasta)
         ORDER BY a.creado_en DESC, a.id DESC
         LIMIT p_limite
        OFFSET v_offset
      ) sub;

    RETURN jsonb_build_object(
        'total', v_total,
        'pagina', p_pagina,
        'total_paginas', CEIL(v_total::numeric / p_limite),
        'eventos', COALESCE(v_eventos, '[]'::jsonb)
    );
END;
$$;

-- ---------------------------------------------------------------------
-- 25. RLS_AUTO_ENABLE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stub de seguridad interno idempotente
  NULL;
END;
$$;

-- ---------------------------------------------------------------------
-- 25. FN_OBTENER_SCHEMA_COLUMNAS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_obtener_schema_columnas()
RETURNS TABLE (
  tabla text,
  columna text,
  posicion integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    c.table_name::text AS tabla,
    c.column_name::text AS columna,
    c.ordinal_position::integer AS posicion
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_obtener_schema_columnas() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_obtener_schema_columnas() TO authenticated;

-- ---------------------------------------------------------------------
-- 26. FN_REGISTRAR_PAGO_DIRECTO_SOCIO (TAREA-43)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_pago_directo_socio(
    p_socio_id bigint,
    p_admin_id bigint,
    p_monto_cent bigint,
    p_metodo_pago text,
    p_numero_operacion text DEFAULT NULL,
    p_nota text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_socio record;
    v_ciclo_id bigint;
    v_saldo_actual bigint;
    v_saldo_anterior bigint;
    v_saldo_nuevo bigint;
    v_movimiento_id bigint;
    v_solicitud_id bigint;
    v_concepto text;
    v_metodo_limpio text;
    v_op_limpia text;
    v_nota_limpia text;
    v_datos_antes jsonb;
    v_datos_despues jsonb;
BEGIN
    -- 1. Validar permisos de administrador
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden registrar pagos directos a socios.';
    END IF;

    -- 2. Validar monto positivo
    IF p_monto_cent IS NULL OR p_monto_cent <= 0 THEN
        RAISE EXCEPTION 'El monto a pagar debe ser mayor a cero.';
    END IF;

    -- 3. Bloquear y verificar el socio
    SELECT * INTO v_socio
    FROM public.socio
    WHERE id = p_socio_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Socio con ID % no encontrado.', p_socio_id;
    END IF;

    -- 4. Obtener el ciclo abierto actual
    SELECT id INTO v_ciclo_id
    FROM public.ciclo
    WHERE estado = 'abierto'
    ORDER BY id DESC
    LIMIT 1;

    IF v_ciclo_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún ciclo abierto para registrar el pago.';
    END IF;

    -- 5. Verificar el saldo actual del socio desde v_wallet_saldo
    SELECT COALESCE(saldo_cent, 0) INTO v_saldo_actual
    FROM public.v_wallet_saldo
    WHERE socio_id = p_socio_id;

    IF v_saldo_actual IS NULL THEN
        v_saldo_actual := 0;
    END IF;

    IF p_monto_cent > v_saldo_actual THEN
        RAISE EXCEPTION 'Saldo insuficiente: el socio tiene S/. % disponible pero se intentó pagar S/. %.',
            (v_saldo_actual / 100.0), (p_monto_cent / 100.0);
    END IF;

    -- 6. Obtener el último saldo de la cadena en wallet_movimiento
    SELECT saldo_despues_cent INTO v_saldo_anterior
    FROM public.wallet_movimiento
    WHERE socio_id = p_socio_id
    ORDER BY id DESC
    LIMIT 1;

    IF v_saldo_anterior IS NULL THEN
        v_saldo_anterior := 0;
    END IF;

    -- Cadena de saldo: restar el monto pagado
    v_saldo_nuevo := v_saldo_anterior - p_monto_cent;

    -- 7. Limpiar cadenas de texto
    v_metodo_limpio := COALESCE(NULLIF(trim(p_metodo_pago), ''), 'Transferencia bancaria');
    v_op_limpia := COALESCE(NULLIF(trim(p_numero_operacion), ''), 'S/N');
    v_nota_limpia := COALESCE(NULLIF(trim(p_nota), ''), 'Pago directo realizado por administración');

    v_concepto := 'Pago directo de saldo (' || v_metodo_limpio || ' - OP: ' || v_op_limpia || ')';

    -- 8. Registrar solicitud de retiro automática aprobada (para unificación histórica)
    INSERT INTO public.solicitud_retiro (
        socio_id,
        monto_cent,
        banco,
        cuenta,
        estado,
        motivo_rechazo,
        procesado_por,
        procesado_en,
        solicitado_en
    ) VALUES (
        p_socio_id,
        p_monto_cent,
        v_metodo_limpio,
        v_op_limpia,
        'aprobado',
        NULL, -- TAREA-44: solicitud_retiro no tiene columna de notas; motivo_rechazo es estrictamente NULL en retiros aprobados.
        p_admin_id,
        now(),
        now()
    ) RETURNING id INTO v_solicitud_id;

    -- 9. Insertar fila en wallet_movimiento (monto_cent estrictamente NEGATIVO)
    INSERT INTO public.wallet_movimiento (
        socio_id,
        ciclo_id,
        comision_id,
        tipo,
        concepto,
        monto_cent,
        saldo_despues_cent,
        creado_en
    ) VALUES (
        p_socio_id,
        v_ciclo_id,
        NULL,
        'retiro',
        v_concepto,
        -p_monto_cent,
        v_saldo_nuevo,
        now()
    ) RETURNING id INTO v_movimiento_id;

    -- 10. Registrar auditoría
    v_datos_antes := jsonb_build_object(
        'socio_id', p_socio_id,
        'saldo_anterior_cent', v_saldo_anterior,
        'saldo_disponible_cent', v_saldo_actual
    );
    v_datos_despues := jsonb_build_object(
        'solicitud_id', v_solicitud_id,
        'movimiento_id', v_movimiento_id,
        'monto_pagado_cent', p_monto_cent,
        'saldo_nuevo_cent', v_saldo_nuevo,
        'metodo_pago', v_metodo_limpio,
        'numero_operacion', v_op_limpia,
        'nota', v_nota_limpia
    );

    INSERT INTO public.auditoria (
        usuario_id,
        accion,
        tabla,
        registro_id,
        datos_antes,
        datos_despues,
        ip,
        creado_en
    ) VALUES (
        p_admin_id,
        'PAGO_DIRECTO_SALDO_SOCIO',
        'wallet_movimiento',
        v_movimiento_id,
        v_datos_antes,
        v_datos_despues,
        '127.0.0.1',
        now()
    );

    RETURN jsonb_build_object(
        'exito', true,
        'solicitud_id', v_solicitud_id,
        'movimiento_id', v_movimiento_id,
        'socio_id', p_socio_id,
        'socio_codigo', v_socio.codigo,
        'socio_nombre', v_socio.nombres || ' ' || v_socio.apellidos,
        'monto_cent', p_monto_cent,
        'saldo_anterior_cent', v_saldo_anterior,
        'saldo_nuevo_cent', v_saldo_nuevo,
        'concepto', v_concepto
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_registrar_pago_directo_socio FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_registrar_pago_directo_socio TO authenticated;



-- =====================================================================
-- TAREA-45: FUNCIONES POSTGRESQL PARA CIERRE ATÓMICO Y GESTIÓN DE PRODUCTOS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FN_CALCULAR_Y_PERSISTIR_RANGOS
-- ---------------------------------------------------------------------
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

  -- 3. Cargar configuración de línea estirada y umbral de activación (TAREA-49 Corrección A)
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

  -- Tabla temporal de ramas frontales del ciclo para optimizar cálculo
  DROP TABLE IF EXISTS temp_ramas_ciclo;
  CREATE TEMP TABLE temp_ramas_ciclo ON COMMIT DROP AS
  SELECT
    f.patrocinador_id AS socio_id,
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
  WHERE f.patrocinador_id IS NOT NULL
  GROUP BY f.patrocinador_id, f.id, act.activo, act.puntos_personales;

  CREATE INDEX ON temp_ramas_ciclo(socio_id);

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

    -- Métricas de ramas frontales
    SELECT
      COALESCE(SUM(puntos_totales_rama), 0),
      COALESCE(MAX(puntos_totales_rama), 0),
      COALESCE(COUNT(*) FILTER (WHERE activo = true), 0)
    INTO v_puntos_grupales, v_puntos_linea_mayor, v_frontales_activos
    FROM temp_ramas_ciclo
    WHERE socio_id = v_socio.id;

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
