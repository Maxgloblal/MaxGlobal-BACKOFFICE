# TAREA-03B · CORRECCIÓN DE LA RED SIMULADA

**Para:** Antigravity
**Depende de:** TAREA-03 (ejecutada, commit `61828d7`)
**Escrita:** 28 de agosto de 2026, 11:45
**Método:** se resiembra de cero con el script corregido. Misma semilla.

> **No parchees con UPDATE.** El script es determinista e idempotente: se
> arregla el generador y se vuelve a correr. Una red parchada a mano no la
> puede reproducir nadie.

---

## PRIMERO — DOS COSAS QUE HAY QUE DECIR

### El `.git` no estaba corrupto. El error fue mío.

El `fatal: unknown error occurred while reading the configuration files` venía
del montaje de la unidad, no del repositorio. **El bloque 0 de la TAREA-03 fue
un trabajo innecesario que yo te mandé hacer.** Los tres commits están bien y
`61828d7` es real.

Deja `.git-corrupto-20260828` donde está por ahora. No lo borres todavía.

### La siembra tiene mucho bien hecho

Verificado contra Postgres, no contra tu reporte:

```
   0 socios huérfanos          0 detalles con aritmética rota
   0 precios fuera de catálogo 0 puntos prorrateados por descuento
   0 emprendedores afiliando otro pack
   0 afiliaciones con cuenta_residual = true
   0 activaciones inconsistentes con sus movimientos
   Rama de laboratorio 1–13 exacta, con el socio 13 colgando del 2
```

Eso está bien y no se toca. Lo que sigue es lo que no.

---

## 🔴 REGLA DE REPORTE

**La salida se PEGA LITERAL.** Y esta vez, además:

> **Si una consulta de verificación está en la instrucción, se corre esa
> consulta. No una parecida.**

En la TAREA-03 pedí esta:

```sql
SELECT id, subtotal_cent, descuento_cent, total_cent
FROM orden WHERE total_cent <> subtotal_cent - descuento_cent;
```

La reemplazaste por la de vouchers y reportaste `[]`. **Esa consulta devuelve
una fila.** La sustitución escondió el único error de dinero de toda la siembra.

---

## DEFECTO 1 · 45 MOVIMIENTOS DE PUNTOS CRUZADOS ENTRE SOCIOS

### La evidencia

```
   socio 42  EMPRENDEDOR  puntos_rango   0  →  movimiento dice   70
   socio 44  EJECUTIVO    puntos_rango  70  →  movimiento dice    0
   socio 45  EMPRENDEDOR  puntos_rango   0  →  movimiento dice   70
   socio 54  GOLD         puntos_rango 150  →  movimiento dice    0
   socio 55  EMPRENDEDOR  puntos_rango   0  →  movimiento dice  150
```

Van en **pares intercambiados**. La `orden` tiene el `puntos_total` correcto; el
`movimiento_puntos` toma los puntos de otro socio.

### Por qué es grave y no se ve

La activación se calculó **a partir del movimiento**. Así que es coherente
consigo misma: mi consulta de activación devuelve 0 inconsistencias.

```
   45 socios quedaron activados con puntos que no son suyos
   y 45 socios que sí compraron quedaron inactivos.

   El motor de rango de la TAREA-04 va a pagar a quien no le toca
   y no va a fallar. No hay excepción, no hay prueba en rojo.
   Simplemente paga mal.
```

### Qué hacer

Busca en `sembrar-red.mjs` dónde se construyen los movimientos de afiliación.
El síntoma es un índice desalineado: se recorre una lista de órdenes y otra de
socios en paralelo, o se usa el índice del arreglo donde va el `socio_id`.

**La regla es una sola:**

```
   movimiento_puntos.puntos = SIEMPRE orden.puntos_total de SU PROPIA orden
```

Deriva el movimiento **desde la fila de la orden ya insertada**, nunca desde un
arreglo paralelo. Si tienes el `orden_id`, tienes el `socio_id` y los puntos.

---

## DEFECTO 2 · LA ORDEN 575 CON EL DESCUENTO MAL

```
   socio 79 · pack EMPRENDEDOR · descuento_recompra_pct = 40

   subtotal_cent   57000    ✅ correcto, a precio de lista
   descuento_cent  28500    🔴 es el 50%, no el 40%
   total_cent      34200    ✅ correcto, 57000 × 0.60
   descuento_cent debería ser 22800
```

Los dos `orden_detalle` están perfectos (9000 y 7200, ambos al 40%). **El error
está solo en el cabezal.**

### La regla

Los tres campos de la orden se calculan **sumando los detalles**, nunca aparte:

```
   subtotal_cent  = Σ (precio_lista_cent × cantidad)
   total_cent     = Σ (precio_final_cent × cantidad)
   descuento_cent = subtotal_cent − total_cent      ← resta, no un % otra vez
```

Si `descuento_cent` se calcula aplicando un porcentaje por segunda vez, siempre
va a haber una rama donde ese porcentaje no sea el del socio. **Que sea una
resta y el problema desaparece para siempre.**

---

## DEFECTO 3 · LA RED SALIÓ DEGENERADA

### Lo que pasó

| pack | pedido | real |
|---|---|---|
| EMPRENDEDOR | 225 | **429** |
| EJECUTIVO | 150 | **33** |
| GOLD | 75 | **31** |
| FAMILIAR | 35 | **5** |
| EMPRESARIAL | 15 | **3** |

### Por qué

Elegiste **primero el patrocinador y después el pack**. Como
`EMPRENDEDOR.solo_afilia_igual = true`, todo el que cae bajo un Emprendedor está
obligado a ser Emprendedor. Es un sumidero: una vez que la rama entra, no sale.

### Lo que cuesta

```
   39 socios de 501 llegan a 7 niveles de patrocinio y 10 de residual.
   Solo 39 · 30 · 28 activos por ciclo — el 6%.

   El motor de la TAREA-04 se probaría contra una red casi muerta:
   la escala de 7 niveles y el salto del nivel 8 al 10% apenas
   se ejercitarían.
```

### 🔴 El arreglo: se sortea el PACK primero

```
   1 · Se sortea el pack del socio nuevo, con la distribución objetivo
   2 · Si el pack NO es EMPRENDEDOR
          → el patrocinador se elige SOLO entre socios no-Emprendedor
   3 · Si el pack ES EMPRENDEDOR
          → el patrocinador puede ser cualquiera
   4 · Si no hay ningún patrocinador compatible con hueco disponible
          → se cuelga de la raíz (socio 1) y se anota en el reporte
```

Con esto `solo_afilia_igual` se sigue respetando al 100% — la consulta de
verificación tiene que seguir dando 0 filas — pero la distribución vuelve a ser
la que se decidió.

### Y el tope de profundidad

**Salió 24. El máximo es 12.** Al elegir patrocinador, descarta a los que ya
estén a profundidad 11 o más. Tiene que haber **al menos una cadena de 12** para
que se pruebe el corte del residual — la rama de laboratorio ya llega a 11.

### Objetivo de activación

```
   Entre 35% y 50% de socios activos en cada ciclo.
```

Antes fue 6%. Con la distribución arreglada sube sola, porque los packs
Ejecutivo en adelante ya activan por sí mismos. **Si no llega al 35%, sube la
tasa de recompra hasta que llegue** — el motor necesita gente a quien pagarle.

---

## COMMITS

**Uno por bloque. No uno al final.**

En la TAREA-03 hiciste un solo commit para los bloques 1 al 6, y quedaron 7
archivos modificados sin commitear:

```
 M 00-INSTRUCCIONES/00-LEEME-PRIMERO.md
 M 00-INSTRUCCIONES/TAREA-01-BASE-DE-DATOS.md
 M 00-INSTRUCCIONES/TAREA-01B-CORRECCION-VISTAS-RLS.md
 M 00-INSTRUCCIONES/TAREA-02B-CORRECCION-DINERO.md
 M DOCUMENTACION-ANTIGRAVITY/README.md
 M package-lock.json
 M package.json
```

Commitea eso también, en un commit aparte y explicando qué cambiaste de esos
documentos de instrucciones — **no deberías estar modificando las tareas ya
escritas.**

```
   03B-1  arreglo del cruce de movimientos
   03B-2  arreglo del cálculo de descuento_cent
   03B-3  sorteo de pack primero + tope de profundidad
   03B-4  resiembra ejecutada
   03B-5  verificación
```

---

## VERIFICACIÓN — LAS 12 CONSULTAS, TODAS, SIN SUSTITUIR NINGUNA

```sql
-- 1 · roles
SELECT rol, count(*) FROM socio GROUP BY rol;

-- 2 · distribución de packs — tiene que acercarse a 225/150/75/35/15
SELECT p.codigo, count(*) FROM socio s JOIN pack p ON p.id=s.pack_id GROUP BY 1 ORDER BY 2 DESC;

-- 3 · profundidad: entre 12 y 12. Ni más ni menos
SELECT max(nivel) FROM red_ancestro;

-- 4 · solo_afilia_igual. 0 filas
SELECT s.id FROM socio s JOIN socio pat ON pat.id=s.patrocinador_id
JOIN pack pp ON pp.id=pat.pack_id JOIN pack p ON p.id=s.pack_id
WHERE pp.solo_afilia_igual AND p.codigo <> 'EMPRENDEDOR';

-- 5 · 🔴 LA QUE OMITISTE. Aritmética del cabezal de la orden. 0 filas
SELECT id, subtotal_cent, descuento_cent, total_cent
FROM orden WHERE total_cent <> subtotal_cent - descuento_cent;

-- 6 · el cabezal contra sus detalles. 0 filas
SELECT o.id FROM orden o JOIN orden_detalle d ON d.orden_id=o.id
GROUP BY o.id, o.total_cent, o.subtotal_cent, o.puntos_total
HAVING o.total_cent    <> sum(d.precio_final_cent*d.cantidad)
    OR o.subtotal_cent <> sum(d.precio_lista_cent*d.cantidad)
    OR o.puntos_total  <> sum(d.puntos_subtotal);

-- 7 · 🔴 EL CRUCE DE PUNTOS. 0 filas
SELECT m.id, m.socio_id, m.puntos, o.puntos_total
FROM movimiento_puntos m JOIN orden o ON o.id=m.orden_id
WHERE m.puntos <> o.puntos_total;

-- 8 · vouchers. 0 filas
SELECT v.id FROM voucher v JOIN orden o ON o.id=v.orden_id WHERE v.monto_cent <> o.total_cent;

-- 9 · afiliaciones sin residual. 0 filas
SELECT id FROM movimiento_puntos WHERE origen='afiliacion' AND cuenta_residual;

-- 10 · huérfanos. 0 filas
SELECT s.id FROM socio s WHERE s.patrocinador_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM red_ancestro r WHERE r.descendiente_id=s.id);

-- 11 · activación coherente con los movimientos. 0 filas
SELECT * FROM (
  SELECT a.socio_id, a.ciclo_id, a.puntos_personales, a.activo,
         COALESCE(sum(m.puntos) FILTER (WHERE m.cuenta_activacion),0) real
  FROM activacion a
  LEFT JOIN movimiento_puntos m ON m.socio_id=a.socio_id AND m.ciclo_id=a.ciclo_id
  GROUP BY 1,2,3,4) x
WHERE puntos_personales <> real OR activo <> (real >= 70);

-- 12 · activos por ciclo — entre 35% y 50% de 501
SELECT ciclo_id, count(*) FILTER (WHERE activo) activos,
       round(100.0*count(*) FILTER (WHERE activo)/count(*),1) pct
FROM activacion GROUP BY 1 ORDER BY 1;
```

### Y lo de siempre

```bash
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
git log --oneline
git status --short
```

---

## PRUEBAS NUEVAS EN `sembrar-red.test.js`

Con números a mano, no con la función bajo prueba:

```js
✅  expect(descuentoCent(57000, 34200)).toBe(22800)   // el caso de la orden 575
✅  expect(precioFinal(15000, 40)).toBe(9000)
✅  expect(precioFinal(15000, 50)).toBe(7500)
✅  expect(puntosMovimiento(orden)).toBe(orden.puntos_total)
✅  un Emprendedor NUNCA recibe un frontal de otro pack
✅  ningún socio queda a profundidad > 12
```

---

## LO QUE ENTREGAS

```
   1 · La salida literal de las 12 consultas. Las 12. Sin sustituir ninguna
   2 · La causa exacta del cruce de movimientos: qué línea lo hacía
   3 · Cuántos socios terminaron colgados de la raíz por falta de
       patrocinador compatible
   4 · Los ids de los 6 casos borde de activación
   5 · Lo que decidiste no hacer, con el motivo
```

**Si una consulta devuelve filas, eso NO es "verificado con éxito".**
Es un error, y se reporta como error.
