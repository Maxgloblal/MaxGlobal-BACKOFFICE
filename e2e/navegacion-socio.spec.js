﻿import { test, expect } from '@playwright/test';

test.describe('Navegación del Armazón del Socio', () => {
  test('navega correctamente por las pantallas del socio y prueba las reglas', async ({ page }) => {
    // 0. Iniciar sesión como socio
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/);

    // 1. Acceder al panel del socio
    await expect(page.locator('h1')).toContainText(/Hola, María/i);
    await expect(page.getByText(/Cierre en 6 días/i)).toBeVisible();

    // 2. Verificar scroll horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // 3. Navegar a Tienda
    await page.goto('/socio/tienda');
    await expect(page).toHaveURL(/\/socio\/tienda/);
    await expect(page.getByText('Catálogo de Recompra')).toBeVisible();

    // 4. Navegar a Comisiones
    await page.goto('/socio/comisiones');
    await expect(page).toHaveURL(/\/socio\/comisiones/);
    await expect(page.getByText('S/. 228.40')).toBeVisible();

    // Probar simulación de comisiones en cero con explicación
    await page.click('button:has-text("Simular: En Cero con Explicación")');
    await expect(page.getByText('S/. 0.00')).toBeVisible();
    await expect(page.getByText(/No estuviste activa este mes/i)).toBeVisible();
    await expect(page.getByText(/regla de no compresión/i)).toBeVisible();

    // 5. Navegar a Mi Red
    await page.goto('/socio/red');
    await expect(page).toHaveURL(/\/socio\/red/);
    await expect(page.getByText(/Total: 47 socios en red/i)).toBeVisible();
    await expect(page.getByText('Carlos Ríos').first()).toBeVisible();

    // 6. Probar apertura de Drawer si estamos en móvil
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.click('button[aria-label="Abrir menú de navegación"]');
      const drawer = page.locator('.armazon-drawer');
      await expect(drawer).toHaveClass(/abierto/);
      await expect(page.locator('.armazon-drawer a:has-text("Mi rango")')).toBeVisible();

      // Cerrar drawer
      await page.click('button[aria-label="Cerrar menú"]');
      await expect(drawer).not.toHaveClass(/abierto/);
    }
  });
});
