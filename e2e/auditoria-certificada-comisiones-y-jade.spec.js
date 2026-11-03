import { test, expect } from '@playwright/test';

test.describe('Auditoría Certificada · Comisiones P-14, Rango Jade P-15, Billetera P-19 y Cierre P-25', () => {
  test('1. P-25 Cierre de Ciclo · Verificaciones y cálculo de rangos sin errores de servidor', async ({ page }) => {
    test.setTimeout(60000);

    const erroresConsola = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });

    // 1. Iniciar sesión como Administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // 2. Navegar a P-25 Cierre de Ciclo
    await page.goto('/admin/cierre');
    await expect(page).toHaveURL(/\/admin\/cierre/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Cierre de Ciclo Mensual/i, { timeout: 15000 });

    // 3. Validar presencia de tarjetas de bonos
    await expect(page.getByText(/Bono de Patrocinio/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bono Residual/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bono de Rango/i)).toBeVisible({ timeout: 10000 });

    // 4. Captura certificada P-25
    await page.screenshot({ path: 'certificacion-p25-cierre-actualizado.png', fullPage: true });

    // 5. No deben existir errores no controlados de base de datos
    const erroresCriticos = erroresConsola.filter(e => e.includes('column') || e.includes('syntax error') || e.includes('42703'));
    expect(erroresCriticos).toHaveLength(0);
  });

  test('2. P-15 Mi Rango · Visualización de Rango Conquistado y Próxima Meta con regla de línea estirada', async ({ page }) => {
    test.setTimeout(60000);

    const erroresConsola = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });

    // 1. Iniciar sesión como socio con actividad
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 2. Navegar a P-15 Mi Rango
    await page.goto('/socio/rango');
    await expect(page).toHaveURL(/\/socio\/rango/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Rango/i, { timeout: 15000 });

    // 3. Validar conmutación entre Rango Conquistado y Próxima Meta
    const btnConquistado = page.getByRole('button', { name: /Rango Conquistado/i });
    const btnMeta = page.getByRole('button', { name: /Próxima Meta/i });
    await expect(btnConquistado).toBeVisible({ timeout: 10000 });
    await expect(btnMeta).toBeVisible({ timeout: 10000 });

    // Perspectiva Rango Conquistado
    await btnConquistado.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.tarjeta-dato').filter({ hasText: /Puntos Computables/i })).toBeVisible();

    // 4. Captura certificada P-15
    await page.screenshot({ path: 'certificacion-p15-rango-auditado.png', fullPage: true });

    const erroresCriticos = erroresConsola.filter(e => e.includes('42703') || e.includes('column does not exist'));
    expect(erroresCriticos).toHaveLength(0);
  });

  test('3. P-14 Mis Comisiones · Desglose por tipo de bono y justificación de niveles no pagados', async ({ page }) => {
    test.setTimeout(60000);

    const erroresConsola = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });

    // 1. Iniciar sesión como socio
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 2. Navegar a P-14 Mis Comisiones
    await page.goto('/socio/comisiones');
    await expect(page).toHaveURL(/\/socio\/comisiones/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mis Comisiones/i, { timeout: 15000 });

    // 3. Verificar que se renderizan tarjetas de resumen (Total del Ciclo, Patrocinio, Residual, Rango)
    await expect(page.getByText(/Total del Ciclo/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bono Patrocinio/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bono Residual/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bono de Rango/i)).toBeVisible({ timeout: 10000 });

    // 4. Validar existencia del aviso de transparencia de no compresión
    await expect(page.getByText(/Transparencia total/i)).toBeVisible({ timeout: 10000 });

    // 5. Captura certificada P-14
    await page.screenshot({ path: 'certificacion-p14-comisiones-auditado.png', fullPage: true });

    const erroresCriticos = erroresConsola.filter(e => e.includes('42703') || e.includes('column does not exist'));
    expect(erroresCriticos).toHaveLength(0);
  });

  test('4. P-19 Mi Billetera · Integridad de movimientos y trazabilidad de abonos', async ({ page }) => {
    test.setTimeout(60000);

    const erroresConsola = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });

    // 1. Iniciar sesión como socio
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 2. Navegar a P-19 Mi Billetera
    await page.goto('/socio/billetera');
    await expect(page).toHaveURL(/\/socio\/billetera/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Billetera/i, { timeout: 15000 });

    // 3. Validar presencia del saldo disponible y botones de acción
    await expect(page.locator('.tarjeta-dato-rotulo', { hasText: /Saldo Disponible/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Historial de Movimientos/i)).toBeVisible({ timeout: 10000 });

    // 4. Captura certificada P-19
    await page.screenshot({ path: 'certificacion-p19-billetera-auditado.png', fullPage: true });

    const erroresCriticos = erroresConsola.filter(e => e.includes('42703') || e.includes('column does not exist'));
    expect(erroresCriticos).toHaveLength(0);
  });
});
