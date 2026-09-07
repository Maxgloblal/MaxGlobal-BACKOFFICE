import pkg from '@playwright/test';
const { chromium } = pkg;
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function ejecutar() {
  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: errAuthAdmin } = await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });
  if (errAuthAdmin) console.warn('Admin auth warn:', errAuthAdmin.message);

  const testEmail = 'upgrade.captura@maxglobal.test';
  const testDoc = '78123456';

  console.log('--- PASO 0: Limpieza preventiva ---');
  await sbAdmin.rpc('fn_test_limpiar_socio_prueba', { p_email: testEmail });

  console.log('--- PASO 1: Creando socio base con Pack Gold (pack_id: 3, S/. 1,200) ---');
  const { data: regRes, error: regErr } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
    p_patrocinador_id: 12, // Karla Diaz (Pack Gold, activa en Ciclo 6)
    p_pack_id: 3, // Pack Gold (S/. 1,200)
    p_tipo_documento: 'DNI',
    p_documento: testDoc,
    p_nombres: 'Carlos Upgrade',
    p_apellidos: 'Mendoza Ruiz',
    p_email: testEmail,
    p_telefono: '987112233',
    p_voucher: {
      banco: 'BCP',
      numero_operacion: 'OP-INIT-CAPTURA',
      monto_cent: 120000
    },
    p_canal: 'web'
  });

  if (regErr) {
    console.error('Error registrando socio:', regErr);
    process.exit(1);
  }

  const socioId = regRes.socio_id;
  const ordenInitId = regRes.orden_id;
  const passwordGenerada = regRes.password_temporal;
  console.log(`Socio creado ID: ${socioId}, Orden Inicial ID: ${ordenInitId}, Password: ${passwordGenerada}`);

  // Confirmar la orden inicial para que el socio quede activo con Pack Gold
  const { error: confErr } = await sbAdmin.rpc('fn_confirmar_orden_pago', {
    p_orden_id: ordenInitId
  });
  if (confErr) {
    console.error('Error confirmando orden inicial:', confErr);
    process.exit(1);
  }
  console.log('Orden inicial confirmada. Socio activo con Pack Gold.');

  // Iniciar Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // CAPTURA 1: Modal de mejorar pack en P-27 mostrando el total COMPLETO
    // -------------------------------------------------------------
    console.log('--- PASO 2: Navegar a P-27 y abrir modal de Mejorar Pack ---');
    await page.goto('http://localhost:4173/login');
    await page.fill('input[type="email"]', 'socio001@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    await page.goto('http://localhost:4173/admin/socios');
    await page.waitForSelector('input[placeholder*="Buscar por nombre"]', { timeout: 15000 });

    // Buscar a nuestro socio recién creado
    await page.fill('input[placeholder*="Buscar por nombre"]', testDoc);
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Clic en botón Mejorar pack
    const btnMejorar = page.locator('button:has-text("Mejorar pack")').first();
    await btnMejorar.waitFor({ state: 'visible', timeout: 10000 });
    await btnMejorar.click();

    // Esperar modal
    const modalSelector = page.locator('#selector-pack-nuevo');
    await modalSelector.waitFor({ state: 'visible', timeout: 10000 });

    // Seleccionar Pack Empresarial (id: 5, S/. 8,000)
    await page.selectOption('#selector-pack-nuevo', '5');
    await page.waitForTimeout(800);

    // Llenar datos de comprobante en el modal
    await page.fill('#num-operacion-upgrade', 'OP-UPGRADE-CAPTURA');

    console.log('Tomando Captura 1: El modal de mejorar pack, mostrando el total COMPLETO...');
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/captura-modal-upgrade-p27.png`,
      fullPage: false
    });
    console.log('Captura 1 guardada.');

    // Enviar el formulario para crear la orden de upgrade
    await page.click('button:has-text("Crear Orden de Upgrade")');
    await page.waitForTimeout(2500);

    // -------------------------------------------------------------
    // CAPTURA 2: P-23 con la orden marcada como upgrade
    // -------------------------------------------------------------
    console.log('--- PASO 3: Navegar a P-23 Bandeja de Confirmación ---');
    await page.goto('http://localhost:4173/admin/confirmacion');
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Esperar a que la insignia "Upgrade · Pack Gold → Pack Empresarial" aparezca
    const badgeUpgrade = page.locator('text=Upgrade · Pack Gold → Pack Empresarial').first();
    await badgeUpgrade.waitFor({ state: 'visible', timeout: 10000 });

    // Hacer clic en el botón Revisar de la fila de upgrade para seleccionarla en el panel lateral
    const rowUpgrade = page.locator('tr:has-text("Upgrade · Pack Gold → Pack Empresarial")').first();
    await rowUpgrade.locator('button:has-text("Revisar")').click();
    console.log('Orden de upgrade seleccionada en P-23. Esperando impacto y render...');
    await page.waitForTimeout(3500);

    console.log('Tomando Captura 2: P-23 con la orden marcada como upgrade...');
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/captura-upgrade-bandeja-p23.png`,
      fullPage: false
    });
    console.log('Captura 2 guardada.');

    // Confirmar la orden en P-23
    console.log('--- PASO 4: Confirmando la orden de upgrade en P-23 ---');
    const btnConfirmarBandeja = page.locator('button:has-text("Confirmar Pago")').first();
    await btnConfirmarBandeja.click();
    await page.waitForTimeout(1000);

    // En el diálogo modal de confirmación, confirmar definitivamente
    const btnAceptarConfirmar = page.locator('button:has-text("Sí, Confirmar y Acreditar")').first();
    await btnAceptarConfirmar.click();
    await page.waitForTimeout(5000);

    // Verificar si apareció mensaje de error o éxito
    const txtContenido = await page.content();
    if (txtContenido.includes('error') || txtContenido.includes('Error')) {
      const msgs = await page.locator('[role="alert"]').allInnerTexts();
      if (msgs.length) console.warn('Alertas P-23:', msgs);
    }

    // Obtener el ID de la orden de upgrade desde la BD para las consultas SQL
    const { data: ordUpgrade } = await sbAdmin
      .from('orden')
      .select('id, codigo, tipo, total_cent, pack_id, socio_id')
      .eq('socio_id', socioId)
      .eq('pack_id', 5)
      .single();

    const upgradeOrdenId = ordUpgrade?.id;
    console.log(`Orden de upgrade confirmada: ID ${upgradeOrdenId}, Código: ${ordUpgrade?.codigo}`);

    // -------------------------------------------------------------
    // EJECUTAR LAS 4 CONSULTAS SQL DE VERIFICACIÓN
    // -------------------------------------------------------------
    console.log('\n================== 4 CONSULTAS SQL BLOQUE 5 ==================');

    // Consulta 1: el upgrade quedó como orden de afiliación
    const { data: q1 } = await sbAdmin
      .from('orden')
      .select('codigo, tipo, total_cent, pack_id, socio:socio_id (pack_id)')
      .eq('id', upgradeOrdenId)
      .single();

    console.log('1 · Consulta 1 (orden vs socio pack_id):', {
      codigo: q1?.codigo,
      tipo: q1?.tipo,
      total_cent: q1?.total_cent,
      orden_pack_id: q1?.pack_id,
      socio_pack_id: q1?.socio?.pack_id
    });

    // Consulta 2: comisión de patrocinio sobre el precio completo
    const { data: q2 } = await sbAdmin
      .from('comision')
      .select('nivel, monto_cent, tipo')
      .eq('orden_id', upgradeOrdenId)
      .eq('tipo', 'patrocinio')
      .order('nivel');

    console.log('2 · Consulta 2 (comisiones patrocinio):', q2);

    // Consulta 3: auditoría
    const { data: q3 } = await sbAdmin
      .from('auditoria')
      .select('accion, datos_antes, datos_despues')
      .eq('accion', 'upgrade_pack')
      .order('id', { ascending: false })
      .limit(1);

    console.log('3 · Consulta 3 (auditoria upgrade_pack):', {
      accion: q3?.[0]?.accion,
      pack_antes_id: q3?.[0]?.datos_antes?.pack_id,
      pack_antes_nombre: q3?.[0]?.datos_antes?.nombre,
      pack_despues_id: q3?.[0]?.datos_despues?.pack_id,
      pack_despues_nombre: q3?.[0]?.datos_despues?.nombre
    });

    // Consulta 4: nadie bajó de pack
    const { data: allAudits } = await sbAdmin
      .from('auditoria')
      .select('datos_antes, datos_despues')
      .eq('accion', 'upgrade_pack');

    const bajadas = (allAudits || []).filter(
      (a) => Number(a.datos_despues?.precio_cent || 0) <= Number(a.datos_antes?.precio_cent || 0)
    );
    console.log('4 · Consulta 4 (auditorias con precio menor o igual - debe ser 0):', bajadas.length);
    console.log('===============================================================\n');

    // -------------------------------------------------------------
    // CAPTURA 3: P-18 del socio con su pack ya cambiado
    // -------------------------------------------------------------
    console.log('--- PASO 5: Iniciar sesión como el socio con Upgrade en P-18 ---');
    const userContext = await browser.newContext({ viewport: { width: 1340, height: 980 } });
    const userPage = await userContext.newPage();

    await userPage.goto('http://localhost:4173/login');
    await userPage.fill('input[type="email"]', testEmail);
    await userPage.fill('input[type="password"]', passwordGenerada);
    await userPage.click('button[type="submit"]');
    await userPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    await userPage.goto('http://localhost:4173/socio/perfil');
    await userPage.waitForSelector('.pagina-titulo', { timeout: 15000 });
    await userPage.waitForTimeout(2000);

    // Verificar que el pack es Pack Empresarial
    const packValor = userPage.locator('text=Pack Empresarial').first();
    await packValor.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Tomando Captura 3: P-18 del socio con su pack ya cambiado...');
    await userPage.screenshot({
      path: `${ARTIFACTS_DIR}/captura-perfil-pack-actualizado-p18.png`,
      fullPage: false
    });
    console.log('Captura 3 guardada.');

    await userContext.close();

    // -------------------------------------------------------------
    // PASO 6: Limpieza estricta y conteos finales
    // -------------------------------------------------------------
    console.log('--- PASO 6: Limpieza y verificación de conteos ---');
    await sbAdmin.rpc('fn_test_limpiar_socio_prueba', { p_email: testEmail });

    const { count: countSocios } = await sbAdmin.from('socio').select('*', { count: 'exact', head: true });
    const { count: countOrdenes } = await sbAdmin.from('orden').select('*', { count: 'exact', head: true });
    const { count: countComisiones, data: comisionesData } = await sbAdmin.from('comision').select('monto_cent');
    const totalComisionCent = (comisionesData || []).reduce((acc, c) => acc + Number(c.monto_cent), 0);
    const { count: countWallet } = await sbAdmin.from('wallet_movimiento').select('*', { count: 'exact', head: true });

    console.log('Conteos post-limpieza:', {
      socios: countSocios,
      ordenes: countOrdenes,
      comisiones: countComisiones,
      montoTotalComisiones: totalComisionCent / 100,
      wallet: countWallet
    });

  } finally {
    await browser.close();
  }
}

ejecutar().catch((err) => {
  console.error('Error en ejecución:', err);
  process.exit(1);
});
