# LÍNEA DE ALCANCE — VERSIÓN 1

**Qué se construye por los S/. 4,000 y qué no.**

**Fecha:** 26 de agosto de 2026
**Decisión:** Jack

---

> ## POR QUÉ EXISTE ESTE DOCUMENTO
>
> Las respuestas de Máximo destaparon funcionalidades que no estaban en la
> cotización. Algunas son **indispensables para que su empresa opere**; otras son
> deseos legítimos pero de otro tamaño.
>
> **Este documento traza la línea una sola vez**, para no discutirla en medio del
> desarrollo. Lo que está debajo de la línea se construye. Lo que está arriba,
> se cotiza aparte.

---

# PARTE 1 · LO QUE SE CONSTRUYE

## A · Lo cotizado originalmente

| # | Módulo |
|---|---|
| 1 | Landing comercial en `maxglobaloficial.com` |
| 2 | Catálogo público con carrito y pedido por WhatsApp |
| 3 | Motor de comisiones — los 4 bonos completos |
| 4 | Backoffice del socio — red, comisiones, rango, tienda de recompra |
| 5 | Panel de administración — pedidos, pagos, cierre de mes |
| 6 | Red simulada de prueba para verificar el motor |

## B · Las seis cosas que se agregan sin costo adicional

*Porque sin ellas la empresa no puede operar, y porque son chicas.*

### 1 · Bono del Kit Emprendedor — 41.7% al nivel 1

**Por qué entra:** no es una funcionalidad nueva, es una **regla del plan de
compensación** que apareció tarde. Si no está, el sistema calcula mal.

**Tamaño:** una fila en una tabla y una condición en el motor.

### 2 · Solicitud de retiro con aprobación

**Por qué entra:** el sistema calcula comisiones. Si el socio no puede pedirlas y
Máximo no puede aprobarlas, el módulo queda a medias.

**Qué incluye:** el socio solicita desde su backoffice · mínimo de S/. 100 ·
Máximo aprueba o rechaza · queda el registro.

**Tamaño:** una pantalla en cada lado y un estado.

### 3 · Cálculo de detracción sobre S/. 700

**Por qué entra:** Máximo lo pidió explícitamente y es una obligación tributaria
suya. Sin el cálculo, tendría que hacerlo a mano en cada pago.

**Qué incluye:** cuando una comisión supera S/. 700, el sistema muestra el monto
de la detracción y el neto a pagar.

**Lo que NO incluye:** emitir la factura electrónica. **Eso es SUNAT y sigue
fuera de alcance**, tal como se acordó en la cotización.

**Tamaño:** un cálculo y dos campos en la pantalla de pago.

### 4 · Baja de socio con reenganche de red

**Por qué entra:** la gente se retira. Si el sistema no sabe qué hacer con su
equipo, la red se corrompe y las comisiones empiezan a fallar.

**Qué incluye:** dar de baja · su descendencia se engancha al patrocinador ·
vista previa de a quién afecta antes de ejecutar · queda registro de la
estructura anterior.

**Tamaño:** mediano. Es la operación más delicada del sistema y se hace con
cuidado.

### 5 · Venta a cliente final — versión simple

**Por qué entra:** Máximo confirmó que existen clientes que no son socios, y esa
venta deja **casi el triple de margen** que la de un socio. Dejarla fuera sería
dejar dinero en la mesa.

**Qué incluye:** el administrador registra una venta a nombre de un cliente ·
si vino por el enlace de un socio, se le atribuye · si no vino por nadie, queda
como cliente directo de la empresa.

**Lo que NO incluye:** cuentas de cliente, historial de cliente, ni un portal
para clientes.

**Tamaño:** una casilla en la pantalla de registro de pedido.

### 6 · El mínimo legal obligatorio

**Por qué entra:** sin esto el sitio **no puede estar publicado en Perú**. No es
opcional.

| Qué | Norma |
|---|---|
| Libro de Reclamaciones virtual | Ley 32495 |
| Política de privacidad y consentimiento de datos | D.S. 016-2024-JUS |
| Términos y condiciones de uso | Ley 29571 |
| Razón social, RUC y domicilio en el pie de página | Ley 29571 |

**Lo que NO incluye:** los **términos de afiliación** —el contrato entre Max
Global y sus socios— deben ser redactados por un abogado peruano. El sistema deja
la pantalla lista para pegar el texto que él entregue.

---

# PARTE 2 · LO QUE NO ENTRA

## 🔴 Tienda replicada por socio

**Máximo la pidió.** Es la única del listado que se rechaza de plano.

### Qué pidió

Que cada socio tenga su propia tienda virtual con su nombre.

### Por qué no entra

**No es "una pantalla más".** Implica:

```
   · Una ruta o subdominio por cada socio
   · Personalización y foto por socio
   · Contenido duplicado en cientos de páginas idénticas
       → Google penaliza esto y hunde el posicionamiento del sitio principal
   · Soporte multiplicado: cada socio que dice "mi tienda no carga"
   · Certificados y DNS por subdominio si se hace bien
```

**Es un proyecto del tamaño de la landing completa, o más.**

### Lo que sí resuelve el mismo problema

El objetivo real de Máximo es que **la venta se le atribuya al socio correcto**.
Eso ya está construido y sin ninguno de los problemas de arriba:

```
   maxglobaloficial.com/?ref=MG-00417

   · El socio comparte su enlace
   · Todo lo que entre por ahí queda a su nombre
   · Lo ve en su backoffice en tiempo real
```

**Un enlace hace el 90% del trabajo con el 0% del costo.**

### Queda abierto como Fase 2

Si más adelante la red crece y el reclamo persiste, se cotiza aparte. **No se
cierra la puerta, se pone en orden.**

## Lo demás que queda fuera

| Qué | Por qué |
|---|---|
| **Cambio de patrocinador** | Él dijo *"solo en caso extremo"*. Se hace a mano cuando pase. Automatizarlo es riesgoso y se usaría dos veces al año |
| **Rangos 9 al 16** | No tienen valores definidos. La tabla queda abierta: cuando los defina, se agregan filas desde el panel. **Cero programación** |
| **Bono Cumpleaños** | Él mismo pidió manejarlo aparte: *"de preferencia manejarlo de manera interna en otro Excel"* |
| **Bono de Viajes** | Igual. Manual, fuera del sistema |
| **Facturación electrónica SUNAT** | Ya estaba fuera en la cotización. Requiere un proveedor autorizado |
| **Control de inventario** | Ya estaba fuera. No hay locales, el almacén es uno solo |
| **Aplicación móvil** | Ya estaba fuera. La web es responsive |
| **Pasarela de pago automática** | Ya estaba fuera. Los pagos van por transferencia y voucher |
| **Avisos automáticos por correo o WhatsApp** | Él respondió *"no, por ahora no"* |

---

# PARTE 3 · CÓMO PLANTEARLO

## El principio

**No se cobra más.** Se entregan las seis cosas de la Parte 1B como parte del
trabajo, porque sin ellas su empresa no opera y porque son chicas.

**Lo que sí se hace es dejar por escrito qué entra**, para que dentro de tres
semanas no aparezca una séptima.

## Mensaje para mandarle — copiar tal cual

```
Máximo, revisé todas tus respuestas y ya tengo el plan
completo. Todo cuadra.

Aparecieron algunas cosas que no estaban en la cotización
original y las voy a incluir igual, porque sin ellas el
sistema no te sirve completo:

· El bono del 41.7% del Kit Emprendedor
· Las solicitudes de retiro con tu aprobación
· El cálculo de la detracción en comisiones sobre 700
· Dar de baja a un socio y que su equipo se reenganche
· Registrar ventas a clientes que no son socios
· Los textos legales obligatorios (Libro de Reclamaciones,
  privacidad, términos)

Sin costo adicional. Van dentro de los S/. 4,000.

Sobre lo de la tienda virtual para cada socio: eso sí es
otro proyecto, es casi tan grande como toda la web. Pero
lo que buscas ya lo vas a tener resuelto — cada socio va a
tener su enlace propio, y todo lo que entre por ahí queda
automáticamente a su nombre y lo ve en su backoffice.

Si más adelante la red crece y quieres la tienda con el
nombre de cada uno, lo vemos aparte.

Lo único que me falta de ti para cerrar:
1. Banco, número de cuenta completo, CCI y titular
   (me pasaste 0198789899 pero necesito el resto)
2. Razón social exacta, RUC y domicilio fiscal
3. Misión, visión y valores, si ya los tienen escritos

Con eso arranco.
```

## Por qué este mensaje funciona

**Da antes de negar.** Las seis cosas que se incluyen van primero. Cuando llega
el "no" de la tienda, ya recibió seis "sí".

**No dice que la tienda es imposible.** Dice que es otro proyecto y que lo que él
quiere lograr ya lo va a tener.

**Cierra pidiendo tres datos.** Termina con una acción concreta de su lado, no
con una discusión abierta.

---

# PARTE 4 · SI IGUAL INSISTE CON LA TIENDA

*Guion corto, por si vuelve sobre el tema.*

> *"Máximo, lo que quieres es que cada socio pueda vender y que la venta le
> quede a él. Eso lo vas a tener desde el día uno con su enlace — es lo mismo que
> usan las marcas grandes de venta directa.*
>
> *La tienda con el nombre de cada socio suena mejor pero trae un problema real:
> Google castiga tener cientos de páginas iguales, y eso te hunde el
> posicionamiento de la página principal, que es la que trae gente nueva.*
>
> *Arranquemos con los enlaces. Si en seis meses los socios lo piden, lo armamos
> bien y aparte."*

**El argumento del posicionamiento es cierto y es el que más pesa** — no es una
excusa técnica, es un riesgo comercial para él.

---

# RESUMEN EN UNA TABLA

| | Entra en v1 | Queda fuera |
|---|---|---|
| **Cotizado** | Landing · motor · backoffice · panel admin · red de prueba | — |
| **Agregado sin costo** | Bono del Kit · retiros · detracción · baja de socio · cliente final · mínimo legal | — |
| **Rechazado** | — | Tienda replicada por socio |
| **Diferido** | — | Cambio de patrocinador · rangos 9–16 · Cumpleaños · Viajes |
| **Ya estaba fuera** | — | SUNAT · inventario · app · pasarela · avisos automáticos |

---

**Decidido el 26 de agosto de 2026.**

*Esta es la línea. Lo que aparezca después se anota, se cotiza y se ve en la
Fase 2.*
