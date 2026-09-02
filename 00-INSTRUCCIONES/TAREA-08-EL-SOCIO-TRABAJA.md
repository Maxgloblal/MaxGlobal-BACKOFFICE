# TAREA-08 · EL SOCIO TRABAJA — tanda 4

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Depende de:** TAREA-07 ✅

**Pantallas:** P-12 mi red · P-13 tienda de recompra · P-16 mi enlace ·
P-17 mis pedidos · P-18 mi perfil

> **La tanda 3 le dio al socio lo que ya ganó. Esta le da las herramientas para
> ganar más.** La tienda y el enlace de referido son con lo que vende.

**Lee `AGENTS.md` antes de explorar nada.**

---

## 🔴 REGLA DE REPORTE

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea NO está terminada.**

> **Van tres corrupciones en 24 horas** — 12, 13 y 14 — y las tres reportadas
> como salida vacía. En la última se cortaron 107 líneas de `P15MiRango.jsx` que
> contenían dos de los tres mensajes que acababas de escribir.
>
> **Escribe los archivos largos por partes y commitea después de cada bloque.**

---

# 🔴 UNA REGLA QUE NO SE PUEDE INVENTAR EN NINGUNA DE LAS CINCO

**Ninguna función nueva se crea sin control de quién la llama.**

```
   ¿Puede escribir o borrar datos?
      → valida fn_current_socio_id() o fn_is_admin()
      → REVOKE EXECUTE ... FROM anon, public
   ¿Es una utilidad de pruebas?
      → NO va a la base. Punto.
```

**Ayer una función de limpieza sin control podía borrar todos los socios reales
y estaba abierta a cualquiera sin sesión.** No se repite.

---

# BLOQUE 1 · P-13 · TIENDA DE RECOMPRA

**Se hace primero: es la pantalla con la que el socio se activa cada mes.**

| # | Requisito |
|---|---|
| RF-230 | Los 8 productos con el descuento **del pack del socio** ya aplicado |
| RF-231 | Precio de lista tachado y precio final |
| RF-232 | El puntaje de cada producto |
| RF-233 | El carrito muestra el total en **soles y en puntos**, siempre |
| RF-234 | El avance hacia los 70 puntos de activación |
| RF-235 | Avisar cuando el carrito alcance los 70 puntos |
| RF-236 | Al confirmar, abrir WhatsApp con el pedido precargado |
| RF-237 | El mensaje incluye productos, cantidades, total, código y nombre |
| RF-238 | 🔴 El socio **NO** registra el pedido ni sube comprobantes |
| RF-239 | Los puntos **NO** se acreditan hasta que el admin confirme el pago |

## 🔴 RF-238 · Esta tienda no vende. Arma un mensaje.

**Es lo más contraintuitivo de todo el backoffice.**

```
   ❌  el socio confirma y se crea una orden en la base
   ❌  el socio sube su voucher
   ✅  el socio arma el carrito y se abre WhatsApp con el pedido escrito
   ✅  el ADMINISTRADOR lo registra en la P-21 y confirma el pago
```

**Ni una fila en `orden` sale de esta pantalla.** Todo pasa por el
administrador. Es la decisión de negocio de la v1 y no se discute aquí.

## RF-230 · El descuento es el del pack del socio

```
   Un GOLD ve el café a S/. 75    (50% de 150)
   Un EMPRENDEDOR lo ve a S/. 90  (40% de 150)
   Los dos ven "18 puntos"        ← los puntos NO cambian
```

**Se lee de `pack.descuento_recompra_pct` del socio en sesión.** Nunca escrito
a mano.

## 🔴 RF-234 y RF-235 · El avance a los 70 puntos

**Es la razón por la que el socio entra a esta pantalla.** Sin 70 puntos no
cobra nada ese mes.

```
   ┌────────────────────────────────────────────────┐
   │  Llevas 48 de 70 puntos este mes               │
   │  ████████████████░░░░░░░                       │
   │  En el carrito: 22 puntos  →  llegarías a 70 ✅ │
   └────────────────────────────────────────────────┘
```

Y cuando el carrito lo lleve al umbral, **díselo con claridad**: *"Con este
pedido quedas activo este mes"*.

**Los puntos que ya lleva salen de `activacion.puntos_personales` del ciclo
abierto.**

## RF-236 y RF-237 · El mensaje de WhatsApp

**Mira cómo lo hace la landing antes de inventar el formato** — está en
`SITIO WEB 06 PAGINAS LANDINGS/src/`. Deben ser coherentes.

El mensaje lleva: productos con cantidad, total en soles, total en puntos, y
**el código y el nombre del socio**, que es lo que permite al administrador
saber a quién registrarle el pedido.

**Commit.**

---

# BLOQUE 2 · P-16 · MI ENLACE DE PATROCINIO

| # | Requisito |
|---|---|
| RF-260 | Mostrar el enlace personal |
| RF-261 | Copiarse con un toque |
| RF-262 | Compartir directo por WhatsApp |
| RF-263 | 🔴 Un Kit Emprendedor ve la advertencia de que solo afilia Kit |
| RF-264 | Cuántos afiliados directos lleva |

## El enlace ya existe en la landing

```
   https://<dominio>/registro?ref=MG00002
```

**Usa el mismo formato.** Compruébalo en la landing antes de escribirlo.

## 🔴 RF-263 · La advertencia del Kit

`pack.solo_afilia_igual = true` solo en EMPRENDEDOR.

```
   Un Kit Emprendedor SOLO puede afiliar a otro Kit Emprendedor.
```

**Si no se lo dices aquí, va a invitar a alguien para un Gold y el registro se
lo va a rechazar.** El socio queda mal delante de su invitado.

Muéstralo como un aviso claro, no como letra pequeña. Y dile cómo se quita la
limitación: mejorando de pack en su perfil.

**Commit.**

---

# BLOQUE 3 · P-12 · MI RED

**Ya existe como maqueta con datos falsos.** Se conecta, no se rehace.

| # | Requisito |
|---|---|
| RF-220 | El árbol muestra hasta 10 niveles de descendencia |
| RF-221 | Cada nodo: nombre, código, pack, estado y puntos del ciclo |
| RF-222 | Distinguir visualmente los frontales del resto |
| RF-223 | El árbol se pliega y despliega por rama |
| RF-224 | 🔴 En celular se navega **por niveles**, sin scroll horizontal |

## 🔴 RF-224 · El árbol en un celular

**Un árbol genealógico de 10 niveles no cabe en 390px.** No lo intentes.

```
   ❌  el mismo árbol con scroll horizontal
   ✅  navegación por niveles: se ve un nivel, se toca un socio
       y se baja al siguiente, con una miga de pan para volver
```

## RLS ya te protege, pero no te confíes

Un socio **solo ve a sus descendientes** — la política ya está probada. Pero la
pantalla no debe pedir lo que no puede ver: si consultas toda la tabla `socio`,
te va a devolver solo los tuyos y el árbol saldrá incompleto sin avisar.

**Consulta desde `red_ancestro` con tu propio id como ancestro.**

## Cuidado con el peso

ANA tiene cientos de descendientes. **No cargues los 10 niveles de golpe.**
Carga un nivel y baja bajo demanda.

**Commit.**

---

# BLOQUE 4 · P-17 · MIS PEDIDOS

| # | Requisito |
|---|---|
| RF-270 | Historial de pedidos con su estado |
| RF-271 | Detalle: productos, montos y puntos |
| RF-272 | Estado del envío y número de guía |
| RF-273 | 🔴 El motivo cuando un pago fue rechazado |
| RF-274 | El socio **NO** puede editar ni anular un pedido |

## RF-273 · El motivo del rechazo

Está en `voucher.motivo_rechazo`. **Si un pago se rechazó y el socio no sabe por
qué, llama por teléfono.** Esa es exactamente la llamada que esta pantalla
evita.

## Los estados, en lenguaje de persona

```
   por_confirmar  →  "Esperando confirmación del pago"
   confirmada     →  "Pago confirmado"
   rechazada      →  "Pago rechazado" + el motivo
```

**Commit.**

---

# BLOQUE 5 · P-18 · MI PERFIL

| # | Requisito |
|---|---|
| RF-280 | Editar datos personales y de contacto |
| RF-281 | Editar la dirección de envío por defecto |
| RF-282 | Registrar sus datos bancarios para el cobro |
| RF-283 | Cambiar su contraseña |
| RF-284 | Ver su pack actual y solicitar mejora |
| RF-285 | 🔴 La mejora genera un pedido por el **pack completo** |
| RF-286 | 🔴 El socio **NO** puede cambiar su patrocinador |

## 🔴 RF-283 · La contraseña la cambia Supabase

```
   ✅  supabase.auth.updateUser({ password })
   ❌  escribir en socio.password_hash — es una columna MUERTA
```

## 🔴 RF-285 · El upgrade paga el pack completo

**Confirmado por Máximo, respuesta 13.3.** `config.upgrade_paga_pack_completo = true`.

```
   Un Ejecutivo (S/. 360) que sube a Gold (S/. 1,200)
   paga S/. 1,200, NO la diferencia de S/. 840.
```

**Díselo en pantalla antes de que lo solicite.** Un socio que cree que paga la
diferencia y recibe un cobro del total, reclama.

Y la solicitud **no cambia el pack**: genera un pedido que el administrador
registra y confirma. El pack cambia cuando el pago está confirmado.

## 🔴 RF-286 · El patrocinador no se toca

**Cambiar un patrocinador reescribe la red genealógica entera y las comisiones
ya pagadas dejan de tener sentido.** El campo ni siquiera se muestra como
editable.

## RF-282 · Los datos bancarios

`socio.banco` y `socio.cuenta_bancaria`. Son los que usa la P-19 para el
retiro. **Si están vacíos, la P-19 no debería dejar solicitar.**

**Commit.**

---

# BLOQUE 6 · PRUEBAS

```
   AISLAMIENTO — con sesión real
   ☐  🔴 ANA solo ve SUS pedidos, ninguno ajeno
   ☐  🔴 ANA solo ve a SUS descendientes en el árbol
   ☐  🔴 ANA no puede editar el perfil de otro socio
   ☐  🔴 ANA no puede cambiar su patrocinador ni por la API

   P-13 · LA TIENDA
   ☐  un GOLD ve el café a 7500 cent · un EMPRENDEDOR a 9000
   ☐  los dos ven 18 puntos
   ☐  el carrito suma soles y puntos por separado
   ☐  con 48 puntos previos + 22 en el carrito → avisa que llega a 70
   ☐  🔴 confirmar NO crea ninguna fila en orden
   ☐  el mensaje de WhatsApp lleva código y nombre del socio

   P-16 · EL ENLACE
   ☐  el enlace lleva ?ref= con el código del socio
   ☐  un EMPRENDEDOR ve la advertencia del Kit
   ☐  un GOLD NO la ve

   P-17 · PEDIDOS
   ☐  un pago rechazado muestra su motivo
   ☐  no hay forma de editar ni anular

   P-18 · PERFIL
   ☐  cambiar contraseña usa supabase.auth, no password_hash
   ☐  la mejora de pack avisa que se paga COMPLETO
   ☐  solicitar mejora NO cambia el pack todavía
   ☐  el patrocinador no aparece como editable
```

**Playwright a 390px y escritorio.** Y en la P-12, comprobar que **no hay scroll
horizontal** en móvil.

**Commit.**

---

# BLOQUE 7 · VERIFICAR

```sql
-- 🔴 0 filas: la tienda no puede haber creado órdenes
SELECT id FROM orden WHERE creada_en > '2026-09-02' AND canal = 'socio';

-- 🔴 0 filas: nadie cambió de patrocinador
SELECT s.id FROM socio s JOIN red_ancestro r
  ON r.descendiente_id = s.id AND r.nivel = 1
WHERE r.ancestro_id <> s.patrocinador_id;

-- 🔴 0 filas: ninguna función nueva con anon y sin control
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef
  AND array_to_string(p.proacl,' ') LIKE '%anon=X%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%fn_is_admin%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%fn_current_socio_id%';

-- 🔴 0 filas: ninguna función de pruebas desplegada
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname LIKE '%test%';

-- la red no cambió de tamaño
SELECT (SELECT count(*) FROM socio) socios,       -- 501
       (SELECT count(*) FROM orden) ordenes,      -- 1048
       (SELECT count(*) FROM comision) comisiones,-- 2418
       (SELECT max(id) FROM socio) max_socio;     -- 501
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ El motor de comisiones      terminado
   ❌ La red simulada             NO resembrar. 501 socios, ni uno más
   ❌ El libro comision           SOLO-AGREGAR
   ❌ wallet_movimiento           se llena en el cierre, tanda 5
   ❌ socio.password_hash         columna muerta
   ❌ P-20 · P-25 · P-26 · P-27 · P-28 · P-29    son la tanda 5
```

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 5 consultas del bloque 7
   2 · La salida de vitest y playwright
   3 · Una captura de la P-13 mostrando el avance a los 70 puntos
   4 · Una captura de la P-12 en móvil, sin scroll horizontal
   5 · git status --short vacío, pegado literal
```
