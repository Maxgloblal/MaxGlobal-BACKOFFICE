import { test, expect } from '@playwright/test';

test.describe('Flujos de Autenticación y Sesión E2E (TAREA-05)', () => {
  test('1. Sin sesión: navegar a /socio redirige a /login', async ({ page }) => {
    await page.goto('/socio');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('MAX GLOBAL');
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('2. Entrar con credenciales malas muestra el mensaje en español', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'contraseña_incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('Correo o contraseña incorrectos');
  });

  test('3. Entrar con credenciales correctas lleva al panel y mantiene sesión al recargar', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/socio/);

    // Recargar la página mantiene la sesión
    await page.reload();
    await expect(page).toHaveURL(/\/socio/);

    // Cerrar sesión lleva al login
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.click('button[aria-label="Abrir menú de navegación"]');
      await page.click('.armazon-drawer button:has-text("Cerrar sesión")');
    } else {
      await page.click('aside button:has-text("Cerrar sesión")');
    }

    await expect(page).toHaveURL(/\/login/);
  });

  test('4. Un socio pendiente (id 22) es redirigido a /socio/espera', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#input-email', 'socio022@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/socio\/espera/);
    await expect(page.locator('h1')).toContainText('Solicitud en Revisión');
    await expect(page.getByText('Pendiente de Aprobación')).toBeVisible();
  });

  test('5. Un socio suspendido (id 31) ve la pantalla informativa /socio/suspendido', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#input-email', 'socio031@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/socio\/suspendido/);
    await expect(page.locator('h1')).toContainText('Cuenta Suspendida');
    await expect(page.getByText('soporte@maxglobal.pe')).toBeVisible();
  });

  test('6. Un socio normal escribiendo /admin a mano es redirigido', async ({ page }) => {
    // Iniciar sesión como ANA (socio)
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // Intentar entrar a /admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });
  });
});
