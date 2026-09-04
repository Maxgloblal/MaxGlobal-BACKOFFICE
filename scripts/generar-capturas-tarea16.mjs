import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

async function main() {
  console.log('--- Iniciando generador de capturas y verificación TAREA-16 ---');

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'sb-capturas-t16', persistSession: false, autoRefreshToken: false }
  });
  const { error: errLogin } = await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });
  if (errLogin) throw new Error(`Fallo login Admin: ${errLogin.message}`);

  // 1. Iniciar servidor Vite
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

  const browser = await chromium.launch({ headless: true });
  let ordenPruebaId = null;

  try {
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('Iniciando sesión en frontend...');
    await adminPage.goto('http://localhost:5198/login');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.fill('#input-email', 'socio001@ejemplo.test');
    await adminPage.fill('#input-password', 'MaxGlobal2026!');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin**', { timeout: 15000 });
    await adminPage.waitForLoadState('networkidle');

    // -------------------------------------------------------------------------
    // CAPTURAS EN P-21
    // -------------------------------------------------------------------------
    console.log('Navegando a P-21 (/admin/registrar-pedido)...');
    await adminPage.goto('http://localhost:5198/admin/registrar-pedido');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    // Buscar socio Bruno Rojas (MG00003, Pack Gold con 50% descuento)
    console.log('Buscando y seleccionando a Bruno Rojas (MG00003)...');
    await adminPage.fill('#busqueda-socio', 'MG00003');
    await adminPage.waitForTimeout(600);
    const itemBruno = adminPage.locator('.resultado-busqueda-item').first();
    await itemBruno.waitFor({ state: 'visible', timeout: 5000 });
    await itemBruno.click();
    await adminPage.waitForTimeout(500);

    // Confirmar socio
    await adminPage.click('#check-confirmacion-socio');
    await adminPage.waitForTimeout(500);

    // CAPTURA 2: P-21 SIN marcar la casilla (Precio Socio Gold: S/. 75)
    console.log('Tomando Captura 2: P-21 sin marcar casilla (Precio socio S/. 75)...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p21-precio-socio-gold.png');
    await adminPage.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // CAPTURA 1: P-21 CON la casilla MARCADA (Precio público S/. 150 + aviso)
    console.log('Marcando casilla de precio público...');
    await adminPage.click('#check-precio-publico');
    await adminPage.waitForTimeout(500);

    console.log('Tomando Captura 1: P-21 con casilla marcada (Precio público S/. 150 + aviso)...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p21-precio-publico-cliente.png');
    await adminPage.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // -------------------------------------------------------------------------
    // CREAR ORDEN TEMPORAL DE VENTA A CLIENTE PARA P-23 Y CONSULTAS SQL
    // -------------------------------------------------------------------------
    console.log('Creando orden temporal de venta a cliente...');
    const { data: resOrd, error: errOrd } = await sbAdmin.rpc('fn_registrar_pedido_recompra', {
      p_socio_id: 3, // Bruno Rojas
      p_items: [{ producto_id: 1, cantidad: 4 }], // 4 cafés
      p_voucher: {
        banco: 'BCP',
        numero_operacion: 'T16-VERIF-001',
        monto_cent: 60000,
        fecha_deposito: new Date().toISOString().split('T')[0]
      },
      p_envio: {
        destinatario: 'Carlos Pérez (Cliente Final)',
        direccion: 'Av. Larco 456',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores'
      },
      p_canal: 'oficina',
      p_tipo_venta: 'cliente'
    });

    if (errOrd) throw new Error(`Fallo al registrar orden cliente temporal: ${errOrd.message}`);
    ordenPruebaId = resOrd.orden_id;
    console.log(`✓ Orden de cliente creada temporalmente con ID: ${ordenPruebaId}, Código: ${resOrd.codigo}`);

    // -------------------------------------------------------------------------
    // CAPTURA 3: P-23 BANDEJA DE CONFIRMACIÓN CON ETIQUETA "VENTA A CLIENTE"
    // -------------------------------------------------------------------------
    console.log('Navegando a P-23 (/admin/confirmacion)...');
    await adminPage.goto('http://localhost:5198/admin/confirmacion');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);

    // Seleccionar la orden para que se vea el detalle a la derecha
    const btnRevisar = adminPage.locator('tr:has-text("VENTA A CLIENTE") button:has-text("Revisar")').first();
    await btnRevisar.waitFor({ state: 'visible', timeout: 5000 });
    await btnRevisar.click();
    await adminPage.waitForTimeout(800);

    console.log('Tomando Captura 3: P-23 con etiqueta "VENTA A CLIENTE"...');
    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-p23-orden-venta-cliente.png');
    await adminPage.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada:', pathCap3);

  } finally {
    // -------------------------------------------------------------------------
    // LIMPIEZA DE LA ORDEN TEMPORAL
    // -------------------------------------------------------------------------
    if (ordenPruebaId) {
      console.log(`Limpiando orden temporal ID ${ordenPruebaId}...`);
      await sbAdmin.from('envio').delete().eq('orden_id', ordenPruebaId);
      await sbAdmin.from('pago').delete().eq('orden_id', ordenPruebaId);
      await sbAdmin.from('voucher').delete().eq('orden_id', ordenPruebaId);
      await sbAdmin.from('orden_detalle').delete().eq('orden_id', ordenPruebaId);
      await sbAdmin.from('orden').delete().eq('id', ordenPruebaId);
      console.log('✓ Orden temporal limpiada.');
    }

    await browser.close();
    vite.kill();
  }

  console.log('--- Proceso de capturas finalizado con éxito ---');
}

main().catch((e) => {
  console.error('Error en ejecución:', e);
  process.exit(1);
});
