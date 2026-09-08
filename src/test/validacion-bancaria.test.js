import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  actualizarPerfilSocio,
  validarCuentaBancaria,
  validarCCI,
  obtenerCodigosBancoCci
} from '../servicios/socio';
import { generarExportacionBancariaCierre } from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-18 · Campo CCI y Validación de Cuentas Bancarias', () => {
  let sbAdmin;
  let socioPruebaId = 505; // Socio existente para prueba temporal de actualización
  let cciOriginal = null;

  beforeAll(async () => {
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-banco-admin', persistSession: false, autoRefreshToken: false }
    });

    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // Respaldar estado del socio de prueba
    const { data: s } = await sbAdmin
      .from('socio')
      .select('id, cci')
      .eq('id', socioPruebaId)
      .single();

    if (s) {
      cciOriginal = s['cci'];
    }
  });

  afterAll(async () => {
    // Restaurar el CCI del socio de prueba a su valor original (null)
    if (socioPruebaId) {
      await sbAdmin
        .from('socio')
        .update({ ['cci']: cciOriginal })
        .eq('id', socioPruebaId);
    }
  });

  it('1 · Un CCI de 20 dígitos se guarda', async () => {
    const cciValido = '00219400010003254221';
    const resVal = validarCCI(cciValido);
    expect(resVal.valido).toBe(true);
    expect(resVal.cciLimpio).toBe(cciValido);

    const socioActualizado = await actualizarPerfilSocio(
      socioPruebaId,
      { ['cci']: cciValido },
      sbAdmin
    );

    expect(socioActualizado['cci']).toBe(cciValido);

    // Verificar en Postgres
    const { data: sDb } = await sbAdmin
      .from('socio')
      .select('id, cci')
      .eq('id', socioPruebaId)
      .single();

    expect(sDb['cci']).toBe(cciValido);
  });

  it('2 · Un CCI de 19 dígitos es rechazado', () => {
    const cci19 = '0021940001000325422'; // 19 dígitos
    expect(cci19.length).toBe(19);

    const res = validarCCI(cci19);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/20 dígitos/i);
  });

  it('3 · Un CCI de 21 dígitos es rechazado', () => {
    const cci21 = '002194000100032542219'; // 21 dígitos
    expect(cci21.length).toBe(21);

    const res = validarCCI(cci21);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/20 dígitos/i);
  });

  it('4 · Un CCI con letras es rechazado', () => {
    const cciConLetras = '0021940001000325422A';
    const res = validarCCI(cciConLetras);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/letras|números/i);
  });

  it('5 · "011-366-000100032542-21" se guarda como "01136600010003254221" (se limpian los guiones)', async () => {
    const cciConGuiones = '011-366-000100032542-21';
    const resVal = validarCCI(cciConGuiones);
    expect(resVal.valido).toBe(true);
    expect(resVal.cciLimpio).toBe('01136600010003254221');

    const socioActualizado = await actualizarPerfilSocio(
      socioPruebaId,
      { ['cci']: cciConGuiones },
      sbAdmin
    );

    expect(socioActualizado['cci']).toBe('01136600010003254221');

    // Verificar en Postgres
    const { data: sDb } = await sbAdmin
      .from('socio')
      .select('id, cci')
      .eq('id', socioPruebaId)
      .single();

    expect(sDb['cci']).toBe('01136600010003254221');
  });

  it('6 · Guardar el perfil SIN CCI funciona (es opcional)', async () => {
    const resVacio = validarCCI('');
    expect(resVacio.valido).toBe(true);
    expect(resVacio.cciLimpio).toBeNull();

    const resNull = validarCCI(null);
    expect(resNull.valido).toBe(true);
    expect(resNull.cciLimpio).toBeNull();

    const socioActualizado = await actualizarPerfilSocio(
      socioPruebaId,
      { ['cci']: '' },
      sbAdmin
    );

    expect(socioActualizado['cci']).toBeNull();

    const { data: sDb } = await sbAdmin
      .from('socio')
      .select('id, cci')
      .eq('id', socioPruebaId)
      .single();

    expect(sDb['cci']).toBeNull();
  });

  it('7 · Una cuenta con letras es rechazada', () => {
    const cuentaInvalida = '194-742643903A';
    const res = validarCuentaBancaria(cuentaInvalida);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/letras/i);
  });

  it('8 · Una cuenta de 3 caracteres es rechazada', () => {
    const cuentaCorta = '194';
    const res = validarCuentaBancaria(cuentaCorta);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/8 y 25 caracteres/i);
  });

  it('9 · El CSV del cierre incluye la columna CCI', async () => {
    const exp = await generarExportacionBancariaCierre(3, sbAdmin);
    expect(exp.contenidoCSV).toContain('Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)');
  });

  it('10 · Un socio sin CCI sale con la columna VACÍA, no con texto', async () => {
    const exp = await generarExportacionBancariaCierre(3, sbAdmin);
    const lineas = exp.contenidoCSV.split('\n');

    // La primera línea es la cabecera
    expect(lineas[0]).toBe('Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)');

    // Revisar filas de socios liquidables
    const filasSocios = lineas.slice(1).filter(l => l.trim().length > 0);
    expect(filasSocios.length).toBeGreaterThan(0);

    // Como los 508 socios tienen cci en null, la columna CCI debe ser "" (vacía)
    for (const f of filasSocios) {
      // Formato: "COD","NOMBRE","DOC","BANCO","CTA","CCI",MONTO
      expect(f).not.toContain('"NO REGISTRADO",');
      expect(f).toMatch(/,"",\d+\.\d{2}$/);
    }
  });

  it('11 · Los 508 socios existentes siguen con cci en null', async () => {
    // Asegurar que el socio de prueba esté restaurado a null
    await sbAdmin
      .from('socio')
      .update({ ['cci']: null })
      .eq('id', socioPruebaId);

    const { data, count, error } = await sbAdmin
      .from('socio')
      .select('id, cci', { count: 'exact' });

    if (error) throw error;

    expect(count).toBe(509);
    const conCci = (data || []).filter(s => s['cci'] !== null);
    expect(conCci.length).toBe(0);
  });

  it('Bonus · La tabla de prefijos bancarios está cargada en config y genera aviso', async () => {
    const configBancos = await obtenerCodigosBancoCci(sbAdmin);
    expect(configBancos).not.toBeNull();
    expect(configBancos['BCP']).toEqual(['002']);
    expect(configBancos['BBVA']).toEqual(['011']);
    expect(configBancos['Interbank']).toEqual(['003']);
    expect(configBancos['Scotiabank']).toEqual(['009']);
  });
});
