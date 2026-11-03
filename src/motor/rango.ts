/**
 * Motor de Comisiones - Calificación de Rango y Bono de Rango (TAREA-04B & TAREA-68)
 *
 * Reglas fundamentales:
 * 1. Los puntos grupales NO incluyen los puntos personales (contadores separados).
 * 2. PARCHE JADE (TAREA-68): Para el rango JADE (orden 1 o 500 pts exigidos con 1 frontal activo),
 *    NO aplica recorte del 50% de línea estirada (la rama única puede aportar hasta el 100% = 500 pts).
 * 3. A partir de BRONCE (orden >= 2) en adelante, la línea estirada topea al 50% de los puntos
 *    DEL RANGO que se evalúa (no del total del socio).
 * 4. Cada rango se evalúa con su propio tope (recalculando el computable de mayor a menor).
 * 5. Tres condiciones simultáneas:
 *    (a) puntos_computables >= rango.puntos_grupales
 *    (b) frontales_activos >= rango.frontales_activos
 *    (c) socio activo en el ciclo
 * 6. Rangos con definido = false se ignoran y no califican a nadie.
 * 7. Si un socio baja de rango cobra CERO (no el bono del rango menor).
 * 8. El bono no es apilable (solo se cobra el bono del rango alcanzado).
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-04B-MOTOR-RANGO-Y-GLOBAL.md & TAREA-68
 */

import {
  RangoDefinicion,
  LineaFrontal,
  PuntosSocioCiclo,
  ResultadoCalificacionRango
} from './tipos';

/**
 * Calcula los puntos computables de una red aplicando el recorte de la línea estirada
 * según los puntos exigidos por el rango específico que se está evaluando.
 *
 * @param lineasFrontales Arreglo de líneas frontales con sus respectivos puntos totales
 * @param puntosRango Puntos grupales que exige el rango evaluado
 * @param lineaEstiradaPct Porcentaje máximo permitido por línea (por defecto 50%)
 * @param ordenRango Orden jerárquico del rango evaluado (1 = Jade, 2 = Bronce...)
 */
export function calcularPuntosComputables(
  lineasFrontales: LineaFrontal[],
  puntosRango: number,
  lineaEstiradaPct: number = 50,
  ordenRango?: number
): number {
  if (!lineasFrontales || lineasFrontales.length === 0 || puntosRango <= 0) {
    return 0;
  }

  // PARCHE JADE: Jade (orden 1 o 500 pts exigidos) exige solo 1 frontal activo.
  // Por tanto, la rama única puede aportar hasta el 100% de los puntos requeridos por Jade (500 pts).
  // A partir de Bronce (orden >= 2) rige el 50% de línea estirada.
  const esJade = ordenRango === 1 || (ordenRango === undefined && puntosRango === 500);
  const topePorLinea = esJade ? puntosRango : Math.floor((puntosRango * lineaEstiradaPct) / 100);

  let totalComputable = 0;
  for (const linea of lineasFrontales) {
    const pts = Math.max(0, linea.puntos_totales || 0);
    totalComputable += Math.min(pts, topePorLinea);
  }

  return totalComputable;
}

/**
 * Califica el rango de un socio para un ciclo específico.
 *
 * @param puntosSocio Datos consolidados de puntos y frontales del socio en el ciclo
 * @param rangosDisponibles Lista de rangos del sistema (se filtran definido=true y activo=true)
 * @param rangoAnterior Rango alcanzado en el ciclo inmediatamente anterior (o null si es primer ciclo)
 * @param lineaEstiradaPct Porcentaje de línea estirada (por defecto 50)
 */
export function calificarRangoSocio(
  puntosSocio: PuntosSocioCiclo,
  rangosDisponibles: RangoDefinicion[],
  rangoAnterior: { orden: number; codigo?: string } | null = null,
  lineaEstiradaPct: number = 50
): ResultadoCalificacionRango {
  const {
    socio_id,
    ciclo_id,
    puntos_personales,
    puntos_grupales,
    puntos_linea_mayor,
    frontales_activos,
    activo,
    lineas_frontales
  } = puntosSocio;

  // Filtrar solo rangos definidos y activos, ordenados de mayor a menor jerarquía
  const rangosValidos = rangosDisponibles
    .filter(r => r.definido === true && r.activo === true && r.puntos_grupales !== null && r.frontales_activos !== null)
    .sort((a, b) => b.orden - a.orden);

  // Rango menor para cálculo de referencia si no califica a nada
  const rangoMenor = rangosValidos.length > 0 ? rangosValidos[rangosValidos.length - 1] : null;

  // Caso: Socio inactivo en el ciclo -> NO califica a ningún rango ni cobra bono
  if (!activo) {
    const computableRef = rangoMenor
      ? calcularPuntosComputables(lineas_frontales, rangoMenor.puntos_grupales!, lineaEstiradaPct, rangoMenor.orden)
      : 0;

    return {
      socio_id,
      ciclo_id,
      rango_id: null,
      rango_codigo: null,
      rango_nombre: null,
      rango_orden: null,
      puntos_personales,
      puntos_grupales,
      puntos_linea_mayor,
      puntos_computables: computableRef,
      frontales_activos,
      califica: false,
      bono_cent: 0,
      motivo_bono: 'inactivo',
      detalle: {
        motivo: 'Socio inactivo en el ciclo (puntos personales insuficientes y sin activación)',
        activo: false
      }
    };
  }

  // Evaluar rangos de mayor a menor jerarquía
  let rangoCalificado: RangoDefinicion | null = null;
  let puntosComputablesCalificado = 0;

  for (const r of rangosValidos) {
    const ptsExigidos = r.puntos_grupales!;
    const frontalesExigidos = r.frontales_activos!;

    const computablesParaEsteRango = calcularPuntosComputables(
      lineas_frontales,
      ptsExigidos,
      lineaEstiradaPct,
      r.orden
    );

    const cumplePuntos = computablesParaEsteRango >= ptsExigidos;
    const cumpleFrontales = frontales_activos >= frontalesExigidos;

    if (cumplePuntos && cumpleFrontales) {
      rangoCalificado = r;
      puntosComputablesCalificado = computablesParaEsteRango;
      break; // Encontró el rango más alto al que califica
    }
  }

  // Si no califica a ningún rango
  if (!rangoCalificado) {
    const computableRef = rangoMenor
      ? calcularPuntosComputables(lineas_frontales, rangoMenor.puntos_grupales!, lineaEstiradaPct, rangoMenor.orden)
      : Math.min(puntos_grupales, puntos_linea_mayor);

    return {
      socio_id,
      ciclo_id,
      rango_id: null,
      rango_codigo: null,
      rango_nombre: null,
      rango_orden: null,
      puntos_personales,
      puntos_grupales,
      puntos_linea_mayor,
      puntos_computables: computableRef,
      frontales_activos,
      califica: false,
      bono_cent: 0,
      motivo_bono: 'no_califica',
      detalle: {
        motivo: 'No alcanza los puntos computables o frontales activos requeridos para el rango base'
      }
    };
  }

  // El socio califica métricamente a rangoCalificado. Ahora evaluar el bono según su historial:
  const bonoBase = rangoCalificado.bono_cent || 0;
  let bonoFinal = 0;
  let motivoBono: 'mantiene' | 'asciende' | 'baja' | 'primer_ciclo' = 'primer_ciclo';

  if (!rangoAnterior || rangoAnterior.orden === null || rangoAnterior.orden === undefined) {
    // Primer ciclo del socio o sin rango previo: cobra el bono completo
    bonoFinal = bonoBase;
    motivoBono = 'primer_ciclo';
  } else if (rangoCalificado.orden < rangoAnterior.orden) {
    // BAJA DE RANGO: Cobra CERO por regla de negocio y no califica para cobro de bono
    bonoFinal = 0;
    motivoBono = 'baja';
  } else if (rangoCalificado.orden === rangoAnterior.orden) {
    // MANTIENE RANGO: Cobra el bono de su rango
    bonoFinal = bonoBase;
    motivoBono = 'mantiene';
  } else {
    // ASCIENDE DE RANGO: Cobra el bono del nuevo rango
    bonoFinal = bonoBase;
    motivoBono = 'asciende';
  }

  const calificaCobro = motivoBono !== 'baja';

  return {
    socio_id,
    ciclo_id,
    rango_id: rangoCalificado.id,
    rango_codigo: rangoCalificado.codigo,
    rango_nombre: rangoCalificado.nombre,
    rango_orden: rangoCalificado.orden,
    puntos_personales,
    puntos_grupales,
    puntos_linea_mayor,
    puntos_computables: puntosComputablesCalificado,
    frontales_activos,
    califica: calificaCobro,
    bono_cent: bonoFinal,
    motivo_bono: motivoBono,
    detalle: {
      rango_codigo: rangoCalificado.codigo,
      rango_nombre: rangoCalificado.nombre,
      puntos_requeridos: rangoCalificado.puntos_grupales,
      frontales_requeridos: rangoCalificado.frontales_activos,
      bono_nominal_cent: bonoBase,
      rango_anterior_orden: rangoAnterior?.orden ?? null,
      motivo_pago: motivoBono === 'baja'
        ? 'Baja de rango respecto al ciclo anterior: bono = 0'
        : `Calificación válida (${motivoBono}): bono = ${bonoFinal} cent`
    }
  };
}
