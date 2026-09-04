-- =========================================================================
-- TAREA-15: FUNCIONES SQL PARA EL FLUJO COMPLETO DE RETIROS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.fn_aprobar_solicitud_retiro(
    p_solicitud_id bigint,
    p_admin_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_solicitud record;
    v_ciclo_id bigint;
    v_saldo_actual bigint;
    v_saldo_anterior bigint;
    v_saldo_nuevo bigint;
    v_movimiento_id bigint;
BEGIN
    -- 1. Validar permisos de administrador
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden aprobar retiros.';
    END IF;

    -- 2. Bloquear y verificar la solicitud
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

    -- 3. Obtener el ciclo abierto actual
    SELECT id INTO v_ciclo_id
    FROM public.ciclo
    WHERE estado = 'abierto'
    ORDER BY id DESC
    LIMIT 1;

    IF v_ciclo_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún ciclo abierto para registrar el retiro.';
    END IF;

    -- 4. Verificar el saldo actual del socio desde v_wallet_saldo
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

    -- 5. Obtener el último saldo de la cadena en wallet_movimiento
    SELECT saldo_despues_cent INTO v_saldo_anterior
    FROM public.wallet_movimiento
    WHERE socio_id = v_solicitud.socio_id
    ORDER BY id DESC
    LIMIT 1;

    IF v_saldo_anterior IS NULL THEN
        v_saldo_anterior := 0;
    END IF;

    -- Cadena de saldo: restar el monto solicitado
    v_saldo_nuevo := v_saldo_anterior - v_solicitud.monto_cent;

    -- 6. Insertar fila en wallet_movimiento (monto_cent estrictamente NEGATIVO)
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

    -- 7. Actualizar la solicitud de retiro a 'aprobado'
    UPDATE public.solicitud_retiro
       SET estado = 'aprobado',
           procesado_por = p_admin_id,
           procesado_en = now()
     WHERE id = p_solicitud_id;

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
$$;

CREATE OR REPLACE FUNCTION public.fn_rechazar_solicitud_retiro(
    p_solicitud_id bigint,
    p_admin_id bigint,
    p_motivo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_solicitud record;
BEGIN
    -- 1. Validar permisos de administrador
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden rechazar retiros.';
    END IF;

    -- 2. Validar que el motivo sea obligatorio
    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de rechazo es obligatorio.';
    END IF;

    -- 3. Bloquear y verificar la solicitud
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

    -- 4. Actualizar solicitud de retiro (NO se toca wallet_movimiento)
    UPDATE public.solicitud_retiro
       SET estado = 'rechazado',
           motivo_rechazo = trim(p_motivo),
           procesado_por = p_admin_id,
           procesado_en = now()
     WHERE id = p_solicitud_id;

    RETURN jsonb_build_object(
        'exito', true,
        'solicitud_id', p_solicitud_id,
        'estado', 'rechazado',
        'motivo', trim(p_motivo)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_aprobar_solicitud_retiro FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_rechazar_solicitud_retiro FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_aprobar_solicitud_retiro TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rechazar_solicitud_retiro TO authenticated;
