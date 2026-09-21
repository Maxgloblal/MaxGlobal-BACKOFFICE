-- =========================================================================
-- TAREA-44: CORRECCIÓN DE PERMISOS EN PRODUCCIÓN E INSTALACIÓN DE FUNCIÓN
-- Base de datos: PRODUCCIÓN (xkiwnxoferdfapezcwoq) / DEMO (utlohnidkuvxqppmoevj)
-- Fecha: 17 de septiembre de 2026
-- =========================================================================

-- -------------------------------------------------------------------------
-- PASO 1: REVOCACIÓN DE PERMISOS EN TABLAS DE DINERO Y AUDITORÍA
-- -------------------------------------------------------------------------
REVOKE UPDATE, DELETE, TRUNCATE, INSERT ON public.wallet_movimiento FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, INSERT ON public.comision          FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE                ON public.auditoria  FROM authenticated;

GRANT  SELECT ON public.wallet_movimiento TO authenticated;
GRANT  SELECT ON public.comision          TO authenticated;
GRANT  SELECT, INSERT ON public.auditoria TO authenticated;

-- -------------------------------------------------------------------------
-- PASO 2: INSTALACIÓN ATÓMICA DE FN_REGISTRAR_PAGO_DIRECTO_SOCIO
-- -------------------------------------------------------------------------
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

    -- 3. Bloquear y verificar el socio (FOR UPDATE)
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

    -- 8. Registrar solicitud de retiro automática aprobada (para unificación histórica en P-30 y P-19)
    -- NOTA TAREA-44: solicitud_retiro no tiene columna 'nota'; motivo_rechazo debe ser NULL para pagos aprobados.
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
        NULL,
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

    -- 10. Registrar auditoría contable (la nota contable se preserva en datos_despues)
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

COMMENT ON FUNCTION public.fn_registrar_pago_directo_socio IS 'TAREA-43/44: Permite al admin transferir y debitar saldo de billetera a un socio en cualquier momento con candados contables';

-- -------------------------------------------------------------------------
-- PASO 3: CONSULTAS DE VERIFICACIÓN POST-EJECUCIÓN
-- -------------------------------------------------------------------------
SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND table_name IN ('wallet_movimiento', 'comision', 'auditoria')
GROUP BY table_name, grantee
ORDER BY table_name;

SELECT proname, prosecdef, pg_get_function_identity_arguments(p.oid) AS argumentos
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname = 'fn_registrar_pago_directo_socio';
