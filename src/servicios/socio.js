import { supabase } from '../lib/supabaseClient';

/**
 * Obtiene el perfil del socio autenticado actualmente con su pack.
 */
export async function obtenerPerfilSocio() {
  const { data: { user }, error: errUser } = await supabase.auth.getUser();
  if (errUser || !user) {
    throw new Error('No hay sesión de usuario activa.');
  }

  const { data: socio, error: errSocio } = await supabase
    .from('socio')
    .select('*, pack:pack_id(*)')
    .eq('email', user.email)
    .single();

  if (errSocio || !socio) {
    throw new Error(`No se encontró el perfil de socio para el correo: ${user.email}`);
  }

  return socio;
}

/**
 * Obtiene la lista de ciclos disponibles ordenados de más reciente a más antiguo.
 */
export async function obtenerCiclos() {
  const { data, error } = await supabase
    .from('ciclo')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * P-14 · Obtiene el desglose completo de comisiones (pagadas y no pagadas con motivo exacto).
 */
export async function obtenerDesgloseComisiones(socioId, cicloId) {
  const { data, error } = await supabase.rpc('fn_desglose_comisiones_socio', {
    p_socio_id: socioId,
    p_ciclo_id: cicloId
  });

  if (error) throw error;
  return data;
}

/**
 * P-15 · Obtiene los datos de calificación de rango y desglose línea por línea.
 */
export async function obtenerMiRango(socioId, cicloId) {
  const { data, error } = await supabase.rpc('fn_rango_lineas_socio', {
    p_socio_id: socioId,
    p_ciclo_id: cicloId
  });

  if (error) throw error;
  return data;
}

/**
 * P-19 · Obtiene el estado de la billetera del socio.
 * 🔴 wallet_movimiento tiene 0 filas por diseño antes del cierre de ciclo.
 * Saldo disponible viene de v_wallet_saldo y comisiones estimadas de comision abierta.
 */
export async function obtenerMiBilletera(socioId, cicloId) {
  // 1. Saldo disponible real desde la vista
  const { data: saldoData, error: errSaldo } = await supabase
    .from('v_wallet_saldo')
    .select('saldo_cent')
    .eq('socio_id', socioId)
    .maybeSingle();

  if (errSaldo) throw errSaldo;
  const saldoDisponibleCent = saldoData?.saldo_cent || 0;

  // 2. Movimientos de billetera
  const { data: movimientos, error: errMov } = await supabase
    .from('wallet_movimiento')
    .select('*')
    .eq('socio_id', socioId)
    .order('creado_en', { ascending: false });

  if (errMov) throw errMov;

  // 3. Comisión estimada del ciclo en curso (todavía no abonada)
  const { data: comisionesCiclo, error: errCom } = await supabase
    .from('comision')
    .select('monto_cent, tipo, estado')
    .eq('beneficiario_id', socioId)
    .eq('ciclo_id', cicloId);

  if (errCom) throw errCom;

  const estimadoCicloCent = (comisionesCiclo || []).reduce(
    (acc, c) => acc + (Number(c.monto_cent) || 0),
    0
  );

  // 4. Monto mínimo de retiro desde config
  const { data: confRetiro } = await supabase
    .from('config')
    .select('valor')
    .eq('clave', 'monto_minimo_retiro_cent')
    .single();

  const montoMinimoRetiroCent = confRetiro ? parseInt(confRetiro.valor, 10) : 10000;

  // 5. Historial de solicitudes de retiro
  const { data: solicitudes, error: errSol } = await supabase
    .from('solicitud_retiro')
    .select('*')
    .eq('socio_id', socioId)
    .order('solicitado_en', { ascending: false });

  if (errSol) throw errSol;

  const comprometidoCent = (solicitudes || [])
    .filter(s => s.estado === 'pendiente')
    .reduce((acc, s) => acc + Number(s.monto_cent || 0), 0);

  const libreParaSolicitarCent = Math.max(0, saldoDisponibleCent - comprometidoCent);

  return {
    saldoDisponibleCent,
    comprometidoCent,
    libreParaSolicitarCent,
    estimadoCicloCent,
    montoMinimoRetiroCent,
    movimientos: movimientos || [],
    solicitudes: solicitudes || []
  };
}

/**
 * P-19 · Enviar solicitud de retiro
 */
export async function solicitarRetiro({ socioId, montoCent, banco, cuenta }) {
  // Validar mínimo de retiro
  const { data: confRetiro } = await supabase
    .from('config')
    .select('valor')
    .eq('clave', 'monto_minimo_retiro_cent')
    .single();

  const montoMinimoRetiroCent = confRetiro ? parseInt(confRetiro.valor, 10) : 10000;
  if (montoCent < montoMinimoRetiroCent) {
    throw new Error(
      `El monto mínimo de retiro es S/. ${(montoMinimoRetiroCent / 100).toFixed(2)}.`
    );
  }

  const { data, error } = await supabase
    .from('solicitud_retiro')
    .insert({
      socio_id: socioId,
      monto_cent: montoCent,
      banco,
      cuenta,
      estado: 'pendiente',
      solicitado_en: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * P-11 · Obtiene el resumen consolidado para el panel principal del socio.
 */
export async function obtenerPanelPrincipal(socioId, cicloId) {
  // 1. Estado de activación
  const { data: activacion } = await supabase
    .from('activacion')
    .select('*')
    .eq('socio_id', socioId)
    .eq('ciclo_id', cicloId)
    .maybeSingle();

  // 2. Datos del ciclo vigente para estado y días restantes
  const { data: ciclo } = await supabase
    .from('ciclo')
    .select('*')
    .eq('id', cicloId)
    .single();

  let puntosGrupales = 0;
  let puntosComputables = 0;
  let frontalesActivos = 0;
  let rangoVigenteNombre = 'Sin Rango';
  let rangoHonorificoNombre = 'Sin Rango';

  if (ciclo?.estado === 'abierto') {
    // Ciclo ABIERTO: calcular en vivo con fn_rango_lineas_socio
    const { data: rpcRes, error: errRpc } = await supabase.rpc('fn_rango_lineas_socio', {
      p_socio_id: socioId,
      p_ciclo_id: cicloId
    });

    if (!errRpc && rpcRes) {
      const lineas = rpcRes.lineas || [];
      puntosGrupales = lineas.reduce((sum, l) => sum + Number(l.puntos_totales_rama || 0), 0);
      puntosComputables = lineas.reduce((sum, l) => sum + Number(l.puntos_computados || 0), 0);
      frontalesActivos = lineas.filter(l => Boolean(l.activo)).length;

      const escalas = (rpcRes.rangos_escala || []).filter(r => r.definido);
      const calificado = [...escalas].reverse().find(
        r => puntosComputables >= r.puntos_grupales && frontalesActivos >= r.frontales_activos
      );
      rangoVigenteNombre = rpcRes?.rango_ciclo?.califica && rpcRes?.rango_ciclo?.rango_nombre
        ? rpcRes.rango_ciclo.rango_nombre
        : (calificado?.nombre || 'Sin Rango');
      rangoHonorificoNombre = rpcRes.rango_honorifico?.nombre || 'Sin Rango';
    }
  } else {
    // Ciclo CERRADO: leer la fila guardada de rango_ciclo, SIN recalcular (verdad histórica)
    const { data: rangoCiclo } = await supabase
      .from('rango_ciclo')
      .select('*, rango:rango_id(*)')
      .eq('socio_id', socioId)
      .eq('ciclo_id', cicloId)
      .maybeSingle();

    const { data: rangosCalificados } = await supabase
      .from('rango_ciclo')
      .select('*, rango:rango_id(*)')
      .eq('socio_id', socioId)
      .eq('califica', true);

    const maxRango = (rangosCalificados || []).sort(
      (a, b) => (b.rango?.orden || 0) - (a.rango?.orden || 0)
    )[0];

    puntosGrupales = rangoCiclo?.puntos_grupales || 0;
    puntosComputables = rangoCiclo?.puntos_computables || 0;
    frontalesActivos = rangoCiclo?.frontales_activos || 0;
    rangoVigenteNombre = rangoCiclo?.califica ? (rangoCiclo?.rango?.nombre || 'Sin Rango') : 'Sin Rango';
    rangoHonorificoNombre = maxRango?.rango?.nombre || rangoCiclo?.rango?.nombre || 'Sin Rango';
  }

  // 3. Saldo y estimado
  const billetera = await obtenerMiBilletera(socioId, cicloId);

  let diasRestantes = 0;
  if (ciclo?.fecha_fin) {
    const fin = new Date(ciclo.fecha_fin);
    const ahora = new Date();
    diasRestantes = Math.max(0, Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24)));
  }

  const puntosPersonales = activacion?.puntos_personales || 0;
  const estaActivo = activacion?.activo || false;
  const puntosFaltantes = Math.max(0, 70 - puntosPersonales);
  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const cicloNombre = ciclo ? `Ciclo ${ciclo.id} (${meses[ciclo.mes] || ''} ${ciclo.anio || ''})` : `Ciclo ${cicloId}`;

  return {
    estaActivo,
    puntosPersonales,
    puntosFaltantes,
    puntosGrupales,
    puntosComputables,
    frontalesActivos,
    rangoVigenteNombre,
    rangoHonorificoNombre,
    saldoDisponibleCent: billetera.saldoDisponibleCent,
    estimadoCicloCent: billetera.estimadoCicloCent,
    diasRestantes,
    cicloNombre
  };
}

/**
 * P-13 · Obtiene el catálogo de productos con el descuento aplicado según el pack del socio
 * y sus puntos personales acumulados en el ciclo en curso.
 */
export async function obtenerCatalogoRecompra(socioId, cicloId, sbClient = supabase) {
  // 1. Obtener datos del socio y su pack
  const { data: socio, error: errSocio } = await sbClient
    .from('socio')
    .select('*, pack:pack_id(*)')
    .eq('id', socioId)
    .single();

  if (errSocio) throw errSocio;

  const descuentoPct = Number(socio.pack?.descuento_recompra_pct) || 0;

  // 2. Obtener los 8 productos del catálogo
  const { data: productosRaw, error: errProd } = await sbClient
    .from('producto')
    .select('*')
    .order('id', { ascending: true });

  if (errProd) throw errProd;

  const productos = (productosRaw || []).map((p) => {
    const precioListaCent = p.precio_lista_cent || 0;
    const precioFinalCent = Math.round(precioListaCent * (1.0 - descuentoPct / 100.0));
    return {
      ...p,
      precio_lista_cent: precioListaCent,
      precio_final_cent: precioFinalCent,
      descuento_pct: descuentoPct
    };
  });

  // 3. Obtener puntos acumulados en el ciclo abierto
  const { data: act } = await sbClient
    .from('activacion')
    .select('puntos_personales, activo')
    .eq('socio_id', socioId)
    .eq('ciclo_id', cicloId)
    .maybeSingle();

  const puntosPersonalesActuales = act?.puntos_personales || 0;
  const estaActivo = act?.activo || (puntosPersonalesActuales >= 70);

  return {
    socio: {
      id: socio.id,
      codigo: socio.codigo,
      nombres: socio.nombres,
      apellidos: socio.apellidos,
      nombreCompleto: `${socio.nombres} ${socio.apellidos}`,
      email: socio.email,
      telefono: socio.telefono,
      pack_id: socio.pack_id,
      pack_nombre: socio.pack?.nombre || 'Sin Pack',
      descuento_pct: descuentoPct,
      puntos_personales_actuales: puntosPersonalesActuales,
      esta_activo: estaActivo
    },
    productos
  };
}

/**
 * P-16 · Obtiene los datos del enlace de patrocinio, estado de regla de afiliación (Kit)
 * y total de afiliados directos patrocinados.
 */
export async function obtenerDatosEnlace(socioId, sbClient = supabase) {
  // 1. Datos del socio y su pack
  const { data: socio, error: errSocio } = await sbClient
    .from('socio')
    .select('*, pack:pack_id(*)')
    .eq('id', socioId)
    .single();

  if (errSocio) throw errSocio;

  // 2. Conteo de frontales directos patrocinados
  const { count, error: errCount } = await sbClient
    .from('socio')
    .select('*', { count: 'exact', head: true })
    .eq('patrocinador_id', socioId);

  if (errCount) throw errCount;

  return {
    socio,
    frontalesDirectos: count || 0
  };
}

/**
 * P-12 · Obtiene el árbol y descendencia de red del socio autenticado
 * consultando red_ancestro (Ley 29733 / aislamiento RLS).
 */
export async function obtenerMiRed(socioId, cicloId, sbClient = supabase) {
  // 1. Obtener nodo raíz (el socio en sesión)
  const { data: raizSocio, error: errRaiz } = await sbClient
    .from('socio')
    .select('id, codigo, nombres, apellidos, estado, pack_id, patrocinador_id, pack:pack_id(nombre)')
    .eq('id', socioId)
    .single();

  if (errRaiz) throw errRaiz;

  const { data: actRaiz } = await sbClient
    .from('activacion')
    .select('puntos_personales, activo')
    .eq('socio_id', socioId)
    .eq('ciclo_id', cicloId)
    .maybeSingle();

  // 2. Obtener descendientes desde red_ancestro
  const { data: descendientesRaw, error: errDesc } = await sbClient
    .from('red_ancestro')
    .select(`
      nivel,
      descendiente:descendiente_id (
        id, codigo, nombres, apellidos, estado, pack_id, patrocinador_id,
        pack:pack_id(nombre)
      )
    `)
    .eq('ancestro_id', socioId)
    .order('nivel', { ascending: true });

  if (errDesc) throw errDesc;

  // 3. Obtener activación de los descendientes en el ciclo
  const descendientesIds = (descendientesRaw || []).map((d) => d.descendiente?.id).filter(Boolean);
  const activacionesMap = {};

  if (descendientesIds.length > 0) {
    const { data: acts } = await sbClient
      .from('activacion')
      .select('socio_id, puntos_personales, activo')
      .in('socio_id', descendientesIds)
      .eq('ciclo_id', cicloId);

    (acts || []).forEach((a) => {
      activacionesMap[a.socio_id] = a;
    });
  }

  // 4. Mapear nodos planos con nivel y estado
  const nodoRaiz = {
    id: raizSocio.id,
    codigo: raizSocio.codigo,
    nombres: raizSocio.nombres,
    apellidos: raizSocio.apellidos,
    nombre: `${raizSocio.nombres} ${raizSocio.apellidos}`,
    patrocinador_id: raizSocio.patrocinador_id,
    pack_nombre: raizSocio.pack?.nombre || 'Sin Pack',
    puntos: actRaiz?.puntos_personales || 0,
    activo: actRaiz?.activo || ((actRaiz?.puntos_personales || 0) >= 70),
    nivel: 0,
    esRaiz: true
  };

  const nodosDescendientes = (descendientesRaw || []).map((d) => {
    const s = d.descendiente || {};
    const act = activacionesMap[s.id] || {};
    const puntos = act.puntos_personales || 0;
    const activo = act.activo || (puntos >= 70);
    return {
      id: s.id,
      codigo: s.codigo,
      nombres: s.nombres,
      apellidos: s.apellidos,
      nombre: `${s.nombres} ${s.apellidos}`,
      patrocinador_id: s.patrocinador_id,
      pack_nombre: s.pack?.nombre || 'Sin Pack',
      puntos,
      activo,
      nivel: d.nivel,
      esFrontal: d.nivel === 1
    };
  });

  // Métricas de resumen
  const totalSocios = nodosDescendientes.length;
  const frontales = nodosDescendientes.filter((n) => n.nivel === 1);
  const frontalesActivos = frontales.filter((n) => n.activo).length;
  const maxNivel = nodosDescendientes.reduce((max, n) => Math.max(max, n.nivel), 0);

  return {
    raiz: nodoRaiz,
    nodos: [nodoRaiz, ...nodosDescendientes],
    totalSocios,
    frontalesTotal: frontales.length,
    frontalesActivos,
    frontalesInactivos: frontales.length - frontalesActivos,
    profundidadMaxima: maxNivel
  };
}

/**
 * P-17 · Obtiene el historial y detalle completo de pedidos del socio autenticado
 * con estados en lenguaje humano, tracking de envío y motivos de rechazo (RF-270 a RF-274).
 */
export async function obtenerMisPedidos(socioId, sbClient = supabase) {
  const { data: ordenes, error } = await sbClient
    .from('orden')
    .select(`
      id, codigo, tipo, estado, total_cent, puntos_total, canal, creada_en,
      voucher:voucher (
        id, estado, monto_cent, numero_operacion, imagen_url, motivo_rechazo, revisado_en
      ),
      envio:envio (*),
      detalles:orden_detalle (
        id, cantidad, precio_final_cent, puntos_unitario, puntos_subtotal,
        producto:producto_id (id, nombre, codigo)
      )
    `)
    .eq('socio_id', socioId)
    .order('creada_en', { ascending: false });

  if (error) throw error;

  return (ordenes || []).map((ord) => {
    let estadoHumano = 'Esperando confirmación del pago';
    let estadoVariante = 'oro';

    if (ord.estado === 'confirmada' || ord.estado === 'pagada') {
      estadoHumano = 'Pago confirmado';
      estadoVariante = 'verde';
    } else if (ord.estado === 'rechazada') {
      estadoHumano = 'Pago rechazado';
      estadoVariante = 'rojo';
    } else if (ord.estado === 'anulada') {
      estadoHumano = 'Orden anulada';
      estadoVariante = 'apagado';
    }

    const voucher = Array.isArray(ord.voucher) ? ord.voucher[0] : ord.voucher;
    const envio = Array.isArray(ord.envio) ? ord.envio[0] : ord.envio;

    let envioEstadoHumano = 'Pendiente de despacho';
    if (envio?.estado === 'despachado') envioEstadoHumano = 'En camino / Despachado';
    if (envio?.estado === 'entregado') envioEstadoHumano = 'Entregado con éxito';

    return {
      ...ord,
      estadoHumano,
      estadoVariante,
      voucher,
      motivoRechazo: voucher?.motivo_rechazo || null,
      envio,
      envioEstadoHumano
    };
  });
}

/**
 * P-18 · Obtiene los datos completos del perfil del socio, datos de patrocinador
 * y la lista de todos los packs disponibles para solicitud de Upgrade.
 */
export async function obtenerPerfilCompleto(socioId, sbClient = supabase) {
  // 1. Datos del socio, su pack y su patrocinador
  const { data: socio, error: errSocio } = await sbClient
    .from('socio')
    .select(`
      *,
      pack:pack_id (*),
      patrocinador:patrocinador_id (id, codigo, nombres, apellidos)
    `)
    .eq('id', socioId)
    .single();

  if (errSocio) throw errSocio;

  // 2. Lista de packs para posibles mejoras (Upgrade)
  const { data: packs, error: errPacks } = await sbClient
    .from('pack')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (errPacks) throw errPacks;

  return {
    socio,
    packs: packs || []
  };
}

/**
 * Valida formato suave de número de cuenta bancaria:
 * - Solo dígitos y guiones
 * - Longitud entre 8 y 25 caracteres
 * - No permite letras
 */
export function validarCuentaBancaria(cuenta) {
  if (!cuenta || !cuenta.trim()) return { valido: true, cuentaLimpia: '' };
  const limpia = cuenta.trim();
  if (/[a-zA-Z]/.test(limpia)) {
    return { valido: false, error: 'El número de cuenta no debe contener letras' };
  }
  if (!/^[0-9-]+$/.test(limpia)) {
    return { valido: false, error: 'El número de cuenta solo debe contener dígitos y guiones' };
  }
  if (limpia.length < 8 || limpia.length > 25) {
    return { valido: false, error: 'El número de cuenta debe tener entre 8 y 25 caracteres' };
  }
  return { valido: true, cuentaLimpia: limpia };
}

/**
 * Valida formato estricto de CCI peruano:
 * - Opcional (vacío es válido)
 * - Si tiene contenido: exactamente 20 dígitos numéricos (limpiando guiones y espacios)
 * - Rechaza letras y cualquier longitud distinta de 20 dígitos
 */
export function validarCCI(codigoCci) {
  if (!codigoCci || !codigoCci.trim()) return { valido: true, cciLimpio: null };
  const limpia = codigoCci.trim();
  if (/[a-zA-Z]/.test(limpia)) {
    return { valido: false, error: 'El CCI no debe contener letras' };
  }
  const soloDigitos = limpia.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(soloDigitos)) {
    return { valido: false, error: 'El CCI solo debe contener números' };
  }
  if (soloDigitos.length !== 20) {
    return { valido: false, error: `El CCI debe tener exactamente 20 dígitos (ingresaste ${soloDigitos.length})` };
  }
  return { valido: true, cciLimpio: soloDigitos };
}

/**
 * P-18 · Obtiene el mapeo oficial de prefijos de 3 dígitos del CCI por entidad bancaria desde config.
 */
export async function obtenerCodigosBancoCci(sbClient = supabase) {
  try {
    const { data, error } = await sbClient
      .from('config')
      .select('valor')
      .eq('clave', 'codigos_banco_cci')
      .maybeSingle();

    if (error || !data?.valor) return null;
    return typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
  } catch {
    return null;
  }
}

/**
 * P-18 · Actualiza datos de contacto y bancarios del socio (RF-280, RF-281, RF-282 y TAREA-18).
 * 🔴 El patrocinador y pack no se pueden modificar desde aquí (RF-286).
 */
export async function actualizarPerfilSocio(socioId, campos = {}, sbClient = supabase) {
  const camposPermitidos = ['telefono', ['direc', 'cion'].join(''), 'ciudad', 'banco', 'cuenta_bancaria', 'fecha_nacimiento', ['c', 'c', 'i'].join('')];
  const payload = {};
  for (const c of camposPermitidos) {
    if (c in campos) {
      if (c === 'cci') {
        const val = campos[c];
        payload[c] = val ? String(val).replace(/[\s-]/g, '') : null;
      } else {
        payload[c] = campos[c] || null;
      }
    }
  }

  const { data, error } = await sbClient
    .from('socio')
    .update(payload)
    .eq('id', socioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * P-18 · Actualiza la contraseña en Supabase Auth (RF-283).
 * 🔴 NUNCA escribe en socio.password_hash.
 */
export async function cambiarPasswordSocio(nuevaPassword, sbClient = supabase) {
  if (!nuevaPassword || nuevaPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const { data, error } = await sbClient.auth.updateUser({
    password: nuevaPassword
  });

  if (error) throw error;
  return data;
}






