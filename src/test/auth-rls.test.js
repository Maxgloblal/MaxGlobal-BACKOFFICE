import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-05 · Bloque 4: Verificación de Aislamiento RLS en Base de Datos Real', () => {
  let sbAna;
  let sbAdmin;
  let sbAnon;

  beforeAll(async () => {
    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-anon', persistSession: false, autoRefreshToken: false }
    });

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo al autenticar ANA: ${errAna.message}`);

    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);
  });

  it('1. ANA (id 2) entra y ve su propia fila de socio', async () => {
    const { data, error } = await sbAna
      .from('socio')
      .select('id, email, nombres, apellidos')
      .eq('id', 2);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(2);
    expect(data[0].nombres).toBe('ANA');
  });

  it('2. ANA ve a sus descendientes en la red (ej. Bruno id 3)', async () => {
    const { data, error } = await sbAna
      .from('socio')
      .select('id, email, nombres')
      .eq('id', 3);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(3);
  });

  it('3. 🔴 ANA NO ve a un socio que no está en su descendencia (id 15 - Teresa)', async () => {
    const { data, error } = await sbAna
      .from('socio')
      .select('id, email, nombres')
      .eq('id', 15);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(0);
  });

  it('4. 🔴 ANA solo ve las comisiones donde ella es beneficiaria (0 comisiones de terceros)', async () => {
    const { data, error } = await sbAna
      .from('comision')
      .select('id, beneficiario_id, monto_cent, tipo');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);

    const comisionesTerceros = data.filter((c) => c.beneficiario_id !== 2);
    expect(comisionesTerceros.length).toBe(0);
  });

  it('5. 🔴 ANA NO ve la billetera de otro socio (wallet_movimiento de socio 15)', async () => {
    const { data, error } = await sbAna
      .from('wallet_movimiento')
      .select('*')
      .eq('socio_id', 15);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(0);
  });

  it('6. 🔴 ANA NO puede escribir en la tabla comision (RLS deniega INSERT)', async () => {
    const { data, error } = await sbAna.from('comision').insert({
      beneficiario_id: 2,
      ciclo_id: 1,
      tipo: 'patrocinio',
      monto_cent: 1000,
      estado: 'confirmada'
    });

    expect(error).not.toBeNull();
    expect(error.message).toMatch(/violates row-level security policy/i);
  });

  it('7. El ADMIN ve todos los socios (501 socios)', async () => {
    const { count, error } = await sbAdmin
      .from('socio')
      .select('id', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(501);
  });

  it('8. El ADMIN ve todas las comisiones del sistema', async () => {
    const { count, error } = await sbAdmin
      .from('comision')
      .select('id', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(2417); // 841 patrocinio + 1533 residual + 43 rango
  });

  it('9. Sin sesión (anónimo): 0 filas en socio, comision y wallet_movimiento', async () => {
    const { data: socios } = await sbAnon.from('socio').select('id');
    const { data: comisiones } = await sbAnon.from('comision').select('id');
    const { data: wallet } = await sbAnon.from('wallet_movimiento').select('id');

    expect(socios?.length || 0).toBe(0);
    expect(comisiones?.length || 0).toBe(0);
    expect(wallet?.length || 0).toBe(0);
  });
});
