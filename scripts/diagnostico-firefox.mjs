import pkg from '@playwright/test';
const { firefox } = pkg;

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function testFirefox() {
  console.log('Iniciando Firefox...');
  const browser = await firefox.launch();
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

  await valorPack.screenshot({
    path: `${ARTIFACTS_DIR}/captura-firefox-titular-antes.png`
  });

  await page.screenshot({
    path: `${ARTIFACTS_DIR}/captura-firefox-p18-completa.png`,
    fullPage: false
  });

  console.log('Capturas en Firefox completadas.');
  await browser.close();
}

testFirefox().catch(err => {
  console.error('Error en Firefox:', err);
  process.exit(1);
});
