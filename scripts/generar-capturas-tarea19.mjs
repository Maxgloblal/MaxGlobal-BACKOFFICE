import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('--- Iniciando generador de capturas para TAREA-19 ---');

  // Iniciar servidor Vite en puerto 5199
  console.log('Iniciando servidor Vite en puerto 5199...');
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

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 850 }
    });
    const page = await context.newPage();

    // 1. Iniciar sesión como Administrador (Máximo / socio001)
    console.log('Iniciando sesión con Admin (socio 1)...');
    await page.goto('http://localhost:5199/login');
    await page.fill('input[type="email"], input[placeholder*="correo" i]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Navegar a P-29 Auditoría
    console.log('Navegando a P-29 Auditoría...');
    await page.goto('http://localhost:5199/admin/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Captura 1: P-29 con varias acciones distintas listadas en castellano
    console.log('Tomando Captura 1: Acciones listadas en castellano...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p29-acciones-distintas-castellano.png');
    await page.screenshot({ path: pathCap1 });
    console.log('✓ Captura 1 guardada en:', pathCap1);

    // 3. Inspeccionar un evento de cambio de configuración con valores diferentes
    console.log('Buscando evento de "Cambió la configuración" con 3 → 5...');
    const filaConCambio = page.locator('tr:has-text("dias_hasta_pago: 3 → 5")').first();
    if (await filaConCambio.count() > 0) {
      await filaConCambio.locator('button:has-text("Inspeccionar")').click();
    } else {
      const filaConfig = page.locator('tr:has-text("Cambió la configuración")').first();
      await filaConfig.locator('button:has-text("Inspeccionar")').click();
    }

    await page.waitForSelector('.dialogo-caja', { state: 'visible', timeout: 3000 });
    await page.waitForTimeout(500);

    // Captura 2: Detalle modal del cambio mostrando el antes y el después
    console.log('Tomando Captura 2: Detalle modal antes y después...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p29-detalle-cambio-config.png');
    await page.screenshot({ path: pathCap2 });
    console.log('✓ Captura 2 guardada en:', pathCap2);

    console.log('Todas las capturas se generaron con éxito.');
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
