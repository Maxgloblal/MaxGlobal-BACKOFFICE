# TAREA-04A · MOTOR DE COMISIONES — PATROCINIO Y RESIDUAL

**Para:** Antigravity
**Escrita:** 28 de agosto de 2026
**Depende de:** TAREA-01 ✅ · 01B ✅ · 02 ✅ · 02B ✅ · 03 ✅ · 03B ✅ · 03C ✅

> **Esta es la pieza que justifica todo lo anterior.** Si el motor paga mal, no
> falla nada: simplemente se reparte dinero equivocado, mes tras mes, sin que
> nadie lo note. Por eso cada número de esta instrucción viene calculado a mano.

**Alcance:** solo **Bono de Patrocinio** y **Bono Residual**.
El Bono de Rango y el Bono Global son la TAREA-04B — faltan datos del cliente.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Y lo último de la tarea, siempre:

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**

---

# BLOQUE 0 · ARREGLAR LA ACTIVACIÓN ANTES DE CALCULAR NADA

## El error

La TAREA-03 calculó `activacion.activo = (puntos_personales >= 70)`.
**Falta la mitad de la regla.** La instrucción era mía y estaba incompleta.

**Confirmado por Máximo, respuesta 4.1:**
> *"Estos puntos es solo para el usuario, mas no comisiona al ascendente."*

**Y regla #5 del análisis de respuestas:**
> *Todos los packs cubren la activación del primer mes.*

Por eso `pack.cubre_activacion = true` en los cinco packs.

## La regla completa

```
   activo  =  (puntos_personales >= 70)
              OR
              (es el ciclo en que se afilió
               Y su orden de afiliación está CONFIRMADA
               Y el pack tiene cubre_activacion = true)
```

**La orden confirmada no es un detalle.** `config.puntos_se_acreditan_en = 'pago'`.
Un socio con la afiliación en `por_confirmar` **no se activa**, aunque su pack dé
150 puntos.

## A quién afecta

```
   EMPRENDEDOR    122 socios mal   ← da 0 puntos, nunca llegaba al umbral
   EJECUTIVO        2 socios       ← pero su orden está en por_confirmar,
                                     así que NO se activan. Están bien.
   GOLD/FAMILIAR/EMPRESARIAL   0   ← sus puntos ya pasan de 70
```

**Solo se activan 122 Emprendedores con afiliación confirmada.**

## El UPDATE

```sql
WITH objetivo AS (
  SELECT a.socio_id, a.ciclo_id
  FROM activacion a
  JOIN orden o ON o.socio_id = a.socio_id
              AND o.ciclo_id = a.ciclo_id
              AND o.tipo = 'afiliacion'
              AND o.estado = 'confirmada'
  JOIN socio s ON s.id = a.socio_id
  JOIN pack p ON p.id = s.pack_id AND p.cubre_activacion = true
  WHERE a.activo = false
)
UPDATE activacion a
SET activo = true, calculado_en = now()
FROM objetivo x
WHERE a.socio_id = x.socio_id AND a.ciclo_id = x.ciclo_id;
```

**Y corrige la misma regla en `scripts/sembrar-red.mjs`**, para que una
resiembra futura no repita el error.

## Verificación del bloque

```sql
-- cuántos activos por ciclo. Debe subir de 220/214/240
SELECT ciclo_id, count(*) FILTER (WHERE activo) activos FROM activacion GROUP BY 1 ORDER BY 1;

-- 🔴 0 filas: nadie activo sin puntos y sin afiliación confirmada ese ciclo
SELECT a.socio_id, a.ciclo_id FROM activacion a
WHERE a.activo AND a.puntos_personales < 70
AND NOT EXISTS (SELECT 1 FROM orden o WHERE o.socio_id=a.socio_id
    AND o.ciclo_id=a.ciclo_id AND o.tipo='afiliacion' AND o.estado='confirmada');

-- 🔴 0 filas: los 2 Ejecutivos con orden por_confirmar siguen inactivos
SELECT a.socio_id FROM activacion a
JOIN orden o ON o.socio_id=a.socio_id AND o.ciclo_id=a.ciclo_id AND o.tipo='afiliacion'
WHERE o.estado <> 'confirmada' AND a.activo AND a.puntos_personales < 70;
```

**Commit.**

---

# BLOQUE 1 · EL MOTOR, SIN BASE DE DATOS

Crea `src/motor/` en **TypeScript puro**.

```
   src/motor/tipos.ts          las formas de los datos
   src/motor/patrocinio.ts     bono de patrocinio
   src/motor/residual.ts       bono residual
   src/motor/index.ts          lo que se exporta
```

## 🔴 El motor no sabe que existe Supabase

**Recibe datos, devuelve comisiones. Nada más.**

```
   ❌  el motor hace un SELECT
   ❌  el motor importa supabaseClient
   ❌  el motor lee process.env
   ✅  el motor recibe arreglos ya cargados y devuelve un arreglo
```

**Motivo:** así se prueba entero sin base, sin red y sin navegador, y las
pruebas corren en milisegundos. Quien carga los datos y guarda el resultado es
otra capa, la del Bloque 4.

## 🔴 Ni un porcentaje escrito en el código

Los porcentajes se **reciben como parámetro**, cargados de `nivel_comision` y
`pack_comision_especial`. Si mañana Máximo cambia el nivel 3 del residual, se
cambia una fila de la base y el motor la sigue.

```
   ❌  const PORCENTAJES = [20, 4, 3, 2, 1, 0.5, 0.3]
   ✅  function calcularPatrocinio(orden, upline, escala, especiales, config)
```

## Todo en céntimos enteros

```
   ❌  0.308 * 120000        coma flotante
   ✅  Math.round(120000 * 20000 / 100000)   con el % en milésimas
```

El porcentaje viene como `numeric(?,3)` — tres decimales. Trabaja en milésimas
de punto porcentual y redondea **una sola vez, al final de cada nivel**.

**Commit.**

---

# BLOQUE 2 · BONO DE PATROCINIO

## Cuándo

Una sola vez, **al confirmarse una orden de afiliación**. Nunca en recompras.

## Sobre qué

**El precio completo del pack**, `orden.total_cent`. Sin descontar nada.

## La escala — verificada en Postgres el 28/08

| Nivel | % |
|---|---|
| 1 | 20.000 |
| 2 | 4.000 |
| 3 | 3.000 |
| 4 | 2.000 |
| 5 | 1.000 |
| 6 | 0.500 |
| 7 | 0.300 |
| **suma** | **30.800** |

> **Ojo:** en algunos resúmenes viejos aparece 40/20/10/5/3/2/1 para
> patrocinio. **Eso es la escala del RESIDUAL.** La de patrocinio es la de
> arriba. Léela de `nivel_comision WHERE tipo='patrocinio'`.

## 🔴 El Kit Emprendedor NO usa esta escala

```
   Kit Emprendedor  →  41.700% al NIVEL 1 y nada más
                       los niveles 2 al 7 no reciben un céntimo
```

Está en `pack_comision_especial`. **Si el pack comprado tiene fila ahí, esa
tabla manda y la escala de 7 niveles no se aplica.**

```
   Kit de 12000 cent × 41.7%  =  5004 cent   (S/. 50.04)
```

## Las dos condiciones de cada nivel — y no hay tercera

Para cada ancestro en el nivel N:

```
   (a) el pack DEL ANCESTRO habilita el nivel N
       ancestro.pack.niveles_patrocinio >= N
   (b) el ancestro está ACTIVO en el ciclo de la orden
       activacion.activo = true
```

**Si falla cualquiera, no se paga y no se busca sustituto.**

## 🔴 SIN COMPRESIÓN — la regla que más se equivoca

`config.compresion_activa = false`.

```
   El dinero de un nivel bloqueado NO se paga
   NO sube al siguiente calificado
   NO se reparte entre los demás
   SE QUEDA EN LA EMPRESA
```

**No escribas recursión ni búsqueda de calificados.** Se recorre el upline una
vez, de nivel 1 a 7, y en cada posición se paga o no se paga. Punto.

## Los niveles son los del pack del ANCESTRO, no del comprador

Un Ejecutivo solo cobra 3 niveles de patrocinio, aunque el de abajo compre un
Empresarial. Es `niveles_patrocinio` de la tabla `pack`:

```
   EMPRENDEDOR      0        ← no cobra patrocinio de nadie
   EJECUTIVO        3
   GOLD             7
   FAMILIAR         7
   EMPRESARIAL      7
```

## Ejemplo A · calculado a mano — pack GOLD, todos activos

Orden de afiliación GOLD, `total_cent = 120000`, siete ancestros Gold y todos
activos:

| Nivel | % | Cálculo | Céntimos |
|---|---|---|---|
| 1 | 20.000 | 120000 × 0.20 | **24000** |
| 2 | 4.000 | 120000 × 0.04 | **4800** |
| 3 | 3.000 | 120000 × 0.03 | **3600** |
| 4 | 2.000 | 120000 × 0.02 | **2400** |
| 5 | 1.000 | 120000 × 0.01 | **1200** |
| 6 | 0.500 | 120000 × 0.005 | **600** |
| 7 | 0.300 | 120000 × 0.003 | **360** |
| | | **TOTAL** | **36960** |

`36960 / 120000 = 30.8%` ✅ — y coincide con la lámina 11 del deck de Max Global.

## Ejemplo B · con un Ejecutivo en medio — el caso que revela los bugs

Misma orden Gold de 120000, pero el upline es:

```
   nivel 1  GOLD       activo
   nivel 2  GOLD       activo
   nivel 3  EJECUTIVO  activo      ← solo habilita 3 niveles
   nivel 4  EJECUTIVO  activo      ← nivel 4 > 3 : BLOQUEADO
   nivel 5  GOLD       INACTIVO    ← BLOQUEADO por actividad
   nivel 6  GOLD       activo
   nivel 7  GOLD       activo
```

| Nivel | Pack | Activo | ¿Cobra? | Céntimos |
|---|---|---|---|---|
| 1 | GOLD | sí | ✅ | 24000 |
| 2 | GOLD | sí | ✅ | 4800 |
| 3 | EJECUTIVO | sí | ✅ 3 ≤ 3 | 3600 |
| 4 | EJECUTIVO | sí | ❌ 4 > 3 | **0** |
| 5 | GOLD | **no** | ❌ inactivo | **0** |
| 6 | GOLD | sí | ✅ | 600 |
| 7 | GOLD | sí | ✅ | 360 |
| | | | **PAGADO** | **33360** |
| | | | **QUEDA EN LA EMPRESA** | **3600** |

```
   36960 − 33360 = 3600   =   2400 del nivel 4  +  1200 del nivel 5
```

**Los 3600 no se reparten. No suben. Se quedan.**
Si tu motor devuelve 36960 en este caso, tiene compresión y está mal.

## Ejemplo C · el Kit Emprendedor

Orden de afiliación EMPRENDEDOR, `total_cent = 12000`, upline entero de Gold
activos:

| Nivel | ¿Cobra? | Céntimos |
|---|---|---|
| 1 | ✅ 41.700% | **5004** |
| 2 al 7 | ❌ nunca | **0** |
| | **TOTAL** | **5004** |

**Commit.**

---

# BLOQUE 3 · BONO RESIDUAL

## Cuándo

**Cada mes, sobre las recompras de la red.**

## 🔴 Los packs de afiliación NO generan residual

Ya está marcado en los datos: `movimiento_puntos.cuenta_residual = false` para
todo lo de origen `afiliacion`. **El motor filtra por esa bandera, no por el
tipo de orden.**

## Sobre qué

**Los puntos del producto, a S/. 1.00 por punto.**

```
   base_cent = puntos × 100
```

```
   ❌  NO uses config.valor_punto_soles = 4.167
       Ese número es basura histórica que sigue en la tabla.
       Sale de dividir 75 ÷ 18 y no es un valor del sistema.
   ✅  config.valor_punto_comision = 1.00
```

**Confirmado por Máximo:** *"del café de 18 x 40% sería 7.20 soles"*.
18 puntos × 100 = 1800 cent. 1800 × 40% = 720 = S/. 7.20 ✅

## La escala — verificada en Postgres

| Nivel | % | Café, 18 pts |
|---|---|---|
| 1 | 40.000 | 720 |
| 2 | 20.000 | 360 |
| 3 | 10.000 | 180 |
| 4 | 5.000 | 90 |
| 5 | 3.000 | 54 |
| 6 | 2.000 | 36 |
| 7 | 1.000 | 18 |
| 8 | **10.000** | 180 |
| 9 | 5.000 | 90 |
| 10 | 1.000 | 18 |
| **suma** | **97.000** | **1746** |

## 🔴 El nivel 8 al 10% NO es un error de tecleo

Sube respecto al 1% del nivel 7. **Es un incentivo comercial deliberado**: solo
los packs Gold en adelante llegan a 10 niveles, así que el salto premia comprar
el plan alto.

**Prográmalo tal cual. No lo "corrijas".**

## Las mismas dos condiciones

```
   (a) ancestro.pack.niveles_residual >= N
   (b) ancestro activo en el ciclo
```

```
   EMPRENDEDOR      0 niveles      ← no cobra residual de nadie
   EJECUTIVO        5
   GOLD            10
   FAMILIAR        10
   EMPRESARIAL     10
```

**Y tampoco hay compresión.** Lo bloqueado queda en la empresa.

## Ejemplo D · calculado a mano — 126 puntos, upline completo

Recompra de **126 puntos** → `base_cent = 12600`. Diez ancestros Gold activos:

| Nivel | % | Céntimos |
|---|---|---|
| 1 | 40.000 | **5040** |
| 2 | 20.000 | **2520** |
| 3 | 10.000 | **1260** |
| 4 | 5.000 | **630** |
| 5 | 3.000 | **378** |
| 6 | 2.000 | **252** |
| 7 | 1.000 | **126** |
| 8 | 10.000 | **1260** |
| 9 | 5.000 | **630** |
| 10 | 1.000 | **126** |
| | **TOTAL** | **12222** |

`12222 / 12600 = 97.0%` ✅

## Ejemplo E · el corte del Ejecutivo

Misma recompra de 126 puntos, pero el nivel 3 es un **Ejecutivo activo**:

```
   nivel 3  EJECUTIVO  →  niveles_residual = 5  →  3 ≤ 5  ✅ cobra 1260
```

Y si ese mismo Ejecutivo estuviera en el **nivel 6**:

```
   nivel 6  EJECUTIVO  →  6 > 5  →  ❌ no cobra. Los 252 quedan en la empresa.
```

## Verificación de solvencia — la prueba de que el plan no quiebra

| Producto | El socio paga | Se reparte | Le queda a la empresa |
|---|---|---|---|
| Café | 7500 | 1746 | **5754 · 77%** |
| Aceite de Moringa | 6000 | 1358 | **4642 · 77%** |
| Harina de Moringa | 2500 | 582 | **1918 · 77%** |

**Si en alguna prueba el reparto supera lo que pagó el socio, el motor está
mal.** Ese es el chequeo que hay que tener siempre a mano.

**Commit.**

---

# BLOQUE 4 · GUARDAR EN LA TABLA `comision`

Una capa aparte, `src/motor/persistencia.js`, que carga los datos, llama al
motor y escribe el resultado.

## Las columnas de `comision` — verificadas en Postgres el 28/08

**Léelas bien, no las adivines.** El beneficiario NO se llama `socio_id`.

```
   id               bigserial
   ciclo_id         bigint   NOT NULL
   beneficiario_id  bigint   NOT NULL   ← QUIEN COBRA. No es socio_id
   generador_id     bigint              ← quien originó la venta
   orden_id         bigint              ← la orden que la genera
   tipo             varchar  NOT NULL   'patrocinio' | 'residual'
   nivel            smallint            1..10
   base_cent        bigint   NOT NULL   sobre qué se calculó
   base_puntos      integer             solo en residual
   porcentaje       numeric             el % aplicado, para auditar
   monto_cent       bigint   NOT NULL   lo que se paga
   estado           varchar  NOT NULL
   detalle          jsonb               por qué salió ese número
   creado_en        timestamptz NOT NULL
```

**Llena `base_cent`, `porcentaje` y `detalle` siempre.** El día que un socio
reclame *"¿por qué cobré esto?"*, esas tres columnas son la respuesta. Sin
ellas hay que recalcular a mano tres meses hacia atrás.

## 🔴 `comision` es un libro de SOLO-AGREGAR

```
   ❌  UPDATE comision
   ❌  DELETE FROM comision
   ✅  INSERT y nada más
```

Si un cálculo sale mal, **se agrega un movimiento que lo corrige**, no se borra
el anterior. Es contabilidad, no un borrador. Ya hay una prueba en
`base_datos.test.js` que verifica la inmutabilidad.

## Idempotencia

Calcular el mismo ciclo dos veces **no puede duplicar las comisiones**. Antes de
insertar, comprueba si ya existen para ese ciclo y tipo, y si existen, para y
avisa. No insertes encima.

## Conexión directa, no por MCP

Como dice `AGENTS.md`: `pg` en una transacción, por lotes. **Nada de generar
archivos SQL.**

**Commit.**

---

# BLOQUE 5 · PRUEBAS — CON LOS NÚMEROS DE ARRIBA

`src/test/motor-patrocinio.test.js` y `src/test/motor-residual.test.js`.

```js
❌  expect(c).toBe(calcularPatrocinio(orden, upline))   // no prueba nada
✅  expect(total).toBe(36960)                           // a mano
```

## Las que no pueden faltar

```
   PATROCINIO
   ☐  Ejemplo A · Gold, 7 activos            total 36960
   ☐  nivel 1 del ejemplo A                  24000
   ☐  nivel 7 del ejemplo A                  360
   ☐  Ejemplo B · con corte y un inactivo    total 33360
   ☐  Ejemplo B · lo no pagado               3600, y NO se reparte
   ☐  Ejemplo C · Kit Emprendedor            5004, y niveles 2-7 en cero
   ☐  Un upline de 3 ancestros solamente     no revienta, paga 3 niveles
   ☐  Un socio sin patrocinador (el id 1)    devuelve arreglo vacío
   ☐  Todos los ancestros inactivos          total 0, sin excepción

   RESIDUAL
   ☐  Ejemplo D · 126 pts, 10 activos        total 12222
   ☐  el nivel 8 paga 1260, MÁS que el 7     ← el salto deliberado
   ☐  Ejemplo E · Ejecutivo en nivel 6       no cobra, 252 a la empresa
   ☐  Café de 18 pts, nivel 1                720   ← el ejemplo de Máximo
   ☐  Una orden de afiliación                NO genera residual
   ☐  Un Emprendedor en el upline            nunca cobra residual

   INVARIANTES — estas valen por veinte pruebas
   ☐  Ninguna comisión es negativa
   ☐  Ninguna comisión tiene decimales
   ☐  La suma pagada NUNCA supera el 30.8% del pack
   ☐  La suma pagada NUNCA supera el 97% de la base de puntos
   ☐  Con compresión desactivada, pagado + empresa = total teórico
```

**Cobertura del motor: 100%.** Cada rama, cada caso borde.

**Commit.**

---

# BLOQUE 6 · CORRERLO CONTRA LOS 500 SOCIOS

Calcula los tres ciclos y pega la salida.

```sql
-- cuánto se pagó por tipo y ciclo
SELECT ciclo_id, tipo, count(*) movimientos, sum(monto_cent) total_cent
FROM comision GROUP BY 1,2 ORDER BY 1,2;

-- 🔴 0 filas: ninguna comisión negativa o con céntimos rotos
SELECT id FROM comision WHERE monto_cent <= 0;

-- 🔴 0 filas: nadie cobró estando inactivo
SELECT c.id FROM comision c
JOIN activacion a ON a.socio_id=c.beneficiario_id AND a.ciclo_id=c.ciclo_id
WHERE NOT a.activo;

-- 🔴 0 filas: nadie cobró un nivel que su pack no habilita
SELECT c.id, c.nivel, p.codigo, p.niveles_patrocinio, p.niveles_residual
FROM comision c
JOIN socio s ON s.id = c.beneficiario_id
JOIN pack p ON p.id = s.pack_id
WHERE (c.tipo='patrocinio' AND c.nivel > p.niveles_patrocinio)
   OR (c.tipo='residual'   AND c.nivel > p.niveles_residual);

-- 🔴 0 filas: nadie se pagó a sí mismo
SELECT c.id FROM comision c WHERE c.beneficiario_id = c.generador_id;

-- 🔴 0 filas: el beneficiario tiene que ser ancestro real del generador,
--    y en el nivel exacto que dice la comisión
SELECT c.id, c.nivel, c.beneficiario_id, c.generador_id
FROM comision c
WHERE c.generador_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM red_ancestro r
  WHERE r.descendiente_id = c.generador_id
    AND r.ancestro_id = c.beneficiario_id
    AND r.nivel = c.nivel);

-- 🔴 0 filas: ninguna afiliación generó residual
SELECT c.id FROM comision c JOIN orden o ON o.id=c.orden_id
WHERE c.tipo='residual' AND o.tipo='afiliacion';

-- el reparto nunca supera el techo
SELECT o.id, o.total_cent, sum(c.monto_cent) pagado,
       round(100.0*sum(c.monto_cent)/o.total_cent,2) pct
FROM comision c JOIN orden o ON o.id=c.orden_id
WHERE c.tipo='patrocinio' GROUP BY o.id, o.total_cent
HAVING sum(c.monto_cent) > o.total_cent * 0.308;
```

**Esa última tiene que devolver 0 filas.** Si devuelve alguna, el motor está
pagando por encima del plan.

## Y reporta estos tres números

```
   1 · Total pagado en patrocinio, por ciclo
   2 · Total pagado en residual, por ciclo
   3 · Cuánto quedó en la empresa por niveles bloqueados
       (el teórico menos el pagado — es la cifra que más le va
        a interesar a Máximo)
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ La red simulada          está verificada. NO resembrar
   ❌ Las pantallas            este motor no dibuja nada
   ❌ rango_ciclo · periodo_global   son la TAREA-04B
   ❌ Los 8 rangos sin valores  faltan datos del cliente
   ❌ config.valor_punto_soles = 4.167   NO lo uses. Ni lo borres todavía
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 6 consultas del bloque 6
   2 · La salida completa de vitest, con el conteo
   3 · Los tres números de arriba
   4 · Cuántas activaciones corrigió el bloque 0
   5 · Lo que decidiste no hacer, y por qué
```

**Si una consulta devuelve filas donde dice "0 filas", eso es un error y se
reporta como error. No como "verificado con éxito".**
