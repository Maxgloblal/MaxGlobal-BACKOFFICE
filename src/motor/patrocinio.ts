/**
 * Motor de Comisiones - Bono de Patrocinio
 * Reglas:
 * 1. Aplica exclusivamente a órdenes de afiliación (orden.total_cent).
 * 2. Si el pack comprado tiene fila en pack_comision_especial, se usa esa escala y se anula la estándar.
 * 3. En la escala estándar (7 niveles: 20/4/3/2/1/0.5/0.3 = 30.8%):
 *    - Condición a: ancestro.pack.niveles_patrocinio >= nivel
 *    - Condición b: ancestro.activo === true en el ciclo
 * 4. Sin compresión: montos no calificados quedan en la empresa.
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-04A-MOTOR-PATROCINIO-Y-RESIDUAL.md
 */

import {
  OrdenEntrada,
  AncestroUpline,
  EscalaNivel,
  PackComisionEspecial,
  ConfigMotor,
  ComisionCalculada,
  ResultadoCalculo,
  NivelBloqueadoDetalle
} from './tipos';

/**
 * Calcula el bono de patrocinio para una orden de afiliación dada.
 */
export function calcularPatrocinio(
  orden: OrdenEntrada,
  upline: AncestroUpline[],
  escalaEstandar: EscalaNivel[],
  especiales: PackComisionEspecial[],
  config: ConfigMotor = {}
): ResultadoCalculo {
  const comisiones: ComisionCalculada[] = [];
  const nivelesBloqueados: NivelBloqueadoDetalle[] = [];
  let totalPagadoCent = 0;
  let totalBloqueadoCent = 0;
  let totalTeoricoCent = 0;

  // Solo órdenes de afiliación generan bono de patrocinio
  if (orden.tipo !== 'afiliacion' || !orden.total_cent || orden.total_cent <= 0) {
    return {
      comisiones: [],
      total_pagado_cent: 0,
      total_bloqueado_empresa_cent: 0,
      total_teorico_cent: 0,
      niveles_bloqueados: []
    };
  }

  const baseCent = orden.total_cent;

  // Verificar si el pack comprado tiene regla especial (Ej: Kit Emprendedor)
  const reglasEspeciales = especiales.filter(e => {
    if (orden.pack_id && e.pack_id && e.pack_id === orden.pack_id) return true;
    if (orden.pack_codigo && e.pack_codigo && e.pack_codigo.toUpperCase() === orden.pack_codigo.toUpperCase()) return true;
    return false;
  });

  const usarEspecial = reglasEspeciales.length > 0;
  const nivelesAEvaluar: EscalaNivel[] = usarEspecial
    ? reglasEspeciales.map(r => ({ nivel: r.nivel, porcentaje: r.porcentaje }))
    : [...escalaEstandar].sort((a, b) => a.nivel - b.nivel);

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
    const nivelesHabilitados = ancestro.pack?.niveles_patrocinio ?? 0;
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
        tipo: 'patrocinio',
        nivel,
        base_cent: baseCent,
        base_puntos: null,
        porcentaje,
        monto_cent: montoNivelCent,
        estado: 'confirmada',
        detalle: {
          motivo: 'calificado',
          pack_comprado_id: orden.pack_id,
          pack_ancestro_codigo: ancestro.pack?.codigo,
          niveles_habilitados: nivelesHabilitados,
          activo_en_ciclo: activo,
          escala_usada: usarEspecial ? 'especial' : 'estandar',
          porcentaje_millesimas: porcentajeMillesimas,
          formula: `${baseCent} cent * ${porcentaje}% = ${montoNivelCent} cent`
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
