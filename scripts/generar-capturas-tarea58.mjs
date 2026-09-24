import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12/13/14
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const consoleWarnings = [];

  page.on('console', (msg) => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      const text = msg.text();
      console.log(`[Browser ${msg.type()}] ${text}`);
      if (
        text.includes('deshabilitado') ||
        text.includes('anchoCompleto') ||
        text.includes('without an `onChange`')
      ) {
        consoleWarnings.push(text);
      }
    }
  });

  console.log('1. Iniciando sesión como socio...');
  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('#input-email');
  await page.fill('#input-email', 'socio002@ejemplo.test');
  await page.fill('#input-password', 'MaxGlobal2026!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/socio**');
  console.log('2. Navegando a P-13 Tienda...');
  await page.goto('http://localhost:5174/socio/tienda');
  await page.waitForSelector('.tarjeta-producto-tienda');

  // Captura 1: Carrito vacío a 390px
  console.log('3. Capturando: Carrito vacío...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 't58-01-carrito-vacio-390px.png'),
    fullPage: false
  });

  // Captura 3: Buscando algo ("moringa")
  console.log('4. Buscando "moringa"...');
  await page.fill('#input-buscar-tienda', 'moringa');
  await page.waitForTimeout(400);
  // Scroll to center search bar so it is not hidden under header
  await page.evaluate(() => {
    document.querySelector('#input-buscar-tienda')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 't58-03-buscando-algo-390px.png'),
    fullPage: false
  });

  // Captura 4: Sin resultados ("xyz")
  console.log('5. Buscando término sin resultados...');
  await page.fill('#input-buscar-tienda', 'producto-inexistente-xyz');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelector('[data-testid="tienda-sin-resultados"]')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 't58-04-sin-resultados-390px.png'),
    fullPage: false
  });

  // Limpiar búsqueda
  console.log('6. Limpiando búsqueda...');
  await page.click('[data-testid="btn-sin-resultados-limpiar"]');
  await page.waitForTimeout(300);

  // Agregar productos al carrito
  console.log('7. Agregando productos al carrito...');
  const botonesAgregar = page.locator('button:has-text("Agregar")');
  await botonesAgregar.nth(0).click();
  await page.waitForTimeout(100);
  await botonesAgregar.nth(1).click();
  await page.waitForTimeout(100);
  // Aumentar cantidad del primero a 2
  const botonesMas = page.locator('button[aria-label*="Aumentar"]');
  if (await botonesMas.count() > 0) {
    await botonesMas.first().click();
  }
  await page.waitForTimeout(300);

  // Captura 2: Con productos y la barra fija visible
  console.log('8. Capturando: Con productos y barra fija...');
  await page.waitForSelector('[data-testid="barra-fija-carrito"]');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 't58-02-con-productos-barra-fija-390px.png'),
    fullPage: false
  });

  // Verificar scroll al pulsar Ver pedido
  console.log('9. Probando pulsación en Ver pedido...');
  await page.click('button:has-text("Ver pedido")');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 't58-05-desplazamiento-resumen-390px.png'),
    fullPage: false
  });

  console.log('--- REVISIÓN DE AVISOS DE CONSOLA ---');
  console.log('Avisos detectados de los 3 prohibidos:', consoleWarnings.length);
  if (consoleWarnings.length > 0) {
    console.error('AVISOS ENCONTRADOS:', consoleWarnings);
  } else {
    console.log('✅ CERO avisos en consola para deshabilitado, anchoCompleto y value/onChange.');
  }

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
