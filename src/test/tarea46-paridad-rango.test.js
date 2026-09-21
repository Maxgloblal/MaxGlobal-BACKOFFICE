import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { obtenerVistaPreviaCierre } from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

// Beneficiarios históricos inmutables del Ciclo 1 (cerrado)
const BENEFICIARIOS_HISTORICOS_CICLO_1 = [
  { id: 2, codigo: 'MG00002', nombre: 'ANA QUISPE', rango: 'PLATINO', monto_cent: 150000 },
  { id: 3, codigo: 'MG00003', nombre: 'BRUNO ROJAS', rango: 'PLATA', monto_cent: 20000 },
  { id: 5, codigo: 'MG00005', nombre: 'DIEGO SALAS', rango: 'PLATA', monto_cent: 20000 },
  { id: 7, codigo: 'MG00007', nombre: 'FABIO LEON', rango: 'ORO', monto_cent: 50000 },
  { id: 8, codigo: 'MG00008', nombre: 'GINA PAREDES', rango: 'PLATA', monto_cent: 20000 },
  { id: 9, codigo: 'MG00009', nombre: 'HUGO CASTRO', rango: 'ESMERALDA', monto_cent: 300000 },
  { id: 10, codigo: 'MG00010', nombre: 'IRIS FLORES', rango: 'ORO', monto_cent: 50000 },
  { id: 11, codigo: 'MG00011', nombre: 'JOEL RAMOS', rango: 'PLATA', monto_cent: 20000 },
  { id: 12, codigo: 'MG00012', nombre: 'KARLA DIAZ', rango: 'JADE', monto_cent: 5000 },
  { id: 22, codigo: 'MG00022', nombre: 'JUAN FLORES', rango: 'PLATA', monto_cent: 20000 },
  { id: 28, codigo: 'MG00028', nombre: 'JUAN CASTRO', rango: 'JADE', monto_cent: 5000 },
  { id: 31, codigo: 'MG00031', nombre: 'MONICA HERRERA', rango: 'JADE', monto_cent: 5000 },
  { id: 33, codigo: 'MG00033', nombre: 'VALERIA GUTIERREZ', rango: 'PLATA', monto_cent: 20000 },
  { id: 41, codigo: 'MG00041', nombre: 'MARIA TORRES', rango: 'PLATA', monto_cent: 20000 },
  { id: 43, codigo: 'MG00043', nombre: 'JORGE REYES', rango: 'BRONCE', monto_cent: 10000 },
  { id: 48, codigo: 'MG00048', nombre: 'MANUEL RAMIREZ', rango: 'PLATA', monto_cent: 20000 },
  { id: 51, codigo: 'MG00051', nombre: 'JORGE VASQUEZ', rango: 'JADE', monto_cent: 5000 },
  { id: 59, codigo: 'MG00059', nombre: 'PATRICIA FLORES', rango: 'BRONCE', monto_cent: 10000 },
  { id: 67, codigo: 'MG00067', nombre: 'JUAN MORALES', rango: 'JADE', monto_cent: 5000 },
  { id: 72, codigo: 'MG00072', nombre: 'PAOLA ROJAS', rango: 'JADE', monto_cent: 5000 },
  { id: 73, codigo: 'MG00073', nombre: 'LUCIA SANCHEZ', rango: 'JADE', monto_cent: 5000 },
  { id: 88, codigo: 'MG00088', nombre: 'CARMEN ROJAS', rango: 'BRONCE', monto_cent: 10000 },
  { id: 155, codigo: 'MG00155', nombre: 'RICARDO MENDOZA', rango: 'JADE', monto_cent: 5000 }
];

describe('TAREA-46 · Unificación de Motores y Paridad de Bono de Rango', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-paridad-rango', persistSession: false, autoRefreshToken: false }
    });
    const { error } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (error) throw new Error(`Fallo al autenticar ADMIN en prueba de paridad: ${error.message}`);
  }, 30000);

  it('1 · Invariante Inmutable Ciclo 1: fn_calcular_y_persistir_rangos(1, true) → exactamente 23 comisiones y S/. 7,800.00 (780000 cent)', async () => {
    const { data, error } = await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 1,
      p_solo_calculo: true
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.soloCalculo).toBe(true);
    expect(data.califican).toBe(23);
    expect(data.comisionesCreadas).toBe(23);
    expect(data.totalBonoCent).toBe(780000);
    expect(data.comisiones).toHaveLength(23);
  });

  it('2 · Invariante Inmutable Ciclo 2: fn_calcular_y_persistir_rangos(2, true) → exactamente 12 comisiones y S/. 1,200.00 (120000 cent)', async () => {
    const { data, error } = await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 2,
      p_solo_calculo: true
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.soloCalculo).toBe(true);
    expect(data.califican).toBe(12);
    expect(data.comisionesCreadas).toBe(12);
    expect(data.totalBonoCent).toBe(120000);
    expect(data.comisiones).toHaveLength(12);
  });

  it('3 · Invariante Inmutable Ciclo 3: fn_calcular_y_persistir_rangos(3, true) → exactamente 8 comisiones y S/. 600.00 (60000 cent)', async () => {
    const { data, error } = await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 3,
      p_solo_calculo: true
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.soloCalculo).toBe(true);
    expect(data.califican).toBe(8);
    expect(data.comisionesCreadas).toBe(8);
    expect(data.totalBonoCent).toBe(60000);
    expect(data.comisiones).toHaveLength(8);
  });

  it('4 · Paridad SOCIO POR SOCIO del Ciclo 1: los 23 beneficiarios y montos coinciden al 100% con la historia contable', async () => {
    const { data, error } = await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 1,
      p_solo_calculo: true
    });

    expect(error).toBeNull();
    const comisionesPostgres = data.comisiones;

    for (const hist of BENEFICIARIOS_HISTORICOS_CICLO_1) {
      const match = comisionesPostgres.find(c => c.beneficiario_id === hist.id);
      expect(match, `Falta el socio ${hist.codigo} (${hist.nombre}) en el cálculo de Postgres`).toBeDefined();
      expect(match.monto_cent, `Monto diferente para ${hist.nombre}`).toBe(hist.monto_cent);
      expect(match.rango_codigo, `Rango diferente para ${hist.nombre}`).toBe(hist.rango);
    }
  });

  it('5 · El modo solo cálculo (p_solo_calculo = true) NO muta las tablas rango_ciclo ni comision', async () => {
    // Tomar foto previa de conteo
    const { count: comisionesAntes } = await sbAdmin
      .from('comision')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'rango');

    // Ejecutar modo solo cálculo
    await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 1,
      p_solo_calculo: true
    });

    // Verificar foto posterior
    const { count: comisionesDespues } = await sbAdmin
      .from('comision')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'rango');

    expect(comisionesDespues).toBe(comisionesAntes);
  });

  it('6 · obtenerVistaPreviaCierre integra el RPC de Postgres en seco sin discrepancias de bono de rango', async () => {
    const vistaPrevia = await obtenerVistaPreviaCierre(1, sbAdmin);
    expect(vistaPrevia).toBeDefined();
    expect(vistaPrevia.bonos.rango.totalCent).toBe(780000);
    expect(vistaPrevia.bonos.rango.totalSoles).toBe(7800);
    expect(vistaPrevia.bonos.rango.cantidadComisiones).toBe(23);
    expect(vistaPrevia.bonos.rango.cantidadSocios).toBe(23);
  });
});
