import { describe, it, expect } from 'vitest';
import { calcularResidual } from '../motor/residual';

describe('TAREA-04A · Motor de Comisiones — Bono Residual', () => {
  const escalaResidual = [
    { nivel: 1, porcentaje: 40.000 },
    { nivel: 2, porcentaje: 20.000 },
    { nivel: 3, porcentaje: 10.000 },
    { nivel: 4, porcentaje: 5.000 },
    { nivel: 5, porcentaje: 3.000 },
    { nivel: 6, porcentaje: 2.000 },
    { nivel: 7, porcentaje: 1.000 },
    { nivel: 8, porcentaje: 10.000 }, // Salto comercial deliberado al 10%
    { nivel: 9, porcentaje: 5.000 },
    { nivel: 10, porcentaje: 1.000 }
  ];

  const packGold = { id: 3, codigo: 'GOLD', niveles_patrocinio: 7, niveles_residual: 10 };
  const packEjecutivo = { id: 2, codigo: 'EJECUTIVO', niveles_patrocinio: 3, niveles_residual: 5 };
  const packEmprendedor = { id: 1, codigo: 'EMPRENDEDOR', niveles_patrocinio: 0, niveles_residual: 0 };

  it('Ejemplo D · Recompra 126 pts (base 12600 cent), 10 ancestros Gold activos -> total exacto 12222 cent', () => {
    const orden = {
      id: 201,
      socio_id: 11,
      ciclo_id: 1,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 126,
      cuenta_residual: true
    };

    const upline = Array.from({ length: 10 }, (_, i) => ({
      ancestro_id: 10 - i,
      nivel: i + 1,
      activo: true,
      pack: packGold
    }));

    const res = calcularResidual(orden, upline, escalaResidual);

    expect(res.total_pagado_cent).toBe(12222);
    expect(res.total_bloqueado_empresa_cent).toBe(0);
    expect(res.total_teorico_cent).toBe(12222);
    expect(res.comisiones.length).toBe(10);

    // Verificación exacta nivel por nivel del Ejemplo D
    expect(res.comisiones.find(c => c.nivel === 1)?.monto_cent).toBe(5040); // 40%
    expect(res.comisiones.find(c => c.nivel === 2)?.monto_cent).toBe(2520); // 20%
    expect(res.comisiones.find(c => c.nivel === 3)?.monto_cent).toBe(1260); // 10%
    expect(res.comisiones.find(c => c.nivel === 4)?.monto_cent).toBe(630);  // 5%
    expect(res.comisiones.find(c => c.nivel === 5)?.monto_cent).toBe(378);  // 3%
    expect(res.comisiones.find(c => c.nivel === 6)?.monto_cent).toBe(252);  // 2%
    expect(res.comisiones.find(c => c.nivel === 7)?.monto_cent).toBe(126);  // 1%
    expect(res.comisiones.find(c => c.nivel === 8)?.monto_cent).toBe(1260); // 10% (salto)
    expect(res.comisiones.find(c => c.nivel === 9)?.monto_cent).toBe(630);  // 5%
    expect(res.comisiones.find(c => c.nivel === 10)?.monto_cent).toBe(126); // 1%
  });

  it('el nivel 8 paga 1260 centavos, MÁS que el nivel 7 (126 centavos) por salto comercial deliberado', () => {
    const orden = {
      id: 202,
      socio_id: 11,
      ciclo_id: 1,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 126,
      cuenta_residual: true
    };

    const upline = Array.from({ length: 10 }, (_, i) => ({
      ancestro_id: 10 - i,
      nivel: i + 1,
      activo: true,
      pack: packGold
    }));

    const res = calcularResidual(orden, upline, escalaResidual);
    const montoNivel7 = res.comisiones.find(c => c.nivel === 7)?.monto_cent;
    const montoNivel8 = res.comisiones.find(c => c.nivel === 8)?.monto_cent;

    expect(montoNivel7).toBe(126);
    expect(montoNivel8).toBe(1260);
    expect(montoNivel8).toBeGreaterThan(montoNivel7);
  });

  it('Ejemplo E · Ejecutivo en nivel 6 no cobra (6 > 5 niveles) y 252 centavos quedan en la empresa', () => {
    const orden = {
      id: 203,
      socio_id: 11,
      ciclo_id: 1,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 126,
      cuenta_residual: true
    };

    const upline = Array.from({ length: 10 }, (_, i) => ({
      ancestro_id: 10 - i,
      nivel: i + 1,
      activo: true,
      pack: i + 1 === 6 ? packEjecutivo : packGold // Nivel 6 es Ejecutivo
    }));

    const res = calcularResidual(orden, upline, escalaResidual);

    // Nivel 6 bloqueado por pack_insuficiente: ahora se registra como 'retenida' (TAREA-49)
    expect(res.comisiones.filter(c => c.estado === 'confirmada').find(c => c.nivel === 6)).toBeUndefined();
    expect(res.comisiones.find(c => c.nivel === 6)?.estado).toBe('retenida');
    expect(res.comisiones.find(c => c.nivel === 6)?.detalle.motivo).toBe('pack_insuficiente');
    expect(res.total_pagado_cent).toBe(12222 - 252); // 11970
    expect(res.total_bloqueado_empresa_cent).toBe(252);
    expect(res.niveles_bloqueados.find(b => b.nivel === 6)?.motivo).toBe('pack_insuficiente');
  });

  it('Café de 18 pts en nivel 1 paga exactamente 720 centavos (S/. 7.20 — caso Máximo)', () => {
    const orden = {
      id: 204,
      socio_id: 2,
      ciclo_id: 1,
      tipo: 'recompra',
      total_cent: 7500,
      puntos_total: 18,
      cuenta_residual: true
    };

    const upline = [{ ancestro_id: 1, nivel: 1, activo: true, pack: packGold }];

    const res = calcularResidual(orden, upline, escalaResidual);

    expect(res.comisiones.length).toBe(1);
    expect(res.comisiones[0].monto_cent).toBe(720);
    expect(res.comisiones[0].base_cent).toBe(1800);
    expect(res.comisiones[0].porcentaje).toBe(40.0);
  });

  it('una orden de afiliación (o con cuenta_residual = false) NO genera residual', () => {
    const ordenAfiliacion = {
      id: 205,
      socio_id: 5,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      puntos_total: 300,
      cuenta_residual: false
    };

    const upline = [{ ancestro_id: 1, nivel: 1, activo: true, pack: packGold }];

    const res = calcularResidual(ordenAfiliacion, upline, escalaResidual);

    expect(res.comisiones).toEqual([]);
    expect(res.total_pagado_cent).toBe(0);
    expect(res.total_bloqueado_empresa_cent).toBe(0);
  });

  it('un Emprendedor en el upline nunca cobra residual (0 niveles)', () => {
    const orden = {
      id: 206,
      socio_id: 3,
      ciclo_id: 1,
      tipo: 'recompra',
      total_cent: 7500,
      puntos_total: 18,
      cuenta_residual: true
    };

    const upline = [{ ancestro_id: 2, nivel: 1, activo: true, pack: packEmprendedor }];

    const res = calcularResidual(orden, upline, escalaResidual);

    expect(res.comisiones.filter(c => c.estado === 'confirmada')).toEqual([]);
    expect(res.comisiones.length).toBe(1);
    expect(res.comisiones[0].estado).toBe('retenida');
    expect(res.comisiones[0].detalle.motivo).toBe('pack_insuficiente');
    expect(res.total_pagado_cent).toBe(0);
    expect(res.niveles_bloqueados.find(b => b.nivel === 1)?.monto_cent).toBe(720);
    expect(res.total_bloqueado_empresa_cent).toBe(1746);
  });

  describe('Invariantes Matemáticas y Solvencia', () => {
    it('ninguna comisión es negativa y todas son enteros en céntimos', () => {
      const orden = {
        id: 207,
        socio_id: 11,
        ciclo_id: 1,
        tipo: 'recompra',
        total_cent: 15000,
        puntos_total: 126,
        cuenta_residual: true
      };

      const upline = Array.from({ length: 10 }, (_, i) => ({
        ancestro_id: 10 - i,
        nivel: i + 1,
        activo: true,
        pack: packGold
      }));

      const res = calcularResidual(orden, upline, escalaResidual);

      for (const c of res.comisiones) {
        expect(c.monto_cent).toBeGreaterThan(0);
        expect(Number.isInteger(c.monto_cent)).toBe(true);
      }
    });

    it('la suma pagada NUNCA supera el 97% de la base de puntos', () => {
      const orden = {
        id: 208,
        socio_id: 11,
        ciclo_id: 1,
        tipo: 'recompra',
        total_cent: 20000,
        puntos_total: 250, // 25000 cent
        cuenta_residual: true
      };

      const upline = Array.from({ length: 10 }, (_, i) => ({
        ancestro_id: 10 - i,
        nivel: i + 1,
        activo: true,
        pack: packGold
      }));

      const res = calcularResidual(orden, upline, escalaResidual);
      expect(res.total_pagado_cent).toBeLessThanOrEqual(Math.round(25000 * 0.97));
    });

    it('con compresión desactivada, pagado + empresa = total teórico', () => {
      const orden = {
        id: 209,
        socio_id: 11,
        ciclo_id: 1,
        tipo: 'recompra',
        total_cent: 15000,
        puntos_total: 126,
        cuenta_residual: true
      };

      const uplineMixto = [
        { ancestro_id: 10, nivel: 1, activo: true, pack: packGold },
        { ancestro_id: 9, nivel: 2, activo: false, pack: packGold },
        { ancestro_id: 8, nivel: 3, activo: true, pack: packEjecutivo }
      ];

      const res = calcularResidual(orden, uplineMixto, escalaResidual);
      expect(res.total_pagado_cent + res.total_bloqueado_empresa_cent).toBe(res.total_teorico_cent);
    });

    it('Verificación de solvencia: el reparto nunca supera lo que pagó el socio (deja ~77% a la empresa)', () => {
      const casosProductos = [
        { nombre: 'Café', precioSocioCent: 7500, puntos: 18, maxRepartoEsperado: 1746 },
        { nombre: 'Aceite de Moringa', precioSocioCent: 6000, puntos: 14, maxRepartoEsperado: 1358 },
        { nombre: 'Harina de Moringa', precioSocioCent: 2500, puntos: 6, maxRepartoEsperado: 582 }
      ];

      const uplineCompleto = Array.from({ length: 10 }, (_, i) => ({
        ancestro_id: 10 - i,
        nivel: i + 1,
        activo: true,
        pack: packGold
      }));

      for (const prod of casosProductos) {
        const orden = {
          id: 300,
          socio_id: 11,
          ciclo_id: 1,
          tipo: 'recompra',
          total_cent: prod.precioSocioCent,
          puntos_total: prod.puntos,
          cuenta_residual: true
        };

        const res = calcularResidual(orden, uplineCompleto, escalaResidual);

        expect(res.total_pagado_cent).toBe(prod.maxRepartoEsperado);
        expect(res.total_pagado_cent).toBeLessThan(prod.precioSocioCent);
        const margenEmpresa = prod.precioSocioCent - res.total_pagado_cent;
        const pctMargen = (margenEmpresa / prod.precioSocioCent) * 100;
        expect(pctMargen).toBeGreaterThan(70); // deja más del 70% a la empresa
      }
    });
  });
});
