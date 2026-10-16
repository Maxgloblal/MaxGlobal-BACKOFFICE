import { describe, it, expect } from 'vitest';
import { evaluarTechosCierre } from '../servicios/operacionAdmin';

describe('TAREA-67 · Guardas del Cierre de Ciclo en Postgres (RF-371 y RF-376)', () => {
  describe('1. Evaluación Teórica de Techos (RF-376)', () => {
    it('Calcula correctamente el techo de patrocinio: 41.7% para Kit Emprendedor y 30.8% para otros packs', async () => {
      const mockClient = {
        from: (table) => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                range: () => Promise.resolve({
                  data: [
                    { id: 1, tipo: 'afiliacion', total_cent: 12000, puntos_total: 0, pack: { codigo: 'EMPRENDEDOR' } },
                    { id: 2, tipo: 'afiliacion', total_cent: 36000, puntos_total: 0, pack: { codigo: 'EJECUTIVO' } },
                    { id: 3, tipo: 'recompra', total_cent: 15000, puntos_total: 70, pack: null }
                  ],
                  error: null
                })
              }),
              eq: () => ({
                range: () => Promise.resolve({
                  data: [
                    { bono_cent: 5000 }
                  ],
                  error: null
                })
              })
            })
          })
        })
      };

      const vistaPrevia = {
        ciclo: { id: 2 },
        bonos: {
          patrocinio: { totalCent: 16092 }, // 12000 * 0.417 = 5004 + 36000 * 0.308 = 11088 => 16092
          residual: { totalCent: 6790 },    // 70 * 100 * 0.97 = 6790
          rango: { totalCent: 5000 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 27882
      };

      const res = await evaluarTechosCierre(2, vistaPrevia, mockClient);
      expect(res.bloqueado).toBe(false);
      expect(res.techoPatrocinioCent).toBe(5004 + 11088);
      expect(res.techoResidualCent).toBe(6790);
      expect(res.techoRangoCent).toBe(5000);
      expect(res.erroresBloqueo.length).toBe(0);
    });

    it('🔴 Bloquea el cierre si el bono de patrocinio calculado excede el techo del 30.8% / 41.7%', async () => {
      const mockClient = {
        from: (table) => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                range: () => Promise.resolve({
                  data: [
                    { id: 1, tipo: 'afiliacion', total_cent: 12000, puntos_total: 0, pack: { codigo: 'EMPRENDEDOR' } }
                  ],
                  error: null
                })
              }),
              eq: () => ({
                range: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        })
      };

      const vistaPreviaDesbordada = {
        ciclo: { id: 2 },
        bonos: {
          patrocinio: { totalCent: 10000 }, // 100.00 soles > techo 50.04 soles
          residual: { totalCent: 0 },
          rango: { totalCent: 0 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 10000
      };

      const res = await evaluarTechosCierre(2, vistaPreviaDesbordada, mockClient);
      expect(res.bloqueado).toBe(true);
      expect(res.erroresBloqueo.some(e => e.bono === 'Patrocinio')).toBe(true);
      expect(res.erroresBloqueo[0].excedenteCent).toBe(10000 - 5004);
    });

    it('🔴 Bloquea el cierre si el bono residual calculado excede el 97% de los puntos de recompra', async () => {
      const mockClient = {
        from: (table) => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                range: () => Promise.resolve({
                  data: [
                    { id: 1, tipo: 'recompra', total_cent: 15000, puntos_total: 100, pack: null }
                  ],
                  error: null
                })
              }),
              eq: () => ({
                range: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        })
      };

      // Techo: 100 pts * 100 * 0.97 = 9,700 cent (S/. 97.00)
      const vistaPreviaDesbordada = {
        ciclo: { id: 2 },
        bonos: {
          patrocinio: { totalCent: 0 },
          residual: { totalCent: 15000 }, // S/. 150.00 > S/. 97.00
          rango: { totalCent: 0 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 15000
      };

      const res = await evaluarTechosCierre(2, vistaPreviaDesbordada, mockClient);
      expect(res.bloqueado).toBe(true);
      expect(res.erroresBloqueo.some(e => e.bono === 'Residual')).toBe(true);
    });

    it('🔴 Bloquea el cierre si el bono de rango excede la suma autorizada de calificaciones', async () => {
      const mockClient = {
        from: (table) => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                range: () => Promise.resolve({ data: [], error: null })
              }),
              eq: () => ({
                range: () => Promise.resolve({
                  data: [
                    { bono_cent: 5000 } // Jade: S/. 50.00
                  ],
                  error: null
                })
              })
            })
          })
        })
      };

      const vistaPreviaDesbordada = {
        ciclo: { id: 2 },
        bonos: {
          patrocinio: { totalCent: 0 },
          residual: { totalCent: 0 },
          rango: { totalCent: 10000 }, // S/. 100.00 > S/. 50.00
          global: { totalCent: 0 }
        },
        totalAPagarCent: 10000
      };

      const res = await evaluarTechosCierre(2, vistaPreviaDesbordada, mockClient);
      expect(res.bloqueado).toBe(true);
      expect(res.erroresBloqueo.some(e => e.bono === 'Rango')).toBe(true);
    });
  });

  describe('2. Integridad de Parámetros RPC en ejecucionCierreCiclo', () => {
    it('ejecutarCierreCiclo pasa p_ciclo_id y p_forzar al RPC de Postgres', async () => {
      let rpcNombreLlamado = null;
      let rpcArgsLlamados = null;

      const mockClient = {
        rpc: (fnName, args) => {
          rpcNombreLlamado = fnName;
          rpcArgsLlamados = args;
          return Promise.resolve({ data: { exito: true, ciclo_cerrado_id: 2 }, error: null });
        }
      };

      const { ejecutarCierreCiclo } = await import('../servicios/operacionAdmin');
      const resultado = await ejecutarCierreCiclo(2, mockClient, false);

      expect(rpcNombreLlamado).toBe('fn_ejecutar_cierre_ciclo');
      expect(rpcArgsLlamados).toEqual({
        p_ciclo_id: 2,
        p_forzar: false
      });
      expect(resultado.exito).toBe(true);
    });

    it('ejecutarCierreCiclo permite enviar p_forzar = true para casos extraordinarios autorizados', async () => {
      let rpcArgsLlamados = null;

      const mockClient = {
        rpc: (fnName, args) => {
          rpcArgsLlamados = args;
          return Promise.resolve({ data: { exito: true, ciclo_cerrado_id: 2, forzado: true }, error: null });
        }
      };

      const { ejecutarCierreCiclo } = await import('../servicios/operacionAdmin');
      const resultado = await ejecutarCierreCiclo(2, mockClient, true);

      expect(rpcArgsLlamados).toEqual({
        p_ciclo_id: 2,
        p_forzar: true
      });
      expect(resultado.forzado).toBe(true);
    });
  });
});
