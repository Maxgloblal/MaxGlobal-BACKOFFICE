import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { obtenerSociosPorRango, cargarRangos, obtenerListaSociosAdmin } from '../servicios/operacionAdmin';

// TAREA-72 (H2): Leer credenciales dinámicamente de .env.e2e.local (base DEMO), sin llaves escritas a mano
function obtenerCredencialesE2E() {
  const envFile = path.resolve(process.cwd(), '.env.e2e.local');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
    raw.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) envVars[match[1]] = match[2].trim();
    });
    if (envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY) {
      return {
        url: envVars.VITE_SUPABASE_URL,
        key: envVars.VITE_SUPABASE_ANON_KEY
      };
    }
  }

  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    return {
      url: process.env.VITE_SUPABASE_URL,
      key: process.env.VITE_SUPABASE_ANON_KEY
    };
  }

  throw new Error('No se encontraron las variables de entorno de DEMO en .env.e2e.local');
}

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = obtenerCredencialesE2E();

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

  describe('4. Auditoría TAREA-72: H3 (Filtro por Rango en P-27) y H5 (Ciclo abierto persistido)', () => {
    it('H3: cargarRangos devuelve lista de rangos activos ordenados por orden ASC', async () => {
      const rangos = await cargarRangos(sbAdmin);
      expect(Array.isArray(rangos)).toBe(true);
      expect(rangos.length).toBeGreaterThanOrEqual(8);
      for (let i = 0; i < rangos.length - 1; i++) {
        expect(rangos[i].orden).toBeLessThan(rangos[i + 1].orden);
      }
    });

    it('H3: obtenerListaSociosAdmin filtra correctamente por rangoId', async () => {
      const resJade = await obtenerListaSociosAdmin({ rangoId: 1, limite: 10 }, sbAdmin);
      expect(resJade.socios).toBeDefined();
      if (resJade.socios.length > 0) {
        resJade.socios.forEach(s => {
          expect(s.rango_honorifico_id).toBe(1);
          expect(s.rango?.nombre).toBe('Jade');
        });
      }
    });

    it('H5: si un ciclo ya tiene filas en rango_ciclo, obtenerSociosPorRango no falla y las lee de rango_ciclo', async () => {
      const data = await obtenerSociosPorRango(3, sbAdmin);
      expect(data.socios.length).toBe(8);
      expect(data.tipoVista).toBe('cerrado');
    });
  });
});
