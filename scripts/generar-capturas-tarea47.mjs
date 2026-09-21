import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPTURAS_DIR = path.resolve(__dirname, '../00-INSTRUCCIONES/capturas-t47');
if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

async function main() {
  console.log('Iniciando servidor Vite para capturas Playwright TAREA-47...');
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
    // CAPTURA 1: P-30 Gestión de Retiros con Pestaña "A quién le debo"
    // -------------------------------------------------------------------------
    console.log('Navegando a P-30 (/admin/retiros)...');
    await adminPage.goto('http://localhost:5199/admin/retiros');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);

    console.log('Haciendo clic en la pestaña "A quién le debo"...');
    const tabDeuda = adminPage.locator('button:has-text("A quién le debo")').first();
    await tabDeuda.click();
    await adminPage.waitForTimeout(2000);

    const pathCap1 = path.join(CAPTURAS_DIR, 't47-p30-a-quien-le-debo.png');
    await adminPage.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // -------------------------------------------------------------------------
    // CAPTURA 2: Modal de Pago Directo precargado al pulsar "Pagar Directo"
    // -------------------------------------------------------------------------
    console.log('Pulsando "Pagar Directo" sobre un socio de la lista...');
    const btnPagarDirecto = adminPage.locator('button:has-text("Pagar Directo")').first();
    await btnPagarDirecto.click();
    await adminPage.waitForTimeout(1000);

    const pathCap2 = path.join(CAPTURAS_DIR, 't47-p30-modal-pago-desde-deuda.png');
    await adminPage.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // Cerrar modal
    const btnCerrar = adminPage.locator('button:has-text("Cancelar")').last();
    await btnCerrar.click();
    await adminPage.waitForTimeout(600);

    // -------------------------------------------------------------------------
    // CAPTURA 3: P-25 Cierre de Ciclo - Pestaña Histórico de Cierres
    // -------------------------------------------------------------------------
    console.log('Navegando a P-25 (/admin/cierre)...');
    await adminPage.goto('http://localhost:5199/admin/cierre');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);

    console.log('Cambiando a pestaña "Histórico de Cierres Anteriores"...');
    const tabHistorico = adminPage.locator('button:has-text("Histórico de Cierres Anteriores")').first();
    await tabHistorico.click();
    await adminPage.waitForTimeout(1500);

    const pathCap3 = path.join(CAPTURAS_DIR, 't47-p25-historico-cierres.png');
    await adminPage.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada:', pathCap3);

    // -------------------------------------------------------------------------
    // CAPTURA 4: P-25 Modal de Detalle de Cierre del Ciclo 1
    // -------------------------------------------------------------------------
    console.log('Abriendo modal "Ver Detalle" del Ciclo 1...');
    const filaCiclo1 = adminPage.locator('tr:has-text("Ciclo 1")').first();
    const btnVerDetalle = filaCiclo1.locator('button:has-text("Ver Detalle")').first();
    await btnVerDetalle.click();
    await adminPage.waitForTimeout(2000);

    const pathCap4 = path.join(CAPTURAS_DIR, 't47-p25-modal-detalle-ciclo.png');
    await adminPage.screenshot({ path: pathCap4, fullPage: false });
    console.log('✓ Captura 4 guardada:', pathCap4);

    // Cerrar modal
    const btnCerrarModalCiclo = adminPage.locator('button:has-text("Cerrar")').last();
    await btnCerrarModalCiclo.click();
    await adminPage.waitForTimeout(600);

    // -------------------------------------------------------------------------
    // CAPTURA 5: P-27 Gestión de Socios con Filtro "Sin datos bancarios completos"
    // -------------------------------------------------------------------------
    console.log('Navegando a P-27 (/admin/socios)...');
    await adminPage.goto('http://localhost:5199/admin/socios');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);

    console.log('Seleccionando filtro "Sin datos bancarios completos"...');
    const selectEstado = adminPage.locator('select').nth(1);
    await selectEstado.selectOption('sin_datos_bancarios');
    await adminPage.waitForTimeout(2000);

    const pathCap5 = path.join(CAPTURAS_DIR, 't47-p27-filtro-sin-datos-bancarios.png');
    await adminPage.screenshot({ path: pathCap5, fullPage: false });
    console.log('✓ Captura 5 guardada:', pathCap5);

    // -------------------------------------------------------------------------
    // CAPTURA 6: P-19 Mi Billetera del Socio con Aviso de Falta de CCI
    // -------------------------------------------------------------------------
    console.log('Iniciando sesión como Socio con saldo pero sin CCI (socio 2 - Ana)...');
    const socioContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const socioPage = await socioContext.newPage();

    await socioPage.goto('http://localhost:5199/login');
    await socioPage.waitForLoadState('networkidle');

    await socioPage.fill('#input-email', 'socio002@ejemplo.test');
    await socioPage.fill('#input-password', 'MaxGlobal2026!');
    await socioPage.click('button[type="submit"]');

    await socioPage.waitForURL('**/socio**', { timeout: 15000 });
    await socioPage.waitForLoadState('networkidle');

    console.log('Navegando a P-19 (/socio/billetera)...');
    await socioPage.goto('http://localhost:5199/socio/billetera');
    await socioPage.waitForLoadState('networkidle');
    await socioPage.waitForTimeout(2000);

    const pathCap6 = path.join(CAPTURAS_DIR, 't47-p19-aviso-falta-cci.png');
    await socioPage.screenshot({ path: pathCap6, fullPage: false });
    console.log('✓ Captura 6 guardada:', pathCap6);

    await socioContext.close();
    await adminContext.close();
  } catch (err) {
    console.error('Error durante la generación de capturas:', err);
  } finally {
    await browser.close();
    vite.kill();
    console.log('Servidor Vite finalizado.');
  }
}

main().catch(console.error);
