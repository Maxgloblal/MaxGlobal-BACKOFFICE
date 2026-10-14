# INFORME TÉCNICO Y PLAN DE TRABAJO · TAREA-65
**Fecha:** 14 de octubre de 2026 (08:35)  
**Código:** INF-2026-10-14-65  
**Hito:** Diagnóstico Integral de Bonos, Descongelamiento Reactivo de Patrocinio y Línea Mayor en P-15  
**Responsable:** Antigravity AI Agent & Jack Franklin  
**Ambiente:** Producción (`xkiwnxoferdfapezcwoq`) y Demo (`utlohnidkuvxqppmoevj`)

---

## 1. RESUMEN EJECUTIVO

A raíz de los reportes enviados por Máximo junto con cuatro fotografías del sistema en producción en tiempo real, se realizó una auditoría profunda sobre las tablas `comision`, `activacion`, `wallet_movimiento`, `auditoria`, `config` y el código fuente de los motores (`src/motor/` y funciones RPC de Postgres).

### Hallazgo Central:
Existen **dos bugs reales de código/flujo** y **una regla de negocio ya definida que Máximo está interpretando como error cuando en realidad es el comportamiento correcto de protección contable**.

---

## 2. MATRIZ DE DIAGNÓSTICO: ¿QUÉ ES BUG Y QUÉ NO ES BUG?

| Ítem Reportado | ¿Es Bug o es Comportamiento Correcto? | Diagnóstico Técnico |
|---|---|---|
| **A. Marleni Flores: Comisión de afiliación no estaba en billetera el día 13.** | 🟢 **NO ES BUG (Comportamiento Correcto)** | El día 13/10 a las 03:06 AM, Marleni tenía **0 puntos personales** en el Ciclo 2. La regla fundacional del plan de compensación exige que un socio esté activo (70 pts) para cobrar comisiones. La retención temporal protegió a la empresa de pagar dinero a alguien inactivo. |
| **B. Marleni Flores: Al activarse hoy 14/10, su comisión de S/. 1,600 sigue retenida.** | 🔴 **SÍ ES UN BUG (Brecha de Automatización)** | En `TAREA-49/51`, el sistema programó la liberación de comisiones retenidas **únicamente para el cierre de ciclo mensual (día 31)**. Como el bono de patrocinio es de pago inmediato, al momento en que Marleni alcanzó sus 70 puntos el sistema debió liberar y abonar su bono de patrocinio en ese mismo instante. |
| **C. P-15 Mi Rango: Muestra `0 / 500 pts` y `0 / 1 frontales` en ciclo abierto.** | 🔴 **SÍ ES UN BUG (Error de Visualización en Frontend)** | En `P15MiRango.jsx`, los contadores superiores leen de la tabla histórica `rango_ciclo`. En ciclo abierto (durante el mes), esa tabla está vacía (`NULL`). El frontend ponía `0` por defecto en vez de calcular en tiempo real a partir de las líneas activas que ya tiene en pantalla. |
| **D. P-15 Mi Rango: Evalúa meta de Jade a un socio que ya es Bronce.** | 🔴 **SÍ ES UN BUG (Default rígido en RPC)** | La función `fn_rango_lineas_socio` evaluaba por defecto el Rango 1 (Jade) al no encontrar `rango_ciclo` cerrado, ignorando que el socio ya posee el Rango Honorífico 2 (Bronce) y su meta debe ser Plata (Rango 3, 2,000 pts). |
| **E. Regla del 50%: Se aplica a todos los brazos en lugar de la línea mayor.** | 🔴 **SÍ ES UN BUG (Discrepancia de Motor vs Config)** | En la tabla `config`, la clave `linea_estirada_pct` dice: *"Máx % del puntaje de rango que aporta la línea más fuerte"* (singular). El código aplicaba `LEAST(puntos, 250)` en bucle a cada brazo por separado, en vez de topear al brazo de poder y permitir que los demás brazos sumen libres. |

---

## 3. SEPARACIÓN ESTRICTA DE LOS TRES TIPOS DE BONOS

Para no generar confusión operativa ni financiera:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LOS TRES TIPOS DE BONOS                                 │
├──────────────────────────┬─────────────────────────────┬────────────────────────────────┤
│ 1. BONO DE PATROCINIO    │ 2. BONO RESIDUAL            │ 3. BONO DE RANGO               │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────┤
│ • Nace de: AFILIACIÓN    │ • Nace de: RECOMPRA         │ • Nace de: VOLUMEN DE RED      │
│ • Base: Dinero del Pack  │ • Base: Puntos (S/ 1.00/pt) │ • Base: Monto fijo por rango   │
│ • Pago: INMEDIATO        │ • Pago: AL CIERRE DE MES    │ • Pago: AL CIERRE DE MES       │
│ • Escala: 7 niveles      │ • Escala: 10 niveles        │ • Escala: Rangos 1 al 8        │
│ • Retención: Se libera   │ • Retención: Se resuelve al │ • Sin retención: si no cumple  │
│   apenas el socio logre  │   cierre del 31 de octubre  │   requisitos en el mes, no     │
│   sus 70 pts personales. │   según actividad final.    │   califica (bono = S/. 0).     │
└──────────────────────────┴─────────────────────────────┴────────────────────────────────┘
```

---

## 4. QUÉ EXPLICARLE A MÁXIMO (LO QUE NO ES BUG Y ESTÁ BIEN HECHO)

Máximo suele inquietarse cuando ve advertencias rojas o montos en cero. Es crucial explicarle pedagógicamente estos dos puntos de negocio:

### 1. ¿Por qué la comisión de Marleni nació retenida el 13 de octubre?
> *"Máximo, cuando el nuevo socio se afilió el día 13, Marleni todavía no había hecho su compra mensual de 70 puntos (estaba en 0 puntos). Si el sistema le hubiera depositado el dinero inmediatamente ese día, la empresa estaría pagándole bonos a socios inactivos que no consumen los productos. El sistema actuó con total seguridad: **no borró su dinero**, sino que lo puso en espera protegida hasta que ella pasara su pedido."*

### 2. ¿Por qué las comisiones de Recompra (Residuales) de la foto 4 NO están en la billetera hoy?
> *"Máximo, en la foto 4 se ven comisiones de 4% y 3%. Esas comisiones son de **Recompra (Bono Residual)**, no de afiliación. El Bono Residual se liquida formalmente **al cierre del mes (31 de octubre)**, como siempre ha sido en el plan. No se pagan a diario porque la empresa necesita esperar el cierre de ciclo para consolidar las recompras y puntos de toda la red. Lo único que se paga el mismo día es el Bono de Afiliación (Patrocinio)."*

---

## 5. PLAN DE IMPLEMENTACIÓN Y SOLUCIÓN DE BUGS

### BLOQUE 1 · DESCONGELAMIENTO REACTIVO DE PATROCINIO (`fn_confirmar_orden_pago`)
- **Objetivo:** Cuando un socio alcance o supere el umbral de activación (70 puntos) en el ciclo actual, el sistema debe buscar inmediatamente sus comisiones de tipo `patrocinio` en estado `retenida` de ese ciclo y:
  1. Pasarlas a estado `abonada`.
  2. Generar el registro en `wallet_movimiento` (`tipo = 'abono'`).
  3. Actualizar la cadena continua de `saldo_despues_cent`.
- **Regularización inmediata:** Ejecutar la acreditación de la comisión ID 273 (S/. 1,600.00) de Marleni Flores (`MG00024`) en Producción.

### BLOQUE 2 · CORRECCIÓN DE P-15 EN CICLO ABIERTO (`P15MiRango.jsx`)
- **Objetivo:** Eliminar el display de ceros estáticos en ciclo abierto.
  1. Si `rc.frontales_activos` es `null`, calcular en tiempo real:  
     `frontalesActivos = lineas.filter(l => l.activo).length`.
  2. Si `rc.puntos_computables` es `null`, calcular en tiempo real la suma computable de las líneas directas.
  3. Mostrar correctamente la barra de avance de frontales y puntos en vivo.

### BLOQUE 3 · REGLA DE LÍNEA ESTIRADA Y META HONORÍFICA (`fn_rango_lineas_socio` & `rango.ts`)
- **Objetivo:** Alinear la regla con la especificación de `config` (*"la línea más fuerte"*):
  1. Identificar la línea frontal con mayor volumen $\rightarrow$ aplicar el tope del 50% de la meta evaluada solo a esa línea.
  2. Todas las demás líneas menores suman el 100% de su volumen producido.
  3. Para socios con rango honorífico previo (ej. Socio 13, Bronce), tomar como meta siguiente el rango inmediato superior (Plata, 2,000 pts) en lugar de degradarlo visualmente a Jade.

---

## 6. VERIFICACIÓN Y SALVAGUARDAS CONTABLES
- Cero alteración en comisiones históricas cerradas (Ciclos 1 y anteriores).
- Validación de continuidad de saldos en `wallet_movimiento`.
- Mantenimiento estricto de cero bytes nulos en el código.
