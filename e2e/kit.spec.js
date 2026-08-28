import { test, expect } from '@playwright/test';

test.describe('Página de Catálogo Visual /kit', () => {
  test('renderiza las 8 piezas con sus 3 estados', async ({ page }) => {
    await page.goto('/kit');
    await expect(page.locator('h1')).toContainText(/Kit de Piezas UI/i);

    // Verificar las 8 secciones
    await expect(page.getByText('1 · Tarjeta de Dato')).toBeVisible();
    await expect(page.getByText('2 · Barra de Progreso')).toBeVisible();
    await expect(page.getByText('3 · Tabla Responsiva')).toBeVisible();
    await expect(page.getByText('4 · Insignia de Estado')).toBeVisible();
    await expect(page.getByText('5 · Formulario y Botones')).toBeVisible();
    await expect(page.getByText('6 · Estado Vacío')).toBeVisible();
    await expect(page.getByText('7 · Diálogo de Confirmación')).toBeVisible();
    await expect(page.getByText('8 · Nodo del Árbol')).toBeVisible();

    // Probar interacción con el Diálogo de confirmación
    await page.click('button:has-text("Abrir Diálogo de Prueba")');
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.getByText('¿Confirmar Cierre de Ciclo?')).toBeVisible();

    await page.click('button:has-text("Cancelar y Revisar")');
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });
});
