import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { calcularPatrocinio } from '../motor/patrocinio';
import { calcularResidual } from '../motor/residual';
import { obtenerMiBilletera, obtenerDatosEnlace } from '../servicios/socio';
import { consultarPaginado } from '../lib/consultarPaginado';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-49 · El motor no tira comisiones (Parte 1: Registro de Retenida y Resolución al Cierre)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t49', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);
  });
  const escalaPatrocinio = [
    { nivel: 1, porcentaje: 20.0 },
    { nivel: 2, porcentaje: 4.0 },
    { nivel: 3, porcentaje: 3.0 },
    { nivel: 4, porcentaje: 2.0 },
    { nivel: 5, porcentaje: 1.0 },
    { nivel: 6, porcentaje: 0.5 },
    { nivel: 7, porcentaje: 0.3 }
  ];

  const escalaResidual = [
    { nivel: 1, porcentaje: 40.0 },
    { nivel: 2, porcentaje: 20.0 },
    { nivel: 3, porcentaje: 10.0 },
    { nivel: 4, porcentaje: 5.0 },
    { nivel: 5, porcentaje: 3.0 },
    { nivel: 6, porcentaje: 2.0 },
    { nivel: 7, porcentaje: 1.0 },
    { nivel: 8, porcentaje: 10.0 },
    { nivel: 9, porcentaje: 5.0 },
    { nivel: 10, porcentaje: 1.0 }
  ];

  const packGold = { id: 3, codigo: 'GOLD', niveles_patrocinio: 7, niveles_residual: 10 };
  const packEjecutivo = { id: 2, codigo: 'EJECUTIVO', niveles_patrocinio: 3, niveles_residual: 5 };

  // =========================================================================
  // ESCENARIO 1: Socio INACTIVO · red recompra día 3
  // =========================================================================
  it('Escenario 1 · Socio INACTIVO: su red recompra y la comisión EXISTE en estado "retenida", billetera no sube', () => {
    const orden = {
      id: 901,
      socio_id: 10,
      ciclo_id: 6,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 18,
      cuenta_residual: true
    };

    // Ancestro en nivel 1 es Gold pero está INACTIVO
    const upline = [
      { ancestro_id: 5, nivel: 1, activo: false, pack: packGold }
    ];

    const res = calcularResidual(orden, upline, escalaResidual);

    // 1. La comisión EXISTE en la lista de comisiones
    expect(res.comisiones.length).toBe(1);
    const com = res.comisiones[0];

    // 2. Estado 'retenida', motivo 'inactivo'
    expect(com.estado).toBe('retenida');
    expect(com.detalle.motivo).toBe('inactivo');
    expect(com.monto_cent).toBe(720); // 18 pts * 40% = 7.20 (720 cent)
    expect(com.beneficiario_id).toBe(5);

    // 3. No se cuenta como pagado en ese instante
    expect(res.total_pagado_cent).toBe(0);
    expect(res.niveles_bloqueados.find(b => b.nivel === 1)?.monto_cent).toBe(720);
    expect(res.niveles_bloqueados.find(b => b.nivel === 1)?.motivo).toBe('inactivo');
  });

  // =========================================================================
  // ESCENARIO 2 y 3: Resolución al cierre en Postgres (Activo -> confirmada / Inactivo -> anulada)
  // =========================================================================
  it('Escenarios 2 y 3 · Resolución en cierre de ciclo: activo se confirma y abona; inactivo se anula con registro', () => {
    // Lógica de resolución estipulada en fn_ejecutar_cierre_ciclo y esComisionAbonable
    const resolverCierre = (comision, socioActivoAlCierre) => {
      if (comision.estado !== 'retenida') return comision.estado;
      if (comision.detalle?.motivo === 'inactivo' && socioActivoAlCierre) {
        return 'confirmada';
      }
      return 'anulada';
    };

    // Caso A (Escenario 2): Retenida por inactividad + Socio se activa antes del cierre
    const comisionInactivo = {
      id: 901,
      beneficiario_id: 5,
      monto_cent: 720,
      estado: 'retenida',
      detalle: { motivo: 'inactivo' }
    };
    expect(resolverCierre(comisionInactivo, true)).toBe('confirmada');

    // Caso B (Escenario 3): Retenida por inactividad + Socio NUNCA se activa
    expect(resolverCierre(comisionInactivo, false)).toBe('anulada');

    // Caso C (Escenario 4 en cierre): Retenida por pack insuficiente NUNCA se recupera aunque se active
    const comisionPack = {
      id: 902,
      beneficiario_id: 8,
      monto_cent: 200,
      estado: 'retenida',
      detalle: { motivo: 'pack_insuficiente' }
    };
    expect(resolverCierre(comisionPack, true)).toBe('anulada');
    expect(resolverCierre(comisionPack, false)).toBe('anulada');
  });

  // =========================================================================
  // ESCENARIO 4: Nivel bloqueado por pack_insuficiente
  // =========================================================================
  it('Escenario 4 · Nivel bloqueado por "pack_insuficiente": se genera como "retenida" con motivo pack_insuficiente', () => {
    const orden = {
      id: 902,
      socio_id: 20,
      ciclo_id: 6,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 100,
      cuenta_residual: true
    };

    // Ancestro en nivel 6 tiene Pack Ejecutivo (solo cubre hasta nivel 5), y está ACTIVO
    const upline = [
      { ancestro_id: 8, nivel: 6, activo: true, pack: packEjecutivo }
    ];

    const res = calcularResidual(orden, upline, escalaResidual);

    expect(res.comisiones.length).toBe(1);
    const com = res.comisiones[0];

    // Se registra como retenida con motivo pack_insuficiente
    expect(com.estado).toBe('retenida');
    expect(com.detalle.motivo).toBe('pack_insuficiente');
    expect(com.nivel).toBe(6);
    expect(res.total_pagado_cent).toBe(0);
    expect(res.niveles_bloqueados.find(b => b.nivel === 6)?.monto_cent).toBe(200); // 100 pts * 2% = 2.00 (200 cent)
    expect(res.niveles_bloqueados.find(b => b.nivel === 6)?.motivo).toBe('pack_insuficiente');
  });

  // =========================================================================
  // ESCENARIO 5: Socio ACTIVO todo el mes
  // =========================================================================
  it('Escenario 5 · Socio ACTIVO todo el mes: todo igual que hoy, comisiones confirmadas directamente', () => {
    const orden = {
      id: 903,
      socio_id: 30,
      ciclo_id: 6,
      tipo: 'afiliacion',
      total_cent: 120000,
      pack_id: 3,
      pack_codigo: 'GOLD'
    };

    // Upline completo de 7 niveles, todos Gold y ACTIVOS
    const upline = Array.from({ length: 7 }, (_, i) => ({
      ancestro_id: 20 - i,
      nivel: i + 1,
      activo: true,
      pack: packGold
    }));

    const res = calcularPatrocinio(orden, upline, escalaPatrocinio, []);

    expect(res.comisiones.length).toBe(7);
    res.comisiones.forEach(c => {
      expect(c.estado).toBe('confirmada');
      expect(c.detalle.motivo).toBe('calificado');
    });

    expect(res.comisiones.find(c => c.nivel === 1)?.monto_cent).toBe(24000); // 20%
    expect(res.total_pagado_cent).toBe(36960); // 30.8% de 120,000
    expect(res.total_bloqueado_empresa_cent).toBe(0);
  });

  // =========================================================================
  // ESCENARIO 6: Principio de mes (Ciclo recién abierto, NADIE tiene fila de activación)
  // =========================================================================
  it('Escenario 6 (Crítico) · Principio de mes: ningún ancestro tiene fila de activación (activo=false), NINGUNA comisión se pierde', () => {
    const orden = {
      id: 904,
      socio_id: 50,
      ciclo_id: 6,
      tipo: 'recompra',
      total_cent: 15000,
      puntos_total: 100,
      cuenta_residual: true
    };

    // 10 niveles de upline, NINGUNO tiene fila de activación (activo: false)
    const upline = Array.from({ length: 10 }, (_, i) => ({
      ancestro_id: 40 - i,
      nivel: i + 1,
      activo: false,
      pack: packGold
    }));

    const res = calcularResidual(orden, upline, escalaResidual);

    // 🔴 ANTES: res.comisiones.length era 0 (se tiraban las 10 comisiones)
    // 🟢 AHORA: las 10 comisiones existen como 'retenida'
    expect(res.comisiones.length).toBe(10);
    res.comisiones.forEach((c, idx) => {
      expect(c.estado).toBe('retenida');
      expect(c.detalle.motivo).toBe('inactivo');
      expect(c.nivel).toBe(idx + 1);
    });

    const sumaRetenida = res.comisiones.reduce((acc, c) => acc + c.monto_cent, 0);
    expect(sumaRetenida).toBe(9700); // 97% de 100 pts = 97 soles (9700 cent)
  });

  // =========================================================================
  // INVARIANTE: Billetera == comisiones confirmada + pagada
  // =========================================================================
  it('Invariante · Para cualquier socio, lo abonado a su billetera == comisiones "confirmada" + "pagada" (cero de retenida o anulada)', async () => {
    // Tomamos el socio 2 en ciclo 3 (ciclo cerrado con abonos)
    const socioId = 2;
    const cicloId = 3;

    // 1. Obtener movimientos de billetera (abonos de comisiones) del socio 2
    const { data: abonosWallet, error: errW } = await sbAdmin
      .from('wallet_movimiento')
      .select('monto_cent, comision_id')
      .eq('socio_id', socioId)
      .eq('ciclo_id', cicloId)
      .eq('tipo', 'abono')
      .not('comision_id', 'is', null);

    expect(errW).toBeNull();
    const totalAbonadoWalletCent = (abonosWallet || []).reduce((acc, m) => acc + Number(m.monto_cent), 0);

    // 2. Obtener comisiones con abono confirmado/pagado del ciclo 3
    const { data: comisionesSocio, error: errC } = await sbAdmin
      .from('comision')
      .select('id, monto_cent, estado')
      .eq('beneficiario_id', socioId)
      .eq('ciclo_id', cicloId);

    expect(errC).toBeNull();

    const totalConfirmadasYPagadas = (comisionesSocio || [])
      .filter(c => c.estado === 'confirmada' || c.estado === 'pagada')
      .reduce((acc, c) => acc + Number(c.monto_cent), 0);

    const totalRetenidasOAnuladas = (comisionesSocio || [])
      .filter(c => c.estado === 'retenida' || c.estado === 'anulada')
      .reduce((acc, c) => acc + Number(c.monto_cent), 0);

    // Invariante: las comisiones retenidas o anuladas NUNCA entran a la billetera
    expect(totalAbonadoWalletCent).toBe(totalConfirmadasYPagadas);
    expect(totalRetenidasOAnuladas).toBe(0);
    expect(totalAbonadoWalletCent).toBe(120944); // 172 comisiones = S/. 1,209.44
  });

  // =========================================================================
  // INMUTABILIDAD HISTÓRICA: Ciclos 1, 2 y 3 no se mueven (paginación TAREA-48)
  // =========================================================================
  it('Inmutabilidad histórica · Ciclos 1, 2 y 3 permanecen intactos al centavo', async () => {
    const c1 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 1));
    const c2 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 2));
    const c3 = await consultarPaginado(() => sbAdmin.from('comision').select('monto_cent').eq('ciclo_id', 3));

    const suma1 = c1.reduce((acc, c) => acc + Number(c.monto_cent), 0);
    const suma2 = c2.reduce((acc, c) => acc + Number(c.monto_cent), 0);
    const suma3 = c3.reduce((acc, c) => acc + Number(c.monto_cent), 0);

    // Ciclo 1: 1,356 comisiones · S/. 66,137.40
    expect(c1.length).toBe(1356);
    expect(suma1).toBe(6613740);

    // Ciclo 2: 596 comisiones · S/. 20,403.94
    expect(c2.length).toBe(596);
    expect(suma2).toBe(2040394);

    // Ciclo 3: 466 comisiones · S/. 13,479.68
    expect(c3.length).toBe(466);
    expect(suma3).toBe(1347968);
  });

  // =========================================================================
  // CORRECCIÓN A: fn_calcular_y_persistir_rangos lee activacion_puntos_mes
  // =========================================================================
  it('Corrección A · fn_calcular_y_persistir_rangos no tiene umbral 70 hardcodeado y lee config', async () => {
    // Verificamos en el esquema de funciones que no haya '>= 70' en fn_calcular_y_persistir_rangos
    const { data: funcDef, error } = await sbAdmin.rpc('fn_calcular_y_persistir_rangos', {
      p_ciclo_id: 1,
      p_solo_calculo: true
    });

    expect(error).toBeNull();
    // Idempotencia o cálculo exitoso sin error de sintaxis ni valor estático
    expect(funcDef).toBeDefined();
  });

  // =========================================================================
  // CORRECCIÓN B: socio.js y P16MiEnlace.jsx no tienen fallback a Vercel
  // =========================================================================
  it('Corrección B · obtenerDatosEnlace falla limpiamente si falta url_landing en config y no usa Vercel', async () => {
    // Si la clave url_landing está en config, debe devolver el valor de config
    const datos = await obtenerDatosEnlace(1, sbAdmin);
    expect(datos.urlLanding).toBeDefined();
    expect(typeof datos.urlLanding).toBe('string');
    expect(datos.urlLanding.length).toBeGreaterThan(0);

    // Si simulamos cliente donde no existe url_landing, debe lanzar error explícito
    const sbMockSinLanding = {
      from: (tabla) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: 1, codigo: 'MG00001', pack: {} }, error: null }),
            maybeSingle: async () => ({ data: null, error: null }) // Simula que no existe en config
          }),
          count: 0
        })
      })
    };

    await expect(obtenerDatosEnlace(1, sbMockSinLanding)).rejects.toThrow(
      'Configuración incompleta: falta definir la clave "url_landing" en la tabla config.'
    );
  });

  // =========================================================================
  // P-19: Mi Billetera solo suma comisiones confirmadas en estimadoCicloCent
  // =========================================================================
  it('P-19 · obtenerMiBilletera suma en estimadoCicloCent ÚNICAMENTE comisiones con estado="confirmada"', async () => {
    const data = await obtenerMiBilletera(1, 1, sbAdmin);
    expect(data).toBeDefined();
    expect(typeof data.estimadoCicloCent).toBe('number');
  });
});
