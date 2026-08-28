# TAREA-03 · RED SIMULADA DE 500 SOCIOS

**Para:** Antigravity
**Depende de:** TAREA-01 (base de datos) ✅ · TAREA-01B ✅ · TAREA-01C · TAREA-02B
**Escrita:** 28 de agosto de 2026
**Objetivo:** dejar la base con una red real de 500 socios, tres ciclos de
historia y órdenes confirmadas — para que la TAREA-04 (motor de comisiones)
tenga contra qué calcular.

> **Esta tarea NO calcula comisiones.** No escribe en `comision`,
> `rango_ciclo`, `wallet_movimiento` ni `periodo_global`. Solo siembra.
> Si te dan ganas de calcular una comisión, esa es la TAREA-04.

---

## 🔴 REGLA DE REPORTE — LEE ESTO ANTES QUE NADA

**La salida de linters, pruebas, compilación, git y SQL se PEGA LITERAL.**
No se resume. No se declara. No se parafrasea.

```
   ❌  "Linter: 0 errores, 0 advertencias"
   ❌  "Todo verificado correctamente"
   ✅  [pegas la salida completa del comando, tal cual salió]
```

Si decides no arreglar algo, dilo así:
*"quedan 2 advertencias, no las corrijo porque ___"*.
**Una decisión razonada no es lo mismo que un problema inexistente.**

---

## BLOQUE 0 · ARREGLAR EL REPOSITORIO

**El `.git` de esta carpeta está corrupto.** Cualquier comando devuelve:

```
fatal: unknown error occurred while reading the configuration files
```

Sin git no hay commits que verificar ni forma de restaurar un archivo cortado.
**Esto se arregla primero.**

```bash
cd "SISTEMA MOTOR Y BACKOFFICE"
mv .git .git-corrupto-20260828
git init
git add -A
git commit -m "TAREA-03 B0: repositorio reinicializado, estado previo intacto"
git log --oneline
```

**No borres `.git-corrupto-20260828`.** Renombrar, no eliminar.

**Pega la salida de `git log --oneline`.** Si sigue fallando, para aquí y
repórtalo — no sigas con los bloques siguientes sin repositorio.

---

## BLOQUE 1 · EL SEMBRADOR, DETERMINISTA

Archivo: `scripts/sembrar-red.mjs`

### Nada de Math.random

**La red tiene que salir idéntica cada vez que se corra.** Si cambia entre
ejecuciones, las pruebas del motor no valen nada y no se puede calcular ningún
número a mano.

Usa un PRNG con semilla fija:

```js
// mulberry32 — determinista, misma semilla, misma secuencia
function prng(semilla) {
  return function () {
    semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = prng(20260828);   // ← la semilla NO se cambia
```

### El script debe ser idempotente

Al inicio, borrar en orden inverso de dependencia y reiniciar las secuencias:

```sql
TRUNCATE activacion, movimiento_puntos, orden_detalle, voucher, envio,
         orden, red_ancestro, ciclo RESTART IDENTITY CASCADE;
DELETE FROM socio;
ALTER SEQUENCE socio_id_seq RESTART WITH 1;
```

**No toca:** `config`, `producto`, `pack`, `rango`, `nivel_comision`,
`pack_comision_especial`, `punto_entrega`. Esos son datos maestros.

---

## BLOQUE 2 · LOS 500 SOCIOS

### La forma de la red: irregular, como en la vida real

| Frontales directos | % de socios | Aprox. |
|---|---|---|
| 0 | 35% | 175 |
| 1 a 2 | 35% | 175 |
| 3 a 5 | 22% | 110 |
| 6 a 10 | 8% | 40 |

**Profundidad máxima: 12 niveles.** Tiene que haber al menos una cadena que
pase de 10 para que se pruebe el corte del residual.

### Distribución de packs

| Pack | % | Aprox. |
|---|---|---|
| EMPRENDEDOR | 45% | 225 |
| EJECUTIVO | 30% | 150 |
| GOLD | 15% | 75 |
| FAMILIAR | 7% | 35 |
| EMPRESARIAL | 3% | 15 |

### 🔴 La regla que te va a morder: `solo_afilia_igual`

En la base, `pack.solo_afilia_igual = true` **solo para EMPRENDEDOR**.

```
   Un socio con Kit Emprendedor SOLO puede afiliar a otro Emprendedor.
   No puede tener frontales Ejecutivo, Gold, Familiar ni Empresarial.
```

**El generador tiene que respetarlo al elegir patrocinador.** Si el candidato a
patrocinador es EMPRENDEDOR, el nuevo socio también es EMPRENDEDOR.

### La rama de laboratorio — socios 1 al 13, escritos A MANO

**No los generes.** Van tal cual, para que el motor tenga una cadena de
profundidad conocida contra la que calcular a mano.

| id | nombre | pack | patrocinador_id | nivel desde raíz |
|---|---|---|---|---|
| 1 | MAXIMO ADMIN | EMPRESARIAL | `NULL` | raíz |
| 2 | ANA QUISPE | GOLD | 1 | 1 |
| 3 | BRUNO ROJAS | GOLD | 2 | 2 |
| 4 | CARLA MENDOZA | EJECUTIVO | 3 | 3 |
| 5 | DIEGO SALAS | EJECUTIVO | 4 | 4 |
| 6 | ELENA VARGAS | GOLD | 5 | 5 |
| 7 | FABIO LEON | GOLD | 6 | 6 |
| 8 | GINA PAREDES | GOLD | 7 | 7 |
| 9 | HUGO CASTRO | GOLD | 8 | 8 |
| 10 | IRIS FLORES | GOLD | 9 | 9 |
| 11 | JOEL RAMOS | GOLD | 10 | 10 |
| 12 | KARLA DIAZ | GOLD | 11 | 11 |
| 13 | LUIS TORRES | EMPRENDEDOR | 2 | 2 |

**El socio 1 tiene `rol = 'admin'`.** Los demás `rol = 'socio'`.
Todos `estado = 'activo'`.

Los socios 14 al 501 se generan colgando de esta rama y entre sí.

### Campos obligatorios de `socio`

Columnas verificadas contra Postgres el 28/08:

```
   codigo           'MG00001' … 'MG00501'   único
   email            socio001@ejemplo.test   único, dominio .test a propósito
   password_hash    un bcrypt fijo de prueba, el mismo para todos
   nombres          nombres peruanos reales, variados
   apellidos        idem
   documento        DNI de 8 dígitos, único
   telefono         9XXXXXXXX
   ciudad           Lima, Arequipa, Trujillo, Cusco, Piura, Chiclayo, Iquitos
   patrocinador_id  NULL solo para el id 1
   pack_id          FK a pack
   fecha_afiliacion entre 2026-06-01 y 2026-08-25
   fecha_nacimiento para poder probar el bono cumpleaños después
   estado           'activo'
   rol              'socio', salvo el id 1
   banco            BCP, BBVA, Interbank, Scotiabank
   cuenta_bancaria  20 dígitos
```

**`chk_no_auto_patrocinio`** existe en la base: `id <> patrocinador_id`.
Un socio no puede patrocinarse a sí mismo, la base lo rechaza.

### `red_ancestro` — la tabla que hace rápido al motor

Por cada socio, una fila por cada ancestro hasta la raíz:

```
   descendiente_id · ancestro_id · nivel
```

`nivel = 1` es el patrocinador directo. La base tiene
`CHECK (nivel >= 1 AND nivel <= 50)`.

**Se llena de golpe al final del bloque, con un CTE recursivo** — no socio por
socio, o son 500 viajes a la base:

```sql
WITH RECURSIVE cadena AS (
  SELECT id AS descendiente_id, patrocinador_id AS ancestro_id, 1::smallint AS nivel
  FROM socio WHERE patrocinador_id IS NOT NULL
  UNION ALL
  SELECT c.descendiente_id, s.patrocinador_id, (c.nivel + 1)::smallint
  FROM cadena c JOIN socio s ON s.id = c.ancestro_id
  WHERE s.patrocinador_id IS NOT NULL AND c.nivel < 50
)
INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
SELECT descendiente_id, ancestro_id, nivel FROM cadena;
```

**Commit del bloque 2.**

---

## BLOQUE 3 · TRES CICLOS Y LAS ÓRDENES DE AFILIACIÓN

### Los ciclos

| id | anio | mes | fecha_inicio | fecha_fin | estado |
|---|---|---|---|---|---|
| 1 | 2026 | 6 | 2026-06-01 | 2026-06-30 | `cerrado` |
| 2 | 2026 | 7 | 2026-07-01 | 2026-07-31 | `cerrado` |
| 3 | 2026 | 8 | 2026-08-01 | 2026-08-31 | `abierto` |

`cerrado_en` con fecha, `cerrado_por = 1` en los dos cerrados.

### Una orden de afiliación por socio

Cada socio, salvo el id 1, tiene su orden de compra del pack:

```
   codigo             'ORD-2026-000001' …
   tipo               'afiliacion'
   pack_id            el pack del socio
   ciclo_id           el ciclo donde cae su fecha_afiliacion
   subtotal_cent      pack.precio_cent      ← céntimos enteros, SIEMPRE
   descuento_cent     0
   total_cent         pack.precio_cent
   puntos_total       pack.puntos_rango
   estado             'confirmada'
   canal              'directo'
   punto_entrega_id   1
   aprobada_en        fecha_afiliacion + 1 día
   aprobada_por       1
```

### 🔴 Los puntos del pack NO son los de sus productos

`config.pack_hereda_puntos_producto = false`.

```
   El pack aporta puntos_rango y NADA MÁS.
   EMPRENDEDOR    0 puntos      ← cero, no es un error
   EJECUTIVO     70
   GOLD         150
   FAMILIAR     400
   EMPRESARIAL  800
```

**La orden de afiliación NO lleva `orden_detalle`.** No se desglosa en
productos. Es el pack completo.

### Un voucher por orden

```
   monto_cent        = orden.total_cent      ← tiene que cuadrar exacto
   estado            'aprobado'
   banco             el del socio
   numero_operacion  8 dígitos, único
   fecha_deposito    = fecha_afiliacion
   revisado_por      1
```

**Deja 6 vouchers en `pendiente`** — con sus órdenes en `por_confirmar`, no
`confirmada` — para que la pantalla P23 Bandeja de Confirmación tenga qué
mostrar. Que sean socios generados, no los de la rama de laboratorio.

**Commit del bloque 3.**

---

## BLOQUE 4 · LAS RECOMPRAS

Aquí está lo que alimenta el bono residual.

### Quién recompra

| Ciclo | Socios que recompran |
|---|---|
| junio | 40% de los afiliados hasta esa fecha |
| julio | 55% |
| agosto | 45% |

Que **no sean siempre los mismos** — así se prueba el socio que se activa un
mes y el siguiente no.

### Cómo se calcula el precio de una recompra

**Los precios en `producto.precio_lista_cent` son PÚBLICOS.** El socio paga con
el descuento de su pack, `pack.descuento_recompra_pct`.

```
   precio_lista_cent   = producto.precio_lista_cent      ← el público
   descuento_pct       = pack.descuento_recompra_pct     ← 40 Emprendedor, 50 el resto
   precio_final_cent   = precio_lista_cent × (1 - descuento_pct/100)
   puntos_unitario     = producto.puntos                 ← FIJOS, no se prorratean
   puntos_subtotal     = puntos_unitario × cantidad
```

### 🔴 El descuento NO toca los puntos

`config.puntos_prorratean_con_descuento = false`.

Un café son 18 puntos lo pague quien lo pague.

### Ejemplos calculados a mano — verifícalos con estos números

**Café, producto id 1, precio público 15000 cent, 18 puntos.**

| Comprador | Descuento | `precio_final_cent` | Puntos |
|---|---|---|---|
| Socio GOLD | 50% | **7500** | **18** |
| Socio EMPRENDEDOR | 40% | **9000** | **18** |

**Una orden de recompra de 2 cafés + 1 harina (id 7, 5000 cent, 6 pts) para un GOLD:**

```
   Café       lista 2 × 15000 = 30000   →  final 2 × 7500 = 15000   36 pts
   Harina     lista 1 ×  5000 =  5000   →  final 1 × 2500 =  2500    6 pts
   ──────────────────────────────────────────────────────────────────────
   subtotal_cent   35000    ← a precio de LISTA
   descuento_cent  17500    ← el 50% del pack Gold
   total_cent      17500    ← 35000 - 17500
   puntos_total       42    ← 36 + 6, sin prorratear
```

**Si tu script no da exactamente estos números, está mal el script, no la tabla.**

### La orden de recompra

```
   tipo             'recompra'
   pack_id          NULL          ← es recompra, no pack
   estado           'confirmada'
   canal            'directo'
   aprobada_en / aprobada_por     con valor
```

Con sus filas en `orden_detalle`, de 1 a 4 productos por orden.

### `movimiento_puntos` — un movimiento por orden confirmada

```
   socio_id      el comprador
   ciclo_id      el ciclo de la orden
   orden_id      la orden
   origen        'recompra' o 'afiliacion'
   puntos        orden.puntos_total
   cuenta_activacion   true
   cuenta_residual     true en recompra · FALSE en afiliación
   cuenta_rango        true
```

### 🔴 Los packs de afiliación NO generan residual

Del plan de compensación, sección 4: *"las recompras de la red. Los packs de
afiliación NO generan residual"*.

Por eso `cuenta_residual = false` en los movimientos de origen `afiliacion`.
**Esta bandera es lo que va a leer el motor en la TAREA-04.** Si la pones mal,
el motor va a pagar residual sobre los packs y va a descuadrar todo.

**Commit del bloque 4.**

---

## BLOQUE 5 · ACTIVACIÓN POR CICLO

Una fila en `activacion` por cada socio y cada ciclo:

```
   puntos_personales   = SUMA de movimiento_puntos del socio en ese ciclo
                         donde cuenta_activacion = true
   activo              = (puntos_personales >= 70)
   calculado_en        now()
```

El 70 sale de `config.activacion_puntos_mes`. **Léelo de la tabla, no lo
escribas en el código.**

### Los puntos se resetean cada mes

`config.puntos_reset_mensual = true`. La suma es **por ciclo**, no acumulada.
Un socio con 50 puntos en junio y 40 en julio **no está activo ninguno de los
dos meses**.

### Casos que tienen que existir sí o sí

```
   ✅  Un socio activo los 3 ciclos
   ✅  Un socio activo en junio y julio, inactivo en agosto
   ✅  Un socio inactivo en junio, activo en julio y agosto
   ✅  Un socio con exactamente 70 puntos          ← el borde justo
   ✅  Un socio con 69 puntos                      ← el borde por debajo
   ✅  Un socio sin ninguna recompra en los 3 ciclos
```

**Documéntalos por id en el reporte final.** El motor los va a necesitar.

**Commit del bloque 5.**

---

## BLOQUE 6 · VERIFICACIÓN

**Corre esto y pega la salida literal. Sin resumir.**

### Integridad de archivos

```bash
grep -rlP '\x00' src/ scripts/
npm run build
git status --short
```

### La base

```sql
-- 501 socios, 1 admin, 500 socios
SELECT rol, count(*) FROM socio GROUP BY rol;

-- distribución de packs
SELECT p.codigo, count(*) FROM socio s JOIN pack p ON p.id=s.pack_id GROUP BY 1 ORDER BY 2 DESC;

-- profundidad máxima: tiene que ser >= 12
SELECT max(nivel) FROM red_ancestro;

-- 🔴 ningún Emprendedor con frontales de otro pack. Debe devolver 0 filas
SELECT s.id, s.codigo, p.codigo AS pack_hijo
FROM socio s
JOIN socio pat ON pat.id = s.patrocinador_id
JOIN pack pp ON pp.id = pat.pack_id
JOIN pack p ON p.id = s.pack_id
WHERE pp.solo_afilia_igual = true AND p.codigo <> 'EMPRENDEDOR';

-- 🔴 ninguna orden con dinero que no cuadre. Debe devolver 0 filas
SELECT id, subtotal_cent, descuento_cent, total_cent
FROM orden WHERE total_cent <> subtotal_cent - descuento_cent;

-- 🔴 ningún voucher que no cuadre con su orden. Debe devolver 0 filas
SELECT v.id FROM voucher v JOIN orden o ON o.id=v.orden_id
WHERE v.monto_cent <> o.total_cent;

-- 🔴 ninguna afiliación generando residual. Debe devolver 0 filas
SELECT id FROM movimiento_puntos WHERE origen='afiliacion' AND cuenta_residual = true;

-- la cadena de laboratorio: ¿KARLA (12) tiene 11 ancestros?
SELECT nivel, ancestro_id FROM red_ancestro WHERE descendiente_id=12 ORDER BY nivel;

-- activaciones por ciclo
SELECT ciclo_id, activo, count(*) FROM activacion GROUP BY 1,2 ORDER BY 1,2;

-- los 6 vouchers pendientes para la P23
SELECT count(*) FROM voucher WHERE estado='pendiente';
```

### Pruebas automáticas

`scripts/sembrar-red.test.js` con **números calculados a mano**:

```js
❌  expect(precio).toBe(calcularPrecio(producto, pack))   // no prueba nada
✅  expect(precioFinal(15000, 50)).toBe(7500)             // a mano
✅  expect(precioFinal(15000, 40)).toBe(9000)
✅  expect(puntosDe(1, 2)).toBe(36)                       // 2 cafés
```

Y un Playwright que abra la P23 y vea las 6 órdenes por confirmar, a 390px y en
escritorio.

**Commit del bloque 6.**

---

## LO QUE ENTREGAS

```
   1 · La salida literal de cada comando y de cada consulta SQL de arriba
   2 · Los ids de los 6 casos borde de activación del bloque 5
   3 · El id del socio más profundo y su profundidad
   4 · Cualquier cosa que hayas decidido NO hacer, con el motivo
```

**No declares "verificado". Pega la salida.** Lo que no esté pegado, no pasó.
