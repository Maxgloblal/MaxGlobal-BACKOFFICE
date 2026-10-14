import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/jacks/.gemini/antigravity/brain/9fd0f89f-10f2-467a-8c03-fa2d16ce2448';

async function main() {
  console.log('Iniciando servidor Vite en puerto 5198...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5198'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5198') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 4000);
  });

  console.log('Abriendo navegador Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Iniciando sesión como socio...');
    await page.goto('http://localhost:5198/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/socio**', { timeout: 15000 });
    await page.waitForTimeout(1500);

    console.log('2. Navegando a P-15 (/socio/rango)...');
    await page.goto('http://localhost:5198/socio/rango');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    const fileP15 = path.join(ARTIFACTS_DIR, 'captura-p15-mi-rango-en-vivo.png');
    await page.screenshot({ path: fileP15, fullPage: true });
    console.log('✓ Captura P-15 guardada en:', fileP15);

    console.log('3. Navegando a P-14 (/socio/comisiones)...');
    await page.goto('http://localhost:5198/socio/comisiones');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    const fileP14 = path.join(ARTIFACTS_DIR, 'captura-p14-mis-comisiones.png');
    await page.screenshot({ path: fileP14, fullPage: true });
    console.log('✓ Captura P-14 guardada en:', fileP14);

  } catch (err) {
    console.error('Error durante la captura:', err);
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main();
