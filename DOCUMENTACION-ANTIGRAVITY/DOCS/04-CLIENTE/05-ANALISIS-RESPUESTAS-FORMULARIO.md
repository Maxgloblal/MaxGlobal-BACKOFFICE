# ANÁLISIS DE LAS RESPUESTAS DEL FORMULARIO

**Fecha:** 26 de agosto de 2026
**Fuente:** formulario de 40 preguntas + 6 mensajes de WhatsApp del 26/08, 10:23–10:31

---

> ## QUÉ ENCONTRÉ
>
> Máximo respondió las 40 preguntas. **La mayoría confirma lo que ya teníamos.**
> Pero hay **cuatro cosas que cambian el modelo** y una que estaba mal en nuestra
> documentación.
>
> Este documento las separa: lo que confirma, lo que corrige y lo que agrega.

---

# PARTE 1 · EL HALLAZGO MÁS IMPORTANTE

## Nuestra lista de precios YA tiene el 50% de descuento aplicado

Durante todo el proyecto tratamos la `Lista_Precios_Recompra` como el precio
público. **No lo es. Es lo que ya paga el socio.**

### Cómo lo sé — tres pruebas independientes

**Prueba 1 · Él lo dijo explícitamente**

> *"40% del costo final, ejemplo café se vende a 150, con descuento de 40% sería
> 90 soles dentro del pack."*

Café público = **S/. 150**. Nuestro catálogo dice S/. 75. Exactamente la mitad.

**Prueba 2 · El Pack Ejecutivo cuadra al céntimo**

```
   Pack Ejecutivo = S/. 360, incluye 4 productos
   Café dentro del pack (40% dto sobre 150) = S/. 90

   4 × S/. 90 = S/. 360   ← EXACTO
```

**Prueba 3 · El Esplendor del Pack Empresarial**

Un documento antiguo mencionaba *"Esplendor a 52 soles"*, y nunca cuadró con
nuestro precio de S/. 60. Ahora sí:

```
   Esplendor público      S/. 120
   Descuento Empresarial   56.6%   (él lo confirmó en la 13.2)
   ───────────────────────────────
   S/. 120 × 0.434 =      S/. 52.08   ← el número del documento
```

Y S/. 120 es exactamente el doble de los S/. 60 de nuestro catálogo.

### Y esto resuelve el misterio del 4.167

Ese número que nos hizo perder una semana no era el valor del punto. Es esto:

```
   Precio del socio ÷ Puntos
   S/. 75 ÷ 18 = 4.167
```

**Era simplemente el precio de recompra dividido entre los puntos.** Nada más.

## La tabla de precios corregida

| Producto | **Precio público** | Socio (50%) | Kit Emprendedor (40%) | Puntos |
|---|---|---|---|---|
| Café | S/. 150 | S/. 75 | S/. 90 | 18 |
| Colágeno | S/. 150 | S/. 75 | S/. 90 | 18 |
| Aceite de Moringa | S/. 120 | S/. 60 | S/. 72 | 14 |
| Esplendor | S/. 120 | S/. 60 | S/. 72 | 14 |
| Aceite de Orégano | S/. 60 | S/. 30 | S/. 36 | 8 |
| Cápsulas de Moringa | S/. 60 | S/. 30 | S/. 36 | 8 |
| Harina de Moringa | S/. 50 | S/. 25 | S/. 30 | 6 |
| Perfume Dalba | S/. 70 | S/. 35 | S/. 42 | 10 |

**Regla del sistema:** en la base de datos se guarda el **precio público**. El
precio del socio se calcula aplicando su `descuento_recompra_pct`.

### 🔴 El error que esto evitó

Si hubiéramos aplicado 50% sobre los S/. 75 del catálogo:

```
   MAL                              BIEN
   Socio paga      S/. 37.50        Socio paga      S/. 75.00
   Residual paga   S/. 17.46        Residual paga   S/. 17.46
   ───────────────────────────      ───────────────────────────
   Queda           S/. 20.04        Queda           S/. 57.54
                   (53%)                            (77%)
```

**La empresa habría cobrado la mitad de lo debido en cada recompra.**

### 📌 Lo único que conviene verificar

La landing va a mostrar precios públicos (S/. 150 el café). Vale la pena que
Máximo confirme que ese es el precio al que quiere que se anuncie públicamente,
porque hoy es probable que la gente lo vea a S/. 75.

**No bloquea nada.** El sistema guarda el precio público como campo editable.

---

# PARTE 2 · LO QUE CORRIGE NUESTRA DOCUMENTACIÓN

## 🔴 Corrección 1 · El Kit Emprendedor tiene su propio bono

**Esto no estaba en el modelo.** Es una regla nueva.

> *"Lo que genera comisión directa del emprendedor es el 41.7%, se le paga al
> [patrocinador] de ese kit. Eso no te pase, amigo, considéralo."*
>
> *"Ejemplo: por afiliar a un Kit Emprendedor yo gano el 41.7%, que sería 50
> soles por cada kit de 120 soles."*

**Verificación:** S/. 120 × 41.7% = S/. 50.04 ≈ **S/. 50** ✅

### Cómo queda el Kit Emprendedor

| Concepto | Valor |
|---|---|
| Precio | S/. 120 |
| Puntos de rango | **0** — él lo confirmó: *"no tiene puntajes"* |
| Niveles de residual | 0 |
| **Bono al patrocinador** | **41.7% = S/. 50, solo al nivel 1** |
| A quién puede afiliar | Solo a otro Kit Emprendedor |
| Descuento de recompra | 40% |

### Por qué solo al nivel 1

Él lo describe siempre en singular: *"se le paga al patrocinador"*, *"yo gano el
41.7%"*. Y la economía lo confirma:

```
   Solo nivel 1:      120 − 50        = S/. 70 para producto y margen  ✅
   Nivel 1 + escala:  120 − 50 − 37   = S/. 33                          ❌ muy justo
```

**Decisión: 41.7% al nivel 1, sin escala de 7 niveles.** El Kit Emprendedor
tiene su propia tabla de comisión, separada del Bono de Patrocinio normal.

> **Nota:** yo tenía el Kit Emprendedor con 0 comisiones. Su mensaje —
> *"eso no te pase, amigo"* — corrigió justo eso. Buen catch de su parte.

## 🔴 Corrección 2 · Si un líder BAJA de rango, no cobra NADA

**Esto estaba mal en el Documento Maestro y es dinero real.**

> *"Si el líder llega a un rango tiene que mantenerse o ascender para cobrar. Si
> baja de rango ya no cobra."*

### Lo que yo había documentado (INCORRECTO)

```
   Un Oro que en abril hace 900 puntos
   → cobra el bono de Bronce (S/. 100)     ❌ MAL
```

### Lo correcto

```
   Un Oro que en abril hace 900 puntos
   → NO COBRA NADA ese mes                 ✅ BIEN
   → conserva el título de Oro como honorífico
```

**La regla completa:**

| Situación en el mes | ¿Cobra? |
|---|---|
| Mantiene su rango | ✅ Cobra ese rango |
| Asciende de rango | ✅ Cobra el rango nuevo |
| **Baja de rango** | ❌ **No cobra nada** |
| No se activa (70 pts) | ❌ No cobra nada |

**Es más duro de lo que parecía**, y es la regla que hace que el plan sea
sostenible con un residual del 97%.

## 🔴 Corrección 3 · Los puntos grupales NO incluyen los personales

**Pregunta 8.2 — respuesta: "No, solo los de mi red."**

Nuestro modelo sumaba ambos. Hay que separarlos:

```
   Puntos personales   →  solo para la activación (70 puntos)
   Puntos grupales     →  solo de la red, para el rango
```

Un líder que compra S/. 4,000 de producto él mismo **no sube de rango con eso**.
Tiene que venderlo a través de su red.

## 🔴 Corrección 4 · Los puntos del producto desaparecen dentro del pack

> *"Los puntos del café solo son válidos en recompra. En el pack desaparecen, y
> el pack tiene otro punto."*

**Confirmado y era lo que teníamos**, pero ahora está explícito:

| Compra | Puntos que genera |
|---|---|
| Recompra de café | 18 puntos (del producto) |
| Café dentro de un Pack Gold | 0 — el pack da sus 150 puntos y ya |

**Un pack nunca suma los puntos de sus productos.** Da su `puntos_rango` y nada
más.

---

# PARTE 3 · LO QUE AGREGA

## Bono Global — completamente definido

| Detalle | Respuesta |
|---|---|
| Conversión del punto | **S/. 1.00** |
| Cortes | **Enero–Junio** y **Julio–Diciembre** |
| Reparto | **Proporcional al puntaje** de cada uno |
| Requisito | **Activo durante los 6 meses**, no solo el mes del reparto |

> El requisito de estar activo los 6 meses completos es más exigente de lo que
> asumíamos. **Endurece bastante el filtro** — hay que mostrarlo claramente en el
> backoffice para que nadie reclame.

## Ciclo, pagos y retiros

| Detalle | Respuesta |
|---|---|
| Cierre del mes | **Último día del mes** |
| Pago de comisiones | **3 días después del cierre** |
| Monto mínimo de retiro | **S/. 100** |
| Solicitud de retiro | El socio la pide, **Máximo aprueba** |

### ⚖️ Requisito fiscal nuevo

> *"Emitir factura de comisiones con descuento de detracciones, facturas mayores
> de 700 soles."*

El sistema debe:
- Generar el comprobante de la comisión
- Aplicar la **detracción** cuando el monto supere **S/. 700**
- Mostrar el neto a pagar después de la detracción

**Esto no estaba en la cotización.** Está anotado en la lista de alcance
adicional.

## Reglas de red

| Pregunta | Respuesta |
|---|---|
| ¿Puede cambiar de patrocinador? | **Sí**, con autorización, *"solo en caso extremo"* |
| ¿Qué pasa si alguien se da de baja? | **Su equipo sube un nivel** y se engancha a su patrocinador |
| ¿Puede tener dos cuentas? | **No** |
| ¿Existen clientes que no son socios? | **Sí** |

### ⚠️ La baja de un socio es la operación más delicada del sistema

Cuando alguien se da de baja, **toda su descendencia se reengancha a su
patrocinador**. Eso significa recalcular la tabla de ancestros de cientos de
personas de golpe, y cambia quién cobra qué en los niveles siguientes.

**Requisitos que esto genera:**
- Vista previa de a quién afecta antes de ejecutar
- La operación completa dentro de una transacción
- Registro de la estructura anterior, por si hay que revertir
- **Prohibido** hacerlo con un ciclo abierto sin cerrar

### Clientes finales

> *"Los clientes que no han sido contactados por nadie pasan a ser clientes
> directos de la empresa."*

Esto **reabre el flujo de cliente** que habíamos diferido. Queda así:

| Cliente | Se asigna a |
|---|---|
| Llegó por el enlace de un socio | Ese socio — sus compras le generan puntos |
| Llegó sin referido | **La empresa** — no genera comisión a nadie |

## Packs Familiar y Empresarial — ya definidos

**Familiar (S/. 4,000):** el socio arma libremente su pedido hasta completar el
monto, a precio de recompra.

**Empresarial (S/. 8,000):**
- Gotas Esplendor al **56.6%** de descuento
- Todo lo demás al **55%**
- Café: **máximo 70 unidades**, el resto libre

**Upgrade de pack:** *"compra el pack completo de nuevo"*. No se paga solo la
diferencia.

## Bono Cumpleaños — definido pero fuera del sistema

> *"Después de su activación con 70 pts en adelante puede escoger al 70%, 4
> productos de descuento."*
>
> *"Esto de preferencia manejarlo de manera interna en otro Excel."*

| Detalle | Valor |
|---|---|
| Qué es | 4 productos al 70% de descuento |
| Requisito | Haber comprado sus 70 puntos del mes |
| ¿Genera puntos o comisión? | **No.** Es un regalo |
| ¿Va en el sistema? | **No.** Máximo lo maneja aparte |

**Bono Viajes:** igual, manual y fuera del sistema.

## Vouchers y operación

| Detalle | Respuesta |
|---|---|
| Quién aprueba vouchers | **Juan Máximo Auccapuma Rojas** y **Melody Nashira Auccapuma Areche** |
| Si se rechaza un voucher | Se anula el pedido y el socio vuelve a empezar |
| Avisos automáticos | **No por ahora** |
| Cuenta bancaria | `0198789899` — 📌 **falta banco, CCI y titular** |

---

# PARTE 4 · LO QUE CONFIRMA (sin cambios)

*Todo esto ya estaba bien documentado. Sus respuestas lo ratifican.*

| # | Regla | Estado |
|---|---|---|
| 1 | Descuento de recompra: Emprendedor 40%, resto 50% | ✅ Ya estaba |
| 2 | El descuento no varía por producto | ✅ Ya estaba |
| 3 | Los puntos del producto son fijos, no bajan con el descuento | ✅ Ya estaba |
| 4 | Todo se resetea cada mes, incluidos los puntos de pack | ✅ Ya estaba |
| 5 | Todos los packs cubren la activación del primer mes | ✅ Ya estaba |
| 6 | Bono de rango mensual, no apilable | ✅ Ya estaba |
| 7 | Jade: 1 frontal activo | ✅ **Nuestra decisión era correcta** |
| 8 | Platino: S/. 1,500 | ✅ **Nuestra decisión era correcta** |
| 9 | Rangos 9–16 configurables desde el panel | ✅ Ya estaba |
| 10 | Frontal activo = directo con sus 70 puntos | ✅ Ya estaba |
| 11 | Línea estirada: máximo 50% desde una línea | ✅ Ya estaba |
| 12 | Rango honorífico si no califica | ✅ Ya estaba |
| 13 | Alcance de la cotización | ✅ Confirmado |

> **Las dos decisiones que tomamos por criterio — Jade y Platino — resultaron
> correctas.** El criterio de "el deck es más reciente y es lo que se le muestra
> al socio" funcionó.

---

# PARTE 5 · ALCANCE ADICIONAL DETECTADO

> 💼 **Para Jack.** Esto no es para Máximo todavía. Es la lista de lo que
> apareció después de cotizar.

| # | Qué es | Origen |
|---|---|---|
| 1 | **Facturas de comisión con detracción** (>S/. 700) | Respuesta 12.4 |
| 2 | **Solicitudes de retiro** con aprobación | Respuesta 12.4 |
| 3 | **Baja de socio con reenganche de red** | Respuesta 14.2 |
| 4 | **Cambio de patrocinador** con autorización | Respuesta 14.1 |
| 5 | **Flujo de cliente final** (con y sin referido) | Respuesta 14.4 |
| 6 | **Bono especial del Kit Emprendedor** (41.7%) | WhatsApp 10:29 |
| 7 | ~50 requisitos legales | Investigación propia |
| 8 | 8 rangos sin definir (9 al 16) | Deck comercial |

### ⚠️ El punto que hay que aclarar con él

En la pregunta 16 escribió:

> *"Pero dentro de lo que conversamos está la tienda virtual de cada usuario."*

**Esa frase puede significar dos cosas muy distintas:**

| Interpretación | Trabajo |
|---|---|
| Su enlace de referido `?ref=` | ✅ Ya está en el alcance |
| Una tienda propia personalizada por socio | ❌ Es un proyecto aparte |

**Jack: tú sabes qué se conversó.** Si es lo primero, no hay nada que hacer. Si
es lo segundo, conviene aclararlo ahora y no cuando esté a medio construir.

---

# PARTE 6 · PENDIENTES REALES QUE QUEDAN

| # | Qué falta | Bloquea | Quién |
|---|---|---|---|
| 1 | Banco, CCI y titular de la cuenta `0198789899` | Pantalla de pago | Máximo |
| 2 | Razón social, RUC, domicilio fiscal | Pie de página legal | Máximo |
| 3 | Textos de misión, visión y valores | Página Nosotros | Máximo |
| 4 | Qué significa "tienda virtual de cada usuario" | Alcance | **Jack** |
| 5 | Cómo plantear el alcance adicional | Comercial | **Jack** |

**Ninguno bloquea el motor de comisiones ni la landing.**

---

**Documento cerrado el 26 de agosto de 2026.**

*El plan de compensación está completo. Lo que queda son datos administrativos y
dos conversaciones comerciales.*
