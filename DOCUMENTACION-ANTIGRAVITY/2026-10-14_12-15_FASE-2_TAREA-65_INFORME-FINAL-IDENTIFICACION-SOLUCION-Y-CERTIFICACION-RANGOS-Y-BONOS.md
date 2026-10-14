# INFORME TÉCNICO DEFINITIVO · TAREA-65
**Fecha:** 14 de octubre de 2026 (12:15)  
**Código:** INF-2026-10-14-65-FINAL  
**Hito:** Identificación Forense, Corrección Integral y Certificación de la Regla de Línea Mayor (RF-256), Contadores en Vivo (RF-250/258) y Transparencia de Bonos (RF-244)  
**Responsables Técnicos:** Antigravity AI Agent & Jack Franklin  
**Ambientes Auditados:** Producción (`xkiwnxoferdfapezcwoq`) y Demo (`utlohnidkuvxqppmoevj`)

---

## 1. RESUMEN EJECUTIVO Y ANTECEDENTES

A partir de las observaciones remitidas por la dirección general (Máximo) respecto a:
1. La comisión de patrocinio del socio Marleni Flores (`MG00024`), la cual figuraba con distintivo rojo de espera y saldo cero en billetera.
2. La pantalla P-15 (Mi Rango), la cual mostraba `0 / 1 frontales activos` y `0 / 500 pts computables` para líderes activos durante el ciclo en curso.
3. El cálculo de la regla de balance en rangos, donde cada línea frontal directa figuraba achatada con un tope de 250 pts.

Se procedió con una investigación forense completa de commits, código fuente y base de datos. Se determinó que:
* **El cálculo errado del 50% nació el 1 de septiembre de 2026 (Commit `173ba5f`)**, al aplicarse un recorte indiscriminado a todas las ramas en lugar de aplicarse exclusivamente al brazo de mayor volumen.
* **El detonante visual ocurrió el 13 de octubre de 2026 (Commit `573d445`)**, cuando se sustituyó la alerta preventiva por una insignia positiva verde en P-15, haciendo visible el achatamiento generalizado a 250 pts.
* **El caso de Marleni Flores obedece al comportamiento oficial de resguardo contable (`TAREA-51:148`)**: al registrarse la afiliación el día 13, la patrocinadora tenía 0 pts personales; sus S/. 1,600.00 permanecen intactos y se abonarán a su billetera en el cierre de ciclo mensual tras activarse el 14 de octubre.

---

## 2. MATRIZ DE REQUISITOS DEL SISTEMA (RF / RQ)

| Requisito | Tipo | Definición Oficial del Negocio | Estado Técnico Implementado |
|---|---|---|---|
| **RF-256** | Límite / Balance | **Tope del 50% en Línea Mayor:** El tope del 50% de los puntos de la meta del rango evaluado aplica exclusivamente al brazo frontal con mayor volumen (brazo fuerte). Todas las ramas secundarias aportan el 100% de su volumen sin restricción. | 🟢 Corregido en Motor TS (`src/motor/rango.ts`) y RPC Postgres (`fn_rango_lineas_socio`). |
| **RF-257** | Continuidad / Datos | **Escala y Rango Objetivo Dinámico:** Si el ciclo está abierto, el rango meta a evaluar toma como referencia el orden inmediatamente superior al rango honorífico ya alcanzado por el socio (`orden + 1`). | 🟢 Corregido en Postgres RPC. Socios Bronce evalúan meta hacia Plata (2,000 pts). |
| **RF-250** | Funcional / UI | **Rango del Ciclo en Tiempo Real:** Durante el ciclo mensual en curso, P-15 debe calcular y desplegar el estatus en vivo del socio sin esperar el cierre. | 🟢 Corregido con fallback reactivo en `P15MiRango.jsx`. |
| **RF-258** *(Nuevo)* | Funcional / Fallback | **Cálculo en Vivo de Frontales Activos:** Cuando `rango_ciclo` es nulo, los frontales activos se contabilizan sumando las líneas directas con activación confirmada en el ciclo. | 🟢 Incorporado formalmente en el componente de presentación. |
| **RF-244** | Auditoría / Pedagogía | **Transparencia en Comisiones Retenidas:** Si un socio tiene comisiones retenidas por falta de activación inicial pero ya cumplió su consumo de 70 pts en el mes, el sistema debe informar pedagógicamente que se liquidarán al cierre del ciclo. | 🟢 Aclarado en P-14 con insignia ámbar y banner informativo. |

---

## 3. AUDITORÍA FORENSE DE COMMITS

### A. 1 de septiembre de 2026 · Commit `173ba5f` (TAREA-04B)
* **Archivo:** `src/motor/rango.ts`.
* **Código implementado:**
  ```typescript
  const topePorLinea = Math.floor((puntosRango * lineaEstiradaPct) / 100);
  let totalComputable = 0;
  for (const linea of lineasFrontales) {
    const pts = Math.max(0, linea.puntos_totales || 0);
    totalComputable += Math.min(pts, topePorLinea); // 🔴 Recorte a TODAS las ramas
  }
  ```
* **Diagnóstico:** Se programó un bucle que limitaba cada línea individual al tope, en vez de ordenar por volumen y recortar únicamente la primera.

### B. 4 de septiembre de 2026 · Script SQL `tarea12-rango-lineas-socio.sql`
* **Función:** `fn_rango_lineas_socio`.
* **Código SQL:**
  ```sql
  'puntos_computados', LEAST(r.puntos_totales_rama, v_tope_linea)
  ```
* **Diagnóstico:** Se aplicó la misma lógica indiscriminada en Postgres y se fijó por defecto la meta en Jade (`orden = 1`, 500 pts $\rightarrow$ tope 250 pts) para cualquier ciclo en curso.

### C. 13 de octubre de 2026 · Commit `573d445` (TAREA-64)
* **Acción ejecutada:** Rediseño visual pedagógico en `P15MiRango.jsx`.
* **Detonante:** Al cambiar la alerta `⚠️ Tope 250 pts` por un distintivo verde `✓ Aporte máx. alcanzado (250 pts)`, se hizo visible en pantalla que todas las ramas estaban siendo limitadas a 250 pts.

---

## 4. SOLUCIÓN IMPLEMENTADA Y CERTIFICADA

### 1. Motor TypeScript (`src/motor/rango.ts`) — Commit `7688969`
```typescript
export function calcularPuntosComputables(
  lineasFrontales: LineaFrontal[],
  puntosRango: number,
  lineaEstiradaPct: number = 50
): number {
  if (!lineasFrontales || lineasFrontales.length === 0 || puntosRango <= 0) return 0;
  const topePorLinea = Math.floor((puntosRango * lineaEstiradaPct) / 100);
  const ordenadas = [...lineasFrontales].sort(
    (a, b) => (b.puntos_totales || 0) - (a.puntos_totales || 0)
  );
  let totalComputable = Math.min(Math.max(0, ordenadas[0].puntos_totales || 0), topePorLinea);
  for (let i = 1; i < ordenadas.length; i++) {
    totalComputable += Math.max(0, ordenadas[i].puntos_totales || 0);
  }
  return totalComputable;
}
```

### 2. Base de Datos Postgres (`fn_rango_lineas_socio`) — Commit `3c6ec14`
* Se empleó `ROW_NUMBER() OVER (ORDER BY r.puntos_totales_rama DESC, r.frontal_id ASC) AS rn`.
* `puntos_computados`:
  ```sql
  CASE WHEN r.rn = 1 THEN LEAST(r.puntos_totales_rama, v_tope_linea) ELSE r.puntos_totales_rama END
  ```
* `rango_siguiente`: Evalúa `v_rango_honorifico.orden + 1` en ciclo abierto.
* **Aplicado con éxito en Producción (`xkiwnxoferdfapezcwoq`) y Demo (`utlohnidkuvxqppmoevj`).**

### 3. Frontend Backoffice Socio (`P15MiRango.jsx` y `P14MisComisiones.jsx`) — Commit `8cdcc35`
* Fallback en tiempo real para `frontalesActivos`, `puntosComputables` y `puntosGrupales`.
* En la tabla de equilibrio, solo la rama principal muestra `✓ Línea mayor: tope 50% (X pts)` o `★ Línea mayor (100% computado)`.
* En P-14, comisiones retenidas de socios activos muestran `⏳ Retenida al afiliar · Se liquida al cierre`.

---

## 5. EVIDENCIAS DE VERIFICACIÓN EN PRODUCCIÓN

### Consulta en Producción para Diamante Millonario (`MG00013` · Ciclo 2 en curso):
```json
[
  { "codigo": "MG00017", "nombre": "ANITA PIO", "pts_totales": 1150, "pts_computados": 1000, "linea_mayor": true, "tope_alcanzado": true },
  { "codigo": "MG00024", "nombre": "MARLENI FLORES HUAMANI", "pts_totales": 870, "pts_computados": 870, "linea_mayor": false, "tope_alcanzado": false },
  { "codigo": "MG00021", "nombre": "MERY LUZ HUALLPA LAURA", "pts_totales": 642, "pts_computados": 642, "linea_mayor": false, "tope_alcanzado": false },
  { "codigo": "MG00032", "nombre": "MIGUEL GERMAN TORRES TOTOCAYO", "pts_totales": 470, "pts_computados": 470, "linea_mayor": false, "tope_alcanzado": false },
  { "codigo": "MG00027", "nombre": "JUANA CCORAHUA CCAPA", "pts_totales": 210, "pts_computados": 210, "linea_mayor": false, "tope_alcanzado": false },
  { "codigo": "MG00014", "nombre": "PIERO DIAMANTE", "pts_totales": 0, "pts_computados": 0, "linea_mayor": false, "tope_alcanzado": false }
]
```
* **Total grupal:** 3,342 pts.
* **Total computable hacia Plata:** 3,192 pts (1,000 + 870 + 642 + 470 + 210).
* **Frontales activos:** 5 frontales.

### Suite de Pruebas Automatizadas:
* `npm run build`: Compilación limpia en 6.90s.
* `npx vitest run`: 72 pruebas pasadas en suites de motor, pantallas y seguridad.
* Capturas Playwright Chromium generadas en alta resolución.
