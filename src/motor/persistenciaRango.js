/**
 * Capa de persistencia y cálculo para el Bono de Rango (TAREA-12)
 *
 * Reglas fundamentales:
 * 1. Libro de SOLO-AGREGAR (INSERT y nada más. Nunca UPDATE ni DELETE).
 * 2. Idempotencia: no se inserta si ya existen filas de rango_ciclo o comisiones de rango para ese ciclo.
 * 3. Se inserta rango_ciclo para TODOS los socios evaluados (califiquen o no).
 * 4. Las comisiones de rango se crean SOLO para aquellos con bono_cent > 0.
 * 5. linea_estirada_pct se obtiene de config (con fallback a 50).
 * 6. Rangos no definidos (definido = false) se ignoran.
 *
 * Fuente: 00-INSTRUCCIONES/TAREA-12-CONECTAR-BONO-DE-RANGO.md
 */

import { supabase } from '../lib/supabaseClient';
import { calificarRangoSocio } from './rango';

/**
 * Ejecuta el cálculo de rangos en memoria para un ciclo sin escribir en la BD (dry-run).
 * Utilizado por la vista previa de P-25.
 *
 * @param {number} cicloId
 * @param {object} sbClient
 * @returns {Promise<{ evaluados: number, califican: number, totalBonoCent: number, comisiones: Array, rangosCiclo: Array }>}
 */
export async function calcularRangosEnMemoria(cicloId, sbClient = supabase) {
  const cId = Number(cicloId);

  // 1. Obtener porcentaje de línea estirada desde config
  let lineaEstiradaPct = 50;
  try {
    const { data: confLinea, error: errConfLinea } = await sbClient
      .from('config')
      .select('valor')
      .eq('clave', 'linea_estirada_pct')
      .maybeSingle();

    if (errConfLinea) throw errConfLinea;

    if (confLinea && !isNaN(Number(confLinea.valor))) {
      lineaEstiradaPct = Number(confLinea.valor);
    }
  } catch (err) {
    console.warn('[PersistenciaRango] No se pudo leer linea_estirada_pct de config, usando 50% por defecto:', err);
  }

  // 2. Obtener escala de rangos oficiales activos
  const { data: rangosRaw, error: errRangos } = await sbClient
    .from('rango')
    .select('id, orden, codigo, nombre, puntos_grupales, frontales_activos, bono_cent, definido, activo')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (errRangos) throw errRangos;
  const rangosDisponibles = (rangosRaw || []).filter(r => r.definido === true);

  // 3. Obtener socios del padrón y activaciones del ciclo
  const [
    { data: socios, error: errSocios },
    { data: activaciones, error: errAct }
  ] = await Promise.all([
    sbClient.from('socio').select('id, codigo, nombres, apellidos, estado').order('id', { ascending: true }),
    sbClient.from('activacion').select('socio_id, activo, puntos_personales').eq('ciclo_id', cId)
  ]);

  if (errSocios) throw errSocios;
  if (errAct) throw errAct;

  const mapaActivos = new Map(
    (activaciones || []).map(a => [
      Number(a.socio_id),
      {
        activo: Boolean(a.activo || (a.puntos_personales >= 70)),
        puntos_personales: Number(a.puntos_personales || 0)
      }
    ])
  );

  const sociosLista = socios || [];
  const filasRangoCiclo = [];
  const filasComision = [];

  // 4. Evaluar socios en lotes concurrentes para máxima eficiencia
  const BATCH_SIZE = 25;
  for (let i = 0; i < sociosLista.length; i += BATCH_SIZE) {
    const chunk = sociosLista.slice(i, i + BATCH_SIZE);

    const resultadosChunk = await Promise.all(
      chunk.map(async (socio) => {
        const sId = Number(socio.id);
        const { data: rpcRes, error: errRpc } = await sbClient.rpc('fn_rango_lineas_socio', {
          p_socio_id: sId,
          p_ciclo_id: cId
        });

        if (errRpc) {
          throw new Error(`Error en fn_rango_lineas_socio para socio ${sId} en ciclo ${cId}: ${errRpc.message}`);
        }

        const lineas = rpcRes?.lineas || [];
        const lineas_frontales = lineas.map(l => ({
          frontal_socio_id: Number(l.frontal_id),
          puntos_totales: Number(l.puntos_totales_rama || 0)
        }));

        const puntos_grupales = lineas.reduce((sum, l) => sum + Number(l.puntos_totales_rama || 0), 0);
        const puntos_linea_mayor = lineas.length > 0
          ? Math.max(...lineas.map(l => Number(l.puntos_totales_rama || 0)))
          : 0;
        const frontales_activos = lineas.filter(l => Boolean(l.activo)).length;

        const actInfo = mapaActivos.get(sId) || { activo: false, puntos_personales: 0 };
        const activo = Boolean(actInfo.activo);
        const puntos_personales = Number(actInfo.puntos_personales || 0);

        // Extraer rango anterior
        const prev = rpcRes?.rango_ciclo_anterior;
        let rangoAnterior = null;
        if (prev && prev.rango_orden !== null && prev.rango_orden !== undefined && prev.rango_id !== null) {
          rangoAnterior = {
            orden: Number(prev.rango_orden),
            codigo: prev.rango_codigo
          };
        }

        // Evaluar con el motor oficial
        const resultado = calificarRangoSocio(
          {
            socio_id: sId,
            ciclo_id: cId,
            puntos_personales,
            puntos_grupales,
            lineas_frontales,
            puntos_linea_mayor,
            frontales_activos,
            activo
          },
          rangosDisponibles,
          rangoAnterior,
          lineaEstiradaPct
        );

        return {
          socio,
          resultado
        };
      })
    );

    for (const item of resultadosChunk) {
      const res = item.resultado;
      const sId = Number(item.socio.id);

      filasRangoCiclo.push({
        socio_id: sId,
        ciclo_id: cId,
        rango_id: res.rango_id,
        puntos_personales: res.puntos_personales,
        puntos_grupales: res.puntos_grupales,
        puntos_linea_mayor: res.puntos_linea_mayor,
        puntos_computables: res.puntos_computables,
        frontales_activos: res.frontales_activos,
        califica: res.califica,
        bono_cent: res.bono_cent,
        calculado_en: new Date().toISOString()
      });

      if (res.bono_cent > 0) {
        filasComision.push({
          ciclo_id: cId,
          beneficiario_id: sId,
          generador_id: null,
          orden_id: null,
          tipo: 'rango',
          nivel: null,
          base_cent: (res.puntos_computables || 0) * 100,
          base_puntos: res.puntos_computables || 0,
          porcentaje: null,
          monto_cent: Number(res.bono_cent),
          estado: 'confirmada',
          detalle: {
            motivo: 'calificado',
            rango_codigo: res.rango_codigo,
            rango_nombre: res.rango_nombre,
            rango_orden: res.rango_orden,
            puntos_grupales: res.puntos_grupales,
            puntos_linea_mayor: res.puntos_linea_mayor,
            puntos_computables: res.puntos_computables,
            frontales_activos: res.frontales_activos,
            motivo_bono: res.motivo_bono,
            formula: `Bono de rango ${res.rango_codigo}: ${res.bono_cent} cent`,
            ...res.detalle
          },
          creado_en: new Date().toISOString()
        });
      }
    }
  }

  const totalBonoCent = filasComision.reduce((sum, c) => sum + c.monto_cent, 0);

  return {
    evaluados: filasRangoCiclo.length,
    califican: filasRangoCiclo.filter(r => r.califica).length,
    totalBonoCent,
    comisiones: filasComision,
    rangosCiclo: filasRangoCiclo
  };
}

/**
 * Calcula y persiste en Postgres las filas de rango_ciclo y comisiones de rango para un ciclo.
 * 🔴 DEBE EJECUTARSE ESTRICTAMENTE ANTES DE fn_ejecutar_cierre_ciclo.
 *
 * @param {number} cicloId
 * @param {object} sbClient
 * @returns {Promise<{ evaluados: number, califican: number, totalBonoCent: number, comisionesCreadas: number, yaExistia?: boolean }>}
 */
export async function calcularYPersistirRangosDelCiclo(cicloId, sbClient = supabase) {
  const cId = Number(cicloId);
  if (!cId || isNaN(cId)) {
    throw new Error(`[PersistenciaRango] cicloId inválido: ${cicloId}`);
  }

  // 1. Validar IDEMPOTENCIA: si ya existen filas de rango_ciclo o comisiones tipo 'rango', no duplicar
  const [
    { count: countRangoCiclo, error: errCountRC },
    { count: countComisiones, data: comisionesExistentes, error: errCountCom }
  ] = await Promise.all([
    sbClient.from('rango_ciclo').select('*', { count: 'exact', head: true }).eq('ciclo_id', cId),
    sbClient.from('comision').select('monto_cent', { count: 'exact' }).eq('ciclo_id', cId).eq('tipo', 'rango')
  ]);

  if (errCountRC) throw errCountRC;
  if (errCountCom) throw errCountCom;

  if ((countRangoCiclo && countRangoCiclo > 0) || (countComisiones && countComisiones > 0)) {
    const totalExistenteCent = (comisionesExistentes || []).reduce((sum, c) => sum + Number(c.monto_cent || 0), 0);

    const { count: countCalifican } = await sbClient
      .from('rango_ciclo')
      .select('*', { count: 'exact', head: true })
      .eq('ciclo_id', cId)
      .eq('califica', true);

    return {
      yaExistia: true,
      evaluados: countRangoCiclo || 0,
      califican: countCalifican || countComisiones || 0,
      totalBonoCent: totalExistenteCent,
      comisionesCreadas: countComisiones || 0,
      mensaje: `Idempotencia: El ciclo ${cId} ya cuenta con registros de rango previamente calculados.`
    };
  }

  // 2. Calcular en memoria
  const calculo = await calcularRangosEnMemoria(cId, sbClient);

  // 3. Persistir en rango_ciclo por lotes de 500
  const LOTE_INSERT = 500;
  for (let i = 0; i < calculo.rangosCiclo.length; i += LOTE_INSERT) {
    const chunk = calculo.rangosCiclo.slice(i, i + LOTE_INSERT);
    const { error: errInsertRC } = await sbClient.from('rango_ciclo').insert(chunk);
    if (errInsertRC) {
      throw new Error(`[PersistenciaRango] Error al insertar en rango_ciclo: ${errInsertRC.message}`);
    }
  }

  // 4. Persistir en comision (solo los calificados con bono > 0)
  if (calculo.comisiones.length > 0) {
    for (let i = 0; i < calculo.comisiones.length; i += LOTE_INSERT) {
      const chunk = calculo.comisiones.slice(i, i + LOTE_INSERT);
      const { error: errInsertCom } = await sbClient.from('comision').insert(chunk);
      if (errInsertCom) {
        throw new Error(`[PersistenciaRango] Error al insertar comisiones de rango: ${errInsertCom.message}`);
      }
    }
  }

  return {
    yaExistia: false,
    evaluados: calculo.evaluados,
    califican: calculo.califican,
    totalBonoCent: calculo.totalBonoCent,
    comisionesCreadas: calculo.comisiones.length
  };
}
