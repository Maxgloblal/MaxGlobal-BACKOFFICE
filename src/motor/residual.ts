/**
 * Motor de Comisiones - Bono Residual (Bloque 3)
 * Reglas:
 * 1. Aplica exclusivamente a recompras (cuenta_residual = true).
 * 2. Las órdenes/movimientos de afiliación NUNCA generan residual (cuenta_residual = false).
 * 3. Base de cálculo: puntos * 100 centavos (S/. 1.00 por punto según config.valor_punto_comision = 1.00).
 * 4. Escala de 10 niveles (40, 20, 10, 5, 3, 2, 1, 10, 5, 1 = 97.0%). El nivel 8 es 10% deliberadamente.
 * 5. Condiciones por nivel:
 *    - Condición a: ancestro.pack.niveles_residual >= nivel
 *    - Condición b: ancestro.activo === true en el ciclo
 * 6. Sin compresión: montos no calificados quedan en la empresa.
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-04A-MOTOR-PATROCINIO-Y-RESIDUAL.md
 */

import {
  OrdenEntrada,
  AncestroUpline,
  EscalaNivel,
  ConfigMotor,
  ComisionCalculada,
  ResultadoCalculo,
  NivelBloqueadoDetalle
} from './tipos';

/**
 * Calcula el bono residual para una recompra y su línea ascendente.
 */
export function calcularResidual(
  orden: OrdenEntrada,
  upline: AncestroUpline[],
  escalaResidual: EscalaNivel[],
  config: ConfigMotor = {}
): ResultadoCalculo {
  const comisiones: ComisionCalculada[] = [];
  const nivelesBloqueados: NivelBloqueadoDetalle[] = [];
  let totalPagadoCent = 0;
  let totalBloqueadoCent = 0;
  let totalTeoricoCent = 0;

  // Afiliaciones o movimientos sin bandera residual NUNCA generan residual
  if (orden.cuenta_residual === false || orden.tipo === 'afiliacion') {
    return {
      comisiones: [],
      total_pagado_cent: 0,
      total_bloqueado_empresa_cent: 0,
      total_teorico_cent: 0,
      niveles_bloqueados: []
    };
  }

  const puntos = orden.puntos_total ?? 0;
  if (puntos <= 0) {
    return {
      comisiones: [],
      total_pagado_cent: 0,
      total_bloqueado_empresa_cent: 0,
      total_teorico_cent: 0,
      niveles_bloqueados: []
    };
  }

  // Base: puntos * valor_punto_comision (por defecto S/. 1.00 = 100 centavos)
  const valorPuntoSoles = config.valor_punto_comision ?? 1.00;
  const baseCent = Math.round(puntos * valorPuntoSoles * 100);

  const nivelesAEvaluar = [...escalaResidual].sort((a, b) => a.nivel - b.nivel);

  for (const itemEscala of nivelesAEvaluar) {
    const nivel = itemEscala.nivel;
    const porcentaje = itemEscala.porcentaje;

    // Cálculo exacto en milésimas de punto porcentual
    const porcentajeMillesimas = Math.round(porcentaje * 1000);
    const montoNivelCent = Math.round((baseCent * porcentajeMillesimas) / 100000);

    totalTeoricoCent += montoNivelCent;

    // Buscar el ancestro en el nivel exacto N
    const ancestro = upline.find(u => u.nivel === nivel);

    if (!ancestro) {
      // Sin ancestro a esta profundidad: queda en la empresa
      totalBloqueadoCent += montoNivelCent;
      nivelesBloqueados.push({
        nivel,
        ancestro_id: null,
        motivo: 'sin_ancestro',
        monto_cent: montoNivelCent,
        porcentaje
      });
      continue;
    }

    // Condición a: pack del ancestro habilita el nivel N
    const nivelesHabilitados = ancestro.pack?.niveles_residual ?? 0;
    const packHabilitado = nivelesHabilitados >= nivel;

    // Condición b: ancestro activo en el ciclo
    const activo = ancestro.activo === true;

    if (packHabilitado && activo) {
      totalPagadoCent += montoNivelCent;
      comisiones.push({
        ciclo_id: orden.ciclo_id,
        beneficiario_id: ancestro.ancestro_id,
        generador_id: orden.socio_id,
        orden_id: orden.id,
        tipo: 'residual',
        nivel,
        base_cent: baseCent,
        base_puntos: puntos,
        porcentaje,
        monto_cent: montoNivelCent,
        estado: 'confirmada',
        detalle: {
          motivo: 'calificado',
          puntos_base: puntos,
          pack_ancestro_codigo: ancestro.pack?.codigo,
          niveles_habilitados: nivelesHabilitados,
          activo_en_ciclo: activo,
          porcentaje_millesimas: porcentajeMillesimas,
          formula: `${puntos} pts (${baseCent} cent) * ${porcentaje}% = ${montoNivelCent} cent`
        }
      });
    } else {
      // Bloqueado sin compresión: queda en la empresa
      totalBloqueadoCent += montoNivelCent;
      nivelesBloqueados.push({
        nivel,
        ancestro_id: ancestro.ancestro_id,
        motivo: !packHabilitado ? 'pack_insuficiente' : 'inactivo',
        monto_cent: montoNivelCent,
        porcentaje
      });
    }
  }

  return {
    comisiones,
    total_pagado_cent: totalPagadoCent,
    total_bloqueado_empresa_cent: totalBloqueadoCent,
    total_teorico_cent: totalTeoricoCent,
    niveles_bloqueados: nivelesBloqueados
  };
}
