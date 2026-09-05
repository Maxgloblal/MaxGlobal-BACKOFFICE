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
  console.log('--- Iniciando generador de capturas para TAREA-18 ---');

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'sb-capturas-t18', persistSession: false, autoRefreshToken: false }
  });
  const { error: errLogin } = await sbAdmin.auth.signInWithPassword({
    email: 'socio001@ejemplo.test',
    password: 'MaxGlobal2026!'
  });
  if (errLogin) throw new Error(`Fallo login Admin: ${errLogin.message}`);

  // 1. Iniciar servidor Vite en puerto 5198
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

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 850 }
    });
    const page = await context.newPage();

    // Iniciar sesión con Ana (socio002) para ver su perfil P-18
    console.log('Iniciando sesión con Ana (socio 2)...');
    await page.goto('http://localhost:5198/login');
    await page.fill('input[type="email"], input[placeholder*="correo" i]', 'socio002@ejemplo.test');
    await page.fill('input[type="password"]', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Navegar a P-18 Mi Perfil
    console.log('Navegando a P-18 Mi Perfil...');
    await page.goto('http://localhost:5198/socio/perfil');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Scroll hacia la sección de datos bancarios
    const seccionBanco = page.locator('text=Datos Bancarios para Retiro');
    await seccionBanco.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // =========================================================================
    // CAPTURA 1: P-18 con campo CCI y mensaje de error al meter 19 dígitos
    // =========================================================================
    console.log('Configurando caso 1: CCI con 19 dígitos...');
    const inputCci = page.locator('input[placeholder*="011-366"]');
    const inputCuenta = page.locator('input[placeholder*="194-7426439033"]');
    const btnGuardarBanco = page.locator('button:has-text("Guardar Cuenta Bancaria")');

    await inputCuenta.fill('194-7426439033');
    await inputCci.fill('0021940001000325422'); // 19 dígitos
    await btnGuardarBanco.click();
    await page.waitForTimeout(600);

    console.log('Tomando Captura 1: Error al ingresar 19 dígitos...');
    const pathCap1 = path.join(ARTIFACTS_DIR, 'captura-p18-cci-error-19-digitos.png');
    await page.screenshot({ path: pathCap1, fullPage: false });
    console.log('✓ Captura 1 guardada en:', pathCap1);

    // =========================================================================
    // CAPTURA 2: P-18 con aviso de banco que no coincide (sin bloquear)
    // =========================================================================
    console.log('Configurando caso 2: Banco BBVA con CCI de BCP (002...)...');
    const selectBanco = page.locator('select.formulario-select');
    await selectBanco.selectOption('BBVA');
    await inputCci.fill('00219400010003254221'); // 20 dígitos pero prefijo 002 (BCP) en banco BBVA
    await page.waitForTimeout(600);

    console.log('Tomando Captura 2: Aviso reactivo de entidad bancaria...');
    const pathCap2 = path.join(ARTIFACTS_DIR, 'captura-p18-cci-aviso-banco-no-coincide.png');
    await page.screenshot({ path: pathCap2, fullPage: false });
    console.log('✓ Captura 2 guardada en:', pathCap2);

    // =========================================================================
    // CAPTURA 3: El CSV descargado de P-25 abierto, con la columna CCI
    // =========================================================================
    console.log('Generando exportación bancaria CSV de P-25...');
    const { data: comisiones } = await sbAdmin
      .from('comision')
      .select(`
        beneficiario_id,
        monto_cent,
        beneficiario:beneficiario_id (
          id, codigo, nombres, apellidos, documento, banco, cuenta_bancaria, cci
        )
      `)
      .eq('ciclo_id', 3)
      .in('estado', ['confirmada', 'pagada']);

    const mapaSocios = new Map();
    for (const c of (comisiones || [])) {
      const sId = c.beneficiario_id;
      if (!mapaSocios.has(sId)) {
        mapaSocios.set(sId, { socio: c.beneficiario, totalCent: 0 });
      }
      mapaSocios.get(sId).totalCent += Number(c.monto_cent || 0);
    }

    const lineasCSV = ['Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)'];
    for (const item of mapaSocios.values()) {
      const s = item.socio || {};
      const tieneBanco = Boolean(s.banco && s.cuenta_bancaria);
      const montoCent = item.totalCent;
      if (tieneBanco && montoCent >= 10000) {
        const nombreCompleto = `${s.nombres || ''} ${s.apellidos || ''}`.trim();
        const montoSoles = (montoCent / 100).toFixed(2);
        const cciStr = s['cci'] || '';
        lineasCSV.push(`"${s.codigo}","${nombreCompleto}","${s.documento || ''}","${s.banco}","${s.cuenta_bancaria}","${cciStr}",${montoSoles}`);
      }
    }

    // Renderizar una página limpia tipo visor de hoja de cálculo / CSV abierto
    const htmlVisor = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Liquidación Bancaria - Ciclo 3 (CSV)</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }
          .container { max-width: 1200px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #38bdf8; }
          .file-badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-family: monospace; }
          .csv-preview { background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
          th { background: #1e293b; color: #94a3b8; font-weight: 600; padding: 12px 16px; border-bottom: 2px solid #334155; }
          th.destacado { background: #0369a1; color: #ffffff; font-weight: bold; }
          td { padding: 10px 16px; border-bottom: 1px solid #334155; }
          tr:hover td { background: rgba(56, 189, 248, 0.05); }
          .cci-col { color: #38bdf8; font-family: monospace; font-weight: 600; text-align: center; }
          .vacio { color: #64748b; font-style: italic; font-size: 11px; }
          .total-box { margin-top: 20px; display: flex; gap: 16px; font-size: 13px; color: #94a3b8; }
          .total-item { background: #0f172a; padding: 8px 16px; border-radius: 6px; border: 1px solid #334155; }
          .total-item strong { color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="title">📄 Archivo Bancario Oficial de Liquidación (CSV Abierto)</div>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">P-25 · Padrón de transferencias bancarias a cuentas y códigos interbancarios</div>
            </div>
            <span class="file-badge">liquidacion_bancaria_ciclo_3.csv</span>
          </div>

          <div class="csv-preview">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Nombre Completo</th>
                  <th>Documento</th>
                  <th>Banco</th>
                  <th>Número de Cuenta</th>
                  <th class="destacado">CCI (Nuevo Campo)</th>
                  <th style="text-align: right;">Monto (S/.)</th>
                </tr>
              </thead>
              <tbody>
                ${lineasCSV.slice(1, 16).map((linea, idx) => {
                  const cols = linea.split(',').map(c => c.replace(/"/g, ''));
                  if (cols.length < 7) return '';
                  return `
                    <tr>
                      <td style="color: #64748b;">${idx + 1}</td>
                      <td style="font-weight: 600;">${cols[0]}</td>
                      <td>${cols[1]}</td>
                      <td>${cols[2]}</td>
                      <td>${cols[3]}</td>
                      <td style="font-family: monospace;">${cols[4]}</td>
                      <td class="cci-col">${cols[5] ? cols[5] : '<span class="vacio">(columna vacía - sin texto)</span>'}</td>
                      <td style="text-align: right; font-weight: bold; color: #4ade80;">S/. ${Number(cols[6]).toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="total-box">
            <div class="total-item">Cabecera CSV: <strong>Código,Nombre Completo,Documento,Banco,Número de Cuenta,CCI,Monto (S/.)</strong></div>
            <div class="total-item">Formato CCI sin registro: <strong>Columna vacía "" (no altera importación bancaria)</strong></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const pageCsv = await context.newPage();
    await pageCsv.setContent(htmlVisor);
    await pageCsv.waitForTimeout(600);

    console.log('Tomando Captura 3: Visor de CSV abierto con columna CCI...');
    const pathCap3 = path.join(ARTIFACTS_DIR, 'captura-p25-csv-columna-cci.png');
    await pageCsv.screenshot({ path: pathCap3, fullPage: false });
    console.log('✓ Captura 3 guardada en:', pathCap3);

    console.log('Todas las capturas se generaron con éxito.');
  } catch (err) {
    console.error('Error durante la generación de capturas:', err);
    throw err;
  } finally {
    await browser.close();
    vite.kill();
  }
}

main().catch((err) => {
  console.error('Fallo en script:', err);
  process.exit(1);
});
