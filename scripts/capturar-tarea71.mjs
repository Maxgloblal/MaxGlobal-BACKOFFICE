import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/155eea79-393a-4584-857d-609025c0720b';
const CAPTURAS_DIR = path.resolve('00-INSTRUCCIONES/capturas-t71');

if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

function guardarCaptura(sourcePath, filename) {
  const destInstruct = path.join(CAPTURAS_DIR, filename);
  fs.copyFileSync(sourcePath, destInstruct);
  console.log(`✓ Captura guardada en ${destInstruct}`);

  if (fs.existsSync(ARTIFACTS_DIR)) {
    const destArtifact = path.join(ARTIFACTS_DIR, filename);
    fs.copyFileSync(sourcePath, destArtifact);
    console.log(`✓ Copia guardada en artefactos: ${destArtifact}`);
  }
}

async function main() {
  console.log('1. Iniciando servidor Vite en puerto 5195 (--mode e2e)...');
  const vite = spawn('npx.cmd', ['vite', '--mode', 'e2e', '--port', '5195'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5195') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 4000);
  });

  const browser = await chromium.launch({ headless: true });

  try {
    // =========================================================================
    // VISTA ESCRITORIO (1440 px)
    // =========================================================================
    console.log('\n--- CAPTURAS ESCRITORIO (1440 px) ---');
    const deskContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const deskPage = await deskContext.newPage();

    // Login
    console.log('Iniciando sesión como admin (1440px)...');
    await deskPage.goto('http://localhost:5195/login');
    await deskPage.fill('#input-email', 'socio001@ejemplo.test');
    await deskPage.fill('#input-password', 'MaxGlobal2026!');
    await deskPage.click('button[type="submit"]');
    await deskPage.waitForURL('**/admin**', { timeout: 15000 });

    // Navegar a P-28
    console.log('Navegando a P-28 (/admin/reportes)...');
    await deskPage.goto('http://localhost:5195/admin/reportes');
    await deskPage.waitForLoadState('networkidle');
    await deskPage.waitForTimeout(2000);

    const selectorDesk = deskPage.locator('#select-ciclo-reportes');

    // 1. Ciclo Cerrado (Ciclo 3)
    console.log('Capturando Ciclo Cerrado (1440px)...');
    await selectorDesk.selectOption('3');
    await deskPage.waitForTimeout(1500);
    const pathCerrado1440 = path.join(CAPTURAS_DIR, 'tmp-ciclo-cerrado-1440px.png');
    await deskPage.screenshot({ path: pathCerrado1440, fullPage: true });
    guardarCaptura(pathCerrado1440, 'ciclo-cerrado-1440px.png');
    fs.unlinkSync(pathCerrado1440);

    // 2. Filtro Jade (Ciclo 3)
    console.log('Capturando Filtro Jade (1440px)...');
    const chipJadeDesk = deskPage.locator('button.chip-filtro', { hasText: /Jade/i });
    await chipJadeDesk.click();
    await deskPage.waitForTimeout(1000);
    const pathJade1440 = path.join(CAPTURAS_DIR, 'tmp-filtro-jade-1440px.png');
    await deskPage.screenshot({ path: pathJade1440, fullPage: true });
    guardarCaptura(pathJade1440, 'filtro-jade-1440px.png');
    fs.unlinkSync(pathJade1440);

    // 3. Ciclo Abierto (Ciclo 30)
    console.log('Capturando Ciclo Abierto (1440px)...');
    await selectorDesk.selectOption('30');
    await deskPage.waitForTimeout(1500);
    const pathAbierto1440 = path.join(CAPTURAS_DIR, 'tmp-ciclo-abierto-1440px.png');
    await deskPage.screenshot({ path: pathAbierto1440, fullPage: true });
    guardarCaptura(pathAbierto1440, 'ciclo-abierto-1440px.png');
    fs.unlinkSync(pathAbierto1440);

    // 4. Histórico
    console.log('Capturando Histórico (1440px)...');
    await selectorDesk.selectOption('historico');
    await deskPage.waitForTimeout(1500);
    const pathHist1440 = path.join(CAPTURAS_DIR, 'tmp-historico-1440px.png');
    await deskPage.screenshot({ path: pathHist1440, fullPage: true });
    guardarCaptura(pathHist1440, 'historico-1440px.png');
    fs.unlinkSync(pathHist1440);

    await deskContext.close();

    // =========================================================================
    // VISTA MÓVIL (390 px)
    // =========================================================================
    console.log('\n--- CAPTURAS MÓVIL (390 px) ---');
    const mobContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobPage = await mobContext.newPage();

    // Login
    console.log('Iniciando sesión como admin (390px)...');
    await mobPage.goto('http://localhost:5195/login');
    await mobPage.fill('#input-email', 'socio001@ejemplo.test');
    await mobPage.fill('#input-password', 'MaxGlobal2026!');
    await mobPage.click('button[type="submit"]');
    await mobPage.waitForURL('**/admin**', { timeout: 15000 });

    // Navegar a P-28
    console.log('Navegando a P-28 (/admin/reportes) en móvil...');
    await mobPage.goto('http://localhost:5195/admin/reportes');
    await mobPage.waitForLoadState('networkidle');
    await mobPage.waitForTimeout(2000);

    const selectorMob = mobPage.locator('#select-ciclo-reportes');

    // 5. Ciclo Cerrado (Ciclo 3)
    console.log('Capturando Ciclo Cerrado (390px)...');
    await selectorMob.selectOption('3');
    await mobPage.waitForTimeout(1500);
    const pathCerrado390 = path.join(CAPTURAS_DIR, 'tmp-ciclo-cerrado-390px.png');
    await mobPage.screenshot({ path: pathCerrado390, fullPage: true });
    guardarCaptura(pathCerrado390, 'ciclo-cerrado-390px.png');
    fs.unlinkSync(pathCerrado390);

    // 6. Filtro Jade (Ciclo 3)
    console.log('Capturando Filtro Jade (390px)...');
    const chipJadeMob = mobPage.locator('button.chip-filtro', { hasText: /Jade/i });
    await chipJadeMob.click();
    await mobPage.waitForTimeout(1000);
    const pathJade390 = path.join(CAPTURAS_DIR, 'tmp-filtro-jade-390px.png');
    await mobPage.screenshot({ path: pathJade390, fullPage: true });
    guardarCaptura(pathJade390, 'filtro-jade-390px.png');
    fs.unlinkSync(pathJade390);

    // 7. Ciclo Abierto (Ciclo 30)
    console.log('Capturando Ciclo Abierto (390px)...');
    await selectorMob.selectOption('30');
    await mobPage.waitForTimeout(1500);
    const pathAbierto390 = path.join(CAPTURAS_DIR, 'tmp-ciclo-abierto-390px.png');
    await mobPage.screenshot({ path: pathAbierto390, fullPage: true });
    guardarCaptura(pathAbierto390, 'ciclo-abierto-390px.png');
    fs.unlinkSync(pathAbierto390);

    // 8. Histórico
    console.log('Capturando Histórico (390px)...');
    await selectorMob.selectOption('historico');
    await mobPage.waitForTimeout(1500);
    const pathHist390 = path.join(CAPTURAS_DIR, 'tmp-historico-390px.png');
    await mobPage.screenshot({ path: pathHist390, fullPage: true });
    guardarCaptura(pathHist390, 'historico-390px.png');
    fs.unlinkSync(pathHist390);

    await mobContext.close();

    console.log('\n=== TODAS LAS CAPTURAS COMPLETADAS CON ÉXITO ===');
  } catch (err) {
    console.error('Error generando capturas:', err);
    process.exit(1);
  } finally {
    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main();
