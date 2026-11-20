-- =============================================================================
-- TAREA-74 · MARCAR COMISIÓN COMO 'ABONADA' EN EL CIERRE DE CICLO
-- Reglas de negocio: RF-419 / RF-421 / RF-379
--
-- Al insertar cada abono en wallet_movimiento durante el cierre de ciclo,
-- la comisión correspondiente debe actualizarse de estado 'confirmada' a 'abonada'.
-- NO afecta retroactivamente comisiones de ciclos cerrados previos (ciclos 1 y 2).
-- =============================================================================

DROP FUNCTION IF EXISTS public.fn_ejecutar_cierre_ciclo(bigint);
DROP FUNCTION IF EXISTS public.fn_ejecutar_cierre_ciclo(bigint, bigint);
DROP FUNCTION IF EXISTS public.fn_ejecutar_cierre_ciclo(bigint, bigint, boolean);

CREATE OR REPLACE FUNCTION public.fn_ejecutar_cierre_ciclo(
  p_ciclo_id bigint,
  p_admin_id bigint DEFAULT NULL::bigint,
  p_forzar boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
    v_cant_pendientes INT := 0;
    v_techo_patrocinio BIGINT := 0;
    v_techo_residual BIGINT := 0;
    v_techo_rango BIGINT := 0;
    v_calc_patrocinio BIGINT := 0;
    v_calc_residual BIGINT := 0;
    v_calc_rango BIGINT := 0;
BEGIN
    -- 1. Validar permisos de administrador (compatible con SQL Editor, service_role y JWT admin)
    IF auth.jwt() IS NOT NULL
       AND COALESCE(auth.jwt()->>'role', '') <> 'service_role'
       AND NOT public.fn_is_admin() THEN
      RAISE EXCEPTION 'Acceso denegado: solo administradores pueden ejecutar el cierre de ciclo.';
    END IF;

    IF v_admin_id IS NULL AND auth.jwt() IS NOT NULL THEN
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
    SELECT * INTO v_ciclo FROM public.ciclo WHERE id = p_ciclo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ciclo % no existe.', p_ciclo_id;
    END IF;

    IF v_ciclo.estado <> 'abierto' THEN
        RAISE EXCEPTION 'El ciclo % ya se encuentra cerrado o no está en estado abierto.', p_ciclo_id;
    END IF;

    -- 🔴 BLOQUE 1 (TAREA-62): Guarda de fecha fin en huso horario America/Lima (RF-508)
    IF NOT p_forzar AND (now() AT TIME ZONE 'America/Lima')::date < v_ciclo.fecha_fin THEN
      RAISE EXCEPTION 'No se puede cerrar el ciclo %/%: termina el %. Hoy es %.',
        v_ciclo.mes, v_ciclo.anio, v_ciclo.fecha_fin,
        (now() AT TIME ZONE 'America/Lima')::date;
    END IF;

    -- =========================================================================
    -- 🔴 BLOQUE 2 (TAREA-67): GUARDA DE PEDIDOS PENDIENTES (RF-371)
    -- =========================================================================
    IF NOT p_forzar THEN
      SELECT COUNT(*) INTO v_cant_pendientes
      FROM public.orden
      WHERE ciclo_id = p_ciclo_id
        AND estado = 'por_confirmar';

      IF v_cant_pendientes > 0 THEN
        RAISE EXCEPTION 'Bloqueo RF-371: No se puede cerrar el ciclo %: existen % pedido(s) pendiente(s) de confirmación. Confírmelos o rechácelos antes de cerrar.',
          p_ciclo_id, v_cant_pendientes;
      END IF;
    END IF;

    -- 🔴 BLOQUE 3 (TAREA-63 / TAREA-66): Conectar el motor de rango al cierre (RF-451, RF-482)
    -- 1. Calcular y persistir los rangos y generar comisiones de rango en estado 'confirmada'
    PERFORM public.fn_calcular_y_persistir_rangos(p_ciclo_id, false);

    -- 2. RESOLVER COMISIONES RETENIDAS DEL CICLO (TAREA-49)
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

    -- =========================================================================
    -- 🔴 BLOQUE 4 (TAREA-67): GUARDA DE TECHOS TEÓRICOS FINANCIEROS (RF-376 / RF-484 / RF-485)
    -- =========================================================================
    IF NOT p_forzar THEN
      -- Techo Patrocinio: 41.7% si Kit Emprendedor, 30.8% otros packs
      SELECT COALESCE(SUM(
        ROUND(o.total_cent * (CASE WHEN p.codigo = 'EMPRENDEDOR' THEN 0.417 ELSE 0.308 END))
      ), 0)::bigint
      INTO v_techo_patrocinio
      FROM public.orden o
      LEFT JOIN public.pack p ON p.id = o.pack_id
      WHERE o.ciclo_id = p_ciclo_id
        AND o.tipo = 'afiliacion'
        AND o.estado IN ('confirmada', 'pagada');

      -- Techo Residual: 97% de los puntos de recompra
      SELECT COALESCE(SUM(
        ROUND(o.puntos_total * 100 * 0.97)
      ), 0)::bigint
      INTO v_techo_residual
      FROM public.orden o
      WHERE o.ciclo_id = p_ciclo_id
        AND o.tipo = 'recompra'
        AND o.estado IN ('confirmada', 'pagada');

      -- Techo Rango: suma de bonos nominales de rangos calificados
      SELECT COALESCE(SUM(bono_cent), 0)::bigint
      INTO v_techo_rango
      FROM public.rango_ciclo
      WHERE ciclo_id = p_ciclo_id
        AND califica = true;

      -- Comisiones calculadas del ciclo
      SELECT COALESCE(SUM(monto_cent), 0)::bigint
      INTO v_calc_patrocinio
      FROM public.comision
      WHERE ciclo_id = p_ciclo_id
        AND tipo = 'patrocinio'
        AND estado IN ('confirmada', 'abonada');

      SELECT COALESCE(SUM(monto_cent), 0)::bigint
      INTO v_calc_residual
      FROM public.comision
      WHERE ciclo_id = p_ciclo_id
        AND tipo = 'residual'
        AND estado = 'confirmada';

      SELECT COALESCE(SUM(monto_cent), 0)::bigint
      INTO v_calc_rango
      FROM public.comision
      WHERE ciclo_id = p_ciclo_id
        AND tipo = 'rango'
        AND estado = 'confirmada';

      -- Validaciones de bloqueo con excepciones claras (solo si el techo teórico es positivo)
      IF v_techo_patrocinio > 0 AND v_calc_patrocinio > v_techo_patrocinio THEN
        RAISE EXCEPTION 'Bloqueo RF-376: El bono de patrocinio (S/. %) excede el techo teórico permitido (S/. %). Cierre cancelado por seguridad financiera.',
          to_char(v_calc_patrocinio / 100.0, 'FM999,999,990.00'),
          to_char(v_techo_patrocinio / 100.0, 'FM999,999,990.00');
      END IF;

      IF v_techo_residual > 0 AND v_calc_residual > v_techo_residual THEN
        RAISE EXCEPTION 'Bloqueo RF-376: El bono residual (S/. %) excede el techo teórico permitido (S/. %). Cierre cancelado por seguridad financiera.',
          to_char(v_calc_residual / 100.0, 'FM999,999,990.00'),
          to_char(v_techo_residual / 100.0, 'FM999,999,990.00');
      END IF;

      IF v_techo_rango > 0 AND v_calc_rango > v_techo_rango THEN
        RAISE EXCEPTION 'Bloqueo RF-376: El bono de rango (S/. %) excede la suma autorizada de calificaciones (S/. %). Cierre cancelado por seguridad financiera.',
          to_char(v_calc_rango / 100.0, 'FM999,999,990.00'),
          to_char(v_techo_rango / 100.0, 'FM999,999,990.00');
      END IF;
    END IF;

    -- Calcular comisiones a abonar en este cierre (solo 'confirmada', 'abonada' ya fue abonada)
    SELECT COALESCE(SUM(monto_cent), 0) INTO v_total_comisiones_a_abonar
    FROM public.comision
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
    UPDATE public.ciclo
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
        FROM public.comision
        WHERE ciclo_id = p_ciclo_id
          AND monto_cent > 0
          AND (estado = 'confirmada' OR estado IS NULL)
        ORDER BY id ASC
    ) LOOP
        -- Obtener el saldo acumulado actual del socio
        SELECT COALESCE(saldo_despues_cent, 0) INTO v_saldo_previo
        FROM public.wallet_movimiento
        WHERE socio_id = r_com.beneficiario_id
        ORDER BY id DESC
        LIMIT 1;

        IF v_saldo_previo IS NULL THEN
            v_saldo_previo := 0;
        END IF;

        v_nuevo_saldo := v_saldo_previo + r_com.monto_cent;

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
            r_com.beneficiario_id,
            p_ciclo_id,
            r_com.id,
            'abono',
            'Bono de ' || r_com.tipo || ', ciclo ' || p_ciclo_id,
            r_com.monto_cent,
            v_nuevo_saldo,
            now()
        );

        -- RF-419 / RF-421: Marcar la comisión como abonada al generar el abono en billetera
        UPDATE public.comision
           SET estado = 'abonada'
         WHERE id = r_com.id;

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
    IF EXISTS (SELECT 1 FROM public.ciclo WHERE estado = 'abierto') THEN
        RAISE EXCEPTION 'Inconsistencia: ya existe otro ciclo abierto.';
    END IF;

    INSERT INTO public.ciclo (anio, mes, fecha_inicio, fecha_fin, estado)
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
      'admin_id', v_admin_id,
      'forzado', p_forzar
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
        'nuevo_ciclo_anio', v_nuevo_anio,
        'forzado', p_forzar
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo(bigint, bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo(bigint, bigint, boolean) TO authenticated;
