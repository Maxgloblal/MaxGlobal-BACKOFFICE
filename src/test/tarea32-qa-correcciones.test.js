import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  generarExportacionBancariaCierre,
  obtenerConfiguracionPlan,
  cargarPacks
} from '../servicios/operacionAdmin';
import { obtenerMiRed } from '../servicios/socio';
import { normalizarSlugPack } from '../paginas/P22RegistrarAfiliacion';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';
const EDGE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co/functions/v1/registro-afiliacion';

describe('TAREA-32 · Correcciones del QA del 8/09 (9 Reglas de Verificación)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t32', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);
  });

  describe('Bloque 1: P-25 · Exclusión y Explicación en Dispersión Bancaria', () => {
    it('1 · Con un socio que gana menos del mínimo, P-25 lo nombra en la lista de excluidos con su motivo (KARLA · S/. 28.80 · bajo el mínimo)', async () => {
      const exportacion = await generarExportacionBancariaCierre(6, sbAdmin);
      expect(exportacion.cantidadSociosExcluidos).toBeGreaterThanOrEqual(1);

      const karla = exportacion.sociosExcluidos.find(s => s.codigo === 'MG00012');
      expect(karla).toBeDefined();
      expect(karla.montoCent).toBe(2880); // S/. 28.80 literal
      expect(karla.nombreCompleto).toContain('KARLA DIAZ');

      const tieneMotivoMinimo = karla.motivosExclusion.some(m => m.includes('mínimo de S/. 100.00'));
      expect(tieneMotivoMinimo).toBe(true);
    });

    it('2 · Con un socio sin CCI, aparece el motivo "sin CCI"', async () => {
      const exportacion = await generarExportacionBancariaCierre(6, sbAdmin);
      const karla = exportacion.sociosExcluidos.find(s => s.codigo === 'MG00012');
      expect(karla).toBeDefined();
      const tieneMotivoCci = karla.motivosExclusion.some(m => m.includes('no tiene CCI registrado'));
      expect(tieneMotivoCci).toBe(true);
    });

    it('3 · Un socio con DOS motivos aparece con los dos', async () => {
      const exportacion = await generarExportacionBancariaCierre(6, sbAdmin);
      const karla = exportacion.sociosExcluidos.find(s => s.codigo === 'MG00012');
      expect(karla).toBeDefined();
      expect(karla.motivosExclusion.length).toBe(2);
      expect(karla.motivosExclusion).toContain('su saldo no llega al mínimo de S/. 100.00');
      expect(karla.motivosExclusion).toContain('no tiene CCI registrado');
    });

    it('4 · Si no hay filas que exportar, P-25 lo avisa antes de permitir la descarga', async () => {
      const exportacion = await generarExportacionBancariaCierre(6, sbAdmin);
      expect(exportacion.totalAbonableCent).toBe(0);
      expect(exportacion.cantidadSociosAbonables).toBe(0);
      // El CSV solo contiene la cabecera sin filas de pago
      const lineas = exportacion.contenidoCSV.trim().split('\n');
      expect(lineas.length).toBe(1);
      expect(lineas[0]).toBe('Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)');
    });
  });

  describe('Bloque 2: P-12 · Conteo de Descendientes', () => {
    it('5 · El conteo de descendientes de Máximo es 507, no 508', async () => {
      const red = await obtenerMiRed(1, 30, sbAdmin);
      expect(red.totalSocios).toBe(507);
      // La raíz no es descendiente de sí misma
      const contieneRaizEnDescendientes = red.nodos.filter(n => !n.esRaiz).some(n => n.id === 1);
      expect(contieneRaizEnDescendientes).toBe(false);
    });

    it('6 · Un socio sin frontales cuenta 0, no 1', async () => {
      // Socio MG00014 (id 14) no tiene descendientes en red_ancestro
      const red = await obtenerMiRed(14, 30, sbAdmin);
      expect(red.totalSocios).toBe(0);
      expect(red.frontalesTotal).toBe(0);
    });
  });

  describe('Bloque 3: P-26 · Parámetros del Sistema (38 de 39 Claves)', () => {
    it('7 · P-26 muestra las 39 claves, o dice por qué son 38', async () => {
      const configData = await obtenerConfiguracionPlan(sbAdmin);
      expect(configData.totalClaves).toBe(39);
      expect(configData.configs.length).toBe(38);
      expect(configData.clavesOcultas).toBe(1);

      // La clave técnica interna excluida es codigos_banco_cci
      const tieneClaveInterna = configData.configs.some(c => c.clave === 'codigos_banco_cci');
      expect(tieneClaveInterna).toBe(false);

      // valor_punto_soles (4.167) SÍ está presente en las 38
      const valorPunto = configData.configs.find(c => c.clave === 'valor_punto_soles');
      expect(valorPunto).toBeDefined();
      expect(valorPunto.valor).toBe('4.167');
    });
  });

  describe('Bloque 4: Solicitudes y Normalización de Packs', () => {
    it('8 · Un pack_codigo inexistente es RECHAZADO al guardar una solicitud', async () => {
      // Intento vía Supabase Client directo (falla por trigger en DB)
      const { error: errDb } = await sbAdmin
        .from('solicitud_afiliacion')
        .insert({
          nombres: 'Test',
          apellidos: 'Inexistente',
          telefono: '987654321',
          email: `test_inv_${Date.now()}@ejemplo.test`,
          pack_codigo: 'PRO'
        });
      expect(errDb).not.toBeNull();
      expect(errDb.message).toContain('no existe en la tabla pack');

      // Intento vía Edge Function pública (falla con 400)
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Test',
          apellidos: 'Inexistente',
          telefono: '987654321',
          email: `test_inv2_${Date.now()}@ejemplo.test`,
          pack_codigo: 'PRO'
        })
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('no existe en la tabla pack');
    });

    it('9 · La solicitud #80 se puede convertir y le asigna Kit Emprendedor', async () => {
      const { data: sol80, error } = await sbAdmin
        .from('solicitud_afiliacion')
        .select('*')
        .eq('id', 80)
        .single();

      expect(error).toBeNull();
      expect(sol80.id).toBe(80);
      expect(sol80.pack_codigo).toBe('kit-emprendedor');

      // Normalizador mapea slug de landing al código real
      const codigoNormalizado = normalizarSlugPack(sol80.pack_codigo);
      expect(codigoNormalizado).toBe('EMPRENDEDOR');

      // Búsqueda en catálogo de packs
      const packs = await cargarPacks(sbAdmin);
      const packAsignado = packs.find(p => p.codigo === codigoNormalizado);
      expect(packAsignado).toBeDefined();
      expect(packAsignado.id).toBe(1);
      expect(packAsignado.nombre).toBe('Kit Emprendedor');
    });
  });
});
