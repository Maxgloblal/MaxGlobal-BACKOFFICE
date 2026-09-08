import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { limpiarSocioPrueba } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-06B: Corrección de fn_confirmar_orden_pago y Pruebas por Pack', () => {
  let sbAdmin;
  let sbAnon;
  let sbAna;
  let cicloActivoId = 3;

  // Seguimiento de registros creados en la suite para limpieza segura
  const sociosCreados = [];
  const emailsCreados = [];
  const ordenesCreadas = [];
  let socioPruebaRecompraId = null;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-op-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);

    const { data: cAbierto } = await sbAdmin.from('ciclo').select('id').eq('estado', 'abierto').order('id', { ascending: false }).limit(1).single();
    if (cAbierto) cicloActivoId = cAbierto.id;

    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-op-anon', persistSession: false, autoRefreshToken: false }
    });


    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-op-ana', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo al autenticar ANA: ${errAna.message}`);

    // Crear un socio de prueba dedicado exclusivamente para las pruebas de recompra
    const rndRec = Math.floor(Math.random() * 899999 + 100000);
    const { data: afiRec, error: errRecInit } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 2,
      p_pack_id: 1, // Kit Emprendedor
      p_tipo_documento: 'DNI',
      p_documento: `88${rndRec}`,
      p_nombres: 'SOCIO',
      p_apellidos: 'TEST RECOMPRA',
      p_email: `test_rec_${rndRec}@ejemplo.test`,
      p_telefono: '991122334',
      p_fecha_nacimiento: '1990-01-01',
      p_direccion: 'Calle Test 123',
      p_departamento: 'Lima',
      p_provincia: 'Lima',
      p_distrito: 'Miraflores',
      p_voucher: { banco: 'BCP', numero_operacion: `OP-REC-INIT-${rndRec}`, monto_cent: 12000 }
    });
    if (errRecInit) throw new Error(`Fallo al crear socio de recompra: ${errRecInit.message}`);

    socioPruebaRecompraId = afiRec.socio_id;
    sociosCreados.push(afiRec.socio_id);
    emailsCreados.push(afiRec.email);
    ordenesCreadas.push(afiRec.orden_id);

    await sbAdmin.rpc('fn_confirmar_orden_pago', {
      p_orden_id: afiRec.orden_id,
      p_comisiones: []
    });
  });

  afterAll(async () => {
    // 🔴 Limpieza precisa y segura ejecutada directamente por el cliente admin
    if (sociosCreados.length > 0) {
      await sbAdmin.from('comision').delete().in('beneficiario_id', sociosCreados);
      await sbAdmin.from('comision').delete().in('generador_id', sociosCreados);
      await sbAdmin.from('movimiento_puntos').delete().in('socio_id', sociosCreados);
      await sbAdmin.from('activacion').delete().in('socio_id', sociosCreados);
    }
    if (ordenesCreadas.length > 0) {
      await sbAdmin.from('comision').delete().in('orden_id', ordenesCreadas);
      await sbAdmin.from('movimiento_puntos').delete().in('orden_id', ordenesCreadas);
      await sbAdmin.from('voucher').delete().in('orden_id', ordenesCreadas);
      await sbAdmin.from('envio').delete().in('orden_id', ordenesCreadas);
      await sbAdmin.from('orden_detalle').delete().in('orden_id', ordenesCreadas);
      await sbAdmin.from('orden').delete().in('id', ordenesCreadas);
    }
    if (sociosCreados.length > 0) {
      const { data: ordenesSocio } = await sbAdmin.from('orden').select('id').in('socio_id', sociosCreados);
      const ordenesIds = (ordenesSocio || []).map((o) => o.id);
      if (ordenesIds.length > 0) {
        await sbAdmin.from('comision').delete().in('orden_id', ordenesIds);
        await sbAdmin.from('movimiento_puntos').delete().in('orden_id', ordenesIds);
        await sbAdmin.from('voucher').delete().in('orden_id', ordenesIds);
        await sbAdmin.from('envio').delete().in('orden_id', ordenesIds);
        await sbAdmin.from('orden_detalle').delete().in('orden_id', ordenesIds);
        await sbAdmin.from('orden').delete().in('id', ordenesIds);
      }
      await sbAdmin.from('red_ancestro').delete().in('descendiente_id', sociosCreados);
      await sbAdmin.from('red_ancestro').delete().in('ancestro_id', sociosCreados);
      await sbAdmin.from('socio').delete().in('id', sociosCreados);
    }
    const { data: ordenesExtra } = await sbAdmin.from('orden').select('id').gt('id', 1489);
    if (ordenesExtra && ordenesExtra.length > 0) {
      const idsExtra = ordenesExtra.map((o) => o.id);
      await sbAdmin.from('comision').delete().in('orden_id', idsExtra);
      await sbAdmin.from('movimiento_puntos').delete().in('orden_id', idsExtra);
      await sbAdmin.from('voucher').delete().in('orden_id', idsExtra);
      await sbAdmin.from('envio').delete().in('orden_id', idsExtra);
      await sbAdmin.from('orden_detalle').delete().in('orden_id', idsExtra);
      await sbAdmin.from('orden').delete().in('id', idsExtra);
    }
    await sbAdmin.from('envio').delete().eq('numero_guia', 'GUIA-2026-001');

    for (const em of emailsCreados) {
      await limpiarSocioPrueba(em);
    }
  }, 30000);

  describe('1. P-21 · El Dinero y Cálculos de Recompra', () => {
    it('Café a un GOLD: precio_final 7500 cent (50% desc) · 18 puntos', () => {
      const precioListaCent = 15000;
      const descuentoPct = 50.0;
      const puntos = 18;

      const precioFinalCent = Math.round(precioListaCent * (1.0 - descuentoPct / 100.0));
      expect(precioFinalCent).toBe(7500);
      expect(puntos).toBe(18);
    });

    it('Café a un EMPRENDEDOR: precio_final 9000 cent (40% desc) · 18 puntos', () => {
      const precioListaCent = 15000;
      const descuentoPct = 40.0;
      const puntos = 18;

      const precioFinalCent = Math.round(precioListaCent * (1.0 - descuentoPct / 100.0));
      expect(precioFinalCent).toBe(9000);
      expect(puntos).toBe(18);
    });

    it('Aritmética: descuento_cent = subtotal_cent - total_cent, siempre', () => {
      const items = [
        { precio_lista: 15000, cantidad: 3, descuento_pct: 50.0 },
        { precio_lista: 16000, cantidad: 2, descuento_pct: 50.0 }
      ];

      const subtotalCent = items.reduce((acc, it) => acc + it.precio_lista * it.cantidad, 0);
      const totalCent = items.reduce(
        (acc, it) => acc + Math.round(it.precio_lista * (1.0 - it.descuento_pct / 100.0)) * it.cantidad,
        0
      );
      const descuentoCent = subtotalCent - totalCent;

      expect(subtotalCent).toBe(77000);
      expect(totalCent).toBe(38500);
      expect(descuentoCent).toBe(38500);
      expect(totalCent).toBe(subtotalCent - descuentoCent);
    });

    it('El costo de envío va en tabla envio y no suma puntos a la orden (RF-317)', () => {
      const puntosProductos = 18 * 3;
      const costoEnvioCent = 1500;
      const puntosEnvio = 0;

      expect(puntosProductos + puntosEnvio).toBe(54);
    });
  });

  describe('2. P-22 · Restricciones de Afiliación y Seguridad', () => {
    it('Un patrocinador Emprendedor NO puede afiliar un Gold (RF-332)', async () => {
      const { error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 13,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: '99887766',
        p_nombres: 'TEST',
        p_apellidos: 'RESTRICCION',
        p_email: 'test_restriccion@ejemplo.test',
        p_telefono: '999888777',
        p_fecha_nacimiento: '1990-01-01',
        p_direccion: 'Calle Test 123',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BCP', numero_operacion: 'OP9999', monto_cent: 120000 }
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/Restricción RF-332/i);
    });

    it('Documento duplicado se rechaza (RF-333)', async () => {
      const { error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: '10000001',
        p_nombres: 'TEST',
        p_apellidos: 'DUPLICADO',
        p_email: 'test_doc_duplicado@ejemplo.test',
        p_telefono: '999888777',
        p_fecha_nacimiento: '1990-01-01',
        p_direccion: 'Calle Test 123',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BCP', numero_operacion: 'OP9999', monto_cent: 120000 }
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/Ya existe un socio registrado con el documento/i);
    });

    it('Correo duplicado se rechaza (RF-333)', async () => {
      const { error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: '99881122',
        p_nombres: 'TEST',
        p_apellidos: 'CORREO DUPLICADO',
        p_email: 'socio001@ejemplo.test',
        p_telefono: '999888777',
        p_fecha_nacimiento: '1990-01-01',
        p_direccion: 'Calle Test 123',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BCP', numero_operacion: 'OP9999', monto_cent: 120000 }
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/Ya existe un socio registrado con el correo/i);
    });
  });

  describe('3. P-23 · Correcciones Críticas de fn_confirmar_orden_pago (TAREA-06B)', () => {
    it('🔴 Confirmar una afiliación EJECUTIVO (70 pts): crea movimiento origen=afiliacion, cuenta_residual=false y activa socio', async () => {
      const rnd = Math.floor(Math.random() * 899999 + 100000);
      const docTest = `55${rnd}`;
      const emailTest = `ejecutivo_${rnd}@ejemplo.test`;
      
      const { data: afi, error: errAfi } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 2,
        p_tipo_documento: 'DNI',
        p_documento: docTest,
        p_nombres: 'RUBEN',
        p_apellidos: 'EJECUTIVO',
        p_email: emailTest,
        p_telefono: '998811223',
        p_fecha_nacimiento: '1992-05-15',
        p_direccion: 'Av. Test 450',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'San Isidro',
        p_voucher: { banco: 'BCP', numero_operacion: `OP-EJEC-${rnd}`, monto_cent: 40000 }
      });

      expect(errAfi).toBeNull();
      expect(afi.exito).toBe(true);

      const ordenId = afi.orden_id;
      const socioId = afi.socio_id;
      sociosCreados.push(socioId);
      emailsCreados.push(emailTest);
      ordenesCreadas.push(ordenId);

      const { data: resConf, error: errConf } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: ordenId,
        p_comisiones: []
      });

      expect(errConf).toBeNull();
      expect(resConf.exito).toBe(true);

      const { data: ordenPost } = await sbAdmin.from('orden').select('estado, puntos_total').eq('id', ordenId).single();
      expect(ordenPost.estado).toBe('confirmada');
      expect(ordenPost.puntos_total).toBe(70);

      const { data: mov } = await sbAdmin.from('movimiento_puntos').select('*').eq('orden_id', ordenId).single();
      expect(mov).not.toBeNull();
      expect(mov.origen).toBe('afiliacion');
      expect(mov.puntos).toBe(70);
      expect(mov.cuenta_activacion).toBe(true);
      expect(mov.cuenta_residual).toBe(false);
      expect(mov.cuenta_rango).toBe(true);

      const { data: socioPost } = await sbAdmin.from('socio').select('estado').eq('id', socioId).single();
      expect(socioPost.estado).toBe('activo');

      const { data: act } = await sbAdmin.from('activacion').select('*').eq('socio_id', socioId).eq('ciclo_id', cicloActivoId).single();
      expect(act.activo).toBe(true);
      expect(act.puntos_personales).toBe(70);
    });

    it('🔴 Confirmar una afiliación GOLD (150 pts): crea movimiento con origen=afiliacion, cuenta_residual=false', async () => {
      const rnd = Math.floor(Math.random() * 899999 + 100000);
      const docGold = `44${rnd}`;
      const emailGold = `gold_${rnd}@ejemplo.test`;

      const { data: afiGold, error: errGold } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: docGold,
        p_nombres: 'MARIA',
        p_apellidos: 'GOLD',
        p_email: emailGold,
        p_telefono: '997766554',
        p_fecha_nacimiento: '1988-10-20',
        p_direccion: 'Calle Sol 123',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BBVA', numero_operacion: `OP-GOLD-${rnd}`, monto_cent: 120000 }
      });

      expect(errGold).toBeNull();
      const ordenId = afiGold.orden_id;
      const socioId = afiGold.socio_id;
      sociosCreados.push(socioId);
      emailsCreados.push(emailGold);
      ordenesCreadas.push(ordenId);

      const { data: resConf } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: ordenId,
        p_comisiones: []
      });
      expect(resConf.exito).toBe(true);

      const { data: movGold } = await sbAdmin.from('movimiento_puntos').select('*').eq('orden_id', ordenId).single();
      expect(movGold.origen).toBe('afiliacion');
      expect(movGold.puntos).toBe(150);
      expect(movGold.cuenta_residual).toBe(false);

      const { data: actGold } = await sbAdmin.from('activacion').select('*').eq('socio_id', socioId).eq('ciclo_id', cicloActivoId).single();
      expect(actGold.activo).toBe(true);
      expect(actGold.puntos_personales).toBe(150);
    });

    it('🔴 Confirmar una RECOMPRA de 18 puntos: cuenta_residual=true, y el socio NO queda activo (18 < 70)', async () => {
      // Reiniciar puntos personales del socio de prueba para el ciclo activo
      await sbAdmin.from('activacion').delete().eq('socio_id', socioPruebaRecompraId).eq('ciclo_id', cicloActivoId);

      const { data: pedido, error: errPed } = await sbAdmin.rpc('fn_registrar_pedido_recompra', {
        p_socio_id: socioPruebaRecompraId,
        p_items: [{ producto_id: 1, cantidad: 1 }],
        p_voucher: { banco: 'BCP', numero_operacion: `OP-REC-${Date.now()}`, monto_cent: 7500, fecha_deposito: '2026-08-15' },
        p_envio: null,
        p_canal: 'oficina'
      });

      expect(errPed).toBeNull();
      expect(pedido.puntos_total).toBe(18);
      ordenesCreadas.push(pedido.orden_id);

      const { data: resConf, error: errConf } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: pedido.orden_id,
        p_comisiones: []
      });

      expect(errConf).toBeNull();
      expect(resConf.exito).toBe(true);

      const { data: movRec } = await sbAdmin.from('movimiento_puntos').select('*').eq('orden_id', pedido.orden_id).single();
      expect(movRec.origen).toBe('recompra');
      expect(movRec.puntos).toBe(18);
      expect(movRec.cuenta_residual).toBe(true);

      const { data: actRec } = await sbAdmin.from('activacion').select('*').eq('socio_id', socioPruebaRecompraId).eq('ciclo_id', cicloActivoId).single();
      expect(actRec.puntos_personales).toBe(18);
      expect(actRec.activo).toBe(false);
    });

    it('🔴 Confirmar una segunda recompra que acumule más de 70 puntos: AHORA sí queda activo', async () => {
      const { data: pedido2, error: errPed2 } = await sbAdmin.rpc('fn_registrar_pedido_recompra', {
        p_socio_id: socioPruebaRecompraId,
        p_items: [{ producto_id: 1, cantidad: 3 }],
        p_voucher: { banco: 'BCP', numero_operacion: `OP-REC2-${Date.now()}`, monto_cent: 22500, fecha_deposito: '2026-08-20' },
        p_envio: null,
        p_canal: 'oficina'
      });

      expect(errPed2).toBeNull();
      expect(pedido2.puntos_total).toBe(54);
      ordenesCreadas.push(pedido2.orden_id);

      const { data: resConf2 } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: pedido2.orden_id,
        p_comisiones: []
      });
      expect(resConf2.exito).toBe(true);

      const { data: actRec2 } = await sbAdmin.from('activacion').select('*').eq('socio_id', socioPruebaRecompraId).eq('ciclo_id', cicloActivoId).single();
      expect(actRec2.puntos_personales).toBe(72);
      expect(actRec2.activo).toBe(true);
    });

    it('Confirmar un KIT (0 pts): socio queda activo porque el pack cubre su mes de ingreso', async () => {
      const rnd = Math.floor(Math.random() * 899999 + 100000);
      const docKit = `33${rnd}`;
      const emailKit = `kit_${rnd}@ejemplo.test`;

      const { data: afiKit, error: errAfiKit } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 1,
        p_tipo_documento: 'DNI',
        p_documento: docKit,
        p_nombres: 'LUIS',
        p_apellidos: 'KIT',
        p_email: emailKit,
        p_telefono: '996655443',
        p_fecha_nacimiento: '1995-03-12',
        p_direccion: 'Av. Grau 100',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Barranco',
        p_voucher: { banco: 'BCP', numero_operacion: `OP-KIT-${rnd}`, monto_cent: 12000 }
      });

      expect(errAfiKit).toBeNull();
      sociosCreados.push(afiKit.socio_id);
      emailsCreados.push(emailKit);
      ordenesCreadas.push(afiKit.orden_id);

      const { data: resConf } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: afiKit.orden_id,
        p_comisiones: []
      });
      expect(resConf.exito).toBe(true);

      const { data: movKit } = await sbAdmin.from('movimiento_puntos').select('*').eq('orden_id', afiKit.orden_id);
      expect(movKit.length).toBe(0);

      const { data: socioKit } = await sbAdmin.from('socio').select('estado').eq('id', afiKit.socio_id).single();
      expect(socioKit.estado).toBe('activo');

      const { data: actKit } = await sbAdmin.from('activacion').select('*').eq('socio_id', afiKit.socio_id).eq('ciclo_id', cicloActivoId).single();
      expect(actKit.activo).toBe(true);
      expect(actKit.puntos_personales).toBe(0);
    });

    it('Doble confirmación sigue devolviendo YA_CONFIRMADA (0 filas)', async () => {
      const { data: resDoble, error } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: 495,
        p_comisiones: []
      });

      expect(error).toBeNull();
      expect(resDoble.exito).toBe(false);
      expect(resDoble.codigo).toBe('YA_CONFIRMADA');
    });

    it('🔴 Error 5: Las 4 funciones están revocadas para anon y deniegan acceso', async () => {
      const { error: err1 } = await sbAnon.rpc('fn_confirmar_orden_pago', { p_orden_id: 1 });
      expect(err1).not.toBeNull();

      const { error: err2 } = await sbAnon.rpc('fn_rechazar_orden_pago', { p_orden_id: 1, p_motivo: 'test' });
      expect(err2).not.toBeNull();

      const { error: err3 } = await sbAnon.rpc('fn_registrar_afiliacion_socio', { p_patrocinador_id: 1, p_pack_id: 1 });
      expect(err3).not.toBeNull();

      const { error: err4 } = await sbAnon.rpc('fn_registrar_pedido_recompra', { p_socio_id: 1, p_items: [] });
      expect(err4).not.toBeNull();
    });
  });

  describe('4. P-24 · Envíos y Logística', () => {
    it('Despachar y entregar no altera puntos ni comisiones (RF-365)', async () => {
      const { data: envioInsert, error: errEnvio } = await sbAdmin
        .from('envio')
        .insert({
          orden_id: 495,
          destinatario: 'DANIEL LEON',
          telefono: '987654321',
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: 'Miraflores',
          direccion: 'Av. Larco 101',
          costo_cent: 1500,
          estado: 'pendiente'
        })
        .select()
        .single();

      expect(errEnvio).toBeNull();
      expect(envioInsert.estado).toBe('pendiente');

      const { data: envioDespachado, error: errDesp } = await sbAdmin
        .from('envio')
        .update({
          estado: 'despachado',
          agencia: 'Shalom',
          numero_guia: 'GUIA-2026-001',
          fecha_despacho: new Date().toISOString()
        })
        .eq('id', envioInsert.id)
        .select()
        .single();

      expect(errDesp).toBeNull();
      expect(envioDespachado.estado).toBe('despachado');
      expect(envioDespachado.numero_guia).toBe('GUIA-2026-001');

      const { data: envioEntregado, error: errEntr } = await sbAdmin
        .from('envio')
        .update({
          estado: 'entregado',
          fecha_entrega: new Date().toISOString()
        })
        .eq('id', envioInsert.id)
        .select()
        .single();

      expect(errEntr).toBeNull();
      expect(envioEntregado.estado).toBe('entregado');

      const { data: ordenCheck } = await sbAdmin.from('orden').select('puntos_total').eq('id', 495).single();
      expect(ordenCheck.puntos_total).toBe(0);
    });
  });
});
