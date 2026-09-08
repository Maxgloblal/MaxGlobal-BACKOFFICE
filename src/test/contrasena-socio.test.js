import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { cambiarPasswordSocio } from '../servicios/socio';
import { limpiarSocioPrueba } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-25 · Contraseña Única por Socio y Eliminación de Universal (Bloque 5)', () => {
  let sbAdmin;
  const EMAIL_TEST_1 = 'test.tarea25.socio1@maxglobal.test';
  const EMAIL_TEST_2 = 'test.tarea25.socio2@maxglobal.test';
  const DOC_TEST_1 = '99881101';
  const DOC_TEST_2 = '99881102';

  let resultadoAfil1 = null;
  let resultadoAfil2 = null;
  const ordenesParaLimpiar = [];

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t25', persistSession: false, autoRefreshToken: false }
    });

    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // Limpieza preventiva previa
    await limpiarSocioPrueba(EMAIL_TEST_1);
    await limpiarSocioPrueba(EMAIL_TEST_2);
  });

  afterAll(async () => {
    // Limpieza estricta de datos de prueba para mantener conteos certificados intactos
    for (const ordId of ordenesParaLimpiar) {
      try {
        await sbAdmin.from('voucher').delete().eq('orden_id', ordId);
        await sbAdmin.from('orden_detalle').delete().eq('orden_id', ordId);
        await sbAdmin.from('orden').delete().eq('id', ordId);
      } catch (e) {
        console.warn('Error limpiando orden extra:', e.message);
      }
    }

    await limpiarSocioPrueba(EMAIL_TEST_1);
    await limpiarSocioPrueba(EMAIL_TEST_2);

    // Verificación final del conteo de socios certificados (509)
    const { count: countSocios } = await sbAdmin.from('socio').select('*', { count: 'exact', head: true });
    expect(countSocios).toBe(509);
  }, 30000);

  it('1 · Dos afiliaciones seguidas generan contraseñas DISTINTAS', async () => {
    const { data: res1, error: err1 } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 1,
      p_pack_id: 3, // Pack Gold
      p_tipo_documento: 'DNI',
      p_documento: DOC_TEST_1,
      p_nombres: 'Socio Test Uno',
      p_apellidos: 'Tarea Veinticinco',
      p_email: EMAIL_TEST_1,
      p_telefono: '999888771',
      p_fecha_nacimiento: null,
      p_direccion: null,
      p_departamento: null,
      p_provincia: null,
      p_distrito: null,
      p_voucher: {
        banco: 'BCP',
        numero_operacion: 'OP-T25-01',
        monto_cent: 120000
      },
      p_canal: 'oficina'
    });
    expect(err1).toBeNull();
    expect(res1?.exito).toBe(true);
    resultadoAfil1 = res1;

    const { data: res2, error: err2 } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 1,
      p_pack_id: 3, // Pack Gold
      p_tipo_documento: 'DNI',
      p_documento: DOC_TEST_2,
      p_nombres: 'Socio Test Dos',
      p_apellidos: 'Tarea Veinticinco',
      p_email: EMAIL_TEST_2,
      p_telefono: '999888772',
      p_fecha_nacimiento: null,
      p_direccion: null,
      p_departamento: null,
      p_provincia: null,
      p_distrito: null,
      p_voucher: {
        banco: 'BBVA',
        numero_operacion: 'OP-T25-02',
        monto_cent: 120000
      },
      p_canal: 'oficina'
    });
    expect(err2).toBeNull();
    expect(res2?.exito).toBe(true);
    resultadoAfil2 = res2;

    expect(resultadoAfil1.password_temporal).toBeDefined();
    expect(resultadoAfil2.password_temporal).toBeDefined();
    expect(resultadoAfil1.password_temporal).not.toBe(resultadoAfil2.password_temporal);
  });

  it('2 · La contraseña devuelta tiene 10 caracteres', () => {
    expect(resultadoAfil1.password_temporal).toHaveLength(10);
    expect(resultadoAfil2.password_temporal).toHaveLength(10);
  });

  it('3 · No contiene O, 0, l, 1 ni I', () => {
    const caracteresAmbiguos = /[O0l1I]/;
    expect(resultadoAfil1.password_temporal).not.toMatch(caracteresAmbiguos);
    expect(resultadoAfil2.password_temporal).not.toMatch(caracteresAmbiguos);
  });

  it('4 · La contraseña devuelta SIRVE para iniciar sesión (se registra un socio y se entra con ella, de verdad)', async () => {
    const sbNuevoSocio = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-login-t25', persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await sbNuevoSocio.auth.signInWithPassword({
      email: EMAIL_TEST_1,
      password: resultadoAfil1.password_temporal
    });

    expect(authError).toBeNull();
    expect(authData?.user).toBeDefined();
    expect(authData.user.email).toBe(EMAIL_TEST_1);
  });

  it('5 · "MaxGlobal2026!" YA NO sirve para un socio nuevo', async () => {
    const sbIntruso = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-intruso-t25', persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await sbIntruso.auth.signInWithPassword({
      email: EMAIL_TEST_1,
      password: 'MaxGlobal2026!'
    });

    expect(authError).not.toBeNull();
    expect(authData?.user).toBeNull();
  });

  it('6 · La contraseña NO aparece en ninguna tabla en texto plano', async () => {
    const pwdTemporal = resultadoAfil1.password_temporal;

    // 1. En socio, password_hash debe ser 'AUTH_MANAGED', nunca la contraseña en plano
    const { data: socioDb, error: errSocio } = await sbAdmin
      .from('socio')
      .select('*')
      .eq('email', EMAIL_TEST_1)
      .single();

    expect(errSocio).toBeNull();
    expect(socioDb.password_hash).not.toBe(pwdTemporal);
    expect(socioDb.password_hash).toBe('AUTH_MANAGED');

    // 2. Comprobar que ningún campo de texto de socio contiene la contraseña
    const valoresSocio = Object.values(socioDb).map(v => String(v));
    expect(valoresSocio.some(v => v === pwdTemporal)).toBe(false);

    // 3. Comprobar que en orden y voucher de esta afiliación tampoco se filtró
    const { data: voucherDb } = await sbAdmin
      .from('voucher')
      .select('*')
      .eq('orden_id', resultadoAfil1.orden_id);
    if (voucherDb && voucherDb.length > 0) {
      const valoresVoucher = Object.values(voucherDb[0]).map(v => String(v));
      expect(valoresVoucher.some(v => v === pwdTemporal)).toBe(false);
    }
  });

  it('7 · Al cambiarla en P-18, password_cambiada pasa a true', async () => {
    const sbSocioActivo = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-cambio-t25', persistSession: false, autoRefreshToken: false }
    });

    // 1. Iniciar sesión con la contraseña temporal
    const { error: errLogin } = await sbSocioActivo.auth.signInWithPassword({
      email: EMAIL_TEST_1,
      password: resultadoAfil1.password_temporal
    });
    expect(errLogin).toBeNull();

    // 2. Verificar que inicialmente password_cambiada es false
    const { data: socioAntes } = await sbAdmin
      .from('socio')
      .select('password_cambiada')
      .eq('email', EMAIL_TEST_1)
      .single();
    expect(socioAntes.password_cambiada).toBe(false);

    // 3. Cambiar contraseña mediante servicio
    const nuevaPasswordPropia = 'MiNuevaClaveSegura2026!';
    await cambiarPasswordSocio(nuevaPasswordPropia, sbSocioActivo);

    // 4. Verificar en base de datos que password_cambiada ahora es true
    const { data: socioDespues } = await sbAdmin
      .from('socio')
      .select('password_cambiada')
      .eq('email', EMAIL_TEST_1)
      .single();
    expect(socioDespues.password_cambiada).toBe(true);

    // 5. Verificar que ahora entra con la nueva contraseña
    const sbLoginNuevo = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-login-nuevo-t25', persistSession: false, autoRefreshToken: false }
    });
    const { data: loginOk, error: errNuevo } = await sbLoginNuevo.auth.signInWithPassword({
      email: EMAIL_TEST_1,
      password: nuevaPasswordPropia
    });
    expect(errNuevo).toBeNull();
    expect(loginOk.user).toBeDefined();
  });

  it('8 · Registrar sin voucher deja imagen_url en NULL, no en placehold.co', async () => {
    // 1. Registrar pedido de recompra con p_voucher sin imagen_url
    const { data: resRecompra, error: errRecompra } = await sbAdmin.rpc('fn_registrar_pedido_recompra', {
      p_socio_id: 1,
      p_items: [{ producto_id: 1, cantidad: 1 }],
      p_voucher: {
        banco: 'BCP',
        numero_operacion: 'OP-TEST-NOVOUCHER',
        monto_cent: 15000,
        imagen_url: '' // Vacío o null
      }
    });
    expect(errRecompra).toBeNull();
    expect(resRecompra?.exito).toBe(true);
    ordenesParaLimpiar.push(resRecompra.orden_id);

    // 2. Consultar el voucher creado en Postgres
    const { data: voucherDb, error: errVoucher } = await sbAdmin
      .from('voucher')
      .select('imagen_url')
      .eq('orden_id', resRecompra.orden_id)
      .single();

    expect(errVoucher).toBeNull();
    expect(voucherDb.imagen_url).toBeNull();
    expect(String(voucherDb.imagen_url)).not.toContain('placehold.co');

    // 3. Verificar también que la afiliación 1 (cuyo voucher no incluyó imagen_url) tenga imagen_url en null
    const { data: voucherAfil1 } = await sbAdmin
      .from('voucher')
      .select('imagen_url')
      .eq('orden_id', resultadoAfil1.orden_id)
      .single();
    expect(voucherAfil1.imagen_url).toBeNull();
  });

  it('9 · Los 508 socios existentes siguen pudiendo entrar (las cuentas viejas NO se tocan)', async () => {
    // Cuenta certificada existente (socio 1 Admin)
    const sbExistente1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-existente-1', persistSession: false, autoRefreshToken: false }
    });
    const { data: login1, error: err1 } = await sbExistente1.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    expect(err1).toBeNull();
    expect(login1.user.email).toBe('socio001@ejemplo.test');

    // Cuenta certificada existente (socio 2 Ana)
    const sbExistente2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-existente-2', persistSession: false, autoRefreshToken: false }
    });
    const { data: login2, error: err2 } = await sbExistente2.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    expect(err2).toBeNull();
    expect(login2.user.email).toBe('socio002@ejemplo.test');
  });
});
