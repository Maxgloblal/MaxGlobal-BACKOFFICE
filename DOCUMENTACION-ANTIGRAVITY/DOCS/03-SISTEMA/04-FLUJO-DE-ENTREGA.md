# FLUJO DE ENTREGA

**Estado:** ✅ **DECIDIDO — Modelo C, envío por courier**
**Fecha:** 25 de agosto de 2026

---

> ## ✅ DECISIÓN
>
> **Max Global trabaja hoy 100% con envíos.** No hay locales de recojo.
>
> Todo sale de un almacén central y viaja por agencia de transporte hasta la
> dirección del socio.

### Lo que esto resuelve

| Tema | Resultado |
|---|---|
| Control de inventario | **Sigue fuera de alcance, sin contradicción.** No hay stock por local que rastrear |
| Locales y franquicias | No aplican en la v1 |
| Cuarto rol (encargado de local) | No hace falta |
| Complejidad del sistema | 🟡 Media, manejable en el plazo |

### Lo que esto agrega al sistema

| Elemento | Detalle |
|---|---|
| Dirección de entrega | Campo obligatorio en el registro y en cada pedido |
| Costo de envío | Se suma al total. **Nunca genera puntos** |
| Número de guía | Para que el socio siga su pedido |
| Estado de envío | Preparando · enviado · entregado |

---

## LAS TRES DECISIONES QUE FALTAN

### 1. 🔴 ¿Quién paga el envío y cuánto cuesta?

En Perú el costo varía por ciudad y por peso. Cuatro formas de resolverlo:

| Opción | Complejidad | Comentario |
|---|---|---|
| **El asesor lo escribe al registrar** | 🟢 Nula | Máxima flexibilidad, cero programación |
| Tarifa plana nacional | 🟢 Baja | Simple, pero Max Global absorbe la diferencia |
| Por zona (Lima / provincia) | 🟡 Media | Tabla configurable de 2 a 5 zonas |
| Gratis desde cierto monto | 🟡 Media | Incentiva compras grandes |

> **Recomendación para la v1: que el asesor escriba el monto.**
> Él ya está registrando el pedido y ya cotizó el envío con la agencia. Cero
> complejidad ahora, y el campo queda listo para automatizar después.

### 2. 🔴 ¿Los puntos se acreditan al confirmar el pago o al entregar?

Con envíos esto se vuelve más agudo: un paquete puede tardar días en llegar.

> **Recomendación firme: al confirmar el pago.**
>
> El socio ya cumplió su parte. Una demora del courier no es culpa suya, y si
> los puntos dependieran de la entrega, un envío que llega el 2 del mes
> siguiente le haría perder el mes anterior completo — con sus comisiones y su
> rango.
>
> Es además como funciona la mayoría de planes multinivel.

### 3. 🟡 ¿Qué pasa si un producto no está disponible?

Como el sistema no controla stock, esto se maneja en la conversación de
WhatsApp: el asesor sabe qué hay y no registra lo que no puede enviar.

**No requiere programación.** Solo hay que dejarlo escrito como procedimiento.

---

## FLUJO COMPLETO RESULTANTE

```
1. Cliente arma su carrito en la web
2. "Pedir por WhatsApp" → conversación con el asesor
3. El asesor cotiza el envío según la ciudad
4. Cliente deposita el total (productos + envío)
5. El asesor registra: socio, productos, envío, dirección, voucher
6. El ADMIN confirma el pago      → 🔥 se acreditan puntos y se generan comisiones
7. Se despacha y se carga el número de guía
8. Estado pasa a ENVIADO y luego a ENTREGADO
```

**El paso 6 es el que dispara todo.** Los pasos 7 y 8 son informativos: no
afectan puntos ni comisiones.

---

## ANEXO — ANÁLISIS DE LOS OTROS MODELOS

*Se conserva porque Max Global puede abrir locales más adelante. La estructura
de datos queda preparada para eso.*

---

## EL PROBLEMA ORIGINAL

Hasta ahora se mapearon **dos** de los tres flujos que dispara un pedido:

| Flujo | Estado |
|---|---|
| Dinero — cliente deposita, asesor registra, admin confirma | ✅ definido |
| Puntos — se acreditan, el motor calcula, se pagan comisiones | ✅ definido |
| **Producto — de dónde sale, cómo viaja, dónde se recibe** | 🔴 **sin definir** |

**Consecuencia:** el sistema puede cobrar y pagar comisiones por un café que
nadie sabe dónde entregar.

Y no es un detalle operativo: **el modelo de entrega cambia la arquitectura del
sistema**, el alcance del proyecto y probablemente el precio.

---

## LOS CINCO MODELOS POSIBLES

### Modelo A · Punto único
*Todos recogen en la oficina central.*

| | |
|---|---|
| Qué necesita el sistema | Solo marcar el pedido como entregado |
| Complejidad | 🟢 Mínima |
| Impacto en el plazo | Ninguno |
| Limitación | Solo sirve en una ciudad. Mata el crecimiento nacional |

---

### Modelo B · Locales o franquicias por ciudad
*Cada ciudad tiene su local. El socio recoge en el suyo.*

| | |
|---|---|
| Qué necesita el sistema | Catálogo de locales · asignar pedido a local · **stock por local** · marcar entrega · transferencias entre locales |
| Complejidad | 🔴 Alta |
| Impacto en el plazo | **Significativo** |
| Ventaja | Escala a todo el país. Es el modelo típico de franquicia |

> 🔴 **Aquí hay una contradicción de alcance.**
> Saber qué local tiene qué producto **es control de inventario**, y el
> inventario está declarado **fuera de alcance** en la cotización de S/.4,000.
>
> Si el modelo es B, o se amplía el alcance, o el sistema no sabe si hay stock
> y el local lo maneja por su cuenta.

---

### Modelo C · Envío por courier
*Olva, Shalom o similar entrega en la dirección del socio.*

| | |
|---|---|
| Qué necesita el sistema | Dirección de entrega · **costo de envío** · número de guía · estado del envío |
| Complejidad | 🟡 Media |
| Impacto en el plazo | Moderado |
| Ventaja | Cobertura nacional sin locales físicos |

**El detalle que complica:** el costo de envío cambia el monto a depositar, y
varía por ciudad y por peso. Alguien tiene que calcularlo o cotizarlo a mano.

---

### Modelo D · El asesor entrega
*El asesor mantiene stock propio y entrega en persona.*

| | |
|---|---|
| Qué necesita el sistema | **Stock por asesor** · liquidación de mercadería |
| Complejidad | 🔴 Alta |
| Impacto en el plazo | Significativo |
| Riesgo | El asesor se vuelve un intermediario con inventario y cuentas por rendir |

---

### Modelo E · Mixto
*El cliente elige: recoge en local o pide envío.*

| | |
|---|---|
| Qué necesita el sistema | Todo lo de B **más** todo lo de C |
| Complejidad | 🔴 Muy alta |
| Impacto en el plazo | **No entra en 4 semanas** |

---

## COMPARATIVA

| Modelo | Stock | Envío | Locales | Complejidad | ¿Entra en el alcance? |
|---|---|---|---|---|---|
| A · Punto único | — | — | 1 | 🟢 | Sí |
| B · Locales | por local | — | varios | 🔴 | Solo ampliando alcance |
| C · Courier | central | sí | — | 🟡 | Ajustado |
| D · Asesor entrega | por asesor | — | — | 🔴 | Solo ampliando alcance |
| E · Mixto | por local | sí | varios | 🔴 | No en 4 semanas |

---

## PREGUNTAS QUE ESTE FLUJO ABRE

Independientemente del modelo, hay cinco decisiones que el sistema necesita:

### 1. ¿Cuándo se acreditan los puntos: al pagar o al entregar?

Es la pregunta más importante de todas.

| Opción | Consecuencia |
|---|---|
| **Al confirmar el pago** | El socio se activa aunque el producto no haya salido. Si luego no hay stock, ya cobró comisiones sobre un producto no entregado |
| **Al entregar** | Más justo, pero el socio puede quedar inactivo por una demora logística que no es su culpa — y perder su mes |

> La segunda opción es más correcta contablemente, pero genera reclamos si la
> entrega demora cerca del cierre de mes.

### 2. ¿El costo de envío genera puntos?

**No debería.** Si el envío suma puntos, un socio podría activarse pagando
flete en vez de comprando producto. Hay que separarlo explícitamente en la
orden.

### 3. ¿Qué pasa si no hay stock?

¿Se acepta el pedido y queda pendiente? ¿Se rechaza? ¿Se entrega parcial?
Si es parcial, ¿los puntos son proporcionales a lo entregado?

### 4. ¿Quién marca el pedido como entregado?

El administrador, el encargado del local, o el asesor. Define si hace falta
**un cuarto rol**: encargado de local.

### 5. ¿Cuánto tiempo tiene el socio para recoger?

Si nunca recoge, ¿se anula el pedido? ¿Se le devuelven los puntos? ¿Se revierten
las comisiones ya pagadas?

---

## LO QUE HAY QUE PREGUNTARLE A MÁXIMO

En lenguaje de negocio, no técnico:

> **1.** Cuando alguien compra café en Huamanga, en Lima o en Cusco, ¿dónde lo
> recoge exactamente?
>
> **2.** ¿Max Global tiene locales físicos hoy? ¿En qué ciudades?
>
> **3.** ¿Se envía por agencia (Olva, Shalom)? ¿Quién paga el envío?
>
> **4.** ¿Quién tiene los productos guardados? ¿Un solo almacén o cada local
> tiene el suyo?
>
> **5.** Si un socio de una ciudad pide algo que no hay en su local, ¿qué pasa?
>
> **6.** ¿El sistema debe controlar cuánto stock queda, o eso se lleva aparte?

> **La 6 es la que define el precio del proyecto.** Si el sistema debe
> controlar inventario, es alcance adicional que no estaba cotizado.

---

## RECOMENDACIÓN PARA LA VERSIÓN 1

**Empezar por el Modelo A o C, y dejar la estructura preparada para B.**

Concretamente:

1. El modelo de datos incluye desde hoy una tabla `punto_entrega`, aunque al
   inicio tenga un solo registro.
2. La orden guarda a qué punto de entrega va y en qué estado está.
3. El sistema **no controla stock en la versión 1** — solo registra pedidos y
   entregas.
4. Cuando Max Global abra locales, se agregan filas a `punto_entrega` sin tocar
   código.
5. El control de inventario queda documentado como **fase 2, cotizada aparte**.

**Por qué:** deja el camino abierto sin pagar hoy la complejidad de un modelo
que quizá el cliente todavía no tiene resuelto ni en su cabeza.

---

## MODELO DE DATOS — VERSIÓN FINAL

```
envio
  orden_id
  destinatario · telefono
  departamento · provincia · distrito · direccion · referencia
  agencia            (Olva, Shalom, otro)
  costo_cent         ← NO genera puntos
  numero_guia
  estado             (preparando | enviado | entregado)
  fecha_despacho · fecha_entrega

socio
  + direccion de envío por defecto (se precarga en cada pedido)

punto_entrega        ← se crea desde ya, con una sola fila: "Envío a domicilio"
  id · nombre · tipo (courier | oficina | local)
  activo
```

### Reglas duras

| # | Regla |
|---|---|
| 1 | `costo_cent` **nunca** entra en la base de puntos ni de comisiones |
| 2 | El envío se guarda como línea separada en la orden, no mezclado con productos |
| 3 | Los puntos se acreditan al **confirmar el pago**, no al entregar |
| 4 | El estado del envío es informativo: no altera puntos ni comisiones |

> La tabla `punto_entrega` se crea desde hoy aunque tenga una sola fila. El día
> que Max Global abra un local en Huamanga, se agrega una fila y el sistema ya
> lo soporta. Cuesta cero ahora y ahorra una reestructuración después.

---

## IMPACTO EN LO YA DOCUMENTADO

| Documento | Qué cambia |
|---|---|
| `spec 001` web pública | El carrito debe preguntar dónde recibe |
| `spec 002` backoffice | El socio debe ver el estado de su entrega |
| `spec 003` panel admin | Marcar entregas · gestionar puntos de entrega |
| `spec 005` panel asesor | El asesor elige el punto de entrega al registrar |
| `schema.sql` | Tabla `punto_entrega` y campos de entrega en `orden` |
| Alcance y cronograma | Inventario sigue fuera. Hay que dejarlo por escrito |

---

## 📌 ESTADO

✅ **Modelo definido: envío por courier.** Se puede programar.

**Quedan por confirmar con Max Global:**

1. ¿Con qué agencia trabajan? (Olva, Shalom, otra)
2. ¿El envío lo cotiza el asesor caso por caso, o hay tarifa fija?
3. ¿El envío lo paga el socio o lo asume Max Global?

Ninguna de las tres bloquea el desarrollo — el campo de costo queda editable y
la agencia es un texto libre.
