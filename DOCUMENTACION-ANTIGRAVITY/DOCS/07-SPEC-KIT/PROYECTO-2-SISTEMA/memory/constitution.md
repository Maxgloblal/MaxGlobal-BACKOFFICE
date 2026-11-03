# CONSTITUCIÓN DEL PROYECTO — SISTEMA MAX GLOBAL

**Versión:** 1.0.0 · **Ratificada:** 25 de agosto de 2026
**Ámbito:** todo el sistema — motor de comisiones, backoffice, panel admin y web pública

---

## PREÁMBULO

Este sistema calcula y paga dinero real a personas reales que dependen de esos
ingresos. La propuesta firmada compromete **"un sistema libre de fallas
matemáticas de cálculo"** y código auditable línea por línea.

Los principios de este documento son **no negociables**. Cualquier agente de IA
o desarrollador que trabaje en el código debe cumplirlos. Cuando un principio
entre en conflicto con la velocidad de entrega, **gana el principio**.

---

## ARTÍCULO I — LA ESPECIFICACIÓN ES LA LEY

**I.1** Ninguna regla del plan de compensación se inventa, se deduce ni se
completa con lo que es habitual en la industria multinivel. Si no está escrita
en la especificación, **el trabajo se detiene y se pregunta**.

**I.2** Cuando el código y la especificación no coincidan, el que está
equivocado es el código.

**I.3** Si la especificación está mal, se corrige la especificación **primero**
y el código después. Nunca al revés.

**I.4** Todo hueco de definición se marca en el código con un comentario
visible que indique qué falta y qué se asumió provisionalmente.

> **Fundamento:** un porcentaje inventado se convierte en dinero transferido a
> una persona real. Recuperarlo después es imposible. Es preferible un sistema
> incompleto a uno que paga mal.

---

## ARTÍCULO II — INTEGRIDAD DEL DINERO

**II.1** Todo monto se almacena en **céntimos, como entero**.
`S/. 37.50` se guarda como `3750`.

**II.2** Queda **prohibido** el uso de `float`, `double`, `real` o cualquier
tipo de coma flotante para representar dinero o puntos.

**II.3** El redondeo es a 2 decimales, redondeo estándar, y el residuo queda a
favor de la empresa. Esta regla se aplica en un único lugar del código.

**II.4** La base de cálculo del bono residual es **el puntaje del producto
valorado a S/. 1.00 por punto**. El valor `4.167` es la razón precio/punto y
sirve únicamente para reportes de volumen.

> ⚠️ **Cambiar II.4 hace que el sistema pague más de lo que factura.** Ese valor
> vive en configuración precisamente para que ningún cambio accidental lo toque.
> Toda modificación ahí exige revisión explícita.

---

## ARTÍCULO III — INMUTABILIDAD Y AUDITORÍA

**III.1** Los registros de puntos y de comisiones son **append-only**. Solo se
insertan. Nunca se editan ni se borran.

**III.2** Un error se corrige mediante **asiento inverso**, jamás con `UPDATE`
ni `DELETE`.

**III.3** Toda comisión guarda el rastro completo de su cálculo: quién cobra,
quién generó el volumen, sobre qué base, qué porcentaje y de qué nivel.

**III.4** Toda acción sensible queda registrada en auditoría con su autor y su
marca de tiempo: aprobación de vouchers, cambios de configuración, cierres de
ciclo.

> **Fundamento:** cuando un socio pregunte *"¿por qué me pagaron esto?"*, el
> sistema debe poder responder con el desglose exacto. Un `UPDATE` destruye esa
> capacidad para siempre.

---

## ARTÍCULO IV — CONFIGURACIÓN SOBRE CÓDIGO

**IV.1** Ningún porcentaje, umbral, precio, monto ni fecha se escribe en el
código fuente.

**IV.2** Toda regla ajustable vive en tablas de configuración editables desde
el panel de administración.

**IV.3** Max Global debe poder modificar cualquier parámetro del plan de
compensación **sin intervención de un programador**.

**IV.4** Alcance obligatorio de IV.1: porcentajes por nivel, valor del punto,
puntos de activación, descuentos por pack, puntos por pack, umbrales y bonos de
rango, límite de línea estirada, fechas de cierre y de pago.

---

## ARTÍCULO V — EL CICLO ES LA UNIDAD ATÓMICA

**V.1** Los puntos se resetean a cero al cierre de cada mes, después de
calcular y pagar.

**V.2** Ningún punto ni comisión puede existir sin un ciclo asociado.

**V.3** Un ciclo cerrado **no admite escrituras**. Esta restricción se garantiza
a nivel de base de datos, no por convención del código.

**V.4** El rango se recalifica cada mes según el volumen grupal de ese mes. No
es acumulativo de por vida.

---

## ARTÍCULO VI — VERIFICACIÓN OBLIGATORIA

**VI.1** Ningún cálculo entra a producción sin su test unitario, con un caso
verificado a mano.

**VI.2** Casos de prueba obligatorios antes de cualquier despliegue:

| Test | Debe verificar |
|---|---|
| Patrocinio Gold completo | Los 7 niveles suman S/. 369.60 |
| Residual café 10 niveles | Suman S/. 17.46 |
| Ejecutivo con 5 niveles | Los niveles 6 al 10 no se pagan |
| Socio inactivo en cadena | Se salta sin buscar sustituto |
| Kit Emprendedor | No cobra residual |
| Línea estirada al límite | El tope del 50% se aplica |
| Ciclo cerrado | Rechaza escrituras |

**VI.3** El motor se prueba con una red simulada de 500 o más socios antes de
tocar datos reales.

**VI.4** La suma de comisiones pagadas **jamás** puede exceder el porcentaje
comprometido. Esta verificación corre en cada cierre de ciclo.

---

## ARTÍCULO VII — AISLAMIENTO DEL MOTOR

**VII.1** El motor de comisiones es un **módulo puro**: recibe una estructura de
red, devuelve una liquidación. Sin efectos secundarios, sin dependencias de
interfaz.

**VII.2** Ningún otro componente reimplementa lógica de comisiones. Todos la
consumen.

**VII.3** La API, el panel y los reportes **consultan** al motor. No calculan.

> **Fundamento:** si la lógica está repartida en tres lugares, tarde o temprano
> dos calculan distinto, y descubrir cuál está mal cuesta semanas.

---

## ARTÍCULO VIII — SIN COMPRESIÓN

**VIII.1** Cada socio cobra únicamente los niveles que su pack le habilita.

**VIII.2** Si un nivel está bloqueado, esa comisión **no se paga y queda en la
empresa**. No sube al siguiente calificado. No se redistribuye.

**VIII.3** El motor recorre el upline y en cada posición verifica dos
condiciones: que el pack habilite ese nivel, y que el socio esté activo. Si
falla cualquiera, no paga y **no busca sustituto**.

---

## ARTÍCULO IX — REGLAS QUE PARECEN ERRORES Y NO LO SON

**IX.1 El nivel 8 del bono residual paga 10%,** más que los niveles 6 y 7. **No
es un error de tipeo.** Es un incentivo comercial deliberado: solo los packs
Gold en adelante alcanzan 10 niveles, así que el salto premia el plan alto.

**IX.2** Queda prohibido "corregir" esta escala.

**IX.3** Los porcentajes del residual suman 97%, no 100%. También es correcto.

> Este artículo existe porque cualquier desarrollador o agente de IA que vea esa
> tabla va a querer arreglarla.

---

## ARTÍCULO X — CLASIFICACIÓN DE DECISIONES

Cuando aparezca algo no definido, se clasifica con un solo criterio:

```
   ¿Equivocarse cuesta dinero pagado a un socio?
                    │
          SÍ ───────┴─────── NO
           │                  │
           ▼                  ▼
   REGLA DE NEGOCIO      DECISIÓN TÉCNICA
   Detener y preguntar   Decidir, dejar
   a Max Global          configurable
                         y documentar
```

**X.1** Solo va al cliente lo que únicamente el cliente puede decidir.

**X.2** En ambos casos, la decisión queda **configurable**. Si mañana cambia,
debe ser un cambio de configuración y no de código.

**X.3** Toda decisión se registra con fecha en la bitácora del proyecto.

---

## ARTÍCULO XI — PRIORIDAD DE FUENTES

Cuando los documentos se contradigan, este es el orden de autoridad:

1. **Confirmación escrita de Max Global** (WhatsApp, formulario, correo)
2. **Esta constitución**
3. **Las especificaciones** en `specs/`
4. Los PDFs oficiales del cliente
5. El deck comercial

**XI.1** Los PDFs y el deck son material comercial, no especificación técnica,
y se contradicen entre sí en descuentos, bonos de rango y frontales requeridos.

---

## ARTÍCULO XII — ENTREGA

**XII.1** El código, la base de datos y la documentación se entregan en
propiedad a Max Global Corporation.

**XII.2** El motor multinivel se entrega documentado línea por línea, de modo
que cualquier ingeniero de confianza de la empresa pueda auditarlo.

**XII.3** El sistema no debe requerir dependencias de alquiler ni contratos
obligatorios de mantenimiento para seguir funcionando.

---

## GOBERNANZA

**Enmiendas.** Esta constitución se modifica únicamente con acuerdo escrito
entre Jack y Max Global. Toda enmienda se registra en `05-CONTROL/BITACORA`
con su fecha y su fundamento.

**Cumplimiento.** Toda revisión de código verifica el cumplimiento de estos
artículos. Un incumplimiento bloquea la entrega.

**Versionado.** Cambio incompatible de un principio sube la versión mayor.
Artículo nuevo sube la menor. Aclaración de redacción sube el parche.

---

**Versión:** 1.0.0 · **Ratificada:** 25 ago 2026 · **Última enmienda:** —


---

## ARTÍCULO XIII · LOS DOS DESCUENTOS Y LOS PUNTOS FIJOS

*Incorporado el 25 de agosto de 2026, tras la confirmación de Max Global.*

**Cada pack tiene DOS porcentajes de descuento y no son intercambiables.**

`descuento_recompra_pct` es lo que paga el socio al recomprar. **Es el único que
entra en cálculos y el único que muestra la tienda.** Vale 50 para todos los
packs y 40 para el Kit Emprendedor.

`descuento_en_pack_pct` describe cómo se valorizan los productos incluidos en el
pack de afiliación. Es informativo. **Queda prohibido usarlo para calcular
precios de recompra, comisiones o puntos.**

**Los puntos de un producto son fijos.** El café da 18 puntos lo pague el socio a
S/. 150.00, S/. 75.00 o S/. 90.00. **Queda prohibido** derivar puntos del precio pagado o
multiplicarlos por el porcentaje de descuento. Los puntos salen de
`producto.puntos` y de ningún otro lugar.

**Fundamento:** el ejemplo textual del cliente — *"café de 18 × 40% = 7.20"* —
solo cierra si los 18 puntos son fijos. Cualquier implementación que prorratee
los puntos contradice el número que el propio cliente validó.


---

## ARTÍCULO XIV · EL KIT EMPRENDEDOR NO USA LA ESCALA DE 7 NIVELES

*Incorporado el 26 de agosto de 2026.*

El Kit Emprendedor (S/. 120) paga **41.7% al nivel 1 y nada más** — S/. 50 al
patrocinador directo. **Queda prohibido** repartirlo por la escala de patrocinio
de 7 niveles.

El motor debe consultar `pack_comision_especial` antes de aplicar
`nivel_comision('patrocinio')`. Si el pack tiene fila propia, esa manda.

**Fundamento:** *"por afiliar a un Kit Emprendedor yo gano el 41.7%, que sería 50
soles por cada kit de 120 soles"*. 120 × 0.417 = 50.04.

---

## ARTÍCULO XV · SI EL SOCIO BAJA DE RANGO, NO COBRA NADA

*Incorporado el 26 de agosto de 2026.*

El bono de rango se paga solo si el socio **mantiene o asciende** respecto a su
rango anterior. **Si baja, no cobra ningún bono de rango ese mes** — ni siquiera
el del rango menor que sí alcanzó.

**Queda prohibido** pagarle el bono del rango inferior "porque al menos llegó a
eso". Un Oro que cae a 900 puntos grupales cobra **cero**, y conserva el título
de Oro solo como honorífico.

**Fundamento:** *"si el líder llega a un rango tiene que mantenerse o ascender
para cobrar; si baja de rango ya no cobra"*.

---

## ARTÍCULO XVI · PUNTOS PERSONALES Y GRUPALES SON CONTADORES SEPARADOS

*Incorporado el 26 de agosto de 2026.*

Los **puntos personales** sirven únicamente para la activación de 70 del mes.

Los **puntos grupales** que califican el rango provienen **solo de la red**.
**Queda prohibido** sumar los puntos personales del socio a su propio volumen
grupal.

Un líder que compra S/. 4,000 de producto él mismo no sube de rango con eso.

**Fundamento:** respuesta 8.2 del formulario — *"No, solo los de mi red."*

---

## ARTÍCULO XVII · LOS PUNTOS DEL PRODUCTO DESAPARECEN DENTRO DEL PACK

*Incorporado el 26 de agosto de 2026.*

Un pack de afiliación aporta su `puntos_rango` y nada más. **Queda prohibido**
sumar los puntos de los productos que el pack contiene.

Un Pack Gold da 150 puntos, no los 13 productos × sus puntos.

**Fundamento:** *"los puntos del café solo son válidos en recompra; en el pack
desaparecen y el pack tiene otro punto"*.

---

## ARTÍCULO XVIII · LOS PRECIOS SE GUARDAN AL PÚBLICO

*Incorporado el 26 de agosto de 2026.*

`producto.precio_cent` es el **precio de venta al público**. El precio del socio
se calcula aplicando `pack.descuento_recompra_pct`.

| Producto | Público | Socio 50% |
|---|---|---|
| Café | S/. 150 | S/. 75 |
| Esplendor | S/. 120 | S/. 60 |

**Queda prohibido** aplicar el descuento sobre la lista antigua de recompra (café
S/. 75) — esa lista **ya tenía el 50% incorporado** y volver a descontar haría que
la empresa cobre la mitad de lo debido.
