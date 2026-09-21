import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');

export const sbService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function limpiarSocioPrueba(email) {
  if (!email) return;
  const emailLimpio = email.trim().toLowerCase();

  // 1. Buscar socio por email
  const { data: socio } = await sbService
    .from('socio')
    .select('id')
    .eq('email', emailLimpio)
    .maybeSingle();

  if (socio?.id) {
    const socioId = socio.id;

    // Buscar órdenes asociadas
    const { data: ordenes } = await sbService
      .from('orden')
      .select('id')
      .eq('socio_id', socioId);

    const ordenIds = (ordenes || []).map(o => o.id);

    if (ordenIds.length > 0) {
      // TAREA-51: Las comisiones pueden tener movimientos de wallet asociados (abonos instantáneos)
      const { data: comsOrden } = await sbService.from('comision').select('id').in('orden_id', ordenIds);
      const comOrdenIds = (comsOrden || []).map(c => c.id);
      if (comOrdenIds.length > 0) {
        await sbService.from('wallet_movimiento').delete().in('comision_id', comOrdenIds);
      }
      await sbService.from('voucher').delete().in('orden_id', ordenIds);
      await sbService.from('orden_detalle').delete().in('orden_id', ordenIds);
      await sbService.from('envio').delete().in('orden_id', ordenIds);
      await sbService.from('comision').delete().in('orden_id', ordenIds);
      await sbService.from('movimiento_puntos').delete().in('orden_id', ordenIds);
      await sbService.from('auditoria').delete().eq('tabla', 'orden').in('registro_id', ordenIds);
      await sbService.from('orden').delete().in('id', ordenIds);
    }

    // Comisiones donde el socio es beneficiario o generador
    const { data: comsSocio } = await sbService.from('comision').select('id').or(`beneficiario_id.eq.${socioId},generador_id.eq.${socioId}`);
    const comSocioIds = (comsSocio || []).map(c => c.id);
    if (comSocioIds.length > 0) {
      await sbService.from('wallet_movimiento').delete().in('comision_id', comSocioIds);
    }

    await sbService.from('wallet_movimiento').delete().eq('socio_id', socioId);
    await sbService.from('movimiento_puntos').delete().eq('socio_id', socioId);
    await sbService.from('red_ancestro').delete().or(`descendiente_id.eq.${socioId},ancestro_id.eq.${socioId}`);
    await sbService.from('activacion').delete().eq('socio_id', socioId);
    await sbService.from('comision').delete().or(`beneficiario_id.eq.${socioId},generador_id.eq.${socioId}`);
    await sbService.from('rango_ciclo').delete().eq('socio_id', socioId);
    await sbService.from('auditoria').delete().eq('tabla', 'socio').eq('registro_id', socioId);
    await sbService.from('socio').delete().eq('id', socioId);
  }

  // 2. Borrar de auth.users usando Supabase Admin API
  const { data: listRes } = await sbService.auth.admin.listUsers();
  const authUser = (listRes?.users || []).find(u => u.email?.toLowerCase() === emailLimpio);
  if (authUser?.id) {
    await sbService.auth.admin.deleteUser(authUser.id);
  }
}

export async function contarUsuariosAuth() {
  const { data, error } = await sbService.auth.admin.listUsers();
  if (error) throw error;
  return data?.users?.length || 0;
}
