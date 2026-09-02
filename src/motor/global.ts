/**
 * Motor de Comisiones - Bono Global (TAREA-04B)
 *
 * Reglas fundamentales:
 * 1. Qué se reparte: 1% de los puntos totales acumulados por toda la compañía en el semestre.
 * 2. Conversión: S/. 1.00 por punto (100 céntimos).
 * 3. Cortes: Semestre 1 (Ene–Jun) y Semestre 2 (Jul–Dic).
 * 4. Reparto: Proporcional al puntaje acumulado de los calificados.
 * 5. Requisito de actividad: Activo en los 6 meses completos del semestre (un solo mes inactivo deja fuera).
 * 6. Packs habilitados: Gold, Familiar, Empresarial (pack.aplica_bono_global = true).
 * 7. Invariante: La suma de lo repartido NUNCA supera el pool.
 * 8. Los céntimos sobrantes del redondeo quedan en la empresa y se registran en periodo_global.
 * 9. Semestres incompletos: Si faltan ciclos para completar los 6 meses, el periodo queda en estado 'abierto'
 *    y NO se reparte dinero (se reporta el pool acumulado).
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-04B-MOTOR-RANGO-Y-GLOBAL.md
 */

import {
  SocioGlobalPuntos,
  SocioGlobalResultado,
  ResultadoBonoGlobal
} from './tipos';

export interface ConfigBonoGlobal {
  bono_global_pct?: number; // por defecto 1%
  bono_global_meses_activo?: number; // por defecto 6
  bono_global_conversion?: number; // por defecto 1.00
}

/**
 * Evalúa y calcula el Bono Global para un semestre específico.
 *
 * @param anio Año del periodo (ej. 2026)
 * @param semestre Número de semestre (1 o 2)
 * @param mesesDisponibles Cantidad de meses/ciclos con datos registrados para este semestre
 * @param sociosPuntos Lista de socios con su historial de actividad y puntos en el semestre
 * @param puntosTotalesCompania Suma total de puntos generados por toda la empresa en el semestre
 * @param config Parámetros del plan de negocio
 */
export function calcularBonoGlobal(
  anio: number,
  semestre: number,
  mesesDisponibles: number,
  sociosPuntos: SocioGlobalPuntos[],
  puntosTotalesCompania: number,
  config: ConfigBonoGlobal = {}
): ResultadoBonoGlobal {
  const pct = config.bono_global_pct ?? 1;
  const mesesRequeridos = config.bono_global_meses_activo ?? 6;
  const conversion = config.bono_global_conversion ?? 1.00;

  // Pool total en céntimos: puntos_totales * 100 * (pct / 100) * conversion
  const basePuntos = Math.max(0, puntosTotalesCompania || 0);
  const poolCent = Math.round(basePuntos * 100 * (pct / 100) * conversion);

  // Si el semestre está incompleto (faltan meses para llegar a 6), el periodo queda abierto y NO reparte
  if (mesesDisponibles < mesesRequeridos) {
    const sociosResultados: SocioGlobalResultado[] = sociosPuntos.map(s => ({
      socio_id: s.socio_id,
      aplica_pack: s.aplica_pack,
      meses_activo: s.meses_activo,
      puntos_acumulados: s.puntos_acumulados,
      califica: false,
      monto_cent: 0
    }));

    return {
      anio,
      semestre,
      puntos_totales: basePuntos,
      pool_cent: poolCent,
      calificados_count: 0,
      socios: sociosResultados,
      total_repartido_cent: 0,
      sobrante_empresa_cent: poolCent,
      estado: 'abierto'
    };
  }

  // Semestre completo (6 meses disponibles): Evaluar socios calificados
  const sociosEvaluados = sociosPuntos.map(s => {
    const cumplePack = s.aplica_pack === true;
    const cumpleMeses = s.meses_activo >= mesesRequeridos;
    const tienePuntos = s.puntos_acumulados > 0;
    const califica = cumplePack && cumpleMeses && tienePuntos;

    return {
      socio_id: s.socio_id,
      aplica_pack: s.aplica_pack,
      meses_activo: s.meses_activo,
      puntos_acumulados: s.puntos_acumulados,
      califica,
      monto_cent: 0
    };
  });

  const calificados = sociosEvaluados.filter(s => s.califica);
  const calificadosCount = calificados.length;

  if (calificadosCount === 0 || poolCent <= 0) {
    return {
      anio,
      semestre,
      puntos_totales: basePuntos,
      pool_cent: poolCent,
      calificados_count: 0,
      socios: sociosEvaluados,
      total_repartido_cent: 0,
      sobrante_empresa_cent: poolCent,
      estado: 'cerrado'
    };
  }

  // Suma de puntos de todos los socios calificados para el reparto proporcional
  const puntosTotalesCalificados = calificados.reduce(
    (sum, s) => sum + s.puntos_acumulados,
    0
  );

  let totalRepartidoCent = 0;

  for (const socio of sociosEvaluados) {
    if (socio.califica && puntosTotalesCalificados > 0) {
      // Reparto estrictamente proporcional con redondeo truncado para garantizar que nunca supere el pool
      const monto = Math.floor(
        (poolCent * socio.puntos_acumulados) / puntosTotalesCalificados
      );
      socio.monto_cent = monto;
      totalRepartidoCent += monto;
    }
  }

  // El sobrante exacto por redondeo queda en la empresa
  const sobranteEmpresaCent = Math.max(0, poolCent - totalRepartidoCent);

  return {
    anio,
    semestre,
    puntos_totales: basePuntos,
    pool_cent: poolCent,
    calificados_count: calificadosCount,
    socios: sociosEvaluados,
    total_repartido_cent: totalRepartidoCent,
    sobrante_empresa_cent: sobranteEmpresaCent,
    estado: 'cerrado'
  };
}
