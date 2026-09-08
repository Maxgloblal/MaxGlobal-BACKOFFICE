import pkg from '@playwright/test';
const { chromium } = pkg;

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function diagnostico() {
  console.log('=== DIAGNÓSTICO TAREA-29 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Monitoreo de fuentes en Network
  const fontRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.woff2') || url.includes('/fonts/')) {
      fontRequests.push({
        url,
        status: response.status(),
        statusText: response.statusText(),
        contentType: response.headers()['content-type'] || 'N/A',
        contentLength: response.headers()['content-length'] || 'N/A'
      });
    }
  });

  // 1. Iniciar sesión como socio 1 (tiene Pack Empresarial)
  console.log('Iniciando sesión como socio001...');
  await page.goto('http://localhost:4173/login');
  await page.fill('input[type="email"]', 'socio001@ejemplo.test');
  await page.fill('input[type="password"]', 'MaxGlobal2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // 2. Ir a P-18 Mi Perfil
  console.log('Navegando a P-18 Mi Perfil...');
  await page.goto('http://localhost:4173/socio/perfil');
  await page.waitForSelector('.tarjeta-dato-valor', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 3. Encontrar y enfocar la tarjeta de PACK ACTUAL
  const tarjetaPack = page.locator('.tarjeta-dato', { hasText: 'PACK ACTUAL' });
  const valorPack = tarjetaPack.locator('.tarjeta-dato-valor');
  const textoReal = await valorPack.innerText();
  console.log('Texto del elemento PACK ACTUAL:', textoReal);

  // 4. Inspeccionar con CDP (Chrome DevTools Protocol)
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');

  const { root } = await client.send('DOM.getDocument');
  // Buscar todas las .tarjeta-dato-valor
  const { nodeIds } = await client.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector: '.tarjeta-dato-valor'
  });

  console.log('Total elementos .tarjeta-dato-valor:', nodeIds.length);
  const nodeId = nodeIds[1]; // El segundo es PACK ACTUAL
  console.log('Node ID seleccionado para PACK ACTUAL:', nodeId);

  // Rendered Fonts via CDP
  const platformFonts = await client.send('CSS.getPlatformFontsForNode', { nodeId });
  console.log('--- 1. RENDERED FONTS (CDP) ---');
  console.log(JSON.stringify(platformFonts, null, 2));

  // Computed Style via evaluate
  const computed = await page.evaluate(() => {
    const el = document.querySelectorAll('.tarjeta-dato-valor')[1];
    const s = window.getComputedStyle(el);
    return {
      text: el.innerText,
      fontFamily: s.fontFamily,
      fontWeight: s.fontWeight,
      fontStyle: s.fontStyle,
      fontStretch: s.fontStretch,
      webkitTextStroke: s.webkitTextStroke,
      textShadow: s.textShadow,
      fontSynthesis: s.fontSynthesis,
      fontSynthesisWeight: s.fontSynthesisWeight,
      letterSpacing: s.letterSpacing,
      textTransform: s.textTransform,
      fontSize: s.fontSize,
      fontFeatureSettings: s.fontFeatureSettings,
      fontVariationSettings: s.fontVariationSettings
    };
  });

  // Inspeccionar también h1 y h2
  const headingsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, .tarjeta-dato-valor')).map(el => {
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        text: el.innerText.trim(),
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        textTransform: s.textTransform
      };
    });
  });
  console.log('--- HEADINGS & TITULARES INFO ---');
  console.log(JSON.stringify(headingsInfo, null, 2));

  console.log('--- 2. COMPUTED STYLES DE PACK ACTUAL ---');
  console.log(JSON.stringify(computed, null, 2));

  console.log('--- 3. NETWORK FONT REQUESTS ---');
  console.log(JSON.stringify(fontRequests, null, 2));

  // Tomar captura del elemento y de la tarjeta
  await valorPack.screenshot({
    path: `${ARTIFACTS_DIR}/captura-titular-antes-crop.png`
  });

  await tarjetaPack.screenshot({
    path: `${ARTIFACTS_DIR}/captura-tarjeta-pack-antes.png`
  });

  console.log('Capturas de PACK ACTUAL tomadas.');

  await browser.close();
}

diagnostico().catch(err => {
  console.error('Error en diagnostico:', err);
  process.exit(1);
});
