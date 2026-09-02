import { test, expect } from '@playwright/test';

test.describe('E2E · Operación Mínima del Admin (P-21 a P-24)', () => {
  test('Flujo de pantallas administrativas P-21, P-22 y P-24', async ({ page }) => {
    // 0. Login como Administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // 1. P-21: Registrar Pedido de Recompra
    await page.goto('/admin/registrar-pedido');
    await expect(page.locator('h1')).toContainText('Registrar Pedido');
    await expect(page.getByText('Socio Comprador')).toBeVisible();
    await expect(page.getByText('Selección de Productos')).toBeVisible();
    await expect(page.getByText('Comprobante de Pago')).toBeVisible();

    // 2. P-22: Registrar Afiliación de Socio
    await page.goto('/admin/afiliacion');
    await expect(page.locator('h1')).toContainText('Registrar Afiliación');
    await expect(page.getByText('Patrocinador en la Red')).toBeVisible();
    await expect(page.getByText('Pack de Afiliación')).toBeVisible();
    await expect(page.getByText('Datos Personales del Nuevo Socio')).toBeVisible();

    // 3. P-24: Control de Envíos
    await page.goto('/admin/envios');
    await expect(page.locator('h1')).toContainText('Control de Envíos');
    await expect(page.getByText(/Regla RF-365/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
  });
});
