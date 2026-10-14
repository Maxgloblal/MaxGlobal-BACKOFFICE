# TAREA-65 · Cálculo en Vivo de Rango y Regla de Línea Mayor

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 CORRECCIÓN DE CÁLCULO DE RANGOS Y VISUALIZACIÓN EN VIVO
**Fecha:** 14 de octubre de 2026
**Depende de:** TAREA-64 ✅

---

# LA SITUACIÓN Y DIAGNÓSTICO DE PRODUCCIÓN

A raíz de las capturas reales de producción del socio `MG00013` (Diamante Millonario) en el Ciclo 2:
1. En **P-15 (Mi Rango)**, las tarjetas superiores muestran `0 / 500 pts` y `0 / 1 frontales` a pesar de tener 5 directos activos y más de 3,300 pts.  
   *Causa:* `rango_ciclo` es `NULL` durante ciclo abierto; el frontend no realizaba fallback dinámico sobre las líneas en tiempo real.
2. En la tabla de líneas de P-15, cada frontal con más de 250 pts salía marcado con tope individual de 250 pts.  
   *Causa:* El código aplicaba `min(puntos, tope)` a cada una de las líneas, en contradicción con `config.linea_estirada_pct = 50` (*"la línea más fuerte"*).
3. A un socio con rango honorífico previo (Bronce), el sistema en ciclo abierto le fijaba por defecto la meta de Jade (Rango 1), degradándolo visualmente.
4. En **P-14 (Mis Comisiones)**, las comisiones de patrocinio retenidas por inactividad no aclaran que, al haberse activado el socio, su dinero está seguro y se liquidará al cierre del 31 de octubre.

---

# REQUISITOS DEL SISTEMA

```
   RF-250 · Rango del ciclo vigente en tiempo real (ciclo abierto)
   RF-254 · Explicación visual de la regla de línea estirada
   RF-255 · Desglose línea por línea (cálculo computable real)
   RF-256 · Tope del 50% aplicado exclusivamente a la línea de mayor volumen
   RF-257 · Rango meta siguiente según el rango honorífico del socio
   RF-258 · (Nuevo) Cálculo dinámico de frontales activos y puntos computables en ciclo abierto
   RF-244 · Aclaración de comisiones retenidas en P-14 con activación cumplida
```

---

# BLOQUE 1 · MOTOR TYPESCRIPT Y TESTS UNITARIOS

```
   src/motor/rango.ts
   src/test/motor-rango.test.js
```

1. Modificar `calcularPuntosComputables`:
   - Ordenar las líneas de mayor a menor puntaje.
   - La línea mayor aporta como máximo `topePorLinea = Math.floor(puntosRango * lineaEstiradaPct / 100)`.
   - Las demás líneas suman el 100% de sus puntos sin tope individual.
2. Actualizar las pruebas unitarias en `src/test/motor-rango.test.js` con cálculos a mano exactos.
3. Verificar que la lógica no admita puntos negativos y maneje redes vacías.
4. **Commit Bloque 1.**

---

# BLOQUE 2 · POSTGRES RPC: `fn_rango_lineas_socio`

```
   scripts/tarea65-rango-linea-mayor.sql
```

1. Actualizar `fn_rango_lineas_socio(p_socio_id, p_ciclo_id)`:
   - Ordenar las ramas por `puntos_totales_rama DESC`.
   - La primera fila (`ROW_NUMBER() OVER (ORDER BY puntos_totales_rama DESC) = 1`):
     * `puntos_computados = LEAST(puntos_totales_rama, v_tope_linea)`
     * `tope_alcanzado = (puntos_totales_rama > v_tope_linea)`
   - Las filas subsiguientes:
     * `puntos_computados = puntos_totales_rama`
     * `tope_alcanzado = false`
   - Si `v_rango_ciclo.rango_id IS NULL`:
     * Si `v_rango_honorifico.id IS NOT NULL`, meta siguiente = `v_rango_honorifico.orden + 1`.
     * Si no tiene rango honorífico, meta = 1 (Jade).
2. Aplicar primero en **DEMO** y luego en **PRODUCCIÓN**.
3. Probar con la consulta literal de `MG00013` (socio 13) en ciclo 2.
4. **Commit Bloque 2.**

---

# BLOQUE 3 · FRONTEND P-15 Y P-14

```
   src/paginas/P15MiRango.jsx
   src/paginas/P14MisComisiones.jsx
```

1. En `P15MiRango.jsx`:
   - Durante ciclo abierto (cuando `rc.frontales_activos` sea `null` o `undefined`):
     * `frontalesActivos = lineas.filter(l => l.activo).length`
     * `puntosComputables = lineas.reduce((acc, l) => acc + (l.puntos_computados || 0), 0)`
     * `puntosGrupales = lineas.reduce((acc, l) => acc + (l.puntos_totales_rama || 0), 0)`
2. En `P14MisComisiones.jsx`:
   - Si la comisión está en estado `'retenida'` y el socio ya está activo en el ciclo:
     * Mostrar badge/subtítulo: `Activación cumplida · Se liquidará al cierre del ciclo (31 de octubre)`.
3. **Commit Bloque 3.**

---

# BLOQUE 4 · INTEGRIDAD Y REPORTE FINAL

1. Auditoría de cero bytes nulos (`\x00`).
2. `git status --short` completamente limpio.
3. Push a GitHub (`main` y `master`).
4. Generación del reporte de cierre.
