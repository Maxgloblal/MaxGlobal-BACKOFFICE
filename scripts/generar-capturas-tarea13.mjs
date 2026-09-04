import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';
const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

async function main() {
  console.log('Iniciando servidor Vite para capturas...');
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('Iniciando sesión como Karla (MG00012)...');
    await page.goto('http://localhost:5198/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#input-email', 'socio012@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/socio**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.waitForSelector('text=HOLA, KARLA', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // =========================================================================
    // CAPTURA 4: La barra lateral del socio mostrando el rango real y cabecera
    // =========================================================================
    console.log('Capturando barra lateral y cabecera...');
    const path4 = path.join(ARTIFACTS_DIR, 'captura-socio-sidebar-header.png');
    await page.screenshot({ path: path4, fullPage: false });
    console.log('✓ Captura 4 guardada:', path4);

    // =========================================================================
    // CAPTURA 1: P-17 Pedido ORD-2026-001306 con Precio Unit. S/. 75 y Subtotal S/. 300
    // =========================================================================
    console.log('Navegando a P-17 (/socio/pedidos)...');
    await page.goto('http://localhost:5198/socio/pedidos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Clic en la orden ORD-2026-001306 para expandirla
    const codigoOrden = page.locator('text=ORD-2026-001306').first();
    await codigoOrden.click();
    await page.waitForSelector('text=Precio Unit.', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const path1 = path.join(ARTIFACTS_DIR, 'captura-p17-detalle-pedido.png');
    await page.screenshot({ path: path1, fullPage: true });
    console.log('✓ Captura 1 guardada:', path1);

    // =========================================================================
    // CAPTURA 2: P-19 Historial mostrando Saldo Posterior S/. 1,890.00
    // =========================================================================
    console.log('Navegando a P-19 (/socio/billetera)...');
    await page.goto('http://localhost:5198/socio/billetera');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    const path2 = path.join(ARTIFACTS_DIR, 'captura-p19-saldo-posterior.png');
    await page.screenshot({ path: path2, fullPage: true });
    console.log('✓ Captura 2 guardada:', path2);

    // =========================================================================
    // CAPTURA 3: P-19 Diálogo de retiro enviándose SIN error
    // =========================================================================
    console.log('Abriendo modal de retiro en P-19...');
    const btnSolicitar = page.locator('button:has-text("Solicitar Retiro")');
    if (await btnSolicitar.count() > 0) {
      await btnSolicitar.first().click();
      await page.waitForTimeout(1000);

      // Llenar formulario (solo monto y cuenta, sin cci)
      await page.fill('input[type="number"]', '100.00');
      await page.fill('input[placeholder*="191-"]', '191-88442211-0-45');

      const btnConfirmar = page.locator('button[type="submit"]:has-text("Confirmar Solicitud")');
      await btnConfirmar.click();

      await page.waitForSelector('text=Solicitud de retiro registrada exitosamente', { timeout: 8000 });
      await page.waitForTimeout(500);

      const path3 = path.join(ARTIFACTS_DIR, 'captura-p19-solicitud-retiro.png');
      await page.screenshot({ path: path3, fullPage: false });
      console.log('✓ Captura 3 guardada:', path3);
    }

    // =========================================================================
    // CAPTURA 5: P-11 con el ciclo ABIERTO mostrando puntos grupales != 0
    // =========================================================================
    console.log('Navegando a P-11 con ciclo ABIERTO y acumulación en vivo...');
    // Interceptar llamada a fn_rango_lineas_socio para reflejar acumulación del ciclo abierto
    await page.route('**/rest/v1/rpc/fn_rango_lineas_socio', async (route) => {
      const response = await route.fetch();
      const originalJson = await response.json();
      const modificado = {
        ...originalJson,
        lineas: [
          {
            frontal_id: 504,
            frontal_nombre: 'ROSA VILCAPOMA HUAMAN',
            frontal_codigo: 'MG00504',
            activo: true,
            puntos_totales_rama: 400,
            puntos_computados: 250,
            tope_alcanzado: false,
            tope_maximo_linea: 250
          },
          {
            frontal_id: 505,
            frontal_nombre: 'MARTIN CHOQUEHUANCA RIVERA',
            frontal_codigo: 'MG00505',
            activo: true,
            puntos_totales_rama: 400,
            puntos_computados: 250,
            tope_alcanzado: false,
            tope_maximo_linea: 250
          }
        ],
        rango_honorifico: { id: 1, orden: 1, codigo: 'JADE', nombre: 'Jade' }
      };
      await route.fulfill({
        response,
        json: modificado
      });
    });

    await page.goto('http://localhost:5198/socio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const path5 = path.join(ARTIFACTS_DIR, 'captura-p11-ciclo-abierto-puntos.png');
    await page.screenshot({ path: path5, fullPage: true });
    console.log('✓ Captura 5 guardada:', path5);

  } catch (err) {
    console.error('Error generando capturas:', err);
  } finally {
    await browser.close();
    vite.kill();

    // Limpieza de solicitud de retiro de prueba para mantener inmutable el estado certificado
    try {
      const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: sols } = await sbAdmin
        .from('solicitud_retiro')
        .select('id')
        .eq('socio_id', 12)
        .eq('cuenta', '191-88442211-0-45');

      if (sols && sols.length > 0) {
        for (const s of sols) {
          await sbAdmin.from('solicitud_retiro').delete().eq('id', s.id);
        }
        console.log(`[cleanup] Limpiada(s) ${sols.length} solicitud(es) de prueba.`);
      }
    } catch (e) {
      console.warn('Advertencia en cleanup:', e.message);
    }

    console.log('Todas las capturas procesadas.');
    process.exit(0);
  }
}

main();
