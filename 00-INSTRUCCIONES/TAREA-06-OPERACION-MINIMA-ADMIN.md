# TAREA-06 · OPERACIÓN MÍNIMA DEL ADMIN — tanda 2

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Depende de:** TAREA-05 ✅ (autenticación y sesión)

**Pantallas:** P-21 registrar pedido · P-22 registrar afiliación ·
P-23 bandeja de confirmación · P-24 envíos

> **Con esta tanda Máximo ya puede operar el negocio.** Registrar lo que le
> compran, confirmar los pagos, disparar las comisiones y despachar. Todo lo
> demás del sistema es visibilidad; esto es la operación.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Y al terminar, siempre:

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea NO está terminada.**

> En las últimas cinco tareas reportaste esa salida vacía cuando no lo estaba.
> La última vez había **214 líneas borradas** y `App.jsx`, `ArmazonSocio.jsx` y
> `motor/tipos.ts` estaban cortados a media palabra. **Pega lo que devuelve el
> comando, no lo que esperas que devuelva.**

---

# LO QUE YA EXISTE Y NO SE REESCRIBE

```
   src/motor/patrocinio.ts    calcularPatrocinio(orden, upline, escala, ...)
   src/motor/residual.ts      calcularResidual(...)
   src/motor/persistencia.js  procesarComisionesCiclo({ cicloId, ... })
   src/auth/SesionContext     socio, esAdmin, entrar, salir
   src/piezas/                8 piezas · src/estilos/tokens.css
```

**El motor está terminado y verificado.** Esta tarea lo **usa**, no lo cambia.

## 🔴 Pero falta una pieza: calcular UNA orden

`procesarComisionesCiclo` trabaja sobre un ciclo entero. La P-23 necesita
calcular **una sola orden**, dos veces:

```
   1 · en seco, para MOSTRAR qué va a pasar   (RF-344, RF-345)
   2 · de verdad, al confirmar                 (RF-348)
```

**Crea `procesarComisionesDeUnaOrden({ orden, upline, ... })`** en
`src/motor/persistencia.js`, reutilizando `calcularPatrocinio` y
`calcularResidual` tal como están.

```
   ❌  duplicar la lógica de cálculo
   ✅  envolver las funciones puras que ya existen
```

**La misma función sirve para la vista previa y para el guardado.** Si son dos
caminos distintos, un día mostrarán cosas distintas.

---

# BLOQUE 1 · P-23 · BANDEJA DE CONFIRMACIÓN

**Se hace primero porque es la pantalla crítica del sistema.**

Ya existe como maqueta en `src/paginas/P23BandejaConfirmacion.jsx`, con datos
falsos. **Se conecta a datos reales.**

## Lo que pide

| # | Requisito |
|---|---|
| RF-340 | Listar pedidos pendientes, ordenados por antigüedad |
| RF-341 | Mostrar comprobante, socio, tipo, monto esperado y declarado |
| RF-342 | **Destacar visiblemente cuando los montos no coincidan** |
| RF-343 | El comprobante debe poder ampliarse para leerlo |
| RF-344 | 🔴 Antes de confirmar, mostrar **qué va a ocurrir** |
| RF-345 | Qué socio se activa, qué puntos se acreditan, cuántas comisiones y el total |
| RF-346 | La confirmación debe ser explícita, no un clic simple |
| RF-347 | 🔴 **Impedir la doble confirmación** |
| RF-348 | Al confirmar: orden a `pagada` y se dispara el motor |
| RF-349 | Al confirmar una afiliación, el socio pasa a `activo` |
| RF-350 | Al rechazar, el motivo es obligatorio |
| RF-351 | Un rechazado puede volver a `por_confirmar` con otro comprobante |
| RF-352 | Registrar quién confirmó y cuándo |

## 🔴 RF-347 · LA DOBLE CONFIRMACIÓN — el riesgo más grave del sistema

**Un doble clic generaría las comisiones de una línea entera dos veces.** Y como
`comision` es un libro de solo-agregar, corregirlo obliga a asientos inversos
por diez niveles.

```
   ❌  deshabilitar el botón en pantalla
       — no sirve: dos pestañas, o el botón "atrás", lo saltan

   ✅  que la BASE lo impida
```

**La protección real es un UPDATE condicional:**

```sql
UPDATE orden
   SET estado = 'pagada', aprobada_en = now(), aprobada_por = :adminId
 WHERE id = :ordenId
   AND estado = 'por_confirmar';   -- ← esta línea es la protección
```

**Si devuelve 0 filas afectadas, alguien ya la confirmó: se aborta y no se
calcula nada.** Solo si devuelve 1 se insertan las comisiones.

**Y todo dentro de una transacción.** Si falla el cálculo, la orden no puede
quedar en `pagada` sin sus comisiones.

## 🔴 RF-344 y RF-345 · Mostrar el impacto antes de confirmar

**Esto es lo que separa un sistema serio de un formulario.** Antes de que el
administrador confirme, tiene que ver exactamente qué va a provocar:

```
   ┌──────────────────────────────────────────────────┐
   │  AL CONFIRMAR ESTE PAGO:                         │
   │                                                  │
   │  • ANA QUISPE (MG00002) pasará a ACTIVO          │
   │  • Se acreditarán 150 puntos                     │
   │  • Se generarán 7 comisiones                     │
   │  • Se pagará un total de S/. 369.60              │
   │                                                  │
   │  Esta acción es irreversible.                    │
   │            [ Cancelar ]  [ Sí, confirmar el pago ]│
   └──────────────────────────────────────────────────┘
```

Esos números salen de `procesarComisionesDeUnaOrden` **en seco**, sin guardar
nada.

## RF-342 · El descuadre de montos

Si `voucher.monto_cent <> orden.total_cent`, **no se bloquea la confirmación**
—puede haber una razón— pero se destaca en rojo con la diferencia exacta.

**Commit.**

---

# BLOQUE 2 · P-21 · REGISTRAR PEDIDO

## 🔴 RF-311 y RF-312 · Confirmar visualmente al socio

**El código del socio decide quién cobra las comisiones de toda una línea.** Un
código mal tecleado manda el dinero a otra persona, y las comisiones son
inmutables.

```
   Se busca por código, nombre o documento          (RF-310)
   Se muestra: nombre, pack, estado y patrocinador  (RF-311)
   NO se puede guardar sin que el operador confirme
   que ese es el socio correcto                     (RF-312)
```

**No basta con que el nombre aparezca en pantalla.** Tiene que haber un paso
explícito de confirmación.

## 🔴 RF-313 · El descuento es el del pack DEL SOCIO

No el del administrador que registra.

```
   precio_lista_cent   producto.precio_lista_cent      ← precio PÚBLICO
   descuento_pct       pack DEL SOCIO.descuento_recompra_pct
                       40% Emprendedor · 50% los demás
   precio_final_cent   round(lista × (1 − pct/100))
   puntos_unitario     producto.puntos                 ← FIJOS
```

**Los puntos no se prorratean con el descuento.** Un café son 18 puntos lo
pague quien lo pague.

## Los importes se derivan sumando los detalles

```
   subtotal_cent  = Σ (precio_lista_cent × cantidad)
   total_cent     = Σ (precio_final_cent × cantidad)
   descuento_cent = subtotal_cent − total_cent      ← una RESTA
```

**Nunca un porcentaje aplicado por segunda vez.** Ese fue el bug de la orden 575.

## RF-317 · El envío va aparte y no genera puntos

`config.envio_genera_puntos = false`. El costo de envío **no entra** en
`orden_detalle` ni suma puntos. Va en la tabla `envio`.

## Lo demás

```
   RF-314   mostrar el puntaje acumulado mientras se arma el pedido
   RF-315   exigir comprobante: foto, banco, número de operación, monto y fecha
   RF-316   capturar dirección, agencia y costo de envío
   RF-318   advertir si el monto declarado no coincide con el esperado
   RF-319   el pedido queda en estado 'por_confirmar'
   RF-320   registrar quién lo creó
```

**Commit.**

---

# BLOQUE 3 · P-22 · REGISTRAR AFILIACIÓN

```
   RF-330   crear un socio nuevo con todos sus datos
   RF-331   🔴 confirmar visualmente al patrocinador, igual que RF-311
   RF-332   🔴 aplicar la restricción del Kit Emprendedor
   RF-333   validar unicidad de correo y documento
   RF-334   el socio nuevo queda en estado 'pendiente'
   RF-335   generar y mostrar el código de socio asignado
```

## 🔴 RF-332 · La restricción del Kit

`pack.solo_afilia_igual = true` solo en EMPRENDEDOR.

```
   Si el PATROCINADOR tiene Kit Emprendedor,
   el socio nuevo SOLO puede ser Kit Emprendedor.
```

**Se valida antes de guardar, con un mensaje claro.** No se deja elegir un pack
imposible y luego fallar.

## RF-334 · Queda pendiente, no activo

Un socio nuevo **no está activo hasta que se confirme el pago de su pack** en la
P-23. Ahí pasa a `activo` (RF-349).

## 🔴 Y el usuario de autenticación

Como se vio en la TAREA-05, **un socio sin usuario en `auth.users` no puede
entrar y RLS no le devuelve nada.**

```
   Al crear el socio hay que crear también su usuario de Supabase,
   con el MISMO correo, y mandarle el enlace para que ponga su
   contraseña.
```

**Si esto no se hace, el socio queda creado pero incapaz de entrar jamás.**

**Commit.**

---

# BLOQUE 4 · P-24 · ENVÍOS

```
   RF-360   listar pedidos pagados pendientes de despacho
   RF-361   marcar como despachado
   RF-362   al despachar, capturar agencia y número de guía
   RF-363   marcar como entregado
   RF-364   registrar una incidencia con su motivo
   RF-365   🔴 ningún estado de envío altera puntos ni comisiones
   RF-366   imprimir la etiqueta con los datos del destinatario
```

## 🔴 RF-365 · El envío no toca el dinero

**Los puntos se acreditan al confirmar el PAGO, no al entregar.**
`config.puntos_se_acreditan_en = 'pago'`.

```
   Un pedido puede perderse en la agencia y las comisiones
   ya están pagadas. Es así a propósito.
```

**Commit.**

---

# BLOQUE 5 · PRUEBAS

## Las que no pueden faltar

```
   P-23 · LO CRÍTICO
   ☐  🔴 confirmar dos veces la misma orden genera comisiones UNA vez
   ☐  🔴 el segundo intento devuelve 0 filas y no calcula nada
   ☐  la vista previa muestra los mismos números que luego se guardan
   ☐  si el cálculo falla, la orden NO queda en 'pagada'
   ☐  confirmar una afiliación deja al socio en 'activo'
   ☐  rechazar sin motivo no se permite
   ☐  un rechazado puede volver a 'por_confirmar'
   ☐  se registra quién confirmó y cuándo

   P-21 · EL DINERO
   ☐  café a un GOLD:        precio_final 7500 · 18 puntos
   ☐  café a un EMPRENDEDOR: precio_final 9000 · 18 puntos
   ☐  descuento_cent = subtotal − total, siempre
   ☐  el envío no suma puntos
   ☐  no se puede guardar sin confirmar al socio

   P-22 · LA RESTRICCIÓN
   ☐  un patrocinador Emprendedor NO puede afiliar un Gold
   ☐  correo duplicado se rechaza
   ☐  documento duplicado se rechaza
   ☐  el socio nuevo queda 'pendiente'
   ☐  se crea su usuario en auth.users

   P-24
   ☐  despachar no cambia puntos ni comisiones
   ☐  marcar entregado no cambia puntos ni comisiones
```

**Con números calculados a mano.** Y Playwright a 390px y escritorio.

**Commit.**

---

# BLOQUE 6 · VERIFICAR CONTRA LA BASE

```sql
-- 🔴 0 filas: ninguna orden con comisiones duplicadas
SELECT orden_id, tipo, nivel, count(*)
FROM comision WHERE orden_id IS NOT NULL
GROUP BY 1,2,3 HAVING count(*) > 1;

-- 🔴 0 filas: ninguna orden pagada sin sus comisiones
SELECT o.id FROM orden o
WHERE o.estado='pagada' AND o.tipo='afiliacion'
AND NOT EXISTS (SELECT 1 FROM comision c WHERE c.orden_id=o.id);

-- 🔴 0 filas: aritmética del cabezal
SELECT id FROM orden WHERE total_cent <> subtotal_cent - descuento_cent;

-- 🔴 0 filas: el cabezal contra sus detalles
SELECT o.id FROM orden o JOIN orden_detalle d ON d.orden_id=o.id
GROUP BY o.id, o.total_cent, o.subtotal_cent, o.puntos_total
HAVING o.total_cent    <> sum(d.precio_final_cent*d.cantidad)
    OR o.subtotal_cent <> sum(d.precio_lista_cent*d.cantidad)
    OR o.puntos_total  <> sum(d.puntos_subtotal);

-- 🔴 0 filas: el descuento aplicado no es el del pack del socio
SELECT d.id FROM orden_detalle d
JOIN orden o ON o.id=d.orden_id JOIN socio s ON s.id=o.socio_id
JOIN pack p ON p.id=s.pack_id
WHERE o.tipo='recompra' AND d.descuento_pct <> p.descuento_recompra_pct;

-- 🔴 0 filas: socios sin usuario de autenticación creados por P-22
SELECT s.id FROM socio s
WHERE s.creado_en > '2026-09-02'
AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = s.email);
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones   se USA, no se modifica
   ❌ La red simulada          NO resembrar
   ❌ Las 47 políticas RLS     están bien
   ❌ P-11 · P-12 · P-14       siguen con datos falsos: son la tanda 3
   ❌ P-25 cierre de ciclo     es la tanda 5, la operación más delicada
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 6 consultas del bloque 6
   2 · La salida completa de vitest y de playwright
   3 · Cómo protegiste la doble confirmación, con el código
   4 · git status --short vacío, pegado literal
   5 · Lo que decidiste no hacer, y por qué
```
