import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';
const BACKOFFICE_DIR = 'C:/Users/JACK FRANKLIN/Downloads/Win max/SISTEMA-MAX-GLOBAL/SISTEMA MOTOR Y BACKOFFICE';
const LANDING_DIR = 'C:/Users/JACK FRANKLIN/Downloads/Win max/SISTEMA-MAX-GLOBAL/SITIO WEB 06 PAGINAS LANDINGS';

async function main() {
  console.log('--- Iniciando generador de capturas para TAREA-20 ---');

  // 1. Iniciar servidor Vite de la Landing en puerto 5198
  console.log('Iniciando servidor Vite de la Landing en puerto 5198...');
  const viteLanding = spawn('npx.cmd', ['vite', '--port', '5198'], {
    cwd: LANDING_DIR,
    shell: true,
    stdio: 'pipe'
  });

  // 2. Iniciar servidor Vite del Backoffice en puerto 5199
  console.log('Iniciando servidor Vite del Backoffice en puerto 5199...');
  const viteBackoffice = spawn('npx.cmd', ['vite', '--port', '5199'], {
    cwd: BACKOFFICE_DIR,
    shell: true,
    stdio: 'pipe'
  });

  // Esperar a que ambos servidores estén listos
  await Promise.all([
    new Promise((resolve) => {
      viteLanding.stdout.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('5198') || msg.includes('ready') || msg.includes('Local:')) resolve();
      });
      setTimeout(resolve, 4000);
    }),
    new Promise((resolve) => {
      viteBackoffice.stdout.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('5199') || msg.includes('ready') || msg.includes('Local:')) resolve();
      });
      setTimeout(resolve, 4000);
    })
  ]);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 850 }
    });
    const page = await context.newPage();

    // =========================================================================
    // CAPTURA 1: P-16 de Karla mostrando el enlace con el dominio de la LANDING
    // =========================================================================
    console.log('Paso 1: Iniciando sesión como Karla (socio 12)...');
    await page.goto('http://localhost:5199/login');
    await page.fill('input[type="email"], input[placeholder*="correo" i]', 'socio012@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log('Navegando a P-16 Mi Enlace (/socio/enlace)...');
    await page.goto('http://localhost:5199/socio/enlace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Tomando Captura 1: P-16 con enlace de Karla y dominio landing...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p16-enlace-karla-landing.png');
    await page.screenshot({ path: pathCap1 });
    console.log('✓ Captura 1 guardada en:', pathCap1);

    // =========================================================================
    // CAPTURA 2: Enlace abierto en la landing con el formulario (sin 404)
    // =========================================================================
    console.log('Paso 2: Abriendo enlace en la landing con ref=MG00012...');
    const landingPage = await context.newPage();

    // Interceptar la solicitud hacia la Edge Function para inyectar una IP de prueba única
    await landingPage.route('**/functions/v1/registro-afiliacion', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = JSON.parse(request.postData() || '{}');
        postData.ip = `10.199.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
        route.continue({
          postData: JSON.stringify(postData)
        });
      } else {
        route.continue();
      }
    });

    await landingPage.goto('http://localhost:5198/registro?ref=MG00012');
    await landingPage.waitForLoadState('networkidle');
    await landingPage.waitForTimeout(1500);

    console.log('Tomando Captura 2: Landing /registro?ref=MG00012 con formulario...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-landing-formulario-referido.png');
    await landingPage.screenshot({ path: pathCap2 });
    console.log('✓ Captura 2 guardada en:', pathCap2);

    // =========================================================================
    // CAPTURA 3: Formulario enviado y pantalla de confirmación
    // =========================================================================
    console.log('Paso 3: Completando y enviando formulario de afiliación...');
    const emailUnico = `roberto_${Date.now()}@gmail.test`;
    await landingPage.fill('[data-testid="input-nombre"]', 'ROBERTO GUTIERREZ');
    await landingPage.fill('[data-testid="input-dni"]', '71829304');
    await landingPage.fill('[data-testid="input-telefono"]', '987654321');
    await landingPage.fill('[data-testid="input-email"]', emailUnico);
    await landingPage.selectOption('[data-testid="select-departamento"]', 'Lima');
    await landingPage.fill('[data-testid="input-provincia"]', 'Lima');
    await landingPage.fill('[data-testid="input-direccion"]', 'Av. Jose Pardo 640, Depto 402');
    await landingPage.selectOption('[data-testid="select-pack"]', 'gold');
    await landingPage.check('[data-testid="checkbox-consent"]');
    await landingPage.waitForTimeout(500);

    console.log('Enviando solicitud...');
    await landingPage.click('button[type="submit"]');
    await landingPage.waitForURL('**/confirmacion', { timeout: 15000 });
    await landingPage.waitForLoadState('networkidle');
    await landingPage.waitForTimeout(2000);

    console.log('Tomando Captura 3: Pantalla de confirmación oficial...');
    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-landing-confirmacion.png');
    await landingPage.screenshot({ path: pathCap3 });
    console.log('✓ Captura 3 guardada en:', pathCap3);

    // =========================================================================
    // CAPTURA 4: P-31 con la solicitud recién llegada ("Referido por: KARLA")
    // =========================================================================
    console.log('Paso 4: Iniciando sesión como Administrador en backoffice...');
    await page.goto('http://localhost:5199/login');
    await page.fill('input[type="email"], input[placeholder*="correo" i]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log('Navegando a P-31 Solicitudes de Afiliación (/admin/solicitudes)...');
    await page.goto('http://localhost:5199/admin/solicitudes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Tomando Captura 4: P-31 con solicitud de Roberto referida por Karla...');
    const pathCap4 = path.join(ARTIFACTS_DIR, 'captura-p31-solicitudes-nueva-karla.png');
    await page.screenshot({ path: pathCap4 });
    console.log('✓ Captura 4 guardada en:', pathCap4);

    // =========================================================================
    // CAPTURA 5: P-22 abierto desde P-31 con datos precargados
    // =========================================================================
    console.log('Paso 5: Haciendo click en "Convertir a Socio" para Roberto...');
    const botonConvertir = page.locator('button:has-text("Convertir")').first();
    await botonConvertir.click();

    await page.waitForURL('**/admin/afiliacion', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Tomando Captura 5: P-22 con datos precargados desde la solicitud...');
    const pathCap5 = path.join(ARTIFACTS_DIR, 'captura-p22-precargada-desde-solicitud.png');
    await page.screenshot({ path: pathCap5 });
    console.log('✓ Captura 5 guardada en:', pathCap5);

    console.log('Todas las 5 capturas se generaron con éxito.');
  } catch (err) {
    console.error('Error durante la generación de capturas:', err);
    throw err;
  } finally {
    await browser.close();
    viteLanding.kill();
    viteBackoffice.kill();
  }
}

main().catch((err) => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
