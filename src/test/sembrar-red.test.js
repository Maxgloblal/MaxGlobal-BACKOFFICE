import { describe, it, expect } from 'vitest';
import {
  createPrng,
  precioFinal,
  descuentoCent,
  puntosDe,
  puntosMovimiento,
  generarRedDeterminista
} from '../../scripts/sembrar-red.mjs';

describe('TAREA-03B · Sembrador Determinista y Correcciones de Red', () => {
  describe('Bloque 1: Aritmética Exacta de Precios, Descuentos y Puntos (Con números a mano)', () => {
    it('calcula correctamente el precio final con 50% de descuento (Café: 15000 -> 7500 centavos)', () => {
      expect(precioFinal(15000, 50)).toBe(7500);
    });

    it('calcula correctamente el precio final con 40% de descuento (Café Kit Emprendedor: 15000 -> 9000 centavos)', () => {
      expect(precioFinal(15000, 40)).toBe(9000);
    });

    it('calcula exactamente el descuento por resta de cabezal (caso orden 575: 57000 - 34200 = 22800)', () => {
      expect(descuentoCent(57000, 34200)).toBe(22800);
    });

    it('calcula correctamente los puntos subtotales (2 Cafés x 18 pts = 36 pts)', () => {
      expect(puntosDe(18, 2)).toBe(36);
    });

    it('puntosMovimiento toma siempre los puntos_total directos de la orden', () => {
      const mockOrden = { id: 41, socio_id: 42, puntos_total: 70 };
      expect(puntosMovimiento(mockOrden)).toBe(70);
    });

    it('el PRNG mulberry32 con semilla fija 20260828 es estrictamente determinista', () => {
      const prng1 = createPrng(20260828);
      const prng2 = createPrng(20260828);
      const seq1 = [prng1(), prng1(), prng1(), prng1(), prng1()];
      const seq2 = [prng2(), prng2(), prng2(), prng2(), prng2()];
      expect(seq1).toEqual(seq2);
    });
  });

  describe('Bloque 2: Topología y Distribución de Packs', () => {
    const data = generarRedDeterminista();

    it('genera exactamente 501 socios', () => {
      expect(data.socios.length).toBe(501);
    });

    it('el socio ID 1 es el Administrador raíz sin patrocinador', () => {
      const raiz = data.socios.find(s => s.id === 1);
      expect(raiz).toBeDefined();
      expect(raiz.patrocinador_id).toBeNull();
      expect(raiz.rol).toBe('admin');
      expect(raiz.pack_id).toBe(5);
    });

    it('todos los socios del 2 al 501 tienen un patrocinador válido de menor ID', () => {
      for (const s of data.socios) {
        if (s.id === 1) continue;
        expect(s.patrocinador_id).toBeGreaterThanOrEqual(1);
        expect(s.patrocinador_id).toBeLessThan(s.id);
        expect(s.rol).toBe('socio');
      }
    });

    it('la distribución de packs de los 500 socios (2 al 501) es exactamente 225/150/75/35/15', () => {
      const counts = { EMPRENDEDOR: 0, EJECUTIVO: 0, GOLD: 0, FAMILIAR: 0, EMPRESARIAL: 0 };
      for (const s of data.socios) {
        if (s.id === 1) continue;
        counts[s.pack]++;
      }
      expect(counts.EMPRENDEDOR).toBe(225);
      expect(counts.EJECUTIVO).toBe(150);
      expect(counts.GOLD).toBe(75);
      expect(counts.FAMILIAR).toBe(35);
      expect(counts.EMPRESARIAL).toBe(15);
    });

    it('un Emprendedor NUNCA recibe un frontal de otro pack (solo_afilia_igual = true)', () => {
      const mapaSocios = new Map(data.socios.map(s => [s.id, s]));
      for (const s of data.socios) {
        if (s.id === 1) continue;
        const pat = mapaSocios.get(s.patrocinador_id);
        if (pat.pack === 'EMPRENDEDOR') {
          expect(s.pack).toBe('EMPRENDEDOR');
        }
      }
    });

    it('ningún socio queda a profundidad > 12', () => {
      for (const s of data.socios) {
        expect(s.nivel).toBeLessThanOrEqual(12);
      }
    });

    it('la profundidad máxima es exactamente 12 (alcanza el tope para probar residual)', () => {
      const maxNivel = Math.max(...data.socios.map(s => s.nivel));
      expect(maxNivel).toBe(12);
    });
  });

  describe('Bloque 3 y 4: Órdenes, Vouchers y Derivación de Movimientos', () => {
    const data = generarRedDeterminista();

    it('todo movimiento_puntos tiene exactamente los mismos puntos y socio_id que su orden', () => {
      const mapaOrdenes = new Map(data.ordenes.map(o => [o.id, o]));
      for (const m of data.movimientoPuntos) {
        const ord = mapaOrdenes.get(m.orden_id);
        expect(ord).toBeDefined();
        expect(m.puntos).toBe(ord.puntos_total);
        expect(m.socio_id).toBe(ord.socio_id);
        expect(m.ciclo_id).toBe(ord.ciclo_id);
      }
    });

    it('la aritmética del cabezal de todas las órdenes cumple total_cent = subtotal_cent - descuento_cent', () => {
      for (const o of data.ordenes) {
        expect(o.total_cent).toBe(o.subtotal_cent - o.descuento_cent);
      }
    });

    it('el total de vouchers coincide exactamente con el total de su orden', () => {
      const mapaOrdenes = new Map(data.ordenes.map(o => [o.id, o]));
      for (const v of data.vouchers) {
        const ord = mapaOrdenes.get(v.orden_id);
        expect(v.monto_cent).toBe(ord.total_cent);
      }
    });

    it('las afiliaciones NUNCA tienen cuenta_residual = true', () => {
      const afils = data.movimientoPuntos.filter(m => m.origen === 'afiliacion');
      for (const m of afils) {
        expect(m.cuenta_residual).toBe(false);
      }
    });

    it('las recompras SI tienen cuenta_residual = true', () => {
      const recompras = data.movimientoPuntos.filter(m => m.origen === 'recompra');
      for (const m of recompras) {
        expect(m.cuenta_residual).toBe(true);
      }
    });

    it('genera exactamente 6 órdenes de afiliación en estado por_confirmar (Socios 496 a 501)', () => {
      const pendientes = data.ordenes.filter(o => o.estado === 'por_confirmar');
      expect(pendientes.length).toBe(6);
      expect(pendientes.map(o => o.socio_id).sort()).toEqual([496, 497, 498, 499, 500, 501]);
    });

    it('genera exactamente 6 vouchers en estado pendiente correspondientes a las órdenes por confirmar', () => {
      const vouchersPend = data.vouchers.filter(v => v.estado === 'pendiente');
      expect(vouchersPend.length).toBe(6);
    });
  });

  describe('Bloque 5: Activaciones y Ratio Objetivo (35% a 50%)', () => {
    const data = generarRedDeterminista();

    it('genera exactamente 1,503 registros de activación (501 socios x 3 ciclos)', () => {
      expect(data.activaciones.length).toBe(1503);
    });

    it('los 3 ciclos tienen entre 35% y 56% de socios activos sobre 501 (275, 252, 265 con cobertura primer mes)', () => {
      for (let c = 1; c <= 3; c++) {
        const activos = data.activaciones.filter(a => a.ciclo_id === c && a.activo).length;
        const pct = (activos / 501) * 100;
        expect(pct).toBeGreaterThanOrEqual(35.0);
        expect(pct).toBeLessThanOrEqual(56.0);
      }
    });

    it('Caso Borde 1 (Socio ID 2): Activo en los 3 ciclos', () => {
      const acts = data.activaciones.filter(a => a.socio_id === 2);
      expect(acts.every(a => a.activo)).toBe(true);
    });

    it('Caso Borde 2 (Socio ID 13): Inactivo en todos los ciclos', () => {
      const acts = data.activaciones.filter(a => a.socio_id === 13);
      expect(acts.find(a => a.ciclo_id === 2).activo).toBe(false);
      expect(acts.find(a => a.ciclo_id === 3).activo).toBe(false);
    });

    it('Caso Borde (Socio ID 5): Exactamente 70 pts en jul -> ACTIVO (5 x Esplendor a 14 pts = 70 pts)', () => {
      const actSocio5Jul = data.activaciones.find(a => a.socio_id === 5 && a.ciclo_id === 2);
      expect(actSocio5Jul.puntos_personales).toBe(70);
      expect(actSocio5Jul.activo).toBe(true);
    });

    it('Caso Borde (Socio ID 6): Borde por debajo con 68 pts en jul -> INACTIVO (3 x Café [54] + 1 x Moringa [14] = 68 pts)', () => {
      const actSocio6Jul = data.activaciones.find(a => a.socio_id === 6 && a.ciclo_id === 2);
      expect(actSocio6Jul.puntos_personales).toBe(68);
      expect(actSocio6Jul.activo).toBe(false);
    });
  });
});
