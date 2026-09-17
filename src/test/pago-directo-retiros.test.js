import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  buscarSociosConSaldoAdmin,
  registrarPagoDirectoSocioAdmin,
  obtenerDetalleSocioAdmin
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-43 · Pago Directo / Débito de Billetera por Administración', () => {
  let sbAdmin;
  let sbAna;
  const idsLimpieza = {
    movimientoId: null,
    solicitudId: null
  };

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-pago-directo', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // 2. Ana (socio 2, no admin)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-pago-directo', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);
  });

  afterAll(async () => {
    // Limpieza de movimiento de prueba para preservar saldo exacto de Ana
    if (idsLimpieza.movimientoId) {
      await sbAdmin.from('wallet_movimiento').delete().eq('id', idsLimpieza.movimientoId);
    }
    if (idsLimpieza.solicitudId) {
      await sbAdmin.from('solicitud_retiro').delete().eq('id', idsLimpieza.solicitudId);
    }
    if (idsLimpieza.movimientoId) {
      await sbAdmin.from('auditoria').delete().eq('registro_id', idsLimpieza.movimientoId);
    }
  });

  it('1 · buscarSociosConSaldoAdmin retorna socios con saldo en vivo y datos bancarios', async () => {
    const resultados = await buscarSociosConSaldoAdmin('Ana', sbAdmin);
    expect(resultados).toBeInstanceOf(Array);
    expect(resultados.length).toBeGreaterThan(0);

    const ana = resultados.find((s) => s.id === 2);
    expect(ana).toBeDefined();
    expect(ana.codigo).toBe('MG00002');
    expect(ana.nombreCompleto).toMatch(/Ana/i);
    expect(typeof ana.saldoDisponibleCent).toBe('number');
    expect(ana.saldoDisponibleCent).toBeGreaterThanOrEqual(0);
    expect(ana.saldoDisponibleSoles).toBe(ana.saldoDisponibleCent / 100);
  });

  it('2 · obtenerDetalleSocioAdmin incluye saldo_disponible_cent para la ficha modal de P-27', async () => {
    const detalle = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
    expect(detalle).toBeDefined();
    expect(detalle.socio.id).toBe(2);
    expect(typeof detalle.saldo_disponible_cent).toBe('number');
    expect(detalle.saldo_disponible_cent).toBeGreaterThan(0);
  });

  it('3 · Candado de seguridad: Usuario regular (no admin) es rechazado al intentar registrar pago directo', async () => {
    await expect(
      registrarPagoDirectoSocioAdmin(
        {
          socioId: 2,
          adminId: 2,
          montoCent: 500,
          metodoPago: 'BCP'
        },
        sbAna
      )
    ).rejects.toThrow(/Acceso denegado|solo administradores/i);
  });

  it('4 · Candado de monto: Se rechaza monto <= 0 o inválido', async () => {
    await expect(
      registrarPagoDirectoSocioAdmin(
        {
          socioId: 2,
          montoCent: 0
        },
        sbAdmin
      )
    ).rejects.toThrow(/mayor a cero/i);

    await expect(
      registrarPagoDirectoSocioAdmin(
        {
          socioId: 2,
          montoCent: -1000
        },
        sbAdmin
      )
    ).rejects.toThrow(/mayor a cero/i);
  });

  it('5 · Candado de saldo: Se rechaza pago si el monto supera el saldo disponible', async () => {
    const detalle = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
    const saldoExcesivo = detalle.saldo_disponible_cent + 500000; // S/. 5,000 extra

    await expect(
      registrarPagoDirectoSocioAdmin(
        {
          socioId: 2,
          adminId: 1,
          montoCent: saldoExcesivo,
          metodoPago: 'Transferencia BCP'
        },
        sbAdmin
      )
    ).rejects.toThrow(/Saldo insuficiente/i);
  });

  it('6 · Flujo exitoso: Admin ejecuta pago directo de S/. 1.00 (100 centavos) con deducción estricta', async () => {
    // Consultar saldo inicial de Ana
    const detalleAntes = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
    const saldoAntesCent = detalleAntes.saldo_disponible_cent;
    expect(saldoAntesCent).toBeGreaterThanOrEqual(100);

    const MONTO_PAGO_CENT = 100; // S/. 1.00
    const NUM_OP = 'OP-PRUEBA-T43-' + Date.now().toString().slice(-6);

    const res = await registrarPagoDirectoSocioAdmin(
      {
        socioId: 2,
        adminId: 1,
        montoCent: MONTO_PAGO_CENT,
        metodoPago: 'Yape / Plin',
        numeroOperacion: NUM_OP,
        nota: 'Prueba de pago directo automatizada TAREA-43'
      },
      sbAdmin
    );

    expect(res.exito).toBe(true);
    expect(res.socio_id).toBe(2);
    expect(res.monto_cent).toBe(MONTO_PAGO_CENT);
    expect(res.solicitud_id).toBeDefined();
    expect(res.movimiento_id).toBeDefined();

    idsLimpieza.movimientoId = res.movimiento_id;
    idsLimpieza.solicitudId = res.solicitud_id;

    // Verificar en base de datos: wallet_movimiento debe tener monto_cent estrictamente NEGATIVO
    const { data: mov } = await sbAdmin
      .from('wallet_movimiento')
      .select('*')
      .eq('id', res.movimiento_id)
      .single();

    expect(mov).toBeDefined();
    expect(mov.tipo).toBe('retiro');
    expect(mov.monto_cent).toBe(-MONTO_PAGO_CENT);
    expect(mov.saldo_despues_cent).toBe(res.saldo_nuevo_cent);

    // Verificar solicitud_retiro creada en estado 'aprobado'
    const { data: sol } = await sbAdmin
      .from('solicitud_retiro')
      .select('*')
      .eq('id', res.solicitud_id)
      .single();

    expect(sol).toBeDefined();
    expect(sol.estado).toBe('aprobado');
    expect(sol.monto_cent).toBe(MONTO_PAGO_CENT);
    expect(sol.cuenta).toBe(NUM_OP);

    // Verificar nuevo saldo reflejado en v_wallet_saldo
    const detalleDespues = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
    expect(detalleDespues.saldo_disponible_cent).toBe(saldoAntesCent - MONTO_PAGO_CENT);
  });
});
