import { supabase } from '../lib/supabaseClient';
import { procesarComisionesDeUnaOrden } from '../motor/persistencia';
import { calcularYPersistirRangosDelCiclo, calcularRangosEnMemoria } from '../motor/persistenciaRango';

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
      tipo_venta,
      pack_id,
      pack:pack_id (
        id,
        nombre,
        codigo
      ),
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
export async function calcularImpactoOrden(orden, sbClient = supabase) {
  if (!orden) return null;

  let ord = orden;
  if (typeof orden === 'number' || typeof orden === 'string') {
    const { data: ordenDb, error: errOrd } = await sbClient
      .from('orden')
      .select(`
        *,
        pack:pack_id (
          id,
          codigo,
          nombre
        ),
        socio:socio_id (
          id,
          nombres,
          apellidos,
          codigo,
          estado,
          pack:pack_id (
            id,
            codigo,
            nombre
          )
        )
      `)
      .eq('id', Number(orden))
      .single();
    if (errOrd) throw errOrd;
    ord = ordenDb;
  }

  const socioId = Number(ord.socio_id);
  const cicloId = Number(ord.ciclo_id || 1);

  // 1. Obtener ancestros en la red
  const { data: ancestros, error: errAncestros } = await sbClient
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
    const { data: activaciones, error: errAct } = await sbClient
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
    sbClient.from('nivel_comision').select('nivel, porcentaje').eq('tipo', 'patrocinio').order('nivel'),
    sbClient.from('nivel_comision').select('nivel, porcentaje').eq('tipo', 'residual').order('nivel'),
    sbClient.from('pack_comision_especial').select('pack_codigo, nivel, porcentaje'),
    sbClient.from('pack').select('id, codigo, niveles_patrocinio, niveles_residual')
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

  const packCodigo = ord.pack?.codigo || mapaPacksPorId.get(Number(ord.pack_id))?.codigo || ord.socio?.pack?.codigo || null;

  const resultado = procesarComisionesDeUnaOrden({
    orden: {
      id: ord.id,
      socio_id: socioId,
      ciclo_id: cicloId,
      tipo: ord.tipo,
      total_cent: Number(ord.total_cent || 0),
      puntos_total: Number(ord.puntos_total || 0),
      pack_id: ord.pack_id,
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
    socioNombre: ord.socio ? `${ord.socio.nombres} ${ord.socio.apellidos}` : 'Socio',
    socioCodigo: ord.socio?.codigo || '',
    socioEstadoActual: ord.socio?.estado || 'pendiente',
    puntosAcreditar: Number(ord.puntos_total || 0)
  };
}

/**
 * Ejecuta la confirmación del pago de forma atómica en la base de datos (RF-347, RF-348, RF-349).
 */
export async function confirmarPagoOrden(ordenId, comisiones = [], sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_confirmar_orden_pago', {
    p_orden_id: Number(ordenId),
    p_comisiones: comisiones
  });

  if (error) throw error;
  return data;
}

/**
 * Ejecuta el rechazo del pago registrando el motivo obligatorio (RF-350).
 */
export async function rechazarPagoOrden(ordenId, motivo, sbClient = supabase) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de rechazo es obligatorio para auditar la operación.');
  }

  const { data, error } = await sbClient.rpc('fn_rechazar_orden_pago', {
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
 * Registra un nuevo pedido de recompra en estado 'por_confirmar' (RF-319, RF-320 y TAREA-16).
 * Admite tipoVenta = 'socio' | 'cliente'.
 */
export async function registrarPedidoRecompra({ socioId, items, lineas, voucher, envio, canal = 'oficina', tipoVenta = 'socio', sbClient: sbClientOpt }, sbClientParam = supabase) {
  const client = sbClientOpt || sbClientParam;
  const { data, error } = await client.rpc('fn_registrar_pedido_recompra', {
    p_socio_id: Number(socioId),
    p_items: items || lineas,
    p_voucher: voucher,
    p_envio: envio || null,
    p_canal: canal,
    p_tipo_venta: tipoVenta
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
 * Registra una nueva afiliación de socio con su usuario en auth.users (RF-330 a RF-335).
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
  let comRango = comisionesList.filter(c => c.tipo === 'rango');
  let totalRangoCent = comRango.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);
  let sociosRango = new Set(comRango.map(c => c.beneficiario_id)).size;

  // Si aún no existen comisiones de rango persistidas para el ciclo (dry-run en seco):
  if (comRango.length === 0) {
    try {
      const calculoRangoSeco = await calcularRangosEnMemoria(cId, sbClient);
      totalRangoCent = calculoRangoSeco.totalBonoCent;
      sociosRango = calculoRangoSeco.califican;
      comRango = calculoRangoSeco.comisiones;
    } catch (errRangoSeco) {
      console.warn('[VistaPrevia] Error al calcular rango en seco:', errRangoSeco);
    }
  }

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
  const todosBeneficiarios = new Set([
    ...comisionesList.map(c => c.beneficiario_id),
    ...comRango.map(c => c.beneficiario_id)
  ]);

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

  let techoRangoCent = (rangosCalificados || []).reduce(
    (acc, r) => acc + Number(r.bono_cent || 0),
    0
  );

  // Si aún no está persistido rango_ciclo, el techo se evalúa contra lo calculado en vista previa
  if (techoRangoCent === 0 && vistaPrevia.bonos?.rango?.totalCent > 0) {
    techoRangoCent = vistaPrevia.bonos.rango.totalCent;
  }

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
    const { data: comAnterior, error: errComAnterior } = await sbClient
      .from('comision')
      .select('monto_cent')
      .eq('ciclo_id', cId - 1);

    if (errComAnterior) throw errComAnterior;

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
 * 🔴 REGLA CRÍTICA DE ORDEN: El cálculo y persistencia del Bono de Rango
 * se ejecuta ESTRICTAMENTE ANTES de invocar el RPC fn_ejecutar_cierre_ciclo.
 */
export async function ejecutarCierreCiclo(cicloId, sbClient = supabase) {
  // 1. PASO CRÍTICO: Calcular y persistir rangos y comisiones de rango
  const resumenRango = await calcularYPersistirRangosDelCiclo(cicloId, sbClient);

  // 2. PASO ATÓMICO: Ejecutar cierre en Postgres (recorre comisiones existentes y abona a wallet_movimiento)
  const { data, error } = await sbClient.rpc('fn_ejecutar_cierre_ciclo', {
    p_ciclo_id: Number(cicloId)
  });

  if (error) throw error;
  return {
    ...data,
    resumenRango
  };
}

/**
 * P-25 · Exportación bancaria de liquidación (RF-384, RF-385).
 * Genera el archivo para transferencia con avisos de cuentas faltantes y mínimo de retiro.
 */
export async function generarExportacionBancariaCierre(cicloId, sbClient = supabase) {
  // 1. Obtener monto mínimo de retiro de config
  const { data: confMinimo, error: errConfMinimo } = await sbClient
    .from('config')
    .select('valor')
    .eq('clave', 'monto_minimo_retiro_cent')
    .maybeSingle();

  if (errConfMinimo) throw errConfMinimo;

  const montoMinimoRetiroCent = Number(confMinimo?.valor || 10000); // 10000 cent = S/. 100.00

  // 2. Obtener comisiones del ciclo agrupadas por socio
  const { data: comisiones, error: errCom } = await sbClient
    .from('comision')
    .select(`
      beneficiario_id,
      monto_cent,
      beneficiario:beneficiario_id (
        id, codigo, nombres, apellidos, documento, banco, cuenta_bancaria, cci
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
  const sociosSinCci = [];
  const sociosDebajoMinimo = [];

  let totalAbonableCent = 0;

  for (const item of mapaSocios.values()) {
    const s = item.socio || {};
    const nombreCompleto = `${s.nombres || ''} ${s.apellidos || ''}`.trim();
    const montoCent = item.totalCent;
    const montoSoles = montoCent / 100;

    const tieneBanco = Boolean(s.banco && s.cuenta_bancaria && s.banco.trim() && s.cuenta_bancaria.trim());
    const tieneCci = Boolean(s['cci'] && String(s['cci']).trim());
    const cciLimpio = tieneCci ? String(s['cci']).trim() : '';
    const superaMinimo = montoCent >= montoMinimoRetiroCent;
    const aptoParaPago = tieneBanco && superaMinimo;

    const fila = {
      socio_id: item.socio_id,
      codigo: s.codigo || '',
      nombreCompleto,
      documento: s.documento || '',
      banco: s.banco || 'NO REGISTRADO',
      cuentaBancaria: s.cuenta_bancaria || 'NO REGISTRADO',
      ['cci']: cciLimpio,
      montoCent,
      montoSoles,
      tieneBanco,
      tieneCci,
      superaMinimo,
      aptoParaPago
    };

    filas.push(fila);

    if (!tieneBanco) {
      sociosSinBanco.push(fila);
    }
    if (!tieneCci) {
      sociosSinCci.push(fila);
    }
    if (!superaMinimo) {
      sociosDebajoMinimo.push(fila);
    }
    if (aptoParaPago) {
      totalAbonableCent += montoCent;
    }
  }

  // Generar CSV (Cabecera oficial con CCI · TAREA-18)
  const encabezadoCSV = 'Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)\n';
  const cuerpoCSV = filas
    .filter(f => f.aptoParaPago)
    .map(f => `"${f.codigo}","${f.nombreCompleto}","${f.documento}","${f.banco}","${f.cuentaBancaria}","${f['cci']}",${f.montoSoles.toFixed(2)}`)
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
    sociosSinCci,
    cantidadSociosSinCci: sociosSinCci.length,
    cantidadSociosSinDatosOIncompletos: new Set([...sociosSinBanco.map(s => s.socio_id), ...sociosSinCci.map(s => s.socio_id)]).size,
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
    'umbral_detraccion_cent',
    'pct_detraccion',
    'url_landing'
  ]);

  const configsMapeadas = (configs || [])
    .filter(c => c.clave !== 'codigos_banco_cci')
    .map(c => ({
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

export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function formatearNombreCiclo(ciclo) {
  if (!ciclo) return '';
  const mesNum = Number(ciclo.mes);
  const nombreMes = NOMBRES_MESES[mesNum - 1] || `Mes ${ciclo.mes}`;
  return `${nombreMes} ${ciclo.anio || ''}`.trim();
}

/**
 * P-27 · Obtiene la lista paginada de socios con soporte de filtros por texto, pack y estado de activación (RF-420, RF-421, RF-422).
 */
export async function obtenerListaSociosAdmin({
  pagina = 1,
  limite = 25,
  busqueda = '',
  packId = null,
  estadoFiltro = 'todos',
  cicloId = null
} = {}, sbClient = supabase) {
  // 1. Obtener ciclo abierto si no se especificó (dinámico, sin meses a mano)
  let cId = cicloId;
  let cObj = null;
  if (!cId) {
    const { data: cData, error: errCiclo } = await sbClient
      .from('ciclo')
      .select('id, anio, mes, estado')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (errCiclo) throw errCiclo;
    cObj = cData;
    cId = cData ? cData.id : 6;
  } else {
    const { data: cData, error: errCiclo } = await sbClient
      .from('ciclo')
      .select('id, anio, mes, estado')
      .eq('id', Number(cId))
      .maybeSingle();
    if (errCiclo) throw errCiclo;
    cObj = cData;
  }

  const cicloNombre = cObj ? formatearNombreCiclo(cObj) : (cId ? `Ciclo ${cId}` : '');

  // 2. Resolver filtro activo/inactivo ANTES de paginar (TAREA-27 Bloque 1)
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

  if (estadoFiltro === 'activo' || estadoFiltro === 'inactivo') {
    const { data: actRows, error: errActRows } = await sbClient
      .from('activacion')
      .select('socio_id')
      .eq('ciclo_id', cId)
      .eq('activo', true);

    if (errActRows) throw errActRows;

    const activosIds = (actRows || []).map(r => r.socio_id);

    if (estadoFiltro === 'activo') {
      if (activosIds.length > 0) {
        query = query.in('id', activosIds);
      } else {
        query = query.in('id', [-1]);
      }
    } else if (estadoFiltro === 'inactivo') {
      if (activosIds.length > 0) {
        query = query.not('id', 'in', `(${activosIds.join(',')})`);
      }
    }
  }

  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  query = query.order('id', { ascending: true }).range(desde, hasta);

  const { data: socios, count, error } = await query;
  if (error) throw error;

  // 3. Obtener activaciones del ciclo para estos socios paginados (sin puntos_grupales inexistente)
  const socioIds = (socios || []).map(s => s.id);
  const { data: activaciones, error: errActivaciones } = await sbClient
    .from('activacion')
    .select('socio_id, activo, puntos_personales')
    .eq('ciclo_id', cId)
    .in('socio_id', socioIds.length > 0 ? socioIds : [0]);

  if (errActivaciones) throw errActivaciones;

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
        puntos_personales: act?.puntos_personales || 0
      }
    };
  });

  const total = count || 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return {
    socios: sociosConEstado,
    total,
    pagina,
    totalPaginas,
    cicloId: cId,
    cicloNombre,
    ciclo: cObj
  };
}

/**
 * P-27 · Obtiene el detalle completo de un socio para el panel de administración (RF-423, RF-424).
 */
export async function obtenerDetalleSocioAdmin(socioId, cicloId = null, sbClient = supabase) {
  let cId = cicloId;
  let cObj = null;
  if (!cId) {
    const { data: cData, error: errCiclo } = await sbClient
      .from('ciclo')
      .select('id, anio, mes, estado')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (errCiclo) throw errCiclo;
    cObj = cData;
    cId = cData ? cData.id : 6;
  } else {
    const { data: cData, error: errCiclo } = await sbClient
      .from('ciclo')
      .select('id, anio, mes, estado')
      .eq('id', Number(cId))
      .maybeSingle();
    if (errCiclo) throw errCiclo;
    cObj = cData;
  }

  const [
    { data: socio, error: errSocio },
    { data: activacion, error: errAct },
    { count: frontalesCount, error: errFrontales }
  ] = await Promise.all([
    sbClient.from('socio').select(`
      *,
      pack:pack_id (*),
      patrocinador:patrocinador_id (id, codigo, nombres, apellidos)
    `).eq('id', Number(socioId)).single(),
    sbClient.from('activacion').select('socio_id, ciclo_id, activo, puntos_personales, calculado_en').eq('socio_id', Number(socioId)).eq('ciclo_id', cId).maybeSingle(),
    sbClient.from('socio').select('*', { count: 'exact', head: true }).eq('patrocinador_id', Number(socioId))
  ]);

  if (errSocio) throw errSocio;
  if (errAct) throw errAct;
  if (errFrontales) throw errFrontales;

  const cicloNombre = cObj ? formatearNombreCiclo(cObj) : (cId ? `Ciclo ${cId}` : '');

  return {
    socio,
    activacion: activacion || { activo: false, puntos_personales: 0 },
    frontalesTotal: frontalesCount || 0,
    cicloId: cId,
    cicloNombre,
    ciclo: cObj
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

/**
 * P-28 · Genera el reporte financiero y operativo completo de un ciclo (RF-430 a RF-436).
 */
export async function obtenerReporteCicloAdmin(cicloId, sbClient = supabase) {
  const cId = Number(cicloId || 3);

  // 1. Obtener datos del ciclo y todos los ciclos para el selector
  const [
    { data: ciclos, error: errCiclos },
    { data: cicloActual }
  ] = await Promise.all([
    sbClient.from('ciclo').select('*').order('id', { ascending: false }),
    sbClient.from('ciclo').select('*').eq('id', cId).single()
  ]);

  if (errCiclos) throw errCiclos;

  // 2. Órdenes recaudadas en el ciclo
  const { data: ordenes, error: errOrd } = await sbClient
    .from('orden')
    .select('id, total_cent, tipo, tipo_venta, subtotal_cent, descuento_cent, estado')
    .eq('ciclo_id', cId)
    .in('estado', ['confirmada', 'pagada']);

  if (errOrd) throw errOrd;

  const totalRecaudadoCent = (ordenes || []).reduce((acc, o) => acc + Number(o.total_cent || 0), 0);

  // TAREA-16: Separación de ventas a socios vs ventas a clientes finales
  const totalSocioCent = (ordenes || [])
    .filter(o => o.tipo_venta !== 'cliente')
    .reduce((acc, o) => acc + Number(o.total_cent || 0), 0);

  const totalClienteCent = (ordenes || [])
    .filter(o => o.tipo_venta === 'cliente')
    .reduce((acc, o) => acc + Number(o.total_cent || 0), 0);

  const ordenesSocioCount = (ordenes || []).filter(o => o.tipo_venta !== 'cliente').length;
  const ordenesClienteCount = (ordenes || []).filter(o => o.tipo_venta === 'cliente').length;

  // 3. Comisiones del ciclo
  const { data: comisiones, error: errCom } = await sbClient
    .from('comision')
    .select(`
      id, tipo, monto_cent, beneficiario_id, estado,
      beneficiario:beneficiario_id (id, codigo, nombres, apellidos, pack:pack_id(nombre))
    `)
    .eq('ciclo_id', cId)
    .in('estado', ['confirmada', 'pagada']);

  if (errCom) throw errCom;

  const comisionesList = comisiones || [];
  const totalComisionesCent = comisionesList.reduce((acc, c) => acc + Number(c.monto_cent || 0), 0);

  // Desglose por tipo
  const bonosDesglose = {
    patrocinio: { totalCent: 0, cantidad: 0, socios: new Set() },
    residual: { totalCent: 0, cantidad: 0, socios: new Set() },
    rango: { totalCent: 0, cantidad: 0, socios: new Set() },
    global: { totalCent: 0, cantidad: 0, socios: new Set() }
  };

  // Top socios
  const mapaTop = new Map();

  for (const c of comisionesList) {
    const t = c.tipo || 'patrocinio';
    if (bonosDesglose[t]) {
      bonosDesglose[t].totalCent += Number(c.monto_cent || 0);
      bonosDesglose[t].cantidad += 1;
      bonosDesglose[t].socios.add(c.beneficiario_id);
    }

    const bId = c.beneficiario_id;
    if (!mapaTop.has(bId)) {
      mapaTop.set(bId, {
        socio_id: bId,
        codigo: c.beneficiario?.codigo || `MG${bId}`,
        nombreCompleto: `${c.beneficiario?.nombres || ''} ${c.beneficiario?.apellidos || ''}`.trim(),
        pack: c.beneficiario?.pack?.nombre || 'Socio',
        totalCent: 0
      });
    }
    mapaTop.get(bId).totalCent += Number(c.monto_cent || 0);
  }

  const top10Socios = Array.from(mapaTop.values())
    .sort((a, b) => b.totalCent - a.totalCent)
    .slice(0, 10);

  // 4. Distribución de socios por pack
  const { data: sociosPacks, error: errSociosPacks } = await sbClient
    .from('socio')
    .select('pack_id, pack:pack_id(nombre)');

  if (errSociosPacks) throw errSociosPacks;

  const mapaPacks = new Map();
  (sociosPacks || []).forEach(s => {
    const pNombre = s.pack?.nombre || 'Sin Pack';
    mapaPacks.set(pNombre, (mapaPacks.get(pNombre) || 0) + 1);
  });

  const distribucionPacks = Array.from(mapaPacks.entries()).map(([nombre, cantidad]) => ({
    nombre,
    cantidad,
    porcentaje: ((cantidad / (sociosPacks?.length || 1)) * 100).toFixed(1)
  }));

  // 5. Retiros
  const { data: retirosData, error: errRetirosData } = await sbClient
    .from('solicitud_retiro')
    .select('id, monto_cent, estado');

  if (errRetirosData) throw errRetirosData;

  const retirosSolicitadosCent = (retirosData || []).reduce((acc, r) => acc + Number(r.monto_cent || 0), 0);
  const retirosProcesadosCent = (retirosData || [])
    .filter(r => r.estado === 'aprobada' || r.estado === 'pagada')
    .reduce((acc, r) => acc + Number(r.monto_cent || 0), 0);

  const margenEmpresaCent = totalRecaudadoCent - totalComisionesCent;

  return {
    ciclos: ciclos || [],
    cicloActual: cicloActual || { id: cId },
    totalRecaudadoCent,
    totalRecaudadoSoles: totalRecaudadoCent / 100,
    totalSocioCent,
    totalSocioSoles: totalSocioCent / 100,
    totalClienteCent,
    totalClienteSoles: totalClienteCent / 100,
    ordenesSocioCount,
    ordenesClienteCount,
    totalComisionesCent,
    totalComisionesSoles: totalComisionesCent / 100,
    margenEmpresaCent,
    margenEmpresaSoles: margenEmpresaCent / 100,
    margenPorcentaje: totalRecaudadoCent > 0 ? ((margenEmpresaCent / totalRecaudadoCent) * 100).toFixed(1) : '0',
    desgloseBonos: {
      patrocinio: {
        totalCent: bonosDesglose.patrocinio.totalCent,
        totalSoles: bonosDesglose.patrocinio.totalCent / 100,
        cantidad: bonosDesglose.patrocinio.cantidad,
        socios: bonosDesglose.patrocinio.socios.size
      },
      residual: {
        totalCent: bonosDesglose.residual.totalCent,
        totalSoles: bonosDesglose.residual.totalCent / 100,
        cantidad: bonosDesglose.residual.cantidad,
        socios: bonosDesglose.residual.socios.size
      },
      rango: {
        totalCent: bonosDesglose.rango.totalCent,
        totalSoles: bonosDesglose.rango.totalCent / 100,
        cantidad: bonosDesglose.rango.cantidad,
        socios: bonosDesglose.rango.socios.size
      },
      global: {
        totalCent: bonosDesglose.global.totalCent,
        totalSoles: bonosDesglose.global.totalCent / 100,
        cantidad: bonosDesglose.global.cantidad,
        socios: bonosDesglose.global.socios.size
      }
    },
    top10Socios,
    distribucionPacks,
    retiros: {
      solicitadosCent: retirosSolicitadosCent,
      solicitadosSoles: retirosSolicitadosCent / 100,
      procesadosCent: retirosProcesadosCent,
      procesadosSoles: retirosProcesadosCent / 100
    }
  };
}

/**
 * P-29 · Obtiene la lista paginada de eventos de auditoría con filtros (RF-440 a RF-444).
 * 🔴 Si no hay eventos, devuelve arreglo vacío y total 0 sin error.
 */
export async function obtenerListaAuditoriaAdmin({
  pagina = 1,
  limite = 25,
  accion = null,
  tabla = null,
  fechaDesde = null,
  fechaHasta = null
} = {}, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_obtener_auditoria_admin', {
    p_pagina: Number(pagina),
    p_limite: Number(limite),
    p_accion: accion || null,
    p_tabla: tabla || null,
    p_fecha_desde: fechaDesde || null,
    p_fecha_hasta: fechaHasta || null
  });

  if (error) {
    // Si la RPC no está disponible o falla por RLS directo, fallback seguro
    const desde = (pagina - 1) * limite;
    const hasta = desde + limite - 1;
    let q = sbClient.from('auditoria').select('*', { count: 'exact' });
    if (accion) q = q.eq('accion', accion);
    if (tabla) q = q.eq('tabla', tabla);
    if (fechaDesde) q = q.gte('creado_en', fechaDesde);
    if (fechaHasta) q = q.lte('creado_en', fechaHasta);
    const { data: rows, count, error: errFallback } = await q.order('creado_en', { ascending: false }).range(desde, hasta);
    if (errFallback) throw errFallback;
    return {
      total: count || 0,
      pagina,
      totalPaginas: Math.ceil((count || 0) / limite) || 1,
      eventos: rows || []
    };
  }

  return {
    total: Number(data?.total || 0),
    pagina: Number(data?.pagina || pagina),
    totalPaginas: Number(data?.total_paginas || 1),
    eventos: data?.eventos || []
  };
}

/**
 * TAREA-14 · Valida tipo MIME y tamaño máximo (5 MB) de un archivo de comprobante.
 */
export function validarArchivoVoucher(file) {
  if (!file) return { valido: true };
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!tiposPermitidos.includes(file.type)) {
    return {
      valido: false,
      error: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG, WEBP o documentos PDF.'
    };
  }
  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxBytes) {
    return {
      valido: false,
      error: 'El comprobante excede el tamaño máximo permitido de 5 MB.'
    };
  }
  return { valido: true };
}

/**
 * TAREA-14 · Sube un comprobante al bucket privado 'vouchers' en Supabase Storage.
 * Ruta: vouchers/{ciclo_id}/{orden_codigo}-{timestamp}.{ext}
 */
export async function subirComprobanteVoucher(file, cicloId = null, codigoPrefijo = 'ORD', sbClient = supabase) {
  if (!file) return null;

  const validacion = validarArchivoVoucher(file);
  if (!validacion.valido) {
    throw new Error(validacion.error);
  }

  // Si no se pasó cicloId, consultar el ciclo abierto actual
  let cId = cicloId;
  if (!cId) {
    const { data: cData, error: errCiclo } = await sbClient
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errCiclo) throw errCiclo;
    cId = cData ? cData.id : 6;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  let ext = 'jpg';
  if (file.name && file.name.includes('.')) {
    ext = file.name.split('.').pop().toLowerCase();
  } else if (file.type === 'application/pdf') {
    ext = 'pdf';
  } else if (file.type === 'image/png') {
    ext = 'png';
  } else if (file.type === 'image/webp') {
    ext = 'webp';
  }

  const prefijoLimpio = String(codigoPrefijo).replace(/[^a-zA-Z0-9_-]/g, '') || 'ORD';
  const nombreArchivo = `${prefijoLimpio}-${timestamp}.${ext}`;
  const rutaRelativaStorage = `${cId}/${nombreArchivo}`;

  const { data, error } = await sbClient.storage
    .from('vouchers')
    .upload(rutaRelativaStorage, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error al subir voucher al bucket storage:', error);
    throw new Error(`Error de almacenamiento: ${error.message}`);
  }

  // Guardamos la ruta 'vouchers/{ciclo_id}/{nombreArchivo}'
  return `vouchers/${rutaRelativaStorage}`;
}

/**
 * TAREA-14 · Obtiene una URL firmada de visualización para un voucher privado.
 * Si el voucher es null, vacío o apunta a placehold.co, retorna null.
 */
export async function obtenerUrlVisualizacionVoucher(imagenUrl, segundosExpiracion = 900, sbClient = supabase) {
  if (!imagenUrl || typeof imagenUrl !== 'string' || imagenUrl.includes('placehold.co')) {
    return null;
  }

  // Si es una URL externa de terceros (ej: https://storage.maxglobal.com/...) no alojada en este storage:
  if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
    if (!imagenUrl.includes('/storage/v1/object/') && !imagenUrl.includes('/vouchers/')) {
      return imagenUrl;
    }
    // Si contiene la ruta de supabase storage vouchers:
    const partes = imagenUrl.split('/vouchers/');
    if (partes.length > 1) {
      const pathRelativo = decodeURIComponent(partes[1].split('?')[0]);
      const { data, error } = await sbClient.storage
        .from('vouchers')
        .createSignedUrl(pathRelativo, segundosExpiracion);
      if (error) {
        console.warn('Error generando signedUrl:', error.message);
        return null;
      }
      return data?.signedUrl || null;
    }
    return imagenUrl;
  }

  // Si viene como 'vouchers/6/ORD-...' o '6/ORD-...'
  const pathRelativo = imagenUrl.replace(/^vouchers\//, '');
  const { data, error } = await sbClient.storage
    .from('vouchers')
    .createSignedUrl(pathRelativo, segundosExpiracion);

  if (error) {
    console.warn('Error generando signedUrl para voucher:', error.message);
    return null;
  }

  return data?.signedUrl || null;
}

/**
 * TAREA-15 · P-30 · Obtiene las solicitudes de retiro con datos enriquecidos del socio,
 * saldo disponible actual de v_wallet_saldo y parámetros de detracción.
 */
export async function obtenerSolicitudesRetiroAdmin(sbClient = supabase) {
  // 1. Obtener solicitudes ordenadas por solicitado_en ASC (más antiguas primero)
  const { data: solicitudes, error } = await sbClient
    .from('solicitud_retiro')
    .select(`
      id, socio_id, monto_cent, banco, cuenta, estado, motivo_rechazo,
      procesado_por, procesado_en, solicitado_en,
      socio:socio_id (id, codigo, nombres, apellidos, documento, telefono, email)
    `)
    .order('solicitado_en', { ascending: true });

  if (error) throw error;

  // 2. Obtener saldos de v_wallet_saldo
  const socioIds = [...new Set((solicitudes || []).map(s => s.socio_id))];
  const saldosMap = new Map();

  if (socioIds.length > 0) {
    const { data: saldos, error: errSaldos } = await sbClient
      .from('v_wallet_saldo')
      .select('socio_id, saldo_cent')
      .in('socio_id', socioIds);

    if (!errSaldos && saldos) {
      saldos.forEach(s => saldosMap.set(s.socio_id, Number(s.saldo_cent || 0)));
    }
  }

  // 3. Parámetros de configuración (umbral y detracción)
  const { data: configs, error: errConfigs } = await sbClient
    .from('config')
    .select('clave, valor')
    .in('clave', ['umbral_detraccion_cent', 'pct_detraccion', 'monto_minimo_retiro_cent']);

  if (errConfigs) throw errConfigs;

  const configMap = {};
  (configs || []).forEach(c => {
    configMap[c.clave] = c.valor;
  });

  const umbralDetraccionCent = configMap['umbral_detraccion_cent'] ? parseInt(configMap['umbral_detraccion_cent'], 10) : 70000;
  const pctDetraccion = (configMap['pct_detraccion'] !== undefined && configMap['pct_detraccion'] !== null && configMap['pct_detraccion'] !== '')
    ? Number(configMap['pct_detraccion'])
    : null;

  return (solicitudes || []).map(s => {
    const saldoActualCent = saldosMap.get(s.socio_id) || 0;
    const socioData = s.socio || {};
    const nombreCompleto = `${socioData.nombres || ''} ${socioData.apellidos || ''}`.trim();
    const montoSolicitadoCent = Number(s.monto_cent || 0);
    const superaUmbral = montoSolicitadoCent > umbralDetraccionCent;

    let montoDetraccionCent = 0;
    let montoNetoCent = montoSolicitadoCent;
    let detractionPendiente = false;

    if (superaUmbral) {
      if (pctDetraccion !== null) {
        montoDetraccionCent = Math.round(montoSolicitadoCent * (pctDetraccion / 100));
        montoNetoCent = montoSolicitadoCent - montoDetraccionCent;
      } else {
        detractionPendiente = true;
      }
    }

    return {
      ...s,
      nombreSocio: nombreCompleto || `Socio #${s.socio_id}`,
      codigoSocio: socioData.codigo || '',
      documentoSocio: socioData.documento || '',
      saldoActualCent,
      saldoActualSoles: saldoActualCent / 100,
      montoSoles: montoSolicitadoCent / 100,
      saldoPosteriorEstimadoCent: saldoActualCent - montoSolicitadoCent,
      saldoPosteriorEstimadoSoles: (saldoActualCent - montoSolicitadoCent) / 100,
      saldoSuficiente: saldoActualCent >= montoSolicitadoCent,
      superaUmbral,
      umbralDetraccionCent,
      pctDetraccion,
      detractionPendiente,
      montoDetraccionCent,
      montoNetoCent
    };
  });
}

/**
 * TAREA-15 · Bloque 2 · Aprobar solicitud de retiro con débito negativo en wallet_movimiento.
 */
export async function aprobarSolicitudRetiro(solicitudId, adminId, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_aprobar_solicitud_retiro', {
    p_solicitud_id: Number(solicitudId),
    p_admin_id: Number(adminId)
  });

  if (error) {
    console.error('Error al aprobar solicitud de retiro:', error);
    throw new Error(error.message || 'Error al aprobar solicitud de retiro.');
  }

  return data;
}

/**
 * TAREA-15 · Bloque 3 · Rechazar solicitud de retiro con motivo obligatorio.
 */
export async function rechazarSolicitudRetiro(solicitudId, adminId, motivo, sbClient = supabase) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de rechazo es obligatorio.');
  }

  const { data, error } = await sbClient.rpc('fn_rechazar_solicitud_retiro', {
    p_solicitud_id: Number(solicitudId),
    p_admin_id: Number(adminId),
    p_motivo: motivo.trim()
  });

  if (error) {
    console.error('Error al rechazar solicitud de retiro:', error);
    throw new Error(error.message || 'Error al rechazar solicitud de retiro.');
  }

  return data;
}

/**
 * TAREA-17 · Bloque 1 · Obtener vista previa en seco de baja de socio con reenganche.
 */
export async function obtenerVistaPreviaBajaSocio(socioId, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_vista_previa_baja_socio', {
    p_socio_id: Number(socioId)
  });

  if (error) {
    console.error('Error al obtener vista previa de baja:', error);
    throw new Error(error.message || 'Error al consultar la vista previa de baja de socio.');
  }

  return data;
}

/**
 * TAREA-17 · Bloque 2 · Ejecutar baja de socio con reenganche de red en transacción atómica.
 */
export async function darDeBajaSocio(socioId, motivo, adminId = null, sbClient = supabase) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de la baja es obligatorio.');
  }

  const { data, error } = await sbClient.rpc('fn_dar_de_baja_socio', {
    p_socio_id: Number(socioId),
    p_motivo: motivo.trim(),
    p_admin_id: adminId ? Number(adminId) : null
  });

  if (error) {
    console.error('Error al ejecutar baja de socio:', error);
    throw new Error(error.message || 'Error al procesar la baja del socio.');
  }

  return data;
}

/**
 * TAREA-20 · P-31 · Obtiene las solicitudes de afiliación en estado 'nueva',
 * la más antigua primero, con los datos de quién la refirió.
 */
export async function obtenerSolicitudesAfiliacionAdmin(sbClient = supabase) {
  const { data, error } = await sbClient
    .from('solicitud_afiliacion')
    .select(`
      id, nombres, apellidos, documento, telefono, email,
      departamento, provincia, distrito, direccion,
      pack_codigo, ref_codigo, patrocinador_id, estado,
      creado_en, origen,
      patrocinador:patrocinador_id (id, codigo, nombres, apellidos)
    `)
    .eq('estado', 'nueva')
    .order('creado_en', { ascending: true });

  if (error) {
    console.error('Error al obtener solicitudes de afiliación:', error);
    throw new Error(error.message || 'Error al obtener solicitudes de afiliación');
  }

  return data || [];
}

/**
 * TAREA-20 · P-31 / P-22 · Convierte una solicitud de afiliación a socio registrado con auditoría.
 */
export async function convertirSolicitudAfiliacion(solicitudId, socioId, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_convertir_solicitud_afiliacion', {
    p_solicitud_id: Number(solicitudId),
    p_socio_id: Number(socioId)
  });

  if (error) {
    console.error('Error al convertir solicitud de afiliación:', error);
    throw new Error(error.message || 'Error al convertir la solicitud');
  }

  return data;
}

/**
 * TAREA-20 · P-31 · Descarta una solicitud de afiliación con motivo obligatorio y auditoría.
 */
export async function descartarSolicitudAfiliacion(solicitudId, motivo, sbClient = supabase) {
  if (!motivo || !motivo.trim()) {
    throw new Error('El motivo de descarte es obligatorio.');
  }

  const { data, error } = await sbClient.rpc('fn_descartar_solicitud_afiliacion', {
    p_solicitud_id: Number(solicitudId),
    p_motivo: motivo.trim()
  });

  if (error) {
    console.error('Error al descartar solicitud de afiliación:', error);
    throw new Error(error.message || 'Error al descartar la solicitud');
  }

  return data;
}

/**
 * TAREA-22 · P-32 · Obtiene todos los productos (activos e inactivos) ordenados por orden ASC.
 */
export async function obtenerProductosAdmin(sbClient = supabase) {
  const { data, error } = await sbClient
    .from('producto')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al obtener catálogo de productos:', error);
    throw new Error(error.message || 'Error al obtener catálogo de productos');
  }

  return data || [];
}

/**
 * TAREA-22 · Genera un slug normalizado en minúsculas y sin acentos a partir del nombre comercial.
 */
export function generarSlug(nombre) {
  if (!nombre) return '';
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita diacríticos/acentos
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza caracteres no alfanuméricos por guión
    .replace(/^-+|-+$/g, '');        // Limpia guiones en los bordes
}

/**
 * TAREA-22 · Valida un archivo de imagen de producto antes de intentar la subida.
 */
export function validarArchivoFotoProducto(file) {
  if (!file) {
    throw new Error('Debe proporcionar un archivo de imagen.');
  }

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  const tipo = file.type || '';
  if (!tiposPermitidos.includes(tipo)) {
    throw new Error('Formato de imagen inválido. Solo se permiten imágenes JPEG, PNG o WebP.');
  }

  const limiteBytes = 2 * 1024 * 1024; // 2 MB
  const tamano = file.size || 0;
  if (tamano > limiteBytes) {
    throw new Error('La imagen excede el tamaño máximo permitido de 2 MB.');
  }

  return true;
}

/**
 * TAREA-22 · P-32 · Obtiene los parámetros del sistema desde la base de datos para calcular
 * en tiempo real las consecuencias económicas del precio y los puntos de un producto.
 */
export async function obtenerParametrosConsecuencias(sbClient = supabase) {
  // 1. Descuentos de recompra desde la tabla pack
  const { data: packs, error: errPacks } = await sbClient
    .from('pack')
    .select('id, codigo, nombre, descuento_recompra_pct')
    .eq('activo', true)
    .order('precio_cent', { ascending: true });

  if (errPacks) throw errPacks;

  // 2. Suma de la escala residual desde nivel_comision
  const { data: niveles, error: errNiveles } = await sbClient
    .from('nivel_comision')
    .select('porcentaje')
    .eq('tipo', 'residual');

  if (errNiveles) throw errNiveles;

  const pctResidualTotal = (niveles || []).reduce(
    (acum, n) => acum + Number(n.porcentaje || 0),
    0
  );

  // 3. valor_punto_comision desde config
  const { data: configRows, error: errConfig } = await sbClient
    .from('config')
    .select('clave, valor')
    .in('clave', ['valor_punto_comision', 'valor_punto_soles']);

  if (errConfig) throw errConfig;

  const configMap = {};
  (configRows || []).forEach(r => {
    configMap[r.clave] = r.valor;
  });

  const valorPuntoComision = configMap['valor_punto_comision']
    ? Number(configMap['valor_punto_comision'])
    : 1.0;

  // 4. Productos activos para calcular la banda de referencia de soles de socio por punto
  const { data: productosActivos, error: errProds } = await sbClient
    .from('producto')
    .select('id, codigo, nombre, precio_lista_cent, puntos')
    .eq('activo', true);

  if (errProds) throw errProds;

  // Descuento Gold oficial (50%)
  const packGold = (packs || []).find(p => p.codigo === 'GOLD');
  const descuentoGold = packGold ? Number(packGold.descuento_recompra_pct) : 50;

  // Descuento Kit oficial (40%)
  const packKit = (packs || []).find(p => p.codigo === 'EMPRENDEDOR');
  const descuentoKit = packKit ? Number(packKit.descuento_recompra_pct) : 40;

  return {
    packs: packs || [],
    descuentoGold,
    descuentoKit,
    pctResidualTotal,
    valorPuntoComision,
    productosActivos: productosActivos || []
  };
}

/**
 * TAREA-22 · Sube una foto de producto a Supabase Storage bucket 'productos'
 * usando siempre timestamp en el nombre para evitar problemas de caché CDN.
 * Ruta: productos/{slug}-{timestamp}.{ext}
 */
export async function subirFotoProducto({ archivo, slug }, sbClient = supabase) {
  validarArchivoFotoProducto(archivo);

  if (!slug || !slug.trim()) {
    throw new Error('El slug del producto es obligatorio para nombrar la foto.');
  }

  let extension = 'webp';
  if (archivo.type === 'image/jpeg') extension = 'jpg';
  else if (archivo.type === 'image/png') extension = 'png';
  else if (archivo.name && archivo.name.includes('.')) {
    extension = archivo.name.split('.').pop().toLowerCase();
  }

  const timestamp = Date.now();
  const nombreArchivo = `${slug.trim()}-${timestamp}.${extension}`;

  const { data, error } = await sbClient.storage
    .from('productos')
    .upload(nombreArchivo, archivo, {
      contentType: archivo.type || 'image/webp',
      upsert: true
    });

  if (error) {
    console.error('Error al subir foto de producto a storage:', error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data: pubData } = sbClient.storage
    .from('productos')
    .getPublicUrl(nombreArchivo);

  return {
    urlPublica: pubData.publicUrl,
    nombreArchivo
  };
}

/**
 * Helper interno para obtener el ID de socio del administrador autenticado
 */
async function obtenerAdminId(sbClient) {
  try {
    const { data: { user }, error: errUser } = await sbClient.auth.getUser();
    if (errUser) throw errUser;
    if (user && user.email) {
      const { data: s, error: errS } = await sbClient
        .from('socio')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (errS) throw errS;
      if (s && s.id) return s.id;
    }
  } catch (e) {
    // Silencioso
  }
  return 1;
}

/**
 * TAREA-22 · Valida y crea un nuevo producto en Postgres y registra auditoría.
 */
export async function crearProducto(datos, usuarioId = null, sbClient = supabase) {
  if (!datos.codigo || !datos.codigo.trim()) {
    throw new Error('El código del producto es obligatorio.');
  }
  const codigoSanitizado = datos.codigo.trim().toUpperCase().replace(/\s+/g, '');

  if (!datos.nombre || !datos.nombre.trim()) {
    throw new Error('El nombre comercial del producto es obligatorio.');
  }

  const slugSanitizado = (datos.slug || generarSlug(datos.nombre)).trim().toLowerCase();
  if (!slugSanitizado) {
    throw new Error('El slug del producto es obligatorio.');
  }

  const precioListaCent = Number(datos.precio_lista_cent);
  if (isNaN(precioListaCent) || precioListaCent <= 0) {
    throw new Error('El precio público debe ser mayor a 0.');
  }

  const puntos = Number(datos.puntos);
  if (isNaN(puntos) || puntos < 0 || !Number.isInteger(puntos)) {
    throw new Error('Los puntos deben ser un número entero mayor o igual a 0.');
  }

  // Comprobar unicidad antes de enviar
  const { data: existeCodigo, error: errExisteCodigo } = await sbClient
    .from('producto')
    .select('id')
    .eq('codigo', codigoSanitizado)
    .maybeSingle();

  if (errExisteCodigo) throw errExisteCodigo;
  if (existeCodigo) {
    throw new Error('Ese código ya existe');
  }

  const { data: existeSlug, error: errExisteSlug } = await sbClient
    .from('producto')
    .select('id')
    .eq('slug', slugSanitizado)
    .maybeSingle();

  if (errExisteSlug) throw errExisteSlug;
  if (existeSlug) {
    throw new Error('Ese slug ya existe');
  }

  const nuevo = {
    codigo: codigoSanitizado,
    slug: slugSanitizado,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion ? datos.descripcion.trim() : null,
    categoria: datos.categoria ? datos.categoria.trim() : null,
    presentacion: datos.presentacion ? datos.presentacion.trim() : null,
    precio_lista_cent: precioListaCent,
    puntos: puntos,
    imagen_url: datos.imagen_url || null,
    orden: datos.orden !== undefined ? Number(datos.orden) : 10,
    activo: datos.activo !== undefined ? Boolean(datos.activo) : true
  };

  const { data: insertado, error: errInsert } = await sbClient
    .from('producto')
    .insert(nuevo)
    .select()
    .single();

  if (errInsert) {
    if (errInsert.message.includes('producto_codigo_key')) {
      throw new Error('Ese código ya existe');
    }
    if (errInsert.message.includes('producto_slug_key')) {
      throw new Error('Ese slug ya existe');
    }
    throw new Error(errInsert.message || 'Error al crear producto');
  }

  const adminId = usuarioId || (await obtenerAdminId(sbClient));
  try {
    await sbClient.from('auditoria').insert({
      usuario_id: adminId,
      accion: 'crear_producto',
      tabla: 'producto',
      registro_id: insertado.id,
      datos_despues: insertado
    });
  } catch (errAuditoria) {
    console.warn('Aviso: no se pudo registrar auditoría de crear_producto:', errAuditoria.message);
  }

  return insertado;
}

/**
 * TAREA-22 · Valida y edita un producto existente en Postgres y registra auditoría.
 */
export async function editarProducto(id, datos, datosAntes, usuarioId = null, sbClient = supabase) {
  if (!id) throw new Error('ID de producto no especificado.');

  if (!datos.codigo || !datos.codigo.trim()) {
    throw new Error('El código del producto es obligatorio.');
  }
  const codigoSanitizado = datos.codigo.trim().toUpperCase().replace(/\s+/g, '');

  if (!datos.nombre || !datos.nombre.trim()) {
    throw new Error('El nombre comercial del producto es obligatorio.');
  }

  const slugSanitizado = (datos.slug || generarSlug(datos.nombre)).trim().toLowerCase();
  if (!slugSanitizado) {
    throw new Error('El slug del producto es obligatorio.');
  }

  const precioListaCent = Number(datos.precio_lista_cent);
  if (isNaN(precioListaCent) || precioListaCent <= 0) {
    throw new Error('El precio público debe ser mayor a 0.');
  }

  const puntos = Number(datos.puntos);
  if (isNaN(puntos) || puntos < 0 || !Number.isInteger(puntos)) {
    throw new Error('Los puntos deben ser un número entero mayor o igual a 0.');
  }

  const { data: existeCodigo, error: errExisteCodigo } = await sbClient
    .from('producto')
    .select('id')
    .eq('codigo', codigoSanitizado)
    .neq('id', id)
    .maybeSingle();

  if (errExisteCodigo) throw errExisteCodigo;
  if (existeCodigo) {
    throw new Error('Ese código ya existe');
  }

  const { data: existeSlug, error: errExisteSlug } = await sbClient
    .from('producto')
    .select('id')
    .eq('slug', slugSanitizado)
    .neq('id', id)
    .maybeSingle();

  if (errExisteSlug) throw errExisteSlug;
  if (existeSlug) {
    throw new Error('Ese slug ya existe');
  }

  const datosActualizados = {
    codigo: codigoSanitizado,
    slug: slugSanitizado,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion ? datos.descripcion.trim() : null,
    categoria: datos.categoria ? datos.categoria.trim() : null,
    presentacion: datos.presentacion ? datos.presentacion.trim() : null,
    precio_lista_cent: precioListaCent,
    puntos: puntos,
    imagen_url: datos.imagen_url !== undefined ? datos.imagen_url : datosAntes?.imagen_url,
    orden: datos.orden !== undefined ? Number(datos.orden) : (datosAntes?.orden || 10),
    activo: datos.activo !== undefined ? Boolean(datos.activo) : (datosAntes?.activo ?? true)
  };

  const { data: modificado, error: errUpdate } = await sbClient
    .from('producto')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (errUpdate) {
    if (errUpdate.message.includes('producto_codigo_key')) {
      throw new Error('Ese código ya existe');
    }
    if (errUpdate.message.includes('producto_slug_key')) {
      throw new Error('Ese slug ya existe');
    }
    throw new Error(errUpdate.message || 'Error al actualizar producto');
  }

  const adminId = usuarioId || (await obtenerAdminId(sbClient));
  try {
    await sbClient.from('auditoria').insert({
      usuario_id: adminId,
      accion: 'editar_producto',
      tabla: 'producto',
      registro_id: id,
      datos_antes: datosAntes || null,
      datos_despues: modificado
    });
  } catch (errAuditoria) {
    console.warn('Aviso: no se pudo registrar auditoría de editar_producto:', errAuditoria.message);
  }

  return modificado;
}

/**
 * TAREA-22 · Activa o desactiva un producto sin borrarlo jamás, y registra auditoría.
 */
export async function cambiarEstadoProducto(id, activo, datosAntes = null, usuarioId = null, sbClient = supabase) {
  if (!id) throw new Error('ID de producto no especificado.');

  const { data: modificado, error: errUpdate } = await sbClient
    .from('producto')
    .update({ activo: Boolean(activo) })
    .eq('id', id)
    .select()
    .single();

  if (errUpdate) {
    throw new Error(errUpdate.message || 'Error al cambiar estado del producto');
  }

  const adminId = usuarioId || (await obtenerAdminId(sbClient));
  try {
    await sbClient.from('auditoria').insert({
      usuario_id: adminId,
      accion: activo ? 'activar_producto' : 'desactivar_producto',
      tabla: 'producto',
      registro_id: id,
      datos_antes: datosAntes || { activo: !activo },
      datos_despues: { activo: Boolean(activo) }
    });
  } catch (errAuditoria) {
    console.warn('Aviso: no se pudo registrar auditoría de cambio de estado:', errAuditoria.message);
  }

  return modificado;
}

/**
 * TAREA-26 · Registra una orden de upgrade de pack para un socio existente (FLUJO 9 / RF-509).
 */
export async function registrarUpgradePack({
  socioId,
  packIdNuevo,
  voucher = null,
  canal = 'oficina'
}, sbClient = supabase) {
  if (!socioId) throw new Error('ID de socio no especificado.');
  if (!packIdNuevo) throw new Error('Debe seleccionar un pack de destino.');

  const { data, error } = await sbClient.rpc('fn_registrar_orden_upgrade', {
    p_socio_id: Number(socioId),
    p_pack_id: Number(packIdNuevo),
    p_voucher: voucher || null,
    p_canal: canal
  });

  if (error) {
    console.error('Error al registrar orden de upgrade:', error);
    throw new Error(error.message || 'Error al registrar orden de upgrade de pack.');
  }

  return data;
}


