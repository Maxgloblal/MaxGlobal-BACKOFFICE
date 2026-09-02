import { test, expect } from '@playwright/test';

test.describe('Navegación del Panel de Administración', () => {
  test('navega por el panel de administración y prueba la seguridad en P-23 y P-25', async ({ page }) => {
    // 0. Iniciar sesión como administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // 1. Acceder al panel de administración
    await expect(page.locator('h1')).toContainText(/Tablero de Control/i);
    await expect(page.getByText(/Ciclo/i).first()).toBeVisible();

    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 1024;

    // 2. Navegar a Bandeja de Confirmación (P-23)
    if (isMobile) {
      await page.click('button[aria-label="Abrir menú de administración"]');
      await page.waitForTimeout(300);
    }
    await page.locator('aside a[href="/admin/confirmacion"]').click();
    await expect(page).toHaveURL(/\/admin\/confirmacion/);
    await expect(page.getByText('Cola de Pedidos por Confirmar')).toBeVisible();
    await expect(page.getByText('Impacto en el Motor al Confirmar')).toBeVisible();

    // 3. Navegar a Cierre de Ciclo (P-25)
    if (isMobile) {
      await page.click('button[aria-label="Abrir menú de administración"]');
      await page.waitForTimeout(300);
    }
    await page.locator('aside a[href="/admin/cierre"]').click();
    await expect(page).toHaveURL(/\/admin\/cierre/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Cierre de Ciclo Mensual/i);
    await expect(page.getByText(/Verificaciones Previas al Cierre/i)).toBeVisible();
    await expect(page.getByText(/TOTAL A PAGAR/i)).toBeVisible();

    // 4. Probar Diálogo de Confirmación: Cancelar NO ejecuta el cierre
    const botonCierre = page.getByRole('button', { name: /Ejecutar el Cierre Definitivo/i });
    if (await botonCierre.isEnabled()) {
      await botonCierre.click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(page.getByText(/¿Confirmar Cierre del Ciclo/i)).toBeVisible();

      // Cancelar en el diálogo
      await page.click('button:has-text("Cancelar")');
      await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
      // La vista previa sigue visible
      await expect(page.getByText(/TOTAL A PAGAR/i)).toBeVisible();
    }
  });
});

