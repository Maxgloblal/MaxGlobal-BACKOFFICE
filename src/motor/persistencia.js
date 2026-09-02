/**
 * Capa de persistencia para el motor de comisiones
 * Reglas:
 * 1. Libro de SOLO-AGREGAR (INSERT y nada más. Nunca UPDATE ni DELETE).
 * 2. Idempotencia: no se inserta si ya existen comisiones calculadas para ese ciclo y tipo.
 * 3. Las 14 columnas completas: id, ciclo_id, beneficiario_id, generador_id, orden_id,
 *    tipo, nivel, base_cent, base_puntos, porcentaje, monto_cent, estado, detalle, creado_en.
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-04A-MOTOR-PATROCINIO-Y-RESIDUAL.md
 */

import { calcularPatrocinio } from './patrocinio';
import { calcularResidual } from './residual';

/**
 * Calcula en memoria las comisiones generadas por UNA sola orden.
 * Se usa de forma unificada tanto para la vista previa (dry-run) como para la confirmación real.
 */
export function procesarComisionesDeUnaOrden({
  orden,
  upline,
  escalaPatrocinio = [],
  escalaResidual = [],
  packComisionEspecial = [],
  config = {}
}) {
  if (!orden) {
    return {
      comisiones: [],
      totalPagadoCent: 0,
      totalBloqueadoEmpresaCent: 0,
      totalTeoricoCent: 0,
      cantidadComisiones: 0
    };
  }

  const socioId = Number(orden.socio_id);
  const cicloId = Number(orden.ciclo_id || 1);

  if (orden.tipo === 'afiliacion') {
    const ordenEntrada = {
      id: orden.id ? Number(orden.id) : null,
      socio_id: socioId,
      ciclo_id: cicloId,
      tipo: 'afiliacion',
      total_cent: Number(orden.total_cent || 0),
      pack_id: orden.pack_id ? Number(orden.pack_id) : null,
      pack_codigo: orden.pack_codigo || null
    };

    const res = calcularPatrocinio(
      ordenEntrada,
      upline,
      escalaPatrocinio,
      packComisionEspecial,
      config
    );

    return {
      tipo: 'afiliacion',
      comisiones: res.comisiones,
      totalPagadoCent: res.total_pagado_cent,
      totalBloqueadoEmpresaCent: res.total_bloqueado_empresa_cent,
      totalTeoricoCent: res.total_teorico_cent,
      cantidadComisiones: res.comisiones.length
    };
  }

  if (orden.tipo === 'recompra' && orden.cuenta_residual !== false) {
    const ordenEntrada = {
      id: orden.id ? Number(orden.id) : null,
      socio_id: socioId,
      ciclo_id: cicloId,
      tipo: 'recompra',
      total_cent: Number(orden.total_cent || 0),
      puntos_total: Number(orden.puntos_total || 0),
      cuenta_residual: true
    };

    const res = calcularResidual(
      ordenEntrada,
      upline,
      escalaResidual,
      config
    );

    return {
      tipo: 'recompra',
      comisiones: res.comisiones,
      totalPagadoCent: res.total_pagado_cent,
      totalBloqueadoEmpresaCent: res.total_bloqueado_empresa_cent,
      totalTeoricoCent: res.total_teorico_cent,
      cantidadComisiones: res.comisiones.length
    };
  }

  return {
    tipo: orden.tipo || 'otro',
    comisiones: [],
    totalPagadoCent: 0,
    totalBloqueadoEmpresaCent: 0,
    totalTeoricoCent: 0,
    cantidadComisiones: 0
  };
}

/**
 * Calcula en memoria todas las comisiones de patrocinio y residual para un ciclo.
 */
export function procesarComisionesCiclo({
  cicloId,
  ordenes,
  socios,
  redAncestro,
  activaciones,
  escalaPatrocinio,
  escalaResidual,
  packComisionEspecial,
  packs,
  config = {}
}) {
  const mapaSocios = new Map(socios.map(s => [Number(s.id), s]));
  const mapaPacks = new Map(packs.map(p => [Number(p.id), p]));
  const mapaPacksPorCodigo = new Map(packs.map(p => [String(p.codigo).toUpperCase(), p]));

  // Mapa de activaciones por clave `socioId_cicloId`
  const mapaActivos = new Map(
    activaciones.map(a => [`${a.socio_id}_${a.ciclo_id}`, Boolean(a.activo)])
  );

  // Agrupar red_ancestro por descendiente_id
  const mapaAncestrosPorSocio = new Map();
  for (const r of redAncestro) {
    const descId = Number(r.descendiente_id);
    if (!mapaAncestrosPorSocio.has(descId)) {
      mapaAncestrosPorSocio.set(descId, []);
    }
    mapaAncestrosPorSocio.get(descId).push(r);
  }

  // Filtrar órdenes confirmadas de este ciclo
  const ordenesCiclo = ordenes.filter(
    o => Number(o.ciclo_id) === Number(cicloId) && o.estado === 'confirmada'
  );

  const todasComisiones = [];
  let resumenPatrocinio = { totalPagadoCent: 0, totalBloqueadoCent: 0, totalTeoricoCent: 0, cantidad: 0 };
  let resumenResidual = { totalPagadoCent: 0, totalBloqueadoCent: 0, totalTeoricoCent: 0, cantidad: 0 };

  for (const orden of ordenesCiclo) {
    const socioId = Number(orden.socio_id);
    const registrosAncestros = mapaAncestrosPorSocio.get(socioId) || [];

    // Construir upline con datos de pack y activación
    const upline = registrosAncestros.map(r => {
      const ancId = Number(r.ancestro_id);
      const socioAnc = mapaSocios.get(ancId);
      const packAnc = socioAnc ? (mapaPacks.get(Number(socioAnc.pack_id)) || mapaPacksPorCodigo.get(String(socioAnc.pack_codigo || '').toUpperCase())) : null;
      const activo = mapaActivos.get(`${ancId}_${cicloId}`) ?? false;

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

    const resOrden = procesarComisionesDeUnaOrden({
      orden,
      upline,
      escalaPatrocinio,
      escalaResidual,
      packComisionEspecial,
      config
    });

    todasComisiones.push(...resOrden.comisiones);

    if (resOrden.tipo === 'afiliacion') {
      resumenPatrocinio.totalPagadoCent += resOrden.totalPagadoCent;
      resumenPatrocinio.totalBloqueadoCent += resOrden.totalBloqueadoEmpresaCent;
      resumenPatrocinio.totalTeoricoCent += resOrden.totalTeoricoCent;
      resumenPatrocinio.cantidad += resOrden.cantidadComisiones;
    } else if (resOrden.tipo === 'recompra') {
      resumenResidual.totalPagadoCent += resOrden.totalPagadoCent;
      resumenResidual.totalBloqueadoCent += resOrden.totalBloqueadoEmpresaCent;
      resumenResidual.totalTeoricoCent += resOrden.totalTeoricoCent;
      resumenResidual.cantidad += resOrden.cantidadComisiones;
    }
  }

  return {
    cicloId,
    comisiones: todasComisiones,
    resumenPatrocinio,
    resumenResidual,
    totalComisionesCent: resumenPatrocinio.totalPagadoCent + resumenResidual.totalPagadoCent,
    totalBloqueadoEmpresaCent: resumenPatrocinio.totalBloqueadoCent + resumenResidual.totalBloqueadoCent
  };
}

/**
 * Genera lotes de sentencias SQL INSERT para insertar en la tabla `comision`.
 * @param {Array} comisiones
 * @param {number} tamanoLote
 * @returns {string[]} Lista de queries INSERT por lotes
 */
export function generarSentenciasInsertPorLotes(comisiones, tamanoLote = 500) {
  if (!comisiones || comisiones.length === 0) return [];

  const lotes = [];
  for (let i = 0; i < comisiones.length; i += tamanoLote) {
    const chunk = comisiones.slice(i, i + tamanoLote);

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

  return lotes;
}
