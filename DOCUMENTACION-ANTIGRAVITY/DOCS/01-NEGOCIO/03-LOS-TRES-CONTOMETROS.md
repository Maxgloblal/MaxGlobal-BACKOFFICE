# LOS TRES CONTÓMETROS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Origen:** aclaración de Máximo sobre reseteo vs. acumulado

---

## LA CONFUSIÓN QUE ESTO RESUELVE

Máximo dijo dos cosas que parecían contradecirse:

> *"Los puntos de cada mes tenemos que resetear a cero."*

> *"Cada mes tomar nota: líder X, tantos puntos ha hecho. Y el mes siguiente
> cuánto ha hecho. Así se va juntando y en 6 meses pagarle lo que ha hecho."*

**No es contradicción.** Está hablando de **dos contadores distintos** que
conviven en el mismo sistema.

De hecho son **tres**, y cada uno sirve para algo diferente.

---

## LOS TRES CONTÓMETROS

```
┌────────────────────────────────────────────────────────────────┐
│  1 · PUNTOS DEL MES          se resetea cada cierre            │
│      ─────────────────                                         │
│      Para qué:  activación (70 pts) y bono residual            │
│      Ejemplo:   "llevas 54 de 70 puntos este mes"              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  2 · PUNTOS GRUPALES DEL MES   se resetea cada cierre          │
│      ───────────────────────                                   │
│      Para qué:  calificar al rango de ESE mes                  │
│      Ejemplo:   "570 puntos grupales · te faltan para Jade"    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  3 · ACUMULADO HISTÓRICO       🔴 NUNCA se resetea             │
│      ────────────────────                                      │
│      Para qué:  el Bono Global semestral (1%)                  │
│      Ejemplo:   "llevas 3,847 puntos acumulados"               │
└────────────────────────────────────────────────────────────────┘
```

---

## POR QUÉ ESTO YA ESTÁ RESUELTO

**El "reseteo" nunca borró nada.**

En el diseño del sistema, los movimientos de puntos son **append-only**: solo se
insertan, nunca se editan ni se borran. Eso se decidió por auditoría, para poder
rastrear de dónde salió cada comisión.

**Consecuencia que no habíamos notado:** el histórico completo siempre estuvo
ahí.

```
   El ciclo nuevo arranca en cero
              ↓
   Pero los movimientos del mes anterior siguen guardados
              ↓
   Sumarlos da el acumulado histórico
```

**"Resetear" solo significa que el mes nuevo empieza sin arrastre.** No que la
información desaparezca.

### Lo que esto significa para Máximo

> **Ya no tiene que anotar nada en Excel.**
>
> El backoffice puede mostrar el acumulado de cada socio en tiempo real,
> actualizado solo, sin trabajo manual, y sin ningún esfuerzo extra de
> desarrollo.

---

## LA PREGUNTA QUE SÍ HAY QUE RESPONDER

Máximo preguntó:

> *"En caso de que se acumulan puntos de rango, ¿este mes ya le paga de ese
> puntaje si llega a Oro?"*

Esa es la pregunta real, y tiene dos respuestas posibles:

### Opción A · Rango mensual *(lo que está programado)*

```
   Mes 1:  1,200 pts grupales  →  Bronce   →  cobra S/. 100
   Mes 2:    900 pts grupales  →  no llega →  cobra S/.   0
   Mes 3:  2,100 pts grupales  →  Plata    →  cobra S/. 200
```

**Cada mes se gana de nuevo.** Si baja el volumen, no cobra.

| A favor | En contra |
|---|---|
| Premia el esfuerzo sostenido | Un mes malo cuesta el bono |
| El costo es predecible mes a mes | Puede desmotivar |
| Es como funciona la mayoría de planes | |

### Opción B · Rango acumulado de por vida

```
   Mes 1:  1,200 pts  →  acumulado 1,200  →  Bronce  →  S/. 100
   Mes 2:    900 pts  →  acumulado 2,100  →  Plata   →  S/. 200
   Mes 3:  2,100 pts  →  acumulado 4,200  →  Oro     →  S/. 500
```

**Nunca se baja de rango.** Cada mes se avanza.

| A favor | En contra |
|---|---|
| Muy motivador — siempre se avanza | 🔴 El costo crece sin techo |
| El socio nunca retrocede | Se paga el bono aunque el socio ya no venda |
| | Con el tiempo, todos llegan a Diamante |

> ### 🔴 El riesgo de la opción B
>
> Si el rango se acumula de por vida y el bono se paga **cada mes**, un socio
> que llegó a Diamante hace dos años sigue cobrando **S/. 10,000 mensuales**
> aunque su red ya no venda nada.
>
> Eso es una obligación que crece y nunca baja.

---

## LA SOLUCIÓN INTERMEDIA — recomendada

**Se puede tener lo mejor de las dos:**

| Concepto | Comportamiento |
|---|---|
| **Rango que cobra** | Mensual. Se gana con el volumen de ese mes |
| **Rango honorífico** | Acumulado. El más alto alcanzado, nunca baja |
| **Contómetro acumulado** | Siempre visible, para el Bono Global |

```
   María, mes 8

   ┌──────────────────────────────────────────────┐
   │  Tu rango más alto:  ORO 🏅                  │  ← honorífico, no baja
   │  Rango de este mes:  PLATA                   │  ← el que cobra
   │  Bono a cobrar:      S/. 200                 │
   │                                              │
   │  Puntos de este mes:      2,100              │
   │  Acumulado histórico:    18,450              │  ← para el Bono Global
   └──────────────────────────────────────────────┘
```

**El socio conserva el prestigio de Oro** —lo ve en su panel, aparece en su
perfil, lo puede mostrar—, **pero cobra según lo que hizo este mes.**

---

## CÓMO SE VE EN EL BACKOFFICE

### Panel del socio

```
   ESTE MES
   ├─ Puntos personales      54 / 70      ████████░░  activación
   ├─ Puntos grupales     2,100           rango del mes: PLATA
   └─ Frontales activos       3

   HISTÓRICO
   ├─ Acumulado total    18,450 puntos
   ├─ Rango más alto     ORO 🏅
   └─ Próximo Bono Global    en 2 meses
```

### Panel del administrador

```
   REPORTE DE ACUMULADOS — para el Bono Global

   Socio             Este mes    Acumulado    Rango máx
   ────────────────────────────────────────────────────
   Carlos Mendoza       2,340       24,890    Diamante
   María Torres         2,100       18,450    Oro
   Julio Manrique         890        7,120    Plata
   ────────────────────────────────────────────────────
   TOTAL DE LA RED     45,780      312,440

   Bono Global (1%)  →  3,124 puntos a repartir
```

**Ese reporte reemplaza el Excel.** Se genera solo.

---

## EL BONO GLOBAL — cómo funciona con esto

```
   Cada 6 meses:

   1. El sistema suma TODOS los puntos acumulados de la compañía
   2. Calcula el 1%
   3. Lo reparte entre los socios Gold, Familiar y Empresarial
```

Máximo mencionó que ese 1% cubre *"tanto del porcentaje como del residual"* —
es decir, se calcula sobre **todo el volumen generado**, no solo sobre un tipo
de bono.

✅ *RESUELTO 26/08 (resp. 9.3): el reparto es **proporcional al puntaje**. (Texto anterior: si el reparto es en partes iguales o proporcional al
acumulado de cada uno.*

---

## LO QUE HAY QUE PREGUNTARLE A MÁXIMO

Una sola pregunta, con las consecuencias explicadas:

> **Máximo, sobre el rango hay dos formas y quiero confirmarlo con usted:**
>
> **A)** El socio califica cada mes con el volumen de ese mes. Si un mes baja,
> ese mes no cobra bono de rango. *(Es lo que está programado.)*
>
> **B)** El puntaje se acumula de por vida y nunca baja de rango.
>
> **Le comento algo de la opción B:** si el rango se acumula y el bono se paga
> todos los meses, un socio que llegó a Diamante hace dos años seguiría cobrando
> S/. 10,000 mensuales aunque su red ya no venda. Es una obligación que solo
> crece.
>
> **Mi propuesta:** que cobre según el mes, **pero que conserve su rango más
> alto como título honorífico** — lo ve en su panel y lo puede mostrar. Así no
> pierde el reconocimiento, pero el costo es sostenible.
>
> **Y lo del Excel:** ya no va a necesitar anotar nada. El sistema lleva el
> acumulado de cada socio automáticamente y le muestra el reporte listo para el
> Bono Global.

---

## IMPACTO TÉCNICO

| Cambio | Esfuerzo |
|---|---|
| Contómetro acumulado en el panel del socio | 🟢 Bajo — los datos ya están |
| Reporte de acumulados para el admin | 🟢 Bajo |
| Rango honorífico | ✅ Ya estaba contemplado |
| Cálculo del Bono Global sobre el acumulado | 🟢 Bajo |

**Nada de esto cambia la arquitectura.** El diseño append-only ya lo permitía.

---

## RESUMEN

| Contómetro | ¿Se resetea? | Para qué |
|---|---|---|
| Puntos del mes | ✅ Sí | Activación y residual |
| Puntos grupales del mes | ✅ Sí | Rango de ese mes |
| **Acumulado histórico** | ❌ **Nunca** | **Bono Global y seguimiento** |

> **Máximo tenía razón en las dos cosas.** Se resetea lo que se usa para
> calcular el mes, y se acumula lo que sirve para el semestre.
