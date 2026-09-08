import pkg from '@playwright/test';
const { chromium } = pkg;

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function capturarDespues() {
  console.log('Capturando estado DESPUÉS de la corrección...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:4173/login');
  await page.fill('input[type="email"]', 'socio001@ejemplo.test');
  await page.fill('input[type="password"]', 'MaxGlobal2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });

  await page.goto('http://localhost:4173/socio/perfil');
  await page.waitForSelector('.tarjeta-dato-valor', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const tarjetaPack = page.locator('.tarjeta-dato', { hasText: 'PACK ACTUAL' });
  const valorPack = tarjetaPack.locator('.tarjeta-dato-valor');

  // CDP Platform Fonts
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const { nodeIds } = await client.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector: '.tarjeta-dato-valor'
  });
  const platformFonts = await client.send('CSS.getPlatformFontsForNode', { nodeId: nodeIds[1] });
  console.log('--- RENDERED FONTS DESPUÉS (CDP) ---');
  console.log(JSON.stringify(platformFonts, null, 2));

  // Captura crop del titular corregido
  await valorPack.screenshot({
    path: `${ARTIFACTS_DIR}/captura-titular-despues-crop.png`
  });

  // Captura de la tarjeta corregida
  await tarjetaPack.screenshot({
    path: `${ARTIFACTS_DIR}/captura-tarjeta-pack-despues.png`
  });

  // Captura completa de P-18
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/captura-p18-despues-completa.png`,
    fullPage: false
  });

  console.log('Todas las capturas del DESPUÉS han sido guardadas exitosamente.');
  await browser.close();
}

capturarDespues().catch(console.error);
