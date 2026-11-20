# PLAN DE COMPENSACIÓN — MAX GLOBAL CORPORATION
## Especificación funcional para el sistema

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

> ## ⚠️ ADVERTENCIA
>
> **Este documento es la ley del proyecto.**
>
> Todo lo marcado ✅ está confirmado por escrito por Max Global y se puede
> programar. Todo lo marcado ⏳ está pendiente y **no se debe programar con un
> valor asumido**.
>
> Cuando este documento contradiga a un PDF del cliente o al deck comercial,
> **manda este documento**. Los PDFs son material comercial, no especificación
> técnica, y se contradicen entre sí.

---

## 1. CÓMO GANA DINERO UN SOCIO

El plan tiene **cinco bonos**. Cada uno se calcula por separado:

| # | Bono | Cuándo se paga | Sobre qué |
|---|---|---|---|
| 1 | **Patrocinio** | Una vez, al aprobarse un pack | Precio del pack |
| 2 | **Residual** | Cada mes | Puntos de recompra de la red |
| 3 | **Rango** | Cada mes | Volumen grupal del mes |
| 4 | **Global** | Cada 6 meses | 1% de puntos acumulados |
| 5 | **Cumpleaños** | ✅ definido | ❌ **fuera del sistema** — el cliente lo maneja aparte |

---

## 2. CONCEPTOS BASE

### 2.1 El punto

Cada producto vale una cantidad fija de puntos. El punto tiene **dos usos
distintos que no hay que confundir**:

| Uso | Valor | Para qué |
|---|---|---|
| **Comisión residual** | ✅ **1 punto = S/. 1.00** | Calcular el bono residual |
| **Referencia de volumen** | 4.167 | Solo reportes. Es la razón precio/punto (75÷18) |

> 🔴 **NUNCA uses 4.167 para calcular comisiones.**
> Si alguien cambia la base a puntos × 4.167, el sistema paga más de lo que
> factura. Este valor vive en configuración justamente para que nadie lo toque
> por accidente.

**Confirmado textualmente por Max Global:**
> *"De los puntos del producto. Por decir del café de 18 x 40% sería 7.20 soles."*

### 2.2 La activación mensual ✅

Un socio necesita **70 puntos personales en el mes** para cobrar comisiones de
equipo.

**Si NO llega a los 70 puntos:**

| Qué pasa | Detalle |
|---|---|
| ❌ No cobra residual | Las comisiones de ese mes no se le pagan |
| ❌ No cobra bono de rango | Aunque califique por volumen |
| ✅ Conserva su puntaje | No se le borra nada |
| ✅ Conserva su rango | Queda honorífico en el backoffice |
| ✅ Puede recalificar | El mes siguiente vuelve a la normalidad |

**Confirmado textualmente:**
> *"En caso de que ya alcanzó su rango se mantiene honoríficamente en el
> backoffice su rango, pero no comisiona por el rango obtenido en ese mes."*

### 2.3 El ciclo mensual ✅

```
   Todo el mes          Al cierre               Después
   ───────────          ─────────               ───────
   Se acumulan    →     Se calcula        →     Los puntos
   puntos               Se paga                 vuelven a CERO
```

**Confirmado textualmente:**
> *"Los puntos de cada mes tenemos que resetear a cero. Una vez sacado el
> cálculo se le paga y se vuelve cero."*

#### MODIFICADO EL 17/09 · el patrocinio ya no espera al cierre

Máximo pidió que el patrocinio se cobre sin esperar al fin de mes. Desde la
TAREA-51, el cuadro de arriba **solo describe al residual, al rango y al bono
global**.

```
   PATROCINIO   se abona a la billetera en el
                mismo instante en que se confirma
                el pago de la afiliación

                → solo si el beneficiario ya está
                  activo (70 puntos personales)

                → si no lo está, la comisión queda
                  RETENIDA: la cobra en el cierre
                  si se activa a tiempo, y se anula
                  si el mes cierra sin que lo haga

   RESIDUAL     al cierre · sin cambios
   RANGO        al cierre · sin cambios
   BONO GLOBAL  al cierre · sin cambios
```

**Consecuencia para la caja:** el dinero de las comisiones empieza a salir
durante el mes, no solo al cerrarlo.

Lo aplica `fn_confirmar_orden_pago`, con un tope de seguridad sobre el precio
del pack leído de `config.tope_patrocinio_por_orden_pct`.

**Consecuencia importante:** el rango **no es acumulativo de por vida**. Se gana
con el volumen grupal de ese mes y hay que recalificar mes a mes.

✅ **RESUELTO 26/08 (resp. 3.2): los puntos del pack SÍ se resetean**, igual que los demás. *(Texto anterior: si los puntos que otorga el pack de afiliación también se
resetean o quedan fijos en el historial.

### 2.4 La regla de no compresión ✅

Cada socio cobra **únicamente los niveles que su pack le habilita**.

Si un nivel está bloqueado, esa comisión **no se paga y queda en la empresa**.
No sube al siguiente calificado. No se redistribuye.

> **Implicación técnica:** el motor recorre el upline y en cada posición
> verifica (a) que el pack habilite ese nivel y (b) que el socio esté activo.
> Si falla cualquiera de las dos, no se paga y **no se busca sustituto**.
> Sin recursión, sin búsqueda de calificados.

---

## 3. BONO DE PATROCINIO ✅ CONFIRMADO

> ### 🔴 EL KIT EMPRENDEDOR NO USA ESTA ESCALA — confirmado 26/08/2026
>
> *"Por afiliar a un Kit Emprendedor yo gano el 41.7%, que sería 50 soles por
> cada kit de 120 soles."*
>
> ```
>    Kit Emprendedor S/. 120  ->  41.7% al NIVEL 1  =  S/. 50
>    Nada para los niveles 2 al 7
> ```
>
> **Verificación:** 120 × 0.417 = 50.04 ✅
>
> El Kit tiene su propia tabla de comisión. La escala de 7 niveles que sigue
> **aplica solo a Ejecutivo, Gold, Familiar y Empresarial.**


**Cuándo:** una sola vez, al aprobarse la compra de un pack de afiliación.
**Base:** el **precio completo del pack**. Sin descontar IGV, costo ni nada.
**Profundidad:** 7 niveles hacia arriba.

| Nivel | % |
|---|---|
| 1 | 20% |
| 2 | 4% |
| 3 | 3% |
| 4 | 2% |
| 5 | 1% |
| 6 | 0.5% |
| 7 | 0.3% |
| **TOTAL** | **30.8%** |

### Ejemplos verificados contra el deck oficial

| Nivel | Gold (S/.1,200) | Empresarial (S/.8,000) |
|---|---|---|
| 1 | S/. 240.00 | S/. 1,600.00 |
| 2 | S/. 48.00 | S/. 320.00 |
| 3 | S/. 36.00 | S/. 240.00 |
| 4 | S/. 24.00 | S/. 160.00 |
| 5 | S/. 12.00 | S/. 80.00 |
| 6 | S/. 6.00 | S/. 40.00 |
| 7 | S/. 3.60 | S/. 24.00 |
| **TOTAL** | **S/. 369.60** | **S/. 2,464.00** |

*Los montos coinciden exactos con la lámina 11 del deck de Max Global.*

**Límite por pack:** un Ejecutivo solo cobra 3 niveles de patrocinio. Los
niveles 4 al 7 de su rama no se pagan.

---

## 4. BONO RESIDUAL ✅ CONFIRMADO

**Cuándo:** cada mes.
**Sobre qué:** las **recompras** de la red. Los packs de afiliación **NO**
generan residual.
**Base:** los puntos del producto, a **S/. 1 por punto**.
**Profundidad:** hasta 10 niveles, según el pack.

| Nivel | % | Café (18 pts) |
|---|---|---|
| 1 | 40% | S/. 7.20 |
| 2 | 20% | S/. 3.60 |
| 3 | 10% | S/. 1.80 |
| 4 | 5% | S/. 0.90 |
| 5 | 3% | S/. 0.54 |
| 6 | 2% | S/. 0.36 |
| 7 | 1% | S/. 0.18 |
| 8 | **10%** | S/. 1.80 |
| 9 | 5% | S/. 0.90 |
| 10 | 1% | S/. 0.18 |
| **TOTAL** | **97%** | **S/. 17.46** |

### ⚠️ El nivel 8 al 10% NO es un error

Es un **incentivo comercial deliberado**. Solo los packs Gold en adelante llegan
a 10 niveles, así que el salto del nivel 8 funciona como premio por comprar el
plan alto.

**Prográmalo tal cual. No lo "corrijas".**

### Verificación de solvencia

| Producto | Socio paga | Se reparte | Queda a la empresa |
|---|---|---|---|
| Café | S/. 75.00 | S/. 17.46 | **S/. 57.54 (77%)** |
| Aceite de Moringa | S/. 36.00 | S/. 13.58 | **S/. 22.42 (62%)** |
| Harina de Moringa | S/. 15.00 | S/. 5.82 | **S/. 9.18 (61%)** |

*El plan es sostenible con la base correcta. De ese margen sale el costo del
producto, el envío y la operación.*

### Reparto efectivo según el pack

| Pack | Niveles | Cobra | Retiene la empresa |
|---|---|---|---|
| Kit Emprendedor | 0 | **41.7% solo nivel 1** | — |
| Ejecutivo | 5 (N1–N5) | 78% | 22% |
| Gold / Familiar / Empresarial | 10 | 97% | 3% |

---

## 5. BONO DE RANGO ✅ CONFIRMADO

> ### 🔴 SI BAJA DE RANGO, NO COBRA NADA — confirmado 26/08/2026
>
> *"Si el líder llega a un rango tiene que mantenerse o ascender para cobrar. Si
> baja de rango ya no cobra."*
>
> | Situación del mes | ¿Cobra? |
> |---|---|
> | Mantiene su rango | ✅ Cobra ese rango |
> | Asciende | ✅ Cobra el rango nuevo |
> | **Baja de rango** | ❌ **No cobra nada** |
> | No se activa (70 pts) | ❌ No cobra nada |
>
> **Un Oro que en abril hace 900 puntos grupales NO cobra los S/. 100 de Bronce.
> Cobra cero.** Conserva "Oro" solo como título honorífico.
>
> Queda prohibido pagarle el bono del rango menor "porque al menos llegó a eso".

> ### 🔴 LOS PUNTOS GRUPALES NO INCLUYEN LOS PERSONALES — confirmado 26/08/2026
>
> Respuesta 8.2 del formulario: *"No, solo los de mi red."*
>
> ```
>    puntos_personales  ->  solo para la activación de 70
>    puntos_grupales    ->  solo de la red, para calificar el rango
> ```
>
> Un líder que compra S/. 4,000 de producto él mismo **no sube de rango con eso**.
> Tiene que moverlo a través de su red.


**Cuándo:** cada mes, según el rango que califique al cierre.
**No es apilable:** un Diamante cobra los S/.10,000 de Diamante, **no** la suma
de todos los rangos menores.

**Confirmado textualmente:**
> *"Los rangos se comisionan de acuerdo a lo que llegó al fin de mes. Si un
> líder llegó en un mes a Diamante, solo se comisiona de ese rango."*

### Tabla de rangos

| # | Rango | Puntos grupales | Frontales activos | Bono |
|---|---|---|---|---|
| 1 | Jade | 500 | ✅ 1 | S/. 50 |
| 2 | Bronce | 1,000 | 2 | S/. 100 |
| 3 | Plata | 2,000 | 2 | S/. 200 |
| 4 | Oro | 4,000 | 3 | S/. 500 |
| 5 | Platino | 8,000 | 4 | ✅ S/. 1,500 |
| 6 | Esmeralda | 15,000 | 5 | S/. 3,000 |
| 7 | Zafiro | 30,000 | 6 | S/. 5,000 |
| 8 | Diamante | 60,000 | 7 | S/. 10,000 |
| 9 | Diamante Negro | 📌 | 📌 | 📌 |
| 10 | Doble Diamante | 📌 | 📌 | 📌 |
| 11 | Triple Diamante | 📌 | 📌 | 📌 |
| 12 | Club de Millonarios | 📌 | 📌 | 📌 |
| 13 | Imperial | 📌 | 📌 | 📌 |
| 14 | Titán | 📌 | 📌 | 📌 |
| 15 | Embajador Royal | 📌 | 📌 | 📌 |
| 16 | Embajador Corona | 📌 | 📌 | 📌 |

📌 **Los 8 rangos superiores existen en el plan pero no tienen valores.**
Deben crearse en el sistema marcados como "no definidos" y ser **configurables
desde el panel de administración**, para que Max Global los cargue cuando los
defina, sin tocar código.

### Contexto de escala

Como los puntos se resetean cada mes, estos son los volúmenes grupales
**mensuales** que exige cada rango:

| Rango | Volumen grupal/mes | Bono | % del volumen |
|---|---|---|---|
| Jade | S/. 2,084 | S/. 50 | 2.4% |
| Oro | S/. 16,668 | S/. 500 | 3.0% |
| Esmeralda | S/. 62,505 | S/. 3,000 | 4.8% |
| Diamante | S/. 250,020 | S/. 10,000 | 4.0% |

*El bono representa entre 2.4% y 4.8% del volumen que exige. La escala es
coherente.*

---

## 6. REGLA DE LÍNEA ESTIRADA ✅ CONFIRMADO

Para calificar a un rango, el tope de línea estirada se aplica a **CADA línea frontal** de la red mediante la fórmula:

$$\text{Puntos Computables} = \sum_{\text{línea}} \min(\text{puntos de la línea}, \text{tope del rango})$$

**Ninguna línea individual puede aportar más del tope permitido** para el rango evaluado. El resto del puntaje requerido debe provenir de las otras líneas.

### Parche Jade (TAREA-68) vs Rangos Superiores (Bronce+)

1. **JADE (500 pts grupales · 1 frontal activo):**
   Al exigir en la escala oficial únicamente **1 frontal activo**, una regla estricta del 50% (250 pts)
   haría matemáticamente imposible calificar con 1 solo frontal. Por tanto, para Jade rige la
   excepción (TAREA-68 / RF-455-B) de que una línea única puede aportar hasta el **100% de los puntos exigidos (500 pts)**.

2. **A partir de BRONCE (1,000 pts · 2 frontales) en adelante:**
   Aplica la regla estricta de línea estirada al **50% de los puntos del rango evaluado** para **cada línea**:
   - Para Bronce (1,000 pts): cada rama topea a un máximo de 500 pts.
   - Para Plata (2,000 pts): cada rama topea a un máximo de 1,000 pts.
   - Para Oro (4,000 pts): cada rama topea a un máximo de 2,000 pts.
   - Para Platino (8,000 pts): cada rama topea a un máximo de 4,000 pts.

### Ejemplo Real de Producción: MG00020 (Cierre de Octubre 2026)

En el cierre de octubre, al evaluarse el rango Jade con tope base del 50% (250 pts por rama), el socio **MG00020** presentó 3 líneas frontales activas:

```
   Línea 1 (MG00080): 1,320 pts →  aporta LEAST(1320, 250) = 250 pts  (recortada al tope)
   Línea 2 (MG00072):   210 pts →  aporta LEAST(210, 250)  = 210 pts
   Línea 3 (MG00023):   140 pts →  aporta LEAST(140, 250)  = 140 pts
                                                             ──────────────
                                 PUNTOS COMPUTABLES TOTALES: 600 pts  ✅ Califica a Jade
```
*Total guardado en `rango_ciclo.puntos_computables`: **600 puntos** (250 + 210 + 140).*

*(Nota: Con la excepción posterior de Jade al 100% / tope 500 pts, la Línea 1 aporta 500 y el computable recalculado resulta en $500 + 210 + 140 = 850\text{ pts}$).*

### Ejemplo con Múltiples Líneas que Superan el Tope — Rango Bronce (1,000 puntos grupales)

Si un socio posee más de una línea fuerte, el tope se aplica a **todas y cada una** de ellas:

```
   Línea A: 1,200 pts →  aporta LEAST(1200, 500) = 500 pts  (recortada al tope)
   Línea B:   570 pts →  aporta LEAST(570, 500)  = 500 pts  (recortada al tope)
   Línea C:   150 pts →  aporta LEAST(150, 500)  = 150 pts
                                                   ──────────────
                       PUNTOS COMPUTABLES TOTALES: 1,150 pts  ✅ Califica a Bronce
```

### Principio de Liquidación: Rango Conquistado vs Proyección
- **Al liquidar (cierre de ciclo):** Se paga **únicamente sobre el rango conquistado** (ej. Oro con sus 2,000 pts de tope y bono de S/. 500).
- **En la carrera (para conquistar):** La pantalla proyecta al siguiente rango (ej. Platino con 4,000 pts de tope) para mostrar el camino al ascenso. Si al cierre no alcanzó Platino, se le paga Oro.

✅ **RESUELTO 26/08 y TAREA-68: la línea estirada al 50% rige de Bronce en adelante, Jade permite 100% computable con 1 frontal, y los puntos grupales NO incluyen los personales.**

---

## 7. BONO GLOBAL (SEMESTRAL) ✅ CONFIRMADO COMPLETO

*Actualizado el 28/08/2026. Los cuatro pendientes que figuraban aquí se
respondieron el 26/08 — respuesta #16 — y este documento no se había
actualizado. Es el mismo error ya anotado en la bitácora: la "ley" es lo
primero que debe actualizarse.*

Cada 6 meses se reparte el **1% de los puntos acumulados** de la compañía entre
los socios con pack **Gold, Familiar o Empresarial**.

Kit Emprendedor y Ejecutivo quedan **excluidos**.

### Las cuatro reglas que faltaban ✅

| Regla | Valor | En `config` |
|---|---|---|
| Conversión del punto | **S/. 1.00 por punto** | `bono_global_conversion = 1.00` |
| Cortes semestrales | **Ene–Jun** y **Jul–Dic** | `bono_global_meses = 6` |
| Forma de reparto | **Proporcional al puntaje** | `bono_global_reparto = 'proporcional'` |
| Requisito de actividad | **Activo los 6 meses**, no solo el del reparto | `bono_global_meses_activo = 6` |

> **Lo de los seis meses completos es exigente.** Un socio Gold que falle un
> solo mes de activación en todo el semestre queda fuera del reparto entero.

**Confirmado el 26/08 — respuesta #16:**
> *Bono Global: S/.1/pt, Ene–Jun y Jul–Dic, proporcional, activo 6 meses.*

**Y en el deck, lámina 14:**
> *"CALIFICAN LOS DE PACK GOLD EN ADELANTE · CADA 6 MESES · 1% DE PUNTOS
> ACUMULADOS"*

En la base, `pack.aplica_bono_global` ya está en `true` para Gold, Familiar y
Empresarial, y en `false` para Emprendedor y Ejecutivo.

---

## 8. BONO CUMPLEAÑOS ✅ DEFINIDO — ❌ FUERA DEL SISTEMA

> **Máximo lo definió el 26/08 y pidió manejarlo él mismo:**
> *"Después de su activación con 70 pts en adelante puede escoger al 70%, 4
> productos de descuento."*
> *"Esto de preferencia manejarlo de manera interna en otro Excel."*
>
> | Detalle | Valor |
> |---|---|
> | Qué es | 4 productos al 70% de descuento |
> | Requisito | Haber comprado sus 70 puntos del mes |
> | ¿Genera puntos o comisión? | **No.** Es un regalo |
> | ¿Se construye? | **NO.** Fuera de la v1 |


Aparece únicamente en el deck comercial:

> *"BONO CUMPLEAÑOS AL 70% · COMPRAS DESPUÉS DE LOS 70 PTS · 4 PRODUCTOS"*

**No hay reglas escritas. No programar hasta tener la definición completa.**

⚠️ **Atención al diseñarlo:** un descuento del 70% que además genere puntos y
pague comisión al 97% sería la operación más costosa del sistema. Hay que
confirmar explícitamente si esas compras generan puntos y comisiones, o si son
solo un regalo sin efecto en el plan.

📌 *Espacio reservado para las reglas definitivas.*

---

## 9. BONO VIAJES ❌ FUERA DEL SISTEMA

> Máximo respondió (pregunta 11): *"lo manejo manualmente, fuera del sistema"*.
> **No se construye.**


Mencionado en el deck como *"BONO VIAJES NACIONAL E INTERNACIONAL"*, sin
ninguna regla.

Probablemente se maneje fuera del sistema. **No programar hasta confirmar.**

📌 *Espacio reservado.*

---

## 10. RESUMEN DE PENDIENTES DE ESTE DOCUMENTO

| # | Qué falta | Impacto |
|---|---|---|
| 1 | Puntos con o sin descuento (café 18 o 9) | 🔴 Alto |
| 2 | Jade: 0 o 1 frontal activo | Medio |
| 3 | Platino: bono de S/.1,000 o S/.1,500 | Medio |
| 4 | Si los puntos de pack se resetean | Medio |
| 5 | Rangos 9 al 16 | Medio |
| 6 | Puntos grupales: ¿incluyen los personales? | Medio |
| 7 | Bono Global: 4 detalles | Bajo |
| 8 | Bono Cumpleaños: reglas completas | Bajo |
| 9 | Bono Viajes: si entra al sistema | Bajo |

*Seguimiento en `05-CONTROL/PENDIENTES`.*
