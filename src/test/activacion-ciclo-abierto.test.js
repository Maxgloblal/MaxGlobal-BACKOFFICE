import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerListaSociosAdmin,
  obtenerDetalleSocioAdmin,
  formatearNombreCiclo
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-27 · Activación en Ciclo Abierto y Filtro de Socios Activos', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t27', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);
  });

  // 1 · El filtro "activos" en el ciclo 6 devuelve los 2 activos (MG00012 y MG00014)
  it('1 · El filtro "activos" en el ciclo 6 devuelve exactamente los 2 activos (MG00012 y MG00014)', async () => {
    const res = await obtenerListaSociosAdmin({
      pagina: 1,
      porPagina: 25,
      busqueda: '',
      filtroActivo: 'activo',
      cicloId: 6
    }, sbAdmin);

    expect(res.socios.length).toBe(2);
    const codigos = res.socios.map(s => s.codigo).sort();
    expect(codigos).toEqual(['MG00012', 'MG00014']);
    expect(res.total).toBe(2);
    expect(res.totalPaginas).toBe(1);

    // Validar que ambos tienen activacionCiclo.activo === true
    res.socios.forEach(s => {
      expect(s.activacionCiclo.activo).toBe(true);
      expect(s.activacionCiclo.puntos_personales).toBeGreaterThanOrEqual(70);
    });
  });

  // 2 · El filtro se aplica antes de paginar: el contador coincide con las filas mostradas
  it('2 · El filtro se aplica antes de paginar: el contador de resultados coincide con las filas mostradas', async () => {
    // Para filtro 'activo':
    const resActivos = await obtenerListaSociosAdmin({
      pagina: 1,
      porPagina: 25,
      filtroActivo: 'activo',
      cicloId: 6
    }, sbAdmin);

    expect(resActivos.total).toBe(2);
    expect(resActivos.socios.length).toBe(2);
    expect(resActivos.totalPaginas).toBe(1);

    // Para filtro 'inactivo':
    const resInactivos = await obtenerListaSociosAdmin({
      pagina: 1,
      porPagina: 25,
      filtroActivo: 'inactivo',
      cicloId: 6
    }, sbAdmin);

    expect(resInactivos.total).toBe(507); // 509 total - 2 activos = 507
    expect(resInactivos.totalPaginas).toBe(Math.ceil(507 / 25)); // 21 páginas
    expect(resInactivos.socios.length).toBe(25);
    resInactivos.socios.forEach(s => {
      expect(s.activacionCiclo.activo).toBe(false);
    });
  });

  // 3 · Un socio SIN fila de activación sale "Inactivo (0 pts)"
  it('3 · Un socio SIN fila de activación sale "Inactivo (0 pts)"', async () => {
    // Socio 2 (Ana) no tiene compras ni fila en activacion para ciclo 6
    const detalle = await obtenerDetalleSocioAdmin(2, 6, sbAdmin);
    expect(detalle.activacion.activo).toBe(false);
    expect(detalle.activacion.puntos_personales).toBe(0);

    // En la lista paginada
    const res = await obtenerListaSociosAdmin({
      pagina: 1,
      porPagina: 25,
      busqueda: 'MG00002',
      cicloId: 6
    }, sbAdmin);

    expect(res.socios.length).toBe(1);
    const socio2 = res.socios[0];
    expect(socio2.activacionCiclo.activo).toBe(false);
    expect(socio2.activacionCiclo.puntos_personales).toBe(0);
  });

  // 4 · El nombre del ciclo se calcula: ciclo 6 -> "Noviembre 2026" (nunca "Septiembre 2026")
  it('4 · El nombre del ciclo se calcula dinámicamente: ciclo 6 → "Noviembre 2026"', async () => {
    // Función formateadora
    expect(formatearNombreCiclo({ anio: 2026, mes: 11 })).toBe('Noviembre 2026');
    expect(formatearNombreCiclo({ anio: 2026, mes: 9 })).toBe('Septiembre 2026');

    // Al consultar la lista y detalle para ciclo 6
    const resLista = await obtenerListaSociosAdmin({ cicloId: 6 }, sbAdmin);
    expect(resLista.cicloNombre).toBe('Noviembre 2026');
    expect(resLista.cicloNombre).not.toBe('Septiembre 2026');

    const resDetalle = await obtenerDetalleSocioAdmin(1, 6, sbAdmin);
    expect(resDetalle.cicloNombre).toBe('Noviembre 2026');
    expect(resDetalle.cicloNombre).not.toBe('Septiembre 2026');
  });

  // 5 · Si la consulta a activacion falla, la función LANZA en vez de devolver a todos en cero
  it('5 · Si la consulta a activacion falla, la función LANZA en vez de devolver a todos en cero', async () => {
    // Simulamos un sbClient donde la consulta a 'activacion' arroja error
    const fakeClient = {
      from(tabla) {
        if (tabla === 'activacion') {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return Promise.resolve({ data: null, error: new Error('Error simulado de conexion a activacion') });
                    },
                    in() {
                      return Promise.resolve({ data: null, error: new Error('Error simulado de conexion a activacion') });
                    }
                  };
                }
              };
            }
          };
        }
        return sbAdmin.from(tabla);
      }
    };

    await expect(
      obtenerListaSociosAdmin({ cicloId: 6, filtroActivo: 'activo' }, fakeClient)
    ).rejects.toThrow('Error simulado de conexion a activacion');
  });

  // 6 · Una fila inexistente sigue devolviendo null sin lanzar
  it('6 · Una fila inexistente con .maybeSingle() devuelve null sin lanzar error', async () => {
    // Verificamos que una consulta directa a activacion con id inexistente devuelva data: null, error: null
    const { data, error } = await sbAdmin
      .from('activacion')
      .select('*')
      .eq('socio_id', 999999)
      .eq('ciclo_id', 6)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();

    // Y que obtenerDetalleSocioAdmin maneje un socio sin fila sin lanzar
    const detalle = await obtenerDetalleSocioAdmin(2, 6, sbAdmin);
    expect(detalle).toBeDefined();
    expect(detalle.activacion.activo).toBe(false);
    expect(detalle.activacion.puntos_personales).toBe(0);
  });
});
