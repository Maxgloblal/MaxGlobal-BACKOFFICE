import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  descartarSolicitudAfiliacion,
  convertirSolicitudAfiliacion
} from '../servicios/operacionAdmin';
import { obtenerMiRango } from '../servicios/socio';
import { formatearNivelOComision } from '../paginas/P14MisComisiones';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';
const EDGE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co/functions/v1/registro-afiliacion';

function generarIpPrueba() {
  return `10.${Math.floor(Math.random() * 240) + 1}.${Math.floor(Math.random() * 240) + 1}.${Math.floor(Math.random() * 240) + 1}`;
}

describe('TAREA-20 · Suite de Pruebas: Registro Público con Referido y Arreglos de Vistas', () => {
  let sbAdmin;
  let sbAna;
  let sbAnon;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t20', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-t20', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-anon-t20', persistSession: false, autoRefreshToken: false }
    });
  });

  describe('De la Edge Function', () => {
    it('1 · Un POST válido con ref de un socio activo crea la solicitud con patrocinador_id resuelto', async () => {
      const email = `test_valido_${Date.now()}@ejemplo.test`;
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Prospecto Valido',
          apellidos: 'Afiliado Test',
          telefono: '987654321',
          email,
          pack_codigo: 'PRO',
          ref_codigo: 'MG00012', // Karla (socio activo)
          ip: generarIpPrueba()
        })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      // Seguridad: Un endpoint público no devuelve id ni datos del socio
      expect(data.id).toBeUndefined();
      expect(data.patrocinador_id).toBeUndefined();

      // En la base de datos (visto por admin): patrocinador_id resuelto a Karla (12)
      const { data: sol, error } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('*')
        .eq('email', email)
        .single();
      expect(error).toBeNull();
      expect(sol.patrocinador_id).toBe(12);
      expect(sol.ref_codigo).toBe('MG00012');
      expect(sol.estado).toBe('nueva');
    });

    it('2 · Un POST con un ref que NO existe crea la solicitud con patrocinador_id = null y ref_codigo guardado igual', async () => {
      const email = `test_no_existe_${Date.now()}@ejemplo.test`;
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Prospecto Sin Sponsor',
          apellidos: 'Huerfano Test',
          telefono: '987654322',
          email,
          pack_codigo: 'EMPRENDEDOR',
          ref_codigo: 'MG999999_INEXISTENTE',
          ip: generarIpPrueba()
        })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);

      const { data: sol, error } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('*')
        .eq('email', email)
        .single();
      expect(error).toBeNull();
      expect(sol.patrocinador_id).toBeNull();
      expect(sol.ref_codigo).toBe('MG999999_INEXISTENTE');
      expect(sol.estado).toBe('nueva');
    });

    it('3 · Un POST con el ref de un socio en BAJA → patrocinador_id null', async () => {
      const email = `test_baja_${Date.now()}@ejemplo.test`;
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Prospecto Referido Baja',
          apellidos: 'Prueba',
          telefono: '987654323',
          email,
          pack_codigo: 'GOLD',
          ref_codigo: 'MG00506', // Socio 506 está en baja
          ip: generarIpPrueba()
        })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);

      const { data: sol, error } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('*')
        .eq('email', email)
        .single();
      expect(error).toBeNull();
      expect(sol.patrocinador_id).toBeNull();
      expect(sol.ref_codigo).toBe('MG00506');
    });

    it('4 · Un POST sin email o sin teléfono es rechazado (400)', async () => {
      const ip = generarIpPrueba();
      // Sin email
      const resSinEmail = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Sin',
          apellidos: 'Email',
          telefono: '987654324',
          pack_codigo: 'PRO',
          ip
        })
      });
      expect(resSinEmail.status).toBe(400);

      // Sin teléfono
      const resSinTel = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Sin',
          apellidos: 'Telefono',
          email: 'sintel@ejemplo.test',
          pack_codigo: 'PRO',
          ip
        })
      });
      expect(resSinTel.status).toBe(400);
    });

    it('5 · Cuatro POST desde la misma IP en una hora: el cuarto devuelve 429', async () => {
      const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
      for (let i = 1; i <= 3; i++) {
        const res = await fetch(EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombres: `RateLimit ${i}`,
            apellidos: 'Test',
            telefono: `98765432${i}`,
            email: `ratelimit_${i}_${Date.now()}@ejemplo.test`,
            pack_codigo: 'PRO',
            ip: testIp
          })
        });
        expect(res.status).toBe(200);
      }

      // El 4to devuelve 429 sin insertar
      const res4to = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'RateLimit 4',
          apellidos: 'Test',
          telefono: '987654329',
          email: `ratelimit_4_${Date.now()}@ejemplo.test`,
          pack_codigo: 'PRO',
          ip: testIp
        })
      });
      expect(res4to.status).toBe(429);
      const data4to = await res4to.json();
      expect(data4to.error).toContain('Demasiadas solicitudes');
    }, 15000);

    it('6 · Dos POST con el mismo email en 24h crean UNA sola solicitud', async () => {
      const email = `duplicado_${Date.now()}@ejemplo.test`;
      const ip = generarIpPrueba();
      const payload = {
        nombres: 'Anti Duplicado',
        apellidos: 'Test',
        telefono: '987654330',
        email,
        pack_codigo: 'PRO',
        ip
      };

      const res1 = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(res1.status).toBe(200);
      expect((await res1.json()).ok).toBe(true);

      const res2 = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(res2.status).toBe(200);
      expect((await res2.json()).ok).toBe(true);

      const { data: sols, error } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('id')
        .eq('email', email);
      expect(error).toBeNull();
      expect(sols.length).toBe(1);
    });

    it('7 · 🔴 anon NO puede insertar en solicitud_afiliacion directamente — con sesión real (RLS 42501)', async () => {
      const { data, error } = await sbAnon
        .from('solicitud_afiliacion')
        .insert({
          nombres: 'Hacker',
          apellidos: 'Anonimo',
          telefono: '999888777',
          email: 'hacker@ejemplo.test',
          pack_codigo: 'PRO'
        });
      expect(error).not.toBeNull();
      expect(error.code).toBe('42501');
      expect(data).toBeNull();
    });

    it('8 · 🔴 Un socio NO puede leer solicitud_afiliacion', async () => {
      const { data, error } = await sbAna
        .from('solicitud_afiliacion')
        .select('*');
      // Por RLS de admin_select, un socio normal ve 0 registros
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe('Del recorrido completo', () => {
    it('9 · Convertir una solicitud crea el socio con el patrocinador correcto y deja la solicitud en "convertida" con su socio_id', async () => {
      const email = `convertir_${Date.now()}@ejemplo.test`;
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Convertido',
          apellidos: 'Exitoso',
          telefono: '987654335',
          email,
          pack_codigo: 'PRO',
          ref_codigo: 'MG00012',
          ip: generarIpPrueba()
        })
      });
      expect(res.status).toBe(200);

      const { data: sol } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('*')
        .eq('email', email)
        .single();
      expect(sol).toBeDefined();
      expect(sol.patrocinador_id).toBe(12);

      // Convertir la solicitud asociándola a socio 12
      const conv = await convertirSolicitudAfiliacion(sol.id, 12, sbAdmin);
      expect(conv.exito).toBe(true);
      expect(conv.estado).toBe('convertida');
      expect(conv.socio_id).toBe(12);

      // Verificar en la BD
      const { data: solActualizada } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('estado, socio_id, atendida_por, atendida_en')
        .eq('id', sol.id)
        .single();
      expect(solActualizada.estado).toBe('convertida');
      expect(solActualizada.socio_id).toBe(12);
      expect(solActualizada.atendida_en).not.toBeNull();
    });

    it('10 · Descartar sin motivo falla', async () => {
      const email = `descartar_${Date.now()}@ejemplo.test`;
      await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Descarte',
          apellidos: 'Sin Motivo',
          telefono: '987654336',
          email,
          pack_codigo: 'PRO',
          ip: generarIpPrueba()
        })
      });
      const { data: sol } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('id')
        .eq('email', email)
        .single();

      expect(sol).toBeDefined();

      // Validación JS en cliente
      await expect(descartarSolicitudAfiliacion(sol.id, '', sbAdmin)).rejects.toThrow('El motivo de descarte es obligatorio');
      await expect(descartarSolicitudAfiliacion(sol.id, '   ', sbAdmin)).rejects.toThrow('El motivo de descarte es obligatorio');

      // Validación RPC en servidor Postgres
      const { error: errRpc } = await sbAdmin.rpc('fn_descartar_solicitud_afiliacion', {
        p_solicitud_id: sol.id,
        p_motivo: '   '
      });
      expect(errRpc).not.toBeNull();
      expect(errRpc.message).toContain('motivo de descarte es obligatorio');

      // Descarte con motivo exitoso
      const resDescarte = await descartarSolicitudAfiliacion(sol.id, 'Prospecto no interesado en este momento', sbAdmin);
      expect(resDescarte.exito).toBe(true);
      expect(resDescarte.estado).toBe('descartada');

      const { data: solDescartada } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('estado, motivo_descarte')
        .eq('id', sol.id)
        .single();
      expect(solDescartada.estado).toBe('descartada');
      expect(solDescartada.motivo_descarte).toBe('Prospecto no interesado en este momento');
    });
  });

  describe('De los arreglos chicos', () => {
    it('11 · Con un ciclo ABIERTO y 72 puntos en activacion, P-15 muestra 72 y dice que está activo', async () => {
      // Karla (socio 12) tiene 72 puntos personales en activacion en el ciclo abierto 6
      const datos = await obtenerMiRango(12, 6, sbAdmin);
      expect(datos).toBeDefined();
      expect(datos.puntos_personales).toBe(72);
      expect(datos.activo).toBe(true);
      expect(datos.rango_ciclo.puntos_personales).toBe(72);
      expect(datos.rango_ciclo.activo).toBe(true);
    });

    it('12 · Una comisión de tipo "rango" NO se etiqueta "Bono Global"', () => {
      const comisionRango = {
        id: 101,
        nivel: null,
        tipo_bono: 'rango',
        monto_cent: 150000
      };
      const etiqueta = formatearNivelOComision(comisionRango);
      expect(etiqueta).toBe('Bono Rango');
      expect(etiqueta).not.toBe('Bono Global');

      // Comisiones con nivel se siguen etiquetando "Nivel X"
      const comisionNivel2 = {
        id: 102,
        nivel: 2,
        tipo_bono: 'residual',
        monto_cent: 2000
      };
      expect(formatearNivelOComision(comisionNivel2)).toBe('Nivel 2');
    });
  });
});
