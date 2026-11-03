import { test, expect } from '@playwright/test';

test.describe('E2E · P-15 Mi Rango · Doble Perspectiva (RF-250 a RF-259c)', () => {
  test('valida la conmutación entre Plan Conquistado y Próxima Meta en P-15', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Iniciar sesión como socio real
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 2. Navegar a P-15 Mi Rango
    await page.goto('/socio/rango');
    await expect(page).toHaveURL(/\/socio\/rango/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Rango/i, { timeout: 15000 });

    // 3. Verificar que los componentes base de la pantalla están visibles
    await expect(page.getByText(/Regla de Equilibrio de Red/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Escala Oficial de Rangos Max Global/i)).toBeVisible();

    // 4. Seleccionar un ciclo para evaluar la perspectiva de cálculo
    const selectCiclo = page.locator('#select-ciclo-rango');
    await expect(selectCiclo).toBeVisible();

    // Verificar existencia del selector de perspectiva si el socio tiene rango conquistado
    const btnConquistado = page.getByRole('button', { name: /Rango Conquistado/i });
    const btnMeta = page.getByRole('button', { name: /Próxima Meta/i });

    if (await btnConquistado.isVisible()) {
      // Probar activar la perspectiva de Rango Conquistado
      await btnConquistado.click();
      await expect(page.getByText(/Encuadre Oficial: Calificación al Rango/i)).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'captura-p15-rango-conquistado.png', fullPage: true });

      // Probar conmutar a la perspectiva de Próxima Meta
      await btnMeta.click();
      await expect(page.getByText(/Proyección hacia la Próxima Meta/i)).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'captura-p15-proxima-meta.png', fullPage: true });
    } else {
      // En caso de que el socio aún no califique a ningún rango en el ciclo seleccionado,
      // la pantalla muestra limpiamente el progreso hacia su meta inicial (ej. Jade)
      await expect(page.getByText(/Meta:/i).first()).toBeVisible();
      await page.screenshot({ path: 'captura-p15-meta-inicial.png', fullPage: true });
    }

    // 5. Verificar responsive en vista móvil (390px) sin overflow
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('h1.pagina-titulo')).toBeVisible({ timeout: 10000 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
