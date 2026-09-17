import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('Iniciando servidor Vite para capturas Playwright TAREA-43...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5199'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5199') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 4000);
  });

  const browser = await chromium.launch({ headless: true });

  try {
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('Iniciando sesión como Administrador (socio 1)...');
    await adminPage.goto('http://localhost:5199/login');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.fill('#input-email', 'socio001@ejemplo.test');
    await adminPage.fill('#input-password', 'MaxGlobal2026!');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin**', { timeout: 15000 });
    await adminPage.waitForLoadState('networkidle');

    // -------------------------------------------------------------------------
    // CAPTURA 1: P-30 Gestión de Retiros con botón + Registrar Pago a Socio
    // -------------------------------------------------------------------------
    console.log('Navegando a P-30 (/admin/retiros)...');
    await adminPage.goto('http://localhost:5199/admin/retiros');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);

    const pathCap1 = path.join(ARTIFACTS_DIR, 't43-p30-boton-pago-directo.png');
    await adminPage.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // -------------------------------------------------------------------------
    // CAPTURA 2: Modal de Pago Directo con Socio seleccionado y resumen contable
    // -------------------------------------------------------------------------
    console.log('Abriendo modal "+ Registrar Pago a Socio"...');
    const btnAbrirModal = adminPage.locator('button:has-text("Registrar Pago a Socio")').first();
    await btnAbrirModal.click();
    await adminPage.waitForTimeout(1000);

    console.log('Buscando socio "Ana" en el modal...');
    const inputBuscar = adminPage.locator('input[placeholder*="Escribe para buscar"]').first();
    await inputBuscar.fill('Ana');
    await adminPage.waitForTimeout(1200);

    // Seleccionar el resultado de Ana Quispe
    console.log('Seleccionando socio de la lista...');
    const opcionAna = adminPage.locator('.item-socio-busqueda').first();
    await opcionAna.click();
    await adminPage.waitForTimeout(800);

    console.log('Completando datos de pago...');
    const inputMonto = adminPage.locator('input[placeholder="0.00"]').first();
    await inputMonto.fill('150.00');

    const inputNumOp = adminPage.locator('input[placeholder*="OP-984210"]').first();
    await inputNumOp.fill('BCP-98741258');

    const inputNota = adminPage.locator('input[placeholder*="Liquidación"]').first();
    await inputNota.fill('Pago directo coordinado por tesorería');
    await adminPage.waitForTimeout(800);

    const pathCap2 = path.join(ARTIFACTS_DIR, 't43-p30-modal-pago-directo-socio.png');
    await adminPage.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // Cerrar modal
    const btnCerrar = adminPage.locator('button[aria-label="Cerrar modal"]').first();
    if (await btnCerrar.count() > 0) {
      await btnCerrar.click();
    } else {
      await adminPage.locator('button:has-text("Cancelar")').last().click();
    }
    await adminPage.waitForTimeout(600);

    // -------------------------------------------------------------------------
    // CAPTURA 3: P-27 Ficha del Socio con Saldo en Billetera y enlace de pago
    // -------------------------------------------------------------------------
    console.log('Navegando a P-27 (/admin/socios)...');
    await adminPage.goto('http://localhost:5199/admin/socios');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);

    console.log('Abriendo Ficha de Ana Quispe...');
    const filaAna = adminPage.locator('tr:has-text("MG00002")').first();
    const btnFichaAna = filaAna.locator('button:has-text("Ficha")').first();
    await btnFichaAna.click();
    await adminPage.waitForTimeout(1500);

    const pathCap3 = path.join(ARTIFACTS_DIR, 't43-p27-ficha-saldo-billetera.png');
    await adminPage.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada:', pathCap3);

    await adminContext.close();
    console.log('¡Todas las capturas Playwright generadas exitosamente!');
  } catch (err) {
    console.error('Error durante ejecución de Playwright:', err);
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main();
