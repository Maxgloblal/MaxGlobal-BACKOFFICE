import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('Iniciando servidor Vite para capturas TAREA-15...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5198'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5198') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3500);
  });

  const browser = await chromium.launch({ headless: true });

  try {
    // =========================================================================
    // SESION ADMIN: P-30 GESTION DE RETIROS
    // =========================================================================
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 860 } });
    const adminPage = await adminContext.newPage();

    console.log('Iniciando sesión como Admin (socio 1)...');
    await adminPage.goto('http://localhost:5198/login');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.fill('#input-email', 'socio001@ejemplo.test');
    await adminPage.fill('#input-password', 'MaxGlobal2026!');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin**', { timeout: 15000 });
    await adminPage.waitForLoadState('networkidle');

    console.log('Navegando a P-30 (/admin/retiros)...');
    await adminPage.goto('http://localhost:5198/admin/retiros');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);

    // -------------------------------------------------------------------------
    // CAPTURA 1: P-30 con la cola de solicitudes pendientes
    // -------------------------------------------------------------------------
    console.log('Tomando Captura 1: P-30 cola de solicitudes pendientes...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p30-cola-solicitudes-retiro.png');
    await adminPage.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // -------------------------------------------------------------------------
    // CAPTURA 2: El detalle de una aprobación mostrando el saldo del socio
    // -------------------------------------------------------------------------
    console.log('Abriendo modal de aprobación de solicitud de S/. 100...');
    const fila100 = adminPage.locator('tr:has-text("100.00")').first();
    const btnAprobar100 = fila100.locator('button:has-text("Aprobar")');
    await btnAprobar100.click();
    await adminPage.waitForTimeout(1000);

    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p30-aprobacion-saldo-socio.png');
    await adminPage.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // Cerrar modal
    await adminPage.click('button:has-text("Cancelar")');
    await adminPage.waitForTimeout(500);

    // -------------------------------------------------------------------------
    // CAPTURA 4: La solicitud de S/. 800 mostrando el aviso de detracción pendiente
    // -------------------------------------------------------------------------
    console.log('Buscando solicitud de S/. 800...');
    const fila800 = adminPage.locator('tr:has-text("800.00")').first();
    const btnAprobar800 = fila800.locator('button:has-text("Aprobar")');
    await btnAprobar800.click();
    await adminPage.waitForTimeout(1000);

    const pathCap4 = path.join(ARTIFACTS_DIR, 'captura-p30-aviso-detraccion-pendiente.png');
    await adminPage.screenshot({ path: pathCap4, fullPage: false });
    console.log('✓ Captura 4 guardada:', pathCap4);

    await adminPage.click('button:has-text("Cancelar")');
    await adminPage.waitForTimeout(500);
    await adminContext.close();

    // =========================================================================
    // SESION SOCIO: P-19 MI BILLETERA (KARLA - SOCIO 12)
    // =========================================================================
    const socioContext = await browser.newContext({ viewport: { width: 1366, height: 1150 } });
    const socioPage = await socioContext.newPage();

    console.log('Iniciando sesión como Karla (socio 12)...');
    await socioPage.goto('http://localhost:5198/login');
    await socioPage.waitForLoadState('networkidle');

    await socioPage.fill('#input-email', 'socio012@ejemplo.test');
    await socioPage.fill('#input-password', 'MaxGlobal2026!');
    await socioPage.click('button[type="submit"]');

    await socioPage.waitForURL('**/socio**', { timeout: 15000 });
    await socioPage.waitForLoadState('networkidle');

    console.log('Navegando a P-19 (/socio/billetera)...');
    await socioPage.goto('http://localhost:5198/socio/billetera');
    await socioPage.waitForLoadState('networkidle');
    await socioPage.waitForTimeout(2000);

    // -------------------------------------------------------------------------
    // CAPTURA 3: P-19 del socio mostrando el movimiento "Retiro aprobado − S/. 100.00" y saldo descontado
    // -------------------------------------------------------------------------
    console.log('Tomando Captura 3: P-19 billetera con retiro aprobado y saldo descontado...');
    // Scrollear para centrar las tarjetas de saldo y el historial de movimientos
    await socioPage.evaluate(() => window.scrollBy(0, 220));
    await socioPage.waitForTimeout(500);

    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-p19-socio-retiro-aprobado.png');
    await socioPage.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada:', pathCap3);

    await socioContext.close();
    console.log('✓ Todas las capturas de TAREA-15 generadas exitosamente.');

  } catch (err) {
    console.error('Error durante generación de capturas:', err);
    throw err;
  } finally {
    await browser.close();
    try { vite.kill(); } catch (e) {}
    setTimeout(() => process.exit(0), 500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
