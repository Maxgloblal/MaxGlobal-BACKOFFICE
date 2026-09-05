import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

const SUPABASE_URL = 'https://utlohnidkuvxqppmoevj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bG9obmlka3V2eHFwcG1vZXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzgyMzYsImV4cCI6MjEwMzQ1NDIzNn0.jd0uktH9xcFNEKOErOVUE5UdvbXYqrJncLBsSXE2WvE';

async function main() {
  console.log('--- Iniciando generador de capturas para TAREA-17 ---');

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'sb-capturas-t17', persistSession: false, autoRefreshToken: false }
  });
  const { error: errLogin } = await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });
  if (errLogin) throw new Error(`Fallo login Admin: ${errLogin.message}`);

  // 1. Iniciar servidor Vite
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

  const browser = await chromium.launch({ headless: true });
  const demoSociosIds = [];
  const demoOrdenesIds = [];

  try {
    // 2. Sembrar rama temporal bajo Karla Díaz (MG00002, id 2):
    // Karla (2) -> DEMO_PADRE -> DEMO_HIJO_1, DEMO_HIJO_2
    const rnd = Math.floor(100000 + Math.random() * 899999);
    console.log('Sembrando rama demo temporal bajo Karla Díaz (id 2)...');

    async function crearSocioDemo(patrocinadorId, etiqueta, index) {
      const doc = `95${rnd}${index}`;
      const email = `demo_${etiqueta.toLowerCase()}_${rnd}@ejemplo.test`;
      const { data, error } = await sbAdmin.rpc('fn_registrar_afiliacion_socio', {
        p_patrocinador_id: patrocinadorId,
        p_pack_id: 3,
        p_tipo_documento: 'DNI',
        p_documento: doc,
        p_nombres: `DEMO_${etiqueta}`,
        p_apellidos: 'REENGANCHE',
        p_email: email,
        p_telefono: '999333444',
        p_fecha_nacimiento: '1993-08-20',
        p_direccion: 'Av. Demo 456',
        p_departamento: 'Lima',
        p_provincia: 'Lima',
        p_distrito: 'Miraflores',
        p_voucher: { banco: 'BCP', numero_operacion: `OP-DEMO-${etiqueta}-${rnd}`, monto_cent: 120000 }
      });
      if (error) throw new Error(`Error al crear demo ${etiqueta}: ${error.message}`);
      demoSociosIds.push(data.socio_id);
      demoOrdenesIds.push(data.orden_id);

      await sbAdmin.rpc('fn_confirmar_orden_pago', {
        p_orden_id: data.orden_id,
        p_comisiones: []
      });
      return data;
    }

    const sPadre = await crearSocioDemo(2, 'PADRE', 1); // Cuelga de Karla
    const sHijo1 = await crearSocioDemo(sPadre.socio_id, 'HIJO_1', 2); // Cuelga de PADRE
    const sHijo2 = await crearSocioDemo(sPadre.socio_id, 'HIJO_2', 3); // Cuelga de PADRE

    console.log(`Rama creada: Padre ${sPadre.codigo} (${sPadre.socio_id}), Hijos ${sHijo1.codigo}, ${sHijo2.codigo}`);

    // Contexto admin para capturas 1 y 2
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('Iniciando sesión admin en frontend...');
    await adminPage.goto('http://localhost:5199/login');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.fill('#input-email', 'socio001@ejemplo.test');
    await adminPage.fill('#input-password', 'MaxGlobal2026!');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin**', { timeout: 15000 });
    await adminPage.waitForLoadState('networkidle');

    // -------------------------------------------------------------------------
    // CAPTURA 1: VISTA PREVIA EN P-27
    // -------------------------------------------------------------------------
    console.log('Navegando a P-27 (/admin/socios)...');
    await adminPage.goto('http://localhost:5199/admin/socios');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    // Buscar al socio padre
    console.log(`Buscando al socio ${sPadre.codigo}...`);
    const inputBuscar = adminPage.locator('input[placeholder*="Buscar"]').first();
    await inputBuscar.fill(sPadre.codigo);
    await adminPage.click('button[type="submit"]:has-text("Buscar")');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);

    // Hacer clic en botón "Baja" de la fila
    const btnBaja = adminPage.locator('button:has-text("Baja")').first();
    await btnBaja.waitFor({ state: 'visible', timeout: 8000 });
    await btnBaja.click();
    await adminPage.waitForTimeout(1500);

    // Esperar a que cargue la vista previa en el modal
    const inputMotivo = adminPage.locator('#motivo-baja');
    await inputMotivo.waitFor({ state: 'visible', timeout: 8000 });
    await inputMotivo.fill('Renuncia voluntaria y traslado formal de red');
    await adminPage.waitForTimeout(600);

    console.log('Tomando Captura 1: Vista previa con frontales, descendencia y motivo...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p27-vista-previa-baja.png');
    await adminPage.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada:', pathCap1);

    // -------------------------------------------------------------------------
    // CAPTURA 2: RESULTADO TRAS EJECUTAR LA BAJA EN P-27
    // -------------------------------------------------------------------------
    console.log('Ejecutando la baja desde el modal...');
    const btnConfirmar = adminPage.locator('button:has-text("Confirmar Baja y Reenganche")');
    await btnConfirmar.waitFor({ state: 'visible', timeout: 8000 });
    await btnConfirmar.click();
    await adminPage.waitForTimeout(2500);

    // Esperar a que el modal se cierre y aparezca el mensaje de éxito o la tabla actualizada
    await adminPage.waitForSelector('text=ejecutada exitosamente', { timeout: 10000 });
    await adminPage.waitForTimeout(1000);

    console.log('Tomando Captura 2: Resultado tras ejecutar la baja en P-27...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p27-resultado-baja.png');
    await adminPage.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada:', pathCap2);

    // -------------------------------------------------------------------------
    // CAPTURA 3: P-12 "MI RED" DE KARLA DIAZ (FRONTALES REENGANCHADOS)
    // -------------------------------------------------------------------------
    console.log('Iniciando sesión como Karla Díaz (socio002@ejemplo.test)...');
    const karlaContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const karlaPage = await karlaContext.newPage();

    await karlaPage.goto('http://localhost:5199/login');
    await karlaPage.waitForLoadState('networkidle');

    await karlaPage.fill('#input-email', 'socio002@ejemplo.test');
    await karlaPage.fill('#input-password', 'MaxGlobal2026!');
    await karlaPage.click('button[type="submit"]');

    await karlaPage.waitForURL('**/socio**', { timeout: 15000 });
    await karlaPage.waitForLoadState('networkidle');

    console.log('Navegando a P-12 (/socio/red)...');
    await karlaPage.goto('http://localhost:5199/socio/red');
    await karlaPage.waitForLoadState('networkidle');
    await karlaPage.waitForTimeout(2000);

    // Hacer scroll hacia los frontales recién reenganchados para que se vean en la captura
    const cardHijo1 = karlaPage.locator(`text=${sHijo1.nombres}`).first();
    try {
      await cardHijo1.scrollIntoViewIfNeeded({ timeout: 5000 });
      await karlaPage.waitForTimeout(800);
    } catch {
      // Si no aparece de inmediato, continuar con captura general
    }

    console.log('Tomando Captura 3: P-12 Mi Red mostrando a los frontales que subieron...');
    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-p12-red-reenganchada.png');
    await karlaPage.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada:', pathCap3);

    console.log('Todas las capturas generadas con éxito.');
  } catch (err) {
    console.error('Error durante la generación de capturas:', err);
    throw err;
  } finally {
    // LIMPIEZA COMPLETA EN HOJAS A RAÍZ
    console.log('Limpiando datos temporales de captura...');
    try {
      if (demoOrdenesIds.length > 0) {
        await sbAdmin.from('comision').delete().in('orden_id', demoOrdenesIds);
        await sbAdmin.from('movimiento_puntos').delete().in('orden_id', demoOrdenesIds);
        await sbAdmin.from('voucher').delete().in('orden_id', demoOrdenesIds);
        await sbAdmin.from('envio').delete().in('orden_id', demoOrdenesIds);
        await sbAdmin.from('orden_detalle').delete().in('orden_id', demoOrdenesIds);
        await sbAdmin.from('orden').delete().in('id', demoOrdenesIds);
      }
      if (demoSociosIds.length > 0) {
        await sbAdmin.from('comision').delete().in('beneficiario_id', demoSociosIds);
        await sbAdmin.from('comision').delete().in('generador_id', demoSociosIds);
        await sbAdmin.from('wallet_movimiento').delete().in('socio_id', demoSociosIds);
        await sbAdmin.from('movimiento_puntos').delete().in('socio_id', demoSociosIds);
        await sbAdmin.from('activacion').delete().in('socio_id', demoSociosIds);
        await sbAdmin.from('auditoria').delete().eq('tabla', 'socio').in('registro_id', demoSociosIds);
        await sbAdmin.from('red_ancestro').delete().in('descendiente_id', demoSociosIds);
        await sbAdmin.from('red_ancestro').delete().in('ancestro_id', demoSociosIds);

        // Borrado ordenado de hojas a raíz
        const inverso = [...demoSociosIds].reverse();
        for (const id of inverso) {
          await sbAdmin.from('socio').delete().eq('id', id);
        }
      }
      console.log('Limpieza completada.');
    } catch (eLimpieza) {
      console.error('Error en limpieza:', eLimpieza);
    }

    await browser.close();
    vite.kill();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fallo en script:', err);
  process.exit(1);
});
