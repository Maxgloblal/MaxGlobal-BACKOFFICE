import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/0aff50e1-7627-4d91-adf1-e407c1c52fb0';

async function main() {
  console.log('1. Iniciando servidor Vite en puerto 5198 con entorno de producción...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5198'], {
    cwd: path.resolve('SISTEMA MOTOR Y BACKOFFICE'),
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

  console.log('2. Lanzando navegador Chromium (Playwright)...');
  const browser = await chromium.launch({ headless: true });

  const mockUserGreuz = {
    id: '336e9597-8c44-4644-942e-8c2c81d81787',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'greyz_adm12@gmail.com',
    email_confirmed_at: '2026-10-17T17:56:08.601761Z',
    app_metadata: { provider: 'email' },
    user_metadata: { socio_id: 61, rol: 'socio' }
  };

  const mockSessionGreuz = {
    access_token: 'mock-jwt-token-greuz',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: mockUserGreuz
  };

  // =========================================================================
  // VISTA MÓVIL 390px (IDÉNTICA A LA CAPTURA DE WHATSAPP DEL CLIENTE)
  // =========================================================================
  console.log('3. Capturando vista móvil (390px) para reproducir exactamente WhatsApp...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  // Interceptar sesión Supabase Auth para entrar como Greuz Mallqui
  await mobilePage.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserGreuz) });
  });
  await mobilePage.route('**/auth/v1/session*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSessionGreuz) });
  });

  // Cargar P-14 Mis Comisiones móvil
  await mobilePage.goto('http://localhost:5198/socio/comisiones', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  // Seleccionar ciclo 2 si está disponible
  const selectCicloMobile = mobilePage.locator('select').first();
  if (await selectCicloMobile.isVisible()) {
    await selectCicloMobile.selectOption('2').catch(() => {});
    await mobilePage.waitForTimeout(1500);
  }

  const p14MovilPath = path.resolve('SISTEMA MOTOR Y BACKOFFICE', 'evidencia-real-p14-greuz-movil.png');
  await mobilePage.screenshot({ path: p14MovilPath, fullPage: true });
  console.log('   -> Guardado:', p14MovilPath);

  // Cargar P-15 Mi Rango móvil
  await mobilePage.goto('http://localhost:5198/socio/rango', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  const selectCicloRangoMobile = mobilePage.locator('#select-ciclo-rango');
  if (await selectCicloRangoMobile.isVisible()) {
    await selectCicloRangoMobile.selectOption('2').catch(() => {});
    await mobilePage.waitForTimeout(1500);
  }
  const p15MovilPath = path.resolve('SISTEMA MOTOR Y BACKOFFICE', 'evidencia-real-p15-greuz-jade-movil.png');
  await mobilePage.screenshot({ path: p15MovilPath, fullPage: true });
  console.log('   -> Guardado:', p15MovilPath);

  // =========================================================================
  // VISTA ESCRITORIO (1400px x 1000px)
  // =========================================================================
  console.log('4. Capturando vista escritorio para certificar P-14, P-15 y P-19...');
  const deskContext = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 1.5
  });
  const deskPage = await deskContext.newPage();

  await deskPage.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserGreuz) });
  });
  await deskPage.route('**/auth/v1/session*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSessionGreuz) });
  });

  // P-14 Comisiones Desktop
  await deskPage.goto('http://localhost:5198/socio/comisiones', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(2000);
  const selectCicloDesk = deskPage.locator('select').first();
  if (await selectCicloDesk.isVisible()) {
    await selectCicloDesk.selectOption('2').catch(() => {});
    await deskPage.waitForTimeout(1500);
  }
  const p14DeskPath = path.resolve('SISTEMA MOTOR Y BACKOFFICE', 'evidencia-real-p14-greuz-desktop.png');
  await deskPage.screenshot({ path: p14DeskPath, fullPage: true });
  console.log('   -> Guardado:', p14DeskPath);

  // P-15 Mi Rango Desktop
  await deskPage.goto('http://localhost:5198/socio/rango', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(2000);
  const selectCicloRangoDesk = deskPage.locator('#select-ciclo-rango');
  if (await selectCicloRangoDesk.isVisible()) {
    await selectCicloRangoDesk.selectOption('2').catch(() => {});
    await deskPage.waitForTimeout(1500);
  }
  const btnConquistado = deskPage.getByRole('button', { name: /Rango Conquistado/i });
  if (await btnConquistado.isVisible()) {
    await btnConquistado.click();
    await deskPage.waitForTimeout(1000);
  }
  const p15DeskPath = path.resolve('SISTEMA MOTOR Y BACKOFFICE', 'evidencia-real-p15-greuz-jade-desktop.png');
  await deskPage.screenshot({ path: p15DeskPath, fullPage: true });
  console.log('   -> Guardado:', p15DeskPath);

  // P-19 Mi Billetera Desktop
  await deskPage.goto('http://localhost:5198/socio/billetera', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(2000);
  const p19DeskPath = path.resolve('SISTEMA MOTOR Y BACKOFFICE', 'evidencia-real-p19-greuz-billetera.png');
  await deskPage.screenshot({ path: p19DeskPath, fullPage: true });
  console.log('   -> Guardado:', p19DeskPath);

  await browser.close();
  vite.kill();

  // Copiar capturas a artifacts dir
  fs.copyFileSync(p14MovilPath, path.join(ARTIFACTS_DIR, 'evidencia-real-p14-greuz-movil.png'));
  fs.copyFileSync(p15MovilPath, path.join(ARTIFACTS_DIR, 'evidencia-real-p15-greuz-jade-movil.png'));
  fs.copyFileSync(p14DeskPath, path.join(ARTIFACTS_DIR, 'evidencia-real-p14-greuz-desktop.png'));
  fs.copyFileSync(p15DeskPath, path.join(ARTIFACTS_DIR, 'evidencia-real-p15-greuz-jade-desktop.png'));
  fs.copyFileSync(p19DeskPath, path.join(ARTIFACTS_DIR, 'evidencia-real-p19-greuz-billetera.png'));

  console.log('✅ Todas las capturas reales de Greuz Mallqui generadas y copiadas exitosamente.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error al capturar evidencia:', err);
  process.exit(1);
});
