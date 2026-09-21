import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { calcularImpactoOrden } from '../servicios/operacionAdmin';
import { limpiarSocioPrueba, sbService } from './limpiezaTest';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-17 · Baja de Socio con Reenganche de Red', () => {
  let sbAdmin;
  let sbAna;
  let cicloActivoId = 6;

  // Red de juguete:
  // A (patrocinado por 1)
  // └── B (patrocinado por A)
  //      ├── C (patrocinado por B)
  //      │    └── E (patrocinado por C)
  //      └── D (patrocinado por B)
  let socioA;
  let socioB;
  let socioC;
  let socioD;
  let socioE;

  const sociosCreadosIds = [];
  const emailsToy = [];
  const ordenesCreadasIds = [];
  const comisionesCreadasIds = [];
  const walletMovimientosIds = [];
  const motivoBaja = 'Incumplimiento grave de politicas y renuncia expresa';

  beforeAll(async () => {
    // 1. Clientes Supabase
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-baja', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-baja', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    const { data: cAbierto } = await sbAdmin
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (cAbierto) cicloActivoId = cAbierto.id;

    // 2. Sembrar red de juguete
    const rnd = Math.floor(100000 + Math.random() * 899999);

    async function crearSocioToy(patrocinadorId, etiqueta, index) {
      const doc = `94${rnd}${index}`;
      const email = `toy_${etiqueta.toLowerCase()}_${rnd}@ejemplo.test`;
      const { data, error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: patrocinadorId,
        p_pack_id: 3, // GOLD (habilita hasta 10 niveles residual)
        p_tipo_documento: 'DNI',
        p_documento: doc,
        p_nombres: `TOY_${etiqueta}`,
        p_apellidos: 'RED_PRUEBA',
        p_email: email,
        p_telefono: '999111222',
        p_fecha_nacimiento: '1992-05-15',
        p_direccion: 'Calle Juguete 123',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BCP', numero_operacion: `OP-TOY-${etiqueta}-${rnd}`, monto_cent: 120000 }
      });
      if (error) throw new Error(`Error al crear socio ${etiqueta}: ${error.message}`);

      sociosCreadosIds.push(data.socio_id);
      emailsToy.push(email);
      ordenesCreadasIds.push(data.orden_id);

      // Confirmar pago de afiliación
      await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: data.orden_id,
        p_comisiones: []
      });

      return data;
    }

    socioA = await crearSocioToy(1, 'A', 1);
    socioB = await crearSocioToy(socioA.socio_id, 'B', 2);
    socioC = await crearSocioToy(socioB.socio_id, 'C', 3);
    socioD = await crearSocioToy(socioB.socio_id, 'D', 4);
    socioE = await crearSocioToy(socioC.socio_id, 'E', 5);

    // 3. Activar a A, B y C para que califiquen a comisiones
    await sbAdmin.from('activacion').upsert([
      { socio_id: socioA.socio_id, ciclo_id: cicloActivoId, activo: true, puntos_personales: 100 },
      { socio_id: socioB.socio_id, ciclo_id: cicloActivoId, activo: true, puntos_personales: 100 },
      { socio_id: socioC.socio_id, ciclo_id: cicloActivoId, activo: true, puntos_personales: 100 }
    ]);

    // 4. Dotar a B de comisiones históricas y saldo en billetera para verificar integridad financiera
    // Nota (TAREA-44/45): Se usa sbService (service_role) para preparar el escenario financiero
    // ya que comision y wallet_movimiento son inmutables para authenticated.
    const { data: comB } = await sbService
      .from('comision')
      .insert({
        ciclo_id: cicloActivoId,
        beneficiario_id: socioB.socio_id,
        generador_id: socioC.socio_id,
        orden_id: socioC.orden_id,
        tipo: 'patrocinio',
        nivel: 1,
        base_cent: 120000,
        porcentaje: 20.0,
        monto_cent: 24000,
        estado: 'confirmada',
        detalle: { nota: 'Comision historica previa a la baja' }
      })
      .select('id')
      .single();
    if (comB) comisionesCreadasIds.push(comB.id);

    const { data: movB, error: errMovB } = await sbService
      .from('wallet_movimiento')
      .insert({
        socio_id: socioB.socio_id,
        ciclo_id: cicloActivoId,
        tipo: 'abono',
        concepto: 'Abono historico comision previa a la baja',
        monto_cent: 24000,
        saldo_despues_cent: 24000
      })
      .select('id')
      .single();
    if (errMovB) throw new Error(`Fallo al insertar wallet_movimiento para socio B: ${errMovB.message}`);
    if (movB) walletMovimientosIds.push(movB.id);

    // 5. Verificar red previa en seco antes de ejecutar la baja
    const { data: ancEPre } = await sbAdmin
      .from('red_ancestro')
      .select('ancestro_id, nivel')
      .eq('descendiente_id', socioE.socio_id)
      .order('nivel', { ascending: true });

    // En la red previa: E tiene a C en nivel 1, a B en nivel 2, a A en nivel 3
    const ancMapPre = new Map(ancEPre.map(r => [r.ancestro_id, r.nivel]));
    expect(ancMapPre.get(socioC.socio_id)).toBe(1);
    expect(ancMapPre.get(socioB.socio_id)).toBe(2);
    expect(ancMapPre.get(socioA.socio_id)).toBe(3);

    // 6. EJECUTAR LA BAJA DE B (Transacción única atómica)
    const { data: resBaja, error: errBaja } = await sbAdmin.rpc('fn_dar_de_baja_socio', {
      p_socio_id: socioB.socio_id,
      p_motivo: motivoBaja
    });
    if (errBaja) throw new Error(`Fallo al ejecutar baja de socio B: ${errBaja.message}`);
    expect(resBaja.exito).toBe(true);
  });

  afterAll(async () => {
    // Limpieza estricta y segura por IDs específicos
    if (ordenesCreadasIds.length > 0) {
      await sbAdmin.from('comision').delete().in('orden_id', ordenesCreadasIds);
      await sbAdmin.from('movimiento_puntos').delete().in('orden_id', ordenesCreadasIds);
      await sbAdmin.from('voucher').delete().in('orden_id', ordenesCreadasIds);
      await sbAdmin.from('envio').delete().in('orden_id', ordenesCreadasIds);
      await sbAdmin.from('orden_detalle').delete().in('orden_id', ordenesCreadasIds);
      await sbAdmin.from('orden').delete().in('id', ordenesCreadasIds);
    }

    if (comisionesCreadasIds.length > 0) {
      await sbAdmin.from('comision').delete().in('id', comisionesCreadasIds);
    }
    if (walletMovimientosIds.length > 0) {
      await sbAdmin.from('wallet_movimiento').delete().in('id', walletMovimientosIds);
    }

    if (sociosCreadosIds.length > 0) {
      await sbAdmin.from('comision').delete().in('beneficiario_id', sociosCreadosIds);
      await sbAdmin.from('comision').delete().in('generador_id', sociosCreadosIds);
      await sbAdmin.from('wallet_movimiento').delete().in('socio_id', sociosCreadosIds);
      await sbAdmin.from('movimiento_puntos').delete().in('socio_id', sociosCreadosIds);
      await sbAdmin.from('activacion').delete().in('socio_id', sociosCreadosIds);
      await sbAdmin.from('auditoria').delete().eq('tabla', 'socio').in('registro_id', sociosCreadosIds);
      await sbAdmin.from('red_ancestro').delete().in('descendiente_id', sociosCreadosIds);
      await sbAdmin.from('red_ancestro').delete().in('ancestro_id', sociosCreadosIds);

      // Borrar de hojas a raíz (E, D, C, B, A) para respetar integridad referencial de patrocinador_id
      const ordenInverso = [
        socioE?.socio_id,
        socioD?.socio_id,
        socioC?.socio_id,
        socioB?.socio_id,
        socioA?.socio_id
      ].filter(Boolean);

      for (const id of ordenInverso) {
        await sbAdmin.from('socio').delete().eq('id', id);
      }

      for (const em of emailsToy) {
        await limpiarSocioPrueba(em);
      }
    }
  }, 30000);

  it('1 · C y D quedan con patrocinador_id = A', async () => {
    const { data: socios, error } = await sbAdmin
      .from('socio')
      .select('id, patrocinador_id')
      .in('id', [socioC.socio_id, socioD.socio_id]);

    expect(error).toBeNull();
    expect(socios).toHaveLength(2);
    for (const s of socios) {
      expect(s.patrocinador_id).toBe(socioA.socio_id);
    }
  });

  it('2 · red_ancestro de C: A nivel 1 (antes: B=1, A=2)', async () => {
    const { data: ancC, error } = await sbAdmin
      .from('red_ancestro')
      .select('ancestro_id, nivel')
      .eq('descendiente_id', socioC.socio_id);

    expect(error).toBeNull();
    const mapa = new Map(ancC.map(r => [r.ancestro_id, r.nivel]));
    expect(mapa.get(socioA.socio_id)).toBe(1);
    expect(mapa.has(socioB.socio_id)).toBe(false);
  });

  it('3 · red_ancestro de D: A nivel 1', async () => {
    const { data: ancD, error } = await sbAdmin
      .from('red_ancestro')
      .select('ancestro_id, nivel')
      .eq('descendiente_id', socioD.socio_id);

    expect(error).toBeNull();
    const mapa = new Map(ancD.map(r => [r.ancestro_id, r.nivel]));
    expect(mapa.get(socioA.socio_id)).toBe(1);
    expect(mapa.has(socioB.socio_id)).toBe(false);
  });

  it('4 · red_ancestro de E: C nivel 1, A nivel 2 (antes: C=1, B=2, A=3)', async () => {
    // 🔴 ESTA ES LA PRUEBA QUE IMPORTA: A E nadie lo tocó y su cadena cambió entera
    const { data: ancE, error } = await sbAdmin
      .from('red_ancestro')
      .select('ancestro_id, nivel')
      .eq('descendiente_id', socioE.socio_id);

    expect(error).toBeNull();
    const mapa = new Map(ancE.map(r => [r.ancestro_id, r.nivel]));
    expect(mapa.get(socioC.socio_id)).toBe(1);
    expect(mapa.get(socioA.socio_id)).toBe(2);
    expect(mapa.has(socioB.socio_id)).toBe(false);
  });

  it('5 · No queda NINGUNA fila en red_ancestro con ancestro_id = B', async () => {
    const { count, error } = await sbAdmin
      .from('red_ancestro')
      .select('*', { count: 'exact', head: true })
      .eq('ancestro_id', socioB.socio_id);

    expect(error).toBeNull();
    expect(count).toBe(0);

    const { count: countDesc } = await sbAdmin
      .from('red_ancestro')
      .select('*', { count: 'exact', head: true })
      .eq('descendiente_id', socioB.socio_id);
    expect(countDesc).toBe(0);
  });

  it('6 · B queda con estado = "baja" y su motivo guardado', async () => {
    const { data: sB, error } = await sbAdmin
      .from('socio')
      .select('id, estado, patrocinador_id')
      .eq('id', socioB.socio_id)
      .single();

    expect(error).toBeNull();
    expect(sB.estado).toBe('baja');
    // Conserva patrocinador_id original para trazabilidad histórica
    expect(sB.patrocinador_id).toBe(socioA.socio_id);

    const { data: audit, error: errAudit } = await sbAdmin
      .from('auditoria')
      .select('datos_antes, accion')
      .eq('tabla', 'socio')
      .eq('registro_id', socioB.socio_id)
      .eq('accion', 'baja_con_reenganche')
      .order('creado_en', { ascending: false })
      .limit(1)
      .single();

    expect(errAudit).toBeNull();
    expect(audit.datos_antes.motivo).toBe(motivoBaja);
  });

  it('7 · Las comisiones de B siguen existiendo, con el mismo monto', async () => {
    const { data: comisiones, error } = await sbAdmin
      .from('comision')
      .select('monto_cent, estado')
      .eq('beneficiario_id', socioB.socio_id);

    expect(error).toBeNull();
    expect(comisiones.length).toBeGreaterThan(0);
    const total = comisiones.reduce((acc, c) => acc + Number(c.monto_cent), 0);
    expect(total).toBe(24000);
  });

  it('8 · El saldo de billetera de B no cambió', async () => {
    const { data: movimientos, error } = await sbAdmin
      .from('wallet_movimiento')
      .select('monto_cent')
      .eq('socio_id', socioB.socio_id);

    expect(error).toBeNull();
    const saldo = movimientos.reduce((acc, m) => acc + Number(m.monto_cent), 0);
    expect(saldo).toBe(24000);
  });

  it('9 · Se puede reconstruir el árbol anterior desde auditoria', async () => {
    const { data: audit, error } = await sbAdmin
      .from('auditoria')
      .select('datos_antes')
      .eq('tabla', 'socio')
      .eq('registro_id', socioB.socio_id)
      .eq('accion', 'baja_con_reenganche')
      .order('creado_en', { ascending: false })
      .limit(1)
      .single();

    expect(error).toBeNull();
    const dAntes = audit.datos_antes;
    expect(dAntes.socio_baja.id).toBe(socioB.socio_id);
    expect(dAntes.patrocinador_receptor.id).toBe(socioA.socio_id);
    expect(dAntes.frontales_ids).toContain(socioC.socio_id);
    expect(dAntes.frontales_ids).toContain(socioD.socio_id);
    expect(dAntes.descendientes_subarbol_ids).toContain(socioE.socio_id);
    expect(dAntes.red_ancestro_previa.length).toBeGreaterThan(0);
  });

  it('10 · Dar de baja al socio raíz (sin patrocinador) FALLA', async () => {
    const { error } = await sbAdmin.rpc('fn_dar_de_baja_socio', {
      p_socio_id: 1, // Socio raíz MG00001
      p_motivo: 'Intento de baja a la raiz'
    });

    expect(error).not.toBeNull();
    expect(error.message).toMatch(/No se puede dar de baja al socio raíz/i);
  });

  it('11 · Dar de baja sin motivo FALLA', async () => {
    const { error } = await sbAdmin.rpc('fn_dar_de_baja_socio', {
      p_socio_id: socioC.socio_id,
      p_motivo: '   '
    });

    expect(error).not.toBeNull();
    expect(error.message).toMatch(/El motivo de la baja es obligatorio/i);
  });

  it('12 · Un socio (no admin) NO puede dar de baja a nadie', async () => {
    const { error } = await sbAna.rpc('fn_dar_de_baja_socio', {
      p_socio_id: socioC.socio_id,
      p_motivo: 'Intento no autorizado'
    });

    expect(error).not.toBeNull();
    expect(error.message).toMatch(/No autorizado/i);
  });

  it('13 · Después de la baja, una recompra de E genera residual y el nivel 2 le toca a A, no a B', async () => {
    // Registrar pedido de recompra para el socio E (4 unidades producto 1 = 72 puntos)
    const { data: pedidoE, error: errPed } = await sbAdmin.rpc('fn_registrar_pedido_recompra', {
      p_socio_id: socioE.socio_id,
      p_items: [{ producto_id: 1, cantidad: 4 }],
      p_voucher: {
        banco: 'BCP',
        numero_operacion: `OP-REC-E-${Date.now()}`,
        monto_cent: 30000,
        fecha_deposito: '2026-11-10'
      },
      p_envio: null,
      p_canal: 'oficina'
    });

    expect(errPed).toBeNull();
    expect(pedidoE.orden_id).toBeDefined();
    ordenesCreadasIds.push(pedidoE.orden_id);

    // Obtener orden completa para calcular impacto
    const { data: ordenCompleta, error: errOrd } = await sbAdmin
      .from('orden')
      .select('*, socio:socio_id (id, nombres, apellidos, codigo, pack_id, pack:pack_id (codigo))')
      .eq('id', pedidoE.orden_id)
      .single();

    expect(errOrd).toBeNull();

    // Previsualizar comisiones calculadas con la nueva red
    const prev = await calcularImpactoOrden(ordenCompleta, sbAdmin);
    expect(prev.tipo).toBe('recompra');
    expect(prev.comisiones.length).toBeGreaterThan(0);

    // Confirmar pago de la orden con las comisiones calculadas
    const { data: conf, error: errConf } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
      p_orden_id: pedidoE.orden_id,
      p_comisiones: prev.comisiones
    });
    expect(errConf).toBeNull();
    expect(conf.exito).toBe(true);

    // Consultar comisiones generadas por la orden de E
    const { data: comisionesOrden, error: errCom } = await sbAdmin
      .from('comision')
      .select('beneficiario_id, nivel, monto_cent, tipo')
      .eq('orden_id', pedidoE.orden_id)
      .eq('tipo', 'residual');

    expect(errCom).toBeNull();
    expect(comisionesOrden.length).toBeGreaterThan(0);

    // Nivel 1 debe corresponder a C
    const comNivel1 = comisionesOrden.find(c => c.nivel === 1);
    expect(comNivel1).toBeDefined();
    expect(comNivel1.beneficiario_id).toBe(socioC.socio_id);

    // Nivel 2 debe corresponder a A (porque B fue dado de baja y C subió a A)
    const comNivel2 = comisionesOrden.find(c => c.nivel === 2);
    expect(comNivel2).toBeDefined();
    expect(comNivel2.beneficiario_id).toBe(socioA.socio_id);

    // B NO debe tener ninguna comisión generada por esta orden
    const comB = comisionesOrden.find(c => c.beneficiario_id === socioB.socio_id);
    expect(comB).toBeUndefined();
  });
});
