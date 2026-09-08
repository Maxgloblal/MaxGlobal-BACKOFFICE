import pkg from '@playwright/test';
const { chromium } = pkg;
const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function testAlphabet() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  
  await page.goto('http://localhost:4173/');

  const html = `
    <div style="padding: 40px; background: white; color: black; font-size: 28px;">
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans (Regular 400) - Mayúsculas A-Z:</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans (Regular 400) - Minúsculas a-z:</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">abcdefghijklmnopqrstuvwxyz</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'Pack Empresarial' SIN text-transform:</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">Pack Empresarial</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'Pack Empresarial' CON text-transform: uppercase:</h3>
        <div style="font-family: 'Agus Sans', sans-serif; text-transform: uppercase;">Pack Empresarial</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'Mi Perfil' SIN text-transform:</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">Mi Perfil</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'Mi Perfil' CON text-transform: uppercase:</h3>
        <div style="font-family: 'Agus Sans', sans-serif; text-transform: uppercase;">Mi Perfil</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'PACK EMPRESARIAL':</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">PACK EMPRESARIAL</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Agus Sans - 'Pack Empresarial':</h3>
        <div style="font-family: 'Agus Sans', sans-serif;">Pack Empresarial</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Caviar Dreams Regular (400) - 'PACK EMPRESARIAL':</h3>
        <div style="font-family: 'Caviar Dreams', sans-serif;">PACK EMPRESARIAL</div>
      </div>
      <div style="margin-bottom: 24px; padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="font-size: 16px; color: #666; margin: 0 0 8px 0;">Caviar Dreams Bold (700) - 'PACK EMPRESARIAL':</h3>
        <div style="font-family: 'Caviar Dreams', sans-serif; font-weight: 700;">PACK EMPRESARIAL</div>
      </div>
    </div>
  `;
  
  await page.evaluate((content) => {
    document.body.innerHTML = content;
  }, html);

  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${ARTIFACTS_DIR}/test-alfabeto-agus.png` });
  await browser.close();
  console.log('Test alfabeto real guardado.');
}

testAlphabet();
