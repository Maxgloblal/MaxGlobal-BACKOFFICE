﻿import { supabase } from '../lib/supabaseClient';
import { procesarComisionesDeUnaOrden } from '../motor/persistencia';

/**
 * Carga todos los pedidos pendientes de confirmación ordenados por antigüedad (RF-340).
 */
export async function cargarBandejaConfirmacion() {
  const { data: ordenes, error: errOrdenes } = await supabase
    .from('orden')
    .select(`
      id,
      codigo,
      socio_id,
      ciclo_id,
      tipo,
      pack_id,
      subtotal_cent,
      descuento_cent,
      total_cent,
      puntos_total,
      estado,
      creada_en,
      socio:socio_id (
        id,
        codigo,
        nombres,
        apellidos,
        documento,
        email,
        estado,
        pack_id,
        pack:pack_id (
          id,
          nombre,
          codigo
        )
      ),
      voucher (
        id,
        imagen_url,
        banco,
        numero_operacion,
        monto_cent,
        fecha_deposito,
        estado,
        motivo_rechazo,
        subido_en
      )
    `)
    .eq('estado', 'por_confirmar')
    .order('creada_en', { ascending: true });

  if (errOrdenes) throw errOrdenes;
  return ordenes || [];
}

/**
 * Calcula en seco (dry-run) el impacto que tendrá confirmar la orden en el motor (RF-344, RF-345).
 */
export async function calcularImpactoOrden(orden) {
  if (!orden) return null;

  const socioId = Number(orden.socio_id);
  const cicloId = Number(orden.ciclo_id || 1);

  // 1. Obtener ancestros en la red
  const { data: ancestros, error: errAncestros } = await supabase
    .from('red_ancestro')
    .select(`
      ancestro_id,
      nivel,
      ancestro:ancestro_id (
        id,
        nombres,
        apellidos,
        codigo,
        pack_id,
        pack:pack_id (
          id,
          codigo,
          niveles_patrocinio,
          niveles_residual
        )
      )
    `)
    .eq('descendiente_id', socioId)
    .order('nivel', { ascending: true });

  if (errAncestros) throw errAncestros;

  // 2. Obtener activaciones del ciclo para el upline
  const ancestroIds = (ancestros || []).map(a => a.ancestro_id);
  let mapaActivos = new Map();

  if (ancestroIds.length > 0) {
    const { data: activaciones, error: errAct } = await supabase
      .from('activacion')
      .select('socio_id, activo')
      .eq('ciclo_id', cicloId)
      .in('socio_id', ancestroIds);

    if (!errAct && activaciones) {
      mapaActivos = new Map(activaciones.map(a => [Number(a.socio_id), Boolean(a.activo)]));
    }
  }

  // 3. Obtener escalas y configuraciones
  const [
    { data: escalaPatrocinio },
    { data: escalaResidual },
    { data: packComisionEspecial },
    { data: packs }
  ] = await Promise.all([
    supabase.from('nivel_comision').select('nivel, porcentaje').eq('tipo', 'patrocinio').order('nivel'),
    supabase.from('nivel_comision').select('nivel, porcentaje').eq('tipo', 'residual').order('nivel'),
    supabase.from('pack_comision_especial').select('pack_codigo, nivel, porcentaje'),
    supabase.from('pack').select('id, codigo, niveles_patrocinio, niveles_residual')
  ]);

  const mapaPacksPorId = new Map((packs || []).map(p => [Number(p.id), p]));

  // Construir upline
  const upline = (ancestros || []).map(r => {
    const ancId = Number(r.ancestro_id);
    const packObj = r.ancestro?.pack || mapaPacksPorId.get(Number(r.ancestro?.pack_id));
    const activo = mapaActivos.get(ancId) ?? false;

    return {
      ancestro_id: ancId,
      nivel: Number(r.nivel),
      activo,
      pack: {
        id: packObj?.id ?? 0,
        codigo: packObj?.codigo ?? '',
        niveles_patrocinio: Number(packObj?.niveles_patrocinio ?? 0),
        niveles_residual: Number(packObj?.niveles_residual ?? 0)
      }
    };
  });

  const packCodigo = orden.socio?.pack?.codigo || null;

  const resultado = procesarComisionesDeUnaOrden({
    orden: {
      id: orden.id,
      socio_id: socioId,
      ciclo_id: cicloId,
      tipo: orden.tipo,
      total_cent: Number(orden.total_cent || 0),
      puntos_total: Number(orden.puntos_total || 0),
      pack_id: orden.pack_id,
      pack_codigo: packCodigo,
      cuenta_residual: true
    },
    upline,
    escalaPatrocinio: escalaPatrocinio || [],
    escalaResidual: escalaResidual || [],
    packComisionEspecial: packComisionEspecial || [],
    config: {}
  });

  return {
    ...resultado,
    socioNombre: orden.socio ? `${orden.socio.nombres} ${orden.socio.apellidos}` : 'Socio',
    socioCodigo: orden.socio?.codigo || '',
    socioEstadoActual: orden.socio?.estado || 'pendiente',
    puntosAcreditar: Number(orden.puntos_total || 0)
  };
}

/**
 * Ejecuta la confirmación del pago de forma atómica en la base de datos (RF-347, RF-348, RF-349).
 */
export async function confirmarPagoOrden(ordenId, comisiones = []) {
  const { data, error } = await supabase.rpc('fn_confirmar_orden_pago', {
    p_orden_id: Number(ordenId),
    p_comisiones: comisiones
  });

  if (error) throw error;
  return data;
}

/**
 * Ejecuta el rechazo del pago registrando el motivo obligatorio (RF-350).
 */
export async function rechazarPagoOrden(ordenId, motivo) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de rechazo es obligatorio para auditar la operación.');
  }

  const { data, error } = await supabase.rpc('fn_rechazar_orden_pago', {
    p_orden_id: Number(ordenId),
    p_motivo: motivo.trim()
  });

  if (error) throw error;
  return data;
}
