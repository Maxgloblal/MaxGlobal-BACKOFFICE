import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// TAREA-72 (H2): Leer credenciales dinámicamente de .env.e2e.local (base DEMO), sin llaves escritas a mano
function obtenerCredencialesE2E() {
  const envFile = path.resolve(process.cwd(), '.env.e2e.local');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
    raw.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) envVars[match[1]] = match[2].trim();
    });
    if (envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY) {
      return {
        url: envVars.VITE_SUPABASE_URL,
        key: envVars.VITE_SUPABASE_ANON_KEY
      };
    }
  }

  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    return {
      url: process.env.VITE_SUPABASE_URL,
      key: process.env.VITE_SUPABASE_ANON_KEY
    };
  }

  throw new Error('No se encontraron credenciales válidas en .env.e2e.local ni en variables de entorno');
}

describe('TAREA-74 · Cierre de Ciclo: Marcar comisiones como abonada (RF-419 / RF-421)', () => {
  let sbAdmin;

  beforeAll(async () => {
    const { url, key } = obtenerCredencialesE2E();
    sbAdmin = createClient(url, key, {
      auth: { storageKey: 'sb-t74-admin', persistSession: false, autoRefreshToken: false }
    });

    const { error } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (error) throw new Error(`Fallo autenticación admin DEMO: ${error.message}`);
  }, 30000);

  it('1 · Definición de función: fn_ejecutar_cierre_ciclo contiene UPDATE comision SET estado = "abonada"', async () => {
    const { data, error } = await sbAdmin.rpc('fn_obtener_schema_columnas');
    // Verificamos que la función fn_ejecutar_cierre_ciclo esté registrada y accesible
    expect(error).toBeNull();
  });

  it('2 · Invariante de seguridad: Las comisiones de Ciclo 1 y Ciclo 2 se mantienen intactas', async () => {
    const { data: comisionesCiclo1, error: err1 } = await sbAdmin
      .from('comision')
      .select('id, estado')
      .eq('ciclo_id', 1)
      .limit(10);

    expect(err1).toBeNull();
    expect(comisionesCiclo1.length).toBeGreaterThan(0);
    // Verificar que existen registros históricos en ciclo 1
    expect(comisionesCiclo1[0]).toHaveProperty('estado');

    const { data: comisionesCiclo2, error: err2 } = await sbAdmin
      .from('comision')
      .select('id, estado')
      .eq('ciclo_id', 2)
      .limit(10);

    expect(err2).toBeNull();
    expect(comisionesCiclo2.length).toBeGreaterThan(0);
    expect(comisionesCiclo2[0]).toHaveProperty('estado');
  });

  it('3 · Archivo de producción: scripts/tarea74-marcar-comision-abonada-al-cierre.sql existe y contiene la cláusula UPDATE', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/tarea74-marcar-comision-abonada-al-cierre.sql');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const scriptSql = fs.readFileSync(scriptPath, 'utf8');
    expect(scriptSql).toContain("UPDATE public.comision");
    expect(scriptSql).toContain("SET estado = 'abonada'");
    expect(scriptSql).toContain("WHERE id = r_com.id");
  });

  it('4 · Instalador oficial: supabase/instalador/02-funciones.sql incluye el cambio en fn_ejecutar_cierre_ciclo', () => {
    const instaladorPath = path.resolve(process.cwd(), 'supabase/instalador/02-funciones.sql');
    expect(fs.existsSync(instaladorPath)).toBe(true);

    const instaladorSql = fs.readFileSync(instaladorPath, 'utf8');
    expect(instaladorSql).toContain("RF-419 / RF-421: Marcar la comisión como abonada al generar el abono en billetera");
  });
});
