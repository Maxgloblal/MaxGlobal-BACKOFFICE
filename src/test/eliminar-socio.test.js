import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('Funcionalidad · Eliminar Socio Definitivamente (Hard Delete con Candados)', () => {
  let sbAdmin;
  let sbAna;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-eliminar', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-eliminar', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);
  });

  it('1 · Un socio regular (no admin) NO puede consultar vista previa ni eliminar', async () => {
    const { error: errVp } = await sbAna.rpc('fn_vista_previa_eliminar_socio', {
      p_socio_id: 3
    });
    expect(errVp).toBeTruthy();
    expect(errVp.message).toMatch(/No autorizado|administrador/i);

    const { error: errDel } = await sbAna.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: 3,
      p_motivo: 'Intento no autorizado'
    });
    expect(errDel).toBeTruthy();
    expect(errDel.message).toMatch(/No autorizado|administrador/i);
  });

  it('2 · Prohibido eliminar al socio raíz (ID 1)', async () => {
    const { data: vp, error: errVp } = await sbAdmin.rpc('fn_vista_previa_eliminar_socio', {
      p_socio_id: 1
    });
    expect(errVp).toBeNull();
    expect(vp.puede_eliminar).toBe(false);
    expect(vp.es_raiz).toBe(true);

    const { error: errDel } = await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: 1,
      p_motivo: 'Borrar raiz'
    });
    expect(errDel).toBeTruthy();
    expect(errDel.message).toMatch(/socio raíz/i);
  });

  it('3 · Prohibido eliminar sin especificar motivo obligatorio', async () => {
    const { error: errVacio } = await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: 3,
      p_motivo: '   '
    });
    expect(errVacio).toBeTruthy();
    expect(errVacio.message).toMatch(/motivo de la eliminación es obligatorio/i);
  });

  it('4 · Candado contable: Prohibido eliminar socio con historial en ciclos cerrados', async () => {
    // Buscar un socio con comisiones en ciclo cerrado (ej. ciclos cerrados 1, 2 o 3 en entorno test)
    const { data: comCerrada } = await sbAdmin
      .from('comision')
      .select('beneficiario_id, ciclo:ciclo_id (estado)')
      .eq('ciclo.estado', 'cerrado')
      .limit(1)
      .maybeSingle();

    if (comCerrada && comCerrada.beneficiario_id) {
      const socioId = comCerrada.beneficiario_id;
      const { data: vp } = await sbAdmin.rpc('fn_vista_previa_eliminar_socio', {
        p_socio_id: socioId
      });
      expect(vp.puede_eliminar).toBe(false);
      expect(vp.motivo_bloqueo).toMatch(/ciclos cerrados/i);

      const { error: errDel } = await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
        p_socio_id: socioId,
        p_motivo: 'Prueba candado cerrado'
      });
      expect(errDel).toBeTruthy();
      expect(errDel.message).toMatch(/ciclos cerrados/i);
    }
  });

  it('5 · Eliminación limpia: Crea socio de prueba con orden y comisiones en ciclo abierto y lo elimina por completo', async () => {
    const rnd = Math.floor(100000 + Math.random() * 899999);
    const docPrueba = `98${rnd}`;
    const emailPrueba = `del_test_${rnd}@ejemplo.test`;

    // A. Afiliar socio de prueba
    const { data: resAfil, error: errAfil } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 1,
      p_pack_id: 3, // GOLD
      p_tipo_documento: 'DNI',
      p_documento: docPrueba,
      p_nombres: 'SOCIO_PRUEBA',
      p_apellidos: 'A_ELIMINAR',
      p_email: emailPrueba,
      p_telefono: '987654321',
      p_voucher: { banco: 'BCP', numero_operacion: `OP-${rnd}`, monto_cent: 120000 }
    });
    expect(errAfil).toBeNull();
    const nuevoSocioId = resAfil.socio_id;
    const nuevaOrdenId = resAfil.orden_id;

    const { data: cAbierto } = await sbAdmin
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // B. Confirmar orden (generando comisiones a patrocinador)
    await sbAdmin.rpc('fn_confirmar_orden_pago', {
      p_orden_id: nuevaOrdenId,
      p_comisiones: [
        {
          ciclo_id: cAbierto.id,
          beneficiario_id: 1,
          generador_id: nuevoSocioId,
          tipo: 'patrocinio',
          nivel: 1,
          monto_cent: 24000,
          base_cent: 120000,
          porcentaje: 20
        }
      ]
    });

    // C. Consultar Vista Previa de Eliminación
    const { data: vp, error: errVp } = await sbAdmin.rpc('fn_vista_previa_eliminar_socio', {
      p_socio_id: nuevoSocioId
    });
    expect(errVp).toBeNull();
    expect(vp.puede_eliminar).toBe(true);
    expect(vp.ordenes_count).toBe(1);
    expect(vp.comisiones_generadas_count).toBe(1);

    // D. Ejecutar Eliminación Definitiva
    const { data: resDel, error: errDel } = await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: nuevoSocioId,
      p_motivo: 'Registro de prueba técnica eliminado'
    });
    expect(errDel).toBeNull();
    expect(resDel.exito).toBe(true);
    expect(resDel.ordenes_borradas).toBe(1);
    expect(resDel.comisiones_borradas).toBe(1);

    // E. Verificar que todo fue eliminado físicamente
    const { data: socioCheck } = await sbAdmin
      .from('socio')
      .select('id')
      .eq('id', nuevoSocioId)
      .maybeSingle();
    expect(socioCheck).toBeNull();

    const { data: ordenCheck } = await sbAdmin
      .from('orden')
      .select('id')
      .eq('id', nuevaOrdenId)
      .maybeSingle();
    expect(ordenCheck).toBeNull();

    const { data: comisionCheck } = await sbAdmin
      .from('comision')
      .select('id')
      .or(`beneficiario_id.eq.${nuevoSocioId},generador_id.eq.${nuevoSocioId}`);
    expect(comisionCheck.length).toBe(0);

    const { data: activacionCheck } = await sbAdmin
      .from('activacion')
      .select('socio_id')
      .eq('socio_id', nuevoSocioId);
    expect(activacionCheck.length).toBe(0);

    // F. Verificar auditoría
    const { data: auditCheck } = await sbAdmin
      .from('auditoria')
      .select('id, accion, tabla, registro_id')
      .eq('tabla', 'socio')
      .eq('accion', 'eliminar_socio')
      .eq('registro_id', nuevoSocioId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(auditCheck).toBeTruthy();
    expect(auditCheck.accion).toBe('eliminar_socio');
  });

  it('6 · Reenganche de red: Al eliminar a un socio intermedio, su frontal sube al patrocinador superior', async () => {
    const rnd = Math.floor(100000 + Math.random() * 899999);

    // Crear Socio Padre (bajo 1)
    const { data: socioPadre } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 1,
      p_pack_id: 3,
      p_tipo_documento: 'DNI',
      p_documento: `81${rnd}`,
      p_nombres: 'PADRE',
      p_apellidos: 'ELIMINAR',
      p_email: `padre_${rnd}@ejemplo.test`,
      p_telefono: '988111222'
    });

    // Crear Socio Hijo (bajo Socio Padre)
    const { data: socioHijo } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: socioPadre.socio_id,
      p_pack_id: 3,
      p_tipo_documento: 'DNI',
      p_documento: `82${rnd}`,
      p_nombres: 'HIJO',
      p_apellidos: 'FRONTAL',
      p_email: `hijo_${rnd}@ejemplo.test`,
      p_telefono: '988333444'
    });

    // Vista previa de eliminar Socio Padre debe mostrar 1 frontal
    const { data: vp } = await sbAdmin.rpc('fn_vista_previa_eliminar_socio', {
      p_socio_id: socioPadre.socio_id
    });
    expect(vp.frontales_count).toBe(1);

    // Eliminar Socio Padre
    const { data: resDel, error: errDel } = await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: socioPadre.socio_id,
      p_motivo: 'Eliminar padre para probar reenganche'
    });
    expect(errDel).toBeNull();
    expect(resDel.frontales_movidos).toBe(1);

    // Verificar que Socio Hijo ahora tiene como patrocinador directo al 1 (patrocinador del Padre)
    const { data: hijoActualizado } = await sbAdmin
      .from('socio')
      .select('id, patrocinador_id')
      .eq('id', socioHijo.socio_id)
      .single();
    expect(hijoActualizado.patrocinador_id).toBe(1);

    // Limpiar al socio hijo
    await sbAdmin.rpc('fn_eliminar_socio_definitivo', {
      p_socio_id: socioHijo.socio_id,
      p_motivo: 'Limpieza de prueba'
    });
  });
});
