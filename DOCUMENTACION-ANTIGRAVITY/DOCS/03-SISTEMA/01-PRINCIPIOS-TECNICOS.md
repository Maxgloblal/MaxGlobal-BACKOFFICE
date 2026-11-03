# PRINCIPIOS TÉCNICOS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

> Estas siete reglas no se negocian. Existen porque romperlas genera errores de
> dinero real, en cuentas de personas reales.

---

## R1 — NUNCA inventar una regla del plan de compensación

Si una regla no está en `01-NEGOCIO/01-PLAN-DE-COMPENSACION`, **no se asume,
no se deduce, no se completa con "lo que es habitual en MLM"**. Se pregunta.

**Por qué:** un porcentaje inventado se convierte en dinero pagado a personas
reales, y recuperarlo después es imposible. Es preferible un sistema incompleto
que uno que paga mal.

**Cómo se aplica:** todo hueco se marca en el código con un comentario visible
que diga qué falta y qué se asumió mientras tanto.

---

## R2 — El dinero se guarda en enteros, jamás en decimales flotantes

Todo monto se almacena en **céntimos, como entero**.

```
S/. 37.50   →   3750
S/.  0.18   →     18
```

Prohibido `float`, `double` y `real` para dinero.

**Por qué:** los decimales flotantes no representan exactamente valores como
0.1 o 0.7. En 50,000 comisiones mensuales los errores de redondeo se acumulan
hasta descuadrar visiblemente el sistema, y el descuadre aparece justo cuando
la red ya es grande.

---

## R3 — Puntos y comisiones son inmutables (append-only)

Los registros de puntos y comisiones **solo se insertan**. Nunca se editan ni
se borran.

Un error se corrige con un **asiento inverso**:

```
   Comisión errónea:   +S/. 50.00   (queda)
   Asiento inverso:    −S/. 50.00   (se agrega)
   Comisión correcta:  +S/. 35.00   (se agrega)
```

**Por qué:** es lo que permite cumplir la garantía contractual de *"código
auditable línea por línea"*. Cualquier ingeniero debe poder rastrear de dónde
salió cada sol pagado, y un `UPDATE` destruye esa trazabilidad.

---

## R4 — Cero valores hardcodeados

Ningún porcentaje, umbral, precio ni monto va escrito en el código. Todo vive
en tablas de configuración editables desde el panel de administración.

**Por qué:** Max Global debe poder ajustar un porcentaje sin llamar a un
programador. Y si un valor cambia, debe cambiar en un solo lugar.

**Aplica a:** porcentajes de cada nivel, valor del punto, puntos de activación,
descuentos por pack, puntos por pack, umbrales y bonos de rango, límite de
línea estirada, fechas de cierre.

---

## R5 — Todo cálculo pertenece a un ciclo mensual

Los puntos se resetean cada mes, así que el **ciclo es la unidad atómica** del
sistema. Ningún punto ni comisión puede existir sin un ciclo asociado.

Un ciclo cerrado **no admite escrituras**. Esto se garantiza a nivel de base de
datos (trigger), no por convención del código.

**Por qué:** si un registro entra a un ciclo ya liquidado, la liquidación deja
de cuadrar y no hay forma limpia de arreglarlo.

---

## R6 — Ningún cálculo entra a producción sin su test

Cada regla de comisión necesita un test unitario con un caso verificado a mano.

**Casos mínimos obligatorios:**

| Test | Verifica |
|---|---|
| Patrocinio Gold completo | Que los 7 niveles sumen S/. 369.60 |
| Residual café 10 niveles | Que sumen S/. 17.46 |
| Ejecutivo con 5 niveles | Que N6–N10 no se paguen |
| Socio inactivo en la cadena | Que se salte sin buscar sustituto |
| Kit Emprendedor | Que no cobre residual |
| Línea estirada al límite | Que el tope del 50% se aplique |
| Ciclo cerrado | Que rechace escrituras |

**El motor se prueba con datos simulados antes de tocar datos reales.**

---

## R7 — El motor de comisiones vive aislado

La lógica de cálculo es un **módulo puro**: entra una estructura de red, sale
una liquidación. Sin dependencias de interfaz, sin consultas dispersas por el
código.

```
   ENTRADA                  MOTOR                    SALIDA
   ───────                  ─────                    ──────
   Estructura de red   →   cálculo puro   →   Lista de comisiones
   Puntos del ciclo         (sin efectos          por beneficiario
   Configuración             secundarios)
```

**Nadie más reimplementa lógica de comisiones. Todos la consumen.**

**Por qué:** si la lógica está repartida entre la API, el panel y los reportes,
tarde o temprano dos lugares calculan distinto — y descubrirlo cuesta semanas.

---

## DECISIONES TÉCNICAS YA TOMADAS

*Estas no se consultan al cliente. Son criterio del desarrollador.*

| Decisión | Valor elegido | Razón |
|---|---|---|
| Redondeo de comisiones | 2 decimales, redondeo estándar | Es el estándar contable |
| Residuo del redondeo | Queda en la empresa | Evita descuadres a favor del socio |
| Baja automática por inactividad | No existe | El socio queda inactivo indefinidamente |
| Almacenamiento de dinero | Céntimos en entero | Ver R2 |
| Corrección de errores | Asiento inverso | Ver R3 |
| Profundidad máxima del árbol | 50 niveles | Margen sobre los 10 que se pagan |

---

## CRITERIO PARA CLASIFICAR UNA DUDA

Cuando aparezca algo no definido:

```
   ¿Equivocarse cuesta dinero pagado a un socio?
            │
      SÍ ───┴─── NO
       │          │
       ▼          ▼
   REGLA DE    DECISIÓN
   NEGOCIO     TÉCNICA
       │          │
       ▼          ▼
   Preguntar   Decidir tú,
   al cliente  dejar configurable
               y documentar
```

**En ambos casos: dejarlo configurable.** Si mañana cambia, debe ser un cambio
de configuración, no de código.
