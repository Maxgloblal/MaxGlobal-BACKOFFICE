import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  console.log('--- Iniciando generador de capturas para TAREA-22 ---');

  // 1. Iniciar servidor Vite en puerto 5199
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
    setTimeout(resolve, 4000);
  });

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 850 }
    });
    const page = await context.newPage();

    // Manejador automático para diálogos confirm()
    page.on('dialog', async (dialog) => {
      console.log(`[Dialog] ${dialog.message()} -> Aceptando`);
      await dialog.accept();
    });

    // 1. Iniciar sesión como Administrador (Máximo / socio001)
    console.log('Iniciando sesión como Admin (socio001@ejemplo.test)...');
    await page.goto('http://localhost:5199/login');
    await page.fill('input[type="email"], input[placeholder*="correo" i]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Navegar a P-32 Gestión de Productos
    console.log('Navegando a P-32 (/admin/productos)...');
    await page.goto('http://localhost:5199/admin/productos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // CAPTURA 1: P-32 con la lista de los 8 productos y sus miniaturas
    console.log('Tomando Captura 1: Lista de 8 productos con miniaturas...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p32-lista-productos.png');
    await page.screenshot({ path: pathCap1 });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // 3. Abrir modal "Nuevo producto"
    console.log('Abriendo modal "Nuevo producto"...');
    await page.click('button:has-text("Nuevo producto")');
    await page.waitForTimeout(600);

    // Llenar datos para activar panel de consecuencias exacto: S/. 150.00 y 18 puntos
    await page.fill('input[placeholder="EJ: CAFE, HAR-MORINGA"]', 'CAFE-DEMO');
    await page.fill('input[placeholder="EJ: Coffee Capuccino"]', 'Coffee Capuccino Demo');
    await page.fill('input[placeholder="150.00"]', '150.00');
    await page.fill('input[placeholder="18"]', '18');
    await page.waitForTimeout(600);

    // CAPTURA 2: Formulario de crear con panel de consecuencias mostrando S/. 57.54 y S/. 132.54
    console.log('Tomando Captura 2: Panel de consecuencias (S/. 57.54 y S/. 132.54)...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p32-formulario-consecuencias.png');
    await page.screenshot({ path: pathCap2 });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // 4. Provocar salida de la banda (ej: 35 puntos para precio 100)
    console.log('Ajustando puntos para salir de la banda...');
    await page.fill('input[placeholder="150.00"]', '100.00');
    await page.fill('input[placeholder="18"]', '35');
    await page.waitForTimeout(600);

    // CAPTURA 3: Aviso cuando los puntos se salen de la banda
    console.log('Tomando Captura 3: Aviso de fuera de banda...');
    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-p32-aviso-banda.png');
    await page.screenshot({ path: pathCap3 });
    console.log('✓ Captura 3 guardada:', pathCap3);

    // 5. Cerrar modal
    console.log('Cerrando modal...');
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(800);

    // 6. Desactivar un producto (DALBA) y capturar que sigue en la lista con badge Inactivo
    console.log('Desactivando temporalmente producto DALBA...');
    const filaDalba = page.locator('tr:has-text("DALBA")');
    const btnDesactivar = filaDalba.locator('button[title="Desactivar producto"]');
    await btnDesactivar.click();

    // Esperar a que desaparezca el texto de carga y la fila de DALBA muestre INACTIVO
    console.log('Esperando actualizacion de tabla...');
    await page.waitForSelector('text=Cargando catálogo de productos...', { state: 'detached', timeout: 15000 }).catch(() => {});
    await page.waitForSelector('tr:has-text("DALBA"):has-text("INACTIVO")', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Hacer scroll para mostrar la fila de DALBA
    const filaDalbaInactiva = page.locator('tr:has-text("DALBA")');
    await filaDalbaInactiva.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // CAPTURA 4: Producto desactivado que sigue en la lista
    console.log('Tomando Captura 4: Producto desactivado presente en la lista...');
    const pathCap4 = path.join(ARTIFACTS_DIR, 'captura-p32-producto-desactivado.png');
    await page.screenshot({ path: pathCap4 });
    console.log('✓ Captura 4 guardada:', pathCap4);

    // 7. Reactivar DALBA para restaurar estado oficial
    console.log('Reactivando DALBA para restaurar estado activo...');
    const btnReactivar = filaDalbaInactiva.locator('button[title="Activar producto"]');
    await btnReactivar.click();
    await page.waitForSelector('text=Cargando catálogo de productos...', { state: 'detached', timeout: 15000 }).catch(() => {});
    await page.waitForSelector('tr:has-text("DALBA"):has-text("ACTIVO")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log('✓ DALBA restaurado a estado activo.');

    console.log('--- Generación de las 4 capturas completada con éxito ---');
  } catch (err) {
    console.error('Error durante la generación de capturas:', err);
    process.exit(1);
  } finally {
    await browser.close();
    try { vite.kill(); } catch (e) {}
    process.exit(0);
  }
}

main();
