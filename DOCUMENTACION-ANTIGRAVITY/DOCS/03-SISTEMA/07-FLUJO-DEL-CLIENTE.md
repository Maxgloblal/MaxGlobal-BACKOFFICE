# FLUJO DEL CLIENTE FINAL

**Estado:** 🟡 definido en un 90% · **Escrito:** 25/08/2026 · **Revisado:** 4/09/2026

> ## LO QUE YA ESTÁ DECIDIDO — no se vuelve a discutir
>
> ```
>    MODELO ELEGIDO   Modelo 2 · cliente sin cuenta
>                     Entró al alcance el 26/08 como agregado nº5
>
>    Precio           DE LISTA, sin descuento
>    Puntos           al socio que lo refirió
>    Sin referido     a la empresa   ← Máximo, respuesta #20, 26/08
>    Packs            un cliente NO puede comprar packs, solo productos
>    Cuenta           no tiene · sus datos viven dentro de la orden
> ```
>
> ## ✅ CERRADO POR JACK EL 4/09 — implementación simplificada
>
> La pregunta 11 (*"¿la venta a clientes activa al socio?"*) **queda decidida y
> NO se le pregunta a Máximo.**
>
> > **Jack, 4/09:** *"nosotros nos ocupamos en generar socios y venderles a tal
> > precio y ellos compran y venden. A quién le vendan ellos no nos interesa.
> > **Si con su venta ellos se activan, genial.**"*
>
> ### Y el modelo de datos se simplificó
>
> Este documento proponía agregar `cliente_nombre`, `cliente_documento` y
> `cliente_telefono` a `orden`. **No hacen falta:** la tabla `envio` ya tiene
> `destinatario`, `telefono`, `departamento`, `provincia`, `distrito`,
> `direccion` y `referencia`. **El cliente vive en el envío**, que es a donde
> va el paquete.
>
> ```
>    Lo único que se agrega:  orden.tipo_venta  'socio' | 'cliente'
>    Lo único que se construye: una casilla en P-21 que pone el
>                               descuento en 0%
> ```
>
> **Todo lo demás ya funciona:** el admin elige el socio de la orden (el que
> refirió, o MG00001 si no hay), y la venta se comporta como una recompra
> normal — activa al socio y sube por sus 10 niveles.
>
> ### 🔴 El detalle que hace falta esta tarea
>
> Todos los packs dan 40-50% de descuento en recompras. **Si no se pone el
> descuento en 0, el sistema guarda S/. 75 cuando el cliente pagó S/. 150** —
> y la contabilidad deja de cuadrar con el banco.

---

## EL HUECO

Todo el sistema está diseñado alrededor del **socio**. Pero falta responder algo
básico:

> **Si una persona quiere comprar café y no le interesa afiliarse, ¿qué pasa?**

Y de ahí salen tres preguntas encadenadas:

1. ¿Puede comprar sin ser socio?
2. ¿A qué precio compra?
3. **¿Sus puntos a quién van?**

La tercera es la importante: en un multinivel, **una venta que no genera puntos
no genera comisiones**, y una venta que sí los genera tiene que decir a nombre
de quién.

---

## LOS TRES MODELOS POSIBLES

### Modelo 1 · No existe el cliente
*Todos los que compran son socios. Para comprar hay que afiliarse.*

| | |
|---|---|
| Precio | Solo precios de socio, con descuento |
| Puntos | Van al comprador, que es socio |
| Complejidad | 🟢 Nula — es lo que ya está diseñado |
| Costo comercial | 🔴 Alto: se pierde toda venta de quien no quiere afiliarse |

---

### Modelo 2 · Cliente sin cuenta *(recomendado)*
*El cliente compra por WhatsApp. El asesor registra la venta a nombre del socio
que lo refirió.*

| | |
|---|---|
| Precio | **Precio de lista**, sin descuento |
| Puntos | Van al **socio que lo refirió** |
| Cuenta en el sistema | No tiene. Solo se guardan sus datos de envío |
| Complejidad | 🟢 Baja — el asesor ya registra a nombre de un socio |

**Cómo funciona:** exactamente igual que una recompra, pero el asesor marca la
orden como *venta a cliente* y escribe los datos de entrega del cliente en vez
de los del socio.

---

### Modelo 3 · Cliente con cuenta
*El cliente se registra, tiene su login y su historial.*

| | |
|---|---|
| Precio | Precio de lista |
| Puntos | Al socio que lo refirió |
| Cuenta | Sí, con acceso limitado |
| Complejidad | 🟡 Media — otra superficie más que construir |

---

## 💰 EL DATO QUE CAMBIA LA CONVERSACIÓN

**La venta a cliente final es mucho más rentable que la recompra de un socio.**

Café — precio de lista S/. 75, 18 puntos:

| Quién compra | Paga | Comisión (97%) | **Queda a la empresa** |
|---|---|---|---|
| Socio Gold *(50% dto)* | S/. 75.00 | S/. 17.46 | **S/. 57.54** |
| Socio Ejecutivo *(40% dto)* | S/. 45.00 | S/. 17.46 | **S/. 27.54** |
| **Cliente final** *(sin dto)* | **S/. 75.00** | S/. 17.46 | **S/. 57.54** |

> Un cliente final deja **casi el triple de margen** que un socio Gold, y paga
> exactamente la misma comisión a la red.
>
> Esto no es un detalle técnico: es un argumento comercial fuerte para Max
> Global. **Conviene que el sistema soporte venta a cliente desde el día 1.**

---

## PREGUNTAS QUE HAY QUE RESOLVER

### 1. 🔴 ¿Los puntos del cliente activan al socio?

Si un socio vende S/. 300 a clientes pero no compra nada él mismo, ¿está activo?

| Opción | Consecuencia |
|---|---|
| **Sí, cuentan para sus 70 puntos** | Premia al que vende de verdad. Es lo sano para el negocio |
| No, solo cuenta su compra personal | Obliga a comprar aunque ya haya vendido — genera stock muerto |

> **Recomendación: que cuenten.** Un plan que obliga a comprar aunque hayas
> vendido empuja a acumular producto sin rotación, y ese es el patrón que
> convierte un MLM en un problema.

### 2. ¿La venta a cliente genera residual a toda la línea?

Lo normal es que sí: se trata igual que una recompra. Los puntos entran al
socio referente y suben por sus 10 niveles.

### 3. ¿El cliente puede convertirse en socio después?

Si se afilia, ¿su historial de compras se le transfiere? ¿Queda colgado del
socio que le vendía?

> **Recomendación:** queda colgado de quien le vendía. Es lo justo y lo que
> evita conflictos entre distribuidores.

### 4. ¿Se guarda el dato del cliente?

Aunque no tenga cuenta, hay que guardar nombre, teléfono y dirección para poder
enviarle. Y sirve para que el socio le dé seguimiento.

### 5. ¿Un cliente puede comprar packs?

**No.** Los packs son de afiliación. Un cliente compra productos sueltos a
precio de lista.

---

## MODELO DE DATOS PROPUESTO

Cambio mínimo sobre lo que ya existe:

```
orden
  + tipo_venta       'afiliacion' | 'recompra' | 'cliente'
  + cliente_nombre        solo si tipo_venta = 'cliente'
  + cliente_documento
  + cliente_telefono

  socio_id  →  en una venta a cliente, es el socio QUE REFIRIÓ
               (a él van los puntos y por él sube el residual)
```

**No hace falta una tabla `cliente`.** El cliente vive dentro de la orden. Si
más adelante se quiere darle cuenta, se agrega la tabla sin romper nada.

### Precio y puntos

| Tipo de venta | Precio | Puntos |
|---|---|---|
| `recompra` | Con el descuento del pack del socio | Según catálogo |
| `cliente` | **Precio de lista, sin descuento** | Los mismos del catálogo |

> ✅ RESUELTO 26/08: los puntos son fijos por producto. *(Texto anterior: si los puntos se calculan sobre lista o
> sobre el precio pagado. Si es sobre lo pagado, **el cliente generaría más
> puntos que el socio por el mismo producto**, lo cual habría que revisar.

---

## FLUJO COMPLETO

```
1. El cliente ve el catálogo en la web
      → precios de LISTA, sin descuento

2. Arma su carrito y pulsa "Pedir por WhatsApp"
      → si llegó por el enlace de un socio, el mensaje
        lleva el código de ese socio

3. El asesor atiende, cotiza el envío y cierra la venta

4. El cliente deposita y manda su voucher

5. El asesor registra:
      · Tipo de venta: CLIENTE
      · Socio que refirió (con confirmación visual)
      · Datos del cliente para el envío
      · Productos, comprobante y costo de envío

6. 🔥 El administrador confirma el pago
      → los puntos se acreditan AL SOCIO REFERENTE
      → suben por sus 10 niveles como residual normal

7. Se despacha a la dirección del cliente
```

**Diferencia con una recompra:** solo dos cosas — el precio es de lista y los
datos de envío son del cliente, no del socio.

---

## PARA PREGUNTARLE A MÁXIMO

> **1.** ¿Puede comprar alguien que no sea socio, o para comprar hay que
> afiliarse sí o sí?
>
> **2.** Si compra un cliente, ¿paga precio de lista completo?
>
> **3.** Esos puntos, ¿se los llevás al socio que lo refirió?
>
> **4.** Si un socio vende S/. 300 a clientes pero no compra nada él,
> ¿está activo ese mes?
>
> **5.** Si un cliente después se afilia, ¿queda debajo del socio que le vendía?

> **La 4 es la más importante.** Define si el plan premia al que vende o al que
> compra.

---

## IMPACTO SI SE APRUEBA

| Documento | Qué cambia |
|---|---|
| `spec 001` web pública | El catálogo público muestra precios de lista |
| `spec 005` panel asesor | Un selector: venta a socio o venta a cliente |
| `spec 002` backoffice | El socio ve sus ventas a clientes |
| `schema.sql` | Campos `tipo_venta` y datos del cliente en `orden` |
| Motor de comisiones | **Sin cambios** — trata la venta igual que una recompra |

**Esfuerzo estimado:** bajo. El asesor ya registra a nombre de un socio; solo
se agrega el tipo de venta y los datos de entrega.

---

## 📌 ESTADO

🔴 **Bloqueado esperando definición del cliente.**

Mientras tanto se deja el campo `tipo_venta` en el modelo de datos, para que
habilitarlo después sea configuración y no reprogramación.
