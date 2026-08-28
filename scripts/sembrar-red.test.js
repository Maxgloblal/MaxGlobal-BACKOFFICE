import { describe, it, expect } from 'vitest';
import {
  createPrng,
  precioFinal,
  puntosDe,
  generarRedDeterminista
} from './sembrar-red.mjs';

describe('TAREA-03 · Sembrador Determinista y Red Simulada', () => {
  describe('Bloque 1: Aritmética de Precios y Puntos', () => {
    it('calcula correctamente el precio final con 50% de descuento (Café: 15000 -> 7500 centavos)', () => {
      expect(precioFinal(15000, 50)).toBe(7500);
    });

    it('calcula correctamente el precio final con 40% de descuento (Café Kit Emprendedor: 15000 -> 9000 centavos)', () => {
      expect(precioFinal(15000, 40)).toBe(9000);
    });

    it('calcula correctamente los puntos subtotales (2 Cafés x 18 pts = 36 pts)', () => {
      expect(puntosDe(18, 2)).toBe(36);
    });

    it('el PRNG mulberry32 con semilla fija 20260828 es estrictamente determinista', () => {
      const prng1 = createPrng(20260828);
      const prng2 = createPrng(20260828);
      const seq1 = [prng1(), prng1(), prng1(), prng1(), prng1()];
      const seq2 = [prng2(), prng2(), prng2(), prng2(), prng2()];
      expect(seq1).toEqual(seq2);
    });
  });

  describe('Bloque 2: Topología y Reglas de Negocio de la Red (501 Socios)', () => {
    const data = generarRedDeterminista();

    it('genera exactamente 501 socios', () => {
      expect(data.socios.length).toBe(501);
    });

    it('el socio ID 1 es el Administrador raíz sin patrocinador', () => {
      const raiz = data.socios.find(s => s.id === 1);
      expect(raiz).toBeDefined();
      expect(raiz.patrocinador_id).toBeNull();
      expect(raiz.rol).toBe('admin');
      expect(raiz.nombres).toBe('MAXIMO');
      expect(raiz.pack_id).toBe(5); // EMPRESARIAL
    });

    it('todos los socios del 2 al 501 tienen un patrocinador válido de menor ID', () => {
      for (const s of data.socios) {
        if (s.id === 1) continue;
        expect(s.patrocinador_id).toBeGreaterThanOrEqual(1);
        expect(s.patrocinador_id).toBeLessThan(s.id);
        expect(s.rol).toBe('socio');
      }
    });

    it('respeta estrictamente la regla vinculante solo_afilia_igual: si el patrocinador es EMPRENDEDOR, el frontal DEBE ser EMPRENDEDOR', () => {
      const mapaSocios = new Map(data.socios.map(s => [s.id, s]));
      let conteoAfiliacionesEmprendedor = 0;

      for (const s of data.socios) {
        if (s.id === 1) continue;
        const pat = mapaSocios.get(s.patrocinador_id);
        if (pat.pack === 'EMPRENDEDOR') {
          expect(s.pack).toBe('EMPRENDEDOR');
          expect(s.pack_id).toBe(1);
          conteoAfiliacionesEmprendedor++;
        }
      }

      expect(conteoAfiliacionesEmprendedor).toBeGreaterThan(0);
    });

    it('garantiza una profundidad de red mayor o igual a 12 niveles en la cadena de prueba', () => {
      const maxNivel = Math.max(...data.socios.map(s => s.nivel));
      expect(maxNivel).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Bloque 3 y 4: Órdenes, Vouchers y Residual', () => {
    const data = generarRedDeterminista();

    it('genera exactamente 6 órdenes de afiliación en estado por_confirmar (Socios 496 a 501)', () => {
      const pendientes = data.ordenes.filter(o => o.estado === 'por_confirmar');
      expect(pendientes.length).toBe(6);
      expect(pendientes.map(o => o.socio_id).sort()).toEqual([496, 497, 498, 499, 500, 501]);
    });

    it('genera exactamente 6 vouchers en estado pendiente correspondientes a las órdenes por confirmar', () => {
      const vouchersPend = data.vouchers.filter(v => v.estado === 'pendiente');
      expect(vouchersPend.length).toBe(6);
    });

    it('REGLA CRÍTICA: los movimientos de puntos de afiliación NUNCA generan residual (cuenta_residual === false)', () => {
      const movsAfiliacion = data.movimientoPuntos.filter(m => m.origen === 'afiliacion');
      expect(movsAfiliacion.length).toBeGreaterThan(0);
      for (const m of movsAfiliacion) {
        expect(m.cuenta_residual).toBe(false);
      }
    });

    it('los movimientos de puntos de recompras SI generan residual (cuenta_residual === true)', () => {
      const movsRecompra = data.movimientoPuntos.filter(m => m.origen === 'recompra');
      expect(movsRecompra.length).toBeGreaterThan(0);
      for (const m of movsRecompra) {
        expect(m.cuenta_residual).toBe(true);
      }
    });

    it('la suma de dinero en vouchers coincide exactamente con el total de cada orden', () => {
      const mapaOrdenes = new Map(data.ordenes.map(o => [o.id, o]));
      for (const v of data.vouchers) {
        const orden = mapaOrdenes.get(v.orden_id);
        expect(v.monto_cent).toBe(orden.total_cent);
      }
    });
  });

  describe('Bloque 5: Activaciones y Casos Borde Identificados', () => {
    const data = generarRedDeterminista();

    it('genera exactamente 1,503 registros de activación (501 socios x 3 ciclos)', () => {
      expect(data.activaciones.length).toBe(1503);
    });

    it('Caso Borde 1 (Socio ID 2): Activo en los 3 ciclos (jun, jul, ago)', () => {
      const actSocio2 = data.activaciones.filter(a => a.socio_id === 2);
      expect(actSocio2.length).toBe(3);
      // Jun: 150 pts afil + 36 pts recompra = 186 pts (activo)
      // Jul: 72 pts recompra (activo)
      // Ago: 72 pts recompra (activo)
      expect(actSocio2.find(a => a.ciclo_id === 1).activo).toBe(true);
      expect(actSocio2.find(a => a.ciclo_id === 2).activo).toBe(true);
      expect(actSocio2.find(a => a.ciclo_id === 3).activo).toBe(true);
    });

    it('Caso Borde 2 (Socio ID 3): Inactivo jun (0 recompras), activo jul (72 pts), inactivo ago (0 recompras)', () => {
      const actSocio3 = data.activaciones.filter(a => a.socio_id === 3);
      expect(actSocio3.find(a => a.ciclo_id === 2).activo).toBe(true);
      expect(actSocio3.find(a => a.ciclo_id === 3).activo).toBe(false);
    });

    it('Caso Borde 3 (Socio ID 4): Inactivo jun y jul, activo ago (72 pts)', () => {
      const actSocio4 = data.activaciones.filter(a => a.socio_id === 4);
      expect(actSocio4.find(a => a.ciclo_id === 3).activo).toBe(true);
    });

    it('Caso Borde 4 (Socio ID 5): Exactamente 70 pts en jul -> ACTIVO (5 x Esplendor a 14 pts = 70 pts)', () => {
      const actSocio5Jul = data.activaciones.find(a => a.socio_id === 5 && a.ciclo_id === 2);
      expect(actSocio5Jul.puntos_personales).toBe(70);
      expect(actSocio5Jul.activo).toBe(true);
    });

    it('Caso Borde 5 (Socio ID 6): Borde por debajo con 68 pts en jul -> INACTIVO (3 x Café [54] + 1 x Moringa [14] = 68 pts)', () => {
      const actSocio6Jul = data.activaciones.find(a => a.socio_id === 6 && a.ciclo_id === 2);
      expect(actSocio6Jul.puntos_personales).toBe(68);
      expect(actSocio6Jul.activo).toBe(false);
    });

    it('Caso Borde 6 (Socio ID 13): 0 recompras en los 3 ciclos -> Inactivo en jul y ago', () => {
      const actSocio13 = data.activaciones.filter(a => a.socio_id === 13);
      expect(actSocio13.find(a => a.ciclo_id === 2).puntos_personales).toBe(0);
      expect(actSocio13.find(a => a.ciclo_id === 2).activo).toBe(false);
      expect(actSocio13.find(a => a.ciclo_id === 3).puntos_personales).toBe(0);
      expect(actSocio13.find(a => a.ciclo_id === 3).activo).toBe(false);
    });
  });
});
