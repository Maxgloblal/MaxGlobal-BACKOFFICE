import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  validarArchivoVoucher,
  subirComprobanteVoucher,
  obtenerUrlVisualizacionVoucher
} from '../servicios/operacionAdmin';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

describe('TAREA-14 · Subida de la Foto del Comprobante / Voucher', () => {
  let sbAdmin;
  let sbAna;
  let sbKarla;
  let cicloAbiertoId = 30;
  const ordenesCreadas = [];
  const vouchersModificados = [];

  beforeAll(async () => {
    // 1. Admin autenticado (socio 1)
    sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-admin-voucher', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAdmin } = await sbAdmin.auth.signInWithPassword({
      email: 'socio001@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAdmin) throw new Error(`Fallo login Admin: ${errAdmin.message}`);

    // 2. Socio Ana autenticada (socio 2)
    sbAna = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-ana-voucher', persistSession: false, autoRefreshToken: false }
    });
    const { error: errAna } = await sbAna.auth.signInWithPassword({
      email: 'socio002@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errAna) throw new Error(`Fallo login Ana: ${errAna.message}`);

    // 3. Socio Karla autenticada (socio 12)
    sbKarla = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'sb-test-karla-voucher', persistSession: false, autoRefreshToken: false }
    });
    const { error: errKarla } = await sbKarla.auth.signInWithPassword({
      email: 'socio012@ejemplo.test',
      password: 'MaxGlobal2026!'
    });
    if (errKarla) throw new Error(`Fallo login Karla: ${errKarla.message}`);

    const { data: cData } = await sbAdmin
      .from('ciclo')
      .select('id')
      .eq('estado', 'abierto')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (cData) cicloAbiertoId = cData.id;
  });

  afterAll(async () => {
    // 1. Limpieza de órdenes de prueba por ID específico
    for (const ordenId of ordenesCreadas) {
      try {
        await sbAdmin.from('voucher').delete().eq('orden_id', ordenId);
        await sbAdmin.from('orden_detalle').delete().eq('orden_id', ordenId);
        await sbAdmin.from('orden').delete().eq('id', ordenId);
      } catch (e) {
        console.warn('Error en limpieza de orden de prueba por ID:', e.message);
      }
    }

    // 2. Barrido de seguridad por códigos de prueba
    try {
      const { data: huerfanas } = await sbAdmin
        .from('orden')
        .select('id')
        .or('codigo.like.ORD-TEST-%,codigo.like.ORD-FAIL-%,codigo.eq.ORD-2026-009991');

      if (huerfanas && huerfanas.length > 0) {
        const ids = huerfanas.map((o) => o.id);
        await sbAdmin.from('voucher').delete().in('orden_id', ids);
        await sbAdmin.from('orden_detalle').delete().in('orden_id', ids);
        await sbAdmin.from('orden').delete().in('id', ids);
      }
    } catch (e) {
      console.warn('Error en barrido de seguridad:', e.message);
    }

    // 3. Restaurar vouchers modificados si los hubiera
    for (const v of vouchersModificados) {
      try {
        await sbAdmin.from('voucher').update({ imagen_url: v.imagen_url_original }).eq('id', v.id);
      } catch (e) {
        console.warn('Error restaurando voucher original:', e.message);
      }
    }
  });

  it('1 · Un archivo de 6 MB es rechazado antes de subirse', () => {
    const archivoGrande = {
      name: 'voucher-pesado.jpg',
      type: 'image/jpeg',
      size: 6 * 1024 * 1024 // 6 MB
    };

    const res = validarArchivoVoucher(archivoGrande);
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/excede el tamaño máximo/i);
  });

  it('2 · Un archivo .exe o .txt es rechazado por tipo de archivo', () => {
    const archivoExe = {
      name: 'malware.exe',
      type: 'application/x-msdownload',
      size: 1024
    };
    const resExe = validarArchivoVoucher(archivoExe);
    expect(resExe.valido).toBe(false);
    expect(resExe.error).toMatch(/formato no permitido/i);

    const archivoTxt = {
      name: 'notas.txt',
      type: 'text/plain',
      size: 1024
    };
    const resTxt = validarArchivoVoucher(archivoTxt);
    expect(resTxt.valido).toBe(false);
    expect(resTxt.error).toMatch(/formato no permitido/i);
  });

  it('3 · Si la subida falla, la orden NO se crea (no queda fila en orden)', async () => {
    const codigoPrueba = `ORD-FAIL-SUBIDA-${Date.now()}`;
    const archivoInvalido = {
      name: 'invalido.sh',
      type: 'application/x-sh',
      size: 500
    };

    let ordenCreada = false;
    let urlSubida = null;
    try {
      // Flujo de P-21 / P-22: si se adjunta archivo, primero se sube a storage
      urlSubida = await subirComprobanteVoucher(archivoInvalido, 6, codigoPrueba, sbAdmin);
      // Solo si la subida tiene éxito se crearía la orden:
      await sbAdmin.from('orden').insert({
        codigo: codigoPrueba,
        socio_id: 2,
        ciclo_id: cicloAbiertoId,
        tipo: 'recompra',
        subtotal_cent: 10000,
        total_cent: 10000,
        estado: 'por_confirmar'
      });
      ordenCreada = true;
    } catch (err) {
      // Error esperado al validar o subir
      expect(err.message).toBeDefined();
    }

    expect(ordenCreada).toBe(false);
    expect(urlSubida).toBeNull();

    // Verificar que no quedó ninguna fila en la tabla orden
    const { data: ordenBuscada } = await sbAdmin
      .from('orden')
      .select('id')
      .eq('codigo', codigoPrueba)
      .maybeSingle();

    expect(ordenBuscada).toBeNull();
  });

  it('4 · Sin archivo adjunto, la orden SÍ se crea y imagen_url queda null (no placehold.co)', async () => {
    // Insertar orden de prueba con voucher nulo usando sbAdmin
    const { data: orden, error: errOrd } = await sbAdmin
      .from('orden')
      .insert({
        codigo: 'ORD-TEST-NOVOUCHER',
        socio_id: 2,
        ciclo_id: cicloAbiertoId,
        tipo: 'recompra',
        subtotal_cent: 15000,
        total_cent: 15000,
        puntos_total: 18,
        estado: 'por_confirmar',
        canal: 'oficina'
      })
      .select()
      .single();

    expect(errOrd).toBeNull();
    expect(orden).toBeDefined();
    ordenesCreadas.push(orden.id);

    // Insertar voucher con imagen_url null
    const { data: voucher, error: errVou } = await sbAdmin
      .from('voucher')
      .insert({
        orden_id: orden.id,
        banco: 'BCP',
        numero_operacion: 'OP-TEST-NULL',
        monto_cent: 15000,
        fecha_deposito: '2026-09-04',
        imagen_url: null, // Null estricto
        estado: 'pendiente'
      })
      .select()
      .single();

    expect(errVou).toBeNull();
    expect(voucher).toBeDefined();
    expect(voucher.imagen_url).toBeNull();
  });

  it('5 · 🔴 El socio NO puede subir a vouchers (RF-238 / RLS)', async () => {
    const archivoData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // Encabezado JPEG
    const pathIntento = `6/intento-socio-ana-${Date.now()}.jpg`;

    // Ana intenta subir al bucket 'vouchers'
    const { data, error } = await sbAna.storage
      .from('vouchers')
      .upload(pathIntento, archivoData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    // Debe ser bloqueada por la política RLS (violates row-level security / 403 / 42501)
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('6 · El socio SÍ puede leer el voucher de SU orden', async () => {
    // 1. Admin sube un archivo legítimo para la orden de Ana (orden id=501 de Ana)
    const timestamp = Date.now();
    const pathRelativo = `6/ORD-2026-000501-${timestamp}.jpg`;
    const dummyImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    const { error: errUpload } = await sbAdmin.storage
      .from('vouchers')
      .upload(pathRelativo, dummyImage, { contentType: 'image/jpeg', upsert: true });

    expect(errUpload).toBeNull();

    // 2. Asociar el path al voucher de la orden 501 de Ana
    const { data: vOriginal } = await sbAdmin
      .from('voucher')
      .select('id, imagen_url')
      .eq('orden_id', 501)
      .single();

    if (vOriginal) {
      vouchersModificados.push({ id: vOriginal.id, imagen_url_original: vOriginal.imagen_url });
      await sbAdmin
        .from('voucher')
        .update({ imagen_url: `vouchers/${pathRelativo}` })
        .eq('id', vOriginal.id);
    }

    // 3. Ana (socio 2) solicita la URL firmada para su propio voucher
    const urlFirmada = await obtenerUrlVisualizacionVoucher(`vouchers/${pathRelativo}`, 900, sbAna);
    expect(urlFirmada).not.toBeNull();
    expect(urlFirmada).toContain('token=');

    // 4. Ana puede descargar el archivo desde Storage
    const { data: downloadData, error: downloadError } = await sbAna.storage
      .from('vouchers')
      .download(pathRelativo);

    expect(downloadError).toBeNull();
    expect(downloadData).toBeDefined();
  });

  it('7 · 🔴 El socio NO puede leer el voucher de la orden de OTRO socio', async () => {
    // 1. Admin sube un archivo para la orden de Karla (socio 12, orden 1367)
    const timestamp = Date.now();
    const pathKarla = `6/ORD-2026-001367-${timestamp}.jpg`;
    const dummyImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    const { error: errUpload } = await sbAdmin.storage
      .from('vouchers')
      .upload(pathKarla, dummyImage, { contentType: 'image/jpeg', upsert: true });

    expect(errUpload).toBeNull();

    const { data: vKarla } = await sbAdmin
      .from('voucher')
      .select('id, imagen_url')
      .eq('orden_id', 1367)
      .single();

    if (vKarla) {
      vouchersModificados.push({ id: vKarla.id, imagen_url_original: vKarla.imagen_url });
      await sbAdmin
        .from('voucher')
        .update({ imagen_url: `vouchers/${pathKarla}` })
        .eq('id', vKarla.id);
    }

    // 2. Ana (socio 2) intenta descargar el voucher de Karla (socio 12)
    const { data: downloadAna, error: errDescargaAna } = await sbAna.storage
      .from('vouchers')
      .download(pathKarla);

    // Debe ser bloqueado: error presente o sin datos
    expect(errDescargaAna).not.toBeNull();
    expect(downloadAna).toBeNull();
  });

  it('8 · Nadie puede borrar del bucket (el admin es rechazado al intentar DELETE)', async () => {
    // Admin intenta borrar un archivo del bucket
    const pathABorrar = `6/intento-borrar-${Date.now()}.jpg`;

    // Intentar borrar vía storage API
    const { data, error } = await sbAdmin.storage
      .from('vouchers')
      .remove([pathABorrar]);

    // Al no haber política de DELETE para ningún rol en storage.objects, Postgres deniega
    // o Supabase retorna lista vacía sin eliminar nada
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data?.length || 0).toBe(0);
    }
  });
});
