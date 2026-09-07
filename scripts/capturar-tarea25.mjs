import pkg from '@playwright/test';
const { chromium } = pkg;
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function capturar() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: errAuthAdmin } = await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });
  if (errAuthAdmin) console.warn('Admin auth warn:', errAuthAdmin.message);

  const testEmailCaptura = 'captura.t25@maxglobal.test';
  const testDocCaptura = '99778899';

  // Limpieza preventiva previa
  await sbAdmin.rpc('fn_test_limpiar_socio_prueba', { p_email: testEmailCaptura });

  try {
    // ----------------------------------------------------
    // 1. CAPTURA P-22: Credenciales de Acceso
    // ----------------------------------------------------
    console.log('1. Iniciando sesión como Admin para P-22...');
    await page.goto('http://localhost:4173/login');
    await page.fill('input[type="email"]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    console.log('Navegando a /admin/afiliacion...');
    await page.goto('http://localhost:4173/admin/afiliacion');
    await page.waitForSelector('#busqueda-patrocinador', { timeout: 15000 });

    // Buscar y seleccionar patrocinador
    await page.fill('#busqueda-patrocinador', 'Ana');
    await page.waitForTimeout(500);
    await page.waitForSelector('text=ANA QUISPE', { timeout: 10000 });
    await page.click('text=ANA QUISPE');

    // Confirmar patrocinador
    await page.waitForSelector('#check-confirmar-patrocinador', { timeout: 10000 });
    await page.check('#check-confirmar-patrocinador');

    // Llenar datos personales
    await page.fill('#documento', testDocCaptura);
    await page.fill('#nombres', 'Ruth');
    await page.fill('#apellidos', 'Condori Quispe');
    await page.fill('#email', testEmailCaptura);
    await page.fill('#telefono', '987654321');

    // Llenar voucher
    await page.fill('#num-operacion-pack', 'OP-CAP-T25-999');

    // Enviar afiliación
    console.log('Enviando formulario de afiliación...');
    await page.click('button[type="submit"]');

    // Esperar a la pantalla de éxito con las credenciales
    await page.waitForSelector('text=Credenciales de Acceso', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const destP22 = `${ARTIFACTS_DIR}/captura-credenciales-p22.png`;
    await page.screenshot({ path: destP22, fullPage: false });
    console.log('✓ Captura P-22 guardada en:', destP22);

    // ----------------------------------------------------
    // 2. CAPTURA P-11: Aviso de contraseña en panel del socio
    // ----------------------------------------------------
    console.log('2. Iniciando sesión como Socio (socio 2 Ana) para P-11...');
    await page.goto('http://localhost:4173/login');
    // Limpiar storage / cerrar sesión
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4173/login');
    await page.fill('input[type="email"]', 'socio002@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    console.log('En P-11 Panel del socio...');
    await page.waitForSelector('text=Estás usando la contraseña que te dieron al registrarte', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const destP11 = `${ARTIFACTS_DIR}/captura-aviso-password-p11.png`;
    await page.screenshot({ path: destP11, fullPage: false });
    console.log('✓ Captura P-11 guardada en:', destP11);

  } finally {
    // Limpieza del socio creado para captura
    console.log('Limpiando socio de captura...');
    await sbAdmin.rpc('fn_test_limpiar_socio_prueba', { p_email: testEmailCaptura });
    await browser.close();
  }
}

capturar().then(() => {
  console.log('Capturas completadas con éxito.');
  process.exit(0);
}).catch((err) => {
  console.error('Error durante capturas:', err);
  process.exit(1);
});
