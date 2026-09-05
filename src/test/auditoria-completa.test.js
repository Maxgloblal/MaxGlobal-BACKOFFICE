import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  confirmarPagoOrden,
  rechazarPagoOrden,
  aprobarSolicitudRetiro,
  rechazarSolicitudRetiro,
  actualizarParametroConfig,
  guardarRangoConfig
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-19 · Auditoría Completa del Sistema', () => {
  let sbAdmin;
  let sbAna;

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-audit', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // 2. Socio Ana autenticada (socio 2)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-audit', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);
  });

  afterAll(async () => {
    // Asegurar restauración de días hasta pago a su valor original '3'
    try {
      await actualizarParametroConfig('dias_hasta_pago', '3', sbAdmin);
    } catch (e) {
      console.warn('Error restaurando dias_hasta_pago:', e.message);
    }
  });

  // PRUEBA 1
  it('1 · Confirmar un pago deja UNA fila con accion=\'confirmar_pago\' y el id de la orden', async () => {
    const codOrden = 'ORD-A19-' + Math.floor(Math.random() * 90000 + 10000);
    const numOp = 'OP-A19-' + Math.floor(Math.random() * 90000 + 10000);
    let ordenId = null;

    try {
      const { data: ord, error: errOrd } = await sbAdmin
        .from('orden')
        .insert({
          codigo: codOrden,
          socio_id: 2,
          ciclo_id: 6,
          tipo: 'recompra',
          tipo_venta: 'socio',
          pack_id: 1,
          subtotal_cent: 15000,
          descuento_cent: 0,
          total_cent: 15000,
          puntos_total: 0,
          estado: 'por_confirmar'
        })
        .select('*')
        .single();

      if (errOrd) throw errOrd;
      ordenId = ord.id;

      const { error: errVouch } = await sbAdmin.from('voucher').insert({
        orden_id: ordenId,
        banco: 'BCP',
        numero_operacion: numOp,
        monto_cent: 15000,
        fecha_deposito: '2026-09-04',
        estado: 'subido'
      });
      if (errVouch) throw errVouch;

      // Ejecutar confirmación
      const resConf = await confirmarPagoOrden(ordenId, [], sbAdmin);
      expect(resConf.exito).toBe(true);

      // Verificar en la bitácora de auditoría
      const { data: audRows, error: errAud } = await sbAdmin
        .from('auditoria')
        .select('*')
        .eq('accion', 'confirmar_pago')
        .eq('registro_id', ordenId);

      if (errAud) throw errAud;

      expect(audRows.length).toBe(1);
      const aud = audRows[0];
      expect(aud.usuario_id).toBe(1);
      expect(aud.tabla).toBe('orden');
      expect(aud.registro_id).toBe(ordenId);
      expect(aud.datos_antes.estado).toBe('por_confirmar');
      expect(aud.datos_despues.estado).toBe('confirmada');
    } finally {
      if (ordenId) {
        await sbAdmin.from('voucher').delete().eq('orden_id', ordenId);
        await sbAdmin.from('orden').delete().eq('id', ordenId);
      }
    }
  });

  // PRUEBA 2
  it('2 · Rechazar un pago guarda el MOTIVO en datos_despues', async () => {
    const codOrden = 'ORD-R19-' + Math.floor(Math.random() * 90000 + 10000);
    const numOp = 'OP-R19-' + Math.floor(Math.random() * 90000 + 10000);
    let ordenId = null;

    try {
      const { data: ord, error: errOrd } = await sbAdmin
        .from('orden')
        .insert({
          codigo: codOrden,
          socio_id: 2,
          ciclo_id: 6,
          tipo: 'recompra',
          tipo_venta: 'socio',
          pack_id: 1,
          subtotal_cent: 10000,
          descuento_cent: 0,
          total_cent: 10000,
          puntos_total: 0,
          estado: 'por_confirmar'
        })
        .select('*')
        .single();

      if (errOrd) throw errOrd;
      ordenId = ord.id;

      await sbAdmin.from('voucher').insert({
        orden_id: ordenId,
        banco: 'Interbank',
        numero_operacion: numOp,
        monto_cent: 10000,
        fecha_deposito: '2026-09-04',
        estado: 'subido'
      });

      const motivoPrueba = 'Comprobante adulterado o depósito no habido en cuenta';
      const resRech = await rechazarPagoOrden(ordenId, motivoPrueba, sbAdmin);
      expect(resRech.exito).toBe(true);

      const { data: audRows, error: errAud } = await sbAdmin
        .from('auditoria')
        .select('*')
        .eq('accion', 'rechazar_pago')
        .eq('registro_id', ordenId);

      if (errAud) throw errAud;

      expect(audRows.length).toBe(1);
      const aud = audRows[0];
      expect(aud.usuario_id).toBe(1);
      expect(aud.tabla).toBe('orden');
      expect(aud.datos_despues.motivo).toBe(motivoPrueba);
    } finally {
      if (ordenId) {
        await sbAdmin.from('voucher').delete().eq('orden_id', ordenId);
        await sbAdmin.from('orden').delete().eq('id', ordenId);
      }
    }
  });

  // PRUEBA 3
  it('3 · Cerrar un ciclo deja su fila con el total abonado', async () => {
    const testCicloId = 9100 + Math.floor(Math.random() * 800);
    let nuevoCicloId = null;

    await sbAdmin.from('ciclo').update({ estado: 'en_espera' }).eq('id', 6);

    try {
      const { error: errCDummy } = await sbAdmin
        .from('ciclo')
        .insert({
          id: testCicloId,
          anio: 2029,
          mes: 1,
          fecha_inicio: '2029-01-01',
          fecha_fin: '2029-01-31',
          estado: 'abierto'
        });

      if (errCDummy) throw errCDummy;

      const { data: resCierre, error: errCierre } = await sbAdmin.rpc('fn_ejecutar_cierre_ciclo', {
        p_ciclo_id: testCicloId,
        p_admin_id: 1
      });

      if (errCierre) throw errCierre;
      nuevoCicloId = resCierre.nuevo_ciclo_id;
      expect(resCierre.exito).toBe(true);

      // Verificar fila en auditoría
      const { data: audRows, error: errAud } = await sbAdmin
        .from('auditoria')
        .select('*')
        .eq('accion', 'cerrar_ciclo')
        .eq('registro_id', testCicloId);

      if (errAud) throw errAud;

      expect(audRows.length).toBe(1);
      const aud = audRows[0];
      expect(aud.tabla).toBe('ciclo');
      expect(aud.registro_id).toBe(testCicloId);
      expect(aud.datos_despues.total_abonado_cent).toBeDefined();
      expect(aud.datos_despues.cantidad_abonos).toBeDefined();
      expect(aud.datos_despues.nuevo_ciclo_id).toBeDefined();
    } finally {
      if (nuevoCicloId) {
        await sbAdmin.from('ciclo').delete().eq('id', nuevoCicloId);
      }
      await sbAdmin.from('ciclo').delete().eq('id', testCicloId);
      await sbAdmin.from('ciclo').update({ estado: 'abierto' }).eq('id', 6);
    }
  });

  // PRUEBA 4
  it('4 · Aprobar un retiro guarda el saldo ANTES y el saldo DESPUÉS', async () => {
    let solId = null;
    let movId = null;

    try {
      const { data: sol, error: errSol } = await sbAdmin
        .from('solicitud_retiro')
        .insert({
          socio_id: 12,
          monto_cent: 10000,
          banco: 'BCP',
          cuenta: '191-88442211-0-45',
          estado: 'pendiente'
        })
        .select('*')
        .single();

      if (errSol) throw errSol;
      solId = sol.id;

      const resAprob = await aprobarSolicitudRetiro(solId, 1, sbAdmin);
      expect(resAprob.exito).toBe(true);
      movId = resAprob.movimiento_id;

      // Verificar en auditoria
      const { data: audRows, error: errAud } = await sbAdmin
        .from('auditoria')
        .select('*')
        .eq('accion', 'aprobar_retiro')
        .eq('registro_id', solId);

      if (errAud) throw errAud;

      expect(audRows.length).toBe(1);
      const aud = audRows[0];
      expect(aud.tabla).toBe('solicitud_retiro');
      expect(aud.datos_antes.saldo_anterior_cent).toBe(179000);
      expect(aud.datos_despues.saldo_nuevo_cent).toBe(169000);
      expect(aud.datos_despues.movimiento_id).toBeDefined();
    } finally {
      if (movId) {
        await sbAdmin.from('wallet_movimiento').delete().eq('id', movId);
      }
      if (solId) {
        await sbAdmin.from('solicitud_retiro').delete().eq('id', solId);
      }
    }

    // Ejercitar rechazar_solicitud_retiro para asegurar que figure en auditoría
    let solRechId = null;
    try {
      const { data: solRech } = await sbAdmin
        .from('solicitud_retiro')
        .insert({
          socio_id: 12,
          monto_cent: 10000,
          banco: 'BCP',
          cuenta: '191-88442211-0-45',
          estado: 'pendiente'
        })
        .select('*')
        .single();

      solRechId = solRech.id;
      const resRechSol = await rechazarSolicitudRetiro(solRechId, 1, 'Datos bancarios inconsistentes', sbAdmin);
      expect(resRechSol.exito).toBe(true);

      const { data: audRechRows } = await sbAdmin
        .from('auditoria')
        .select('*')
        .eq('accion', 'rechazar_retiro')
        .eq('registro_id', solRechId);

      expect(audRechRows.length).toBe(1);
      expect(audRechRows[0].datos_despues.motivo).toBe('Datos bancarios inconsistentes');
    } finally {
      if (solRechId) {
        await sbAdmin.from('solicitud_retiro').delete().eq('id', solRechId);
      }
    }
  });

  // PRUEBA 5
  it('5 · Cambiar una clave de config guarda el valor anterior (ej. dias_hasta_pago: 3 → 5)', async () => {
    // Valor inicial es '3'
    const resUpdate = await actualizarParametroConfig('dias_hasta_pago', '5', sbAdmin);
    expect(resUpdate.exito).toBe(true);

    const { data: audRows, error: errAud } = await sbAdmin
      .from('auditoria')
      .select('*')
      .eq('accion', 'cambiar_config')
      .order('id', { ascending: false })
      .limit(1);

    if (errAud) throw errAud;

    expect(audRows.length).toBe(1);
    const aud = audRows[0];
    expect(aud.datos_antes['dias_hasta_pago']).toBe('3');
    expect(aud.datos_despues['dias_hasta_pago']).toBe('5');

    // Restaurar a '3'
    await actualizarParametroConfig('dias_hasta_pago', '3', sbAdmin);
    const { data: confRest } = await sbAdmin.from('config').select('valor').eq('clave', 'dias_hasta_pago').single();
    expect(confRest.valor).toBe('3');
  });

  // PRUEBA 6
  it('6 · 🔴 El admin NO puede borrar una fila de auditoria (política ya no existe)', async () => {
    // Intentar borrar la primera fila de auditoria disponible
    const { data: primeraFila } = await sbAdmin.from('auditoria').select('id').limit(1).single();
    expect(primeraFila).toBeDefined();

    const { error, data } = await sbAdmin
      .from('auditoria')
      .delete()
      .eq('id', primeraFila.id)
      .select();

    // Al no haber política de DELETE, la operación es denegada por RLS o no afecta ninguna fila
    const { data: sigueExistiendo } = await sbAdmin
      .from('auditoria')
      .select('id')
      .eq('id', primeraFila.id)
      .single();

    expect(sigueExistiendo).toBeDefined();
    expect(sigueExistiendo.id).toBe(primeraFila.id);
  });

  // PRUEBA 7
  it('7 · 🔴 El admin NO puede modificar una fila de auditoria', async () => {
    const { data: primeraFila } = await sbAdmin.from('auditoria').select('id, accion').limit(1).single();
    expect(primeraFila).toBeDefined();

    // Intentar alterar la acción
    await sbAdmin
      .from('auditoria')
      .update({ accion: 'accion_manipulada' })
      .eq('id', primeraFila.id);

    // Verificar que permanece inalterada
    const { data: filaVerificada } = await sbAdmin
      .from('auditoria')
      .select('id, accion')
      .eq('id', primeraFila.id)
      .single();

    expect(filaVerificada.accion).toBe(primeraFila.accion);
    expect(filaVerificada.accion).not.toBe('accion_manipulada');
  });

  // PRUEBA 8
  it('8 · Un socio NO puede leer la auditoría — con sesión real', async () => {
    // Ana (socio 2) intenta leer la tabla auditoria
    const { data, error } = await sbAna.from('auditoria').select('*');

    // Por RLS de SELECT (auditoria_admin_select requiere fn_is_admin()), debe devolver 0 filas o error
    expect(data === null || data.length === 0).toBe(true);
  });

  // PRUEBA 9
  it('9 · Si la operación falla, NO queda fila de auditoría', async () => {
    const { count: countAntes } = await sbAdmin
      .from('auditoria')
      .select('id', { count: 'exact', head: true })
      .eq('accion', 'rechazar_pago');

    // Intentar rechazar con motivo vacío (falla con RAISE EXCEPTION en Postgres)
    const { data, error } = await sbAdmin.rpc('fn_rechazar_orden_pago', {
      p_orden_id: 1,
      p_motivo: ''
    });

    expect(error).toBeDefined();
    expect(error.message).toMatch(/motivo de rechazo/i);

    const { count: countDespues } = await sbAdmin
      .from('auditoria')
      .select('id', { count: 'exact', head: true })
      .eq('accion', 'rechazar_pago');

    // El contador de filas no aumentó porque la transacción hizo ROLLBACK completo
    expect(countDespues).toBe(countAntes);
  });

  it('Bonus · Guardar configuración de rango genera auditoría cambiar_rango', async () => {
    // Ejercitar fn_guardar_rango_config en Rango 9
    const resRango = await guardarRangoConfig(9, {
      nombre: 'Diamante Negro',
      puntos_grupales: 150000,
      frontales_activos: 8,
      bono_soles: 25000
    }, sbAdmin);
    expect(resRango.exito).toBe(true);

    const { data: audRows, error: errAud } = await sbAdmin
      .from('auditoria')
      .select('*')
      .eq('accion', 'cambiar_rango')
      .eq('registro_id', 9);

    if (errAud) throw errAud;

    expect(audRows.length).toBeGreaterThanOrEqual(1);
    const aud = audRows[audRows.length - 1];
    expect(aud.tabla).toBe('rango');
    expect(aud.datos_despues.nombre).toBe('Diamante Negro');
    expect(aud.datos_despues.puntos_grupales).toBe(150000);

    // Restaurar Rango 9 a definido = false
    await sbAdmin.from('rango').update({
      nombre: 'Diamante Negro',
      puntos_grupales: null,
      frontales_activos: null,
      bono_cent: null,
      definido: false
    }).eq('id', 9);
  });
});
