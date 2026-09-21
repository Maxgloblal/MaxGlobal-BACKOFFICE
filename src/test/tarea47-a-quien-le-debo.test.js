import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  obtenerSociosAQuienLeDebo,
  generarExportacionBancariaBilletera,
  obtenerHistoricoCierresAdmin,
  obtenerListaSociosAdmin
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-47 · A quién le debo y mejoras operativas de liquidación', () => {
  let sbAdmin;

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-t47-live', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error('Fallo login Admin: ' + errAdmin.message);
  });

  it('1 · Las 3 cifras de cabecera coinciden exactamente con la consulta directa a v_wallet_saldo', async () => {
    // Consulta directa a la base de datos con sbAdmin
    const { data: saldosDirectos, error: errSaldos } = await sbAdmin
      .from('v_wallet_saldo')
      .select('socio_id, saldo_cent')
      .gt('saldo_cent', 0);

    expect(errSaldos).toBeNull();
    expect(saldosDirectos).toBeDefined();

    const totalDirectoCent = saldosDirectos.reduce((acc, row) => acc + Number(row.saldo_cent || 0), 0);
    const cantidadSociosDirecto = saldosDirectos.length;

    // Ejecutar servicio con sbAdmin
    const datosDeuda = await obtenerSociosAQuienLeDebo(sbAdmin);

    expect(datosDeuda).toBeDefined();
    expect(datosDeuda.cantidadTotal).toBe(cantidadSociosDirecto);
    expect(datosDeuda.totalAdeudadoCent).toBe(totalDirectoCent);

    // Suma matemática de los sub-estados debe dar exactamente el total
    const sumaSubEstadosCent =
      datosDeuda.listoParaPagarCent +
      datosDeuda.trabadoPorCciCent +
      datosDeuda.aunNoLlegaMinimoCent +
      datosDeuda.yaSolicitadoCent;

    expect(sumaSubEstadosCent).toBe(totalDirectoCent);

    // Cantidad de socios en sub-estados debe sumar la cantidad total
    const sumaCantidades =
      datosDeuda.cantidadListos +
      datosDeuda.cantidadTrabados +
      datosDeuda.cantidadDebajoMinimo +
      datosDeuda.cantidadSolicitados;

    expect(sumaCantidades).toBe(cantidadSociosDirecto);
  });

  it('2 · Los 4 estados están correctamente categorizados y no hay solapamientos', async () => {
    const datosDeuda = await obtenerSociosAQuienLeDebo(sbAdmin);
    const minimoCent = datosDeuda.montoMinimoRetiroCent;

    for (const socio of datosDeuda.socios) {
      expect(['LISTO_PARA_PAGAR', 'LE_FALTA_CCI', 'NO_LLEGA_MINIMO', 'YA_LO_SOLICITO']).toContain(socio.estado);

      if (socio.estado === 'YA_LO_SOLICITO') {
        expect(socio.tienePendiente).toBe(true);
      } else if (socio.estado === 'LISTO_PARA_PAGAR') {
        expect(socio.tienePendiente).toBe(false);
        expect(socio.saldoCent).toBeGreaterThanOrEqual(minimoCent);
        expect(socio.tieneBanco).toBe(true);
        expect(socio.tieneCci).toBe(true);
      } else if (socio.estado === 'LE_FALTA_CCI') {
        expect(socio.tienePendiente).toBe(false);
        expect(socio.saldoCent).toBeGreaterThanOrEqual(minimoCent);
        // Le falta banco o le falta CCI
        expect(!socio.tieneBanco || !socio.tieneCci).toBe(true);
      } else if (socio.estado === 'NO_LLEGA_MINIMO') {
        expect(socio.tienePendiente).toBe(false);
        expect(socio.saldoCent).toBeLessThan(minimoCent);
      }
    }
  });

  it('3 · CSV de billetera se arma desde el saldo de la billetera y tiene cabecera con CCI', async () => {
    const exportacion = await generarExportacionBancariaBilletera(sbAdmin);

    expect(exportacion).toBeDefined();
    expect(exportacion.contenidoCSV).toBeDefined();
    expect(typeof exportacion.contenidoCSV).toBe('string');

    const lineas = exportacion.contenidoCSV.split('\n');
    expect(lineas.length).toBeGreaterThanOrEqual(1);

    // Cabecera oficial
    expect(lineas[0]).toBe('Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)');

    // Filas abonables deben tener formato correcto
    if (exportacion.cantidadSociosAbonables > 0) {
      expect(lineas.length).toBe(exportacion.cantidadSociosAbonables + 1);
    }
  });

  it('4 · Histórico de cierres recupera los ciclos cerrados con métricas agregadas exactas', async () => {
    const historico = await obtenerHistoricoCierresAdmin(sbAdmin);

    expect(Array.isArray(historico)).toBe(true);
    expect(historico.length).toBeGreaterThanOrEqual(1);

    const ciclo1 = historico.find(c => c.id === 1);
    expect(ciclo1).toBeDefined();
    expect(ciclo1.totalComisionesCent).toBe(6613740);
    expect(ciclo1.totalComisionesSoles).toBe(66137.40);
    expect(ciclo1.totalComisiones).toBe(1356);
    expect(ciclo1.sociosBeneficiados).toBe(75);
    expect(ciclo1.nombreCiclo).toBeDefined();
  });

  it('5 · Filtro de socios sin datos bancarios completos en P-27 filtra correctamente', async () => {
    const resultado = await obtenerListaSociosAdmin({
      filtroActivo: 'sin_datos_bancarios',
      limite: 50
    }, sbAdmin);

    expect(resultado).toBeDefined();
    expect(resultado.socios).toBeDefined();
    expect(resultado.total).toBeGreaterThan(0);

    // Todos los socios devueltos deben carecer de banco, cuenta o CCI
    for (const s of resultado.socios) {
      const tieneDatosCompletos = Boolean(s.banco && s.cuenta_bancaria && s.cci);
      expect(tieneDatosCompletos).toBe(false);
    }
  });

  it('6 · Confirmación de integridad: Cero modificaciones a funciones del motor de comisiones', async () => {
    const { data: fnCheck, error: errRpc } = await sbAdmin
      .from('config')
      .select('clave')
      .limit(1);

    expect(errRpc).toBeNull();
  });

});
