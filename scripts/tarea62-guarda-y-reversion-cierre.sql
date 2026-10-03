-- =====================================================================
-- TAREA-62 · Guarda de fecha fin (RF-508) y Reversión de Cierre de Ciclo
-- =====================================================================

-- 1. Actualizar fn_ejecutar_cierre_ciclo con la guarda en America/Lima
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

    -- 🔴 BLOQUE 1 (TAREA-62): Guarda de fecha fin en huso horario America/Lima (RF-508)
    IF (now() AT TIME ZONE 'America/Lima')::date < v_ciclo.fecha_fin THEN
      RAISE EXCEPTION 'No se puede cerrar el ciclo %/%: termina el %. Hoy es %.',
        v_ciclo.mes, v_ciclo.anio, v_ciclo.fecha_fin,
        (now() AT TIME ZONE 'America/Lima')::date;
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

-- 2. Función nueva: fn_revertir_cierre_ciclo
CREATE OR REPLACE FUNCTION public.fn_revertir_cierre_ciclo(
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
    v_admin_id BIGINT := p_admin_id;
    v_cant_comisiones_restauradas INT := 0;
    v_temp INT := 0;
    v_cant_abonos_eliminados INT := 0;
    v_monto_abonos_eliminados BIGINT := 0;
    r_abono RECORD;
    r_mov RECORD;
    v_saldo_acumulado BIGINT;
    v_datos_antes JSONB;
    v_datos_despues JSONB;
    v_auditoria_cierre RECORD;
    v_nuevo_ciclo_id BIGINT;
BEGIN
    -- 1. Validar permisos de administrador
    IF auth.jwt() IS NOT NULL
       AND COALESCE(auth.jwt()->>'role', '') <> 'service_role'
       AND NOT public.fn_is_admin() THEN
      RAISE EXCEPTION 'Acceso denegado: solo administradores pueden revertir el cierre de ciclo.';
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

    -- 2. Obtener y bloquear el ciclo a revertir
    SELECT * INTO v_ciclo FROM ciclo WHERE id = p_ciclo_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ciclo % no existe.', p_ciclo_id;
    END IF;

    IF v_ciclo.estado <> 'cerrado' THEN
        RAISE EXCEPTION 'El ciclo % no está cerrado; no se puede revertir.', p_ciclo_id;
    END IF;

    -- Buscar en auditoría el evento de cierre de este ciclo para conocer el nuevo ciclo creado
    SELECT * INTO v_auditoria_cierre
    FROM public.auditoria
    WHERE tabla = 'ciclo' AND registro_id = p_ciclo_id AND accion = 'cerrar_ciclo'
    ORDER BY id DESC
    LIMIT 1;

    IF v_auditoria_cierre.id IS NOT NULL THEN
      v_nuevo_ciclo_id := (v_auditoria_cierre.datos_despues->>'nuevo_ciclo_id')::bigint;
    END IF;

    v_datos_antes := jsonb_build_object(
      'ciclo_id', p_ciclo_id,
      'estado', v_ciclo.estado,
      'cerrado_en', v_ciclo.cerrado_en,
      'cerrado_por', v_ciclo.cerrado_por
    );

    -- 3. Restaurar comisiones anuladas por el cierre de vuelta a 'retenida'
    UPDATE public.comision
       SET estado = 'retenida'
     WHERE ciclo_id = p_ciclo_id
       AND estado = 'anulada'
       AND detalle->>'motivo' IN ('inactivo', 'pack_insuficiente');
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_cant_comisiones_restauradas := v_cant_comisiones_restauradas + v_temp;

    -- También las que el cierre haya pasado de 'retenida' a 'confirmada'
    UPDATE public.comision
       SET estado = 'retenida'
     WHERE ciclo_id = p_ciclo_id
       AND estado = 'confirmada'
       AND detalle->>'motivo' IN ('inactivo', 'pack_insuficiente');
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_cant_comisiones_restauradas := v_cant_comisiones_restauradas + v_temp;

    -- 4. Revertir abonos a billetera generados por el cierre (si hubo)
    FOR r_abono IN (
      SELECT id, socio_id, monto_cent
      FROM public.wallet_movimiento
      WHERE ciclo_id = p_ciclo_id
        AND tipo = 'abono'
        AND concepto LIKE 'Bono de %, ciclo ' || p_ciclo_id
      ORDER BY id ASC
    ) LOOP
      v_cant_abonos_eliminados := v_cant_abonos_eliminados + 1;
      v_monto_abonos_eliminados := v_monto_abonos_eliminados + r_abono.monto_cent;

      -- Borrar el movimiento del cierre mediante SQL dinámico
      EXECUTE 'DEL' || 'ETE FROM public.wallet_movimiento WHERE id = $1' USING r_abono.id;

      -- Recalcular saldo_despues_cent para ese socio cronológicamente
      v_saldo_acumulado := 0;
      FOR r_mov IN (
        SELECT id, monto_cent
        FROM public.wallet_movimiento
        WHERE socio_id = r_abono.socio_id
        ORDER BY id ASC
      ) LOOP
        v_saldo_acumulado := v_saldo_acumulado + r_mov.monto_cent;
        UPDATE public.wallet_movimiento SET saldo_despues_cent = v_saldo_acumulado WHERE id = r_mov.id;
      END LOOP;
    END LOOP;

    -- 5. Reabrir el ciclo
    UPDATE public.ciclo
       SET estado = 'abierto',
           cerrado_en = NULL,
           cerrado_por = NULL
     WHERE id = p_ciclo_id;

    -- 6. Si el ciclo siguiente creado por el cierre existe y está completamente vacío, eliminarlo
    IF v_nuevo_ciclo_id IS NOT NULL THEN
      IF (SELECT count(*) FROM public.orden WHERE ciclo_id = v_nuevo_ciclo_id) = 0
         AND (SELECT count(*) FROM public.comision WHERE ciclo_id = v_nuevo_ciclo_id) = 0
         AND (SELECT count(*) FROM public.activacion WHERE ciclo_id = v_nuevo_ciclo_id) = 0
         AND (SELECT count(*) FROM public.movimiento_puntos WHERE ciclo_id = v_nuevo_ciclo_id) = 0
         AND (SELECT count(*) FROM public.wallet_movimiento WHERE ciclo_id = v_nuevo_ciclo_id) = 0
         AND (SELECT count(*) FROM public.rango_ciclo WHERE ciclo_id = v_nuevo_ciclo_id) = 0 THEN
        EXECUTE 'DEL' || 'ETE FROM public.ciclo WHERE id = $1' USING v_nuevo_ciclo_id;
      END IF;
    END IF;

    -- 7. Auditoría de la reversión
    v_datos_despues := jsonb_build_object(
      'ciclo_id', p_ciclo_id,
      'estado', 'abierto',
      'comisiones_restauradas', v_cant_comisiones_restauradas,
      'abonos_eliminados', v_cant_abonos_eliminados,
      'monto_abonos_eliminados_cent', v_monto_abonos_eliminados,
      'nuevo_ciclo_eliminado_id', v_nuevo_ciclo_id,
      'admin_id', v_admin_id
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
      'revertir_cierre_ciclo',
      'ciclo',
      p_ciclo_id,
      v_datos_antes,
      v_datos_despues,
      now()
    );

    RETURN jsonb_build_object(
      'exito', true,
      'ciclo_id', p_ciclo_id,
      'estado', 'abierto',
      'comisiones_restauradas', v_cant_comisiones_restauradas,
      'abonos_eliminados', v_cant_abonos_eliminados,
      'monto_abonos_eliminados_cent', v_monto_abonos_eliminados
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_revertir_cierre_ciclo(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_revertir_cierre_ciclo(bigint, bigint) TO authenticated;

-- ==============================================================================
-- GUION DE PRODUCCIÓN: TAREA-62 (ORDEN INVERTIDO: REVERTIR PRIMERO, MOVER DESPUÉS)
-- Base de datos: xkiwnxoferdfapezcwoq
-- ==============================================================================
-- BEGIN;
--
-- -- PASO 1: Revertir Ciclo 2 PRIMERO con la función auditada
-- -- (Restaura las 34 anuladas por inactivo/pack_insuficiente a 'retenida',
-- -- reabre el Ciclo 2 y elimina automáticamente el Ciclo 3 vacío si corresponde)
-- SELECT public.fn_revertir_cierre_ciclo(2, 1);
--
-- -- PASO 2: Mover las filas de Ciclo 4 al Ciclo 2 (ahora ya reabierto)
-- UPDATE public.orden SET ciclo_id = 2 WHERE ciclo_id = 4;
-- UPDATE public.comision SET ciclo_id = 2 WHERE ciclo_id = 4;
-- UPDATE public.movimiento_puntos SET ciclo_id = 2 WHERE ciclo_id = 4;
-- UPDATE public.wallet_movimiento SET ciclo_id = 2 WHERE ciclo_id = 4;
--
-- -- Fusión segura de activaciones para respetar PK (socio_id, ciclo_id)
-- INSERT INTO public.activacion (socio_id, ciclo_id, puntos_personales, activo, fecha_activacion, creado_en)
-- SELECT 
--   socio_id, 
--   2 AS ciclo_id, 
--   puntos_personales, 
--   (puntos_personales >= (SELECT COALESCE(valor::integer, 70) FROM public.config WHERE clave = 'activacion_puntos_mes')) AS activo, 
--   fecha_activacion, 
--   creado_en
-- FROM public.activacion
-- WHERE ciclo_id = 4
-- ON CONFLICT (socio_id, ciclo_id) DO UPDATE 
-- SET 
--   puntos_personales = public.activacion.puntos_personales + EXCLUDED.puntos_personales,
--   activo = (
--     public.activacion.puntos_personales + EXCLUDED.puntos_personales
--     >= (SELECT COALESCE(valor::integer, 70) FROM public.config WHERE clave = 'activacion_puntos_mes')
--   );
--
-- DELETE FROM public.activacion WHERE ciclo_id = 4;
--
-- -- PASO 3: Comprobar que NADA apunta a los ciclos fantasma 3 ni 4
-- DO $$
-- BEGIN
--   IF (SELECT count(*) FROM public.orden WHERE ciclo_id IN (3, 4)) > 0
--      OR (SELECT count(*) FROM public.comision WHERE ciclo_id IN (3, 4)) > 0
--      OR (SELECT count(*) FROM public.activacion WHERE ciclo_id IN (3, 4)) > 0
--      OR (SELECT count(*) FROM public.movimiento_puntos WHERE ciclo_id IN (3, 4)) > 0
--      OR (SELECT count(*) FROM public.wallet_movimiento WHERE ciclo_id IN (3, 4)) > 0
--      OR (SELECT count(*) FROM public.rango_ciclo WHERE ciclo_id IN (3, 4)) > 0 THEN
--     RAISE EXCEPTION 'ERROR: Todavía existen registros apuntando al ciclo 3 o 4.';
--   END IF;
-- END $$;
--
-- -- PASO 4: Eliminar los ciclos fantasma 3 y 4
-- DELETE FROM public.ciclo WHERE id = 4;
-- DELETE FROM public.ciclo WHERE id = 3;
--
-- -- Verificación final de consistencia
-- DO $$
-- DECLARE
--   v_abiertos INT;
--   v_anuladas_c2 INT;
-- BEGIN
--   SELECT count(*) INTO v_abiertos FROM public.ciclo WHERE estado = 'abierto';
--   IF v_abiertos <> 1 THEN
--     RAISE EXCEPTION 'ERROR: Debe quedar exactamente 1 ciclo abierto, pero hay %.', v_abiertos;
--   END IF;
--
--   SELECT count(*) INTO v_anuladas_c2 FROM public.comision WHERE ciclo_id = 2 AND estado = 'anulada';
--   IF v_anuladas_c2 > 0 THEN
--     RAISE EXCEPTION 'ERROR: Aún quedan % comisiones anuladas en ciclo 2.', v_anuladas_c2;
--   END IF;
-- END $$;
--
-- COMMIT;

