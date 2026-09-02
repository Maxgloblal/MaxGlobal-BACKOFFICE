import { test, expect } from '@playwright/test';

test.describe('Navegación del Armazón del Socio (P-11, P-14, P-15, P-19)', () => {
  test('navega por las pantallas reales del socio con sesión de Ana Quispe', async ({ page }) => {
    test.setTimeout(60000);

    // 0. Iniciar sesión como socio (Ana Quispe - socio 2)
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 10000 });

    // 1. P-11: Panel Principal
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Hola, ANA/i, { timeout: 15000 });
    await expect(page.getByText(/ESTÁS ACTIVO ESTE MES/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Puntos Personales/i).first()).toBeVisible();
    await expect(page.getByText(/Puntos Grupales/i).first()).toBeVisible();
    await expect(page.getByText(/Saldo Disponible/i).first()).toBeVisible();

    // 2. P-14: Mis Comisiones
    await page.goto('/socio/comisiones');
    await expect(page).toHaveURL(/\/socio\/comisiones/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mis Comisiones/i, { timeout: 15000 });
    await expect(page.getByText(/Total del Ciclo/i).first()).toBeVisible();
    await expect(page.getByText(/Bono Residual/i).first()).toBeVisible();
    await expect(page.getByText(/Transparencia de Liquidación/i)).toBeVisible();

    // Captura de pantalla para documentar P-14
    await page.screenshot({ path: 'captura-p14-desglose.png', fullPage: true });

    // 3. P-15: Mi Rango
    await page.goto('/socio/rango');
    await expect(page).toHaveURL(/\/socio\/rango/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Rango/i, { timeout: 15000 });
    await expect(page.getByText(/Regla de Línea Estirada/i)).toBeVisible();
    await expect(page.getByText(/Escala Oficial de Rangos/i)).toBeVisible();
    await expect(page.getByText(/Alcanzaste PLATA este mes, pero venías de ORO/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Al bajar de rango no se cobra el bono/i)).toBeVisible();

    // Captura de pantalla para documentar P-15
    await page.screenshot({ path: 'captura-p15-rango.png', fullPage: true });

    // 4. P-19: Mi Billetera
    await page.goto('/socio/billetera');
    await expect(page).toHaveURL(/\/socio\/billetera/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Billetera/i, { timeout: 15000 });
    await expect(page.getByText(/Saldo Disponible/i).first()).toBeVisible();
    await expect(page.getByText(/Comisión Estimada/i).first()).toBeVisible();
    await expect(page.getByText(/S\/\.\s*0\.00/i).first()).toBeVisible();

    // 5. Verificar responsive en móvil (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/socio');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
