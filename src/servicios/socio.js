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

  return {
    saldoDisponibleCent,
    estimadoCicloCent,
    montoMinimoRetiroCent,
    movimientos: movimientos || [],
    solicitudes: solicitudes || []
  };
}

/**
 * P-19 · Enviar solicitud de retiro
 */
export async function solicitarRetiro({ socioId, montoCent, banco, numeroCuenta, cci }) {
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
      numero_cuenta: numeroCuenta,
      cci,
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

  // 2. Rango y puntos grupales
  const { data: rangoCiclo } = await supabase
    .from('rango_ciclo')
    .select('*, rango:rango_id(*)')
    .eq('socio_id', socioId)
    .eq('ciclo_id', cicloId)
    .maybeSingle();

  // 3. Rango honorífico histórico
  const { data: rangosCalificados } = await supabase
    .from('rango_ciclo')
    .select('*, rango:rango_id(*)')
    .eq('socio_id', socioId)
    .eq('califica', true);

  const maxRango = (rangosCalificados || []).sort(
    (a, b) => (b.rango?.orden || 0) - (a.rango?.orden || 0)
  )[0];

  // 4. Saldo y estimado
  const billetera = await obtenerMiBilletera(socioId, cicloId);

  // 5. Datos del ciclo vigente para días restantes
  const { data: ciclo } = await supabase
    .from('ciclo')
    .select('*')
    .eq('id', cicloId)
    .single();

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
    puntosGrupales: rangoCiclo?.puntos_grupales || 0,
    puntosComputables: rangoCiclo?.puntos_computables || 0,
    frontalesActivos: rangoCiclo?.frontales_activos || 0,
    rangoVigenteNombre: rangoCiclo?.califica ? rangoCiclo?.rango?.nombre : 'Sin Rango',
    rangoHonorificoNombre: maxRango?.rango?.nombre || rangoCiclo?.rango?.nombre || 'Sin Rango',
    saldoDisponibleCent: billetera.saldoDisponibleCent,
    estimadoCicloCent: billetera.estimadoCicloCent,
    diasRestantes,
    cicloNombre: ciclo?.nombre || `Ciclo ${cicloId}`
  };
}
