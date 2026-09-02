﻿import { test, expect } from '@playwright/test';

test.describe('Pantalla P-23 · Bandeja de Confirmación de Pagos', () => {
  test('muestra la bandeja de confirmación, listado de órdenes y detalle del impacto en desktop y mobile', async ({ page }) => {
    // 0. Iniciar sesión como administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // 1. Navegar a la pantalla P23
    await page.goto('/admin/confirmacion');

    // 2. Verificar encabezado y títulos
    await expect(page.locator('h1')).toContainText(/Bandeja de Confirmación/i);
    await expect(page.getByText('Cola de Pedidos por Confirmar')).toBeVisible();
    await expect(page.getByText('Impacto en el Motor al Confirmar')).toBeVisible();

    // 3. Verificar que se muestre el comprobante y botones de acción
    await expect(page.getByRole('button', { name: /Confirmar Pago/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Rechazar/i })).toBeVisible();

    // 4. Probar apertura y cierre del diálogo de confirmación de pago
    await page.getByRole('button', { name: /Confirmar Pago/i }).click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sí, Confirmar y Acreditar/i })).toBeVisible();

    // Cancelar diálogo
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });
});
