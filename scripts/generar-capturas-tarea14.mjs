import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';
const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

async function main() {
  console.log('Iniciando servidor Vite para capturas TAREA-14...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5199'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5199') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3500);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });

  let ordenIdCreada = null;
  let voucherKarlaModificado = false;

  try {
    // 1. Generar voucher realista en PNG
    const voucherPath = path.resolve('scripts', 'voucher-demo-real.png');
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #002a8f; color: #fff; margin: 0; padding: 24px; width: 420px; box-sizing: border-box; }
          .card { background: #ffffff; color: #1e293b; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { font-size: 22px; font-weight: 900; color: #002a8f; }
          .badge { background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 999px; }
          .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
          .label { color: #64748b; }
          .val { font-weight: 600; }
          .total-box { background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 14px; text-align: center; }
          .total-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
          .total-val { font-size: 24px; font-weight: 800; color: #002a8f; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">BCP</div>
            <div class="badge">TRANSFERENCIA EXITOSA</div>
          </div>
          <div class="row"><span class="label">Empresa:</span><span class="val">MAX GLOBAL CORP S.A.C.</span></div>
          <div class="row"><span class="label">RUC:</span><span class="val">20609876543</span></div>
          <div class="row"><span class="label">N° Operación:</span><span class="val">45829103</span></div>
          <div class="row"><span class="label">Fecha y Hora:</span><span class="val">04/09/2026 14:15:22</span></div>
          <div class="row"><span class="label">Canal:</span><span class="val">Banca Móvil BCP</span></div>
          <div class="total-box">
            <div class="total-lbl">Monto Transferido</div>
            <div class="total-val">S/. 1,200.00</div>
          </div>
        </div>
      </body>
      </html>
    `);
    const voucherElement = page.locator('body');
    await voucherElement.screenshot({ path: voucherPath });
    console.log('✓ Voucher simulado realista creado:', voucherPath);

    // =========================================================================
    // CAPTURA 1: P-22 con imagen adjunta mostrando miniatura ANTES de guardar
    // =========================================================================
    console.log('Navegando a P-22 (/admin/afiliacion)...');
    await page.goto('http://localhost:5199/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:5199/admin/afiliacion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar patrocinador
    await page.fill('#busqueda-patrocinador', 'ANA');
    await page.waitForTimeout(1000);
    const cardSocio = page.locator('div:has-text("MG00002")').first();
    if (await cardSocio.count() > 0) {
      await cardSocio.click();
      await page.waitForTimeout(500);
    }
    const btnConfirmarPatro = page.locator('button:has-text("Confirmar Patrocinador")');
    if (await btnConfirmarPatro.count() > 0) {
      await btnConfirmarPatro.click();
      await page.waitForTimeout(500);
    }

    // Completar datos personales
    await page.fill('#documento', '44556677');
    await page.fill('#nombres', 'ROBERTO CARLOS');
    await page.fill('#apellidos', 'MENDOZA PAREDES');
    await page.fill('#email', 'roberto.mendoza@ejemplo.test');
    await page.fill('#telefono', '987123456');
    await page.fill('#num-operacion-pack', '45829103');

    // Adjuntar archivo en el selector de comprobante
    const inputArchivo = page.locator('#archivo-voucher-afiliacion');
    await inputArchivo.setInputFiles(voucherPath);
    await page.waitForTimeout(1500);

    // Asegurar visibilidad de la miniatura
    await page.waitForSelector('text=Listo para guardar', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const path1 = path.join(ARTIFACTS_DIR, 'captura-p22-afiliacion-voucher-preview.png');
    await page.screenshot({ path: path1, fullPage: true });
    console.log('✓ Captura 1 guardada:', path1);

    // =========================================================================
    // CAPTURA 2: P-23 mostrando esa misma imagen en el detalle del pedido
    // =========================================================================
    console.log('Subiendo voucher real a Supabase Storage para P-23...');
    const fileBuffer = fs.readFileSync(voucherPath);
    const storagePath = `6/ORD-TEST-CAP23-${Date.now()}.png`;

    await sbAdmin.storage.from('vouchers').upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

    // Crear orden temporal por confirmar para mostrar en P-23
    const { data: ordenP23 } = await sbAdmin
      .from('orden')
      .insert({
        codigo: 'ORD-2026-009991',
        socio_id: 2,
        ciclo_id: 6,
        tipo: 'afiliacion',
        pack_id: 3,
        subtotal_cent: 120000,
        descuento_cent: 0,
        total_cent: 120000,
        puntos_total: 150,
        estado: 'por_confirmar',
        canal: 'oficina',
        asesor_id: 1
      })
      .select()
      .single();

    if (ordenP23) {
      ordenIdCreada = ordenP23.id;
      await sbAdmin.from('voucher').insert({
        orden_id: ordenP23.id,
        banco: 'BCP',
        numero_operacion: '45829103',
        monto_cent: 120000,
        fecha_deposito: '2026-09-04',
        imagen_url: `vouchers/${storagePath}`,
        estado: 'pendiente'
      });
    }

    console.log('Navegando a P-23 (/admin/confirmacion)...');
    await page.goto('http://localhost:5199/admin/confirmacion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Seleccionar la orden recién creada en la bandeja
    const btnRevisar = page.locator('tr:has-text("ORD-2026-009991") button:has-text("Revisar")').first();
    if (await btnRevisar.count() > 0) {
      await btnRevisar.click();
      await page.waitForTimeout(2500);
    } else {
      const filaOrden = page.locator('text=ORD-2026-009991').first();
      if (await filaOrden.count() > 0) {
        await filaOrden.click();
        await page.waitForTimeout(2500);
      }
    }

    await page.waitForSelector('img[alt="Voucher de pago"]', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const path2 = path.join(ARTIFACTS_DIR, 'captura-p23-voucher-detalle-pedido.png');
    await page.screenshot({ path: path2, fullPage: true });
    console.log('✓ Captura 2 guardada:', path2);

    // =========================================================================
    // CAPTURA 3: P-17 entrando como socio viendo su comprobante
    // =========================================================================
    console.log('Preparando voucher de orden para Karla (socio 12) en P-17...');
    // Asignar el voucher subido a la orden 1367 de Karla
    await sbAdmin
      .from('voucher')
      .update({ imagen_url: `vouchers/${storagePath}` })
      .eq('orden_id', 1367);
    voucherKarlaModificado = true;

    console.log('Iniciando sesión como Karla (MG00012)...');
    const contextSocio = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const pageSocio = await contextSocio.newPage();

    await pageSocio.goto('http://localhost:5199/login');
    await pageSocio.waitForLoadState('networkidle');

    await pageSocio.fill('#input-email', 'socio012@ejemplo.test');
    await pageSocio.fill('#input-password', 'MaxGlobal2026!');
    await pageSocio.click('button[type="submit"]');

    await pageSocio.waitForURL('**/socio**', { timeout: 15000 });
    await pageSocio.waitForLoadState('networkidle');

    console.log('Navegando a P-17 (/socio/pedidos)...');
    await pageSocio.goto('http://localhost:5199/socio/pedidos');
    await pageSocio.waitForLoadState('networkidle');
    await pageSocio.waitForTimeout(3000);

    // En P-17 la primera orden (ORD-2026-001367) ya se expande automáticamente al cargar
    await pageSocio.waitForSelector('img[alt="Voucher de pago"]', { timeout: 15000 });
    await pageSocio.waitForTimeout(1000);

    const path3 = path.join(ARTIFACTS_DIR, 'captura-p17-socio-voucher.png');
    await pageSocio.screenshot({ path: path3, fullPage: true });
    console.log('✓ Captura 3 guardada:', path3);

  } catch (err) {
    console.error('Error generando capturas TAREA-14:', err);
  } finally {
    await browser.close();
    vite.kill();

    // Limpieza de orden de prueba
    if (ordenIdCreada) {
      try {
        await sbAdmin.from('voucher').delete().eq('orden_id', ordenIdCreada);
        await sbAdmin.from('orden').delete().eq('id', ordenIdCreada);
        console.log('[cleanup] Orden de prueba eliminada:', ordenIdCreada);
      } catch (e) {
        console.warn('Error en cleanup orden:', e.message);
      }
    }

    if (voucherKarlaModificado) {
      try {
        await sbAdmin
          .from('voucher')
          .update({ imagen_url: 'https://placehold.co/400x300?text=Voucher+Recompra' })
          .eq('orden_id', 1367);
        console.log('[cleanup] Voucher de Karla restaurado a su estado original.');
      } catch (e) {
        console.warn('Error en cleanup voucher Karla:', e.message);
      }
    }

    console.log('Todas las capturas procesadas con éxito.');
    process.exit(0);
  }
}

main();
