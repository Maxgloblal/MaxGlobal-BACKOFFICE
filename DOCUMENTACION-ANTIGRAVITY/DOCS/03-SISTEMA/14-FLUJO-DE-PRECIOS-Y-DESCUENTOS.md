# FLUJO DE PRECIOS Y DESCUENTOS

**Cómo llega cada persona a pagar el precio que le corresponde.**

**Fecha:** 27 de agosto de 2026

---

> ## POR QUÉ EXISTE ESTE DOCUMENTO
>
> El modelo tenía bien definido **cuánto** paga cada quien. Lo que no estaba
> documentado es **cómo llega a ese precio en la práctica**: quién aplica el
> descuento, en qué momento y qué ve el socio en pantalla.
>
> Ese hueco produjo un error real en la web: las tarjetas de producto muestran
> *"Precio Socio (50%)"* a todos, cuando el Kit Emprendedor recompra al 40%.

---

# 1 · LA REGLA BASE

**Hay un solo precio guardado: el público.** Todo lo demás se calcula.

```
   precio_socio  =  precio_publico  ×  (1 − descuento_recompra_pct / 100)
```

| Plan | `descuento_recompra_pct` |
|---|---|
| Kit Emprendedor | **40%** |
| Ejecutivo | 50% |
| Gold | 50% |
| Familiar | 50% |
| Empresarial | 50% |
| **Cliente final** *(no socio)* | **0% — paga precio público** |

## La tabla completa

| Producto | Público | Socio 50% | Kit 40% | Puntos |
|---|---|---|---|---|
| Café con Moringa | S/. 150 | S/. 75 | S/. 90 | 18 |
| Colágeno | S/. 150 | S/. 75 | S/. 90 | 18 |
| Aceite de Moringa | S/. 120 | S/. 60 | S/. 72 | 14 |
| Esplendor | S/. 120 | S/. 60 | S/. 72 | 14 |
| Aceite de Orégano | S/. 60 | S/. 30 | S/. 36 | 8 |
| Cápsulas de Moringa | S/. 60 | S/. 30 | S/. 36 | 8 |
| Harina de Moringa | S/. 50 | S/. 25 | S/. 30 | 6 |
| Perfume Dalba | S/. 70 | S/. 35 | S/. 42 | 10 |

## 🔴 Los puntos NO cambian con el descuento

```
   El café da 18 puntos lo pague quien lo pague:
   S/. 150 · S/. 90 · S/. 75  →  siempre 18 puntos
```

**Consecuencia:** el mismo pedido activa igual a un Kit que a un Gold, aunque
paguen distinto.

---

# 2 · QUIÉN APLICA EL DESCUENTO — Y CUÁNDO

**Esta es la parte que faltaba definir.**

## En la versión 1 — lo cotizado

**No hay login de socio.** La web es pública y no sabe quién la está mirando.

```
   1.  El socio arma su pedido en la web
       Ve PRECIOS PÚBLICOS — el sitio no sabe quién es

   2.  Pulsa "Pedir por WhatsApp"
       Se abre WhatsApp con la lista escrita + su código de socio

   3.  🔴 EL ADMINISTRADOR aplica el descuento
       Busca el código, ve su pack, cotiza al precio que le toca

   4.  Le pasa el total real más el flete

   5.  El socio deposita y manda el voucher

   6.  El admin registra el pedido y CONFIRMA EL PAGO
       Recién ahí nacen los puntos y las comisiones
```

> **El descuento es una operación del administrador, no de la web.** Eso está
> dentro de lo cotizado y es lo que le da a Max Global control total sobre el
> momento en que se genera dinero.

## En la Fase 2 — el backoffice

Cuando el socio tenga cuenta, la tienda de su backoffice **ya le muestra su
precio**, calculado con el `descuento_recompra_pct` de su pack. Sin intermediarios.

**El flujo de arriba no desaparece:** sigue existiendo para clientes finales y
para socios que prefieran WhatsApp.

---

# 3 · QUÉ VE CADA QUIEN EN LA WEB PÚBLICA

## El problema que hay que corregir

Hoy cada tarjeta muestra:

```
   Público:              S/. 150
   Precio Socio (50%):   S/. 75     ← ❌ el 50% está fijo en el código
```

**Un Kit Emprendedor lee S/. 75 y termina pagando S/. 90.**

Eso es información inexacta y, si alguien reclama, cae bajo el Código del
Consumidor (Ley 29571): *"información veraz y suficiente sobre productos y
precios"*.

## Cómo debe quedar

**La web pública no sabe qué pack tiene el visitante.** Entonces no puede
mostrar "su" precio. Lo honesto y lo que además vende mejor:

```
   S/. 150
   Los socios pagan desde S/. 75      ← "desde" es exacto: 50% es el mejor caso
   [ 18 puntos ]
```

**Por qué "desde":** es verdad para todos los packs. El Gold paga exactamente
S/. 75; el Kit paga S/. 90, que sigue siendo "desde S/. 75" hacia arriba.

**Y funciona como argumento de venta:** el visitante ve que afiliarse le parte el
precio a la mitad.

### Alternativa si se quiere ser más explícito

```
   S/. 150   público
   S/.  75   socio Ejecutivo, Gold, Familiar o Empresarial
   S/.  90   socio Kit Emprendedor
```

Más honesto todavía, pero recarga la tarjeta. **Recomendación: usar "desde".**

---

# 4 · EL CARRITO Y EL MENSAJE DE WHATSAPP

## El problema

Hoy cada tarjeta manda su propio mensaje de un producto. Quien quiera cinco
productos manda cinco WhatsApps.

**El alcance original decía otra cosa:** *"el cliente arma su pedido en la web y
le llega a ustedes con todo escrito"*.

## Cómo debe funcionar

Un carrito **sin backend** — solo estado en el navegador. No hay pago en línea,
así que no hace falta nada más.

```
   El visitante agrega productos
            ↓
   Un contador flotante muestra cuántos lleva
            ↓
   Pulsa "Pedir por WhatsApp"
            ↓
   Se abre WhatsApp con TODO el pedido escrito
```

## El mensaje — formato exacto

```
Hola, quiero hacer este pedido:

• 2× Café con Moringa ......... S/. 300
• 1× Colágeno Hidrolizado ..... S/. 150
• 2× Cápsulas de Moringa ...... S/. 120

Total a precio público: S/. 570
Puntos: 70

Mi código de socio: MG-00417
```

### 🔴 Las tres cosas que el mensaje tiene que llevar

**1 · Decir "a precio público" explícitamente.**
Si dice solo "Total: S/. 570" y luego le cobran S/. 285, el socio se confunde. Y
si es al revés —espera S/. 285 y le cobran S/. 342 porque es Kit— reclama.

**2 · Pedir el código de socio.**
Sin él, el administrador no sabe qué descuento aplicar. Debe salir precargado si
la persona entró por un enlace `?ref=`, y ser editable si no.

**3 · Incluir los puntos.**
Le sirve al socio para saber si llega a sus 70 de activación, y al admin para
verificar.

## La línea que cierra el mensaje

Debajo del carrito, un texto fijo:

> *Los precios mostrados son de venta al público. Si eres socio, tu asesor
> aplicará el descuento que corresponde a tu pack al confirmar el pedido.*

**Eso resuelve la ambigüedad de una vez** y protege ante un reclamo.

---

# 5 · RECORRIDO COMPLETO CON NÚMEROS

*El mismo pedido, hecho por tres personas distintas.*

**El pedido:** 2 cafés · 1 colágeno · 2 cápsulas de moringa

| | Público | Socio 50% | Kit 40% |
|---|---|---|---|
| 2× Café | S/. 300 | S/. 150 | S/. 180 |
| 1× Colágeno | S/. 150 | S/. 75 | S/. 90 |
| 2× Cápsulas | S/. 120 | S/. 60 | S/. 72 |
| **Total** | **S/. 570** | **S/. 285** | **S/. 342** |
| **Puntos** | **70** | **70** | **70** |

## Qué pasa después, si lo compró un socio Gold

```
   Paga                              S/. 285
   Suma a sus puntos personales           70   →  queda ACTIVO este mes
   Suma al volumen grupal de su línea     70

   Se dispara el Bono Residual sobre 70 puntos:

      Nivel 1   40%   S/. 28.00
      Nivel 2   20%   S/. 14.00
      Nivel 3   10%   S/.  7.00
      Nivel 4    5%   S/.  3.50
      Nivel 5    3%   S/.  2.10
      Nivel 6    2%   S/.  1.40
      Nivel 7    1%   S/.  0.70
      Nivel 8   10%   S/.  7.00
      Nivel 9    5%   S/.  3.50
      Nivel 10   1%   S/.  0.70
                      ─────────
      Total a la red  S/. 67.90   (97%)

   Max Global recibió    S/. 285.00
   Pagó en comisiones    S/.  67.90
   ─────────────────────────────────
   Le queda              S/. 217.10   (76%)
```

## Si lo compró un cliente final

```
   Paga                  S/. 570.00
   Pagó en comisiones    S/.  67.90   ← el mismo monto, los puntos no cambian
   ─────────────────────────────────
   Le queda              S/. 502.10   (88%)
```

> **El cliente final deja mucho más margen.** Por eso vale la pena registrar esas
> ventas, y por eso está en el alcance de la v1 aunque sea en versión simple.

## Si lo compró un Kit Emprendedor

```
   Paga                  S/. 342.00
   Pagó en comisiones    S/.  67.90
   ─────────────────────────────────
   Le queda              S/. 274.10   (80%)
```

---

# 6 · RESUMEN DE DECISIONES

| # | Decisión | Estado |
|---|---|---|
| 1 | Se guarda el precio público; el de socio se calcula | ✅ ya implementado |
| 2 | En la v1 el descuento lo aplica **el administrador**, no la web | ✅ es lo cotizado |
| 3 | La web pública muestra *"Los socios pagan desde S/. X"* | 🔧 **corregir** — hoy dice 50% fijo |
| 4 | Carrito local que arma un solo mensaje de WhatsApp | 🔧 **falta construir** |
| 5 | El mensaje incluye código de socio, puntos y "precio público" | 🔧 **falta** |
| 6 | En Fase 2 el backoffice muestra el precio real del socio | ⚪ Fase 2 |

---

# 7 · REQUISITOS FUNCIONALES QUE ESTO GENERA

| RF | Requisito |
|---|---|
| RF-511 | La tarjeta de producto **debe** mostrar el precio público y la leyenda *"Los socios pagan desde S/. X"*, calculada con el mejor descuento vigente |
| RF-512 | La tarjeta **no debe** afirmar un porcentaje de descuento fijo, porque varía según el pack |
| RF-513 | El sitio **debe** permitir armar un pedido de varios productos antes de contactar |
| RF-514 | El mensaje de WhatsApp **debe** incluir la lista completa, el total a precio público, los puntos y el código de socio |
| RF-515 | El mensaje **debe** indicar explícitamente que el total es a precio público |
| RF-516 | El código de socio **debe** precargarse desde `?ref=` y ser editable |
| RF-517 | El carrito **debe** vivir solo en el navegador, sin backend |
| RF-518 | El administrador **debe** aplicar el `descuento_recompra_pct` del pack **del socio**, no el del operador |

*(El RF-518 ya existía como RF-313 en el panel de administración.)*

---

**Documentado el 27 de agosto de 2026.**
