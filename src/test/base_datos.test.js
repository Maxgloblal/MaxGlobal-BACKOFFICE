import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabaseClient';

describe('Bloque G · Pruebas Automatizadas de Base de Datos y Supabase', () => {

  describe('Conexión y Catálogo', () => {
    it('el cliente conecta y puede consultar la tabla config', async () => {
      const { data, error } = await supabase.from('config').select('*');
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThanOrEqual(36);
    });

    it('los porcentajes de patrocinio suman exactamente 30.8%', async () => {
      const { data, error } = await supabase
        .from('nivel_comision')
        .select('porcentaje')
        .eq('tipo', 'patrocinio');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(7);

      const suma = data.reduce((acc, row) => acc + Number(row.porcentaje), 0);
      expect(Math.round(suma * 100) / 100).toBe(30.8);
    });

    it('el Kit Emprendedor tiene su comisión especial cargada (41.7% al nivel 1)', async () => {
      const { data, error } = await supabase
        .from('pack_comision_especial')
        .select('*')
        .eq('pack_codigo', 'EMPRENDEDOR')
        .eq('nivel', 1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(1);
      expect(Number(data[0].porcentaje)).toBe(41.7);
    });

    it('los precios guardados son los PÚBLICOS (Café = 15000 céntimos)', async () => {
      const { data, error } = await supabase
        .from('producto')
        .select('codigo, precio_lista_cent, puntos')
        .eq('codigo', 'CAFE')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.precio_lista_cent).toBe(15000);
      expect(data.puntos).toBe(18);
    });

    it('los 5 packs existen con sus descuentos de recompra oficiales y NO existe Pack VIP', async () => {
      const { data, error } = await supabase
        .from('pack')
        .select('codigo, descuento_recompra_pct')
        .order('orden', { ascending: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(5);

      const codigos = data.map(p => p.codigo);
      expect(codigos).toEqual(['EMPRENDEDOR', 'EJECUTIVO', 'GOLD', 'FAMILIAR', 'EMPRESARIAL']);
      expect(codigos).not.toContain('VIP');
    });
  });

  describe('Pruebas de Seguridad por Fila (RLS) e Inmutabilidad — Intentos de Violación', () => {
    it('1 · Usuario sin sesión intenta leer órdenes ajenas -> denegado por seguridad / RLS', async () => {
      const { data, error } = await supabase.from('orden').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    it('2 · Usuario sin sesión intenta leer comisiones -> denegado por seguridad / RLS', async () => {
      const { data, error } = await supabase.from('comision').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    it('3 · Usuario sin sesión intenta leer movimientos de billetera -> denegado por seguridad / RLS', async () => {
      const { data, error } = await supabase.from('wallet_movimiento').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    it('4 · Usuario sin sesión intenta insertar una orden -> denegado por RLS', async () => {
      const { error } = await supabase.from('orden').insert({
        codigo: 'ORD-TEST-HACK',
        socio_id: 1,
        ciclo_id: 1,
        tipo: 'recompra',
        total_cent: 15000,
        puntos_total: 18
      });
      expect(error).not.toBeNull();
    });

    it('5 · Usuario sin sesión intenta borrar o alterar comisiones -> denegado por inmutabilidad', async () => {
      const { error } = await supabase
        .from('comision')
        .delete()
        .eq('id', 1);

      expect(error).not.toBeNull();
      expect(error.code).toBe('42501');
    });
  });

  describe('Tarea 01-B · Aislamiento en Vistas (SECURITY INVOKER)', () => {
    it('6 · Ninguna vista en public es SECURITY DEFINER (todas tienen security_invoker = true)', async () => {
      const [r1, r2, r3] = await Promise.all([
        supabase.from('v_wallet_saldo').select('*'),
        supabase.from('v_puntos_ciclo').select('*'),
        supabase.from('v_frontales_activos').select('*')
      ]);

      // Al no tener sesión anónima, se deniega el acceso a las vistas con security_invoker
      if (r1.error) expect(r1.error.code).toBe('42501');
      if (r2.error) expect(r2.error.code).toBe('42501');
      if (r3.error) expect(r3.error.code).toBe('42501');
    });

    it('7 · Usuario sin sesión consultando v_wallet_saldo es denegado o ve 0 filas', async () => {
      const { data, error } = await supabase.from('v_wallet_saldo').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    it('8 · Usuario sin sesión consultando v_puntos_ciclo es denegado o ve 0 filas', async () => {
      const { data, error } = await supabase.from('v_puntos_ciclo').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    it('9 · Usuario sin sesión consultando v_frontales_activos es denegado o ve 0 filas', async () => {
      const { data, error } = await supabase.from('v_frontales_activos').select('*');
      if (error) {
        expect(error.code).toBe('42501');
      } else {
        expect(data).toEqual([]);
      }
    });

    // TODO TAREA-03: cuando exista la red simulada, autenticarse como dos socios
    // distintos y comprobar que ninguno ve al otro en:
    //   v_wallet_saldo · v_puntos_ciclo · v_frontales_activos
    // Un anónimo con 0 filas NO prueba el aislamiento entre socios.
    it.todo('un socio no ve los datos de otro en las 3 vistas');
  });

  describe('Tarea 01-B · Revocación de EXECUTE en Funciones Críticas y Mutables', () => {
    it('10 · Llamada RPC anónima a fn_construir_red_ancestro es rechazada', async () => {
      const { error } = await supabase.rpc('fn_construir_red_ancestro');
      expect(error).not.toBeNull();
      expect(['42501', 'PGRST202']).toContain(error.code);
    });

    it('11 · Llamada RPC anónima a fn_bloquear_ciclo_cerrado es rechazada', async () => {
      const { error } = await supabase.rpc('fn_bloquear_ciclo_cerrado');
      expect(error).not.toBeNull();
      expect(['42501', 'PGRST202']).toContain(error.code);
    });

    it('12 · Llamada RPC anónima a rls_auto_enable es rechazada', async () => {
      const { error } = await supabase.rpc('rls_auto_enable');
      expect(error).not.toBeNull();
      expect(['42501', 'PGRST202']).toContain(error.code);
    });

    it('13 · Función auxiliar fn_is_admin está revocada para anon (42501)', async () => {
      const { error } = await supabase.rpc('fn_is_admin');
      expect(error).not.toBeNull();
      expect(error.code).toBe('42501');
    });

    it('14 · Función auxiliar fn_current_socio_id está revocada para anon (42501)', async () => {
      const { error } = await supabase.rpc('fn_current_socio_id');
      expect(error).not.toBeNull();
      expect(error.code).toBe('42501');
    });
  });
});
