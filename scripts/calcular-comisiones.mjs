/**
 * Script para calcular y preparar las comisiones de la red simulada
 * Usa el motor puro en src/motor/ y la red determinista de scripts/sembrar-red.mjs
 */

import { generarRedDeterminista } from './sembrar-red.mjs';
import { calcularPatrocinio } from '../src/motor/patrocinio.ts';
import { calcularResidual } from '../src/motor/residual.ts';

export function construirRedAncestro(socios) {
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

export function obtenerTodasLasComisiones() {
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

  const redAncestro = construirRedAncestro(red.socios);
  const mapaSocios = new Map(red.socios.map(s => [Number(s.id), s]));
  const mapaPacks = new Map(packs.map(p => [Number(p.id), p]));
  const mapaPacksPorCodigo = new Map(packs.map(p => [String(p.codigo).toUpperCase(), p]));

  const mapaAncestrosPorSocio = new Map();
  for (const r of redAncestro) {
    const descId = Number(r.descendiente_id);
    if (!mapaAncestrosPorSocio.has(descId)) {
      mapaAncestrosPorSocio.set(descId, []);
    }
    mapaAncestrosPorSocio.get(descId).push(r);
  }

  const todasLasComisiones = [];
  const resumenPorCiclo = {};

  for (let c = 1; c <= 3; c++) {
    const mapaActivos = new Map(
      red.activaciones
        .filter(a => a.ciclo_id === c)
        .map(a => [a.socio_id, Boolean(a.activo)])
    );

    const ordenesCiclo = red.ordenes.filter(
      o => Number(o.ciclo_id) === c && o.estado === 'confirmada'
    );

    let patPagado = 0;
    let patBloqueado = 0;
    let patCount = 0;
    let resPagado = 0;
    let resBloqueado = 0;
    let resCount = 0;

    for (const orden of ordenesCiclo) {
      const socioId = Number(orden.socio_id);
      const registrosAncestros = mapaAncestrosPorSocio.get(socioId) || [];

      const upline = registrosAncestros.map(r => {
        const ancId = Number(r.ancestro_id);
        const socioAnc = mapaSocios.get(ancId);
        const packAnc = socioAnc ? (mapaPacks.get(Number(socioAnc.pack_id)) || mapaPacksPorCodigo.get(String(socioAnc.pack_codigo || '').toUpperCase())) : null;
        const activo = mapaActivos.get(ancId) ?? false;

        return {
          ancestro_id: ancId,
          nivel: Number(r.nivel),
          activo,
          pack: {
            id: packAnc?.id ?? 0,
            codigo: packAnc?.codigo ?? '',
            niveles_patrocinio: Number(packAnc?.niveles_patrocinio ?? 0),
            niveles_residual: Number(packAnc?.niveles_residual ?? 0)
          }
        };
      });

      if (orden.tipo === 'afiliacion') {
        const ordenEntrada = {
          id: Number(orden.id),
          socio_id: socioId,
          ciclo_id: c,
          tipo: 'afiliacion',
          total_cent: Number(orden.total_cent),
          pack_id: orden.pack_id ? Number(orden.pack_id) : null,
          pack_codigo: orden.pack_codigo || null
        };

        const resPat = calcularPatrocinio(
          ordenEntrada,
          upline,
          escalaPatrocinio,
          packComisionEspecial
        );

        todasLasComisiones.push(...resPat.comisiones);
        patPagado += resPat.total_pagado_cent;
        patBloqueado += resPat.total_bloqueado_empresa_cent;
        patCount += resPat.comisiones.length;
      }

      if (orden.tipo === 'recompra' && orden.cuenta_residual !== false) {
        const ordenEntrada = {
          id: Number(orden.id),
          socio_id: socioId,
          ciclo_id: c,
          tipo: 'recompra',
          total_cent: Number(orden.total_cent),
          puntos_total: Number(orden.puntos_total ?? 0),
          cuenta_residual: true
        };

        const resRes = calcularResidual(
          ordenEntrada,
          upline,
          escalaResidual
        );

        todasLasComisiones.push(...resRes.comisiones);
        resPagado += resRes.total_pagado_cent;
        resBloqueado += resRes.total_bloqueado_empresa_cent;
        resCount += resRes.comisiones.length;
      }
    }

    resumenPorCiclo[c] = {
      patrocinio: { cantidad: patCount, pagado_cent: patPagado, bloqueado_cent: patBloqueado },
      residual: { cantidad: resCount, pagado_cent: resPagado, bloqueado_cent: resBloqueado },
      total_pagado_cent: patPagado + resPagado,
      total_bloqueado_cent: patBloqueado + resBloqueado,
      cantidad_total: patCount + resCount
    };
  }

  return { todasLasComisiones, resumenPorCiclo };
}

export function obtenerLotesSql(tamanoLote = 500) {
  const { todasLasComisiones, resumenPorCiclo } = obtenerTodasLasComisiones();

  const lotes = [];
  for (let i = 0; i < todasLasComisiones.length; i += tamanoLote) {
    const chunk = todasLasComisiones.slice(i, i + tamanoLote);

    const valoresSql = chunk.map(c => {
      const basePuntos = c.base_puntos === null || c.base_puntos === undefined ? 'NULL' : Number(c.base_puntos);
      const detalleJson = JSON.stringify(c.detalle || {}).replace(/'/g, "''");

      return `(${Number(c.ciclo_id)}, ${Number(c.beneficiario_id)}, ${Number(c.generador_id)}, ${Number(c.orden_id)}, '${c.tipo}', ${Number(c.nivel)}, ${Number(c.base_cent)}, ${basePuntos}, ${Number(c.porcentaje)}, ${Number(c.monto_cent)}, '${c.estado}', '${detalleJson}'::jsonb, now())`;
    }).join(',\n');

    const sql = `INSERT INTO comision (
  ciclo_id, beneficiario_id, generador_id, orden_id, tipo, nivel,
  base_cent, base_puntos, porcentaje, monto_cent, estado, detalle, creado_en
) VALUES
${valoresSql};`;

    lotes.push(sql);
  }

  return { lotes, resumenPorCiclo, totalComisiones: todasLasComisiones.length };
}
