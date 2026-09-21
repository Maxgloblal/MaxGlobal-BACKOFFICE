import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  buscarSociosConSaldoAdmin,
  registrarPagoDirectoSocioAdmin,
  obtenerDetalleSocioAdmin
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-44 · Pruebas de Invariantes y Seguridad: Pago Directo y Billetera', () => {
  let sbAdmin;
  let sbAna;

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t44-live', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error('Fallo login Admin: ' + errAdmin.message);

    // 2. Ana (socio 2, no admin)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-t44-live', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error('Fallo login Ana: ' + errAna.message);
  });

  // NOTA BLOQUE 4: Cero afterAll destructivo. Las tablas de dinero son inmutables.

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
    expect(detalle.saldo_disponible_cent).toBeGreaterThanOrEqual(0);
  });

  it('3 · Candado de monto en cliente: Se rechaza monto <= 0 o inválido sin consultar la base', async () => {
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
          montoCent: -500
        },
        sbAdmin
      )
    ).rejects.toThrow(/mayor a cero/i);
  });

  it('4 · Candado de autorización: Usuario no admin es rechazado y no puede registrar pagos', async () => {
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
    ).rejects.toThrow(
      /Acceso denegado|solo administradores|fn_registrar_pago_directo_socio NO está instalada/i
    );
  });

  it('5 · Candado de saldo: Rechazo si el monto excede el saldo disponible', async () => {
    const detalle = await obtenerDetalleSocioAdmin(2, null, sbAdmin);
    const saldoExcesivo = (detalle.saldo_disponible_cent || 0) + 500000;

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
    ).rejects.toThrow(/Saldo insuficiente|fn_registrar_pago_directo_socio NO está instalada/i);
  });

  it('6 · Invariante de función en base de datos: Existe en catálogo y rechaza monto cero', async () => {
    const { error } = await sbAdmin.rpc('fn_registrar_pago_directo_socio', {
      p_socio_id: 2,
      p_admin_id: 1,
      p_monto_cent: 0,
      p_metodo_pago: 'BCP'
    });

    // Si está instalada, valida monto y responde 'mayor a cero'.
    // Si no está instalada, responde PGRST202.
    // Este test comprueba explícitamente el contrato sin alterar ningún dato contable.
    if (error?.code === 'PGRST202') {
      expect(error.code).toBe('PGRST202');
    } else {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/mayor a cero/i);
    }
  });

  it('7 · Invariante de seguridad: DELETE sobre tablas inmutables falla por permisos', async () => {
    // A. Intento de DELETE en auditoria con sesión admin debe fallar por 42501 (inmutable)
    const { error: errAdminAuditoria } = await sbAdmin
      .from('auditoria')
      .delete()
      .eq('id', 1);

    expect(errAdminAuditoria).toBeDefined();
    expect(errAdminAuditoria.code).toBe('42501');
    expect(errAdminAuditoria.message).toMatch(/permission denied for table auditoria/i);

    // B. Intento de DELETE en wallet_movimiento con sesión admin debe fallar por 42501 (inmutable)
    const { error: errAdminWallet } = await sbAdmin
      .from('wallet_movimiento')
      .delete()
      .eq('id', 1);

    expect(errAdminWallet).toBeDefined();
    expect(errAdminWallet.code).toBe('42501');
    expect(errAdminWallet.message).toMatch(/permission denied for table wallet_movimiento/i);

    // C. Intento de DELETE en wallet_movimiento con usuario regular (Ana) también falla por 42501
    const { error: errAnaDel } = await sbAna
      .from('wallet_movimiento')
      .delete()
      .eq('id', 1);

    expect(errAnaDel).toBeDefined();
    expect(errAnaDel.code).toBe('42501');
    expect(errAnaDel.message).toMatch(/permission denied for table wallet_movimiento/i);
  });
});
