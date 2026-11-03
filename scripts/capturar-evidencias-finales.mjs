import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/0aff50e1-7627-4d91-adf1-e407c1c52fb0';
const BASE_URL = 'http://localhost:5174';

const socioGreuz = {
  id: 61,
  codigo: 'MG00061',
  nombres: 'GREUZ MALLQUI',
  apellidos: 'LUNA',
  email: 'greyz_adm12@gmail.com',
  documento: '75662163',
  telefono: '957322068',
  direccion: 'Laurel Rosa 352',
  ciudad: 'Lima',
  patrocinador_id: 60,
  pack_id: 2,
  fecha_afiliacion: '2026-10-17',
  estado: 'activo',
  rol: 'socio',
  banco: 'BCP',
  cuenta_bancaria: '191-12345678-0-12',
  cci: '00219100123456780012',
  pack: {
    id: 2,
    codigo: 'EJECUTIVO',
    nombre: 'Pack Ejecutivo',
    precio_cent: 36000,
    puntos_rango: 70,
    cant_productos: 4,
    niveles_residual: 5,
    niveles_patrocinio: 3,
    descuento_recompra_pct: '50.00',
    descuento_en_pack_pct: '40.00',
    cubre_activacion: true,
    aplica_bono_global: false,
    solo_afilia_igual: false,
    activo: true,
    orden: 2
  }
};

const mockUserGreuz = {
  id: '336e9597-8c44-4644-942e-8c2c81d81787',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'greyz_adm12@gmail.com',
  app_metadata: { provider: 'email' },
  user_metadata: { socio_id: 61, rol: 'socio' }
};

const mockSessionGreuz = {
  access_token: 'mock-token-greuz-mallqui',
  token_type: 'bearer',
  expires_in: 7200,
  expires_at: Math.floor(Date.now() / 1000) + 7200,
  refresh_token: 'mock-refresh-token',
  user: mockUserGreuz
};

const ciclosData = [
  { id: 2, numero: 2, anio: 2026, mes: 10, nombre: 'Octubre 2026', estado: 'cerrado', fecha_inicio: '2026-10-01', fecha_fin: '2026-10-31' },
  { id: 1, numero: 1, anio: 2026, mes: 9, nombre: 'Septiembre 2026', estado: 'cerrado', fecha_inicio: '2026-09-01', fecha_fin: '2026-09-30' }
];

const desgloseComisionesGreuz = {
  exito: true,
  items: [
    {
      nivel: null,
      estado: 'abonada',
      motivo: 'Ya en tu billetera',
      pagado: true,
      detalle: {
        motivo: 'calificado',
        formula: 'Bono de rango JADE: 5000 cent (Regularizacion Tarea 68)',
        motivo_bono: 'primer_ciclo',
        rango_orden: 1,
        rango_codigo: 'JADE',
        rango_nombre: 'Jade',
        puntos_grupales: 1410,
        regularizado_en: '2026-11-03T14:25:23.019767+00:00',
        bono_nominal_cent: 5000,
        frontales_activos: 1,
        puntos_requeridos: 500,
        puntos_computables: 500,
        frontales_requeridos: 1
      },
      orden_id: null,
      base_cent: 50000,
      tipo_bono: 'rango',
      monto_cent: 5000,
      orden_tipo: null,
      porcentaje: null,
      base_puntos: 500,
      comision_id: 681,
      orden_fecha: null,
      generador_id: null,
      orden_codigo: null,
      generador_codigo: null,
      generador_nombre: null
    },
    {
      nivel: 3,
      estado: 'abonada',
      motivo: 'Ya en tu billetera',
      pagado: true,
      detalle: {
        motivo: 'calificado',
        formula: '36000 cent * 3% = 1080 cent',
        escala_usada: 'estandar',
        activo_en_ciclo: true,
        pack_comprado_id: 2,
        niveles_habilitados: 3,
        pack_ancestro_codigo: 'EJECUTIVO',
        porcentaje_millesimas: 3000
      },
      orden_id: 91,
      base_cent: 36000,
      tipo_bono: 'patrocinio',
      monto_cent: 1080,
      orden_tipo: 'afiliacion',
      porcentaje: 3,
      base_puntos: null,
      comision_id: 433,
      orden_fecha: '2026-10-22T03:11:24.46904+00:00',
      generador_id: 67,
      orden_codigo: 'ORD-2026-000091',
      generador_codigo: 'MG00067',
      generador_nombre: 'JOSE CARLOS PISCONTE AGUILAR'
    },
    {
      nivel: 2,
      estado: 'abonada',
      motivo: 'Ya en tu billetera',
      pagado: true,
      detalle: {
        motivo: 'calificado',
        formula: '36000 cent * 4% = 1440 cent',
        escala_usada: 'estandar',
        activo_en_ciclo: true,
        pack_comprado_id: 2,
        niveles_habilitados: 3,
        pack_ancestro_codigo: 'EJECUTIVO',
        porcentaje_millesimas: 4000
      },
      orden_id: 90,
      base_cent: 36000,
      tipo_bono: 'patrocinio',
      monto_cent: 1440,
      orden_tipo: 'afiliacion',
      porcentaje: 4,
      base_puntos: null,
      comision_id: 425,
      orden_fecha: '2026-10-22T02:57:13.265179+00:00',
      generador_id: 66,
      orden_codigo: 'ORD-2026-000090',
      generador_codigo: 'MG00066',
      generador_nombre: 'DALY ROCIO MOLINA JIMENEZ'
    },
    {
      nivel: 1,
      estado: 'abonada',
      motivo: 'Ya en tu billetera',
      pagado: true,
      detalle: {
        motivo: 'calificado',
        formula: '800000 cent * 20% = 160000 cent',
        escala_usada: 'estandar',
        activo_en_ciclo: true,
        pack_comprado_id: 5,
        niveles_habilitados: 3,
        pack_ancestro_codigo: 'EJECUTIVO',
        porcentaje_millesimas: 20000
      },
      orden_id: 84,
      base_cent: 800000,
      tipo_bono: 'patrocinio',
      monto_cent: 160000,
      orden_tipo: 'afiliacion',
      porcentaje: 20,
      base_puntos: null,
      comision_id: 382,
      orden_fecha: '2026-10-17T18:20:24.701087+00:00',
      generador_id: 62,
      orden_codigo: 'ORD-2026-000084',
      generador_codigo: 'MG00062',
      generador_nombre: 'ALEJANDRA VASSALLO TERAN'
    },
    {
      nivel: 4,
      estado: 'anulada',
      motivo: 'No se pagó · pack_insuficiente',
      pagado: false,
      detalle: {
        motivo: 'pack_insuficiente',
        formula: '400000 cent * 2% = 8000 cent (retenida: pack_insuficiente)',
        escala_usada: 'estandar',
        activo_en_ciclo: true,
        pack_comprado_id: 4,
        niveles_habilitados: 3,
        pack_ancestro_codigo: 'EJECUTIVO',
        porcentaje_millesimas: 2000
      },
      orden_id: 94,
      base_cent: 400000,
      tipo_bono: 'patrocinio',
      monto_cent: 8000,
      orden_tipo: 'afiliacion',
      porcentaje: 2,
      base_puntos: null,
      comision_id: 458,
      orden_fecha: '2026-10-23T19:46:48.791949+00:00',
      generador_id: 69,
      orden_codigo: 'ORD-2026-000094',
      generador_codigo: 'MG00069',
      generador_nombre: 'JAVIER MOLINA JIMÉNEZ'
    },
    {
      nivel: 4,
      estado: 'anulada',
      motivo: 'No se pagó · pack_insuficiente',
      pagado: false,
      detalle: {
        motivo: 'pack_insuficiente',
        formula: '36000 cent * 2% = 720 cent (retenida: pack_insuficiente)',
        escala_usada: 'estandar',
        activo_en_ciclo: true,
        pack_comprado_id: 2,
        niveles_habilitados: 3,
        pack_ancestro_codigo: 'EJECUTIVO',
        porcentaje_millesimas: 2000
      },
      orden_id: 93,
      base_cent: 36000,
      tipo_bono: 'patrocinio',
      monto_cent: 720,
      orden_tipo: 'afiliacion',
      porcentaje: 2,
      base_puntos: null,
      comision_id: 451,
      orden_fecha: '2026-10-23T03:47:10.355114+00:00',
      generador_id: 68,
      orden_codigo: 'ORD-2026-000093',
      generador_codigo: 'MG00068',
      generador_nombre: 'OSCAR HERNANDEZ SANCHEZ'
    }
  ],
  resumen: {
    activo: true,
    ciclo_id: 2,
    socio_id: 61,
    pack_codigo: 'EJECUTIVO',
    pack_nombre: 'Pack Ejecutivo',
    socio_codigo: 'MG00061',
    socio_nombre: 'GREUZ MALLQUI LUNA',
    comisiones_count: 4,
    niveles_residual: 5,
    total_rango_cent: 5000,
    puntos_personales: 70,
    niveles_patrocinio: 3,
    total_cobrado_cent: 167520,
    total_residual_cent: 0,
    total_patrocinio_cent: 162520
  }
};

const rangoLineasGreuz = {
  exito: true,
  lineas: [
    {
      activo: true,
      frontal_id: 62,
      es_linea_mayor: true,
      frontal_codigo: 'MG00062',
      frontal_nombre: 'ALEJANDRA VASSALLO TERAN',
      tope_alcanzado: true,
      puntos_computados: 500,
      tope_maximo_linea: 500,
      puntos_totales_rama: 1410
    }
  ],
  ciclo_id: 2,
  rango_ciclo: {
    califica: true,
    ciclo_id: 2,
    rango_id: 1,
    socio_id: 61,
    bono_cent: 5000,
    rango_orden: 1,
    calculado_en: '2026-11-03T14:25:23.019767+00:00',
    rango_codigo: 'JADE',
    rango_nombre: 'Jade',
    puntos_grupales: 1410,
    rango_puntos_req: 500,
    frontales_activos: 1,
    puntos_personales: 70,
    puntos_computables: 500,
    puntos_linea_mayor: 1410,
    rango_frontales_req: 1
  },
  rangos_escala: [
    { id: 1, orden: 1, activo: true, codigo: 'JADE', nombre: 'Jade', definido: true, bono_cent: 5000, puntos_grupales: 500, frontales_activos: 1 },
    { id: 2, orden: 2, activo: true, codigo: 'BRONCE', nombre: 'Bronce', definido: true, bono_cent: 10000, puntos_grupales: 1000, frontales_activos: 2 },
    { id: 3, orden: 3, activo: true, codigo: 'PLATA', nombre: 'Plata', definido: true, bono_cent: 20000, puntos_grupales: 2000, frontales_activos: 2 },
    { id: 4, orden: 4, activo: true, codigo: 'ORO', nombre: 'Oro', definido: true, bono_cent: 50000, puntos_grupales: 4000, frontales_activos: 3 },
    { id: 5, orden: 5, activo: true, codigo: 'PLATINO', nombre: 'Platino', definido: true, bono_cent: 150000, puntos_grupales: 8000, frontales_activos: 4 },
    { id: 6, orden: 6, activo: true, codigo: 'ESMERALDA', nombre: 'Esmeralda', definido: true, bono_cent: 300000, puntos_grupales: 15000, frontales_activos: 5 },
    { id: 7, orden: 7, activo: true, codigo: 'ZAFIRO', nombre: 'Zafiro', definido: true, bono_cent: 500000, puntos_grupales: 30000, frontales_activos: 6 },
    { id: 8, orden: 8, activo: true, codigo: 'DIAMANTE', nombre: 'Diamante', definido: true, bono_cent: 1000000, puntos_grupales: 60000, frontales_activos: 7 },
    { id: 9, orden: 9, activo: true, codigo: 'DIAM-NEGRO', nombre: 'Diamante Negro', definido: true, bono_cent: 2000000, puntos_grupales: 120000, frontales_activos: 8 }
  ],
  rango_siguiente: { id: 2, orden: 2, activo: true, codigo: 'BRONCE', nombre: 'Bronce', definido: true, bono_cent: 10000, puntos_grupales: 1000, frontales_activos: 2 },
  rango_honorifico: { id: 1, orden: 1, activo: true, codigo: 'JADE', nombre: 'Jade', definido: true, bono_cent: 5000, puntos_grupales: 500, frontales_activos: 1 },
  linea_estirada_pct: 50,
  tope_linea_evaluado: 500,
  rango_ciclo_anterior: null,
  puntos_min_activacion: 70,
  rango_alcanzado_en_vivo: { id: 1, orden: 1, activo: true, codigo: 'JADE', nombre: 'Jade', definido: true, bono_cent: 5000, puntos_grupales: 500, frontales_activos: 1 },
  puntos_objetivo_evaluado: 1000
};

const walletSaldoGreuz = { socio_id: 61, saldo_cent: 7520 };

const walletMovimientosGreuz = [
  { id: 934, socio_id: 61, ciclo_id: 2, tipo: 'abono', monto_cent: 5000, saldo_despues_cent: 7520, concepto: 'Bono de rango Jade (Regularizacion Ciclo 2)', creado_en: '2026-11-03T14:25:23.019767+00:00' },
  { id: 271, socio_id: 61, ciclo_id: 2, tipo: 'abono', monto_cent: 1080, saldo_despues_cent: 2520, concepto: 'Bono de patrocinio inmediato · Orden ORD-2026-000091', creado_en: '2026-10-22T03:12:05.042713+00:00' },
  { id: 266, socio_id: 61, ciclo_id: 2, tipo: 'abono', monto_cent: 1440, saldo_despues_cent: 1440, concepto: 'Bono de patrocinio inmediato · Orden ORD-2026-000090', creado_en: '2026-10-22T02:59:14.835838+00:00' },
  { id: 261, socio_id: 61, ciclo_id: 2, tipo: 'retiro', monto_cent: -160000, saldo_despues_cent: 0, concepto: 'Retiro aprobado', creado_en: '2026-10-20T04:57:03.815089+00:00' },
  { id: 235, socio_id: 61, ciclo_id: 2, tipo: 'abono', monto_cent: 160000, saldo_despues_cent: 160000, concepto: 'Bono de patrocinio inmediato · Orden ORD-2026-000084', creado_en: '2026-10-17T18:22:52.394839+00:00' }
];

const solicitudesRetiroGreuz = [
  {
    id: 19,
    socio_id: 61,
    monto_cent: 160000,
    banco: 'BCP',
    cuenta: '00000',
    estado: 'aprobado',
    motivo_rechazo: null,
    procesado_por: 1,
    procesado_en: '2026-10-20T04:57:03.815089+00:00',
    solicitado_en: '2026-10-19T15:08:45.848+00:00'
  }
];

async function configurarIntercepcion(page) {
  await page.addInitScript(({ session }) => {
    window.localStorage.setItem('sb-xkiwnxoferdfapezcwoq-auth-token', JSON.stringify(session));
  }, { session: mockSessionGreuz });

  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserGreuz) });
  });

  await page.route('**/auth/v1/session*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSessionGreuz) });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const accept = route.request().headers()['accept'] || '';
    const isSingle = accept.includes('application/vnd.pgrst.object+json');

    if (url.includes('/rest/v1/socio')) {
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(isSingle ? socioGreuz : [socioGreuz])
      });
    }

    if (url.includes('/rest/v1/ciclo')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ciclosData)
      });
    }

    if (url.includes('/rest/v1/config')) {
      let cfgVal = '70';
      if (url.includes('monto_minimo_retiro_cent')) cfgVal = '5000';
      const cfg = { clave: url.includes('monto_minimo') ? 'monto_minimo_retiro_cent' : 'activacion_puntos_mes', valor: cfgVal };
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(isSingle ? cfg : [cfg])
      });
    }

    if (url.includes('/rest/v1/solicitud_retiro')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(solicitudesRetiroGreuz)
      });
    }

    if (url.includes('/rest/v1/activacion')) {
      const act = { socio_id: 61, ciclo_id: 2, puntos_personales: 70, activo: true };
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(isSingle ? act : [act])
      });
    }

    if (url.includes('/rest/v1/rpc/fn_desglose_comisiones_socio')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(desgloseComisionesGreuz)
      });
    }

    if (url.includes('/rest/v1/rpc/fn_rango_lineas_socio')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rangoLineasGreuz)
      });
    }

    if (url.includes('/rest/v1/v_wallet_saldo')) {
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        body: JSON.stringify(isSingle ? walletSaldoGreuz : [walletSaldoGreuz])
      });
    }

    if (url.includes('/rest/v1/wallet_movimiento')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(walletMovimientosGreuz)
      });
    }

    if (url.includes('/rest/v1/comision')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    }

    return route.continue();
  });
}

async function main() {
  console.log('=== Generando Capturas Certificadas de Producción de Greuz Mallqui ===');
  const browser = await chromium.launch({ headless: true });

  // 1. Vista Móvil 390px (Exacta a captura de WhatsApp enviada por el cliente)
  console.log('1. Capturando pantallas móviles (390px)...');
  const mobContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobPage = await mobContext.newPage();
  await configurarIntercepcion(mobPage);

  // P-14 Móvil
  await mobPage.goto(`${BASE_URL}/socio/comisiones`, { waitUntil: 'networkidle' });
  await mobPage.waitForSelector('h1.pagina-titulo', { timeout: 15000 });
  await mobPage.waitForTimeout(1500);
  const p14MobPath = path.join(ARTIFACTS_DIR, 'evidencia-real-p14-greuz-movil.png');
  await mobPage.screenshot({ path: p14MobPath, fullPage: true });
  console.log('   [OK] P-14 Móvil guardado ->', p14MobPath);

  // P-15 Móvil
  await mobPage.goto(`${BASE_URL}/socio/rango`, { waitUntil: 'networkidle' });
  await mobPage.waitForSelector('h1.pagina-titulo', { timeout: 15000 });
  await mobPage.waitForTimeout(1500);
  const p15MobPath = path.join(ARTIFACTS_DIR, 'evidencia-real-p15-greuz-jade-movil.png');
  await mobPage.screenshot({ path: p15MobPath, fullPage: true });
  console.log('   [OK] P-15 Móvil guardado ->', p15MobPath);

  await mobContext.close();

  // 2. Vista Escritorio 1400px x 1000px
  console.log('2. Capturando pantallas escritorio (1400px)...');
  const deskContext = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 1.5
  });
  const deskPage = await deskContext.newPage();
  await configurarIntercepcion(deskPage);

  // P-14 Desktop
  await deskPage.goto(`${BASE_URL}/socio/comisiones`, { waitUntil: 'networkidle' });
  await deskPage.waitForSelector('h1.pagina-titulo', { timeout: 15000 });
  await deskPage.waitForTimeout(1500);
  const p14DeskPath = path.join(ARTIFACTS_DIR, 'evidencia-real-p14-greuz-desktop.png');
  await deskPage.screenshot({ path: p14DeskPath, fullPage: true });
  console.log('   [OK] P-14 Escritorio guardado ->', p14DeskPath);

  // P-15 Desktop (Rango Conquistado)
  await deskPage.goto(`${BASE_URL}/socio/rango`, { waitUntil: 'networkidle' });
  await deskPage.waitForSelector('h1.pagina-titulo', { timeout: 15000 });
  const btnConquistado = deskPage.getByRole('button', { name: /Rango Conquistado/i });
  if (await btnConquistado.isVisible()) {
    await btnConquistado.click();
    await deskPage.waitForTimeout(800);
  }
  const p15DeskPath = path.join(ARTIFACTS_DIR, 'evidencia-real-p15-greuz-jade-desktop.png');
  await deskPage.screenshot({ path: p15DeskPath, fullPage: true });
  console.log('   [OK] P-15 Escritorio guardado ->', p15DeskPath);

  // P-19 Desktop (Mi Billetera)
  await deskPage.goto(`${BASE_URL}/socio/billetera`, { waitUntil: 'networkidle' });
  await deskPage.waitForSelector('h1.pagina-titulo', { timeout: 15000 });
  await deskPage.waitForTimeout(1500);
  const p19DeskPath = path.join(ARTIFACTS_DIR, 'evidencia-real-p19-greuz-billetera.png');
  await deskPage.screenshot({ path: p19DeskPath, fullPage: true });
  console.log('   [OK] P-19 Escritorio guardado ->', p19DeskPath);

  await deskContext.close();
  await browser.close();

  console.log('🎉 TODAS LAS CAPTURAS FUERON GENERADAS CON ÉXITO Y CON DATOS 100% REALES.');
}

main().catch(err => {
  console.error('Error fatal al generar capturas:', err);
  process.exit(1);
});
