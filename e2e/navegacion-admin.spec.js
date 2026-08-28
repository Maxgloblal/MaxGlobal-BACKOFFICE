import { test, expect } from '@playwright/test';

test.describe('Navegación del Panel de Administración', () => {
  test('navega por el panel de administración y prueba la seguridad en P-23 y P-25', async ({ page }) => {
    // 1. Acceder al panel de administración
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/Tablero de Control/i);
    await expect(page.getByText(/Ciclo: Agosto 2026/i)).toBeVisible();

    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 1024;

    // 2. Navegar a Bandeja de Confirmación (P-23)
    if (isMobile) {
      await page.click('button[aria-label="Abrir menú de administración"]');
      await page.waitForTimeout(200);
    }
    await page.click('aside a:has-text("Bandeja de confirmación")');
    await expect(page).toHaveURL(/\/admin\/confirmacion/);
    await expect(page.getByText('Cola de Pedidos por Confirmar')).toBeVisible();
    await expect(page.getByText('Impacto en el Motor al Confirmar')).toBeVisible();

    // 3. Navegar a Cierre de Ciclo (P-25)
    if (isMobile) {
      await page.click('button[aria-label="Abrir menú de administración"]');
      await page.waitForTimeout(200);
    }
    await page.click('aside a:has-text("Cierre de ciclo")');
    await expect(page).toHaveURL(/\/admin\/cierre/);
    await expect(page.getByText('VISTA PREVIA DEL CIERRE')).toBeVisible();
    await expect(page.getByText('S/. 42,380.00')).toBeVisible();
    await expect(page.getByText('187')).toBeVisible();

    // 4. Probar Diálogo de Confirmación: Cancelar NO ejecuta el cierre
    await page.click('button:has-text("Confirmar el Cierre")');
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.getByText('¿Ejecutar Cierre Definitivo de Ciclo?')).toBeVisible();

    // Cancelar en el diálogo
    await page.click('button:has-text("Cancelar y Volver a Revisar")');
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
    // La vista previa sigue visible y no ha cambiado a cierre completado
    await expect(page.getByText('VISTA PREVIA DEL CIERRE')).toBeVisible();
  });
});
