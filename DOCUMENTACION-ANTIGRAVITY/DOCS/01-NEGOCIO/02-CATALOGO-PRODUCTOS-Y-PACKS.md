# CATÁLOGO DE PRODUCTOS Y PACKS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Fuente:** `Lista_Precios_Recompra_Max_Global.pdf` y `Packs_Afiliacion_Max_Global.pdf`

---

## 1. PRODUCTOS DE RECOMPRA ✅

> ## 🔴 CORREGIDO EL 26/08 — LA LISTA ANTERIOR NO ERA EL PRECIO PÚBLICO
>
> Durante todo el proyecto tratamos la `Lista_Precios_Recompra` como el precio de
> venta al público. **Es lo que ya paga el socio con su 50% aplicado.**
>
> Máximo lo confirmó: *"el café se vende a 150"*. Y el Pack Ejecutivo lo prueba:
> S/. 360 ÷ 4 productos = S/. 90 = café con 40% sobre S/. 150.

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

**En la base de datos se guarda el PRECIO PÚBLICO.** El precio del socio se
calcula aplicando su `descuento_recompra_pct`. Nunca al revés.

### De dónde salía el 4.167 que nos confundió una semana

```
   Precio del socio ÷ Puntos
   S/. 75 ÷ 18 = 4.167
```

**Era el precio de recompra dividido entre los puntos.** No es el valor del punto,
ni una razón de conversión. Es un número derivado, sin uso en el sistema.

### El error que esto evitó

Si se aplicara 50% sobre los S/. 75 del catálogo viejo, el socio pagaría
S/. 37.50 y el residual (S/. 17.46) se comería el 47% de la venta. Con el precio
correcto —público S/. 150, socio S/. 75— el residual es el 23% y a la empresa le
quedan S/. 57.54.

**La empresa habría cobrado la mitad en cada recompra.**

### ✅ RESUELTO — los puntos son fijos por producto

**Los puntos NO se prorratean con el descuento.**

Máximo usó *"café de 18 × 40% = 7.20"* en su ejemplo del residual. Si los puntos
bajaran proporcionalmente con el descuento serían 9, no 18. **Su propio ejemplo
lo resuelve.**

| Quién paga | Cuánto | Recibe |
|---|---|---|
| Público | S/. 150.00 | **18 puntos** |
| Socio (50%) | S/. 75.00 | **18 puntos** |
| Kit Emprendedor (40%) | S/. 90.00 | **18 puntos** |

**Regla dura:** los puntos salen de la columna "Puntos" de esta tabla, siempre.
El precio pagado no los modifica.

*Lo que Máximo quiso decir con "los puntos se dan cuando tienen precio de
descuento" es que las **recompras** (que van con descuento) son las que generan
puntos — no que el descuento reduzca el puntaje.*

---

## 2. PACKS DE AFILIACIÓN

| Pack | Precio | Puntos rango | Productos | Residual | Patrocinio |
|---|---|---|---|---|---|
| Kit Emprendedor | S/. 120 | ✅ **0** | 1 | 0 niveles | solo Emprendedor |
| Ejecutivo | S/. 360 | ✅ 70 | 4 | 5 niveles | 3 niveles |
| Gold | S/. 1,200 | ✅ 150 | 13 | 10 niveles | 7 niveles |
| Familiar | S/. 4,000 | ✅ 400 | a costo recompra | 10 niveles | 7 niveles |
| Empresarial | S/. 8,000 | ✅ 800 | ✅ armado libre | 10 niveles | 7 niveles |

### 🔴 EL KIT EMPRENDEDOR TIENE SU PROPIO BONO — confirmado 26/08

**No usa la escala de 7 niveles. Tiene una comisión única del 41.7% al nivel 1.**

> *"Lo que genera comisión directa del emprendedor es el 41.7%, se le paga al
> patrocinador de ese kit. Eso no te pase, amigo, considéralo."*
>
> *"Por afiliar a un Kit Emprendedor yo gano el 41.7%, que sería 50 soles por
> cada kit de 120 soles."*

**Verificación:** S/. 120 × 41.7% = S/. 50.04 ≈ **S/. 50** ✅

| Concepto | Kit Emprendedor |
|---|---|
| Precio | S/. 120 |
| Puntos de rango | **0** — *"no tiene puntajes"* |
| Niveles de residual | 0 |
| **Comisión al patrocinador** | **41.7% = S/. 50, SOLO nivel 1** |
| Escala de 7 niveles | **NO aplica** |
| A quién puede afiliar | Solo a otro Kit Emprendedor |
| Descuento de recompra | 40% |

**Por qué solo el nivel 1:** él lo describe siempre en singular, y la economía lo
confirma — con el 41.7% quedan S/. 70 del pack; sumándole la escala del 30.8%
quedarían S/. 33, que no alcanza para producto más envío más margen.

---

### Reglas especiales de packs

✅ **Pack VIP: NO EXISTE en el sistema.**
Max Global lo maneja internamente con contratos de participación aparte.
Si aparece en el deck o en documentos antiguos, **ignóralo**.

✅ **El Kit Emprendedor solo puede patrocinar a otros Kit Emprendedor.**
No puede afiliar Ejecutivo ni superior.

✅ **Los 70 puntos del Pack Ejecutivo cubren su activación** del mes en que se
afilia. *(Max Global subió este pack de 50 a 70 puntos justamente para eso.)*

✅ **Upgrade de pack: los beneficios se activan de inmediato**, sin esperar al
siguiente ciclo.

✅ **Kit Emprendedor: 0 puntos de rango.** Decidido por consistencia del plan —
si diera ~23 puntos (la relación del Ejecutivo), diez kits de S/.120 darían 230
puntos por el mismo dinero que un Gold da 150. Eso permitiría inflar rangos
comprando kits baratos. **Valor conservador y configurable.** Fundamento completo
en `00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO`, sección 11.

✅ **RESUELTO 26/08 (resp. 4.1): TODOS los packs cubren la activación** del mes en que se afilia el socio. `cubre_activacion = TRUE` en los cinco.

✅ **Upgrade: se compra el pack completo de nuevo**, no la diferencia.
*(Respuesta 13.3 del formulario.)*

✅ **Los puntos del producto DESAPARECEN dentro de un pack.**
> *"Los puntos del café solo son válidos en recompra. En el pack desaparecen, y
> el pack tiene otro punto."*

Un Pack Gold da sus 150 puntos y nada más. **Nunca se suman los puntos de los 13
productos que trae.**

---

## 3. DESCUENTOS ✅ RESUELTO — son DOS descuentos distintos

> **Máximo aclaró el 25/08 que hay dos porcentajes por pack, no uno.**
> Por eso los documentos parecían contradecirse: el deck mostraba el descuento
> **dentro del pack** y el PDF el de **recompra**. Nunca hubo contradicción.

| Pack | Dentro del pack | **En recompra** |
|---|---|---|
| Kit Emprendedor | — | **40%** |
| Ejecutivo | 40% | **50%** |
| Gold | 40% | **50%** |
| Familiar | 50% | **50%** |
| Empresarial | 55% | **50%** |

### Qué significa cada uno

**Descuento dentro del pack** — con cuánto descuento se valorizan los productos
que vienen incluidos en el pack de afiliación. Define **cuántos productos entran**
por el precio del pack. No interviene en ningún cálculo de comisiones.

**Descuento en recompra** — el que aplica cada vez que el socio compra después de
afiliado. **Es el único que usa el motor y la tienda.**

### La regla, resumida

```
   RECOMPRA:  50% para todos
              40% solo para el Kit Emprendedor
```

**Cita textual de Máximo (25/08):**
> *"Ejecutivo dentro del pack 40% pero su recompra al 50%. Gold también lo
> mismo, y en la activación ya viene 50%. Familiar es al 50% tanto en el pack y
> recompra. Empresarial 55% dentro del pack y recompra 50%."*

### Dónde se usa cada uno

| Dónde | Qué descuento |
|---|---|
| Tienda de recompra del socio | **Recompra** |
| Registro de pedido por el admin | **Recompra** |
| Composición de los packs de afiliación | Dentro del pack |
| Catálogo público de la landing | Ninguno — precio de lista |

**En la base de datos:** `pack.descuento_recompra_pct` gobierna el motor.
`pack.descuento_en_pack_pct` es informativo.


## 4. PACKS QUE REQUIEREN DEFINICIÓN ADICIONAL

### Pack Familiar (S/. 4,000) ✅ DEFINIDO

**El socio arma libremente su pedido hasta completar los S/. 4,000**, a precio de
recompra. *(Respuesta 13.1.)*

> **Nota técnica:** si es armado libre, requiere un carrito dinámico con
> validación de tope. Es el pack más costoso de programar del catálogo.

### Pack Empresarial (S/. 8,000)

El documento menciona *"descuentos preferenciales de hasta el 55% en líneas
seleccionadas (como el Esplendor a 52 soles)"*.

✅ **DEFINIDO (respuesta 13.2):**

| Producto | Descuento |
|---|---|
| Gotas Esplendor | **56.6%** |
| Todo lo demás | **55%** |
| Café | 55%, pero **máximo 70 unidades** |

**Verificación del Esplendor:** S/. 120 público × 0.434 = **S/. 52.08**. Coincide
con los "52 soles" del documento original — que nunca cuadraba mientras
creíamos que el Esplendor costaba S/. 60.

> **Observación:** el Esplendor tiene precio de lista S/. 60. Un 55% de
> descuento daría S/. 27, no S/. 52. El documento dice "Esplendor con 55% de
> descuento a 52 soles", lo cual no cuadra con la lista de precios.
> **Hay que aclararlo antes de programar este pack.**

📌 *Espacio reservado para la composición definitiva de los packs Familiar y
Empresarial.*

---

## 5. TABLA DE CONFIGURACIÓN PARA EL SISTEMA

Todos estos valores van en tablas editables desde el panel de administración.
**Ninguno se escribe en el código.**

| Parámetro | Valor | Estado |
|---|---|---|
| Valor del punto para comisión | S/. 1.00 | ✅ |
| Razón precio/punto (solo reportes) | 4.167 | ✅ |
| Puntos de activación mensual | 70 | ✅ |
| Descuento en pack — Ejecutivo / Gold | 40% | ✅ |
| Descuento en pack — Familiar | 50% | ✅ |
| Descuento en pack — Empresarial | 55% | ✅ |
| Descuento recompra — Kit Emprendedor | 40% | ✅ |
| Descuento recompra — todos los demás | **50%** | ✅ |
| **Puntos se prorratean con descuento** | **NO — fijos** | ✅ |
| Puntos Kit Emprendedor | **0** | ✅ |
| Puntos Ejecutivo | 70 | ✅ |
| Puntos Gold | 150 | ✅ |
| Puntos Familiar | 400 | ✅ |
| Puntos Empresarial | 800 | ✅ |
