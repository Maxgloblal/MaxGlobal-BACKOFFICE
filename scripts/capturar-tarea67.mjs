import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

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
  { clave: 'techo_comisiones_patrocinio_pct', valor: '50' },
  { clave: 'techo_comisiones_residual_pct', valor: '35' },
  { clave: 'monto_minimo_retiro_cent', valor: '10000' }
];

async function main() {
  console.log('Iniciando servidor Vite en puerto 5198...');
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

  console.log('Abriendo navegador Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1100 } });
  const page = await context.newPage();

  try {
    const mockUser = {
      id: 'mock-admin-id-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'admin@maxglobal.test',
      email_confirmed_at: '2026-09-01T00:00:00.000Z',
      app_metadata: { provider: 'email' },
      user_metadata: { socio_id: 1, rol: 'admin' }
    };

    const mockSession = {
      access_token: 'mock-jwt-token-admin',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser
    };

    // Interceptar llamadas de auth
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
    });

    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Interceptar llamadas REST
    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      const accept = route.request().headers()['accept'] || '';
      console.log('INTERCEPT:', url, '| accept:', accept);

      if (url.includes('/rest/v1/socio')) {
        const socioAdmin = {
          id: 1,
          codigo: 'MG00001',
          nombres: 'ADMINISTRADOR',
          apellidos: 'GENERAL',
          email: 'admin@maxglobal.test',
          rol: 'admin',
          estado: 'activo'
        };
        const body = accept.includes('vnd.pgrst.object+json')
          ? JSON.stringify(socioAdmin)
          : JSON.stringify([socioAdmin]);
        await route.fulfill({ status: 200, contentType: 'application/json', body });
        return;
      }

      if (url.includes('/rest/v1/ciclo')) {
        const body = accept.includes('vnd.pgrst.object+json')
          ? JSON.stringify(MOCK_CICLO)
          : JSON.stringify([MOCK_CICLO]);
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

      if (url.includes('/rest/v1/orden')) {
        // Pedidos sin confirmar = 0 (RF-371 aprobado)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/0' },
          body: JSON.stringify([])
        });
        return;
      }

      if (url.includes('/rest/v1/comision')) {
        // Retornar comisiones para el ciclo 3
        const mockComisiones = [
          { id: 1, tipo: 'patrocinio', monto_cent: 679540, estado: 'confirmada', beneficiario_id: 2 },
          { id: 2, tipo: 'residual', monto_cent: 608428, estado: 'confirmada', beneficiario_id: 2 }
        ];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-1/2' },
          body: JSON.stringify(mockComisiones)
        });
        return;
      }

      if (url.includes('fn_calcular_y_persistir_rangos')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exito: true,
            ciclo_id: 3,
            soloCalculo: true,
            evaluados: 501,
            califican: 8,
            totalBonoCent: 60000,
            comisionesCreadas: 8,
            comisiones: [
              { beneficiario_id: 2, tipo: 'rango', monto_cent: 20000, rango_codigo: 'PLATA' }
            ]
          })
        });
        return;
      }

      if (url.includes('fn_ejecutar_cierre_ciclo')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exito: true,
            ciclo_cerrado_id: 3,
            ciclo_nuevo_id: 4,
            total_abonado_cent: 1347968
          })
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Inyectar tokens en localStorage
    await page.goto('http://localhost:5198/login');
    await page.evaluate((session) => {
      localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(session));
      localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(session));
    }, mockSession);

    console.log('Navegando a P-25 Cierre de Ciclo Mensual (/admin/cierre)...');
    await page.goto('http://localhost:5198/admin/cierre');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    const fileP25 = path.join(ARTIFACTS_DIR, 'tarea67-p25-cierre-guardas.png');
    await page.screenshot({ path: fileP25, fullPage: true });
    console.log('✓ Captura guardada en:', fileP25);

  } catch (err) {
    console.error('Error durante la captura:', err);
  } finally {
    await browser.close();
    vite.kill();
  }
}

main();
