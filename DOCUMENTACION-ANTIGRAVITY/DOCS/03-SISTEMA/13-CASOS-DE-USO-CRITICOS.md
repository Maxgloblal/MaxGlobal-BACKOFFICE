# CASOS DE USO CRÍTICOS — LOS QUE MUEVEN DINERO

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

> ## 🔴 POR QUÉ ESTOS VAN APARTE
>
> Solo **dos acciones** en todo el sistema generan dinero: confirmar un pago y
> cerrar un ciclo.
>
> Todo lo demás es reversible. Estas dos no.

---

## CU-10 · REGISTRAR UN PEDIDO

| | |
|---|---|
| **Actor** | Administrador |
| **Precondición** | El cliente ya depositó y mandó su comprobante |
| **Postcondición** | Orden `POR CONFIRMAR` |

### Flujo principal

```
 1. El admin entra a "Registrar pedido"
 2. Busca al socio por código, nombre o documento
 3. 🔴 EL SISTEMA MUESTRA LA FICHA PARA CONFIRMACIÓN VISUAL

        ┌──────────────────────────────────────┐
        │  María Torres Quispe                 │
        │  MG-0847 · Pack Gold · Activa        │
        │  Patrocinador: Carlos Mendoza        │
        │  [ No es esta persona ] [ Confirmar ]│
        └──────────────────────────────────────┘

 4. El admin confirma que es la persona correcta
 5. Arma el pedido con los productos
      → precios con el descuento del pack DEL SOCIO
      → contador de puntos visible
 6. Adjunta el comprobante: foto, banco, operación, monto, fecha
 7. Registra el envío: dirección, agencia, costo
 8. El sistema compara monto esperado vs. declarado
 9. Guarda → orden queda POR CONFIRMAR
```

### 🔴 Por qué el paso 3 no es negociable

El código del socio **decide quién cobra las comisiones de toda la línea**.

Si el admin escribe `MG-0847` en vez de `MG-0874`, el dinero se va a otra
persona. Y como las comisiones son inmutables, corregirlo obliga a asientos
inversos en cascada por los 10 niveles.

**Sin confirmación visual, el sistema no permite guardar.**

### Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | El código no existe | *"No se encontró ese socio"*. No permite continuar |
| **E2** | Hay varios socios con nombre parecido | Muestra la lista con documento y pack para desambiguar |
| **E3** | El socio está `SUSPENDIDO` | Advierte y pide confirmación adicional |
| **E4** | El socio está `PENDIENTE` | Solo permite registrar su orden de afiliación, no recompras |
| **E5** | El monto declarado ≠ esperado | 🔴 **Advertencia visible.** Permite continuar, pero el admin debe confirmar la diferencia |
| **E6** | Falta el comprobante | No permite guardar |
| **E7** | Falta la dirección de envío | No permite guardar |
| **E8** | Se cae la conexión al guardar | La orden **no se crea a medias**. Transaccional |
| **E9** | Doble clic en guardar | Crea **una sola** orden |

---

## CU-11 · 🔥 CONFIRMAR UN PAGO — el caso de uso más crítico

| | |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Orden en `POR CONFIRMAR` · ciclo `ABIERTO` |
| **Postcondición** | Orden `PAGADA` · puntos acreditados · **comisiones generadas** |

### Flujo principal

```
 1. El admin abre la bandeja de pendientes
 2. Selecciona un pedido
 3. Revisa el comprobante ampliado contra su cuenta bancaria
 4. 🔴 EL SISTEMA MUESTRA QUÉ VA A OCURRIR

        ┌──────────────────────────────────────────┐
        │  AL CONFIRMAR VA A OCURRIR:              │
        │   · María Torres pasa a ACTIVO           │
        │   · Se acreditan 150 puntos de rango     │
        │   · Se generan 7 comisiones              │
        │     por un total de S/. 369.60           │
        └──────────────────────────────────────────┘

 5. El admin confirma explícitamente
 6. El sistema ejecuta EN UNA SOLA TRANSACCIÓN:
        a. UPDATE orden → 'pagada'  WHERE estado = 'por_confirmar'
        b. Si no devuelve fila → ABORTA sin escribir nada
        c. Registra los movimientos de puntos
        d. Llama al motor de comisiones
        e. Inserta las comisiones
        f. Abona a las billeteras
        g. Si es afiliación, activa al socio
        h. Registra en auditoría quién confirmó y cuándo
 7. Muestra la confirmación con el detalle de lo generado
```

### 🔴 El paso 6b es la protección más importante del sistema

```sql
UPDATE orden SET estado = 'pagada'
 WHERE id = :id AND estado = 'por_confirmar'
RETURNING id;
```

**Si el `RETURNING` viene vacío, la orden ya estaba pagada.** Se aborta sin
escribir comisiones.

Deshabilitar el botón en pantalla **no sirve**: dos pestañas abiertas, un
reintento de red o un doble clic rápido bastan para duplicar las comisiones de
toda una línea.

### Flujos alternativos

**A1 · Rechazar el pago**

```
5'. El admin pulsa "Rechazar"
6'. El sistema exige un motivo obligatorio
7'. La orden pasa a RECHAZADA
8'. NO se genera ninguna comisión
9'. El socio ve el motivo en su panel
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Doble clic en confirmar | 🔴 Genera comisiones **una sola vez**. El `RETURNING` vacío aborta el segundo intento |
| **E2** | Dos administradores confirman a la vez | Igual. Solo uno gana la carrera del `UPDATE` |
| **E3** | El ciclo se cerró entre la carga y la confirmación | **Aborta.** No se puede escribir en un ciclo cerrado |
| **E4** | Falla el motor a mitad del cálculo | 🔴 **Rollback completo.** La orden vuelve a `POR CONFIRMAR`. Nada queda a medias |
| **E5** | Se cae la conexión después del UPDATE pero antes de las comisiones | 🔴 La transacción hace rollback. **Todo o nada** |
| **E6** | El patrocinador está `INACTIVO` | Se confirma igual. Ese nivel no cobra, y queda registrado el motivo |
| **E7** | Ningún nivel del upline califica | Se confirma igual. Los puntos se acreditan, las comisiones quedan en la empresa |
| **E8** | El monto no coincidía y se confirmó igual | Queda registrado en auditoría con la diferencia |
| **E9** | Se confirmó por error | 🔴 **No se puede "deshacer".** Se anula con asiento inverso, que genera comisiones negativas |

> **E4 y E5 son la razón por la que todo esto va en una transacción.** Si el
> sistema marca la orden como pagada pero falla al escribir las comisiones,
> queda una venta cobrada que nunca pagó a nadie — y nadie se entera hasta que
> el socio reclama.

---

## CU-12 · 🔥 CIERRE DE CICLO MENSUAL

| | |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Ciclo `ABIERTO` con al menos un día transcurrido |
| **Postcondición** | Ciclo `CERRADO` · comisiones abonadas · puntos en cero |

### Flujo principal

```
PASO 1 · VERIFICACIÓN PREVIA
   El sistema revisa y reporta:
     · Pedidos sin confirmar
     · Configuración incompleta
     · Rangos sin definir que alguien podría alcanzar

PASO 2 · VISTA PREVIA          ← 🔴 NADA SE HA ESCRITO
   El sistema calcula en memoria y muestra:
     · Socios activos / inactivos
     · Total Bono de Patrocinio
     · Total Bono Residual
     · Total Bono de Rango
     · Total Bono Global (si toca semestre)
     · TOTAL A PAGAR
     · ✓ Verificación: no excede el % comprometido

   → El admin puede CANCELAR sin consecuencia alguna

PASO 3 · CONFIRMACIÓN EXPLÍCITA

PASO 4 · EJECUCIÓN, en una transacción
     a. Ciclo → CALCULANDO  (bloquea escrituras)
     b. Calcular activación de cada socio
     c. Calcular residual de todas las recompras
     d. Calcular rango con línea estirada
     e. Calcular Bono Global si corresponde
     f. Insertar todas las comisiones
     g. Abonar a las billeteras
     h. Ciclo → CERRADO
     i. Abrir el ciclo siguiente

PASO 5 · LIQUIDACIÓN
   Exportar el archivo para el pago bancario
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Hay pedidos sin confirmar | 🔴 **Advierte con la lista.** Permite continuar, pero esas ventas no entran al ciclo |
| **E2** | El total excede el % comprometido | 🔴 **BLOQUEA el cierre.** No permite continuar. Es la última red de seguridad |
| **E3** | Hay configuración incompleta | Advierte qué falta antes de calcular |
| **E4** | El admin cancela en la vista previa | **Nada se escribió.** El ciclo sigue `ABIERTO` |
| **E5** | Falla el cálculo a mitad | 🔴 **Rollback total.** El ciclo vuelve a `ABIERTO`. Ninguna comisión queda escrita |
| **E6** | Se corta la conexión durante la ejecución | Igual: rollback. **Un cierre a medias sería catastrófico** |
| **E7** | Dos administradores cierran a la vez | Solo uno gana. El segundo recibe *"el ciclo ya está cerrado"* |
| **E8** | Un socio alcanza un rango sin definir (9–16) | No se le paga bono. **Queda registrado** para pagarlo cuando se defina |
| **E9** | El cierre demora mucho con 5,000 socios | Muestra progreso. No debe superar 5 minutos |
| **E10** | Se cerró un ciclo por error | 🔴 **No se puede reabrir.** Se corrige en el ciclo siguiente con asientos inversos |

> **E5, E6 y E10 juntos explican por qué la vista previa es obligatoria.** Es el
> único momento donde el error todavía se puede evitar sin costo.

---

## CU-13 · ANULAR UNA ORDEN PAGADA

| | |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Orden `PAGADA` en un ciclo **todavía abierto** |
| **Postcondición** | Orden `ANULADA` con asientos inversos |

### Flujo principal

```
1. El admin abre la orden
2. Pulsa "Anular"
3. El sistema exige un motivo obligatorio
4. 🔴 El sistema muestra QUÉ SE VA A REVERTIR:
      · Qué puntos se restan
      · Qué comisiones se anulan y a quiénes
      · Si el socio vuelve a PENDIENTE
5. El admin confirma
6. El sistema, en una transacción:
      a. Inserta movimientos de puntos NEGATIVOS
      b. Inserta comisiones NEGATIVAS por cada una generada
      c. Ajusta las billeteras
      d. Orden → ANULADA
      e. Registra en auditoría
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | El ciclo ya está `CERRADO` | 🔴 **NO permite anular.** Se corrige en el ciclo siguiente |
| **E2** | Un socio ya gastó su comisión | El saldo puede quedar **negativo**. Se descuenta del ciclo siguiente |
| **E3** | La anulación deja saldos negativos en la red | Se ejecuta igual, pero se reporta al admin quiénes quedaron en rojo |
| **E4** | El pedido ya fue despachado | Advierte. La anulación es contable; la recuperación del producto es operativa |

> **E2 es incómodo pero honesto:** si se pagó una comisión sobre una venta que
> luego se anuló, ese dinero salió. El saldo negativo es la forma correcta de
> registrarlo.

---

## CU-14 · CAMBIAR LA CONFIGURACIÓN DEL PLAN

| | |
|---|---|
| **Actor** | Administrador |
| **Precondición** | — |
| **Postcondición** | Configuración actualizada y auditada |

### Flujo principal

```
1. Entra a Configuración
2. Elige la sección
3. Edita los valores
4. El sistema advierte si el cambio es sensible
5. Confirma
6. Se guarda y queda auditado con valor anterior y nuevo
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Intenta cambiar el valor del punto de comisión | 🔴 **Advertencia destacada** explicando que afecta todos los cálculos futuros |
| **E2** | Intenta "corregir" el nivel 8 del residual | 🔴 Advierte que **es intencional**, no un error |
| **E3** | Los porcentajes suman más de 100% | Advierte, pero permite. Es decisión de Max Global |
| **E4** | Cambia un valor durante un cierre en curso | **Bloquea.** No se puede tocar la configuración mientras se calcula |
| **E5** | El cambio afectaría ciclos cerrados | 🔴 **Nunca los toca.** El cambio aplica solo hacia adelante |

---

## RESUMEN

| Caso de uso | Genera dinero | Excepciones |
|---|---|---|
| CU-10 Registrar pedido | ❌ | 9 |
| **CU-11 Confirmar pago** | 🔥 **SÍ** | 9 |
| **CU-12 Cierre de ciclo** | 🔥 **SÍ** | 10 |
| CU-13 Anular orden | Revierte | 4 |
| CU-14 Configuración | ❌ | 5 |
| **Total** | | **37** |

---

## LAS TRES PROTECCIONES QUE RESUMEN TODO

```
1. UPDATE ... WHERE estado = 'por_confirmar' RETURNING id
   → si viene vacío, aborta. Protege contra doble cobro.

2. Vista previa cancelable antes del cierre
   → el único momento donde el error no cuesta nada.

3. Bloquear el cierre si excede lo comprometido
   → la última red antes de una liquidación imposible de pagar.
```

**Si solo se implementan tres cosas de todo este documento, que sean esas.**
