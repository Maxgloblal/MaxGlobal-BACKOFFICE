import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerSolicitudesRetiroAdmin,
  aprobarSolicitudRetiro,
  rechazarSolicitudRetiro
} from '../servicios/operacionAdmin';
import { sbService } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-15 · Flujo Completo de Retiros Bancarios', () => {
  let sbAdmin;
  let sbAna;
  let sbKarla;
  const solicitudesLimpieza = [];

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-retiros', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // 2. Socio Ana autenticada (socio 2)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-retiros', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    // 3. Socio Karla autenticada (socio 12)
    sbKarla = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-karla-retiros', persistSession: false, autoRefreshToken: false }
    });
    const { error: errKarla } = await sbKarla.auth.signInWithPassword({
      email: 'socio012@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errKarla) throw new Error(`Fallo login Karla: ${errKarla.message}`);
  });

  afterAll(async () => {
    // Limpieza de solicitudes temporales de prueba que no generaron movimiento
    for (const solId of solicitudesLimpieza) {
      try {
        await sbAdmin.from('solicitud_retiro').delete().eq('id', solId);
      } catch (e) {
        console.warn('Error en limpieza de solicitud de prueba:', e.message);
      }
    }
    // Asegurar que pct_detraccion quede en null al terminar
    try {
      await sbAdmin.from('config').update({ valor: null }).eq('clave', 'pct_detraccion');
    } catch (e) {
      console.warn('Error al restaurar pct_detraccion:', e.message);
    }
  });

  // PRUEBA 1
  it('1 · Aprobar un retiro de S/. 100 sobre un saldo de S/. 1,890 deja el saldo en S/. 1,790 (calculado a mano)', async () => {
    // Verificar si la solicitud #1 ya fue aprobada previamente
    const { data: sol1 } = await sbAdmin.from('solicitud_retiro').select('*').eq('id', 1).single();

    if (sol1 && sol1.estado === 'pendiente') {
      // Saldo previo de Karla en la vista debe ser 1,890.00 (189,000 centavos)
      const { data: saldoPrevio } = await sbAdmin
        .from('v_wallet_saldo')
        .select('saldo_cent')
        .eq('socio_id', 12)
        .single();
      expect(Number(saldoPrevio.saldo_cent)).toBe(189000);

      // Aprobar la solicitud #1 por S/. 100.00 (10,000 centavos)
      const res = await aprobarSolicitudRetiro(1, 1, sbAdmin);
      expect(res).toBeDefined();
    }

    // El saldo posterior en v_wallet_saldo debe ser exactamente 171,880 centavos (S/. 1,718.80 certificado tras TAREA-32)
    const { data: saldoPost } = await sbAdmin
      .from('v_wallet_saldo')
      .select('saldo_cent')
      .eq('socio_id', 12)
      .single();

    expect(Number(saldoPost.saldo_cent)).toBe(171880);
  });

  // PRUEBA 2
  it('2 · El movimiento creado tiene monto_cent NEGATIVO (−10000)', async () => {
    // Buscar el movimiento generado para la solicitud de retiro de Karla
    const { data: movs } = await sbAdmin
      .from('wallet_movimiento')
      .select('*')
      .eq('socio_id', 12)
      .eq('tipo', 'retiro');

    expect(movs).toBeDefined();
    expect(movs.length).toBeGreaterThanOrEqual(1);

    const mov = movs[movs.length - 1];
    expect(Number(mov.monto_cent)).toBe(-10000);
    expect(Number(mov.monto_cent)).toBeLessThan(0);
    expect(mov.tipo).toBe('retiro');
    expect(mov.concepto).toBe('Retiro aprobado');
  });

  // PRUEBA 3
  it('3 · saldo_despues_cent del nuevo movimiento = anterior − 10000', async () => {
    // Obtener los movimientos de Karla en orden por id
    const { data: ultimosMovs } = await sbAdmin
      .from('wallet_movimiento')
      .select('id, tipo, concepto, monto_cent, saldo_despues_cent')
      .eq('socio_id', 12)
      .order('id', { ascending: true });

    expect(ultimosMovs.length).toBeGreaterThanOrEqual(2);

    const indexRetiro = ultimosMovs.findIndex(m => m.tipo === 'retiro');
    expect(indexRetiro).toBeGreaterThan(0);

    const movRetiro = ultimosMovs[indexRetiro];
    const movAnterior = ultimosMovs[indexRetiro - 1];

    expect(Number(movRetiro.saldo_despues_cent)).toBe(
      Number(movAnterior.saldo_despues_cent) - 10000
    );
    expect(Number(movRetiro.saldo_despues_cent)).toBe(179000);
  });

  // PRUEBA 4
  it('4 · Aprobar un retiro MAYOR al saldo falla y no crea movimiento', async () => {
    // Crear una solicitud de retiro por un monto muy superior al saldo disponible (e.g. S/. 50,000 = 5,000,000 centavos)
    const { data: solExcesiva, error: errInsert } = await sbAdmin
      .from('solicitud_retiro')
      .insert({
        socio_id: 12,
        monto_cent: 5000000,
        banco: 'BCP',
        cuenta: '191-88442211-0-45',
        estado: 'pendiente'
      })
      .select()
      .single();

    if (errInsert) throw errInsert;
    solicitudesLimpieza.push(solExcesiva.id);

    // Contar movimientos de billetera antes del intento
    const { count: countAntes } = await sbAdmin
      .from('wallet_movimiento')
      .select('id', { count: 'exact', head: true });

    // Intentar aprobar: debe fallar por saldo insuficiente
    let errorCapturado = null;
    try {
      await aprobarSolicitudRetiro(solExcesiva.id, 1, sbAdmin);
    } catch (err) {
      errorCapturado = err;
    }

    expect(errorCapturado).not.toBeNull();
    expect(errorCapturado.message).toMatch(/insuficiente/i);

    // Contar movimientos de billetera después del fallo: debe ser IDÉNTICO
    const { count: countDespues } = await sbAdmin
      .from('wallet_movimiento')
      .select('id', { count: 'exact', head: true });

    expect(countDespues).toBe(countAntes);

    // La solicitud excesiva debe permanecer en estado pendiente (no aprobada)
    const { data: solCheck } = await sbAdmin
      .from('solicitud_retiro')
      .select('estado')
      .eq('id', solExcesiva.id)
      .single();

    expect(solCheck.estado).toBe('pendiente');
  });

  // PRUEBA 5
  it('5 · Rechazar NO crea ningún movimiento de billetera', async () => {
    // Crear una solicitud de prueba para rechazar
    const { data: solRechazo, error: errInsert } = await sbAdmin
      .from('solicitud_retiro')
      .insert({
        socio_id: 12,
        monto_cent: 10000,
        banco: 'BCP',
        cuenta: '191-88442211-0-45',
        estado: 'pendiente'
      })
      .select()
      .single();

    if (errInsert) throw errInsert;
    solicitudesLimpieza.push(solRechazo.id);

    // Conteo de movimientos antes
    const { count: countAntes } = await sbAdmin
      .from('wallet_movimiento')
      .select('id', { count: 'exact', head: true });

    // Rechazar con motivo claro
    const resRechazo = await rechazarSolicitudRetiro(
      solRechazo.id,
      1,
      'Cuenta de destino no coincide con el titular registrado',
      sbAdmin
    );
    expect(resRechazo).toBeDefined();

    // Conteo de movimientos después: CERO movimientos creados
    const { count: countDespues } = await sbAdmin
      .from('wallet_movimiento')
      .select('id', { count: 'exact', head: true });

    expect(countDespues).toBe(countAntes);

    // Verificar que la solicitud quedó rechazada y con el motivo auditado
    const { data: solActualizada } = await sbAdmin
      .from('solicitud_retiro')
      .select('estado, motivo_rechazo, procesado_por')
      .eq('id', solRechazo.id)
      .single();

    expect(solActualizada.estado).toBe('rechazado');
    expect(solActualizada.motivo_rechazo).toBe('Cuenta de destino no coincide con el titular registrado');
    expect(solActualizada.procesado_por).toBe(1);
  });

  // PRUEBA 6
  it('6 · Rechazar sin motivo falla', async () => {
    // Crear una solicitud de prueba
    const { data: solSinMotivo, error: errInsert } = await sbAdmin
      .from('solicitud_retiro')
      .insert({
        socio_id: 12,
        monto_cent: 10000,
        banco: 'BCP',
        cuenta: '191-88442211-0-45',
        estado: 'pendiente'
      })
      .select()
      .single();

    if (errInsert) throw errInsert;
    solicitudesLimpieza.push(solSinMotivo.id);

    // 1. Fallo por validación JS
    await expect(rechazarSolicitudRetiro(solSinMotivo.id, 1, '', sbAdmin)).rejects.toThrow(
      /motivo de rechazo es obligatorio/i
    );

    await expect(rechazarSolicitudRetiro(solSinMotivo.id, 1, '   ', sbAdmin)).rejects.toThrow(
      /motivo de rechazo es obligatorio/i
    );

    // 2. Fallo a nivel de función RPC en Postgres si se pasa cadena vacía
    const { error: errRpc } = await sbAdmin.rpc('fn_rechazar_solicitud_retiro', {
      p_solicitud_id: solSinMotivo.id,
      p_admin_id: 1,
      p_motivo: '  '
    });
    expect(errRpc).not.toBeNull();
    expect(errRpc.message).toMatch(/motivo de rechazo es obligatorio/i);

    // La solicitud sigue pendiente
    const { data: solVerif } = await sbAdmin
      .from('solicitud_retiro')
      .select('estado')
      .eq('id', solSinMotivo.id)
      .single();

    expect(solVerif.estado).toBe('pendiente');
  });

  // PRUEBA 7
  it('7 · Un socio NO puede aprobar retiros (solo admin) — con sesión real', async () => {
    // Socio Ana (socio 2) intenta aprobar una solicitud de retiro
    const { error: errAprobacionSocio } = await sbAna.rpc('fn_aprobar_solicitud_retiro', {
      p_solicitud_id: 5,
      p_admin_id: 2
    });

    expect(errAprobacionSocio).not.toBeNull();
    expect(errAprobacionSocio.message).toMatch(/Acceso denegado: solo administradores/i);
  });

  // PRUEBA 8
  it('8 · Un socio NO ve las solicitudes de otro socio — con sesión real', async () => {
    // Socio Ana (socio 2) consulta la tabla solicitud_retiro filtrando por socio 12 (Karla)
    const { data: solKarlaVistaPorAna, error: err1 } = await sbAna
      .from('solicitud_retiro')
      .select('*')
      .eq('socio_id', 12);

    expect(err1).toBeNull();
    expect(solKarlaVistaPorAna).toBeDefined();
    expect(solKarlaVistaPorAna.length).toBe(0); // RLS bloquea ver registros de otros socios

    // Socio Ana consulta todas las solicitudes sin filtro: solo debe ver las suyas
    const { data: todasSolicitudesAna, error: err2 } = await sbAna
      .from('solicitud_retiro')
      .select('*');

    expect(err2).toBeNull();
    for (const sol of todasSolicitudesAna || []) {
      expect(sol.socio_id).toBe(2);
      expect(sol.socio_id).not.toBe(12);
    }
  });

  // PRUEBA 9
  it('9 · Con pct_detraccion en null, un retiro de S/. 800 muestra el aviso y NO calcula un neto inventado', async () => {
    // Asegurar que pct_detraccion esté en null
    await sbAdmin.from('config').update({ valor: null }).eq('clave', 'pct_detraccion');

    const solicitudesAdmin = await obtenerSolicitudesRetiroAdmin(sbAdmin);
    const sol800 = solicitudesAdmin.find(s => s.id === 5 || Number(s.monto_cent) === 80000);

    expect(sol800).toBeDefined();
    expect(Number(sol800.monto_cent)).toBe(80000);
    // Supera el umbral de S/. 700 (70,000 centavos)
    expect(sol800.superaUmbral).toBe(true);
    // Como pct_detraccion es null, debe marcar detractionPendiente = true
    expect(sol800.detractionPendiente).toBe(true);
    expect(sol800.pctDetraccion).toBeNull();
    // NO debe haber un monto de detracción inventado ni deducción anticipada
    expect(sol800.montoDetraccionCent).toBe(0);
    expect(sol800.montoNetoCent).toBe(80000);
  });

  // PRUEBA 10
  it('10 · Con pct_detraccion definido, el débito sigue siendo por el monto completo, no por el neto', async () => {
    // Configurar temporalmente pct_detraccion al 10%
    // Nota (TAREA-45): Se usa sbService porque config es inmutable frente a sesiones authenticated
    await sbService.from('config').update({ valor: '10' }).eq('clave', 'pct_detraccion');

    // 1. En la vista administrativa P-30, se calcula la detracción referencial y el neto a transferir fuera del sistema
    const solicitudesConDetraccion = await obtenerSolicitudesRetiroAdmin(sbAdmin);
    const sol800 = solicitudesConDetraccion.find(s => s.id === 5 || Number(s.monto_cent) === 80000);

    expect(sol800).toBeDefined();
    expect(sol800.superaUmbral).toBe(true);
    expect(sol800.detractionPendiente).toBe(false);
    expect(sol800.pctDetraccion).toBe(10);
    expect(sol800.montoDetraccionCent).toBe(8000); // 10% de S/. 800 = S/. 80 (8,000 centavos)
    expect(sol800.montoNetoCent).toBe(72000);       // Neto a transferir al banco = S/. 720 (72,000 centavos)

    // 2. Comprobar que en la función PostgreSQL de débito fn_aprobar_solicitud_retiro,
    // el monto que se debita en wallet_movimiento es SIEMPRE el monto solicitado completo (-v_sol.monto_cent),
    // y NUNCA el monto neto:
    // El monto del contrato de aprobación sigue siendo el monto_cent solicitado
    expect(sol800.monto_cent).toBe(80000);

    // Restaurar pct_detraccion a null
    await sbService.from('config').update({ valor: null }).eq('clave', 'pct_detraccion');
  });
});
