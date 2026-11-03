# MAPA DE ESTADOS

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

> Todo lo que cambia de estado en el sistema, con sus transiciones válidas y
> qué rol las dispara.
>
> **Por qué importa:** los sistemas no fallan en el cálculo, fallan en los
> estados. Un pedido que puede pasar de ANULADO a PAGADO, o un ciclo que se
> reabre, rompen la contabilidad completa.

---

## 1 · ESTADOS DEL SOCIO

```
   PENDIENTE ──confirma pago──► ACTIVO ◄──────┐
       │                          │            │
       │                          │ no llega   │ llega a
       │ vence /                  │ a 70 pts   │ 70 pts
       │ se rechaza               ▼            │
       ▼                       INACTIVO ───────┘
    ANULADO                       │
                                  │ decisión
                                  │ del admin
                                  ▼
                             SUSPENDIDO ──► BAJA
```

| Estado | Qué significa | Puede entrar | Cobra comisiones |
|---|---|---|---|
| `PENDIENTE` | Registrado, pago sin confirmar | Solo ve el estado de su solicitud | ❌ |
| `ACTIVO` | Al día con sus 70 puntos del mes | ✅ Todo su backoffice | ✅ |
| `INACTIVO` | No alcanzó los 70 puntos este mes | ✅ Con aviso visible | ❌ |
| `SUSPENDIDO` | Bloqueado por decisión administrativa | ❌ | ❌ |
| `BAJA` | Retirado definitivamente | ❌ | ❌ |
| `ANULADO` | Nunca completó su afiliación | ❌ | ❌ |

### Reglas duras

| # | Regla |
|---|---|
| S-1 | Un socio `PENDIENTE` **no aparece en el árbol** hasta que se confirme su pago |
| S-2 | `INACTIVO` **conserva** su puntaje acumulado y su rango honorífico |
| S-3 | El paso `ACTIVO ↔ INACTIVO` lo calcula el **sistema** en cada cierre, no una persona |
| S-4 | `SUSPENDIDO` y `BAJA` los decide el administrador, con motivo obligatorio |
| S-5 | No hay baja automática por inactividad |

✅ *RESUELTO 26/08 (resp. 14.2): la descendencia **sube un nivel** y se engancha al patrocinador del socio dado de baja. Requiere vista previa, transacción única y reconstrucción de `red_ancestro`.*

---

## 2 · ESTADOS DE LA ORDEN

```
   POR CONFIRMAR ──confirma admin──► PAGADA ──despacha──► DESPACHADA
        │    ▲                          │                      │
        │    │ corrige                  │                      │
        │    │ el admin                 │                      ▼
        │    └──────────                │                  ENTREGADA
        │                               │
        │ rechaza admin                 │ anula admin
        ▼                               ▼
    RECHAZADA                       ANULADA
                                  (asiento inverso)
```

| Estado | Quién lo pone | Qué ocurre |
|---|---|---|
| `POR CONFIRMAR` | Administrador | Pedido registrado con comprobante. **Todavía no genera nada** |
| `PAGADA` | **Administrador** | 🔥 Se acreditan puntos y se generan comisiones |
| `DESPACHADA` | Administrador | Salió del almacén, tiene número de guía |
| `ENTREGADA` | Administrador | Llegó al socio |
| `RECHAZADA` | Administrador | El pago no se validó. Motivo obligatorio |
| `ANULADA` | Administrador | Se revierte con asiento inverso |

### Reglas duras

| # | Regla |
|---|---|
| O-1 | 🔥 **`PAGADA` es el único estado que dispara el motor de comisiones** |
| O-2 | Solo se puede editar mientras esté `POR CONFIRMAR` |
| O-3 | Una orden `PAGADA` es **inmutable**. Solo se anula con asiento inverso |
| O-4 | `DESPACHADA` y `ENTREGADA` **no afectan** puntos ni comisiones. Son informativos |
| O-5 | Una orden `RECHAZADA` puede volver a `POR CONFIRMAR` con otro comprobante |
| O-6 | Una orden de un ciclo cerrado **no se puede anular**. Se corrige en el ciclo siguiente |

> **O-6 es clave.** Si se anulara una orden de un mes ya liquidado, habría que
> recalcular comisiones ya pagadas. La corrección va siempre hacia adelante.

---

## 3 · ESTADOS DEL ENVÍO

```
   PREPARANDO ──► ENVIADO ──► ENTREGADO
        │             │
        └─────────────┴──► INCIDENCIA ──► (vuelve a ENVIADO o se ANULA)
```

| Estado | Significado |
|---|---|
| `PREPARANDO` | Pago confirmado, aún no sale del almacén |
| `ENVIADO` | En manos de la agencia, con número de guía |
| `ENTREGADO` | Recibido por el socio |
| `INCIDENCIA` | Extravío, dirección errada, rechazo del destinatario |

### Reglas duras

| # | Regla |
|---|---|
| E-1 | El envío **no altera** puntos ni comisiones en ningún estado |
| E-2 | El envío solo existe si la orden está `PAGADA` |
| E-3 | El costo del envío **nunca** genera puntos |
| E-4 | Una `INCIDENCIA` no revierte comisiones — se resuelve operativamente |

> **E-1 y E-4 juntos protegen al socio.** Si el courier pierde el paquete, el
> socio no pierde su activación ni su rango del mes. La reposición es un tema
> logístico, no del plan de compensación.

---

## 4 · ESTADOS DEL CICLO MENSUAL

```
   ABIERTO ──inicia cierre──► CALCULANDO ──ejecuta──► CERRADO ──paga──► PAGADO
      ▲                            │
      │                            │ cancela
      └────────────────────────────┘
```

| Estado | Qué permite |
|---|---|
| `ABIERTO` | Se registran órdenes, pagos y puntos normalmente |
| `CALCULANDO` | 🔒 Bloqueado para escrituras. Se está generando la vista previa |
| `CERRADO` | 🔒 Inmutable. Comisiones calculadas, puntos reseteados |
| `PAGADO` | 🔒 Inmutable. La liquidación ya se transfirió |

### Reglas duras

| # | Regla |
|---|---|
| C-1 | Un ciclo `CERRADO` **no admite escrituras**. Garantizado por trigger en la base de datos |
| C-2 | Desde `CALCULANDO` se puede **cancelar sin escribir nada** |
| C-3 | Solo puede haber **un ciclo `ABIERTO`** a la vez |
| C-4 | Al cerrar: se calcula → se paga → **los puntos vuelven a cero** |
| C-5 | Un cambio de configuración **nunca** altera un ciclo cerrado |
| C-6 | Si el total a pagar excede el porcentaje comprometido, el cierre **se bloquea** |

---

## 5 · ESTADOS DEL RANGO

El rango no es un estado que se guarda y persiste: **se recalcula cada mes**.

```
   Cierre de ciclo
        │
        ├──► Califica  ──► cobra el bono de ESE rango
        │                  y si supera su máximo histórico,
        │                  actualiza su rango honorífico
        │
        └──► No califica ──► no cobra
                             conserva su rango honorífico
```

| Concepto | Comportamiento |
|---|---|
| **Rango del ciclo** | Se recalcula cada mes según el volumen grupal de ese mes |
| **Rango honorífico** | El más alto alcanzado alguna vez. **Nunca baja** |
| **Bono de rango** | Se paga cada mes que califique **y esté activo** |
| **Apilamiento** | ❌ Solo cobra el rango alcanzado, no la suma de los menores |

---

## 6 · QUIÉN DISPARA CADA TRANSICIÓN

| Transición | Rol | ¿Genera dinero? |
|---|---|---|
| Registro → socio `PENDIENTE` | Visitante o administrador | ❌ |
| Orden → `POR CONFIRMAR` | Administrador | ❌ |
| Orden → **`PAGADA`** | **Administrador** | 🔥 **SÍ** |
| Socio `PENDIENTE` → `ACTIVO` | Administrador *(al confirmar)* | ❌ |
| Orden → `DESPACHADA` / `ENTREGADA` | Administrador | ❌ |
| Socio `ACTIVO` ↔ `INACTIVO` | **Sistema**, en cada cierre | ❌ |
| Ciclo → `CERRADO` | Administrador | 🔥 **SÍ** |
| Socio → `SUSPENDIDO` / `BAJA` | Administrador | ❌ |

> **Solo dos acciones en todo el sistema generan dinero:** confirmar un pago y
> cerrar un ciclo. Ambas son exclusivas del administrador y ambas exigen
> confirmación explícita mostrando las consecuencias.

---

## 7 · TRANSICIONES PROHIBIDAS

Casos que el sistema debe **impedir activamente**, no solo evitar por
convención:

| Transición prohibida | Por qué |
|---|---|
| `ANULADA` → `PAGADA` | Reviviría comisiones ya revertidas |
| `CERRADO` → `ABIERTO` | Rompería toda la contabilidad del mes |
| `ENTREGADA` → `POR CONFIRMAR` | Un pedido entregado no vuelve a revisión |
| Editar orden `PAGADA` | Es inmutable |
| `BAJA` → `ACTIVO` sin intervención del admin | Requiere reactivación explícita |
| Escribir en un ciclo `CERRADO` | Bloqueado por trigger de base de datos |

---

## 8 · PLAN DE PRUEBAS DE ESTADOS

Cada transición prohibida necesita su test:

| Test | Debe verificar |
|---|---|
| Anular y reactivar orden | El sistema lo rechaza |
| Escribir en ciclo cerrado | La base de datos lo rechaza |
| Editar orden pagada | El sistema lo rechaza |
| Socio intenta confirmar pago | El sistema lo rechaza |
| Socio ve red de otro socio | El sistema lo rechaza |
| Confirmar pago dos veces | Genera comisiones **una sola vez** |
| Cierre con exceso de pago | El cierre se bloquea |

> El penúltimo es el más peligroso de todos: una doble confirmación por doble
> clic duplicaría las comisiones de toda una línea.
