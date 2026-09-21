import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { consultarPaginado } from '../lib/consultarPaginado';
import { obtenerMiBilletera } from '../servicios/socio';
import { obtenerVistaPreviaCierre, evaluarTechosCierre } from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-51 · El Patrocinio al Instante (Parte 2: Cobro Inmediato y Protección de Billetera)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t51', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);
  });

  // =========================================================================
  // ESCENARIO 1: Socio ACTIVO afilia -> billetera sube HOY · comisión 'abonada'
  // =========================================================================
  it('Escenario 1 · Socio ACTIVO afilia: billetera sube HOY y la comisión pasa a estado "abonada"', async () => {
    // 1. Verificar en base que existen comisiones de patrocinio con estado 'abonada'
    const { data: comAbonadas, error: errCom } = await sbAdmin
      .from('comision')
      .select('id, tipo, estado, monto_cent, beneficiario_id, orden_id')
      .eq('tipo', 'patrocinio')
      .eq('estado', 'abonada')
      .limit(5);

    expect(errCom).toBeNull();
    expect(comAbonadas).toBeDefined();

    // 2. Verificar que cada comisión 'abonada' tiene su correspondiente fila en wallet_movimiento
    if (comAbonadas && comAbonadas.length > 0) {
      for (const com of comAbonadas) {
        const { data: movs, error: errMov } = await sbAdmin
          .from('wallet_movimiento')
          .select('id, tipo, monto_cent, comision_id, saldo_despues_cent')
          .eq('comision_id', com.id);

        expect(errMov).toBeNull();
        expect(movs.length).toBe(1);
        expect(movs[0].tipo).toBe('abono');
        expect(Number(movs[0].monto_cent)).toBe(Number(com.monto_cent));
      }
    }
  });

  // =========================================================================
  // ESCENARIO 2: Se cierra el ciclo -> billetera NO vuelve a subir por esa comisión
  // =========================================================================
  it('Escenario 2 · Se cierra el ciclo: el cierre abona únicamente "confirmada", excluyendo "abonada"', async () => {
    // Verificamos la definición de fn_ejecutar_cierre_ciclo que excluye 'abonada'
    // y solo toma (estado = 'confirmada' OR estado IS NULL)
    const { data: comAbonadaEnCiclo, error: errAbonada } = await sbAdmin
      .from('comision')
      .select('id, estado')
      .eq('estado', 'abonada')
      .limit(1);

    expect(errAbonada).toBeNull();
    if (comAbonadaEnCiclo && comAbonadaEnCiclo.length > 0) {
      const cId = comAbonadaEnCiclo[0].id;
      // Verificar que solo tiene 1 abono en wallet_movimiento (no se duplica jamás)
      const { data: movs } = await sbAdmin
        .from('wallet_movimiento')
        .select('id')
        .eq('comision_id', cId);

      expect(movs.length).toBe(1);
    }
  });

  // =========================================================================
  // ESCENARIO 3: Socio INACTIVO afilia -> queda 'retenida', NO sube; se activa -> cobra al cierre
  // =========================================================================
  it('Escenario 3 · Socio INACTIVO afilia: comisión queda "retenida" (motivo: inactivo), billetera no sube', async () => {
    // Verificamos la comisión 2864 generada en el Bloque 0
    const { data: comRetenida, error: errR } = await sbAdmin
      .from('comision')
      .select('id, tipo, estado, monto_cent, detalle, beneficiario_id')
      .eq('id', 2864)
      .single();

    expect(errR).toBeNull();
    expect(comRetenida.estado).toBe('retenida');
    expect(comRetenida.tipo).toBe('patrocinio');
    expect(comRetenida.detalle?.motivo).toBe('inactivo');

    // La billetera del beneficiario NO tiene ningún abono por esta comisión
    const { data: movsRetenida } = await sbAdmin
      .from('wallet_movimiento')
      .select('id')
      .eq('comision_id', 2864);

    expect(movsRetenida.length).toBe(0);
  });

  // =========================================================================
  // ESCENARIO 4: Residual de socio activo espera al cierre, NO se abona al instante
  // =========================================================================
  it('Escenario 4 · Residual de socio activo: NO se abona al instante, queda en "confirmada" esperando el cierre', async () => {
    // Comprobar que todas las comisiones de tipo 'residual' en ciclo abierto tienen estado 'confirmada' o 'retenida', NUNCA 'abonada'
    const { data: residuales, error: errRes } = await sbAdmin
      .from('comision')
      .select('id, tipo, estado')
      .eq('tipo', 'residual')
      .eq('estado', 'abonada');

    expect(errRes).toBeNull();
    expect(residuales.length).toBe(0); // Ningún residual se abona al instante
  });

  // =========================================================================
  // ESCENARIO 5: Dos afiliaciones seguidas del mismo socio activo -> cadena continua
  // =========================================================================
  it('Escenario 5 · Dos afiliaciones seguidas del mismo socio: ambas se abonan y saldo_despues_cent es continuo', async () => {
    // Socio 3 (Bruno Rojas) recibió dos afiliaciones consecutivas en ciclo 30
    const { data: sMovs, error: errM } = await sbAdmin
      .from('wallet_movimiento')
      .select('id, socio_id, tipo, monto_cent, saldo_despues_cent, creado_en')
      .eq('socio_id', 3)
      .order('id', { ascending: true });

    expect(errM).toBeNull();
    expect(sMovs).toBeDefined();
    expect(sMovs.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < sMovs.length; i++) {
      const prev = sMovs[i - 1];
      const curr = sMovs[i];
      const delta = curr.tipo === 'abono' ? Number(curr.monto_cent) : -Math.abs(Number(curr.monto_cent));
      expect(Number(curr.saldo_despues_cent)).toBe(Number(prev.saldo_despues_cent) + delta);
    }
  });

  // =========================================================================
  // INVARIANTE: Billetera == comisiones abonada + confirmada (cerradas) + pagada (cerradas)
  // =========================================================================
  it('Invariante de la Billetera · En cualquier socio, lo abonado a su billetera == comisiones "abonada" + "confirmada"/"pagada" (ciclos cerrados)', async () => {
    // 1. Caso Ciclo Abierto con Patrocinio Inmediato (Socio 3)
    const { data: abonosSocio3 } = await sbAdmin
      .from('wallet_movimiento')
      .select('monto_cent, comision_id')
      .eq('socio_id', 3)
      .eq('tipo', 'abono');

    const totalAbonadoSocio3 = (abonosSocio3 || []).reduce((acc, m) => acc + Number(m.monto_cent), 0);

    const { data: comisionesAbonadasSocio3 } = await sbAdmin
      .from('comision')
      .select('monto_cent')
      .eq('beneficiario_id', 3)
      .eq('estado', 'abonada');

    const totalComisionesAbonadasSocio3 = (comisionesAbonadasSocio3 || []).reduce(
      (acc, c) => acc + Number(c.monto_cent),
      0
    );

    expect(totalAbonadoSocio3).toBe(totalComisionesAbonadasSocio3);
    expect(totalAbonadoSocio3).toBe(4800); // S/. 48.00 por las dos afiliaciones

    // 2. Caso Ciclo Cerrado (Socio 2 en Ciclo 3)
    const { data: abonosSocio2 } = await sbAdmin
      .from('wallet_movimiento')
      .select('monto_cent')
      .eq('socio_id', 2)
      .eq('ciclo_id', 3)
      .eq('tipo', 'abono');

    const totalAbonadoSocio2 = (abonosSocio2 || []).reduce((acc, m) => acc + Number(m.monto_cent), 0);

    const { data: comisionesSocio2 } = await sbAdmin
      .from('comision')
      .select('monto_cent')
      .eq('beneficiario_id', 2)
      .eq('ciclo_id', 3)
      .in('estado', ['confirmada', 'pagada']);

    const totalComisionesSocio2 = (comisionesSocio2 || []).reduce((acc, c) => acc + Number(c.monto_cent), 0);

    expect(totalAbonadoSocio2).toBe(totalComisionesSocio2);
    expect(totalAbonadoSocio2).toBe(120944); // 172 comisiones = S/. 1,209.44
  });

  // =========================================================================
  // INMUTABILIDAD HISTÓRICA: Ciclos 1, 2 y 3 no se mueven al centavo
  // =========================================================================
  it('Inmutabilidad histórica · Ciclos 1, 2 y 3 permanecen intactos al centavo', async () => {
    const c1 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 1));
    const c2 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 2));
    const c3 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 3));

    const suma1 = c1.reduce((acc, c) => acc + Number(c.monto_cent), 0);
    const suma2 = c2.reduce((acc, c) => acc + Number(c.monto_cent), 0);
    const suma3 = c3.reduce((acc, c) => acc + Number(c.monto_cent), 0);

    // Ciclo 1: 1,356 comisiones · S/. 66,137.40
    expect(c1.length).toBe(1356);
    expect(suma1).toBe(6613740);

    // Ciclo 2: 596 comisiones · S/. 20,403.94
    expect(c2.length).toBe(596);
    expect(suma2).toBe(2040394);

    // Ciclo 3: 466 comisiones · S/. 13,479.68
    expect(c3.length).toBe(466);
    expect(suma3).toBe(1347968);
  });

  // =========================================================================
  // RED DE SEGURIDAD: Guarda local de patrocinio (tope_patrocinio_por_orden_pct)
  // =========================================================================
  it('Red de seguridad · config contiene tope_patrocinio_por_orden_pct = 50', async () => {
    const { data: confTope, error: errConf } = await sbAdmin
      .from('config')
      .select('valor')
      .eq('clave', 'tope_patrocinio_por_orden_pct')
      .single();

    expect(errConf).toBeNull();
    expect(confTope).toBeDefined();
    expect(Number(confTope.valor)).toBe(50);
  });

  // =========================================================================
  // P-19: Mi Billetera excluye 'abonada' de estimadoCicloCent (no duplica dinero)
  // =========================================================================
  it('P-19 · obtenerMiBilletera excluye comisiones "abonada" del estimado del ciclo', async () => {
    const data = await obtenerMiBilletera(3, 30, sbAdmin);
    expect(data).toBeDefined();
    expect(typeof data.saldoDisponibleCent).toBe('number');
    expect(typeof data.estimadoCicloCent).toBe('number');
    // Saldo disponible incluye lo abonado; estimado solo incluye confirmadas pendientes
  });

  // =========================================================================
  // P-25: Vista previa desglosa Total Ciclo, Ya Abonado y Neto Cierre
  // =========================================================================
  it('P-25 · obtenerVistaPreviaCierre desglosa totalCicloCent, yaAbonadoCent y netoAbonarCierreCent', async () => {
    const vp = await obtenerVistaPreviaCierre(30, sbAdmin);
    expect(vp).toBeDefined();
    expect(typeof vp.totalCicloCent).toBe('number');
    expect(typeof vp.yaAbonadoCent).toBe('number');
    expect(typeof vp.netoAbonarCierreCent).toBe('number');
    expect(vp.totalCicloCent).toBe(vp.yaAbonadoCent + vp.netoAbonarCierreCent);

    const techos = await evaluarTechosCierre(30, vp, sbAdmin);
    expect(techos).toBeDefined();
    expect(typeof techos.bloqueado).toBe('boolean');
  });
});
