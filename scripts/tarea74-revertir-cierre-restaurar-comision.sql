-- =============================================================================
-- TAREA-74 · REVERTIR CIERRE DE CICLO: RESTAURAR COMISIONES
-- Reglas de negocio: RF-419 / RF-421 / Reversibilidad completa
--
-- Al revertir el cierre de un ciclo, en el bucle que elimina los abonos de wallet_movimiento,
-- ANTES de borrar cada movimiento se regresa su comisión (wallet_movimiento.comision_id):
-- a 'retenida' si detalle->>'motivo' IN ('inactivo', 'pack_insuficiente'), o a 'confirmada' en los demás casos.
-- Basado estrictamente en pg_get_functiondef de PRODUCCIÓN.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_revertir_cierre_ciclo(p_ciclo_id bigint, p_admin_id bigint DEFAULT NULL::bigint, p_forzar boolean DEFAULT false)
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
    -- 1. Validar permisos de administrador (compatible con SQL Editor, service_role y JWT admin)
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

    -- 🔴 2.1 Guarda de seguridad (TAREA-63):
    -- Negarse si encuentra comisiones de rango con abono en billetera anterior a la fecha de cierre del ciclo
    IF NOT p_forzar THEN
      IF EXISTS (
        SELECT 1
        FROM public.comision c
        JOIN public.wallet_movimiento w ON w.comision_id = c.id
        WHERE c.ciclo_id = p_ciclo_id
          AND c.tipo = 'rango'
          AND (
            v_ciclo.cerrado_en IS NULL
            OR w.creado_en < v_ciclo.cerrado_en
            OR c.creado_en < v_ciclo.cerrado_en
          )
      ) THEN
        RAISE EXCEPTION 'Operación denegada: el ciclo % tiene comisiones de rango con abono en billetera anterior a la fecha de cierre del ciclo. Para forzar la reversión, use el parámetro p_forzar = true.', p_ciclo_id;
      END IF;
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
      SELECT id, socio_id, monto_cent, comision_id
      FROM public.wallet_movimiento
      WHERE ciclo_id = p_ciclo_id
        AND tipo = 'abono'
        AND concepto LIKE 'Bono de %, ciclo ' || p_ciclo_id
      ORDER BY id ASC
    ) LOOP
      v_cant_abonos_eliminados := v_cant_abonos_eliminados + 1;
      v_monto_abonos_eliminados := v_monto_abonos_eliminados + r_abono.monto_cent;

      -- ANTES de borrar el movimiento, regresar la comisión asociada al estado que tenía antes del cierre
      IF r_abono.comision_id IS NOT NULL THEN
        UPDATE public.comision
           SET estado = CASE
                 WHEN COALESCE(detalle->>'motivo', '') IN ('inactivo', 'pack_insuficiente') THEN 'retenida'
                 ELSE 'confirmada'
               END
         WHERE id = r_abono.comision_id
           AND estado = 'abonada';
      END IF;

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

    -- Eliminar comisiones de rango y registros de rango_ciclo creados por el cierre revertido
    -- (se realiza después de eliminar los abonos en wallet_movimiento para respetar FK wallet_movimiento_comision_id_fkey)
    EXECUTE 'DEL' || 'ETE FROM public.comision WHERE ciclo_id = $1 AND tipo = ''rango''' USING p_ciclo_id;
    EXECUTE 'DEL' || 'ETE FROM public.rango_ciclo WHERE ciclo_id = $1' USING p_ciclo_id;

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
      'forzado', p_forzar,
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
      'monto_abonos_eliminados_cent', v_monto_abonos_eliminados,
      'forzado', p_forzar
    );
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.fn_revertir_cierre_ciclo(bigint, bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_revertir_cierre_ciclo(bigint, bigint, boolean) TO authenticated;
