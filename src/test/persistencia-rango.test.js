import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { sbService } from './limpiezaTest';
import { calificarRangoSocio } from '../motor/rango';
import {
  calcularRangosEnMemoria,
  calcularYPersistirRangosDelCiclo
} from '../motor/persistenciaRango';
import {
  ejecutarCierreCiclo,
  revertirCierreCiclo,
  obtenerVistaPreviaCierre
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

const escalaRangosOficial = [
  { id: 1, orden: 1, codigo: 'JADE', nombre: 'Jade', puntos_grupales: 500, frontales_activos: 1, bono_cent: 5000, definido: true, activo: true },
  { id: 2, orden: 2, codigo: 'BRONCE', nombre: 'Bronce', puntos_grupales: 1000, frontales_activos: 2, bono_cent: 10000, definido: true, activo: true },
  { id: 3, orden: 3, codigo: 'PLATA', nombre: 'Plata', puntos_grupales: 2000, frontales_activos: 2, bono_cent: 20000, definido: true, activo: true },
  { id: 4, orden: 4, codigo: 'ORO', nombre: 'Oro', puntos_grupales: 4000, frontales_activos: 3, bono_cent: 50000, definido: true, activo: true },
  { id: 5, orden: 5, codigo: 'PLATINO', nombre: 'Platino', puntos_grupales: 8000, frontales_activos: 4, bono_cent: 150000, definido: true, activo: true },
  { id: 6, orden: 6, codigo: 'ESMERALDA', nombre: 'Esmeralda', puntos_grupales: 15000, frontales_activos: 5, bono_cent: 300000, definido: true, activo: true },
  { id: 7, orden: 7, codigo: 'ZAFIRO', nombre: 'Zafiro', puntos_grupales: 30000, frontales_activos: 6, bono_cent: 500000, definido: true, activo: true },
  { id: 8, orden: 8, codigo: 'DIAMANTE', nombre: 'Diamante', puntos_grupales: 60000, frontales_activos: 7, bono_cent: 1000000, definido: true, activo: true },
  { id: 9, orden: 9, codigo: 'DIAM-NEGRO', nombre: 'Diamante Negro', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 10, orden: 10, codigo: 'DOBLE-DIAM', nombre: 'Doble Diamante', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 11, orden: 11, codigo: 'TRIPLE-DIAM', nombre: 'Triple Diamante', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 12, orden: 12, codigo: 'CLUB-MILL', nombre: 'Club de Millonarios', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 13, orden: 13, codigo: 'IMPERIAL', nombre: 'Imperial', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 14, orden: 14, codigo: 'TITAN', nombre: 'Titán', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 15, orden: 15, codigo: 'EMB-ROYAL', nombre: 'Embajador Royal', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true },
  { id: 16, orden: 16, codigo: 'EMB-CORONA', nombre: 'Embajador Corona', puntos_grupales: null, frontales_activos: null, bono_cent: null, definido: false, activo: true }
];

describe('TAREA-12 · Conectar Bono de Rango al Cierre de Ciclo', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-persistencia-rango', persistSession: false, autoRefreshToken: false }
    });
    const { error } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (error) throw new Error(`Fallo al autenticar ADMIN en pruebas de rango: ${error.message}`);
  }, 30000);

  describe('3.1 · Pruebas de la Persistencia — con números calculados A MANO', () => {
    it('1 · KARLA (MG00012) con 958 pts grupales, 790 computables y 4 frontales califica a JADE con bono S/. 50.00 (5000 cent)', () => {
      // Datos reales de Karla en Ciclo 1 calculados a mano:
      // Líneas: Daniel (400), Raquel (268), Ana (174), Lucia (116).
      // Para Jade (500 pts, max 50% = 250 por linea):
      // min(400,250)=250, min(268,250)=250, min(174,250)=174, min(116,250)=116 => 790 computables
      const puntosKarla = {
        socio_id: 12,
        ciclo_id: 1,
        puntos_personales: 150,
        puntos_grupales: 958,
        lineas_frontales: [
          { frontal_socio_id: 55, puntos_totales: 400 },
          { frontal_socio_id: 77, puntos_totales: 268 },
          { frontal_socio_id: 40, puntos_totales: 174 },
          { frontal_socio_id: 35, puntos_totales: 116 }
        ],
        puntos_linea_mayor: 400,
        frontales_activos: 4,
        activo: true
      };

      const res = calificarRangoSocio(puntosKarla, escalaRangosOficial, null, 50);

      // Verificación con números exactos a mano
      expect(res.califica).toBe(true);
      expect(res.rango_codigo).toBe('JADE');
      expect(res.rango_orden).toBe(1);
      expect(res.bono_cent).toBe(5000); // Exactamente S/. 50.00
      expect(res.puntos_computables).toBe(790);
      expect(res.puntos_grupales).toBe(958);
      expect(res.frontales_activos).toBe(4);
      expect(res.motivo_bono).toBe('primer_ciclo');
    });

    it('2 · Un socio inactivo NO genera comisión, pero SÍ genera su fila de rango_ciclo con califica = false y bono = 0', () => {
      const puntosInactivo = {
        socio_id: 99,
        ciclo_id: 1,
        puntos_personales: 0,
        puntos_grupales: 5000,
        lineas_frontales: [
          { frontal_socio_id: 101, puntos_totales: 2500 },
          { frontal_socio_id: 102, puntos_totales: 2500 }
        ],
        puntos_linea_mayor: 2500,
        frontales_activos: 2,
        activo: false // Inactivo en el ciclo
      };

      const res = calificarRangoSocio(puntosInactivo, escalaRangosOficial, null, 50);

      expect(res.califica).toBe(false);
      expect(res.bono_cent).toBe(0);
      expect(res.rango_id).toBeNull();
      expect(res.rango_codigo).toBeNull();
      expect(res.motivo_bono).toBe('inactivo');
    });

    it('3 · Un socio que BAJA de rango genera fila con califica = false y bono_cent = 0 (Regla de negocio)', () => {
      // Socio que en el ciclo anterior fue ORO (orden 4) y este mes solo alcanza PLATA (orden 3)
      const puntosBaja = {
        socio_id: 2,
        ciclo_id: 3,
        puntos_personales: 72,
        puntos_grupales: 3514,
        lineas_frontales: [
          { frontal_socio_id: 10, puntos_totales: 2000 },
          { frontal_socio_id: 11, puntos_totales: 1514 }
        ],
        puntos_linea_mayor: 2000,
        frontales_activos: 2,
        activo: true
      };

      const rangoAnteriorOro = { orden: 4, codigo: 'ORO' };
      const res = calificarRangoSocio(puntosBaja, escalaRangosOficial, rangoAnteriorOro, 50);

      expect(res.rango_codigo).toBe('PLATA');
      expect(res.rango_orden).toBe(3);
      expect(res.califica).toBe(false); // No califica para cobro por descenso
      expect(res.bono_cent).toBe(0); // Bono = 0
      expect(res.motivo_bono).toBe('baja');
    });

    it('4 · Idempotencia: al correr dos veces sobre el mismo ciclo, detecta datos existentes y no duplica filas', async () => {
      // Ciclo 1 ya tiene registros en BD
      const resIdempotente = await calcularYPersistirRangosDelCiclo(1, sbAdmin);

      expect(resIdempotente.yaExistia).toBe(true);
      expect(resIdempotente.evaluados).toBe(501);
      expect(resIdempotente.califican).toBe(23);
      expect(resIdempotente.totalBonoCent).toBe(780000); // S/. 7,800.00
      expect(resIdempotente.comisionesCreadas).toBe(23);
    });

    it('5 · Los rangos con definido = false (los 8 altos) NUNCA se asignan aunque los puntos sean millonarios', () => {
      const puntosGigantes = {
        socio_id: 1,
        ciclo_id: 1,
        puntos_personales: 500,
        puntos_grupales: 2000000,
        lineas_frontales: [
          { frontal_socio_id: 2, puntos_totales: 500000 },
          { frontal_socio_id: 3, puntos_totales: 500000 },
          { frontal_socio_id: 4, puntos_totales: 500000 },
          { frontal_socio_id: 5, puntos_totales: 500000 }
        ],
        puntos_linea_mayor: 500000,
        frontales_activos: 10,
        activo: true
      };

      const res = calificarRangoSocio(puntosGigantes, escalaRangosOficial, null, 50);

      // El rango máximo definido es DIAMANTE (orden 8, bono S/. 10,000.00 = 1,000,000 cent)
      expect(res.rango_codigo).toBe('DIAMANTE');
      expect(res.rango_orden).toBe(8);
      expect(res.bono_cent).toBe(1000000);
      expect(res.rango_id).toBe(8);
    });
  });

  describe('3.2 · La Prueba del ORDEN — La más importante de todas', () => {
    let testCicloId = null;
    let nuevoCicloId = null;
    const TEST_ANIO = 2024;
    const TEST_MES = 9;

    beforeAll(async () => {
      // Limpieza preventiva de ciclos de prueba
      await sbService.from('ciclo').delete().eq('anio', TEST_ANIO);
    });

    afterAll(async () => {
      // Asegurar restauración de ciclo 30 a 'abierto'
      await sbService.from('ciclo').update({ estado: 'abierto' }).eq('id', 30);
      if (nuevoCicloId) {
        await sbService.from('ciclo').delete().eq('id', nuevoCicloId);
      }
      if (testCicloId) {
        await sbService.from('wallet_movimiento').delete().eq('ciclo_id', testCicloId);
        await sbService.from('comision').delete().eq('ciclo_id', testCicloId);
        await sbService.from('rango_ciclo').delete().eq('ciclo_id', testCicloId);
        await sbService.from('orden').delete().eq('ciclo_id', testCicloId);
        await sbService.from('activacion').delete().eq('ciclo_id', testCicloId);
        await sbService.from('auditoria').delete().eq('tabla', 'ciclo').eq('registro_id', testCicloId);
        await sbService.from('ciclo').delete().eq('id', testCicloId);
      }
      await sbService.from('ciclo').delete().eq('anio', TEST_ANIO);
    });

    it('6 · 🔴 LA PRUEBA DEL ORDEN: fn_ejecutar_cierre_ciclo en Postgres real ejecuta fn_calcular_y_persistir_rangos ANTES de abonar billeteras y genera el abono en wallet_movimiento', async () => {
      // 1. Cerrar ciclo 30 temporalmente para respetar la regla de un solo ciclo abierto
      await sbService.from('ciclo').update({ estado: 'cerrado' }).eq('id', 30);

      // 2. Insertamos un ciclo de prueba en el pasado (2024-09-01 a 2024-09-30)
      const { data: nuevoCiclo, error: errCiclo } = await sbService
        .from('ciclo')
        .insert({
          anio: TEST_ANIO,
          mes: TEST_MES,
          fecha_inicio: '2024-09-01',
          fecha_fin: '2024-09-30',
          estado: 'abierto'
        })
        .select()
        .single();

      expect(errCiclo).toBeNull();
      testCicloId = nuevoCiclo.id;

      // 3. Configuramos activación y órdenes en Postgres real para que Socio 2 califique a Jade:
      // Frontales de Socio 2 (Ana Quispe): Socio 13 y Socio 26
      await sbService.from('activacion').insert([
        { socio_id: 2, ciclo_id: testCicloId, puntos_personales: 70, activo: true },
        { socio_id: 13, ciclo_id: testCicloId, puntos_personales: 70, activo: true },
        { socio_id: 26, ciclo_id: testCicloId, puntos_personales: 70, activo: true }
      ]);

      await sbService.from('orden').insert([
        {
          socio_id: 13,
          ciclo_id: testCicloId,
          total_cent: 10000,
          puntos_total: 250,
          estado: 'confirmada',
          tipo: 'recompra',
          codigo: `ORD-T63-${testCicloId}-1`
        },
        {
          socio_id: 26,
          ciclo_id: testCicloId,
          total_cent: 10000,
          puntos_total: 250,
          estado: 'confirmada',
          tipo: 'recompra',
          codigo: `ORD-T63-${testCicloId}-2`
        }
      ]);

      // Verificar que antes del cierre no existen comisiones de rango
      const { data: comsAntes } = await sbService
        .from('comision')
        .select('id')
        .eq('ciclo_id', testCicloId)
        .eq('tipo', 'rango');
      expect(comsAntes.length).toBe(0);

      // 4. Ejecutar el cierre oficial en Postgres real (vía RPC con cliente real)
      const resultadoCierre = await ejecutarCierreCiclo(testCicloId, sbAdmin);

      expect(resultadoCierre.exito).toBe(true);
      expect(resultadoCierre.ciclo_cerrado_id).toBe(testCicloId);
      expect(resultadoCierre.total_abonado_cent).toBeGreaterThanOrEqual(5000);
      nuevoCicloId = resultadoCierre.nuevo_ciclo_id;

      // 5. Verificar que la comisión de rango fue insertada en estado 'confirmada'
      const { data: comisionesRango, error: errCom } = await sbService
        .from('comision')
        .select('*')
        .eq('ciclo_id', testCicloId)
        .eq('tipo', 'rango')
        .eq('beneficiario_id', 2);

      expect(errCom).toBeNull();
      expect(comisionesRango.length).toBe(1);
      const comisionRango = comisionesRango[0];
      expect(Number(comisionRango.monto_cent)).toBe(5000);
      expect(comisionRango.estado).toBe('confirmada');
      expect(comisionRango.detalle.rango_codigo).toBe('JADE');

      // 6. 🔴 VERIFICACIÓN CRÍTICA EN POSTGRES REAL:
      // Comprobar que en wallet_movimiento APARECE EL ABONO DE RANGO correspondiente
      const { data: abonosRango, error: errAbono } = await sbService
        .from('wallet_movimiento')
        .select('*')
        .eq('ciclo_id', testCicloId)
        .eq('comision_id', comisionRango.id);

      expect(errAbono).toBeNull();
      expect(abonosRango.length).toBe(1);
      const abonoRango = abonosRango[0];
      expect(abonoRango.socio_id).toBe(2);
      expect(Number(abonoRango.monto_cent)).toBe(5000);
      expect(abonoRango.tipo).toBe('abono');
      expect(abonoRango.concepto).toContain('rango');
    }, 30000);

    it('7 · 🔴 Verificación de Reversión: fn_revertir_cierre_ciclo elimina comisiones de rango, registros de rango_ciclo y abonos de billetera, restaurando el saldo', async () => {
      // Revertir el cierre recién ejecutado
      const resultadoReversion = await revertirCierreCiclo(testCicloId, sbAdmin);

      expect(resultadoReversion.exito).toBe(true);
      expect(resultadoReversion.estado).toBe('abierto');
      expect(resultadoReversion.monto_abonos_eliminados_cent).toBeGreaterThanOrEqual(5000);

      // Comisiones de rango deben haber sido eliminadas
      const { data: comsPost } = await sbService
        .from('comision')
        .select('id')
        .eq('ciclo_id', testCicloId)
        .eq('tipo', 'rango');
      expect(comsPost.length).toBe(0);

      // Registros de rango_ciclo deben haber sido eliminados
      const { data: rcPost, error: errRc } = await sbService
        .from('rango_ciclo')
        .select('socio_id')
        .eq('ciclo_id', testCicloId);
      expect(errRc).toBeNull();
      expect(rcPost.length).toBe(0);

      // Abonos a billetera del cierre deben haber sido eliminados
      const { data: movsPost } = await sbService
        .from('wallet_movimiento')
        .select('id')
        .eq('ciclo_id', testCicloId);
      expect(movsPost.length).toBe(0);

      // Ciclo debe estar en estado 'abierto'
      const { data: cicloReabierto } = await sbService
        .from('ciclo')
        .select('estado')
        .eq('id', testCicloId)
        .single();
      expect(cicloReabierto.estado).toBe('abierto');
    }, 30000);

    it('7b · 🔴 Guarda de seguridad: fn_revertir_cierre_ciclo se niega si hay comisiones de rango anteriores al cierre sin p_forzar = true, y procede con p_forzar = true', async () => {
      // 1. Cerramos el ciclo de nuevo
      const resCierre = await ejecutarCierreCiclo(testCicloId, sbAdmin);
      expect(resCierre.exito).toBe(true);

      // 2. Simulamos comisiones sembradas/anteriores alterando la fecha del movimiento para que sea anterior al cierre
      const { data: comRango } = await sbService
        .from('comision')
        .select('id')
        .eq('ciclo_id', testCicloId)
        .eq('tipo', 'rango')
        .single();
      expect(comRango).toBeDefined();

      // Forzar que el registro de comisión tenga fecha anterior al cierre
      await sbService
        .from('comision')
        .update({ creado_en: '2020-01-01T00:00:00Z' })
        .eq('id', comRango.id);

      await sbService
        .from('wallet_movimiento')
        .update({ creado_en: '2020-01-01T00:00:00Z' })
        .eq('comision_id', comRango.id);

      // 3. Intento de reversión normal (sin forzar): DEBE RECHAZARSE
      await expect(revertirCierreCiclo(testCicloId, sbAdmin, false)).rejects.toThrow(
        /Operación denegada.*comisiones de rango con abono en billetera anterior/i
      );

      // 4. Intento con p_forzar = true: DEBE PROCEDER
      const resForzado = await revertirCierreCiclo(testCicloId, sbAdmin, true);
      expect(resForzado.exito).toBe(true);
      expect(resForzado.forzado).toBe(true);
      expect(resForzado.estado).toBe('abierto');
    }, 30000);

    it('8 · 🔴 Verificación en BD: todas las comisiones de rango del ciclo cerrado cuentan con su abono auditado en wallet_movimiento', async () => {
      const cicloId = 3;
      const { data: comisionesRango, error: errCom } = await sbAdmin
        .from('comision')
        .select('id, monto_cent, ciclo_id')
        .eq('ciclo_id', cicloId)
        .eq('tipo', 'rango');

      expect(errCom).toBeNull();
      expect(comisionesRango.length).toBe(8);

      const comisionIds = comisionesRango.map(c => c.id);

      const { data: abonos, error: errAbonos } = await sbAdmin
        .from('wallet_movimiento')
        .select('id, comision_id, monto_cent')
        .in('comision_id', comisionIds);

      expect(errAbonos).toBeNull();
      expect(abonos.length).toBe(comisionesRango.length);

      const abonosMap = new Map(abonos.map(a => [a.comision_id, a]));

      // Ninguna comisión de rango tiene abono = NULL
      for (const com of comisionesRango) {
        const abono = abonosMap.get(com.id);
        expect(abono).toBeDefined();
        expect(abono.id).not.toBeNull();
        expect(Number(abono.monto_cent)).toBe(Number(com.monto_cent));
      }
    });
  });

  describe('3.3 · Prueba de No Regresión', () => {
    it('9 · El desglose de comisiones y abonos de Ciclo 3 cuadra exactamente con S/. 13,479.68', async () => {
      const { data: comisiones, error } = await sbAdmin
        .from('comision')
        .select('tipo, monto_cent')
        .eq('ciclo_id', 3);

      expect(error).toBeNull();

      const totalCent = comisiones.reduce((sum, c) => sum + Number(c.monto_cent), 0);
      expect(totalCent).toBe(1347968); // Exactamente S/. 13,479.68

      const patrocinioCent = comisiones.filter(c => c.tipo === 'patrocinio').reduce((s, c) => s + Number(c.monto_cent), 0);
      const residualCent = comisiones.filter(c => c.tipo === 'residual').reduce((s, c) => s + Number(c.monto_cent), 0);
      const rangoCent = comisiones.filter(c => c.tipo === 'rango').reduce((s, c) => s + Number(c.monto_cent), 0);

      expect(patrocinioCent).toBe(679540); // S/. 6,795.40
      expect(residualCent).toBe(608428);   // S/. 6,084.28
      expect(rangoCent).toBe(60000);       // S/. 600.00
      expect(patrocinioCent + residualCent + rangoCent).toBe(1347968);
    });
  });

  describe('3.4 · Vista Previa de P-25 con Bono de Rango en Seco', () => {
    it('10 · obtenerVistaPreviaCierre incluye el Bono de Rango calculado en seco', async () => {
      const vp = await obtenerVistaPreviaCierre(3, sbAdmin);

      expect(vp.bonos.rango).toBeDefined();
      expect(vp.bonos.rango.totalCent).toBe(60000);
      expect(vp.bonos.rango.totalSoles).toBe(600);
      expect(vp.bonos.rango.cantidadSocios).toBe(8);
      expect(vp.totalAPagarCent).toBe(1347968);
    });
  });
});
