import { describe, it, expect } from 'vitest';
import { generarRedDeterminista } from '../../scripts/sembrar-red.mjs';
import { procesarComisionesCiclo, generarSentenciasInsertPorLotes } from '../motor/persistencia';

describe('TAREA-04A · Persistencia y Cálculo Completo sobre Red Simulada', () => {
  const red = generarRedDeterminista();

  const packs = [
    { id: 1, codigo: 'EMPRENDEDOR', precio_cent: 12000, niveles_patrocinio: 0, niveles_residual: 0 },
    { id: 2, codigo: 'EJECUTIVO', precio_cent: 36000, niveles_patrocinio: 3, niveles_residual: 5 },
    { id: 3, codigo: 'GOLD', precio_cent: 120000, niveles_patrocinio: 7, niveles_residual: 10 },
    { id: 4, codigo: 'FAMILIAR', precio_cent: 400000, niveles_patrocinio: 7, niveles_residual: 10 },
    { id: 5, codigo: 'EMPRESARIAL', precio_cent: 800000, niveles_patrocinio: 7, niveles_residual: 10 }
  ];

  const escalaPatrocinio = [
    { nivel: 1, porcentaje: 20.000 },
    { nivel: 2, porcentaje: 4.000 },
    { nivel: 3, porcentaje: 3.000 },
    { nivel: 4, porcentaje: 2.000 },
    { nivel: 5, porcentaje: 1.000 },
    { nivel: 6, porcentaje: 0.500 },
    { nivel: 7, porcentaje: 0.300 }
  ];

  const escalaResidual = [
    { nivel: 1, porcentaje: 40.000 },
    { nivel: 2, porcentaje: 20.000 },
    { nivel: 3, porcentaje: 10.000 },
    { nivel: 4, porcentaje: 5.000 },
    { nivel: 5, porcentaje: 3.000 },
    { nivel: 6, porcentaje: 2.000 },
    { nivel: 7, porcentaje: 1.000 },
    { nivel: 8, porcentaje: 10.000 },
    { nivel: 9, porcentaje: 5.000 },
    { nivel: 10, porcentaje: 1.000 }
  ];

  const packComisionEspecial = [
    { pack_id: 1, pack_codigo: 'EMPRENDEDOR', nivel: 1, porcentaje: 41.700 }
  ];

  function construirRedAncestro(socios) {
    const mapaPadres = new Map(socios.map(s => [s.id, s.patrocinador_id]));
    const ancestros = [];
    for (const s of socios) {
      let actualId = s.id;
      let nivel = 1;
      while (mapaPadres.has(actualId) && mapaPadres.get(actualId)) {
        const padreId = mapaPadres.get(actualId);
        ancestros.push({
          descendiente_id: s.id,
          ancestro_id: padreId,
          nivel
        });
        actualId = padreId;
        nivel++;
      }
    }
    return ancestros;
  }

  const redAncestro = construirRedAncestro(red.socios);

  it('calcula correctamente los 3 ciclos y genera las sentencias de inserción por lotes', () => {
    let granTotalComisiones = 0;

    for (let c = 1; c <= 3; c++) {
      const res = procesarComisionesCiclo({
        cicloId: c,
        ordenes: red.ordenes,
        socios: red.socios,
        redAncestro,
        activaciones: red.activaciones,
        escalaPatrocinio,
        escalaResidual,
        packComisionEspecial,
        packs
      });

      expect(res.comisiones.length).toBeGreaterThan(0);
      expect(res.totalComisionesCent).toBeGreaterThan(0);
      expect(res.totalBloqueadoEmpresaCent).toBeGreaterThan(0);

      granTotalComisiones += res.comisiones.length;

      console.log(`[RESUMEN CICLO ${c}]`);
      console.log(`  Patrocinio: ${res.resumenPatrocinio.cantidad} comisiones | Pagado: S/. ${(res.resumenPatrocinio.totalPagadoCent / 100).toFixed(2)} (${res.resumenPatrocinio.totalPagadoCent} cent) | Bloqueado: S/. ${(res.resumenPatrocinio.totalBloqueadoCent / 100).toFixed(2)} (${res.resumenPatrocinio.totalBloqueadoCent} cent)`);
      console.log(`  Residual:   ${res.resumenResidual.cantidad} comisiones | Pagado: S/. ${(res.resumenResidual.totalPagadoCent / 100).toFixed(2)} (${res.resumenResidual.totalPagadoCent} cent) | Bloqueado: S/. ${(res.resumenResidual.totalBloqueadoCent / 100).toFixed(2)} (${res.resumenResidual.totalBloqueadoCent} cent)`);
      console.log(`  Total:      ${res.comisiones.length} comisiones | Pagado: S/. ${(res.totalComisionesCent / 100).toFixed(2)} (${res.totalComisionesCent} cent) | Empresa: S/. ${(res.totalBloqueadoEmpresaCent / 100).toFixed(2)} (${res.totalBloqueadoEmpresaCent} cent)`);

      const lotes = generarSentenciasInsertPorLotes(res.comisiones, 500);
      expect(lotes.length).toBeGreaterThanOrEqual(1);
      for (const sql of lotes) {
        expect(sql.startsWith('INSERT INTO comision')).toBe(true);
      }
    }

    expect(granTotalComisiones).toBeGreaterThan(500);
  });
});
