import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { obtenerSociosPorRango } from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-71 · Servicio obtenerSociosPorRango (Admin)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t71-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (error) throw new Error(`Fallo de autenticación admin: ${error.message}`);
  });

  describe('1. Ciclo Cerrado (Datos persistidos en rango_ciclo con califica = true)', () => {
    it('obtiene los socios calificados de un ciclo cerrado (Ciclo 3) ordenados por rango y puntos', async () => {
      const data = await obtenerSociosPorRango(3, sbAdmin);

      expect(data.tipoVista).toBe('cerrado');
      expect(data.esCicloAbierto).toBe(false);
      expect(data.esHistorico).toBe(false);
      expect(data.avisoEnVivo).toBeNull();
      expect(data.ciclo).toBeDefined();
      expect(data.ciclo.id).toBe(3);
      expect(data.ciclo.estado).toBe('cerrado');

      // Debe haber exactamente 8 socios calificados en Ciclo 3
      expect(data.socios.length).toBe(8);

      // Verificación de orden: rango más alto primero, luego puntos computables DESC
      for (let i = 0; i < data.socios.length - 1; i++) {
        const actual = data.socios[i];
        const siguiente = data.socios[i + 1];
        if (actual.rango_orden === siguiente.rango_orden) {
          expect(actual.puntos_computables).toBeGreaterThanOrEqual(siguiente.puntos_computables);
        } else {
          expect(actual.rango_orden).toBeGreaterThan(siguiente.rango_orden);
        }
      }

      // El primer socio debe ser Plata (orden 3)
      expect(data.socios[0].rango_nombre).toBe('Plata');
      expect(data.socios[0].codigo).toBe('MG00020');
      expect(data.socios[0].puntos_computables).toBe(2070);
      expect(data.socios[0].bono_cent).toBe(20000);

      // Resumen de rangos: solo rangos definidos y activos ordenados por orden ASC
      expect(data.resumen.length).toBeGreaterThanOrEqual(8);
      for (let i = 0; i < data.resumen.length - 1; i++) {
        expect(data.resumen[i].orden).toBeLessThan(data.resumen[i + 1].orden);
      }

      // Conteo en Ciclo 3: Plata 1, Bronce 1, Jade 6
      const resumenPlata = data.resumen.find(r => r.nombre === 'Plata');
      const resumenBronce = data.resumen.find(r => r.nombre === 'Bronce');
      const resumenJade = data.resumen.find(r => r.nombre === 'Jade');
      expect(resumenPlata?.cantidad).toBe(1);
      expect(resumenBronce?.cantidad).toBe(1);
      expect(resumenJade?.cantidad).toBe(6);
    });

    it('maneja un ciclo cerrado sin calificados (Ciclo 6) devolviendo lista vacía y contadores en 0', async () => {
      const data = await obtenerSociosPorRango(6, sbAdmin);

      expect(data.tipoVista).toBe('cerrado');
      expect(data.socios).toHaveLength(0);
      expect(data.resumen.every(r => r.cantidad === 0)).toBe(true);
    });
  });

  describe('2. Ciclo Abierto (Cálculo en vivo mediante RPC con p_solo_calculo = true)', () => {
    it('calcula en vivo sin alterar rango_ciclo y muestra aviso correspondiente', async () => {
      // 1. Contar filas antes en rango_ciclo para ciclo 30 (abierto)
      const { count: countAntes } = await sbAdmin
        .from('rango_ciclo')
        .select('*', { count: 'exact', head: true })
        .eq('ciclo_id', 30);

      // 2. Invocar servicio
      const data = await obtenerSociosPorRango(30, sbAdmin);

      // 3. Contar filas después en rango_ciclo para ciclo 30
      const { count: countDespues } = await sbAdmin
        .from('rango_ciclo')
        .select('*', { count: 'exact', head: true })
        .eq('ciclo_id', 30);

      // INVARIANTE CRÍTICO: Las filas en rango_ciclo NO deben haber cambiado
      expect(countDespues).toBe(countAntes);

      expect(data.tipoVista).toBe('abierto');
      expect(data.esCicloAbierto).toBe(true);
      expect(data.esHistorico).toBe(false);
      expect(data.avisoEnVivo).toBe('Mes en curso: cálculo en vivo, puede cambiar hasta el cierre');
      expect(data.ciclo.estado).toBe('abierto');

      // Calificados en vivo
      expect(data.socios.length).toBeGreaterThanOrEqual(1);
      expect(data.socios[0]).toHaveProperty('codigo');
      expect(data.socios[0]).toHaveProperty('puntos_computables');
      expect(data.socios[0]).toHaveProperty('bono_cent');
    });
  });

  describe('3. Histórico (Rango más alto honorífico de socio)', () => {
    it('obtiene histórico con estructura limpia y sin puntos ni bonos', async () => {
      const data = await obtenerSociosPorRango('historico', sbAdmin);

      expect(data.tipoVista).toBe('historico');
      expect(data.esHistorico).toBe(true);
      expect(data.esCicloAbierto).toBe(false);
      expect(data.avisoEnVivo).toBeNull();
      expect(data.ciclo).toBeNull();
      expect(data.resumen).toBeDefined();

      // En histórico, los campos de puntos y bonos deben ser null
      data.socios.forEach(s => {
        expect(s.puntos_computables).toBeNull();
        expect(s.frontales_activos).toBeNull();
        expect(s.bono_cent).toBeNull();
        expect(s.rango_nombre).toBeDefined();
      });
    });
  });
});
