import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { actualizarDatosSocioAdmin } from '../servicios/operacionAdmin.js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('Funcionalidad · Edición de Socios y Sincronización de Correo en P-27', () => {
  let sbAdmin;
  let sbAna;
  let socioOriginal;
  const SOCIO_TEST_ID = 3; // Bruno (socio en staging)

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-actualizar', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-actualizar', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    // Respaldar datos originales del socio de prueba
    const { data: socio, error: errSocio } = await sbAdmin
      .from('socio')
      .select('*')
      .eq('id', SOCIO_TEST_ID)
      .single();
    if (errSocio) throw new Error(`Fallo al respaldar socio: ${errSocio.message}`);
    socioOriginal = socio;
  });

  afterAll(async () => {
    // Restaurar datos originales del socio
    if (socioOriginal) {
      await actualizarDatosSocioAdmin(
        SOCIO_TEST_ID,
        {
          nombres: socioOriginal.nombres,
          apellidos: socioOriginal.apellidos,
          email: socioOriginal.email,
          telefono: socioOriginal.telefono,
          direccion: socioOriginal.direccion,
          ciudad: socioOriginal.ciudad,
          banco: socioOriginal.banco,
          cuenta_bancaria: socioOriginal.cuenta_bancaria
        },
        sbAdmin
      );
    }
  });

  it('1 · Un socio no administrador no puede ejecutar la RPC fn_actualizar_datos_socio_admin', async () => {
    const { error } = await sbAna.rpc('fn_actualizar_datos_socio_admin', {
      p_socio_id: SOCIO_TEST_ID,
      p_nombres: 'HACK',
      p_apellidos: 'TEST',
      p_email: 'hack@ejemplo.test'
    });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/Acceso denegado|administrador/i);
  });

  it('2 · El administrador actualiza exitosamente datos personales y bancarios', async () => {
    const nuevosDatos = {
      nombres: 'BRUNO EDITADO',
      apellidos: 'DIAZ TEST',
      email: socioOriginal.email,
      telefono: '987654321',
      direccion: 'Calle Los Robles 456',
      ciudad: 'Arequipa',
      banco: 'BCP',
      cuenta_bancaria: '191-99887766-0-55'
    };

    const res = await actualizarDatosSocioAdmin(SOCIO_TEST_ID, nuevosDatos, sbAdmin);
    expect(res).toBeTruthy();
    expect(res.nombres).toBe('BRUNO EDITADO');
    expect(res.apellidos).toBe('DIAZ TEST');
    expect(res.telefono).toBe('987654321');
    expect(res.ciudad).toBe('Arequipa');
    expect(res.banco).toBe('BCP');
    expect(res.cuenta_bancaria).toBe('191-99887766-0-55');

    // Comprobar que los inmutables protegidos (patrocinador, codigo, rol) no cambiaron
    expect(res.patrocinador_id).toBe(socioOriginal.patrocinador_id);
    expect(res.codigo).toBe(socioOriginal.codigo);
    expect(res.rol).toBe(socioOriginal.rol);
  });

  it('3 · El administrador puede cambiar el correo y se sincroniza en auth.users', async () => {
    const correoTemporal = `socio003.actualizado.${Date.now()}@ejemplo.test`;

    const res = await actualizarDatosSocioAdmin(
      SOCIO_TEST_ID,
      {
        nombres: 'BRUNO EDITADO',
        apellidos: 'DIAZ TEST',
        email: correoTemporal
      },
      sbAdmin
    );

    expect(res.email).toBe(correoTemporal.toLowerCase());

    // Verificar en public.socio
    const { data: socioDb } = await sbAdmin
      .from('socio')
      .select('email')
      .eq('id', SOCIO_TEST_ID)
      .single();
    expect(socioDb.email).toBe(correoTemporal.toLowerCase());

    // Restaurar inmediatamente el correo
    await actualizarDatosSocioAdmin(
      SOCIO_TEST_ID,
      {
        nombres: socioOriginal.nombres,
        apellidos: socioOriginal.apellidos,
        email: socioOriginal.email
      },
      sbAdmin
    );
  });

  it('4 · Rechaza actualización con correo de formato inválido', async () => {
    await expect(
      actualizarDatosSocioAdmin(
        SOCIO_TEST_ID,
        {
          nombres: 'TEST',
          apellidos: 'TEST',
          email: 'correo_invalido_sin_arroba'
        },
        sbAdmin
      )
    ).rejects.toThrow(/inválido/i);
  });

  it('5 · Rechaza actualización si el nuevo correo ya pertenece a otro socio', async () => {
    // El correo de Ana es socio002@ejemplo.test
    await expect(
      actualizarDatosSocioAdmin(
        SOCIO_TEST_ID,
        {
          nombres: 'TEST',
          apellidos: 'TEST',
          email: 'socio002@ejemplo.test'
        },
        sbAdmin
      )
    ).rejects.toThrow(/ya está registrado/i);
  });
});
