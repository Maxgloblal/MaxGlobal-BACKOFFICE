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

/**
 * Busca socios por código, nombre, apellido o documento (RF-310).
 */
export async function buscarSocios(termino) {
  if (!termino || !termino.trim()) return [];
  const t = termino.trim();

  const { data, error } = await supabase
    .from('socio')
    .select(`
      id,
      codigo,
      nombres,
      apellidos,
      documento,
      email,
      telefono,
      estado,
      pack_id,
      patrocinador_id,
      pack:pack_id (
        id,
        nombre,
        codigo,
        descuento_recompra_pct
      ),
      patrocinador:patrocinador_id (
        id,
        codigo,
        nombres,
        apellidos
      )
    `)
    .or(`codigo.ilike.%${t}%,nombres.ilike.%${t}%,apellidos.ilike.%${t}%,documento.ilike.%${t}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}

/**
 * Carga la lista de productos activos para la venta (RF-313).
 */
export async function cargarProductos() {
  const { data, error } = await supabase
    .from('producto')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Registra un nuevo pedido de recompra en estado 'por_confirmar' (RF-319, RF-320).
 */
export async function registrarPedidoRecompra({ socioId, items, voucher, envio, canal = 'oficina' }) {
  const { data, error } = await supabase.rpc('fn_registrar_pedido_recompra', {
    p_socio_id: Number(socioId),
    p_items: items,
    p_voucher: voucher,
    p_envio: envio || null,
    p_canal: canal
  });

  if (error) throw error;
  return data;
}

/**
 * Carga todos los packs oficiales activos.
 */
export async function cargarPacks() {
  const { data, error } = await supabase
    .from('pack')
    .select('*')
    .eq('activo', true)
    .order('precio_cent', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Registra una nueva afiliaci?n de socio con su usuario en auth.users (RF-330 a RF-335).
 */
export async function registrarAfiliacionSocio({
  patrocinadorId,
  packId,
  tipoDocumento = 'DNI',
  documento,
  nombres,
  apellidos,
  email,
  telefono,
  fechaNacimiento,
  direccion,
  departamento,
  provincia,
  distrito,
  voucher,
  canal = 'oficina'
}) {
  const { data, error } = await supabase.rpc('fn_registrar_afiliacion_socio', {
    p_patrocinador_id: Number(patrocinadorId),
    p_pack_id: Number(packId),
    p_tipo_documento: tipoDocumento,
    p_documento: documento.trim(),
    p_nombres: nombres.trim(),
    p_apellidos: apellidos.trim(),
    p_email: email.trim().toLowerCase(),
    p_telefono: telefono ? telefono.trim() : null,
    p_fecha_nacimiento: fechaNacimiento || null,
    p_direccion: direccion ? direccion.trim() : null,
    p_departamento: departamento ? departamento.trim() : null,
    p_provincia: provincia ? provincia.trim() : null,
    p_distrito: distrito ? distrito.trim() : null,
    p_voucher: voucher,
    p_canal: canal
  });

  if (error) throw error;
  return data;
}

/**
 * Carga todos los envíos registrados con el detalle de la orden y el socio (RF-360).
 */
export async function cargarEnvios() {
  const { data, error } = await supabase
    .from('envio')
    .select(
      'id, orden_id, destinatario, telefono, departamento, provincia, distrito, direccion, referencia, agencia, costo_cent, numero_guia, estado, fecha_despacho, fecha_entrega, creado_en, orden:orden_id (id, codigo, tipo, total_cent, puntos_total, estado, socio:socio_id (id, codigo, nombres, apellidos, telefono, documento))'
    )
    .order('creado_en', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Marca un envío como despachado capturando agencia y número de guía (RF-361, RF-362).
 */
export async function marcarEnvioDespachado(envioId, { agencia, numeroGuia }) {
  const { data, error } = await supabase
    .from('envio')
    .update({
      estado: 'despachado',
      agencia: agencia ? agencia.trim() : 'Shalom',
      numero_guia: numeroGuia ? numeroGuia.trim() : null,
      fecha_despacho: new Date().toISOString()
    })
    .eq('id', Number(envioId))
    .select();

  if (error) throw error;
  return data;
}

/**
 * Marca un envío como entregado (RF-363).
 */
export async function marcarEnvioEntregado(envioId) {
  const { data, error } = await supabase
    .from('envio')
    .update({
      estado: 'entregado',
      fecha_entrega: new Date().toISOString()
    })
    .eq('id', Number(envioId))
    .select();

  if (error) throw error;
  return data;
}

/**
 * Registra una incidencia en el envío con su motivo (RF-364).
 */
export async function registrarIncidenciaEnvio(envioId, motivo) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de la incidencia es obligatorio.');
  }

  const { data, error } = await supabase
    .from('envio')
    .update({
      estado: 'incidencia',
      referencia: '[INCIDENCIA: ' + motivo.trim() + ']'
    })
    .eq('id', Number(envioId))
    .select();

  if (error) throw error;
  return data;
}
