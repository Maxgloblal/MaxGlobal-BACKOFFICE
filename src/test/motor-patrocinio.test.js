import { describe, it, expect } from 'vitest';
import { calcularPatrocinio } from '../motor/patrocinio';

describe('TAREA-04A · Motor de Comisiones — Bono de Patrocinio', () => {
  const escalaPatrocinio = [
    { nivel: 1, porcentaje: 20.000 },
    { nivel: 2, porcentaje: 4.000 },
    { nivel: 3, porcentaje: 3.000 },
    { nivel: 4, porcentaje: 2.000 },
    { nivel: 5, porcentaje: 1.000 },
    { nivel: 6, porcentaje: 0.500 },
    { nivel: 7, porcentaje: 0.300 }
  ];

  const especialesPatrocinio = [
    { pack_id: 1, pack_codigo: 'EMPRENDEDOR', nivel: 1, porcentaje: 41.700 }
  ];

  const packGold = { id: 3, codigo: 'GOLD', niveles_patrocinio: 7, niveles_residual: 10 };
  const packEjecutivo = { id: 2, codigo: 'EJECUTIVO', niveles_patrocinio: 3, niveles_residual: 5 };
  const packEmprendedor = { id: 1, codigo: 'EMPRENDEDOR', niveles_patrocinio: 0, niveles_residual: 0 };

  it('Ejemplo A · Gold (120000 cent), 7 ancestros Gold activos -> total exacto 36960 cent', () => {
    const orden = {
      id: 101,
      socio_id: 8,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    const upline = [
      { ancestro_id: 7, nivel: 1, activo: true, pack: packGold },
      { ancestro_id: 6, nivel: 2, activo: true, pack: packGold },
      { ancestro_id: 5, nivel: 3, activo: true, pack: packGold },
      { ancestro_id: 4, nivel: 4, activo: true, pack: packGold },
      { ancestro_id: 3, nivel: 5, activo: true, pack: packGold },
      { ancestro_id: 2, nivel: 6, activo: true, pack: packGold },
      { ancestro_id: 1, nivel: 7, activo: true, pack: packGold }
    ];

    const res = calcularPatrocinio(orden, upline, escalaPatrocinio, especialesPatrocinio);

    expect(res.total_pagado_cent).toBe(36960);
    expect(res.total_bloqueado_empresa_cent).toBe(0);
    expect(res.total_teorico_cent).toBe(36960);
    expect(res.comisiones.length).toBe(7);

    // Verificación puntual de cada nivel del Ejemplo A
    expect(res.comisiones.find(c => c.nivel === 1)?.monto_cent).toBe(24000);
    expect(res.comisiones.find(c => c.nivel === 2)?.monto_cent).toBe(4800);
    expect(res.comisiones.find(c => c.nivel === 3)?.monto_cent).toBe(3600);
    expect(res.comisiones.find(c => c.nivel === 4)?.monto_cent).toBe(2400);
    expect(res.comisiones.find(c => c.nivel === 5)?.monto_cent).toBe(1200);
    expect(res.comisiones.find(c => c.nivel === 6)?.monto_cent).toBe(600);
    expect(res.comisiones.find(c => c.nivel === 7)?.monto_cent).toBe(360);
  });

  it('Ejemplo B · con corte (Ejecutivo en nivel 4) y un inactivo (Gold en nivel 5) -> total 33360, 3600 a empresa', () => {
    const orden = {
      id: 102,
      socio_id: 8,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    const upline = [
      { ancestro_id: 7, nivel: 1, activo: true, pack: packGold },
      { ancestro_id: 6, nivel: 2, activo: true, pack: packGold },
      { ancestro_id: 5, nivel: 3, activo: true, pack: packEjecutivo }, // 3 <= 3: cobra 3600
      { ancestro_id: 4, nivel: 4, activo: true, pack: packEjecutivo }, // 4 > 3: BLOQUEADO (2400)
      { ancestro_id: 3, nivel: 5, activo: false, pack: packGold },     // INACTIVO: BLOQUEADO (1200)
      { ancestro_id: 2, nivel: 6, activo: true, pack: packGold },      // cobra 600
      { ancestro_id: 1, nivel: 7, activo: true, pack: packGold }       // cobra 360
    ];

    const res = calcularPatrocinio(orden, upline, escalaPatrocinio, especialesPatrocinio);

    // Total pagado exacto
    expect(res.total_pagado_cent).toBe(33360);
    // Lo no pagado queda en la empresa y NO se reparte
    expect(res.total_bloqueado_empresa_cent).toBe(3600);
    expect(res.total_teorico_cent).toBe(36960);
    expect(res.total_pagado_cent + res.total_bloqueado_empresa_cent).toBe(36960);

    // Niveles bloqueados sin compresión
    expect(res.comisiones.find(c => c.nivel === 4)).toBeUndefined();
    expect(res.comisiones.find(c => c.nivel === 5)).toBeUndefined();
    expect(res.niveles_bloqueados.find(b => b.nivel === 4)?.monto_cent).toBe(2400);
    expect(res.niveles_bloqueados.find(b => b.nivel === 5)?.monto_cent).toBe(1200);
  });

  it('Ejemplo C · Kit Emprendedor (12000 cent) -> 5004 cent al nivel 1 y niveles 2-7 en cero', () => {
    const orden = {
      id: 103,
      socio_id: 8,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 12000,
      pack_id: 1,
      pack_codigo: 'EMPRENDEDOR'
    };

    const upline = [
      { ancestro_id: 7, nivel: 1, activo: true, pack: packGold },
      { ancestro_id: 6, nivel: 2, activo: true, pack: packGold },
      { ancestro_id: 5, nivel: 3, activo: true, pack: packGold },
      { ancestro_id: 4, nivel: 4, activo: true, pack: packGold },
      { ancestro_id: 3, nivel: 5, activo: true, pack: packGold },
      { ancestro_id: 2, nivel: 6, activo: true, pack: packGold },
      { ancestro_id: 1, nivel: 7, activo: true, pack: packGold }
    ];

    const res = calcularPatrocinio(orden, upline, escalaPatrocinio, especialesPatrocinio);

    expect(res.total_pagado_cent).toBe(5004);
    expect(res.comisiones.length).toBe(1);
    expect(res.comisiones[0].nivel).toBe(1);
    expect(res.comisiones[0].monto_cent).toBe(5004);
    expect(res.comisiones[0].porcentaje).toBe(41.7);
  });

  it('un upline de 3 ancestros solamente no revienta y paga 3 niveles', () => {
    const orden = {
      id: 104,
      socio_id: 4,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    const upline = [
      { ancestro_id: 3, nivel: 1, activo: true, pack: packGold },
      { ancestro_id: 2, nivel: 2, activo: true, pack: packGold },
      { ancestro_id: 1, nivel: 3, activo: true, pack: packGold }
    ];

    const res = calcularPatrocinio(orden, upline, escalaPatrocinio, especialesPatrocinio);

    expect(res.comisiones.length).toBe(3);
    expect(res.total_pagado_cent).toBe(24000 + 4800 + 3600); // 32400
    expect(res.total_bloqueado_empresa_cent).toBe(2400 + 1200 + 600 + 360); // 4560
    expect(res.total_pagado_cent + res.total_bloqueado_empresa_cent).toBe(36960);
  });

  it('un socio sin patrocinador (ID 1) devuelve arreglo vacío sin fallar', () => {
    const orden = {
      id: 1,
      socio_id: 1,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    const res = calcularPatrocinio(orden, [], escalaPatrocinio, especialesPatrocinio);

    expect(res.comisiones).toEqual([]);
    expect(res.total_pagado_cent).toBe(0);
    expect(res.total_bloqueado_empresa_cent).toBe(36960);
  });

  it('todos los ancestros inactivos da total 0 sin excepción', () => {
    const orden = {
      id: 105,
      socio_id: 8,
      ciclo_id: 1,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    const uplineInactivo = [
      { ancestro_id: 7, nivel: 1, activo: false, pack: packGold },
      { ancestro_id: 6, nivel: 2, activo: false, pack: packGold },
      { ancestro_id: 5, nivel: 3, activo: false, pack: packGold },
      { ancestro_id: 4, nivel: 4, activo: false, pack: packGold },
      { ancestro_id: 3, nivel: 5, activo: false, pack: packGold },
      { ancestro_id: 2, nivel: 6, activo: false, pack: packGold },
      { ancestro_id: 1, nivel: 7, activo: false, pack: packGold }
    ];

    const res = calcularPatrocinio(orden, uplineInactivo, escalaPatrocinio, especialesPatrocinio);

    expect(res.comisiones).toEqual([]);
    expect(res.total_pagado_cent).toBe(0);
    expect(res.total_bloqueado_empresa_cent).toBe(36960);
  });

  describe('Invariantes Matemáticas de Patrocinio', () => {
    it('ninguna comisión es negativa y todas son números enteros de céntimos', () => {
      const orden = {
        id: 106,
        socio_id: 8,
        ciclo_id: 1,
        tipo: 'afiliacion',
        total_cent: 120000,
        pack_id: 3,
        pack_codigo: 'GOLD'
      };
      const upline = [
        { ancestro_id: 7, nivel: 1, activo: true, pack: packGold },
        { ancestro_id: 6, nivel: 2, activo: true, pack: packGold }
      ];

      const res = calcularPatrocinio(orden, upline, escalaPatrocinio, especialesPatrocinio);

      for (const c of res.comisiones) {
        expect(c.monto_cent).toBeGreaterThan(0);
        expect(Number.isInteger(c.monto_cent)).toBe(true);
      }
    });

    it('la suma pagada NUNCA supera el 30.8% del pack (o 41.7% para Emprendedor)', () => {
      const ordenesPrueba = [
        { id: 1, socio_id: 8, ciclo_id: 1, tipo: 'afiliacion', total_cent: 12000, pack_id: 1, pack_codigo: 'EMPRENDEDOR' },
        { id: 2, socio_id: 8, ciclo_id: 1, tipo: 'afiliacion', total_cent: 36000, pack_id: 2, pack_codigo: 'EJECUTIVO' },
        { id: 3, socio_id: 8, ciclo_id: 1, tipo: 'afiliacion', total_cent: 120000, pack_id: 3, pack_codigo: 'GOLD' },
        { id: 4, socio_id: 8, ciclo_id: 1, tipo: 'afiliacion', total_cent: 400000, pack_id: 4, pack_codigo: 'FAMILIAR' },
        { id: 5, socio_id: 8, ciclo_id: 1, tipo: 'afiliacion', total_cent: 800000, pack_id: 5, pack_codigo: 'EMPRESARIAL' }
      ];

      const uplineCompleto = Array.from({ length: 7 }, (_, i) => ({
        ancestro_id: i + 1,
        nivel: i + 1,
        activo: true,
        pack: packGold
      }));

      for (const ord of ordenesPrueba) {
        const res = calcularPatrocinio(ord, uplineCompleto, escalaPatrocinio, especialesPatrocinio);
        if (ord.pack_codigo === 'EMPRENDEDOR') {
          expect(res.total_pagado_cent).toBeLessThanOrEqual(Math.round(ord.total_cent * 0.417));
        } else {
          expect(res.total_pagado_cent).toBeLessThanOrEqual(Math.round(ord.total_cent * 0.308));
        }
      }
    });

    it('con compresión desactivada, pagado + bloqueado a empresa === total teórico', () => {
      const orden = {
        id: 107,
        socio_id: 8,
        ciclo_id: 1,
        tipo: 'afiliacion',
        total_cent: 120000,
        pack_id: 3,
        pack_codigo: 'GOLD'
      };

      const uplineMixto = [
        { ancestro_id: 7, nivel: 1, activo: true, pack: packGold },
        { ancestro_id: 6, nivel: 2, activo: false, pack: packGold },
        { ancestro_id: 5, nivel: 3, activo: true, pack: packEmprendedor } // Emprendedor tiene 0 niveles
      ];

      const res = calcularPatrocinio(orden, uplineMixto, escalaPatrocinio, especialesPatrocinio);
      expect(res.total_pagado_cent + res.total_bloqueado_empresa_cent).toBe(res.total_teorico_cent);
    });
  });
});
