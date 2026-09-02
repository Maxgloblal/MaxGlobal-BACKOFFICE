import { test, expect } from '@playwright/test';

test.describe('E2E · El Socio Trabaja (P-12, P-13, P-16, P-17, P-18)', () => {
  test('flujo completo de herramientas del socio (Tienda, Red móvil, Enlace, Pedidos y Perfil)', async ({ page }) => {
    test.setTimeout(60000);

    // 0. Iniciar sesión como Ana Quispe (Pack Gold - socio 2)
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 1. P-13: Tienda de Recompra
    await page.goto('/socio/tienda');
    await expect(page).toHaveURL(/\/socio\/tienda/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Tienda de Recompra/i, { timeout: 15000 });
    await expect(page.getByText(/Meta de Activación Mensual/i)).toBeVisible();
    await expect(page.getByText(/Catálogo de Productos/i)).toBeVisible();

    // Agregar producto al carrito y verificar avance
    const btnAgregar = page.getByRole('button', { name: /Agregar al Carrito/i }).first();
    await btnAgregar.click();
    await expect(page.getByText(/Tu Pedido/i)).toBeVisible();
    await expect(page.getByText(/Puntos del pedido:/i)).toBeVisible();

    // Captura obligatoria de la P-13 mostrando el avance a los 70 puntos
    await page.screenshot({ path: 'captura-p13-tienda.png', fullPage: true });

    // 2. P-16: Mi Enlace de Patrocinio
    await page.goto('/socio/enlace');
    await expect(page).toHaveURL(/\/socio\/enlace/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Enlace de Patrocinio/i, { timeout: 15000 });
    await expect(page.locator('#input-url-referido')).toHaveValue(/MG00002/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Copiar Enlace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Compartir por WhatsApp/i })).toBeVisible();

    // 3. P-17: Mis Pedidos
    await page.goto('/socio/pedidos');
    await expect(page).toHaveURL(/\/socio\/pedidos/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mis Pedidos/i, { timeout: 15000 });
    await expect(page.getByText(/Historial de Órdenes/i)).toBeVisible();

    // 4. P-18: Mi Perfil
    await page.goto('/socio/perfil');
    await expect(page).toHaveURL(/\/socio\/perfil/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Perfil/i, { timeout: 15000 });
    await expect(page.getByText(/Datos Personales y Contacto/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mejora de Membresía/i })).toBeVisible();
    await expect(page.getByText(/precio del pack completo/i)).toBeVisible();

    // 5. P-12: Mi Red en Móvil (390px) sin scroll horizontal (RF-224)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/socio/red');
    await expect(page).toHaveURL(/\/socio\/red/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Red de Afiliados/i, { timeout: 15000 });
    await expect(page.getByText(/Tus Frontales Directos/i)).toBeVisible({ timeout: 15000 });

    // Captura obligatoria de la P-12 en móvil sin scroll horizontal
    await page.screenshot({ path: 'captura-p12-red-movil.png', fullPage: true });

    // Verificar que no hay desborde horizontal en 390px
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
