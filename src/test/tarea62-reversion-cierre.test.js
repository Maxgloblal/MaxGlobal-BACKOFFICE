import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { sbService } from './limpiezaTest';
import { ejecutarCierreCiclo, revertirCierreCiclo } from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-62 · Guarda de fecha fin (RF-508) y Reversión de Cierre de Ciclo', () => {
  let sbAdmin;
  const TEST_ANIO = 2024;
  const TEST_MES = 1;
  let testCicloId = null;
  let nuevoCicloId = null;
  let adminSocioId = null;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t62-admin', persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (authError) throw new Error(`Fallo al autenticar ADMIN en prueba TAREA-62: ${authError.message}`);

    const { data: socioAdmin } = await sbService
      .from('socio')
      .select('id')
      .eq('email', 'socio001@ejemplo.test')
      .single();
    adminSocioId = socioAdmin?.id || 1;

    // Limpieza preventiva de ciclos de prueba anteriores (años 2024/2025)
    await sbService.from('ciclo').delete().eq('anio', TEST_ANIO);
  }, 30000);

  afterAll(async () => {
    // Asegurar restauración de ciclo 30 a 'abierto'
    await sbService.from('ciclo').update({ estado: 'abierto' }).eq('id', 30);

    // Limpiar datos de prueba si quedaron
    if (nuevoCicloId) {
      await sbService.from('ciclo').delete().eq('id', nuevoCicloId);
    }
    if (testCicloId) {
      await sbService.from('comision').delete().eq('ciclo_id', testCicloId);
      await sbService.from('wallet_movimiento').delete().eq('ciclo_id', testCicloId);
      await sbService.from('auditoria').delete().eq('tabla', 'ciclo').eq('registro_id', testCicloId);
      await sbService.from('ciclo').delete().eq('id', testCicloId);
    }
    await sbService.from('ciclo').delete().eq('anio', TEST_ANIO);
  }, 20000);

  it('a) 🔴 La guarda en America/Lima BLOQUEA el cierre si hoy < fecha_fin (RF-508)', async () => {
    // Ciclo 30 termina el 2026-12-31, posterior a la fecha actual
    const { data: c30 } = await sbService.from('ciclo').select('*').eq('id', 30).single();
    expect(c30).toBeDefined();
    expect(c30.estado).toBe('abierto');
    expect(c30.fecha_fin).toBe('2026-12-31');

    // Intentar cerrar ciclo 30 debe ser rechazado por la guarda
    await expect(ejecutarCierreCiclo(30, sbAdmin)).rejects.toThrow(/No se puede cerrar el ciclo 12\/2026: termina el 2026-12-31/i);
  });

  it('b) El cierre PROCEDE exitosamente si hoy >= fecha_fin', async () => {
    // Para probar el cierre sin colisionar con la regla de un solo ciclo abierto:
    // 1. Ponemos temporalmente ciclo 30 en 'cerrado'
    await sbService.from('ciclo').update({ estado: 'cerrado' }).eq('id', 30);

    // 2. Insertamos un ciclo de prueba en el pasado (2024-01-01 a 2024-01-31)
    const { data: nuevoCiclo, error: errCiclo } = await sbService
      .from('ciclo')
      .insert({
        anio: TEST_ANIO,
        mes: TEST_MES,
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-01-31',
        estado: 'abierto'
      })
      .select()
      .single();

    expect(errCiclo).toBeNull();
    testCicloId = nuevoCiclo.id;

    // 3. Insertamos comisiones de prueba en el ciclo:
    // - Una retenida por 'inactivo' de socio no activo (debe pasar a 'anulada')
    // - Una confirmada lista para abono (debe abonarse a billetera)
    const { data: comRetenida, error: errRet } = await sbService
      .from('comision')
      .insert({
        ciclo_id: testCicloId,
        beneficiario_id: adminSocioId,
        generador_id: adminSocioId,
        tipo: 'patrocinio',
        nivel: 1,
        porcentaje: 20,
        base_cent: 7500,
        monto_cent: 1500, // S/. 15.00
        estado: 'retenida',
        detalle: { motivo: 'inactivo', formula: 'Prueba TAREA-62 (retenida: inactivo)' }
      })
      .select()
      .single();
    expect(errRet).toBeNull();

    const { data: comConfirmada, error: errConf } = await sbService
      .from('comision')
      .insert({
        ciclo_id: testCicloId,
        beneficiario_id: adminSocioId,
        generador_id: adminSocioId,
        tipo: 'patrocinio',
        nivel: 1,
        porcentaje: 20,
        base_cent: 12500,
        monto_cent: 2500, // S/. 25.00
        estado: 'confirmada',
        detalle: { motivo: 'calificado', formula: 'Prueba TAREA-62 confirmada' }
      })
      .select()
      .single();
    expect(errConf).toBeNull();

    // 4. Ejecutar el cierre del ciclo de prueba
    const resCierre = await ejecutarCierreCiclo(testCicloId, sbAdmin);
    expect(resCierre.exito).toBe(true);
    expect(resCierre.ciclo_cerrado_id).toBe(testCicloId);
    expect(resCierre.nuevo_ciclo_id).toBeDefined();
    nuevoCicloId = resCierre.nuevo_ciclo_id;

    // Verificar que el ciclo quedó 'cerrado'
    const { data: cicloCerrado } = await sbService.from('ciclo').select('*').eq('id', testCicloId).single();
    expect(cicloCerrado.estado).toBe('cerrado');
    expect(cicloCerrado.cerrado_en).not.toBeNull();

    // Verificar que la comisión retenida pasó a 'anulada'
    const { data: comAnuladaCheck } = await sbService.from('comision').select('*').eq('id', comRetenida.id).single();
    expect(comAnuladaCheck.estado).toBe('anulada');

    // Verificar que se creó el abono en wallet_movimiento por la confirmada
    const { data: abonosCierre } = await sbService
      .from('wallet_movimiento')
      .select('*')
      .eq('ciclo_id', testCicloId)
      .eq('tipo', 'abono');
    expect(abonosCierre.length).toBe(1);
    expect(abonosCierre[0].monto_cent).toBe(2500);
  });

  it('c) fn_revertir_cierre_ciclo funciona sin JWT (service_role / SQL Editor), acota motivos y reabre el ciclo', async () => {
    expect(testCicloId).not.toBeNull();

    // 1. Ejecutar reversión desde service_role (sin JWT de usuario, emulando SQL Editor)
    const { data: resRev, error: errRev } = await sbService.rpc('fn_revertir_cierre_ciclo', {
      p_ciclo_id: testCicloId,
      p_admin_id: adminSocioId
    });

    expect(errRev).toBeNull();
    expect(resRev.exito).toBe(true);
    expect(resRev.estado).toBe('abierto');
    expect(resRev.comisiones_restauradas).toBeGreaterThanOrEqual(1);
    expect(resRev.abonos_eliminados).toBe(1);

    // 2. El ciclo vuelve a 'abierto', cerrado_en y cerrado_por a NULL
    const { data: cicloReabierto } = await sbService.from('ciclo').select('*').eq('id', testCicloId).single();
    expect(cicloReabierto.estado).toBe('abierto');
    expect(cicloReabierto.cerrado_en).toBeNull();
    expect(cicloReabierto.cerrado_por).toBeNull();

    // 3. Las comisiones con motivo inactivo/pack_insuficiente vuelven a 'retenida'
    const { data: comsRestauradas } = await sbService
      .from('comision')
      .select('*')
      .eq('ciclo_id', testCicloId);
    
    const retenidaRestaurada = comsRestauradas.find(c => c.detalle?.motivo === 'inactivo');
    expect(retenidaRestaurada).toBeDefined();
    expect(retenidaRestaurada.estado).toBe('retenida');

    // 4. Los abonos de wallet creados por el cierre se eliminaron
    const { data: abonosDespues } = await sbService
      .from('wallet_movimiento')
      .select('*')
      .eq('ciclo_id', testCicloId);
    expect(abonosDespues.length).toBe(0);

    // 5. El ciclo siguiente (vacío) fue eliminado
    const { data: cicloSiguienteCheck } = await sbService
      .from('ciclo')
      .select('*')
      .eq('id', nuevoCicloId)
      .maybeSingle();
    expect(cicloSiguienteCheck).toBeNull();

    // 6. Se auditó la reversión
    const { data: auditRev } = await sbService
      .from('auditoria')
      .select('*')
      .eq('tabla', 'ciclo')
      .eq('registro_id', testCicloId)
      .eq('accion', 'revertir_cierre_ciclo')
      .maybeSingle();
    expect(auditRev).not.toBeNull();
  });

  it('d) Inversión de orden: comisiones de ciclo posterior NO son degradadas al revertir primero y mover después', async () => {
    // Escenario de corrección 2:
    // Ciclo 2 está abierto tras la reversión.
    // Simulamos una comisión confirmada en ciclo 4 (ej. la de socio 3 con motivo calificado):
    const { data: cicloFantasma } = await sbService
      .from('ciclo')
      .insert({
        anio: TEST_ANIO,
        mes: 4,
        fecha_inicio: '2024-04-01',
        fecha_fin: '2024-04-30',
        estado: 'cerrado'
      })
      .select()
      .single();

    const { data: comCiclo4 } = await sbService
      .from('comision')
      .insert({
        ciclo_id: cicloFantasma.id,
        beneficiario_id: adminSocioId,
        generador_id: adminSocioId,
        tipo: 'residual',
        nivel: 1,
        porcentaje: 40,
        base_cent: 7000,
        monto_cent: 2800,
        estado: 'confirmada',
        detalle: { motivo: 'calificado', formula: '70 pts * 40% = 2800 cent' }
      })
      .select()
      .single();

    // Como se revirtió primero, ahora se mueven las filas del ciclo fantasma al ciclo reabierto:
    await sbService.from('comision').update({ ciclo_id: testCicloId }).eq('ciclo_id', cicloFantasma.id);

    // Verificar que la comisión mantiene su estado 'confirmada' intacto (no fue degradada a retenida)
    const { data: comMovida } = await sbService.from('comision').select('*').eq('id', comCiclo4.id).single();
    expect(comMovida.estado).toBe('confirmada');
    expect(comMovida.ciclo_id).toBe(testCicloId);

    // Limpieza del ciclo fantasma de prueba
    await sbService.from('comision').delete().eq('id', comCiclo4.id);
    await sbService.from('ciclo').delete().eq('id', cicloFantasma.id);
  });
});
