import { test, expect } from '@playwright/test';

test.describe('Certificación de Integridad y Correlación Numérica en P-15 Mi Rango', () => {
  test('audita correlación matemática de puntos, topes de línea y conmutación de vistas', async ({ page }) => {
    test.setTimeout(60000);

    const erroresConsola = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        erroresConsola.push(msg.text());
      }
    });

    // 1. Iniciar sesión como socio con rango (Ana Quispe - socio 2)
    await page.goto('/login');
    await page.fill('#input-email', 'socio002@ejemplo.test');
    await page.fill('#input-password', 'MaxGlobal2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/socio/, { timeout: 15000 });

    // 2. Navegar a P-15
    await page.goto('/socio/rango');
    await expect(page).toHaveURL(/\/socio\/rango/);
    await expect(page.locator('h1.pagina-titulo')).toContainText(/Mi Rango/i, { timeout: 15000 });

    // 3. Seleccionar Ciclo 1 (ciclo con calificación de rango confirmada)
    const selectCiclo = page.locator('#select-ciclo-rango');
    await expect(selectCiclo).toBeVisible();
    await selectCiclo.selectOption('1');
    await page.waitForTimeout(1000); // Esperar renderizado reactivo del ciclo

    // 4. Verificar presencia del selector de perspectiva
    const btnConquistado = page.getByRole('button', { name: /Rango Conquistado/i });
    const btnMeta = page.getByRole('button', { name: /Próxima Meta/i });

    await expect(btnConquistado).toBeVisible({ timeout: 10000 });
    await expect(btnMeta).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // AUDITORÍA 1: PERSPECTIVA DE RANGO CONQUISTADO (ENCUADRE)
    // =========================================================================
    await btnConquistado.click();
    await page.waitForTimeout(500);

    // Capturar y parsear valor de la tarjeta "Puntos Computables"
    const tarjetaComputables = page.locator('.tarjeta-dato').filter({ hasText: /Puntos Computables/i });
    await expect(tarjetaComputables).toBeVisible();
    const textoValorTarjeta = await tarjetaComputables.locator('.tarjeta-dato-valor').innerText();
    const numComputablesTarjeta = parseInt(textoValorTarjeta.replace(/[^\d]/g, ''), 10);

    // Capturar y parsear valor de la tarjeta "Frontales Activos"
    const tarjetaFrontales = page.locator('.tarjeta-dato').filter({ hasText: /Frontales Activos/i });
    const textoFrontalesTarjeta = await tarjetaFrontales.locator('.tarjeta-dato-valor').innerText();
    const numFrontalesTarjeta = parseInt(textoFrontalesTarjeta.replace(/[^\d]/g, ''), 10);

    // Capturar filas de la tabla de balance de líneas (en escritorio o móvil)
    const seccionLineas = page.locator('.pagina-seccion').filter({ hasText: /Regla de Equilibrio de Red/i });
    const filasDesktop = seccionLineas.locator('table.tabla-escritorio tbody tr');
    const tarjetasMovil = seccionLineas.locator('.tabla-card-fila');

    const esDesktop = await filasDesktop.first().isVisible().catch(() => false);
    let sumaAportesTabla = 0;
    let conteoActivosTabla = 0;

    if (esDesktop) {
      const totalFilas = await filasDesktop.count();
      for (let i = 0; i < totalFilas; i++) {
        const fila = filasDesktop.nth(i);
        const textoEstado = (await fila.locator('td').nth(1).innerText()).trim().toLowerCase();
        if (textoEstado === 'activo') conteoActivosTabla++;

        const textoComputado = await fila.locator('td').nth(3).locator('.txt-bold').innerText();
        const numComputado = parseInt(textoComputado.replace(/[^\d]/g, ''), 10);
        sumaAportesTabla += numComputado;
      }
    } else {
      const totalTarjetas = await tarjetasMovil.count();
      for (let i = 0; i < totalTarjetas; i++) {
        const card = tarjetasMovil.nth(i);
        const textoEstado = (await card.locator('.insignia-estado').innerText()).trim().toLowerCase();
        if (textoEstado === 'activo') conteoActivosTabla++;

        const textoComputado = await card.locator('.tabla-card-campo').nth(3).locator('.txt-bold').innerText();
        const numComputado = parseInt(textoComputado.replace(/[^\d]/g, ''), 10);
        sumaAportesTabla += numComputado;
      }
    }

    // CORRELACIÓN 1: La suma exacta de la tabla debe coincidir al 100% con la tarjeta
    console.log(`[TEST AUDITORÍA] Conquistado -> Tarjeta: ${numComputablesTarjeta} pts | Suma Tabla: ${sumaAportesTabla} pts`);
    expect(sumaAportesTabla).toBe(numComputablesTarjeta);

    // CORRELACIÓN 2: Conteo de frontales activos
    console.log(`[TEST AUDITORÍA] Frontales Activos -> Tarjeta: ${numFrontalesTarjeta} | Conteo Tabla: ${conteoActivosTabla}`);
    expect(conteoActivosTabla).toBe(numFrontalesTarjeta);

    // CORRELACIÓN 3: Banner de encuadre oficial debe estar presente y sin contradicciones
    await expect(page.getByText(/Encuadre Oficial: Calificación al Rango/i)).toBeVisible();

    // Captura fotográfica de auditoría para la vista Conquistada
    await page.screenshot({ path: 'certificacion-p15-conquistado.png', fullPage: true });

    // =========================================================================
    // AUDITORÍA 2: PERSPECTIVA PARA CONQUISTAR (PRÓXIMA META)
    // =========================================================================
    await btnMeta.click();
    await page.waitForTimeout(500);

    // Capturar nuevo valor de la tarjeta "Puntos Computables"
    const textoValorTarjetaMeta = await tarjetaComputables.locator('.tarjeta-dato-valor').innerText();
    const numComputablesTarjetaMeta = parseInt(textoValorTarjetaMeta.replace(/[^\d]/g, ''), 10);

    // Re-calcular la suma en la tabla con el nuevo tope de la meta
    let sumaAportesTablaMeta = 0;
    if (esDesktop) {
      const totalFilas = await filasDesktop.count();
      for (let i = 0; i < totalFilas; i++) {
        const fila = filasDesktop.nth(i);
        const textoComputado = await fila.locator('td').nth(3).locator('.txt-bold').innerText();
        const numComputado = parseInt(textoComputado.replace(/[^\d]/g, ''), 10);
        sumaAportesTablaMeta += numComputado;
      }
    } else {
      const totalTarjetas = await tarjetasMovil.count();
      for (let i = 0; i < totalTarjetas; i++) {
        const card = tarjetasMovil.nth(i);
        const textoComputado = await card.locator('.tabla-card-campo').nth(3).locator('.txt-bold').innerText();
        const numComputado = parseInt(textoComputado.replace(/[^\d]/g, ''), 10);
        sumaAportesTablaMeta += numComputado;
      }
    }

    console.log(`[TEST AUDITORÍA] Meta -> Tarjeta: ${numComputablesTarjetaMeta} pts | Suma Tabla: ${sumaAportesTablaMeta} pts`);
    // CORRELACIÓN 4: La nueva suma debe coincidir al 100% con la tarjeta en modo Meta
    expect(sumaAportesTablaMeta).toBe(numComputablesTarjetaMeta);

    // CORRELACIÓN 5: En la meta superior, el aporte computable de la red no puede ser menor al del rango actual
    expect(numComputablesTarjetaMeta).toBeGreaterThanOrEqual(numComputablesTarjeta);

    // CORRELACIÓN 6: Banner de proyección hacia próxima meta debe estar presente
    await expect(page.getByText(/Proyección hacia la Próxima Meta/i)).toBeVisible();

    // Captura fotográfica de auditoría para la vista Próxima Meta
    await page.screenshot({ path: 'certificacion-p15-proxima-meta.png', fullPage: true });

    // =========================================================================
    // AUDITORÍA 3: ESCALA OFICIAL DE RANGOS
    // =========================================================================
    const tablaEscala = page.locator('.pagina-seccion').filter({ hasText: /Escala Oficial de Rangos Max Global/i });
    await expect(tablaEscala).toBeVisible();

    // Comprobar que el badge de Rango Actual está visible (en escritorio o móvil)
    const badgeActual = tablaEscala.getByText(/✓ RANGO ACTUAL/i);
    const countActual = await badgeActual.count();
    let actualVisible = false;
    for (let b = 0; b < countActual; b++) {
      if (await badgeActual.nth(b).isVisible()) {
        actualVisible = true;
        break;
      }
    }
    expect(actualVisible).toBe(true);

    // Comprobar que el badge de Próxima Meta está visible (en escritorio o móvil)
    const badgeMeta = tablaEscala.getByText(/🎯 PRÓXIMA META/i);
    const countMeta = await badgeMeta.count();
    let metaVisible = false;
    for (let b = 0; b < countMeta; b++) {
      if (await badgeMeta.nth(b).isVisible()) {
        metaVisible = true;
        break;
      }
    }
    expect(metaVisible).toBe(true);

    // =========================================================================
    // AUDITORÍA 4: CERO ERRORES DE CONSOLA JAVASCRIPT
    // =========================================================================
    console.log(`[TEST AUDITORÍA] Errores en consola JS: ${erroresConsola.length}`);
    expect(erroresConsola).toEqual([]);
  });
});
