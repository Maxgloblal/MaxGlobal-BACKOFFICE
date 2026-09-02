import { test, expect } from '@playwright/test';

test.describe('E2E · Cierre de Ciclo Mensual (P-25)', () => {
  test('vista previa del cierre, límites de seguridad y padrón bancario', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Iniciar sesión como Administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // 2. Navegar a P-25 Cierre de Ciclo
    await page.goto('/admin/cierre');
    await expect(page).toHaveURL(/\/admin\/cierre/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Cierre de Ciclo Mensual/i, { timeout: 15000 });

    // 3. Verificar Verificaciones Previas y Vista Previa
    await expect(page.getByText(/Verificaciones Previas al Cierre/i)).toBeVisible();
    await expect(page.getByText(/Bono de Patrocinio/i)).toBeVisible();
    await expect(page.getByText(/Bono Residual/i)).toBeVisible();
    await expect(page.getByText(/Bono de Rango/i)).toBeVisible();
    await expect(page.getByText(/TOTAL A PAGAR/i)).toBeVisible();

    // 4. Captura obligatoria de la vista previa con totales
    await page.screenshot({ path: 'captura-p25-vista-previa.png', fullPage: true });

    // 5. Botones de acción
    await expect(page.getByRole('button', { name: /Descargar Padrón Bancario/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ejecutar el Cierre/i })).toBeVisible();
  });
});
