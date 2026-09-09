import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { sbService, contarUsuariosAuth } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-28 · Endurecimiento y Limpieza (Bloque 5 - 8 Pruebas)', () => {
  let sbAdmin;
  let sbSocio;
  let sbAnon;
  let conteoAuthInicial = 0;

  beforeAll(async () => {
    // Cliente anónimo
    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Cliente Admin
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t28', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // Cliente Socio real
    sbSocio = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-socio-t28', persistSession: false, autoRefreshToken: false }
    });
    const { error: errSocio } = await sbSocio.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errSocio) throw new Error(`Fallo login Socio: ${errSocio.message}`);

    // Registrar conteo inicial de auth.users
    conteoAuthInicial = await contarUsuariosAuth();
    expect(conteoAuthInicial).toBe(23);
  });

  // 1 · Un socio NO puede cambiarse el email por API — con sesión real, no simulada
  it('1 · Un socio NO puede cambiarse el email por API (con sesión real)', async () => {
    const { error } = await sbSocio
      .from('socio')
      .update({ email: 'ana.hack@ejemplo.test' })
      .eq('id', 2);

    expect(error).not.toBeNull();
    expect(error.message).toMatch(/correo electrónico|inmutable|permite/i);
  });

  // 2 · El admin SÍ puede cambiarle el email a un socio
  it('2 · El admin SÍ puede cambiarle el email a un socio', async () => {
    const emailOriginal = 'socio002@ejemplo.test';
    const emailTemporal = 'socio002.temp@ejemplo.test';

    // El admin actualiza el email
    const { error: errMod } = await sbAdmin
      .from('socio')
      .update({ email: emailTemporal })
      .eq('id', 2);
    expect(errMod).toBeNull();

    // Revertir inmediatamente al email original
    const { error: errRev } = await sbAdmin
      .from('socio')
      .update({ email: emailOriginal })
      .eq('id', 2);
    expect(errRev).toBeNull();
  });

  // 3 · anon NO puede ejecutar fn_aprobar_solicitud_retiro
  it('3 · anon NO puede ejecutar fn_aprobar_solicitud_retiro', async () => {
    const { error } = await sbAnon.rpc('fn_aprobar_solicitud_retiro', {
      p_solicitud_id: 1,
      p_admin_id: 1
    });

    expect(error).not.toBeNull();
    // Falla por permiso revocado (42501 permission denied)
    expect(error.code || error.message).toMatch(/42501|permission denied|denegado|function/i);
  });

  // 4 · El admin SÍ puede seguir aprobando un retiro
  it('4 · El admin SÍ puede seguir aprobando un retiro', async () => {
    // Crear solicitud de retiro temporal para Karla (id 12) por S/. 1.00 (100 centavos)
    const { data: sol, error: errSol } = await sbAdmin
      .from('solicitud_retiro')
      .insert({
        socio_id: 12,
        monto_cent: 100,
        banco: 'BCP',
        cuenta: '191-00000000-0-00',
        estado: 'pendiente'
      })
      .select()
      .single();

    expect(errSol).toBeNull();
    expect(sol.id).toBeDefined();

    try {
      const { data: resAprob, error: errAprob } = await sbAdmin.rpc('fn_aprobar_solicitud_retiro', {
        p_solicitud_id: sol.id,
        p_admin_id: 1
      });

      expect(errAprob).toBeNull();
      expect(resAprob.exito).toBe(true);
      expect(resAprob.movimiento_id).toBeDefined();

      // Limpieza con service role para dejar saldos y tablas exactamente intactos
      await sbService.from('wallet_movimiento').delete().eq('id', resAprob.movimiento_id);
      await sbService.from('auditoria').delete().eq('tabla', 'solicitud_retiro').eq('registro_id', sol.id);
    } finally {
      await sbService.from('solicitud_retiro').delete().eq('id', sol.id);
    }
  });

  // 5 · El socio SÍ puede cambiar su contraseña y marcarla
  it('5 · El socio SÍ puede cambiar su contraseña y marcarla (protege TAREA-25)', async () => {
    const { error } = await sbSocio.rpc('fn_marcar_password_cambiada');
    expect(error).toBeNull();
  });

  // 6 · La landing SÍ puede leer producto con la clave anon
  it('6 · La landing SÍ puede leer producto con la clave anon (protege TAREA-23)', async () => {
    const { data, error } = await sbAnon
      .from('producto')
      .select('id, codigo, nombre, precio_lista_cent, puntos')
      .eq('activo', true);

    expect(error).toBeNull();
    expect(data.length).toBe(8);
  });

  // 7 · anon NO puede insertar en socio, orden ni activacion
  it('7 · anon NO puede insertar en socio, orden ni activacion', async () => {
    // Intento en socio
    const { error: errSocio } = await sbAnon
      .from('socio')
      .insert({ id: 99999, codigo: 'MG99999', nombres: 'TEST', apellidos: 'ANON', email: 'anon@test.com' });
    expect(errSocio).not.toBeNull();

    // Intento en orden
    const { error: errOrden } = await sbAnon
      .from('orden')
      .insert({ id: 99999, codigo: 'ORD-ANON-99999', socio_id: 1, total_cent: 1000 });
    expect(errOrden).not.toBeNull();

    // Intento en activacion
    const { error: errAct } = await sbAnon
      .from('activacion')
      .insert({ socio_id: 1, ciclo_id: 30, activo: true });
    expect(errAct).not.toBeNull();

    // Intento en config, comision, wallet_movimiento (segunda mitad Bloque 2)
    const { error: errConfig } = await sbAnon
      .from('config')
      .update({ valor: 'hack' })
      .eq('clave', 'MONEDA_DEFECTO');
    expect(errConfig).not.toBeNull();

    const { error: errComision } = await sbAnon
      .from('comision')
      .insert({ socio_id: 1, orden_id: 1, tipo: 'patrocinio', monto_cent: 9999 });
    expect(errComision).not.toBeNull();

    const { error: errWallet } = await sbAnon
      .from('wallet_movimiento')
      .insert({ socio_id: 1, monto_cent: 9999, tipo: 'abono', concepto: 'hack' });
    expect(errWallet).not.toBeNull();
  });

  // 8 · Después de la suite, auth.users NO creció
  it('8 · Después de la suite, auth.users NO creció', async () => {
    const conteoFinal = await contarUsuariosAuth();
    expect(conteoFinal).toBe(conteoAuthInicial);
  });
});
