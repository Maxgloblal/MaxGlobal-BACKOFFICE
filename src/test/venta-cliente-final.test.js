import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  registrarPedidoRecompra,
  confirmarPagoOrden,
  calcularImpactoOrden
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-16 · Venta a Cliente Final a Precio de Lista Oficial', () => {
  let sbAdmin;
  let cicloActivoId = 6;
  const ordenesCreadas = [];
  let activacionPreviaBruno = null;
  let activacionPreviaMaximo = null;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t16', persistSession: false, autoRefreshToken: false }
    });

    const { error: errLogin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errLogin) throw new Error(`Fallo login Admin: ${errLogin.message}`);

    const { data: cAbierto } = await sbAdmin
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (cAbierto) cicloActivoId = cAbierto.id;

    // Respaldar estado previo de activacion para socios 1 y 3 en este ciclo
    const { data: actBruno } = await sbAdmin
      .from('activacion')
      .select('*')
      .eq('socio_id', 3)
      .eq('ciclo_id', cicloActivoId)
      .maybeSingle();
    activacionPreviaBruno = actBruno;

    const { data: actMax } = await sbAdmin
      .from('activacion')
      .select('*')
      .eq('socio_id', 1)
      .eq('ciclo_id', cicloActivoId)
      .maybeSingle();
    activacionPreviaMaximo = actMax;
  });

  afterAll(async () => {
    // 🔴 Limpieza rigurosa por ID específico para no dejar órdenes ni datos huérfanos
    if (ordenesCreadas.length > 0) {
      // 1. Comisiones
      await sbAdmin.from('comision').delete().in('orden_id', ordenesCreadas);
      // 2. Movimiento puntos
      await sbAdmin.from('movimiento_puntos').delete().in('orden_id', ordenesCreadas);
      // 3. Envío
      await sbAdmin.from('envio').delete().in('orden_id', ordenesCreadas);
      // 4. Pago
      await sbAdmin.from('pago').delete().in('orden_id', ordenesCreadas);
      // 5. Voucher
      await sbAdmin.from('voucher').delete().in('orden_id', ordenesCreadas);
      // 6. Orden detalle
      await sbAdmin.from('orden_detalle').delete().in('orden_id', ordenesCreadas);
      // 7. Orden
      await sbAdmin.from('orden').delete().in('id', ordenesCreadas);
    }

    // Restaurar estado de activación en el ciclo
    if (activacionPreviaBruno) {
      await sbAdmin
        .from('activacion')
        .update({
          puntos_personales: activacionPreviaBruno.puntos_personales,
          activo: activacionPreviaBruno.activo
        })
        .eq('socio_id', 3)
        .eq('ciclo_id', cicloActivoId);
    } else {
      await sbAdmin
        .from('activacion')
        .delete()
        .eq('socio_id', 3)
        .eq('ciclo_id', cicloActivoId);
    }

    if (activacionPreviaMaximo) {
      await sbAdmin
        .from('activacion')
        .update({
          puntos_personales: activacionPreviaMaximo.puntos_personales,
          activo: activacionPreviaMaximo.activo
        })
        .eq('socio_id', 1)
        .eq('ciclo_id', cicloActivoId);
    } else {
      await sbAdmin
        .from('activacion')
        .delete()
        .eq('socio_id', 1)
        .eq('ciclo_id', cicloActivoId);
    }

    // Comprobación de integridad: ninguna orden creada por esta suite quedó en base de datos
    const { data: ordenesRestantes } = await sbAdmin
      .from('orden')
      .select('id')
      .in('id', ordenesCreadas);
    expect(ordenesRestantes || []).toHaveLength(0);

    // Las 1,055 órdenes históricas existentes siguen intactas
    const { count: countHistoricas } = await sbAdmin
      .from('orden')
      .select('*', { count: 'exact', head: true })
      .lte('id', 1367);
    expect(countHistoricas).toBe(1055);
  });

  // PRUEBA 1 y PRUEBA 4
  it('1 · Con la casilla MARCADA, 4 cafés cuestan S/. 600.00 (subtotal 60000 · descuento 0 · total 60000)', async () => {
    const res = await registrarPedidoRecompra({
      socioId: 3, // Bruno Rojas (Socio Gold)
      lineas: [{ producto_id: 1, cantidad: 4 }], // 4 cafés
      voucher: {
        banco: 'BCP',
        numero_operacion: 'T16-CLIENTE-001',
        monto_cent: 60000
      },
      envio: {
        direccion: 'Av. Primavera 123',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Santiago de Surco',
        destinatario: 'Carlos Cliente Final'
      },
      tipoVenta: 'cliente',
      sbClient: sbAdmin
    });

    expect(res).toBeDefined();
    expect(res.orden_id).toBeDefined();
    ordenesCreadas.push(res.orden_id);

    // Verificaciones financieras de la regla de precio público
    expect(res.subtotal_cent).toBe(60000); // 4 * 15000 = S/. 600.00
    expect(res.descuento_cent).toBe(0);     // 0% descuento
    expect(res.total_cent).toBe(60000);     // S/. 600.00
    expect(res.puntos_total).toBe(72);      // 4 * 18 = 72 puntos
  });

  // PRUEBA 4
  it('4 · La orden queda con tipo_venta = "cliente"', async () => {
    const ordClienteId = ordenesCreadas[0];
    const { data: ordenDb } = await sbAdmin
      .from('orden')
      .select('id, codigo, tipo, tipo_venta, subtotal_cent, descuento_cent, total_cent, puntos_total')
      .eq('id', ordClienteId)
      .single();

    expect(ordenDb.tipo).toBe('recompra');
    expect(ordenDb.tipo_venta).toBe('cliente');
    expect(ordenDb.subtotal_cent).toBe(60000);
    expect(ordenDb.descuento_cent).toBe(0);
    expect(ordenDb.total_cent).toBe(60000);
    expect(ordenDb.puntos_total).toBe(72);

    // Verificar en orden_detalle: precio_final_cent = precio_lista_cent y descuento_pct = 0
    const { data: detalles } = await sbAdmin
      .from('orden_detalle')
      .select('precio_lista_cent, descuento_pct, precio_final_cent, puntos_unitario, puntos_subtotal')
      .eq('orden_id', ordClienteId);

    expect(detalles).toHaveLength(1);
    expect(detalles[0].precio_lista_cent).toBe(15000);
    expect(detalles[0].descuento_pct).toBe(0);
    expect(detalles[0].precio_final_cent).toBe(15000);
    expect(detalles[0].puntos_unitario).toBe(18);
    expect(detalles[0].puntos_subtotal).toBe(72);
  });

  // PRUEBA 2
  it('2 · Con la casilla SIN marcar y un socio Gold, los mismos 4 cafés cuestan S/. 300.00 (subtotal 60000 · descuento 30000 · total 30000)', async () => {
    const res = await registrarPedidoRecompra({
      socioId: 3, // Bruno Rojas (Socio Gold con 50% descuento)
      lineas: [{ producto_id: 1, cantidad: 4 }], // 4 cafés
      voucher: {
        banco: 'BCP',
        numero_operacion: 'T16-SOCIO-002',
        monto_cent: 30000
      },
      envio: {
        direccion: 'Av. Primavera 123',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Santiago de Surco',
        destinatario: 'Bruno Rojas'
      },
      tipoVenta: 'socio',
      sbClient: sbAdmin
    });

    expect(res).toBeDefined();
    expect(res.orden_id).toBeDefined();
    ordenesCreadas.push(res.orden_id);

    // Verificaciones financieras con el 50% de descuento del pack Gold
    expect(res.subtotal_cent).toBe(60000);
    expect(res.descuento_cent).toBe(30000);
    expect(res.total_cent).toBe(30000); // S/. 300.00
    expect(res.puntos_total).toBe(72);

    const { data: ordenDb } = await sbAdmin
      .from('orden')
      .select('id, tipo, tipo_venta, subtotal_cent, descuento_cent, total_cent')
      .eq('id', res.orden_id)
      .single();

    expect(ordenDb.tipo_venta).toBe('socio');
    expect(ordenDb.subtotal_cent).toBe(60000);
    expect(ordenDb.descuento_cent).toBe(30000);
    expect(ordenDb.total_cent).toBe(30000);

    // Verificación de orden_detalle
    const { data: detalles } = await sbAdmin
      .from('orden_detalle')
      .select('precio_lista_cent, descuento_pct, precio_final_cent, puntos_unitario, puntos_subtotal')
      .eq('orden_id', res.orden_id);

    expect(detalles).toHaveLength(1);
    expect(detalles[0].precio_lista_cent).toBe(15000);
    expect(detalles[0].descuento_pct).toBe(50);
    expect(detalles[0].precio_final_cent).toBe(7500);
    expect(detalles[0].puntos_unitario).toBe(18);
    expect(detalles[0].puntos_subtotal).toBe(72);
  });

  // PRUEBA 3
  it('3 · Los puntos son 72 en los DOS casos y la venta a cliente da exactamente el doble que a socio Gold', async () => {
    // Tomamos las dos órdenes creadas previamente
    expect(ordenesCreadas.length).toBeGreaterThanOrEqual(2);
    const ordClienteId = ordenesCreadas[0];
    const ordSocioId = ordenesCreadas[1];

    const { data: ordCliente } = await sbAdmin.from('orden').select('*').eq('id', ordClienteId).single();
    const { data: ordSocio } = await sbAdmin.from('orden').select('*').eq('id', ordSocioId).single();

    // Los puntos son 72 en ambos casos (el café siempre da 18 pts unitarios)
    expect(ordCliente.puntos_total).toBe(72);
    expect(ordSocio.puntos_total).toBe(72);

    // El cobro al cliente final es exactamente el doble (S/. 600 vs S/. 300)
    expect(ordCliente.total_cent).toBe(ordSocio.total_cent * 2);
    expect(ordCliente.total_cent).toBe(60000);
    expect(ordSocio.total_cent).toBe(30000);
  });

  // PRUEBA 5
  it('5 · Los puntos van al socio de la orden y lo activan, igual que una recompra normal', async () => {
    // Usamos la orden ordClienteId (id = ordenesCreadas[0])
    const ordClienteId = ordenesCreadas[0];

    // Confirmamos el pago de la orden de cliente
    const confirmacion = await confirmarPagoOrden(ordClienteId, [], sbAdmin);
    expect(confirmacion.exito).toBe(true);

    // 1. Verificar movimiento de puntos
    const { data: movPuntos } = await sbAdmin
      .from('movimiento_puntos')
      .select('*')
      .eq('orden_id', ordClienteId);

    expect(movPuntos).toHaveLength(1);
    expect(movPuntos[0].socio_id).toBe(3); // Bruno Rojas
    expect(movPuntos[0].puntos).toBe(72);
    expect(movPuntos[0].cuenta_activacion).toBe(true);
    expect(movPuntos[0].cuenta_residual).toBe(true);
    expect(movPuntos[0].cuenta_rango).toBe(true);

    // 2. Verificar activación del socio en el ciclo (72 pts >= 70 pts umbral)
    const { data: actSocio } = await sbAdmin
      .from('activacion')
      .select('*')
      .eq('socio_id', 3)
      .eq('ciclo_id', cicloActivoId)
      .single();

    expect(actSocio).toBeDefined();
    expect(actSocio.activo).toBe(true);
    expect(actSocio.puntos_personales).toBeGreaterThanOrEqual(72);
  });

  // PRUEBA 6
  it('6 · Si el socio de la orden es MG00001, no se genera ninguna comisión (no tiene a nadie arriba)', async () => {
    const res = await registrarPedidoRecompra({
      socioId: 1, // MG00001 (Máximo, la raíz de la red)
      lineas: [{ producto_id: 1, cantidad: 4 }],
      voucher: {
        banco: 'BCP',
        numero_operacion: 'T16-MAXIMO-003',
        monto_cent: 60000
      },
      envio: {
        direccion: 'Sede Central Max Global',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        destinatario: 'Cliente Directo Max'
      },
      tipoVenta: 'cliente',
      sbClient: sbAdmin
    });

    expect(res.orden_id).toBeDefined();
    ordenesCreadas.push(res.orden_id);

    // Calculamos el impacto o comisiones multinivel hacia arriba
    const impacto = await calcularImpactoOrden(res.orden_id, sbAdmin);
    expect(impacto).toBeDefined();
    expect(impacto.comisiones).toBeDefined();
    // MG00001 no tiene upline (nadie arriba), por lo que no genera comisiones multinivel
    expect(impacto.comisiones.length).toBe(0);

    // Confirmamos la orden con 0 comisiones
    const confirmacion = await confirmarPagoOrden(res.orden_id, [], sbAdmin);
    expect(confirmacion.exito).toBe(true);

    // Verificar en tabla comision que ninguna comisión fue insertada para esta orden
    const { data: comisionesDb } = await sbAdmin
      .from('comision')
      .select('id')
      .eq('orden_id', res.orden_id);

    expect(comisionesDb).toHaveLength(0);
  });

  // PRUEBA 7
  it('7 · Las 1,055 órdenes existentes siguen con tipo_venta = "socio"', async () => {
    // 1. Conteo exacto de las 1,055 órdenes existentes en base de datos
    const { count: countHistoricas, error: errCount } = await sbAdmin
      .from('orden')
      .select('*', { count: 'exact', head: true })
      .lte('id', 1367)
      .eq('tipo_venta', 'socio');

    expect(errCount).toBeNull();
    expect(countHistoricas).toBe(1055);

    // 2. Verificar que ninguna de las 1,055 órdenes históricas fue modificada
    const { count: countHistoricasNoSocio } = await sbAdmin
      .from('orden')
      .select('*', { count: 'exact', head: true })
      .lte('id', 1367)
      .neq('tipo_venta', 'socio');

    expect(countHistoricasNoSocio).toBe(0);

    // 3. Inspeccionar páginas de registros históricos
    const { data: p1 } = await sbAdmin.from('orden').select('id, tipo_venta').lte('id', 1367).range(0, 999);
    const { data: p2 } = await sbAdmin.from('orden').select('id, tipo_venta').lte('id', 1367).range(1000, 1999);
    const historicas = [...(p1 || []), ...(p2 || [])];
    expect(historicas).toHaveLength(1055);
    expect(historicas.every(o => o.tipo_venta === 'socio')).toBe(true);
  });
});
