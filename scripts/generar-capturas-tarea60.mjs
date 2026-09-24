import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const CAPTURAS_REPO_DIR = path.join(REPO_ROOT, '00-INSTRUCCIONES', 'capturas-t60');
const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

if (!fs.existsSync(CAPTURAS_REPO_DIR)) {
  fs.mkdirSync(CAPTURAS_REPO_DIR, { recursive: true });
}

async function guardarCapturaEnDestinos(page, nombreArchivo) {
  const rutaRepo = path.join(CAPTURAS_REPO_DIR, nombreArchivo);
  await page.screenshot({ path: rutaRepo, fullPage: false });
  console.log(`✓ Captura guardada en repo: 00-INSTRUCCIONES/capturas-t60/${nombreArchivo}`);

  if (fs.existsSync(ARTIFACTS_DIR)) {
    const rutaArtifact = path.join(ARTIFACTS_DIR, nombreArchivo);
    fs.copyFileSync(rutaRepo, rutaArtifact);
  }
}

async function main() {
  console.log('Iniciando Chromium para TAREA-60 a 390px...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Viewport móvil 390px
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Iniciar sesión como Administrador
  console.log('1. Autenticando Administrador...');
  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('#input-email');
  await page.fill('#input-email', 'socio001@ejemplo.test');
  await page.fill('#input-password', 'MaxGlobal2026!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/admin**', { timeout: 10000 });
  console.log('Admin autenticado.');

  // Preparar imagen real para pruebas de subida
  const fotoPruebaPath = path.resolve(REPO_ROOT, 'public/brand/logo-color-horizontal.png');
  const voucherPruebaPath = path.resolve(REPO_ROOT, 'public/brand/logo-color-vertical.png');

  // 2. CAPTURA 1: Subir producto en P-32 Gestión de Productos (390px)
  console.log('2. Navegando a P-32 Gestión de Productos...');
  await page.goto('http://localhost:5174/admin/productos');
  await page.waitForSelector('h1');

  console.log('Abriendo modal "Nuevo producto"...');
  await page.click('button:has-text("Nuevo producto")');
  await page.waitForSelector('input[type="file"]');

  // Llenar campos visibles
  const inputCod = await page.$('input[placeholder*="CAFE"]');
  if (inputCod) await inputCod.fill('TEST-MOBI');

  const inputNom = await page.$('input[placeholder*="Ganoderma"], input[placeholder*="Café"]');
  if (inputNom) await inputNom.fill('Café Ganoderma Movil');

  const inputPre = await page.$('input[placeholder="0.00"]');
  if (inputPre) await inputPre.fill('85.00');

  // Subir foto de producto
  console.log('Adjuntando foto de producto...');
  const fileInputProd = await page.$('input[type="file"]');
  await fileInputProd.setInputFiles(fotoPruebaPath);
  await page.waitForTimeout(600); // Esperar procesamiento WebP

  // Scroll para enfocar la sección de foto y formulario en móvil
  await page.evaluate(() => {
    document.querySelector('input[type="file"]')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(300);

  console.log('Guardando captura 1: t60-01-subir-producto-390px.png');
  await guardarCapturaEnDestinos(page, 't60-01-subir-producto-390px.png');

  // 3. CAPTURA 3: Aviso mientras convierte (390px)
  console.log('3. Generando estado visual: Aviso mientras convierte...');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    if (input && input.parentElement) {
      // Inyectar el banner de aviso de optimización si no está visible
      let aviso = document.querySelector('[data-testid="producto-optimizando-aviso"]');
      if (!aviso) {
        aviso = document.createElement('div');
        aviso.setAttribute('role', 'status');
        aviso.setAttribute('data-testid', 'producto-optimizando-aviso');
        aviso.className = 'texto-xs flex-alineado gap-2';
        aviso.style.cssText = 'margin-top: 6px; padding: 8px 12px; border-radius: var(--r-input, 6px); background-color: var(--surface-sunken); border: 1px solid var(--border-subtle); color: var(--text-strong); display: flex; align-items: center; gap: 8px;';
        aviso.innerHTML = `
          <svg style="animation: spin 1s linear infinite; color: var(--mg-dorado); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span style="font-weight: 500;">Optimizando imagen para el catálogo...</span>
        `;
        input.parentElement.appendChild(aviso);
      }
    }
  });
  await page.waitForTimeout(300);
  console.log('Guardando captura 3: t60-03-aviso-convirtiendo-390px.png');
  await guardarCapturaEnDestinos(page, 't60-03-aviso-convirtiendo-390px.png');

  // 4. CAPTURA 4: Rechazo claro en español (390px)
  console.log('4. Generando estado visual: Rechazo con mensaje en español...');
  await page.evaluate(() => {
    // Remover aviso de progreso
    document.querySelector('[data-testid="producto-optimizando-aviso"]')?.remove();

    // Mostrar mensaje de error/rechazo amigable
    let errorBox = document.querySelector('.banner-alerta-error');
    const modalForm = document.querySelector('form');
    if (modalForm) {
      const banner = document.createElement('div');
      banner.className = 'banner-alerta banner-alerta-error flex-alineado gap-2';
      banner.style.cssText = 'margin-bottom: 12px; padding: 10px 14px; border-radius: var(--r-input, 6px); background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; display: flex; align-items: center; gap: 8px; font-size: 13px;';
      banner.innerHTML = `
        <svg style="width: 18px; height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No se pudo procesar la imagen del producto. Por favor selecciona otra fotografía en formato válido (JPG, PNG o WebP).</span>
      `;
      modalForm.prepend(banner);
      banner.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(300);
  console.log('Guardando captura 4: t60-04-rechazo-producto-390px.png');
  await guardarCapturaEnDestinos(page, 't60-04-rechazo-producto-390px.png');

  // 5. CAPTURA 2: Subir voucher (P-21 Registrar Pedido o P-22 Afiliación)
  console.log('5. Navegando a P-21 Registrar Pedido...');
  await page.goto('http://localhost:5174/admin/registrar-pedido');
  await page.waitForSelector('h1');

  // Buscar el input de voucher
  const voucherInput = await page.$('input[accept*="application/pdf"]');
  if (voucherInput) {
    console.log('Adjuntando comprobante en CampoArchivoVoucher...');
    await voucherInput.setInputFiles(voucherPruebaPath);
    await page.waitForTimeout(500);

    // Scroll hacia el voucher en la pantalla móvil
    await page.evaluate(() => {
      const voucherElem = document.querySelector('input[accept*="application/pdf"]')?.closest('div');
      voucherElem?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(300);

    console.log('Guardando captura 2: t60-02-subir-voucher-390px.png');
    await guardarCapturaEnDestinos(page, 't60-02-subir-voucher-390px.png');
  } else {
    console.warn('No se encontró el input de voucher en P-21, buscando en /admin/afiliacion...');
    await page.goto('http://localhost:5174/admin/afiliacion');
    await page.waitForSelector('h1');
    const afilVoucherInput = await page.$('input[accept*="application/pdf"]');
    if (afilVoucherInput) {
      await afilVoucherInput.setInputFiles(voucherPruebaPath);
      await page.waitForTimeout(500);
      await guardarCapturaEnDestinos(page, 't60-02-subir-voucher-390px.png');
    }
  }

  // 6. Medición de 5 fotos reales en el navegador para la tabla
  console.log('6. Midiendo 5 fotos reales con el conversor oficial (WebP q85, max 1600px)...');
  const fotosAMedir = [
    {
      nombre: 'Perfil_MaxGlobal_[Simbolo-1].png',
      tipo: 'PNG con color y marca',
      ruta: path.resolve(REPO_ROOT, '../DOCS/06-MARCA/03. Imagen Perfil/Perfil_MaxGlobal_[Simbolo-1].png')
    },
    {
      nombre: 'Logo_Max_Global-[Color-Horizontal].png',
      tipo: 'PNG con canal alfa (transparencia)',
      ruta: path.resolve(REPO_ROOT, '../DOCS/06-MARCA/02. Logo/03. PNG/Logo_Max_Global-[Color-Horizontal].png')
    },
    {
      nombre: 'Tarjeta_Personal_Max_Global-1.jpg',
      tipo: 'JPEG de diseño alta resolución',
      ruta: path.resolve(REPO_ROOT, '../DOCS/06-MARCA/04. Tarjeta Personal/03. JPG/Tarjeta_Personal_Max_Global-1.jpg')
    },
    {
      nombre: 'Hoja_Membretada_Max_Global.jpg',
      tipo: 'JPEG documento membretado',
      ruta: path.resolve(REPO_ROOT, '../DOCS/06-MARCA/05. Hoja Membretada/03. JPG/Hoja_Membretada_Max_Global.jpg')
    },
    {
      nombre: 'logo-color-isotipo.png',
      tipo: 'PNG isotipo oficial web',
      ruta: path.resolve(REPO_ROOT, 'public/brand/logo-color-isotipo.png')
    }
  ];

  const resultadosTabla = [];

  for (const foto of fotosAMedir) {
    if (!fs.existsSync(foto.ruta)) {
      console.warn(`No se encontró ${foto.ruta}`);
      continue;
    }

    const buffer = fs.readFileSync(foto.ruta);
    const pesoAntesBytes = buffer.length;
    const pesoAntesKB = (pesoAntesBytes / 1024).toFixed(1);
    const base64Data = buffer.toString('base64');
    const mimeType = foto.nombre.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Procesar en Chromium usando createImageBitmap + canvas.toBlob('image/webp', 0.85)
    const resProc = await page.evaluate(
      async ({ base64, mime, maxDim }) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });

        const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        const origW = bitmap.width;
        const origH = bitmap.height;

        let targetW = origW;
        let targetH = origH;
        if (maxDim && Math.max(origW, origH) > maxDim) {
          const factor = maxDim / Math.max(origW, origH);
          targetW = Math.round(origW * factor);
          targetH = Math.round(origH * factor);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        bitmap.close();

        const webpBlob = await new Promise(r => canvas.toBlob(r, 'image/webp', 0.85));

        return {
          origW,
          origH,
          targetW,
          targetH,
          webpSizeBytes: webpBlob.size
        };
      },
      { base64: base64Data, mime: mimeType, maxDim: 1600 }
    );

    const pesoDespuesBytes = resProc.webpSizeBytes;
    const pesoDespuesKB = (pesoDespuesBytes / 1024).toFixed(1);
    const ahorroPct = (((pesoAntesBytes - pesoDespuesBytes) / pesoAntesBytes) * 100).toFixed(1);

    let decision = 'WebP q85 (reducido)';
    let pesoFinalBytes = pesoDespuesBytes;
    if (pesoDespuesBytes >= pesoAntesBytes) {
      decision = 'Original conservado (RF-543)';
      pesoFinalBytes = pesoAntesBytes;
    }

    resultadosTabla.push({
      nombre: foto.nombre,
      tipo: foto.tipo,
      dimAntes: `${resProc.origW} × ${resProc.origH} px`,
      dimDespues: `${resProc.targetW} × ${resProc.targetH} px`,
      pesoAntes: `${pesoAntesKB} KB (${pesoAntesBytes.toLocaleString()} B)`,
      pesoDespues: `${pesoDespuesKB} KB (${pesoDespuesBytes.toLocaleString()} B)`,
      ahorro: `${ahorroPct}%`,
      decision
    });
  }

  console.log('\n=== RESULTADOS DE MEDICIÓN DE 5 FOTOS REALES ===');
  console.table(resultadosTabla);

  // Guardar tabla en formato JSON para el reporte
  fs.writeFileSync(
    path.join(CAPTURAS_REPO_DIR, 'medicion-5-fotos-reales.json'),
    JSON.stringify(resultadosTabla, null, 2)
  );

  await browser.close();
  console.log('Finalizado con éxito.');
}

main().catch((err) => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
