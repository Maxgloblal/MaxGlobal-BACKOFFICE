import { test, expect } from '@playwright/test';

test.describe('E2E · Tanda 5B: Cinco Pantallas de Administración (P-20, P-26, P-27, P-28, P-29)', () => {

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como ADMIN (socio 1)
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test('1. P-20 · Tablero de Control y Captura con Ciclo 4 activo', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Tablero de Control');
    await expect(page.getByText('ÓRDENES POR CONFIRMAR')).toBeVisible();
    await expect(page.getByText('ESTIMADO DE COMISIONES')).toBeVisible();
    await expect(page.getByText(/Ciclo 4 Activo/i)).toBeVisible();

    // Captura de P-20
    await page.screenshot({ path: 'captura-p20-tablero.png', fullPage: true });
  });

  test('2. P-26 · Configuración del Plan, 2 Alertas y Rangos 9-16', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page.locator('h1')).toContainText('Configuración del Plan');

    // 🔴 Verificar las 2 alertas amarillas
    await expect(page.getByText(/Ambigüedad en fecha de pago/i)).toBeVisible();
    await expect(page.getByText(/Claves duplicadas de retiro mínimo/i)).toBeVisible();

    // Verificar rangos 1-8 y 9-16
    await expect(page.getByText('Diamante Negro')).toBeVisible();
    await expect(page.getByText('Embajador Corona')).toBeVisible();

    // Captura de P-26
    await page.screenshot({ path: 'captura-p26-configuracion.png', fullPage: true });
  });

  test('3. P-27 · Gestión de Socios, Paginación y Ficha', async ({ page }) => {
    await page.goto('/admin/socios');
    await expect(page.locator('h1')).toContainText('Gestión de Socios');
    await expect(page.getByPlaceholder(/Buscar por nombre, código, email o DNI/i)).toBeVisible();

    // Abrir ficha del primer socio
    await page.locator('button:has-text("Ficha")').first().click();
    await expect(page.getByText(/Patrocinador \(Inmutable\)/i)).toBeVisible();
    await page.locator('button:has-text("Cerrar Ficha")').click();
  });

  test('4. P-28 · Reportes Financieros y Ciclo 3', async ({ page }) => {
    await page.goto('/admin/reportes');
    await expect(page.locator('h1')).toContainText('Reportes del Negocio');
    await expect(page.getByText('TOTAL RECAUDADO', { exact: true })).toBeVisible();
    await expect(page.getByText('PAGADO EN COMISIONES', { exact: true })).toBeVisible();
    await expect(page.getByText('MARGEN EMPRESA', { exact: true })).toBeVisible();
  });

  test('5. P-29 · Auditoría del Sistema', async ({ page }) => {
    await page.goto('/admin/auditoria');
    await expect(page.locator('h1')).toContainText('Auditoría del Sistema');
    await expect(page.getByRole('button', { name: 'Filtrar' })).toBeVisible();
  });

});
