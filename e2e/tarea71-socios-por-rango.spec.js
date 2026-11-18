import { test, expect } from '@playwright/test';

test.describe('TAREA-71 · Panel Admin: Socios por Rango (P-28)', () => {
  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como Administrador
    await page.goto('/login');
    await page.fill('#input-email', 'socio001@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test('P-28 muestra la sección "Socios por rango" con selector, tarjetas, chips, tabla y vistas responsivas', async ({ page }) => {
    // 1. Navegar a /admin/reportes
    await page.goto('/admin/reportes');
    await expect(page).toHaveURL(/\/admin\/reportes/);

    // Validar encabezado general de P-28
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Reportes del Negocio/i);

    // 2. Validar que la nueva sección existe
    const tituloSeccion = page.locator('h2.seccion-titulo', { hasText: /Socios por rango/i });
    await expect(tituloSeccion).toBeVisible({ timeout: 10000 });

    // 3. Validar selector de ciclo y opción histórica
    const selectorCiclo = page.locator('#select-ciclo-reportes');
    await expect(selectorCiclo).toBeVisible();
    await expect(selectorCiclo.locator('option[value="historico"]')).toContainText(/Histórico · rango más alto alcanzado/i);

    // 4. Seleccionar Ciclo 3 (Cerrado)
    await selectorCiclo.selectOption('3');
    await page.waitForTimeout(1000);

    const isMobile = (page.viewportSize()?.width || 1280) < 768;

    // Resumen de tarjetas por rango: Jade, Bronce, Plata deben estar presentes
    await expect(page.getByRole('button', { name: /Jade/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Bronce/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plata/i })).toBeVisible();

    if (!isMobile) {
      // VISTA ESCRITORIO (>= 768px): La tabla debe estar visible
      const tablaDesktop = page.locator('.socios-rango-tabla-desktop');
      await expect(tablaDesktop).toBeVisible();

      // Cabeceras de tabla para ciclo cerrado
      await expect(tablaDesktop.getByText('Socio', { exact: true })).toBeVisible();
      await expect(tablaDesktop.getByText('Código', { exact: true })).toBeVisible();
      await expect(tablaDesktop.getByText('Rango', { exact: true })).toBeVisible();
      await expect(tablaDesktop.getByText('Puntos computables', { exact: true })).toBeVisible();
      await expect(tablaDesktop.getByText('Frontales activos', { exact: true })).toBeVisible();
      await expect(tablaDesktop.getByText('Bono del rango', { exact: true })).toBeVisible();

      // Primer socio calificado en Ciclo 3 por orden de rango (Plata > Bronce > Jade): Paola Alvarez
      await expect(tablaDesktop.getByText('PAOLA ALVAREZ')).toBeVisible();
      await expect(tablaDesktop.getByText('MG00020')).toBeVisible();

      // Probar chip de filtro "Jade"
      const chipJade = page.locator('button.chip-filtro', { hasText: /Jade/i });
      await chipJade.click();
      await page.waitForTimeout(300);

      // Ahora solo socios Jade están visibles (Plata no debe estar)
      await expect(tablaDesktop.getByText('PAOLA ALVAREZ')).not.toBeVisible();
      await expect(tablaDesktop.getByText('MONICA ROJAS')).toBeVisible();

      // Regresar al chip "Todos"
      const chipTodos = page.locator('button.chip-filtro', { hasText: /Todos/i });
      await chipTodos.click();
      await page.waitForTimeout(300);
      await expect(tablaDesktop.getByText('PAOLA ALVAREZ')).toBeVisible();
    } else {
      // VISTA MÓVIL (< 768px, ej. 390px): Las tarjetas deben estar visibles y la tabla oculta
      const tablaDesktop = page.locator('.socios-rango-tabla-desktop');
      await expect(tablaDesktop).toBeHidden();

      const tarjetasMovil = page.locator('.socios-rango-tarjetas-movil');
      await expect(tarjetasMovil).toBeVisible();
      await expect(tarjetasMovil.getByText('PAOLA ALVAREZ')).toBeVisible();

      // Verificar chip en móvil
      const chipJade = page.locator('button.chip-filtro', { hasText: /Jade/i });
      await chipJade.click();
      await page.waitForTimeout(300);
      await expect(tarjetasMovil.getByText('PAOLA ALVAREZ')).not.toBeVisible();
      await expect(tarjetasMovil.getByText('MONICA ROJAS')).toBeVisible();
    }

    // 5. Seleccionar Ciclo 30 (Abierto) -> Debe mostrar aviso de cálculo en vivo
    await selectorCiclo.selectOption('30');
    await page.waitForTimeout(1000);

    const avisoVivo = page.getByText(/Mes en curso: cálculo en vivo, puede cambiar hasta el cierre/i);
    await expect(avisoVivo).toBeVisible({ timeout: 10000 });

    // 6. Seleccionar "Histórico" -> Rango más alto alcanzado
    await selectorCiclo.selectOption('historico');
    await page.waitForTimeout(1000);

    // En la base demo no hay socios con rango honorífico inicial, debe mostrar estado vacío según especificación
    const estadoVacio = page.getByText(/Ningún socio alcanzó un rango en este ciclo|Sin socios calificados/i);
    await expect(estadoVacio.first()).toBeVisible({ timeout: 10000 });
  });
});
