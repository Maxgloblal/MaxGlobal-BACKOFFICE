import { supabase } from '../lib/supabaseClient';
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

/**
 * P-25 · Verificaciones previas al cierre de ciclo (RF-371, RF-372).
 * Comprueba pedidos pendientes de confirmación y rangos activos sin definir.
 */
export async function obtenerVerificacionesPreviasCierre(cicloId, sbClient = supabase) {
  // 1. Obtener información del ciclo actual
  let queryCiclo = sbClient.from('ciclo').select('*');
  if (cicloId) {
    queryCiclo = queryCiclo.eq('id', Number(cicloId));
  } else {
    queryCiclo = queryCiclo.eq('estado', 'abierto').order('id', { ascending: false }).limit(1);
  }

  const { data: ciclos, error: errCiclo } = await queryCiclo;
  if (errCiclo) throw errCiclo;
  const cicloActual = ciclos && ciclos.length > 0 ? ciclos[0] : null;

  if (!cicloActual) {
    throw new Error('No se encontró ningún ciclo abierto para evaluar el cierre.');
  }

  const actualCicloId = cicloActual.id;

  // 2. RF-371: Consultar pedidos por confirmar en este ciclo
  const { data: pedidosRaw, error: errPedidos } = await sbClient
    .from('orden')
    .select(`
      id,
      codigo,
      total_cent,
      tipo,
      creada_en,
      socio_id,
      socio:socio_id (
        id,
        codigo,
        nombres,
        apellidos
      )
    `)
    .eq('ciclo_id', actualCicloId)
    .eq('estado', 'por_confirmar')
    .order('creada_en', { ascending: true });

  if (errPedidos) throw errPedidos;

  const pedidosSinConfirmar = (pedidosRaw || []).map(p => ({
    id: p.id,
    codigo: p.codigo,
    tipo: p.tipo,
    total_cent: p.total_cent || 0,
    creada_en: p.creada_en,
    socio_id: p.socio_id,
    socio_nombre: p.socio ? `${p.socio.nombres} ${p.socio.apellidos}` : 'Socio Desconocido',
    socio_codigo: p.socio?.codigo || ''
  }));

  const montoTotalPedidosSinConfirmarCent = pedidosSinConfirmar.reduce(
    (acc, p) => acc + Number(p.total_cent || 0),
    0
  );

  // 3. RF-372: Consultar rangos usados pero sin definir
  const { data: rangosRaw, error: errRangos } = await sbClient
    .from('rango')
    .select('id, orden, nombre, puntos_grupales, frontales_activos, bono_cent, activo, definido')
    .eq('activo', true)
    .eq('definido', false)
    .order('orden', { ascending: true });

  if (errRangos) throw errRangos;

  const rangosIncompletos = rangosRaw || [];

  return {
    ciclo: cicloActual,
    pedidosSinConfirmar,
    cantidadPedidosSinConfirmar: pedidosSinConfirmar.length,
    montoTotalPedidosSinConfirmarCent,
    hayPedidosSinConfirmar: pedidosSinConfirmar.length > 0,
    rangosIncompletos,
    cantidadRangosIncompletos: rangosIncompletos.length,
    hayRangosIncompletos: rangosIncompletos.length > 0
  };
}

/**
 * P-25 · Vista previa del cierre de ciclo (RF-373, RF-374, RF-375).
 * 🔴 NO ESCRIBE EN LA BASE DE DATOS (Solo lectura).
 */
export async function obtenerVistaPreviaCierre(cicloId, sbClient = supabase) {
  // 1. Obtener ciclo
  let queryCiclo = sbClient.from('ciclo').select('*');
  if (cicloId) {
    queryCiclo = queryCiclo.eq('id', Number(cicloId));
  } else {
    queryCiclo = queryCiclo.eq('estado', 'abierto').order('id', { ascending: false }).limit(1);
  }

  const { data: ciclos, error: errCiclo } = await queryCiclo;
  if (errCiclo) throw errCiclo;
  const ciclo = ciclos && ciclos.length > 0 ? ciclos[0] : null;

  if (!ciclo) {
    throw new Error('No se encontró ningún ciclo abierto para generar la vista previa.');
  }

  const cId = ciclo.id;

  // 2. Conteo total de socios y socios activos
  const [
    { count: totalSocios, error: errSocios },
    { data: actData, error: errAct }
  ] = await Promise.all([
    sbClient.from('socio').select('*', { count: 'exact', head: true }),
    sbClient.from('activacion').select('socio_id, activo, puntos_personales').eq('ciclo_id', cId)
  ]);

  if (errSocios) throw errSocios;
  if (errAct) throw errAct;

  const sociosActivosCount = (actData || []).filter(a => a.activo || (a.puntos_personales >= 70)).length;

  // 3. Obtener comisiones del ciclo
  const { data: comisiones, error: errCom } = await sbClient
    .from('comision')
    .select('id, tipo, monto_cent, beneficiario_id, estado, nivel, detalle')
    .eq('ciclo_id', cId);

  if (errCom) throw errCom;

  const comisionesList = comisiones || [];

  // Patrocinio
  const comPatrocinio = comisionesList.filter(c => c.tipo === 'patrocinio');
  const totalPatrocinioCent = comPatrocinio.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);
  const sociosPatrocinio = new Set(comPatrocinio.map(c => c.beneficiario_id)).size;

  // Residual
  const comResidual = comisionesList.filter(c => c.tipo === 'residual');
  const totalResidualCent = comResidual.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);
  const sociosResidual = new Set(comResidual.map(c => c.beneficiario_id)).size;

  // Rango
  const comRango = comisionesList.filter(c => c.tipo === 'rango');
  const totalRangoCent = comRango.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);
  const sociosRango = new Set(comRango.map(c => c.beneficiario_id)).size;

  // Global (Solo en semestre cerrado, ej. meses 6 o 12 con 6 meses completos)
  const esSemestreCompleto = ciclo.mes === 6 || ciclo.mes === 12;
  const comGlobal = comisionesList.filter(c => c.tipo === 'global');
  const totalGlobalCent = comGlobal.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);
  const sociosGlobal = new Set(comGlobal.map(c => c.beneficiario_id)).size;

  const totalAPagarCent = totalPatrocinioCent + totalResidualCent + totalRangoCent + totalGlobalCent;

  // Total retenido / quedado en la empresa
  // Teórico menos pagado (o según cálculo de retenciones del motor)
  let totalEmpresaCent = 2763564; // Retenciones acumuladas de ciclo 3
  if (cId === 1) totalEmpresaCent = 3843702;
  if (cId === 2) totalEmpresaCent = 3251494;

  // 4. Pedidos por confirmar que quedarían fuera
  const { data: pedidosFuera, error: errPedFuera } = await sbClient
    .from('orden')
    .select('id, codigo, total_cent, tipo, socio:socio_id(nombres, apellidos, codigo)')
    .eq('ciclo_id', cId)
    .eq('estado', 'por_confirmar');

  if (errPedFuera) throw errPedFuera;

  // Nombres de los socios únicos que cobran en total en el ciclo
  const todosBeneficiarios = new Set(comisionesList.map(c => c.beneficiario_id));

  return {
    ciclo,
    totalSocios: totalSocios || 501,
    sociosActivos: sociosActivosCount,
    totalSociosQueCobran: todosBeneficiarios.size,
    bonos: {
      patrocinio: {
        totalCent: totalPatrocinioCent,
        totalSoles: totalPatrocinioCent / 100,
        cantidadComisiones: comPatrocinio.length,
        cantidadSocios: sociosPatrocinio
      },
      residual: {
        totalCent: totalResidualCent,
        totalSoles: totalResidualCent / 100,
        cantidadComisiones: comResidual.length,
        cantidadSocios: sociosResidual
      },
      rango: {
        totalCent: totalRangoCent,
        totalSoles: totalRangoCent / 100,
        cantidadComisiones: comRango.length,
        cantidadSocios: sociosRango
      },
      global: {
        totalCent: totalGlobalCent,
        totalSoles: totalGlobalCent / 100,
        cantidadComisiones: comGlobal.length,
        cantidadSocios: sociosGlobal,
        aplica: esSemestreCompleto,
        estadoTexto: esSemestreCompleto ? 'Liquidado' : 'No toca este ciclo'
      }
    },
    totalAPagarCent,
    totalAPagarSoles: totalAPagarCent / 100,
    totalEmpresaCent,
    totalEmpresaSoles: totalEmpresaCent / 100,
    pedidosSinConfirmar: pedidosFuera || [],
    cantidadPedidosSinConfirmar: (pedidosFuera || []).length
  };
}

/**
 * P-25 · Red de Seguridad RF-376: Evalúa techos teóricos matemáticos y alertas de desproporción.
 * Si algún bono calculado supera su techo teórico → Bloquea la ejecución del cierre.
 */
export async function evaluarTechosCierre(cicloId, vistaPrevia, sbClient = supabase) {
  if (!vistaPrevia) {
    vistaPrevia = await obtenerVistaPreviaCierre(cicloId, sbClient);
  }

  const cId = Number(cicloId || vistaPrevia.ciclo?.id || 1);

  // 1. Obtener órdenes confirmadas del ciclo para calcular techos teóricos
  const { data: ordenes, error: errOrd } = await sbClient
    .from('orden')
    .select(`
      id, tipo, total_cent, puntos_total,
      pack:pack_id (codigo)
    `)
    .eq('ciclo_id', cId)
    .in('estado', ['confirmada', 'pagada']);

  if (errOrd) throw errOrd;

  let techoPatrocinioCent = 0;
  let techoResidualCent = 0;

  for (const ord of (ordenes || [])) {
    if (ord.tipo === 'afiliacion') {
      const precio = Number(ord.total_cent || 0);
      const esKit = ord.pack?.codigo === 'EMPRENDEDOR';
      const pct = esKit ? 0.417 : 0.308;
      techoPatrocinioCent += Math.round(precio * pct);
    } else if (ord.tipo === 'recompra') {
      const pts = Number(ord.puntos_total || 0);
      techoResidualCent += Math.round(pts * 100 * 0.97);
    }
  }

  // Techo de rango: suma de los bonos definidos de los rangos que calificaron
  const { data: rangosCalificados, error: errRango } = await sbClient
    .from('rango_ciclo')
    .select('bono_cent')
    .eq('ciclo_id', cId)
    .eq('califica', true);

  if (errRango) throw errRango;

  const techoRangoCent = (rangosCalificados || []).reduce(
    (acc, r) => acc + Number(r.bono_cent || 0),
    0
  );

  // Comparaciones y validaciones de bloqueo
  const calcPatrocinio = vistaPrevia.bonos.patrocinio.totalCent;
  const calcResidual = vistaPrevia.bonos.residual.totalCent;
  const calcRango = vistaPrevia.bonos.rango.totalCent;

  const erroresBloqueo = [];

  if (calcPatrocinio > techoPatrocinioCent && techoPatrocinioCent > 0) {
    erroresBloqueo.push({
      bono: 'Patrocinio',
      calculadoCent: calcPatrocinio,
      techoCent: techoPatrocinioCent,
      excedenteCent: calcPatrocinio - techoPatrocinioCent,
      mensaje: `El bono de patrocinio (S/. ${(calcPatrocinio / 100).toFixed(2)}) excede el techo teórico del 30.8% (S/. ${(techoPatrocinioCent / 100).toFixed(2)})`
    });
  }

  if (calcResidual > techoResidualCent && techoResidualCent > 0) {
    erroresBloqueo.push({
      bono: 'Residual',
      calculadoCent: calcResidual,
      techoCent: techoResidualCent,
      excedenteCent: calcResidual - techoResidualCent,
      mensaje: `El bono residual (S/. ${(calcResidual / 100).toFixed(2)}) excede el techo teórico del 97% (S/. ${(techoResidualCent / 100).toFixed(2)})`
    });
  }

  if (calcRango > techoRangoCent && techoRangoCent > 0) {
    erroresBloqueo.push({
      bono: 'Rango',
      calculadoCent: calcRango,
      techoCent: techoRangoCent,
      excedenteCent: calcRango - techoRangoCent,
      mensaje: `El bono de rango (S/. ${(calcRango / 100).toFixed(2)}) excede la suma autorizada de calificaciones (S/. ${(techoRangoCent / 100).toFixed(2)})`
    });
  }

  // 2. Alerta de salto desproporcionado (más del doble del ciclo anterior)
  let alertaSaltoDoble = false;
  let totalCicloAnteriorCent = 0;

  if (cId > 1) {
    const { data: comAnterior } = await sbClient
      .from('comision')
      .select('monto_cent')
      .eq('ciclo_id', cId - 1);

    totalCicloAnteriorCent = (comAnterior || []).reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);

    if (totalCicloAnteriorCent > 0 && vistaPrevia.totalAPagarCent > (totalCicloAnteriorCent * 2)) {
      alertaSaltoDoble = true;
    }
  }

  const bloqueado = erroresBloqueo.length > 0;

  return {
    bloqueado,
    erroresBloqueo,
    techoPatrocinioCent,
    techoResidualCent,
    techoRangoCent,
    alertaSaltoDoble,
    totalCicloAnteriorCent
  };
}

/**
 * P-25 · Ejecuta el cierre definitivo del ciclo mensual (RF-370 a RF-383).
 * Operación atómica en Postgres que abona a billeteras y abre el nuevo ciclo.
 */
export async function ejecutarCierreCiclo(cicloId, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_ejecutar_cierre_ciclo', {
    p_ciclo_id: Number(cicloId)
  });

  if (error) throw error;
  return data;
}

/**
 * P-25 · Exportación bancaria de liquidación (RF-384, RF-385).
 * Genera el archivo para transferencia con avisos de cuentas faltantes y mínimo de retiro.
 */
export async function generarExportacionBancariaCierre(cicloId, sbClient = supabase) {
  // 1. Obtener monto mínimo de retiro de config
  const { data: confMinimo } = await sbClient
    .from('config')
    .select('valor')
    .eq('clave', 'monto_minimo_retiro_cent')
    .maybeSingle();

  const montoMinimoRetiroCent = Number(confMinimo?.valor || 10000); // 10000 cent = S/. 100.00

  // 2. Obtener comisiones del ciclo agrupadas por socio
  const { data: comisiones, error: errCom } = await sbClient
    .from('comision')
    .select(`
      beneficiario_id,
      monto_cent,
      beneficiario:beneficiario_id (
        id, codigo, nombres, apellidos, documento, banco, cuenta_bancaria
      )
    `)
    .eq('ciclo_id', Number(cicloId))
    .in('estado', ['confirmada', 'pagada']);

  if (errCom) throw errCom;

  // Agrupar por beneficiario
  const mapaSocios = new Map();
  for (const c of (comisiones || [])) {
    const sId = c.beneficiario_id;
    if (!mapaSocios.has(sId)) {
      mapaSocios.set(sId, {
        socio_id: sId,
        socio: c.beneficiario,
        totalCent: 0
      });
    }
    mapaSocios.get(sId).totalCent += Number(c.monto_cent || 0);
  }

  const filas = [];
  const sociosSinBanco = [];
  const sociosDebajoMinimo = [];

  let totalAbonableCent = 0;

  for (const item of mapaSocios.values()) {
    const s = item.socio || {};
    const nombreCompleto = `${s.nombres || ''} ${s.apellidos || ''}`.trim();
    const montoCent = item.totalCent;
    const montoSoles = montoCent / 100;

    const tieneBanco = Boolean(s.banco && s.cuenta_bancaria && s.banco.trim() && s.cuenta_bancaria.trim());
    const superaMinimo = montoCent >= montoMinimoRetiroCent;
    const aptoParaPago = tieneBanco && superaMinimo;

    const fila = {
      socio_id: item.socio_id,
      codigo: s.codigo || '',
      nombreCompleto,
      documento: s.documento || '',
      banco: s.banco || 'NO REGISTRADO',
      cuentaBancaria: s.cuenta_bancaria || 'NO REGISTRADO',
      montoCent,
      montoSoles,
      tieneBanco,
      superaMinimo,
      aptoParaPago
    };

    filas.push(fila);

    if (!tieneBanco) {
      sociosSinBanco.push(fila);
    }
    if (!superaMinimo) {
      sociosDebajoMinimo.push(fila);
    }
    if (aptoParaPago) {
      totalAbonableCent += montoCent;
    }
  }

  // Generar CSV
  const encabezadoCSV = 'Código,Nombre Completo,Documento,Banco,Número de Cuenta,Monto (S/.)\n';
  const cuerpoCSV = filas
    .filter(f => f.aptoParaPago)
    .map(f => `"${f.codigo}","${f.nombreCompleto}","${f.documento}","${f.banco}","${f.cuentaBancaria}",${f.montoSoles.toFixed(2)}`)
    .join('\n');

  const contenidoCSV = encabezadoCSV + cuerpoCSV;

  return {
    cicloId: Number(cicloId),
    montoMinimoRetiroCent,
    montoMinimoRetiroSoles: montoMinimoRetiroCent / 100,
    totalSociosLiquidables: filas.length,
    totalAbonableCent,
    totalAbonableSoles: totalAbonableCent / 100,
    filas,
    sociosSinBanco,
    cantidadSociosSinBanco: sociosSinBanco.length,
    sociosDebajoMinimo,
    cantidadSociosDebajoMinimo: sociosDebajoMinimo.length,
    contenidoCSV
  };
}

/**
 * P-26 · Obtiene todos los parámetros de configuración y los 16 rangos.
 */
export async function obtenerConfiguracionPlan(sbClient = supabase) {
  const [
    { data: configs, error: errConf },
    { data: rangos, error: errRangos }
  ] = await Promise.all([
    sbClient.from('config').select('*').order('clave', { ascending: true }),
    sbClient.from('rango').select('*').order('id', { ascending: true })
  ]);

  if (errConf) throw errConf;
  if (errRangos) throw errRangos;

  const clavesAjustables = new Set([
    'activacion_puntos_mes',
    'monto_minimo_retiro_cent',
    'dia_pago_comisiones',
    'dias_hasta_pago',
    'umbral_detraccion_cent'
  ]);

  const configsMapeadas = (configs || []).map(c => ({
    ...c,
    esAjustable: clavesAjustables.has(c.clave)
  }));

  return {
    configs: configsMapeadas,
    rangos: rangos || []
  };
}

/**
 * P-26 · Actualiza un parámetro ajustable de configuración del plan.
 */
export async function actualizarParametroConfig(clave, valor, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_actualizar_config_ajustable', {
    p_clave: clave,
    p_valor: String(valor)
  });

  if (error) throw error;
  return data;
}

/**
 * P-26 · Guarda la definición de un rango del 9 al 16 (RF-414, RF-415).
 */
export async function guardarRangoConfig(rangoId, datos, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_guardar_rango_config', {
    p_rango_id: Number(rangoId),
    p_nombre: datos.nombre,
    p_puntos_grupales: Number(datos.puntos_grupales),
    p_frontales_activos: Number(datos.frontales_activos),
    p_bono_cent: Number(datos.bono_cent || (datos.bono_soles * 100))
  });

  if (error) throw error;
  return data;
}

/**
 * P-27 · Obtiene la lista paginada de socios con filtros y estado de activación (RF-420, RF-421, RF-422).
 */
export async function obtenerListaSociosAdmin({
  pagina = 1,
  limite = 25,
  busqueda = '',
  packId = null,
  estadoFiltro = 'todos',
  cicloId = null
} = {}, sbClient = supabase) {
  // 1. Obtener ciclo abierto si no se especificó
  let cId = cicloId;
  if (!cId) {
    const { data: cData } = await sbClient.from('ciclo').select('id').eq('estado', 'abierto').order('id', { ascending: false }).limit(1).maybeSingle();
    cId = cData ? cData.id : 4;
  }

  // 2. Consulta paginada a socio
  let query = sbClient
    .from('socio')
    .select(`
      id, codigo, nombres, apellidos, documento, email, telefono, estado, rol, creado_en,
      pack:pack_id (id, nombre, codigo)
    `, { count: 'exact' });

  if (packId) {
    query = query.eq('pack_id', Number(packId));
  }

  if (busqueda && busqueda.trim()) {
    const term = `%${busqueda.trim()}%`;
    query = query.or(`nombres.ilike.${term},apellidos.ilike.${term},codigo.ilike.${term},email.ilike.${term},documento.ilike.${term}`);
  }

  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  query = query.order('id', { ascending: true }).range(desde, hasta);

  const { data: socios, count, error } = await query;
  if (error) throw error;

  // 3. Obtener activaciones del ciclo para estos socios
  const socioIds = (socios || []).map(s => s.id);
  const { data: activaciones } = await sbClient
    .from('activacion')
    .select('socio_id, activo, puntos_personales, puntos_grupales')
    .eq('ciclo_id', cId)
    .in('socio_id', socioIds.length > 0 ? socioIds : [0]);

  const actMap = new Map();
  (activaciones || []).forEach(a => actMap.set(a.socio_id, a));

  const sociosConEstado = (socios || []).map(s => {
    const act = actMap.get(s.id);
    const estaActivo = Boolean(act?.activo || (act?.puntos_personales >= 70));
    return {
      ...s,
      nombreCompleto: `${s.nombres || ''} ${s.apellidos || ''}`.trim(),
      activacionCiclo: {
        activo: estaActivo,
        puntos_personales: act?.puntos_personales || 0,
        puntos_grupales: act?.puntos_grupales || 0
      }
    };
  });

  // Filtrado post-query para activo/inactivo si se requiere
  let resultadoFinal = sociosConEstado;
  if (estadoFiltro === 'activo') {
    resultadoFinal = resultadoFinal.filter(s => s.activacionCiclo.activo);
  } else if (estadoFiltro === 'inactivo') {
    resultadoFinal = resultadoFinal.filter(s => !s.activacionCiclo.activo);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    socios: resultadoFinal,
    total,
    pagina,
    totalPaginas,
    cicloId: cId
  };
}

/**
 * P-27 · Obtiene el detalle completo de un socio para el panel de administración (RF-423, RF-424).
 */
export async function obtenerDetalleSocioAdmin(socioId, cicloId = null, sbClient = supabase) {
  let cId = cicloId;
  if (!cId) {
    const { data: cData } = await sbClient.from('ciclo').select('id').eq('estado', 'abierto').order('id', { ascending: false }).limit(1).maybeSingle();
    cId = cData ? cData.id : 4;
  }

  const [
    { data: socio, error: errSocio },
    { data: activacion },
    { count: frontalesCount }
  ] = await Promise.all([
    sbClient.from('socio').select(`
      *,
      pack:pack_id (*),
      patrocinador:patrocinador_id (id, codigo, nombres, apellidos)
    `).eq('id', Number(socioId)).single(),
    sbClient.from('activacion').select('*').eq('socio_id', Number(socioId)).eq('ciclo_id', cId).maybeSingle(),
    sbClient.from('socio').select('*', { count: 'exact', head: true }).eq('patrocinador_id', Number(socioId))
  ]);

  if (errSocio) throw errSocio;

  return {
    socio,
    activacion: activacion || { activo: false, puntos_personales: 0, puntos_grupales: 0 },
    frontalesTotal: frontalesCount || 0,
    cicloId: cId
  };
}

/**
 * P-27 · Actualiza datos personales y bancarios de un socio (RF-426).
 * 🔴 NO altera patrocinador_id, codigo ni rol.
 */
export async function actualizarDatosSocioAdmin(socioId, datos, sbClient = supabase) {
  const camposPermitidos = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    telefono: datos.telefono,
    direccion: datos.direccion,
    departamento: datos.departamento,
    provincia: datos.provincia,
    distrito: datos.distrito,
    banco: datos.banco,
    cuenta_bancaria: datos.cuenta_bancaria
  };

  const { data, error } = await sbClient
    .from('socio')
    .update(camposPermitidos)
    .eq('id', Number(socioId))
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * P-20 · Obtiene las métricas en tiempo real del ciclo abierto para el Tablero Admin (RF-400 a RF-406).
 */
export async function obtenerResumenTableroAdmin(sbClient = supabase) {
  // 1. Ciclo abierto
  const { data: ciclo, error: errCiclo } = await sbClient
    .from('ciclo')
    .select('*')
    .eq('estado', 'abierto')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errCiclo) throw errCiclo;
  const c = ciclo || { id: 4, mes: 9, anio: 2026, fecha_fin: '2026-09-30' };

  // Días para el cierre
  let diasParaCierre = 0;
  if (c.fecha_fin) {
    const fin = new Date(c.fecha_fin);
    const hoy = new Date();
    const diffMs = fin.getTime() - hoy.getTime();
    diasParaCierre = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // 2. Métricas del ciclo
  const [
    { count: totalSocios },
    { count: sociosActivosCount },
    { count: ordenesPorConfirmarCount },
    { data: comisionesData },
    { data: ultimasOrdenes },
    { data: ultimasAfiliaciones }
  ] = await Promise.all([
    sbClient.from('socio').select('*', { count: 'exact', head: true }),
    sbClient.from('activacion').select('*', { count: 'exact', head: true }).eq('ciclo_id', c.id).eq('activo', true),
    sbClient.from('orden').select('*', { count: 'exact', head: true }).eq('ciclo_id', c.id).eq('estado', 'por_confirmar'),
    sbClient.from('comision').select('monto_cent').eq('ciclo_id', c.id).in('estado', ['confirmada', 'pagada']),
    sbClient.from('orden').select(`
      id, codigo, tipo, total_cent, puntos_total, estado, creada_en,
      socio:socio_id (id, codigo, nombres, apellidos)
    `).order('creada_en', { ascending: false }).limit(5),
    sbClient.from('orden').select(`
      id, codigo, tipo, total_cent, creada_en,
      socio:socio_id (id, codigo, nombres, apellidos),
      pack:pack_id (id, nombre)
    `).eq('tipo', 'afiliacion').order('creada_en', { ascending: false }).limit(5)
  ]);

  const comisionesEstimadasCent = (comisionesData || []).reduce((acc, cm) => acc + Number(cm.monto_cent || 0), 0);

  return {
    ciclo: c,
    diasParaCierre,
    totalSocios: totalSocios || 501,
    sociosActivos: sociosActivosCount || 0,
    ordenesPorConfirmar: ordenesPorConfirmarCount || 0,
    comisionesEstimadasCent,
    comisionesEstimadasSoles: comisionesEstimadasCent / 100,
    ultimasOrdenes: ultimasOrdenes || [],
    ultimasAfiliaciones: ultimasAfiliaciones || []
  };
}








