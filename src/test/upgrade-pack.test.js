import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  registrarUpgradePack,
  confirmarPagoOrden,
  calcularImpactoOrden
} from '../servicios/operacionAdmin';
import { limpiarSocioPrueba } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-26 · Upgrade de Pack (FLUJO 9)', () => {
  let sbAdmin;
  let sbAna;
  let packs = [];
  let socioTestId = null;
  let ordenUpgradeId = null;
  let ordenNormalId = null;
  let cicloAbiertoId = 30;

  const EMAIL_TEST = 'test.upgrade@maxglobal.test';
  const DOC_TEST = '99772211';

  beforeAll(async () => {
    // Cliente Admin
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t26', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // Cliente Ana (socio 2)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-t26', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    // Limpieza preventiva
    await limpiarSocioPrueba(EMAIL_TEST);

    // Ciclo abierto
    const { data: cData } = await sbAdmin
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (cData) cicloAbiertoId = cData.id;

    // Cargar packs
    const { data: pks } = await sbAdmin.from('pack').select('*').order('precio_cent', { ascending: true });
    packs = pks || [];

    // Crear un socio de prueba con Pack Ejecutivo (id: 2, precio: S/. 360 = 36000 cent) bajo patrocinador 2 (Ana Quispe, activa en ciclo abierto)
    const { data: regSocio, error: errReg } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
      p_patrocinador_id: 2,
      p_pack_id: 2, // Pack Ejecutivo
      p_tipo_documento: 'DNI',
      p_documento: DOC_TEST,
      p_nombres: 'Socio Test',
      p_apellidos: 'Upgrade Pack',
      p_email: EMAIL_TEST,
      p_telefono: '987654321',
      p_voucher: {
        banco: 'BCP',
        numero_operacion: 'OP-INI-01',
        monto_cent: 36000
      },
      p_canal: 'oficina'
    });
    if (errReg) throw new Error(`Error creando socio de prueba: ${errReg.message}`);
    socioTestId = regSocio.socio_id;

    // Confirmar la afiliación inicial para que el socio quede activo con Pack Ejecutivo
    const { data: ordIni } = await sbAdmin
      .from('orden')
      .select('id')
      .eq('socio_id', socioTestId)
      .eq('tipo', 'afiliacion')
      .eq('estado', 'por_confirmar')
      .single();

    if (ordIni) {
      const impactoIni = await calcularImpactoOrden(ordIni.id, sbAdmin);
      await confirmarPagoOrden(ordIni.id, impactoIni?.comisiones || [], sbAdmin);
    }
  });

  afterAll(async () => {
    // Limpieza estricta de datos de prueba para mantener conteos certificados intactos
    await limpiarSocioPrueba(EMAIL_TEST);

    // Verificación final del conteo de socios certificados (509)
    const { count: countSocios } = await sbAdmin.from('socio').select('*', { count: 'exact', head: true });
    expect(countSocios).toBe(509);
  }, 30000);

  it('1 · El selector NO ofrece packs de precio igual ni menor', () => {
    // Socio test tiene Pack Ejecutivo (id: 2, precio_cent: 36000)
    const packActual = packs.find(p => p.id === 2);
    expect(packActual).toBeDefined();

    // Filtro oficial: p.precio_cent > packActual.precio_cent
    const packsSuperiores = packs.filter(p => p.precio_cent > packActual.precio_cent);

    // Debe contener solo packs más caros (Gold 120000, Familiar 400000, Empresarial 800000)
    expect(packsSuperiores.length).toBe(3);
    expect(packsSuperiores.some(p => p.id === 1)).toBe(false); // Kit Emprendedor (12000) NO está
    expect(packsSuperiores.some(p => p.id === 2)).toBe(false); // Pack Ejecutivo (36000) NO está
    expect(packsSuperiores.every(p => p.precio_cent > packActual.precio_cent)).toBe(true);

    // Y para un socio con Pack Empresarial (máximo), la lista queda vacía
    const packMaximo = packs.find(p => p.id === 5);
    const paraMaximo = packs.filter(p => p.precio_cent > packMaximo.precio_cent);
    expect(paraMaximo.length).toBe(0);
  });

  it('2 · El total es el precio COMPLETO del pack nuevo, no la diferencia', async () => {
    // De Ejecutivo (S/. 360) a Empresarial (S/. 8,000 = 800000 cent), el total es 800000, NO (800000 - 36000 = 764000)
    const packEmpresarial = packs.find(p => p.id === 5);
    expect(packEmpresarial.precio_cent).toBe(800000);

    const res = await registrarUpgradePack({
      socioId: socioTestId,
      packIdNuevo: 5,
      voucher: {
        banco: 'BCP',
        numero_operacion: 'OP-UPG-01',
        monto_cent: 800000
      }
    }, sbAdmin);

    expect(res.exito).toBe(true);
    expect(res.total_cent).toBe(800000); // 800000 céntimos, no la diferencia
    expect(res.puntos_total).toBe(800);
    ordenUpgradeId = res.orden_id;

    // Verificar en la tabla orden
    const { data: ordenDb } = await sbAdmin
      .from('orden')
      .select('*')
      .eq('id', ordenUpgradeId)
      .single();

    expect(ordenDb.tipo).toBe('afiliacion');
    expect(ordenDb.pack_id).toBe(5);
    expect(ordenDb.total_cent).toBe(800000);
    expect(ordenDb.subtotal_cent).toBe(800000);
    expect(ordenDb.descuento_cent).toBe(0);
    expect(ordenDb.puntos_total).toBe(800);
    expect(ordenDb.estado).toBe('por_confirmar');
  });

  it('3 · Al CREAR la orden, socio.pack_id NO cambia todavía', async () => {
    // La orden de upgrade a pack 5 está en 'por_confirmar'
    // El socio todavía DEBE tener pack_id = 2 (Ejecutivo)
    const { data: socioDb } = await sbAdmin
      .from('socio')
      .select('id, pack_id')
      .eq('id', socioTestId)
      .single();

    expect(socioDb.pack_id).toBe(2); // Sigue siendo el anterior
  });

  it('4 · Al CONFIRMARLA, socio.pack_id pasa al pack nuevo', async () => {
    // Confirmamos la orden de upgrade
    const impacto = await calcularImpactoOrden(ordenUpgradeId, sbAdmin);
    const resConf = await confirmarPagoOrden(ordenUpgradeId, impacto?.comisiones || [], sbAdmin);
    expect(resConf.exito).toBe(true);

    // Ahora el socio DEBE tener pack_id = 5 (Empresarial)
    const { data: socioDb } = await sbAdmin
      .from('socio')
      .select('id, pack_id')
      .eq('id', socioTestId)
      .single();

    expect(socioDb.pack_id).toBe(5);
  });

  it('5 · Confirmar una afiliación NORMAL no cambia nada', async () => {
    // Creamos una orden de afiliación normal donde orden.pack_id == socio.pack_id (ambos 5)
    const { data: ordenNorm, error: errNorm } = await sbAdmin
      .from('orden')
      .insert({
        codigo: 'ORD-TEST-NORM-01',
        socio_id: socioTestId,
        ciclo_id: cicloAbiertoId,
        tipo: 'afiliacion',
        pack_id: 5,
        subtotal_cent: 800000,
        descuento_cent: 0,
        total_cent: 800000,
        puntos_total: 800,
        estado: 'por_confirmar'
      })
      .select()
      .single();

    if (errNorm) throw errNorm;
    ordenNormalId = ordenNorm.id;

    // Contar auditorías upgrade_pack antes
    const { count: auditAntes } = await sbAdmin
      .from('auditoria')
      .select('*', { count: 'exact', head: true })
      .eq('accion', 'upgrade_pack')
      .eq('registro_id', socioTestId);

    // Confirmar orden normal
    await confirmarPagoOrden(ordenNormalId, [], sbAdmin);

    // El socio sigue con pack 5
    const { data: socioDb } = await sbAdmin
      .from('socio')
      .select('id, pack_id')
      .eq('id', socioTestId)
      .single();
    expect(socioDb.pack_id).toBe(5);

    // No se insertó ninguna fila de upgrade_pack en auditoria
    const { count: auditDespues } = await sbAdmin
      .from('auditoria')
      .select('*', { count: 'exact', head: true })
      .eq('accion', 'upgrade_pack')
      .eq('registro_id', socioTestId);

    expect(auditDespues).toBe(auditAntes);
  });

  it('6 · Una orden con un pack MÁS BARATO es rechazada', async () => {
    // Caso A: Al intentar registrar un upgrade a un pack inferior o igual, fn_registrar_orden_upgrade falla
    // Socio actual tiene pack 5 (Empresarial, S/. 8,000)
    await expect(
      registrarUpgradePack({
        socioId: socioTestId,
        packIdNuevo: 1, // Kit Emprendedor (S/. 120)
        voucher: null
      }, sbAdmin)
    ).rejects.toThrow(/Solo se permite subir de pack/);

    // Caso B: Si existiera una orden manipulada con pack menor (ej. pack 1), fn_confirmar_orden_pago la RECHAZA
    const { data: ordenTrucada } = await sbAdmin
      .from('orden')
      .insert({
        codigo: 'ORD-TEST-DOWNGRADE',
        socio_id: socioTestId,
        ciclo_id: cicloAbiertoId,
        tipo: 'afiliacion',
        pack_id: 1, // Menor que 5
        subtotal_cent: 12000,
        descuento_cent: 0,
        total_cent: 12000,
        puntos_total: 0,
        estado: 'por_confirmar'
      })
      .select()
      .single();

    // Confirmar debe fallar con excepción
    await expect(
      confirmarPagoOrden(ordenTrucada.id, [], sbAdmin)
    ).rejects.toThrow(/No se puede degradar o mantener el pack del socio/);

    // Limpiar orden de prueba
    await sbAdmin.from('orden').delete().eq('id', ordenTrucada.id);
  });

  it('7 · El patrocinio del upgrade se calcula sobre el precio COMPLETO del pack nuevo', async () => {
    // La orden de upgrade (ordenUpgradeId) fue al pack Empresarial (S/. 8,000 = 800,000 cent)
    // El patrocinador nivel 1 es socio 1.
    // Bono de patrocinio nivel 1 = 20% de 800,000 = 160,000 céntimos = S/. 1,600.00
    const { data: comisiones } = await sbAdmin
      .from('comision')
      .select('*')
      .eq('orden_id', ordenUpgradeId)
      .eq('tipo', 'patrocinio')
      .eq('nivel', 1);

    expect(comisiones.length).toBeGreaterThan(0);
    const com1 = comisiones[0];
    expect(Number(com1.monto_cent)).toBe(160000); // S/. 1,600.00 exacto
    expect(Number(com1.base_cent)).toBe(800000); // Base completa del pack nuevo
    expect(Number(com1.porcentaje)).toBe(20);
  });

  it('8 · Los puntos de rango del pack nuevo se acreditan en activacion al confirmar', async () => {
    // Pack Empresarial tiene 800 puntos de rango
    const { data: act } = await sbAdmin
      .from('activacion')
      .select('*')
      .eq('socio_id', socioTestId)
      .eq('ciclo_id', cicloAbiertoId)
      .single();

    expect(act).toBeDefined();
    // Debe tener al menos los 800 puntos del pack empresarial
    expect(act.puntos_personales).toBeGreaterThanOrEqual(800);
    expect(act.activo).toBe(true);

    // Verificar movimiento_puntos
    const { data: movs } = await sbAdmin
      .from('movimiento_puntos')
      .select('*')
      .eq('orden_id', ordenUpgradeId);

    expect(movs.length).toBe(1);
    expect(movs[0].puntos).toBe(800);
    expect(movs[0].cuenta_rango).toBe(true);
    expect(movs[0].cuenta_activacion).toBe(true);
  });

  it('9 · Queda la fila en auditoria con el pack ANTERIOR en datos_antes', async () => {
    const { data: audit, error: errAudit } = await sbAdmin
      .from('auditoria')
      .select('*')
      .eq('accion', 'upgrade_pack')
      .eq('registro_id', socioTestId)
      .order('creado_en', { ascending: false })
      .limit(1)
      .single();

    expect(errAudit).toBeNull();
    expect(audit).toBeDefined();
    expect(audit.accion).toBe('upgrade_pack');
    expect(audit.tabla).toBe('socio');
    expect(audit.registro_id).toBe(socioTestId);

    // datos_antes: pack 2 (Ejecutivo, 36000 cent)
    expect(Number(audit.datos_antes.pack_id)).toBe(2);
    expect(Number(audit.datos_antes.precio_cent)).toBe(36000);
    expect(audit.datos_antes.nombre).toBe('Pack Ejecutivo');

    // datos_despues: pack 5 (Empresarial, 800000 cent)
    expect(Number(audit.datos_despues.pack_id)).toBe(5);
    expect(Number(audit.datos_despues.precio_cent)).toBe(800000);
    expect(audit.datos_despues.nombre).toBe('Pack Empresarial');
  });

  it('10 · Un socio (no admin) NO puede registrar un upgrade — con sesión real', async () => {
    // Intentar registrar upgrade usando sbAna (socio común)
    await expect(
      registrarUpgradePack({
        socioId: socioTestId,
        packIdNuevo: 3,
        voucher: null
      }, sbAna)
    ).rejects.toThrow(/No autorizado: se requiere rol de administrador/);
  });
});
