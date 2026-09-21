import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerVistaPreviaCierre,
  obtenerReporteCicloAdmin,
  obtenerHistoricoCierresAdmin
} from '../servicios/operacionAdmin';
import { obtenerMiRed } from '../servicios/socio';
import { consultarPaginado } from '../lib/consultarPaginado';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-48 · El límite de las mil filas (Invariantes Dinámicas)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t48-live', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error('Fallo login Admin: ' + errAdmin.message);
  });

  it('1 · Invariante dinámica: para cada ciclo cerrado, la suma y conteo del servicio es IGUAL a la suma directa de la tabla comision', async () => {
    // 1. Obtener todos los ciclos cerrados en la base de datos viva
    const { data: ciclosCerrados, error: errCiclos } = await sbAdmin
      .from('ciclo')
      .select('id, anio, mes, estado')
      .eq('estado', 'cerrado')
      .order('id', { ascending: true });

    expect(errCiclos).toBeNull();
    expect(ciclosCerrados).toBeDefined();
    expect(ciclosCerrados.length).toBeGreaterThan(0);

    for (const c of ciclosCerrados) {
      // 2. Verdad directa y absoluta de la base de datos (con paginación sin límites de PostgREST)
      const comisionesDb = await consultarPaginado(() =>
        sbAdmin
          .from('comision')
          .select('id, monto_cent, tipo, estado')
          .eq('ciclo_id', c.id)
      );

      const totalDbCent = comisionesDb.reduce((acc, row) => acc + Number(row.monto_cent || 0), 0);
      const cantidadDb = comisionesDb.length;

      // 3. Invocar obtenerVistaPreviaCierre
      const vista = await obtenerVistaPreviaCierre(c.id, sbAdmin);

      const totalVistaCent =
        (vista.bonos?.patrocinio?.totalCent || 0) +
        (vista.bonos?.residual?.totalCent || 0) +
        (vista.bonos?.rango?.totalCent || 0) +
        (vista.bonos?.global?.totalCent || 0);

      const cantidadVista =
        (vista.bonos?.patrocinio?.cantidadComisiones || 0) +
        (vista.bonos?.residual?.cantidadComisiones || 0) +
        (vista.bonos?.rango?.cantidadComisiones || 0) +
        (vista.bonos?.global?.cantidadComisiones || 0);

      // Invariante 1: el total de la vista previa debe ser idéntico al total real de la BD
      expect(totalVistaCent).toBe(totalDbCent);
      expect(vista.totalAPagarCent).toBe(totalDbCent);
      expect(cantidadVista).toBe(cantidadDb);

      // 4. Invocar obtenerReporteCicloAdmin (P-28)
      const reporte = await obtenerReporteCicloAdmin(c.id, sbAdmin);

      // Invariante 2: el reporte del ciclo debe coincidir exactamente con el total de comisiones confirmadas/pagadas
      const comisionesConfirmadasDb = comisionesDb.filter(row =>
        row.estado === 'confirmada' || row.estado === 'pagada'
      );
      const totalConfDbCent = comisionesConfirmadasDb.reduce(
        (acc, row) => acc + Number(row.monto_cent || 0),
        0
      );

      expect(reporte.totalComisionesCent).toBe(totalConfDbCent);
    }
  }, 30000);

  it('2 · Invariante dinámica: el histórico de cierres muestra el total completo sin truncar a 1,000 filas', async () => {
    const historico = await obtenerHistoricoCierresAdmin(sbAdmin);
    expect(historico.length).toBeGreaterThan(0);

    for (const h of historico) {
      const comisionesDb = await consultarPaginado(() =>
        sbAdmin
          .from('comision')
          .select('id, monto_cent')
          .eq('ciclo_id', h.id)
          .in('estado', ['confirmada', 'pagada'])
      );

      const totalDbCent = comisionesDb.reduce((acc, row) => acc + Number(row.monto_cent || 0), 0);
      expect(h.totalComisionesCent).toBe(totalDbCent);
      expect(h.totalComisiones).toBe(comisionesDb.length);
    }
  }, 30000);

  it('3 · El helper consultarPaginado registra en consola cuando trae más de un lote', async () => {
    const spyConsole = vi.spyOn(console, 'info').mockImplementation(() => {});

    // Simulador de query que retorna 2 lotes (100 filas en total con paso de 50)
    let llamadas = 0;
    const mockQueryBuilder = () => ({
      range: async (desde, hasta) => {
        llamadas++;
        if (desde === 0) {
          return { data: new Array(50).fill({ id: 1 }), error: null };
        } else if (desde === 50) {
          return { data: new Array(25).fill({ id: 2 }), error: null };
        }
        return { data: [], error: null };
      }
    });

    const resultado = await consultarPaginado(mockQueryBuilder, 50);

    expect(resultado.length).toBe(75);
    expect(llamadas).toBe(2);
    expect(spyConsole).toHaveBeenCalled();
    const llamado = spyConsole.mock.calls.find(c =>
      c[0] && c[0].includes('[consultarPaginado] Paginación activada')
    );
    expect(llamado).toBeDefined();

    spyConsole.mockRestore();
  });

  it('4 · obtenerMiRed recupera el árbol completo de descendientes y sus activaciones', async () => {
    const red = await obtenerMiRed(1, 1, sbAdmin);

    // Contar descendientes directamente en red_ancestro
    const { count: totalDescDirecto, error: errDesc } = await sbAdmin
      .from('red_ancestro')
      .select('descendiente_id', { count: 'exact', head: true })
      .eq('ancestro_id', 1)
      .neq('descendiente_id', 1);

    expect(errDesc).toBeNull();
    // red.nodos contiene la raíz (1) + todos los descendientes
    expect(red.nodos.length).toBe(totalDescDirecto + 1);
    expect(red.totalSocios).toBe(totalDescDirecto);
  }, 30000);
});
