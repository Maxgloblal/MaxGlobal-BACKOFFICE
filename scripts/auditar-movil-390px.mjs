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
  dni: '12345678',
  telefono: '987654321',
  direccion: 'Av. Primavera 123, Lima',
  ciudad: 'Lima',
  pack_id: 3,
  pack: { id: 3, nombre: 'Pack Gold', codigo: 'GOLD', precio_cent: 120000, solo_afilia_igual: false, descuento_recompra_pct: 50 },
  banco: 'BCP',
  cuenta_bancaria: '194-12345678-0-12',
  cci: '00219400123456780123'
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
  { clave: 'activacion_puntos_mes', valor: '70' },
  { clave: 'monto_minimo_retiro_cent', valor: '10000' }
];

const MOCK_PRODUCTOS = [
  { id: 1, codigo: 'PROD-01', nombre: 'Moringa Clásica', precio_lista_cent: 15000, puntos: 18, imagen_url: 'https://placehold.co/100x100?text=Moringa' },
  { id: 2, codigo: 'PROD-02', nombre: 'Café Ganoderma', precio_lista_cent: 15000, puntos: 18, imagen_url: 'https://placehold.co/100x100?text=Cafe' }
];

async function main() {
  console.log('Iniciando servidor Vite para auditoría móvil 390px en puerto 5195...');
  const vite = spawn('npx.cmd', ['vite', '--port', '5195'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    vite.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('5195') || msg.includes('ready') || msg.includes('Local:')) resolve();
    });
    setTimeout(resolve, 3500);
  });

  console.log('Lanzando Playwright en viewport 390x844 (móvil)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const resultados = [];

  try {
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
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PRODUCTOS) });
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
            rango_honorifico: { nombre: 'Plata' },
            rango_alcanzado_en_vivo: { nombre: 'Oro' },
            rango_siguiente: { nombre: 'Platino', puntos_requeridos: 8000, frontales_requeridos: 4 },
            lineas: [
              { socio_id: 10, nombre_completo: 'Beto Ramos', puntos_totales_rama: 5000, puntos_computados: 4000, activo: true },
              { socio_id: 11, nombre_completo: 'Carla Díaz', puntos_totales_rama: 2000, puntos_computados: 2000, activo: true }
            ],
            rangos_escala: [
              { nombre: 'Bronce', definido: true, puntos_grupales: 1000, frontales_activos: 2 },
              { nombre: 'Plata', definido: true, puntos_grupales: 3000, frontales_activos: 3 },
              { nombre: 'Oro', definido: true, puntos_grupales: 6000, frontales_activos: 3 },
              { nombre: 'Platino', definido: true, puntos_grupales: 8000, frontales_activos: 4 }
            ]
          })
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    const rutas = [
      { id: 'p10', nombre: 'P10-Login', url: '/login', role: 'none' },
      { id: 'p11', nombre: 'P11-PanelSocio', url: '/socio', role: 'socio' },
      { id: 'p12', nombre: 'P12-MiRed', url: '/socio/red', role: 'socio' },
      { id: 'p13', nombre: 'P13-Tienda', url: '/socio/tienda', role: 'socio' },
      { id: 'p14', nombre: 'P14-Comisiones', url: '/socio/comisiones', role: 'socio' },
      { id: 'p15', nombre: 'P15-MiRango', url: '/socio/rango', role: 'socio' },
      { id: 'p16', nombre: 'P16-MiEnlace', url: '/socio/enlace', role: 'socio' },
      { id: 'p17', nombre: 'P17-MisPedidos', url: '/socio/pedidos', role: 'socio' },
      { id: 'p18', nombre: 'P18-MiPerfil', url: '/socio/perfil', role: 'socio' },
      { id: 'p19', nombre: 'P19-MiBilletera', url: '/socio/billetera', role: 'socio' },
      { id: 'p20', nombre: 'P20-TableroAdmin', url: '/admin', role: 'admin' },
      { id: 'p23', nombre: 'P23-BandejaConfirmacion', url: '/admin/confirmacion', role: 'admin' },
      { id: 'p25', nombre: 'P25-CierreCiclo', url: '/admin/cierre', role: 'admin' },
      { id: 'p27', nombre: 'P27-GestionSocios', url: '/admin/socios', role: 'admin' },
      { id: 'p30', nombre: 'P30-GestionRetiros', url: '/admin/retiros', role: 'admin' },
      { id: 'p32', nombre: 'P32-GestionProductos', url: '/admin/productos', role: 'admin' }
    ];

    // Primero navegar a login para establecer contexto
    await page.goto('http://localhost:5195/login');

    for (const r of rutas) {
      if (r.role === 'admin') {
        currentUser = userAdmin;
        currentSession = sessionAdmin;
      } else if (r.role === 'socio') {
        currentUser = userSocio;
        currentSession = sessionSocio;
      }

      if (r.role !== 'none') {
        await page.evaluate((sess) => {
          localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(sess));
          localStorage.setItem('sb-utlohnidkuvxqppmoevj-auth-token', JSON.stringify(sess));
        }, currentSession);
      } else {
        await page.evaluate(() => {
          localStorage.clear();
        });
      }

      await page.goto(`http://localhost:5195${r.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const metricas = await page.evaluate(() => {
        const doc = document.documentElement;
        const winWidth = window.innerWidth;
        const scrollWidth = doc.scrollWidth;
        const hasOverflow = scrollWidth > winWidth;

        let desbordados = [];
        if (hasOverflow) {
          const allEls = Array.from(document.querySelectorAll('*'));
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '';
              desbordados.push({
                selector: cls ? `${tag}.${cls}` : tag,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
              if (desbordados.length >= 5) break;
            }
          }
        }

        return { winWidth, scrollWidth, hasOverflow, desbordados };
      });

      const shotPath = path.join(ARTIFACTS_DIR, `tarea69-movil-390px-${r.id}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      console.log(`[${r.nombre}] scrollWidth: ${metricas.scrollWidth}px (viewport: ${metricas.winWidth}px) | Desborde: ${metricas.hasOverflow ? 'SI 🔴' : 'NO ✅'}`);

      resultados.push({
        pantalla: r.nombre,
        url: r.url,
        scrollWidth: metricas.scrollWidth,
        winWidth: metricas.winWidth,
        desborde: metricas.hasOverflow,
        elementosDesbordados: metricas.desbordados,
        captura: shotPath
      });
    }

    console.log('\n=== AUDITORÍA MÓVIL 390PX COMPLETADA ===');
    console.log(`Total pantallas auditadas: ${resultados.length}`);
    const conDesborde = resultados.filter(r => r.desborde);
    console.log(`Pantallas con desborde horizontal: ${conDesborde.length}`);

  } catch (err) {
    console.error('Error durante la auditoría móvil:', err);
    process.exit(1);
  } finally {
    try { await browser.close(); } catch (_) {}
    try { vite.kill(); } catch (_) {}
    process.exit(0);
  }
}

main();
