# TAREA-66 · Sincronización de Rango en Vivo, Salto Dinámico de Metas y Cierre Contable

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE  
**Gravedad:** 🔴 CORRECCIÓN DE CÁLCULO DE RANGO EN VIVO Y ALINEACIÓN DE CIERRE  
**Fecha:** 15 de octubre de 2026  
**Depende de:** TAREA-64 ✅, TAREA-65 ✅  

---

# 1. ANTECEDENTES Y DIAGNÓSTICO EN PRODUCCIÓN

A raíz de la revisión en vivo del caso de **Sonia Escobar Castro (`MG00007`)** en el Ciclo 2 (Octubre 2026):
1. **Contradicción en Pantalla P-15:**
   * La barra lateral y el navbar muestran **`VIGENTE: PLATA`** y **`TÍTULO: JADE`**.
   * La tarjeta central de P-15 muestra **`Rango en Curso (En Vivo): Bronce (Calificando)`** con meta **`Bronce (1,000 pts)`**.
   * La tabla de líneas aplica un tope de **500 pts** al brazo fuerte de Agape Choqueña (quien tiene 4,942 pts), sumando $500 + 950 + 800 + 800 = \mathbf{3,050\text{ pts}}$.
2. **Causa Raíz:**
   * En `fn_rango_lineas_socio`, cuando el ciclo está abierto (`v_rango_ciclo.rango_id IS NULL`), el código fijaba la meta como `rango_honorifico + 1` (Jade orden 1 $\rightarrow$ Bronce orden 2).
   * El sistema asumía erróneamente que un socio solo puede subir de 1 en 1 rango por ciclo.
   * No contemplaba el caso en que un socio con crecimiento exponencial salta de **Jade a Plata** o de **Jade a Oro** en el mismo mes.
3. **Desalineación en `fn_calcular_y_persistir_rangos`:**
   * En `supabase/instalador/02-funciones.sql:3738`, la función de cierre persistente aún mantenía la lógica histórica de recorte a todas las ramas (`SUM(LEAST(puntos, tope))`), en lugar de aplicar el tope del 50% exclusivamente a la línea mayor (`ROW_NUMBER() = 1`), tal como se corrigió en el motor TypeScript (`src/motor/rango.ts`).

---

# 2. REQUISITOS DEL SISTEMA (RF)

```
   RF-250 · Rango del ciclo vigente en tiempo real (dinámico de mayor a menor jerarquía)
   RF-256 · Tope del 50% de la meta del rango evaluado aplicado exclusivamente a la línea de mayor volumen
   RF-257 · Rango meta siguiente dinámico: se fija en (rango_actual_en_vivo.orden + 1)
   RF-258 · Puntos computables y frontales activos en vivo calculados según la meta siguiente real
   RF-482 · fn_calcular_y_persistir_rangos debe usar exactamente la misma regla de línea mayor exclusiva
```

---

# 3. PLAN DE EJECUCIÓN POR FASES

### Fase 1: Documentación Normativa (RFs y Lecciones)
* Actualizar `03-SISTEMA/09-RF-BACKOFFICE-SOCIO.md` y `03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md`.
* Documentar el patrón en `05-CONTROL/LECCIONES-Y-PATRONES.md`.

### Fase 2: Motor TypeScript y Tests Unitarios
* Actualizar `src/motor/rango.ts` con el cálculo dinámico de rango alcanzado en vivo y rango siguiente.
* Implementar pruebas unitarias completas en `src/test/motor-rango.test.js` cubriendo el caso exacto de Sonia Escobar (`MG00007`).

### Fase 3: Base de Datos Postgres RPC
* Actualizar `fn_rango_lineas_socio`:
  1. Recorrer la escala de rangos de mayor a menor calculando computables hacia cada rango.
  2. Determinar el rango alcanzado en vivo más alto que el socio cumple hoy.
  3. Fijar `rango_siguiente` como el rango inmediatamente superior al alcanzado en vivo.
  4. Calcular el tope de la línea mayor en base a ese `rango_siguiente`.
* Actualizar `fn_calcular_y_persistir_rangos`:
  * Corregir el loop de evaluación para usar la línea mayor exclusiva (`rn = 1`).
* Crear script `scripts/tarea66-sincronizar-rango-en-vivo.sql`.

### Fase 4: Frontend Backoffice
* Actualizar `src/paginas/P15MiRango.jsx` y `src/armazon/ArmazonSocio.jsx`.
* Tarjeta central debe mostrar `Plata (Calificando)` o `Oro (Calificando)` y la barra de progreso hacia la siguiente meta real.

### Fase 5: Pruebas y Certificación
* Vitest 100% verde.
* Compilación limpia con `npm run build`.
* Verificación E2E con Playwright.
