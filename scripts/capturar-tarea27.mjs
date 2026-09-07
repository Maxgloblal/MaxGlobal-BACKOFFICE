import pkg from '@playwright/test';
const { chromium } = pkg;
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function ejecutar() {
  console.log('Iniciando navegador para capturas de TAREA-27...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
  const page = await context.newPage();

  try {
    // 1. Iniciar sesión como Admin
    console.log('Iniciando sesión...');
    await page.goto('http://localhost:4173/login');
    await page.fill('input[type="email"]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 2. Navegar a P-27 Gestión de Socios
    console.log('Navegando a P-27...');
    await page.goto('http://localhost:4173/admin/socios');
    await page.waitForSelector('table.tabla-limpia', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 3. Filtrar por "Activos en Ciclo 6"
    console.log('Aplicando filtro: Activos en Ciclo 6...');
    const selectFiltro = page.locator('select').nth(1); // El segundo select es estadoFiltro
    await selectFiltro.selectOption('activo');
    await page.waitForTimeout(2000);

    // Captura 1: El filtro "Activos en Ciclo 6" mostrando los 2 socios
    console.log('Tomando Captura 1: Filtro Activos en Ciclo 6 mostrando los 2 socios...');
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/captura-filtro-activos-ciclo6-p27.png`,
      fullPage: false
    });
    console.log('Captura 1 guardada con éxito.');

    // 4. Abrir la ficha de un socio para ver el nombre del ciclo dinámico
    console.log('Abriendo ficha de socio MG00012 (Karla Diaz)...');
    const btnFicha = page.locator('button:has-text("Ficha")').first();
    await btnFicha.waitFor({ state: 'visible', timeout: 10000 });
    await btnFicha.click();
    await page.waitForSelector('.dialogo-caja', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Captura 2: La ficha de un socio con el nombre del ciclo correcto
    console.log('Tomando Captura 2: Ficha del socio con ciclo correcto...');
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/captura-ficha-socio-ciclo-correcto-p27.png`,
      fullPage: false
    });
    console.log('Captura 2 guardada con éxito.');

  } catch (err) {
    console.error('Error durante la captura:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

ejecutar();
