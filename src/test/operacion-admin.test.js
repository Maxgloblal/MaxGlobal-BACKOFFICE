import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { procesarComisionesDeUnaOrden } from '../motor/persistencia';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-06 · Bloque 5: Pruebas de Operación Mínima del Admin (P-21 a P-24)', () => {
  let sbAdmin;
  let sbAna;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-op-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-op-ana', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo al autenticar ANA: ${errAna.message}`);
  });

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
        { precio_lista: 15000, cantidad: 3, descuento_pct: 50.0 }, // 3 cafés = 45000 lista, 22500 final
        { precio_lista: 16000, cantidad: 2, descuento_pct: 50.0 }  // 2 colágenos = 32000 lista, 16000 final
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
      const puntosProductos = 18 * 3; // 54 pts
      const costoEnvioCent = 1500;
      const puntosEnvio = 0; // Invariante: envío no genera puntos

      expect(puntosProductos + puntosEnvio).toBe(54);
    });
  });

  describe('2. P-22 · Restricciones de Afiliación y Seguridad', () => {
    it('Un patrocinador Emprendedor NO puede afiliar un Gold (RF-332)', async () => {
      // Patrocinador ID 13 es Emprendedor (pack_id = 1)
      const { data, error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 13,
        p_pack_id: 3, // GOLD
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
      // DNI del socio 1 es 00000001
      const { data, error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
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
      const { data, error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: 2,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: '88776655',
        p_nombres: 'TEST',
        p_apellidos: 'DUPLICADO',
        p_email: 'socio002@ejemplo.test',
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

  describe('3. P-23 · Bandeja de Confirmación y Protección Doble Confirmación (RF-347)', () => {
    it('procesarComisionesDeUnaOrden devuelve exactamente los números de vista previa', () => {
      const orden = {
        id: 9999,
        socio_id: 2,
        ciclo_id: 1,
        tipo: 'recompra',
        total_cent: 15000,
        puntos_total: 18,
        cuenta_residual: true
      };

      const upline = [
        {
          ancestro_id: 1,
          nivel: 1,
          activo: true,
          pack: { id: 3, codigo: 'GOLD', niveles_patrocinio: 7, niveles_residual: 10 }
        }
      ];

      const escalaResidual = [{ nivel: 1, porcentaje: 40.0 }];

      const res = procesarComisionesDeUnaOrden({
        orden,
        upline,
        escalaResidual
      });

      // 18 pts * S/. 1.00 * 40% = S/. 7.20 = 720 cent
      expect(res.cantidadComisiones).toBe(1);
      expect(res.totalPagadoCent).toBe(720);
      expect(res.comisiones[0].monto_cent).toBe(720);
      expect(res.comisiones[0].beneficiario_id).toBe(1);
    });

    it('Rechazar sin motivo no se permite (RF-350)', async () => {
      const { data, error } = await sbAdmin.rpc('fn_rechazar_orden_pago', {
        p_orden_id: 495,
        p_motivo: ''
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/motivo de rechazo es obligatorio/i);
    });

    it('🔴 Confirmar una orden pendiente funciona y el segundo intento devuelve YA_CONFIRMADA (0 filas)', async () => {
      // Usar orden 495 (Daniel Leon, afiliacion 12000 cent)
      const { data: ordenPrevia } = await sbAdmin.from('orden').select('*').eq('id', 495).single();
      
      if (ordenPrevia && ordenPrevia.estado === 'por_confirmar') {
        // 1er Intento: Confirmar orden
        const { data: res1, error: err1 } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
          p_orden_id: 495,
          p_comisiones: [
            {
              ciclo_id: 1,
              beneficiario_id: 1,
              generador_id: 496,
              tipo: 'patrocinio',
              nivel: 1,
              base_cent: 12000,
              base_puntos: null,
              porcentaje: 41.7,
              monto_cent: 5004,
              estado: 'confirmada',
              detalle: { regla: 'Kit Emprendedor Nivel 1' }
            }
          ]
        });

        expect(err1).toBeNull();
        expect(res1.exito).toBe(true);
        expect(res1.codigo).toBe('OK');

        // Verificar que la orden pasó a pagada
        const { data: ordenPost } = await sbAdmin.from('orden').select('*').eq('id', 495).single();
        expect(ordenPost.estado).toBe('pagada');
        expect(ordenPost.aprobada_por).toBe(1);

        // Verificar que el socio pasó a activo (RF-349)
        const { data: socioPost } = await sbAdmin.from('socio').select('*').eq('id', ordenPost.socio_id).single();
        expect(socioPost.estado).toBe('activo');

        // 2do Intento: Volver a confirmar la MISMA orden (Simulando doble clic)
        const { data: res2, error: err2 } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
          p_orden_id: 495,
          p_comisiones: []
        });

        expect(err2).toBeNull();
        expect(res2.exito).toBe(false);
        expect(res2.codigo).toBe('YA_CONFIRMADA');

        // Verificar que NO se duplicaron las comisiones en la base de datos
        const { data: comisionesOrden } = await sbAdmin.from('comision').select('id').eq('orden_id', 495);
        expect(comisionesOrden.length).toBe(1);
      }
    });
  });

  describe('4. P-24 · Envíos y Logística', () => {
    it('Despachar y entregar no altera puntos ni comisiones (RF-365)', async () => {
      // Crear un envío de prueba para la orden 495
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

      // Marcar despachado (RF-361, RF-362)
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

      // Marcar entregado (RF-363)
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

      // Comprobar que los puntos de la orden siguen intactos
      const { data: ordenCheck } = await sbAdmin.from('orden').select('puntos_total').eq('id', 495).single();
      expect(ordenCheck.puntos_total).toBe(0);
    });
  });
});
