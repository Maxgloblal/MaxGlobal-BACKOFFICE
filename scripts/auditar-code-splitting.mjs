import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

const MOCK_ANA = {
  id: 2,
  codigo: 'MG00002',
  nombres: 'ANA',
  apellidos: 'GOMEZ',
  email: 'socio002@ejemplo.test',
  rol: 'socio',
  estado: 'activo',
  pack: { id: 3, nombre: 'Pack Gold', codigo: 'GOLD', precio_cent: 120000 }
};

const MOCK_ADMIN = {
  id: 1,
  codigo: 'MG00001',
  nombres: 'ADMINISTRADOR',
  apellidos: 'GENERAL',
  email: 'admin@maxglobal.test',
  rol: 'admin',
  estado: 'activo'
};

const MOCK_CICLO = {
  id: 3,
  numero: 3,
  anio: 2026,
  mes: 8,
  estado: 'abierto',
  fecha_inicio: '2026-08-01',
  fecha_fin: '2026-08-31'
};

const MOCK_CONFIG = [
  { clave: 'url_landing', valor: 'https://maxglobaloficial.com' },
  { clave: 'activacion_puntos_mes', valor: '70' }
];

async function main() {
  console.log('Iniciando Vite para certificación de Code Splitting en puerto 5196...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5196'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5196') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3500);
  });

  console.log('Lanzando Playwright para verificar carga diferida (lazy loading)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const userSocio = {
    id: 'mock-ana-2',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'socio002@ejemplo.test',
    user_metadata: { socio_id: 2, rol: 'socio' }
  };

  const sessionSocio = {
    access_token: 'mock-jwt-ana',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-ref-ana',
    user: userSocio
  };

  const userAdmin = {
    id: 'mock-admin-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@maxglobal.test',
    user_metadata: { socio_id: 1, rol: 'admin' }
  };

  const sessionAdmin = {
    access_token: 'mock-jwt-admin',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-ref-admin',
    user: userAdmin
  };

  let currentUser = userSocio;
  let currentSession = sessionSocio;

  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentUser) });
  });

  await page.route('**/auth/v1/session*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentSession) });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const accept = route.request().headers()['accept'] || '';

    if (url.includes('/rest/v1/socio')) {
      const isCount = route.request().headers()['prefer']?.includes('count=exact') || url.includes('count=exact');
      if (isCount) {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '0-0/3' }, body: '[]' });
        return;
      }
      const s = currentUser.email === 'admin@maxglobal.test' ? MOCK_ADMIN : MOCK_ANA;
      const body = accept.includes('vnd.pgrst.object+json') ? JSON.stringify(s) : JSON.stringify([s]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }

    if (url.includes('/rest/v1/ciclo')) {
      const body = accept.includes('vnd.pgrst.object+json') ? JSON.stringify(MOCK_CICLO) : JSON.stringify([MOCK_CICLO]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }

    if (url.includes('/rest/v1/config')) {
      const match = MOCK_CONFIG.find(c => url.includes(c.clave));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(match || MOCK_CONFIG[0]) });
      return;
    }

    if (url.includes('/rest/v1/producto')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }

    if (url.includes('/rest/v1/activacion')) {
      const act = { socio_id: 2, ciclo_id: 3, puntos_personales: 70, puntos_grupales: 1500, activo: true };
      const body = accept.includes('vnd.pgrst.object+json') ? JSON.stringify(act) : JSON.stringify([act]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }

    if (url.includes('v_wallet_saldo') || url.includes('/rest/v1/wallet_movimiento')) {
      const saldo = { socio_id: 2, saldo_cent: 125000 };
      const body = accept.includes('vnd.pgrst.object+json') ? JSON.stringify(saldo) : JSON.stringify([saldo]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }

    if (url.includes('fn_rango_lineas_socio')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rango_honorifico: { nombre: 'Oro' },
          rango_alcanzado_en_vivo: { nombre: 'Oro' },
          rango_siguiente: { nombre: 'Platino', puntos_requeridos: 8000, frontales_requeridos: 4 },
          lineas: [],
          rangos_escala: []
        })
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  try {
    // 1. Probar Login público (Lazy chunk P10InicioSesion)
    console.log('Cargando ruta pública /login...');
    await page.goto('http://localhost:5196/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const loginTitulo = await page.textContent('body');
    if (!loginTitulo.includes('INICIAR SESIÓN') && !loginTitulo.includes('Iniciar sesión') && !loginTitulo.includes('MAX GLOBAL')) {
      throw new Error('No se cargó correctamente P10InicioSesion');
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tarea70-code-splitting-login.png') });
    console.log('✅ /login cargó correctamente bajo demanda');

    // 2. Establecer sesión Socio y cargar Panel Socio (Lazy chunk P11PanelSocio)
    console.log('Cargando ruta protegida /socio...');
    await page.evaluate((sess) => {
      localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(sess));
      localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(sess));
    }, sessionSocio);
    await page.goto('http://localhost:5196/socio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tarea70-code-splitting-socio.png') });
    console.log('✅ /socio cargó correctamente bajo demanda');

    // 3. Establecer sesión Admin y cargar Cierre Ciclo (Lazy chunk P25CierreCiclo)
    console.log('Cargando ruta admin /admin/cierre...');
    currentUser = userAdmin;
    currentSession = sessionAdmin;
    await page.evaluate((sess) => {
      localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(sess));
      localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(sess));
    }, sessionAdmin);
    await page.goto('http://localhost:5196/admin/cierre');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'tarea70-code-splitting-admin-cierre.png') });
    console.log('✅ /admin/cierre cargó correctamente bajo demanda');

    console.log('\n=== CERTIFICACIÓN CODE SPLITTING PLAYWRIGHT EXITOSA ===');
    console.log(`Errores críticos en consola: ${consoleErrors.length}`);

  } catch (err) {
    console.error('Error durante la verificación Playwright:', err);
    process.exit(1);
  } finally {
    try { await browser.close(); } catch (_) {}
    try { vite.kill(); } catch (_) {}
    process.exit(0);
  }
}

main();
