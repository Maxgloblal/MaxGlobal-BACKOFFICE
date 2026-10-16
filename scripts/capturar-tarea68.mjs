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
  pack_id: 3,
  pack: {
    id: 3,
    nombre: 'Pack Gold',
    codigo: 'GOLD',
    precio_cent: 120000,
    solo_afilia_igual: false,
    descuento_recompra_pct: 50
  }
};

const MOCK_CONFIG = [
  { clave: 'url_landing', valor: 'https://maxglobaloficial.com' },
  { clave: 'activacion_puntos_mes', valor: '70' }
];

const MOCK_PRODUCTOS = [
  { id: 1, codigo: 'PROD-01', nombre: 'Moringa Clásica', imagen_url: 'https://placehold.co/100x100?text=Moringa' },
  { id: 2, codigo: 'PROD-02', nombre: 'Café Ganoderma', imagen_url: 'https://placehold.co/100x100?text=Cafe' }
];

const MOCK_ORDENES = [
  {
    id: 101,
    codigo: 'ORD-2026-101',
    tipo: 'recompra',
    estado: 'confirmada',
    total_cent: 15000,
    puntos_total: 70,
    canal: 'backoffice',
    creada_en: '2026-10-10T14:30:00.000Z',
    voucher: [
      {
        id: 1,
        estado: 'aprobado',
        monto_cent: 15000,
        numero_operacion: 'OP-987654',
        imagen_url: 'https://placehold.co/400x300?text=Voucher+OK',
        motivo_rechazo: null,
        revisado_en: '2026-10-10T15:00:00.000Z'
      }
    ],
    envio: [
      {
        id: 1,
        estado: 'despachado',
        guia_remision: 'GR-12345678',
        direccion_destino: 'Av. Los Próceres 450, Lima'
      }
    ],
    detalles: [
      {
        id: 1,
        cantidad: 2,
        precio_final_cent: 7500,
        puntos_unitario: 35,
        puntos_subtotal: 70,
        producto: { id: 1, nombre: 'Moringa Clásica', codigo: 'PROD-01' }
      }
    ]
  }
];

async function main() {
  console.log('Iniciando servidor Vite para TAREA-68 en puerto 5197...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5197'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5197') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3500);
  });

  console.log('Abriendo navegador Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1100 } });
  const page = await context.newPage();

  try {
    const mockUser = {
      id: 'mock-ana-id-2',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'socio002@ejemplo.test',
      email_confirmed_at: '2026-09-01T00:00:00.000Z',
      app_metadata: { provider: 'email' },
      user_metadata: { socio_id: 2, rol: 'socio' }
    };

    const mockSession = {
      access_token: 'mock-jwt-token-ana',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser
    };

    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
    });

    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      const accept = route.request().headers()['accept'] || '';

      if (url.includes('/rest/v1/socio')) {
        const isCount = route.request().headers()['prefer']?.includes('count=exact') || url.includes('count=exact');
        if (isCount) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': '0-0/3' },
            body: JSON.stringify([])
          });
          return;
        }

        const body = accept.includes('vnd.pgrst.object+json')
          ? JSON.stringify(MOCK_ANA)
          : JSON.stringify([MOCK_ANA]);
        await route.fulfill({ status: 200, contentType: 'application/json', body });
        return;
      }

      if (url.includes('/rest/v1/config')) {
        const match = MOCK_CONFIG.find(c => url.includes(c.clave));
        if (accept.includes('vnd.pgrst.object+json')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(match || MOCK_CONFIG[0]) });
        } else if (match) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([match]) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CONFIG) });
        }
        return;
      }

      if (url.includes('/rest/v1/producto')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PRODUCTOS)
        });
        return;
      }

      if (url.includes('/rest/v1/orden')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ORDENES)
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Inyectar tokens en localStorage
    await page.goto('http://localhost:5197/login');
    await page.evaluate((session) => {
      localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(session));
      localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(session));
    }, mockSession);

    // 1. Capturar P-16 Mi Enlace de Patrocinio
    console.log('Navegando a P-16 Mi Enlace (/socio/enlace)...');
    await page.goto('http://localhost:5197/socio/enlace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const fileP16 = path.join(ARTIFACTS_DIR, 'tarea68-p16-enlace-oficial.png');
    await page.screenshot({ path: fileP16, fullPage: true });
    console.log('✓ Captura P-16 guardada en:', fileP16);

    // 2. Capturar P-17 Mis Pedidos
    console.log('Navegando a P-17 Mis Pedidos (/socio/pedidos)...');
    await page.goto('http://localhost:5197/socio/pedidos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const fileP17 = path.join(ARTIFACTS_DIR, 'tarea68-p17-mis-pedidos-servicios.png');
    await page.screenshot({ path: fileP17, fullPage: true });
    console.log('✓ Captura P-17 guardada en:', fileP17);

  } catch (err) {
    console.error('Error durante la captura:', err);
  } finally {
    await browser.close();
    vite.kill();
  }
}

main();
