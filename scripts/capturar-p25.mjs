import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('Iniciando servidor Vite...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5199'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5199') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3000);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('Iniciando sesión como admin...');
    await page.goto('http://localhost:5199/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin**', { timeout: 15000 });
    await page.waitForTimeout(1500);

    console.log('Navegando a P-25 (/admin/cierre?ciclo=3)...');
    await page.goto('http://localhost:5199/admin/cierre?ciclo=3');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const targetFile = path.join(ARTIFACTS_DIR, 'captura-p25-bono-rango.png');
    await page.screenshot({ path: targetFile, fullPage: true });
    console.log('✓ Captura de P-25 guardada con éxito en:', targetFile);

  } catch (err) {
    console.error('Error al capturar P-25:', err);
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main();
