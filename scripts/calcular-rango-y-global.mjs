/**
 * Script para calcular Rango, Línea Estirada y Periodo Global sobre los 500 socios
 */

import { generarRedDeterminista } from './sembrar-red.mjs';
import { calificarRangoSocio, calcularPuntosComputables } from '../src/motor/rango.ts';
import { calcularBonoGlobal } from '../src/motor/global.ts';

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

export function procesarRangoYGlobalCompleto() {
  const red = generarRedDeterminista();

  const rangos = [
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

  const redAncestro = construirRedAncestro(red.socios);

  // Mapa de descendientes por ancestro y nivel
  // ancestro_id -> array de descendientes
  const descendientesPorAncestro = new Map();
  for (const r of redAncestro) {
    if (!descendientesPorAncestro.has(r.ancestro_id)) {
      descendientesPorAncestro.set(r.ancestro_id, []);
    }
    descendientesPorAncestro.get(r.ancestro_id).push(r);
  }

  // Frontales directos (nivel = 1) por socio
  const frontalesPorSocio = new Map();
  for (const s of red.socios) {
    frontalesPorSocio.set(s.id, []);
  }
  for (const s of red.socios) {
    if (s.patrocinador_id) {
      if (!frontalesPorSocio.has(s.patrocinador_id)) {
        frontalesPorSocio.set(s.patrocinador_id, []);
      }
      frontalesPorSocio.get(s.patrocinador_id).push(s.id);
    }
  }

  // Para cada frontal F de un socio S, obtener el conjunto de IDs en la rama de F (F + todos sus descendientes)
  const conjuntoDescendientes = new Map();
  for (const s of red.socios) {
    const descs = (descendientesPorAncestro.get(s.id) || []).map(r => r.descendiente_id);
    conjuntoDescendientes.set(s.id, new Set([s.id, ...descs]));
  }

  // Mapa de activaciones socioId_cicloId -> boolean
  const mapaActivos = new Map();
  const mapaPuntosPersonales = new Map();
  for (const a of red.activaciones) {
    mapaActivos.set(`${a.socio_id}_${a.ciclo_id}`, Boolean(a.activo));
    mapaPuntosPersonales.set(`${a.socio_id}_${a.ciclo_id}`, a.puntos_personales || 0);
  }

  // Mapa de movimientos con cuenta_rango = true por ciclo y socio
  const puntosRangoPorSocioYCiclo = new Map();
  for (const m of red.movimientoPuntos) {
    if (m.cuenta_rango) {
      const k = `${m.socio_id}_${m.ciclo_id}`;
      puntosRangoPorSocioYCiclo.set(k, (puntosRangoPorSocioYCiclo.get(k) || 0) + m.puntos);
    }
  }

  const resultadosRangoCiclo = [];
  const comisionesRango = [];
  const historialRangos = new Map(); // socio_id -> { orden, codigo } del ciclo anterior

  for (let c = 1; c <= 3; c++) {
    for (let id = 1; id <= 501; id++) {
      const activo = mapaActivos.get(`${id}_${c}`) ?? false;
      const puntosPersonales = mapaPuntosPersonales.get(`${id}_${c}`) ?? 0;

      // Frontales directos
      const frontales = frontalesPorSocio.get(id) || [];
      const frontalesActivos = frontales.filter(fId => mapaActivos.get(`${fId}_${c}`) === true).length;

      // Puntos por cada línea frontal
      const lineasFrontales = [];
      let puntosGrupalesTotal = 0;
      let puntosLineaMayor = 0;

      for (const fId of frontales) {
        const ramaSet = conjuntoDescendientes.get(fId);
        let ptsLinea = 0;
        for (const socioRamaId of ramaSet) {
          const pts = puntosRangoPorSocioYCiclo.get(`${socioRamaId}_${c}`) || 0;
          ptsLinea += pts;
        }

        lineasFrontales.push({
          frontal_socio_id: fId,
          puntos_totales: ptsLinea
        });

        puntosGrupalesTotal += ptsLinea;
        if (ptsLinea > puntosLineaMayor) {
          puntosLineaMayor = ptsLinea;
        }
      }

      const puntosSocio = {
        socio_id: id,
        ciclo_id: c,
        puntos_personales: puntosPersonales,
        puntos_grupales: puntosGrupalesTotal,
        puntos_linea_mayor: puntosLineaMayor,
        frontales_activos: frontalesActivos,
        activo,
        lineas_frontales: lineasFrontales
      };

      const rangoAnterior = historialRangos.get(id) || null;
      const resCalificacion = calificarRangoSocio(puntosSocio, rangos, rangoAnterior);

      resultadosRangoCiclo.push(resCalificacion);

      // Si califica y cobra bono (> 0), generar comisión
      if (resCalificacion.califica && resCalificacion.bono_cent > 0) {
        comisionesRango.push({
          ciclo_id: c,
          beneficiario_id: id,
          generador_id: null,
          orden_id: null,
          tipo: 'rango',
          nivel: null,
          base_cent: resCalificacion.puntos_computables * 100,
          base_puntos: resCalificacion.puntos_computables,
          porcentaje: null,
          monto_cent: resCalificacion.bono_cent,
          estado: 'confirmada',
          detalle: {
            motivo: 'calificado',
            rango_codigo: resCalificacion.rango_codigo,
            rango_nombre: resCalificacion.rango_nombre,
            rango_orden: resCalificacion.rango_orden,
            puntos_grupales: resCalificacion.puntos_grupales,
            puntos_linea_mayor: resCalificacion.puntos_linea_mayor,
            puntos_computables: resCalificacion.puntos_computables,
            frontales_activos: resCalificacion.frontales_activos,
            motivo_bono: resCalificacion.motivo_bono,
            formula: `Bono de rango ${resCalificacion.rango_codigo}: ${resCalificacion.bono_cent} cent`
          }
        });
      }

      // Actualizar historial de rango para el siguiente ciclo
      if (resCalificacion.rango_orden !== null) {
        historialRangos.set(id, {
          orden: resCalificacion.rango_orden,
          codigo: resCalificacion.rango_codigo || ''
        });
      } else {
        historialRangos.set(id, null);
      }
    }
  }

  return {
    resultadosRangoCiclo,
    comisionesRango
  };
}

export function generarSqlLotesRangoCiclo(tamanoLote = 500) {
  const { resultadosRangoCiclo } = procesarRangoYGlobalCompleto();
  const lotes = [];

  for (let i = 0; i < resultadosRangoCiclo.length; i += tamanoLote) {
    const chunk = resultadosRangoCiclo.slice(i, i + tamanoLote);

    const valores = chunk.map(r => {
      const rangoIdVal = r.rango_id === null ? 'NULL' : Number(r.rango_id);
      return `(${Number(r.socio_id)}, ${Number(r.ciclo_id)}, ${rangoIdVal}, ${Number(r.puntos_personales)}, ${Number(r.puntos_grupales)}, ${Number(r.puntos_linea_mayor)}, ${Number(r.puntos_computables)}, ${Number(r.frontales_activos)}, ${r.califica}, ${Number(r.bono_cent)}, now())`;
    }).join(',\n');

    const sql = `INSERT INTO rango_ciclo (
  socio_id, ciclo_id, rango_id, puntos_personales, puntos_grupales,
  puntos_linea_mayor, puntos_computables, frontales_activos, califica,
  bono_cent, calculado_en
) VALUES
${valores};`;

    lotes.push(sql);
  }

  return lotes;
}

export function generarSqlComisionesRango() {
  const { comisionesRango } = procesarRangoYGlobalCompleto();
  if (comisionesRango.length === 0) return '';

  const valores = comisionesRango.map(c => {
    const detalleJson = JSON.stringify(c.detalle || {}).replace(/'/g, "''");
    return `(${Number(c.ciclo_id)}, ${Number(c.beneficiario_id)}, NULL, NULL, '${c.tipo}', NULL, ${Number(c.base_cent)}, ${Number(c.base_puntos)}, NULL, ${Number(c.monto_cent)}, '${c.estado}', '${detalleJson}'::jsonb, now())`;
  }).join(',\n');

  return `INSERT INTO comision (
  ciclo_id, beneficiario_id, generador_id, orden_id, tipo, nivel,
  base_cent, base_puntos, porcentaje, monto_cent, estado, detalle, creado_en
) VALUES
${valores};`;
}

export function generarSqlPeriodoGlobal() {
  return `INSERT INTO periodo_global (
  anio, semestre, puntos_totales, pool_cent, calificados, estado, cerrado_en
) VALUES
  (2026, 1, 44406, 44406, 0, 'abierto', NULL),
  (2026, 2, 58554, 58554, 0, 'abierto', NULL);`;
}

