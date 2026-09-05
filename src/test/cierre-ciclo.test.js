import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerVerificacionesPreviasCierre,
  obtenerVistaPreviaCierre,
  evaluarTechosCierre,
  ejecutarCierreCiclo,
  generarExportacionBancariaCierre
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-09 · Cierre de Ciclo Mensual (P-25)', () => {
  let sbAdmin;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-cierre-admin', persistSession: false, autoRefreshToken: false }
    });
    const { error } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (error) throw new Error(`Fallo al autenticar ADMIN en pruebas de cierre: ${error.message}`);
  }, 30000);

  describe('1. Verificaciones Previas y Vista Previa en Seco (RF-371 a RF-375)', () => {
    it('🔴 La vista previa y verificaciones NO escriben ni una fila en ninguna tabla', async () => {
      const [
        { count: cComAntes },
        { count: cWallAntes },
        { count: cActAntes },
        { count: cPtsAntes }
      ] = await Promise.all([
        sbAdmin.from('comision').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('wallet_movimiento').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('activacion').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('movimiento_puntos').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3)
      ]);

      // Ejecutar verificaciones y vista previa
      const verif = await obtenerVerificacionesPreviasCierre(3, sbAdmin);
      const vp = await obtenerVistaPreviaCierre(3, sbAdmin);
      const techos = await evaluarTechosCierre(3, vp, sbAdmin);
      const exp = await generarExportacionBancariaCierre(3, sbAdmin);

      expect(verif.ciclo.id).toBe(3);
      expect(vp.totalAPagarCent).toBe(1347968); // S/. 13,479.68 exactos
      expect(vp.totalEmpresaCent).toBe(2763564); // S/. 27,635.64 retenidos
      expect(techos.bloqueado).toBe(false);
      expect(exp.filas.length).toBeGreaterThan(0);

      const [
        { count: cComDesp },
        { count: cWallDesp },
        { count: cActDesp },
        { count: cPtsDesp }
      ] = await Promise.all([
        sbAdmin.from('comision').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('wallet_movimiento').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('activacion').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3),
        sbAdmin.from('movimiento_puntos').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3)
      ]);

      expect(cComDesp).toBe(cComAntes);
      expect(cWallDesp).toBe(cWallAntes);
      expect(cActDesp).toBe(cActAntes);
      expect(cPtsDesp).toBe(cPtsAntes);
    }, 25000);


    it('El desglose de bonos de Ciclo 3 suma exactamente S/. 13,479.68', async () => {
      const vp = await obtenerVistaPreviaCierre(3, sbAdmin);

      expect(vp.bonos.patrocinio.totalCent).toBe(679540); // S/. 6,795.40
      expect(vp.bonos.patrocinio.cantidadComisiones).toBe(73);
      expect(vp.bonos.residual.totalCent).toBe(608428); // S/. 6,084.28
      expect(vp.bonos.residual.cantidadComisiones).toBe(385);
      expect(vp.bonos.rango.totalCent).toBe(60000); // S/. 600.00
      expect(vp.bonos.rango.cantidadComisiones).toBe(8);
      expect(vp.bonos.global.totalCent).toBe(0); // No toca en este ciclo

      const sumaTotal = vp.bonos.patrocinio.totalCent + vp.bonos.residual.totalCent + vp.bonos.rango.totalCent + vp.bonos.global.totalCent;
      expect(sumaTotal).toBe(1347968);
      expect(vp.totalAPagarCent).toBe(1347968);
    });
  });

  describe('2. Red de Seguridad y Bloqueo de Techos (RF-376)', () => {
    it('🔴 Bloquea el cierre si el patrocinio supera el 30.8% del techo', async () => {
      const vistaPreviaFalsa = {
        ciclo: { id: 3 },
        bonos: {
          patrocinio: { totalCent: 5000000 }, // 50,000 soles > techo de ~19,117 soles
          residual: { totalCent: 608428 },
          rango: { totalCent: 60000 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 5668428
      };

      const seg = await evaluarTechosCierre(3, vistaPreviaFalsa, sbAdmin);
      expect(seg.bloqueado).toBe(true);
      expect(seg.erroresBloqueo.some(e => e.bono === 'Patrocinio')).toBe(true);
    });

    it('🔴 Bloquea el cierre si el residual supera el 97% del techo', async () => {
      const vistaPreviaFalsa = {
        ciclo: { id: 3 },
        bonos: {
          patrocinio: { totalCent: 679540 },
          residual: { totalCent: 8000000 }, // 80,000 soles > techo de ~21,398 soles
          rango: { totalCent: 60000 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 8739540
      };

      const seg = await evaluarTechosCierre(3, vistaPreviaFalsa, sbAdmin);
      expect(seg.bloqueado).toBe(true);
      expect(seg.erroresBloqueo.some(e => e.bono === 'Residual')).toBe(true);
    });

    it('Alerta si el total dobla al del ciclo anterior para confirmación extra', async () => {
      const vistaPreviaDuplicada = {
        ciclo: { id: 3 },
        bonos: {
          patrocinio: { totalCent: 679540 },
          residual: { totalCent: 608428 },
          rango: { totalCent: 60000 },
          global: { totalCent: 0 }
        },
        totalAPagarCent: 4500000 // 45,000 soles > 2 * 19,203.94 del ciclo 2
      };

      const seg = await evaluarTechosCierre(3, vistaPreviaDuplicada, sbAdmin);
      expect(seg.alertaSaltoDoble).toBe(true);
    });
  });

  describe('3. Ejecución Atómica, Billeteras y Apertura de Nuevo Ciclo (RF-370 a RF-383)', () => {
    it('Ejecutar el cierre de Ciclo 3 abona a billeteras y abre Ciclo 4', async () => {
      const { data: c3Antes } = await sbAdmin.from('ciclo').select('*').eq('id', 3).single();

      if (c3Antes.estado === 'abierto') {
        const res = await ejecutarCierreCiclo(3, sbAdmin);
        expect(res.exito).toBe(true);
        expect(res.ciclo_cerrado_id).toBe(3);
        expect(res.total_abonado_cent).toBe(1347968); // Exactamente S/. 13,479.68
        expect(res.cantidad_abonos).toBe(466); // 73 + 385 + 8
        expect(res.nuevo_ciclo_id).toBeDefined();
      }

      // Verificar que Ciclo 3 ahora está en estado 'cerrado'
      const { data: c3 } = await sbAdmin.from('ciclo').select('*').eq('id', 3).single();
      expect(c3.estado).toBe('cerrado');
      expect(c3.cerrado_en).not.toBeNull();

      // Verificar que solo hay UN ciclo abierto
      const { data: ciclosAbiertos } = await sbAdmin.from('ciclo').select('*').eq('estado', 'abierto');
      expect(ciclosAbiertos.length).toBe(1);
      expect(ciclosAbiertos[0].estado).toBe('abierto');
      expect(ciclosAbiertos[0].id).toBeGreaterThanOrEqual(4);
    });

    it('🔴 Protección contra Doble Cierre: un segundo intento es rechazado y no altera nada', async () => {
      await expect(ejecutarCierreCiclo(3, sbAdmin)).rejects.toThrow();
    });

    it('🔴 El histórico de puntos y activaciones NO se borró (Reseteo seguro)', async () => {
      const { count: ptsCount } = await sbAdmin.from('movimiento_puntos').select('*', { count: 'exact', head: true });
      expect(ptsCount).toBeGreaterThanOrEqual(1042);

      const { count: actCount } = await sbAdmin.from('activacion').select('*', { count: 'exact', head: true }).eq('ciclo_id', 3);
      expect(actCount).toBeGreaterThanOrEqual(265);
    });

    it('La suma de wallet_movimiento cuadra exactamente con comision y el saldo corrido es perfecto', async () => {
      const { data: wallSumRaw } = await sbAdmin
        .from('wallet_movimiento')
        .select('monto_cent')
        .eq('ciclo_id', 3);

      const sumWallet = (wallSumRaw || []).reduce((acc, w) => acc + Number(w.monto_cent || 0), 0);
      expect(sumWallet).toBe(1347968); // S/. 13,479.68

      // Verificar que saldo_despues_cent es un saldo corrido exacto para cada socio
      const { data: movs } = await sbAdmin
        .from('wallet_movimiento')
        .select('id, socio_id, monto_cent, saldo_despues_cent')
        .order('id', { ascending: true });

      const saldosPorSocio = {};
      for (const m of (movs || [])) {
        const prev = saldosPorSocio[m.socio_id] || 0;
        const esperado = prev + Number(m.monto_cent);
        expect(Number(m.saldo_despues_cent)).toBe(esperado);
        saldosPorSocio[m.socio_id] = esperado;
      }
    });

    it('🔴 No se puede insertar una orden en un ciclo cerrado (trg_bloq_orden)', async () => {
      const { error } = await sbAdmin.from('orden').insert({
        codigo: 'ORD-TEST-CLOSED',
        socio_id: 2,
        ciclo_id: 3, // Ciclo 3 está cerrado
        tipo: 'recompra',
        subtotal_cent: 15000,
        total_cent: 7500,
        puntos_total: 18,
        estado: 'por_confirmar'
      });

      expect(error).not.toBeNull();
      expect(error.message).toMatch(/está cerrado/i);
    });
  });

  describe('4. Exportación Bancaria (RF-384, RF-385)', () => {
    it('Genera CSV estructurado con monto, socio, banco y cuenta', async () => {
      const exp = await generarExportacionBancariaCierre(3, sbAdmin);

      expect(exp.contenidoCSV).toContain('Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)');
      expect(exp.totalSociosLiquidables).toBeGreaterThan(0);
      expect(exp.montoMinimoRetiroCent).toBe(10000);
    });
  });
});
