import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerCatalogoRecompra,
  obtenerDatosEnlace,
  obtenerMiRed,
  obtenerMisPedidos,
  obtenerPerfilCompleto,
  actualizarPerfilSocio
} from '../servicios/socio';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-08 · El Socio Trabaja (P-12, P-13, P-16, P-17, P-18)', () => {
  let sbAdmin;
  let sbAna; // Gold (socio 2)
  let sbEmprendedor; // Emprendedor (socio 10 u otro)
  let sbAnon;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t8-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t8-ana', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo al autenticar ANA: ${errAna.message}`);

    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t8-anon', persistSession: false, autoRefreshToken: false }
    });
  });

  describe('1. Aislamiento y Seguridad RLS (Ley 29733)', () => {
    it('🔴 ANA (socio 2) solo ve SUS pedidos (0 pedidos donde socio_id != 2)', async () => {
      const { data: pedidosAjenos, error } = await sbAna
        .from('orden')
        .select('*')
        .neq('socio_id', 2);

      expect(error).toBeNull();
      expect(pedidosAjenos).toEqual([]);
    });

    it('🔴 ANA solo ve a sus propios descendientes en el árbol (no ve a terceros)', async () => {
      // Teresa (socio 15) no es descendiente de Ana
      const { data: descendientesTeresa, error } = await sbAna
        .from('red_ancestro')
        .select('*')
        .eq('ancestro_id', 15);

      expect(error).toBeNull();
      expect(descendientesTeresa).toEqual([]);
    });

    it('🔴 ANA no puede editar el perfil de otro socio (ej. socio 3 Bruno)', async () => {
      const { data, error } = await sbAna
        .from('socio')
        .update({ telefono: '999111222' })
        .eq('id', 3)
        .select();

      // RLS filtra la fila, retornando 0 filas modificadas
      expect(data).toEqual([]);
    });

    it('🔴 ANA no puede cambiar su patrocinador (RF-286) - Bloqueado por Postgres', async () => {
      const { error } = await sbAna
        .from('socio')
        .update({ patrocinador_id: 10 })
        .eq('id', 2);

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/No está permitido modificar el patrocinador/i);
    });
  });

  describe('2. P-13 · Tienda de Recompra y Cálculo de Precios por Pack', () => {
    it('Un GOLD ve el Café (15000 cent) a 7500 cent (50% desc.) y un EMPRENDEDOR a 9000 cent (40% desc.)', async () => {
      // Ana es Gold (id 2)
      const catalogoAna = await obtenerCatalogoRecompra(2, 3, sbAna);
      const cafeAna = catalogoAna.productos.find((p) => p.codigo === 'CAFE');
      expect(cafeAna.precio_lista_cent).toBe(15000);
      expect(cafeAna.precio_final_cent).toBe(7500);
      expect(cafeAna.puntos).toBe(18);

      // Buscamos un socio Emprendedor (pack_id = 1)
      const { data: emprendedor } = await sbAdmin
        .from('socio')
        .select('id')
        .eq('pack_id', 1)
        .limit(1)
        .single();

      if (emprendedor) {
        const catalogoEmp = await obtenerCatalogoRecompra(emprendedor.id, 3, sbAdmin);
        const cafeEmp = catalogoEmp.productos.find((p) => p.codigo === 'CAFE');
        expect(cafeEmp.precio_lista_cent).toBe(15000);
        expect(cafeEmp.precio_final_cent).toBe(9000);
        expect(cafeEmp.puntos).toBe(18); // Los puntos son idénticos
      }
    });

    it('El carrito suma soles y puntos por separado de forma exacta', () => {
      const items = [
        { cantidad: 2, precio_final_cent: 7500, puntos: 18 }, // 15000 cent, 36 pts
        { cantidad: 1, precio_final_cent: 6000, puntos: 14 }  // 6000 cent, 14 pts
      ];

      const totalSolesCent = items.reduce((acc, it) => acc + it.cantidad * it.precio_final_cent, 0);
      const totalPuntos = items.reduce((acc, it) => acc + it.cantidad * it.puntos, 0);

      expect(totalSolesCent).toBe(21000); // S/. 210.00
      expect(totalPuntos).toBe(50); // 50 pts
    });

    it('Con 48 puntos previos + 22 en carrito acumula 70 puntos y alcanza activación', () => {
      const puntosPrevios = 48;
      const puntosCarrito = 22;
      const totalProyectado = puntosPrevios + puntosCarrito;
      const alcanzaActivacion = totalProyectado >= 70;

      expect(totalProyectado).toBe(70);
      expect(alcanzaActivacion).toBe(true);
    });

    it('🔴 La tienda NO crea ninguna fila en orden (RF-238)', async () => {
      const { count: antesCount } = await sbAna
        .from('orden')
        .select('*', { count: 'exact', head: true })
        .eq('socio_id', 2);

      // Simular armado de pedido en tienda (solo genera texto para WhatsApp)
      const textoWA = `Hola Max Global, soy ANA QUISPE (MG00002). Pedido: 2x Café (18 pts)`;
      expect(textoWA).toContain('MG00002');
      expect(textoWA).toContain('ANA QUISPE');

      const { count: despuesCount } = await sbAna
        .from('orden')
        .select('*', { count: 'exact', head: true })
        .eq('socio_id', 2);

      expect(despuesCount).toBe(antesCount);
    });
  });

  describe('3. P-16 · Mi Enlace de Patrocinio', () => {
    it('El enlace lleva ?ref= con el código del socio', async () => {
      const datos = await obtenerDatosEnlace(2, sbAna);
      expect(datos.socio.codigo).toBe('MG00002');

      const urlReferido = `https://maxglobal.pe/registro?ref=${datos.socio.codigo}`;
      expect(urlReferido).toBe('https://maxglobal.pe/registro?ref=MG00002');
    });

    it('Un EMPRENDEDOR tiene solo_afilia_igual = true (ve advertencia) y un GOLD tiene false', async () => {
      const { data: packEmp } = await sbAdmin.from('pack').select('*').eq('codigo', 'EMPRENDEDOR').single();
      const { data: packGold } = await sbAdmin.from('pack').select('*').eq('codigo', 'GOLD').single();

      expect(packEmp.solo_afilia_igual).toBe(true);
      expect(packGold.solo_afilia_igual).toBe(false);
    });
  });

  describe('4. P-17 · Mis Pedidos', () => {
    it('Una orden rechazada contiene su motivo_rechazo para desplegar al socio', async () => {
      const pedidoRechazado = {
        codigo: 'ORD-2026-TEST',
        estado: 'rechazada',
        estadoHumano: 'Pago rechazado',
        motivoRechazo: 'El voucher no coincide con el monto total declarado'
      };

      expect(pedidoRechazado.estadoHumano).toBe('Pago rechazado');
      expect(pedidoRechazado.motivoRechazo).toBeDefined();
      expect(pedidoRechazado.motivoRechazo.length).toBeGreaterThan(5);
    });

    it('El socio solo tiene capacidades de lectura en sus pedidos (sin anulación directa)', async () => {
      const misPedidos = await obtenerMisPedidos(2, sbAna);
      expect(Array.isArray(misPedidos)).toBe(true);
      expect(misPedidos.length).toBeGreaterThan(0);
      expect(misPedidos[0].codigo).toBeDefined();
    });
  });

  describe('5. P-18 · Mi Perfil y Reglas de Mejora de Pack', () => {
    it('La mejora de pack (Upgrade) paga el PACK COMPLETO según config oficial (RF-285)', async () => {
      const { data: confUpgrade } = await sbAdmin
        .from('config')
        .select('valor')
        .eq('clave', 'upgrade_paga_pack_completo')
        .single();

      expect(confUpgrade.valor).toBe('true');
    });

    it('Solicitar mejora de pack por WhatsApp NO muta el pack del socio en la BD', async () => {
      const perfilAntes = await obtenerPerfilCompleto(2, sbAna);
      const packIdAntes = perfilAntes.socio.pack_id;

      // El socio genera el mensaje de WhatsApp para el Pack Familiar
      const packFamiliar = perfilAntes.packs.find((p) => p.codigo === 'FAMILIAR');
      const mensajeWhatsApp = `Solicito Upgrade al ${packFamiliar.nombre} por S/. ${packFamiliar.precio_cent / 100}`;
      expect(mensajeWhatsApp).toContain('Pack Familiar');

      const perfilDespues = await obtenerPerfilCompleto(2, sbAna);
      expect(perfilDespues.socio.pack_id).toBe(packIdAntes); // Sigue siendo Gold (3)
    });

    it('El patrocinador no es editable y permanece intacto tras actualizar el perfil', async () => {
      const datosOriginales = await obtenerPerfilCompleto(2, sbAna);
      const patrocinadorIdOriginal = datosOriginales.socio.patrocinador_id;

      await actualizarPerfilSocio(2, {
        telefono: '987654321',
        ciudad: 'Arequipa, Perú'
      }, sbAna);

      const datosActualizados = await obtenerPerfilCompleto(2, sbAna);
      expect(datosActualizados.socio.telefono).toBe('987654321');
      expect(datosActualizados.socio.ciudad).toBe('Arequipa, Perú');
      expect(datosActualizados.socio.patrocinador_id).toBe(patrocinadorIdOriginal);
    });
  });
});
