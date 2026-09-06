import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';
const URL_FOTO = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/cafe-moringa.webp';

async function main() {
  console.log('Iniciando Chromium sin credenciales (sesión limpia/anónima)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log(`Navegando directamente a URL pública: ${URL_FOTO}`);
  const response = await page.goto(URL_FOTO, { waitUntil: 'networkidle' });
  console.log(`Respuesta HTTP: ${response.status()}`);

  const destPath = path.join(ARTIFACTS_DIR, 'captura-producto-publico-bucket.png');
  await page.screenshot({ path: destPath });
  console.log(`Captura guardada exitosamente en ${destPath}`);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
