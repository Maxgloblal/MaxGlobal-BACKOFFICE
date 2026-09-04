import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { calificarRangoSocio } from '../motor/rango';
import {
  calcularRangosEnMemoria,
  calcularYPersistirRangosDelCiclo
} from '../motor/persistenciaRango';
import {
  ejecutarCierreCiclo,
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

/**
 * Cliente de prueba que simula el contrato de Postgres para el cierre de ciclo:
 * fn_ejecutar_cierre_ciclo recorre comision en ESE instante para insertar en wallet_movimiento.
 */
function crearClientePruebaCierre(comisionesIniciales = []) {
  const tablas = {
    rango_ciclo: [],
    comision: [...comisionesIniciales],
    wallet_movimiento: []
  };

  let idComisionSeq = 100;
  let idWalletSeq = 1;

  return {
    _tablas: tablas,
    from(tabla) {
      return {
        select(columnas, opts = {}) {
          const state = {
            filtros: [],
            orden: null
          };

          const builder = {
            eq(col, val) {
              state.filtros.push({ col, val });
              return builder;
            },
            order(col, opts) {
              state.orden = { col, opts };
              return builder;
            },
            maybeSingle() {
              return this.then(res => ({ data: res.data?.[0] || null, error: null }));
            },
            single() {
              return this.then(res => ({ data: res.data?.[0] || null, error: null }));
            },
            then(onFulfilled, onRejected) {
              let res = { data: [], count: 0, error: null };

              if (tabla === 'rango_ciclo') {
                const fCiclo = state.filtros.find(f => f.col === 'ciclo_id');
                const filas = fCiclo ? tablas.rango_ciclo.filter(r => r.ciclo_id === fCiclo.val) : tablas.rango_ciclo;
                res = { data: filas, count: filas.length, error: null };
              } else if (tabla === 'comision') {
                const fCiclo = state.filtros.find(f => f.col === 'ciclo_id');
                const fTipo = state.filtros.find(f => f.col === 'tipo');
                let filas = tablas.comision;
                if (fCiclo) filas = filas.filter(c => c.ciclo_id === fCiclo.val);
                if (fTipo) filas = filas.filter(c => c.tipo === fTipo.val);
                res = { data: filas, count: filas.length, error: null };
              } else if (tabla === 'config') {
                const fClave = state.filtros.find(f => f.col === 'clave');
                if (fClave && fClave.val === 'linea_estirada_pct') {
                  res = { data: [{ clave: 'linea_estirada_pct', valor: '50' }], error: null };
                } else {
                  res = { data: [], error: null };
                }
              } else if (tabla === 'rango') {
                res = { data: escalaRangosOficial, error: null };
              } else if (tabla === 'socio') {
                res = {
                  data: [{ id: 12, codigo: 'MG00012', nombres: 'KARLA', apellidos: 'DEL AGUILA', estado: 'activo' }],
                  error: null
                };
              } else if (tabla === 'activacion') {
                res = {
                  data: [{ socio_id: 12, activo: true, puntos_personales: 150 }],
                  error: null
                };
              }

              return Promise.resolve(res).then(onFulfilled, onRejected);
            }
          };

          return builder;
        },
        insert(filas) {
          const arr = Array.isArray(filas) ? filas : [filas];
          for (const f of arr) {
            if (tabla === 'comision') {
              idComisionSeq++;
              tablas.comision.push({ id: idComisionSeq, ...f });
            } else if (tabla === 'rango_ciclo') {
              tablas.rango_ciclo.push({ ...f });
            }
          }
          return Promise.resolve({ error: null });
        }
      };
    },
    rpc(nombre, args) {
      if (nombre === 'fn_rango_lineas_socio') {
        return Promise.resolve({
          data: {
            exito: true,
            lineas: [
              { frontal_id: 55, activo: true, puntos_totales_rama: 400 },
              { frontal_id: 77, activo: true, puntos_totales_rama: 268 },
              { frontal_id: 40, activo: true, puntos_totales_rama: 174 },
              { frontal_id: 35, activo: true, puntos_totales_rama: 116 }
            ],
            rango_ciclo_anterior: null,
            rangos_escala: escalaRangosOficial
          },
          error: null
        });
      }
      if (nombre === 'fn_ejecutar_cierre_ciclo') {
        // En Postgres real, el paso 4 abona lo que exista en comision en ESE instante
        const comisionesEnEsteInstante = [...tablas.comision.filter(c => c.ciclo_id === args.p_ciclo_id)];
        let totalAbonado = 0;
        for (const com of comisionesEnEsteInstante) {
          tablas.wallet_movimiento.push({
            id: idWalletSeq++,
            socio_id: com.beneficiario_id,
            ciclo_id: com.ciclo_id,
            comision_id: com.id,
            tipo: 'abono',
            monto_cent: com.monto_cent,
            concepto: `Bono de ${com.tipo}, ciclo ${com.ciclo_id}`
          });
          totalAbonado += com.monto_cent;
        }
        return Promise.resolve({
          data: {
            exito: true,
            ciclo_cerrado_id: args.p_ciclo_id,
            total_abonado_cent: totalAbonado,
            cantidad_abonos: comisionesEnEsteInstante.length,
            nuevo_ciclo_id: args.p_ciclo_id + 1
          },
          error: null
        });
      }
      return Promise.resolve({ data: null, error: null });
    }
  };
}

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
    it('6 · 🔴 LA PRUEBA DEL ORDEN: ejecutarCierreCiclo persiste comisiones de rango ANTES del cierre y genera el abono en wallet_movimiento', async () => {
      // Configuramos el cliente con una orden/socio que califica a Jade
      const mockClient = crearClientePruebaCierre();

      // Ejecutar la función oficial del cierre
      const resultadoCierre = await ejecutarCierreCiclo(999, mockClient);

      expect(resultadoCierre.exito).toBe(true);
      expect(resultadoCierre.resumenRango).toBeDefined();
      expect(resultadoCierre.resumenRango.califican).toBe(1);
      expect(resultadoCierre.resumenRango.totalBonoCent).toBe(5000);

      // 1. Verificar que la comisión de rango fue insertada
      const comisionRango = mockClient._tablas.comision.find(c => c.tipo === 'rango');
      expect(comisionRango).toBeDefined();
      expect(comisionRango.monto_cent).toBe(5000);
      expect(comisionRango.beneficiario_id).toBe(12);

      // 2. 🔴 VERIFICACIÓN CRÍTICA: Comprobar que en wallet_movimiento APARECE SU ABONO DE RANGO
      const abonoRango = mockClient._tablas.wallet_movimiento.find(w => w.comision_id === comisionRango.id);
      expect(abonoRango).toBeDefined();
      expect(abonoRango.socio_id).toBe(12);
      expect(abonoRango.monto_cent).toBe(5000);
      expect(abonoRango.tipo).toBe('abono');
      expect(abonoRango.concepto).toContain('rango');
    });

    it('7 · 🔴 Protección contra Fallo Silencioso: si el orden estuviera invertido, la comisión queda sin abono en wallet_movimiento', async () => {
      const mockInvertido = crearClientePruebaCierre();

      // SIMULACIÓN DEL ERROR: Llamar primero a fn_ejecutar_cierre_ciclo y DESPUÉS a calcularYPersistirRangosDelCiclo
      await mockInvertido.rpc('fn_ejecutar_cierre_ciclo', { p_ciclo_id: 999 });
      await calcularYPersistirRangosDelCiclo(999, mockInvertido);

      // La comisión existe en la tabla comision...
      const comisionRangoErronea = mockInvertido._tablas.comision.find(c => c.tipo === 'rango');
      expect(comisionRangoErronea).toBeDefined();

      // ... pero NO TIENE ABONO en wallet_movimiento (el paso 4 ya pasó antes de su inserción)
      const abonoHuerfano = mockInvertido._tablas.wallet_movimiento.find(w => w.comision_id === comisionRangoErronea.id);
      expect(abonoHuerfano).toBeUndefined(); // Demostración del fallo silencioso que previene el diseño
    });

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
