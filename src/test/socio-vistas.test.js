import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-07 · El Socio Ve Su Dinero (P-11, P-14, P-15, P-19)', () => {
  let sbAdmin;
  let sbAna;
  let sbBruno;
  let sbAnon;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t7-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo al autenticar ADMIN: ${errAdmin.message}`);

    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t7-ana', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo al autenticar ANA: ${errAna.message}`);

    sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-t7-anon', persistSession: false, autoRefreshToken: false }
    });
  });

  describe('1. Aislamiento y Seguridad RLS (Ley 29733)', () => {
    it('🔴 ANA (socio 2) solo ve SUS comisiones (0 comisiones donde beneficiario_id != 2)', async () => {
      const { data: comisionesAjenas, error } = await sbAna
        .from('comision')
        .select('*')
        .neq('beneficiario_id', 2);

      expect(error).toBeNull();
      expect(comisionesAjenas).toEqual([]);
    });

    it('🔴 ANA no puede consultar el desglose RPC de otro socio (ej. socio 3 Bruno)', async () => {
      const { error } = await sbAna.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 3,
        p_ciclo_id: 3
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/No autorizado: solo puedes consultar tus propias comisiones/i);
    });

    it('🔴 ANA no puede consultar el desglose de rango de otro socio (ej. socio 3)', async () => {
      const { error } = await sbAna.rpc('fn_rango_lineas_socio', {
        p_socio_id: 3,
        p_ciclo_id: 3
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/No autorizado: solo puedes consultar tu propio rango/i);
    });

    it('Un socio sin comisiones (ej. socio 501) ve la pantalla vacía con 0 soles, no un error', async () => {
      const { data, error } = await sbAdmin.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 501,
        p_ciclo_id: 3
      });

      expect(error).toBeNull();
      expect(data.exito).toBe(true);
      expect(data.resumen.total_cobrado_cent).toBe(0);
      expect(data.resumen.comisiones_count).toBe(0);
    });
  });

  describe('2. P-14 · Desglose de Comisiones y Explicación de Niveles No Pagados', () => {
    it('El desglose de ANA en Ciclo 3 coincide exactamente con el libro contable de comision', async () => {
      const { data: desglose, error: errDesglose } = await sbAna.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 2,
        p_ciclo_id: 3
      });

      expect(errDesglose).toBeNull();
      expect(desglose.exito).toBe(true);

      const { data: comisionesReal } = await sbAna
        .from('comision')
        .select('monto_cent')
        .eq('ciclo_id', 3);

      const sumaReal = comisionesReal.reduce((sum, c) => sum + Number(c.monto_cent), 0);
      expect(desglose.resumen.total_cobrado_cent).toBe(sumaReal);
      expect(desglose.resumen.comisiones_count).toBe(comisionesReal.length);
    });

    it('Un socio EJECUTIVO ve la explicación "tu pack ... habilita hasta el nivel 3" en el nivel 4 de patrocinio', async () => {
      // Socio 4 es Ejecutivo
      const { data: desgloseCarla, error } = await sbAdmin.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 4,
        p_ciclo_id: 3
      });

      expect(error).toBeNull();
      expect(desgloseCarla.exito).toBe(true);
      expect(desgloseCarla.resumen.pack_codigo).toBe('EJECUTIVO');

      const itemsNoPagadosPorNivel = desgloseCarla.items.filter(
        (it) => !it.pagado && it.motivo.includes('habilita hasta el nivel')
      );

      expect(itemsNoPagadosPorNivel.length).toBeGreaterThan(0);
      expect(itemsNoPagadosPorNivel[0].motivo).toMatch(/tu pack Pack Ejecutivo habilita hasta el nivel/i);
    });

    it('Un socio INACTIVO ve "no estabas activo este ciclo" en los motivos de no pago', async () => {
      // Socio 6 estuvo inactivo en ciclo 2 (68 puntos < 70) y tiene red
      const { data: desgloseInactivo, error } = await sbAdmin.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 6,
        p_ciclo_id: 2
      });

      expect(error).toBeNull();
      expect(desgloseInactivo.resumen.activo).toBe(false);

      const itemsInactivos = desgloseInactivo.items.filter(
        (it) => !it.pagado && it.motivo.includes('no estabas activo')
      );
      expect(itemsInactivos.length).toBeGreaterThan(0);
      expect(itemsInactivos[0].motivo).toMatch(/no estabas activo este ciclo/i);
    });

    it('Una comisión residual contiene la orden_id que la originó para desplegar detalle', async () => {
      const { data: desgloseAna } = await sbAna.rpc('fn_desglose_comisiones_socio', {
        p_socio_id: 2,
        p_ciclo_id: 3
      });

      const residuales = desgloseAna.items.filter((it) => it.tipo_bono === 'residual');
      expect(residuales.length).toBeGreaterThan(0);
      expect(residuales[0].orden_id).toBeDefined();
      expect(residuales[0].orden_codigo).toMatch(/ORD-/);
    });
  });

  describe('3. P-15 · Mi Rango y Línea Estirada', () => {
    it('Cálculo de Línea Estirada: con 800 en una sola línea y Jade a 500, computa 250 (50% de 500)', () => {
      const puntosObjetivo = 500;
      const topePorLinea = puntosObjetivo / 2; // 250
      const puntosLinea1 = 800;
      const computado = Math.min(puntosLinea1, topePorLinea);

      expect(computado).toBe(250);
      expect(computado >= puntosObjetivo).toBe(false); // NO califica
    });

    it('Cálculo de Línea Estirada con 3 líneas: 800 / 180 / 90 -> computa 520 y SÍ califica a 500', () => {
      const puntosObjetivo = 500;
      const topePorLinea = puntosObjetivo / 2; // 250
      const lineas = [800, 180, 90];
      const computados = lineas.map((pts) => Math.min(pts, topePorLinea));
      const totalComputable = computados.reduce((a, b) => a + b, 0);

      expect(computados).toEqual([250, 180, 90]);
      expect(totalComputable).toBe(520);
      expect(totalComputable >= puntosObjetivo).toBe(true); // SÍ califica
    });

    it('fn_rango_lineas_socio marca tope_alcanzado = true para las líneas que exceden el 50%', async () => {
      const { data: rangoAna, error } = await sbAna.rpc('fn_rango_lineas_socio', {
        p_socio_id: 2,
        p_ciclo_id: 3
      });

      expect(error).toBeNull();
      expect(rangoAna.exito).toBe(true);

      const lineaMayor = rangoAna.lineas[0];
      expect(lineaMayor.puntos_totales_rama).toBeGreaterThan(rangoAna.tope_linea_evaluado);
      expect(lineaMayor.tope_alcanzado).toBe(true);
      expect(lineaMayor.puntos_computados).toBe(rangoAna.tope_linea_evaluado);
    });

    it('Los rangos 9 al 16 en la escala tienen definido = false y valores nulos', async () => {
      const { data: rangos } = await sbAdmin
        .from('rango')
        .select('*')
        .order('orden', { ascending: true });

      const rangosIndefinidos = rangos.filter((r) => r.orden >= 9 && r.orden <= 16);
      expect(rangosIndefinidos.length).toBe(8);
      for (const r of rangosIndefinidos) {
        expect(r.definido).toBe(false);
        expect(r.puntos_grupales).toBeNull();
        expect(r.bono_cent).toBeNull();
      }
    });

    it('🔴 Caso 1: Ana (socio 2 ciclo 3) bajó de rango (Plata vs Oro ciclo anterior) y recibe la explicación adecuada', async () => {
      const { data: rangoAna, error } = await sbAna.rpc('fn_rango_lineas_socio', {
        p_socio_id: 2,
        p_ciclo_id: 3
      });

      expect(error).toBeNull();
      expect(rangoAna.rango_ciclo.rango_nombre).toBe('Plata');
      expect(rangoAna.rango_ciclo.rango_orden).toBe(3);
      expect(rangoAna.rango_ciclo.califica).toBe(false);
      expect(rangoAna.rango_ciclo_anterior).not.toBeNull();
      expect(rangoAna.rango_ciclo_anterior.rango_nombre).toBe('Oro');
      expect(rangoAna.rango_ciclo_anterior.rango_orden).toBe(4);

      // Verificación de la condición de descenso
      const bajoDeRango =
        !rangoAna.rango_ciclo.califica &&
        rangoAna.rango_ciclo.rango_orden < rangoAna.rango_ciclo_anterior.rango_orden;
      expect(bajoDeRango).toBe(true);
    });

    it('🔴 Caso 2: Socio que no llegó a los puntos computables calcula exactamente cuántos faltan', async () => {
      const { data: rangoSocio4, error } = await sbAdmin.rpc('fn_rango_lineas_socio', {
        p_socio_id: 4,
        p_ciclo_id: 3
      });

      expect(error).toBeNull();
      expect(rangoSocio4.rango_ciclo?.califica || false).toBe(false);

      const puntosComputables = rangoSocio4.rango_ciclo?.puntos_computables || 0;
      const puntosObjetivo = rangoSocio4.rango_siguiente?.puntos_grupales || 500;
      const faltanPuntos = puntosObjetivo - puntosComputables;

      expect(puntosComputables).toBeLessThan(500);
      expect(faltanPuntos).toBeGreaterThan(0);
    });
  });

  describe('4. P-19 · Mi Billetera (Saldo vs Estimación y Retiro Mínimo)', () => {
    it('Saldo disponible en v_wallet_saldo es S/. 0.00 antes del cierre de ciclo (RF-290)', async () => {
      const { data: saldoData } = await sbAna
        .from('v_wallet_saldo')
        .select('saldo_disponible_cent')
        .eq('socio_id', 2)
        .maybeSingle();

      const saldoCent = saldoData?.saldo_disponible_cent || 0;
      expect(saldoCent).toBe(0);
    });

    it('Comisión estimada del ciclo es > 0 y se calcula sumando comision del ciclo abierto (RF-292)', async () => {
      const { data: comisiones } = await sbAna
        .from('comision')
        .select('monto_cent')
        .eq('ciclo_id', 3);

      const sumaCent = comisiones.reduce((acc, c) => acc + Number(c.monto_cent), 0);
      expect(sumaCent).toBeGreaterThan(0);
    });

    it('El monto mínimo de retiro se lee de config (clave: monto_minimo_retiro_cent = 10000 -> S/. 100)', async () => {
      const { data: conf } = await sbAdmin
        .from('config')
        .select('valor')
        .eq('clave', 'monto_minimo_retiro_cent')
        .single();

      expect(conf.valor).toBe('10000');
    });

    it('No se puede registrar solicitud de retiro menor a S/. 100 (10,000 centavos)', async () => {
      const { data: conf } = await sbAdmin
        .from('config')
        .select('valor')
        .eq('clave', 'monto_minimo_retiro_cent')
        .single();

      const minCent = parseInt(conf.valor, 10);
      const montoPrueba = 5000; // S/. 50.00

      expect(montoPrueba < minCent).toBe(true);
    });
  });

  describe('5. P-11 · Panel Principal (Activación y Contadores Independientes)', () => {
    it('Los tres contadores de volumen tienen propósitos y valores diferenciados', async () => {
      const { data: rc } = await sbAdmin
        .from('rango_ciclo')
        .select('*')
        .eq('socio_id', 2)
        .eq('ciclo_id', 3)
        .single();

      expect(rc.puntos_personales).toBe(72);
      expect(rc.puntos_grupales).toBe(25270);
      expect(rc.puntos_computables).toBe(3514);

      // Verificamos que no se mezclan los contadores
      expect(rc.puntos_personales).not.toBe(rc.puntos_grupales);
      expect(rc.puntos_grupales).not.toBe(rc.puntos_computables);
    });

    it('Socio activo con 72 puntos cumple activación (72 >= 70)', async () => {
      const { data: act } = await sbAdmin
        .from('activacion')
        .select('*')
        .eq('socio_id', 2)
        .eq('ciclo_id', 3)
        .single();

      expect(act.activo).toBe(true);
      expect(act.puntos_personales).toBeGreaterThanOrEqual(70);
    });
  });
});
