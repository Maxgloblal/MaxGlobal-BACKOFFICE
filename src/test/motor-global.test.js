import { describe, it, expect } from 'vitest';
import { calcularBonoGlobal } from '../motor/global';

describe('TAREA-04B · Motor de Comisiones — Bono Global', () => {
  it('pool = 1% de los puntos totales x 100 céntimos (S/. 1.00 por punto)', () => {
    // 50,000 puntos en el semestre -> pool = 50,000 * 100 * 1% = 50,000 céntimos (S/. 500)
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 30000 },
      { socio_id: 2, aplica_pack: true, meses_activo: 6, puntos_acumulados: 20000 }
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 50000);

    expect(res.pool_cent).toBe(50000); // 50000 céntimos
    expect(res.puntos_totales).toBe(50000);
    expect(res.estado).toBe('cerrado');
  });

  it('un Ejecutivo nunca entra al reparto (aplica_pack = false)', () => {
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 30000 }, // Gold
      { socio_id: 2, aplica_pack: false, meses_activo: 6, puntos_acumulados: 20000 } // Ejecutivo
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 50000);

    expect(res.calificados_count).toBe(1);
    expect(res.socios.find(s => s.socio_id === 2)?.califica).toBe(false);
    expect(res.socios.find(s => s.socio_id === 2)?.monto_cent).toBe(0);
    expect(res.socios.find(s => s.socio_id === 1)?.califica).toBe(true);
    expect(res.socios.find(s => s.socio_id === 1)?.monto_cent).toBe(50000);
  });

  it('un socio activo 5 de 6 meses queda FUERA del reparto', () => {
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 30000 },
      { socio_id: 2, aplica_pack: true, meses_activo: 5, puntos_acumulados: 20000 } // 🔴 5 meses
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 50000);

    expect(res.socios.find(s => s.socio_id === 2)?.califica).toBe(false);
    expect(res.socios.find(s => s.socio_id === 2)?.monto_cent).toBe(0);
  });

  it('un socio activo los 6 meses completos entra al reparto', () => {
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 30000 }
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 30000);

    expect(res.socios.find(s => s.socio_id === 1)?.califica).toBe(true);
    expect(res.socios.find(s => s.socio_id === 1)?.monto_cent).toBe(30000);
  });

  it('reparto proporcional: el que tiene el doble de puntos recibe el doble de bono', () => {
    // Socio 1 tiene 20,000 pts (2x) y Socio 2 tiene 10,000 pts (1x)
    // Pool = 30,000 pts * 100 * 1% = 30,000 céntimos
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 20000 },
      { socio_id: 2, aplica_pack: true, meses_activo: 6, puntos_acumulados: 10000 }
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 30000);

    const monto1 = res.socios.find(s => s.socio_id === 1)?.monto_cent;
    const monto2 = res.socios.find(s => s.socio_id === 2)?.monto_cent;

    expect(monto1).toBe(20000); // 2/3 de 30,000
    expect(monto2).toBe(10000); // 1/3 de 30,000
    expect(monto1).toBe(monto2 * 2);
  });

  it('la suma repartida NUNCA supera el pool', () => {
    // Casos con divisiones inexactas: 3 socios con 100, 100, 100 pts sobre un pool de 100 céntimos
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 },
      { socio_id: 2, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 },
      { socio_id: 3, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 }
    ];

    // Pool = 100 céntimos (100 / 3 = 33.33... céntimos c/u)
    const res = calcularBonoGlobal(2026, 1, 6, socios, 100);

    expect(res.pool_cent).toBe(100);
    // Cada uno recibe 33 céntimos -> suma = 99 céntimos
    expect(res.total_repartido_cent).toBeLessThanOrEqual(res.pool_cent);
    expect(res.total_repartido_cent).toBe(99);
  });

  it('los céntimos sobrantes del redondeo quedan registrados en la empresa y no se regalan', () => {
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 },
      { socio_id: 2, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 },
      { socio_id: 3, aplica_pack: true, meses_activo: 6, puntos_acumulados: 100 }
    ];

    const res = calcularBonoGlobal(2026, 1, 6, socios, 100);

    // 100 pool - 99 repartido = 1 céntimo retenido a favor de la empresa
    expect(res.sobrante_empresa_cent).toBe(1);
    expect(res.total_repartido_cent + res.sobrante_empresa_cent).toBe(res.pool_cent);
  });

  it('un semestre incompleto (ej. 3 meses disponibles) queda en estado abierto y NO reparte', () => {
    const socios = [
      { socio_id: 1, aplica_pack: true, meses_activo: 3, puntos_acumulados: 15000 },
      { socio_id: 2, aplica_pack: true, meses_activo: 3, puntos_acumulados: 10000 }
    ];

    const res = calcularBonoGlobal(2026, 1, 3, socios, 25000);

    expect(res.estado).toBe('abierto');
    expect(res.pool_cent).toBe(25000); // Pool acumulado que llevaría
    expect(res.calificados_count).toBe(0);
    expect(res.total_repartido_cent).toBe(0);
    expect(res.sobrante_empresa_cent).toBe(25000);
  });
});
