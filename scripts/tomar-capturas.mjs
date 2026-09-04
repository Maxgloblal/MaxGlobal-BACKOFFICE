import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('Iniciando servidor de desarrollo Vite...');
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navegando al login...');
    await page.goto('http://localhost:5199/login');
    await page.waitForLoadState('networkidle');

    // Iniciar sesión como admin
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    // Esperar redirección al panel admin
    await page.waitForURL('**/admin**', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 1. Captura de la cabecera mostrando "Septiembre 2026 · Abierto"
    const headerElement = await page.$('.armazon-admin-header');
    if (headerElement) {
      const headerPath = path.join(ARTIFACTS_DIR, 'captura-admin-header-ciclo.png');
      await headerElement.screenshot({ path: headerPath });
      console.log('✓ Captura de cabecera guardada en:', headerPath);
    }

    // 2. Navegar a /admin/afiliacion
    console.log('Navegando a /admin/afiliacion...');
    await page.goto('http://localhost:5199/admin/afiliacion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Seleccionar patrocinador sin restricción de Kit (ej. ANA id 2 que tiene Pack Gold)
    await page.fill('#busqueda-patrocinador', 'ANA');
    await page.waitForTimeout(800);
    const resultadoItem = await page.$('.resultado-busqueda-item, div[style*="cursor: pointer"]');
    if (resultadoItem) {
      await resultadoItem.click();
      await page.waitForTimeout(500);
      const checkbox = await page.$('#check-confirmar-patrocinador');
      if (checkbox) await checkbox.check();
      await page.waitForTimeout(500);
    }

    // Abrir visualmente el select de packs para mostrar las 5 opciones legibles
    await page.evaluate(() => {
      const select = document.getElementById('pack-afiliacion');
      if (select) {
        select.size = 6;
        select.style.height = 'auto';
        select.style.overflow = 'visible';
      }
    });

    await page.waitForTimeout(500);

    // Tomar captura de la sección de packs abierta con las 5 opciones legibles
    const packSection = await page.$('.panel-blanco:has(#pack-afiliacion)');
    const packPath = path.join(ARTIFACTS_DIR, 'captura-p22-packs-abierto.png');
    if (packSection) {
      await packSection.screenshot({ path: packPath });
    } else {
      await page.screenshot({ path: packPath, fullPage: true });
    }
    console.log('✓ Captura de packs abierta guardada en:', packPath);

  } catch (err) {
    console.error('Error al tomar capturas:', err);
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main();
