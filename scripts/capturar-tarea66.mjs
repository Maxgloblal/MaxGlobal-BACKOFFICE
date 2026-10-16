import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

// Datos oficiales devueltos por public.fn_rango_lineas_socio(7, 2) en producción
const DATOS_SONIA_ESCOBAR = {
  exito: true,
  activo: true,
  ciclo_id: 2,
  puntos_personales: 70,
  tope_linea_evaluado: 4000,
  puntos_objetivo_evaluado: 8000,
  rango_alcanzado_en_vivo: {
    id: 4,
    orden: 4,
    codigo: 'ORO',
    nombre: 'Oro',
    definido: true,
    bono_cent: 50000,
    puntos_grupales: 4000,
    frontales_activos: 3
  },
  rango_siguiente: {
    id: 5,
    orden: 5,
    activo: true,
    codigo: 'PLATINO',
    nombre: 'Platino',
    definido: true,
    bono_cent: 150000,
    puntos_grupales: 8000,
    frontales_activos: 4
  },
  rango_honorifico: {
    id: 1,
    orden: 1,
    activo: true,
    codigo: 'JADE',
    nombre: 'Jade',
    definido: true,
    bono_cent: 5000,
    puntos_grupales: 500,
    frontales_activos: 1
  },
  rango_ciclo_anterior: {
    califica: true,
    ciclo_id: 1,
    rango_id: 1,
    socio_id: 7,
    bono_cent: 5000,
    rango_orden: 1,
    calculado_en: '2026-09-19T20:24:23.526+00:00',
    rango_codigo: 'JADE',
    rango_nombre: 'Jade',
    puntos_grupales: 2730,
    rango_puntos_req: 500,
    frontales_activos: 2,
    puntos_personales: 150,
    puntos_computables: 500,
    puntos_linea_mayor: 2430,
    rango_frontales_req: 1
  },
  rango_ciclo: {
    id: null,
    detalle: {},
    califica: true,
    ciclo_id: 2,
    rango_id: 4,
    socio_id: 7,
    bono_cent: 50000,
    motivo_bono: 'asciende',
    rango_orden: 4,
    calculado_en: new Date().toISOString(),
    rango_codigo: 'ORO',
    rango_nombre: 'Oro',
    puntos_grupales: 7492,
    rango_puntos_req: 4000,
    frontales_activos: 4,
    puntos_computables: 4550,
    puntos_linea_mayor: 4942,
    rango_frontales_req: 3
  },
  lineas: [
    {
      activo: true,
      frontal_id: 11,
      es_linea_mayor: true,
      frontal_codigo: 'MG00011',
      frontal_nombre: 'AGAPE CORNELIO CHOQUEÑA ZAPANA',
      tope_alcanzado: true,
      puntos_computados: 4000,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 4942
    },
    {
      activo: true,
      frontal_id: 42,
      es_linea_mayor: false,
      frontal_codigo: 'MG00042',
      frontal_nombre: 'GLORIA NELLY MAMANI APAZA',
      tope_alcanzado: false,
      puntos_computados: 950,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 950
    },
    {
      activo: true,
      frontal_id: 57,
      es_linea_mayor: false,
      frontal_codigo: 'MG00057',
      frontal_nombre: 'WILBER RICARDO CUSI SANTOS',
      tope_alcanzado: false,
      puntos_computados: 800,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 800
    },
    {
      activo: true,
      frontal_id: 58,
      es_linea_mayor: false,
      frontal_codigo: 'MG00058',
      frontal_nombre: 'TANIA MARILIZ VILLANUEVA CARRION',
      tope_alcanzado: false,
      puntos_computados: 800,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 800
    },
    {
      activo: false,
      frontal_id: 20,
      es_linea_mayor: false,
      frontal_codigo: 'MG00020',
      frontal_nombre: 'LEONE BRANDO CHOQUE ESCOBAR',
      tope_alcanzado: false,
      puntos_computados: 0,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 0
    },
    {
      activo: false,
      frontal_id: 41,
      es_linea_mayor: false,
      frontal_codigo: 'MG00041',
      frontal_nombre: 'GLORIA NELLY MAMANI APAZA',
      tope_alcanzado: false,
      puntos_computados: 0,
      tope_maximo_linea: 4000,
      puntos_totales_rama: 0
    }
  ],
  rangos_escala: [
    { id: 1, orden: 1, codigo: 'JADE', nombre: 'Jade', definido: true, bono_cent: 5000, puntos_grupales: 500, frontales_activos: 1 },
    { id: 2, orden: 2, codigo: 'BRONCE', nombre: 'Bronce', definido: true, bono_cent: 10000, puntos_grupales: 1000, frontales_activos: 2 },
    { id: 3, orden: 3, codigo: 'PLATA', nombre: 'Plata', definido: true, bono_cent: 20000, puntos_grupales: 2000, frontales_activos: 2 },
    { id: 4, orden: 4, codigo: 'ORO', nombre: 'Oro', definido: true, bono_cent: 50000, puntos_grupales: 4000, frontales_activos: 3 },
    { id: 5, orden: 5, codigo: 'PLATINO', nombre: 'Platino', definido: true, bono_cent: 150000, puntos_grupales: 8000, frontales_activos: 4 },
    { id: 6, orden: 6, codigo: 'ESMERALDA', nombre: 'Esmeralda', definido: true, bono_cent: 300000, puntos_grupales: 15000, frontales_activos: 5 },
    { id: 7, orden: 7, codigo: 'ZAFIRO', nombre: 'Zafiro', definido: true, bono_cent: 500000, puntos_grupales: 30000, frontales_activos: 6 },
    { id: 8, orden: 8, codigo: 'DIAMANTE', nombre: 'Diamante', definido: true, bono_cent: 1000000, puntos_grupales: 60000, frontales_activos: 7 },
    { id: 9, orden: 9, codigo: 'DIAM-NEGRO', nombre: 'Diamante Negro', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 10, orden: 10, codigo: 'DOBLE-DIAM', nombre: 'Doble Diamante', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 11, orden: 11, codigo: 'TRIPLE-DIAM', nombre: 'Triple Diamante', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 12, orden: 12, codigo: 'CLUB-MILL', nombre: 'Club de Millonarios', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 13, orden: 13, codigo: 'IMPERIAL', nombre: 'Imperial', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 14, orden: 14, codigo: 'TITAN', nombre: 'Titán', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 15, orden: 15, codigo: 'EMB-ROYAL', nombre: 'Embajador Royal', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null },
    { id: 16, orden: 16, codigo: 'EMB-CORONA', nombre: 'Embajador Corona', definido: false, bono_cent: null, puntos_grupales: null, frontales_activos: null }
  ]
};

async function main() {
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
    setTimeout(resolve, 3500);
  });

  console.log('Abriendo navegador Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    const mockUser = {
      id: 'mock-user-id-7',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'escobarcastrosonia88@gmail.com',
      email_confirmed_at: '2026-09-01T00:00:00.000Z',
      app_metadata: { provider: 'email' },
      user_metadata: { socio_id: 7 }
    };

    const mockSession = {
      access_token: 'mock-jwt-token-7',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser
    };

    // Interceptar llamadas de auth
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession)
      });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      const accept = route.request().headers()['accept'] || '';

      if (url.includes('fn_rango_lineas_socio')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DATOS_SONIA_ESCOBAR)
        });
        return;
      }

      if (url.includes('/rest/v1/socio')) {
        const socioObj = {
          id: 7,
          codigo: 'MG00007',
          nombres: 'SONIA ESCOBAR',
          apellidos: 'CASTRO',
          email: 'escobarcastrosonia88@gmail.com',
          pack_id: 3,
          estado: 'activo'
        };
        const body = accept.includes('vnd.pgrst.object+json')
          ? JSON.stringify(socioObj)
          : JSON.stringify([socioObj]);
        await route.fulfill({ status: 200, contentType: 'application/json', body });
        return;
      }

      if (url.includes('/rest/v1/ciclo')) {
        const cicloObj = {
          id: 2,
          numero: 2,
          anio: 2026,
          mes: 10,
          estado: 'abierto',
          fecha_inicio: '2026-10-01',
          fecha_fin: '2026-10-31'
        };
        const body = accept.includes('vnd.pgrst.object+json')
          ? JSON.stringify(cicloObj)
          : JSON.stringify([
              cicloObj,
              { id: 1, numero: 1, anio: 2026, mes: 9, estado: 'cerrado', fecha_inicio: '2026-09-01', fecha_fin: '2026-09-30' }
            ]);
        await route.fulfill({ status: 200, contentType: 'application/json', body });
        return;
      }

      await route.continue();
    });

    // Inyectar token en localStorage
    await page.goto('http://localhost:5199/login');
    await page.evaluate((session) => {
      localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(session));
      localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(session));
    }, mockSession);

    console.log('Navegando a P-15 Mi Rango como Sonia Escobar (MG00007)...');
    await page.goto('http://localhost:5199/socio/rango');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const fileP15 = path.join(ARTIFACTS_DIR, 'tarea66-p15-sonia-escobar-sincronizado.png');
    await page.screenshot({ path: fileP15, fullPage: true });
    console.log('✓ Captura guardada en:', fileP15);

  } catch (err) {
    console.error('Error durante la captura:', err);
  } finally {
    await browser.close();
    vite.kill();
  }
}

main();
