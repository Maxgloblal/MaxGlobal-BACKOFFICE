import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg3ODIzNiwiZXhwIjoyMTAzNDU0MjM2fQ.KRWJU3NFLnyQVAf0Ir82jEYvjncYGfWwSWPri14oOoo';

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
      await sbService.from('voucher').delete().in('orden_id', ordenIds);
      await sbService.from('orden_detalle').delete().in('orden_id', ordenIds);
      await sbService.from('envio').delete().in('orden_id', ordenIds);
      await sbService.from('comision').delete().in('orden_id', ordenIds);
      await sbService.from('movimiento_puntos').delete().in('orden_id', ordenIds);
      await sbService.from('auditoria').delete().eq('tabla', 'orden').in('registro_id', ordenIds);
      await sbService.from('orden').delete().in('id', ordenIds);
    }

    await sbService.from('movimiento_puntos').delete().eq('socio_id', socioId);
    await sbService.from('red_ancestro').delete().or(`descendiente_id.eq.${socioId},ancestro_id.eq.${socioId}`);
    await sbService.from('activacion').delete().eq('socio_id', socioId);
    await sbService.from('comision').delete().or(`beneficiario_id.eq.${socioId},generador_id.eq.${socioId}`);
    await sbService.from('rango_ciclo').delete().eq('socio_id', socioId);
    await sbService.from('auditoria').delete().eq('tabla', 'socio').eq('registro_id', socioId);
    await sbService.from('socio').delete().eq('id', socioId);
  }

  // 2. Borrar de auth.users usando Supabase Admin API
  for (let page = 1; page <= 6; page++) {
    const { data: listRes } = await sbService.auth.admin.listUsers({ page, perPage: 100 });
    const users = listRes?.users || [];
    const authUser = users.find(u => u.email?.toLowerCase() === emailLimpio);
    if (authUser?.id) {
      await sbService.auth.admin.deleteUser(authUser.id);
      break;
    }
    if (users.length < 100) break;
  }
}
