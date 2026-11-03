# CLAUDE.md — SISTEMA MAX GLOBAL

> Contexto para el agente que construye **el backoffice y el panel de
> administración**.
> Dominio: `app.maxglobaloficial.com`
>
> **Versión:** 1.0 · **Última actualización:** 25 ago 2026, 22:06 (Perú)
>
> **Estado:** bloqueado esperando 5 respuestas de Max Global para el motor.
> Ver `00-EMPEZAR-AQUI/04-RETOMAR-AQUI`.
> **Última sesión de trabajo:** martes 25 ago 2026, 22:06

---

## 🔴 ADVERTENCIA

**Este sistema calcula y paga dinero real a personas reales.**

La propuesta firmada compromete *"un sistema libre de fallas matemáticas de
cálculo"* y código auditable línea por línea.

Un porcentaje inventado se convierte en una transferencia bancaria imposible de
revertir. **Es preferible un sistema incompleto a uno que paga mal.**

---

## QUÉ SE CONSTRUYE

El sistema interno de Max Global Corporation, empresa peruana de venta directa
multinivel.

| Módulo | Qué hace |
|---|---|
| **Motor de comisiones** | El corazón. Calcula 5 bonos sobre una red de 10 niveles |
| **Backoffice del socio** | Su panel, red, comisiones, rango y recompras |
| **Panel de administración** | Registra ventas, confirma pagos, cierra ciclos, configura |

**Lo que NO va acá:** la landing comercial. Vive en `maxglobaloficial.com`, es
otro proyecto.

---

## ORDEN DE CONSTRUCCIÓN

```
1. specs/001-motor-comisiones    ← PRIMERO. Es lo único irreversible
2. specs/003-panel-admin          ← sin él no entra nada al sistema
3. specs/002-backoffice-socio     ← donde vive el socio
4. specs/004-panel-asesor         ← 📌 Fase 2, no construir todavía
```

**No empieces por las pantallas.** Una interfaz fea se corrige; una comisión mal
pagada no se recupera.

---

## LOS TRES ROLES

| Rol | Qué hace | ¿Está en la red? |
|---|---|---|
| **Socio** | Su panel, su red, sus comisiones, su recompra | **Sí** |
| **Administrador** | Registra ventas, confirma pagos, cierra ciclos, configura | **No** |
| Asesor | 📌 Fase 2. En la v1 no existe | No |

> **No cualquiera vende.** En la v1 **todas las ventas se registran y se
> confirman desde el panel de administración**.

**Solo dos acciones en todo el sistema generan dinero:**
confirmar un pago · cerrar un ciclo. Ambas exclusivas del administrador.

---

## REGLAS DE ORO — NO NEGOCIABLES

### R1 · Nunca inventes una regla del plan

Si una regla no está en este documento o en las specs, **detente y pregunta**.
No la deduzcas, no la completes con lo que es habitual en MLM.

### R2 · El dinero va en enteros

Todo monto en **céntimos, como entero**. `S/. 37.50` → `3750`.
**Prohibido** `float`, `double` y `real` para dinero o puntos.

### R3 · Puntos y comisiones son append-only

Solo se insertan. **Nunca** se editan ni se borran. Un error se corrige con un
**asiento inverso**.

### R4 · Cero valores en el código

Ningún porcentaje, umbral, precio ni fecha va escrito en el código. Todo vive en
tablas de configuración editables desde el panel.

### R5 · Todo pertenece a un ciclo

Los puntos se resetean cada mes. Ningún punto ni comisión existe sin ciclo.
**Un ciclo cerrado no admite escrituras** — garantizado por trigger de base de
datos, no por convención.

### R6 · Ningún cálculo sin su test

Cada regla de comisión necesita su test con un caso verificado a mano.

### R7 · El motor vive aislado

Módulo puro: entra la red, sale la liquidación. Nadie más reimplementa lógica de
comisiones.

---

## EL PLAN DE COMPENSACIÓN

### Valor del punto — 🔴 el número más peligroso del sistema

| Uso | Valor |
|---|---|
| **Comisión residual** | **1 punto = S/. 1.00** |
| Referencia de volumen | 4.167 — **solo reportes** |

> 🔴 **NUNCA multipliques por 4.167 para calcular comisiones.**
> Si lo haces, el sistema paga más de lo que factura. El valor vive en
> configuración precisamente para que nadie lo toque por accidente.
>
> Confirmado por el cliente: *"De los puntos del producto. Por decir del café de
> 18 x 40% sería 7.20 soles."*

### Bono de Patrocinio — al confirmar un pack

7 niveles sobre el **precio completo** del pack:
`20 · 4 · 3 · 2 · 1 · 0.5 · 0.3 %` = **30.8%**

Gold S/.1,200 → 240 · 48 · 36 · 24 · 12 · 6 · 3.60 = **S/. 369.60**

### Bono Residual — al cierre, solo recompras

10 niveles sobre los puntos, a S/.1 cada uno:
`40 · 20 · 10 · 5 · 3 · 2 · 1 · 10 · 5 · 1 %` = **97%**

Café 18 pts → **S/. 17.46**

> 🔴 **El nivel 8 paga 10%, más que el 7. NO ES UN ERROR.**
> Es un incentivo deliberado: solo los packs Gold en adelante llegan a 10
> niveles. **Está prohibido "corregirlo".**

### Sin compresión

Cada socio cobra **solo** los niveles que su pack habilita. Si un nivel está
bloqueado, esa comisión **no se paga y queda en la empresa**. No sube al
siguiente calificado, no se redistribuye, no se busca sustituto.

| Pack | Residual | Patrocinio |
|---|---|---|
| Kit Emprendedor | 0 | solo afilia Kit |
| Ejecutivo | 5 niveles | 3 niveles |
| Gold / Familiar / Empresarial | 10 niveles | 7 niveles |

### Activación mensual

70 puntos personales para cobrar comisiones de equipo.

Sin activación: **no cobra ese mes**, pero **conserva su puntaje y su rango
honorífico**.

### Ciclo mensual

Se calcula → se paga → **los puntos vuelven a cero**.
El rango se recalifica cada mes. **No es acumulativo de por vida.**

### Rangos

Se paga **cada mes** que califique. **No es apilable** — un Diamante cobra
S/.10,000, no la suma de los rangos menores.

| Rango | Pts grupales | Frontales | Bono |
|---|---|---|---|
| Jade | 500 | ⏳ | 50 |
| Bronce | 1,000 | 2 | 100 |
| Plata | 2,000 | 2 | 200 |
| Oro | 4,000 | 3 | 500 |
| Platino | 8,000 | 4 | ⏳ |
| Esmeralda | 15,000 | 5 | 3,000 |
| Zafiro | 30,000 | 6 | 5,000 |
| Diamante | 60,000 | 7 | 10,000 |
| 9 a 16 | ⏳ sin definir | ⏳ | ⏳ |

### Línea estirada

De la línea con mayor volumen **solo cuenta hasta el 50%** de los puntos
requeridos. El resto viene de las demás líneas.

---

## FLUJO DE VENTA

```
1. El socio arma su carrito en su backoffice
2. Pulsa "Pedir por WhatsApp" con el pedido precargado
3. El ADMINISTRADOR cotiza el envío y cierra la venta
4. El cliente deposita y manda la foto
5. El ADMINISTRADOR registra: socio, productos, comprobante, envío
      → orden queda POR CONFIRMAR
6. 🔥 El ADMINISTRADOR CONFIRMA EL PAGO
      → se acreditan puntos y se generan comisiones
7. Se despacha con número de guía
```

**El socio no sube comprobantes.** **La entrega es 100% por envío.**

🔴 Al registrar, el sistema **debe mostrar la ficha del socio** (nombre, pack,
estado, patrocinador) y **exigir confirmación visual** antes de guardar. Un
código mal escrito manda las comisiones a otra persona.

---

## ESTADOS

| Entidad | Estados |
|---|---|
| **Socio** | `pendiente` → `activo` ↔ `inactivo` → `suspendido` → `baja` |
| **Orden** | `por_confirmar` → `pagada` → `despachada` → `entregada` · `rechazada` · `anulada` |
| **Envío** | `preparando` → `enviado` → `entregado` · `incidencia` |
| **Ciclo** | `abierto` → `calculando` → `cerrado` → `pagado` |

**Reglas duras:**

- 🔥 `pagada` es el **único** estado que dispara el motor de comisiones
- El envío **no altera** puntos ni comisiones en ningún estado
- El costo de envío **nunca** genera puntos
- Un ciclo cerrado **rechaza escrituras**
- Una orden de un ciclo cerrado **no se puede anular**

---

## PROTECCIONES OBLIGATORIAS

| # | Protección | Por qué |
|---|---|---|
| 1 | Impedir doble confirmación de pago | Duplicaría las comisiones de toda una línea |
| 2 | Vista previa antes del cierre, cancelable | Nada se escribe hasta confirmar |
| 3 | Bloquear el cierre si excede lo comprometido | Última red de seguridad |
| 4 | Confirmación visual del socio al registrar | Evita pagar a la persona equivocada |
| 5 | Explicar por qué un nivel NO cobró | Es lo que más reclamos evita |

---


---

## 🔴 REGLA DE DESCUENTOS — CONFIRMADA 25/08/2026

**Son DOS descuentos por pack, no uno.** Los documentos del cliente parecían
contradecirse porque hablaban de cosas distintas.

| Pack | `descuento_en_pack_pct` | `descuento_recompra_pct` |
|---|---|---|
| Kit Emprendedor | 0 | **40** |
| Ejecutivo | 40 | **50** |
| Gold | 40 | **50** |
| Familiar | 50 | **50** |
| Empresarial | 55 | **50** |

**`descuento_recompra_pct` es el ÚNICO que entra en cálculos.** Es el precio que
paga el socio al recomprar y el que muestra la tienda.

**`descuento_en_pack_pct` es informativo.** Describe cómo se valorizan los
productos incluidos en el pack de afiliación. **No lo uses para calcular nada.**

### 🔴 LOS PUNTOS NO SE PRORRATEAN CON EL DESCUENTO

```
   Café = 18 puntos SIEMPRE

   Público pagó S/. 150.00  →  18 puntos
   Socio pagó   S/.  75.00  →  18 puntos
   Kit pagó     S/.  90.00  →  18 puntos
```

Máximo lo confirmó con su propio ejemplo: *"café de 18 × 40% = 7.20"*. Si los
puntos bajaran con el descuento serían 9 y ese número no cerraría.

**Queda prohibido** multiplicar los puntos por el porcentaje de descuento, o
derivar puntos del precio pagado. Los puntos salen de `producto.puntos`, punto.

---

## DATOS QUE TODAVÍA FALTAN

**Ninguno de los datos que bloqueaban el motor sigue abierto.**

| Antes faltaba | Ahora |
|---|---|
| Puntaje del Kit Emprendedor | ✅ **0** — por consistencia del plan |
| ¿Rango por mes o acumulado? | ✅ **Mensual**, con título honorífico permanente |

**El rango se calcula con los puntos grupales DE ESE MES.** Un socio que llegó a
Oro en marzo y en abril hace 900 puntos cobra el bono de Bronce en abril, pero
su backoffice sigue mostrando "Oro" como título.

Los valores no confirmados por el cliente están en la tabla `config` con valor
conservador. **No los cambies desde el código.**
| Rangos 9 al 16 | Escala de rangos |
| Definición de "frontal activo" | Calificación de rango |
| ¿Los puntos grupales incluyen los personales? | Cálculo de rango |
| Bono Global: conversión, cortes y reparto | Bono semestral |
| Fechas de cierre y de pago | Ciclo |
| Cuentas bancarias | Configuración |

---


---

## 🔴 REGLAS INCORPORADAS EL 26/08/2026

*Salen de las 40 respuestas del formulario. Todas son dinero real.*

### 1 · El Kit Emprendedor tiene su propia comisión

```
   Kit Emprendedor S/. 120  ->  41.7% al NIVEL 1  =  S/. 50
   NO se reparte por la escala de 7 niveles
```

Consulta `pack_comision_especial` antes de `nivel_comision('patrocinio')`.
Si el pack tiene fila propia, esa manda y la escala normal no se aplica.

### 2 · Si el socio BAJA de rango, no cobra nada

```
   Mantiene el rango  ->  cobra
   Asciende           ->  cobra el nuevo
   BAJA               ->  NO COBRA NADA
```

Un Oro que cae a 900 puntos **no cobra el bono de Bronce**. Cobra cero y conserva
"Oro" solo como título honorífico.

### 3 · Los puntos grupales NO incluyen los personales

```
   puntos_personales  ->  solo activación (70)
   puntos_grupales    ->  solo la red, para el rango
```

### 4 · Los puntos del producto desaparecen dentro del pack

Un Pack Gold aporta 150 puntos. **Nunca** la suma de los 13 productos que trae.

### 5 · Los precios se guardan al PÚBLICO

| Producto | En la BD | Socio 50% |
|---|---|---|
| Café | **S/. 150** | S/. 75 |
| Esplendor | **S/. 120** | S/. 60 |

La lista antigua de recompra (café S/. 75) **ya tenía el 50% aplicado**. Volver a
descontar haría que la empresa cobre la mitad.

### 6 · Ciclo y pagos

| Parámetro | Valor |
|---|---|
| Cierre | Último día del mes |
| Pago | 3 días después del cierre |
| Mínimo de retiro | S/. 100 |
| Detracción en facturas | Sobre S/. 700 |

### 7 · Bono Global

S/. 1 por punto · cortes Ene–Jun y Jul–Dic · reparto proporcional al puntaje ·
**debe estar activo los 6 meses**, no solo el del reparto.

### 8 · Operaciones de red

**Baja de socio:** su descendencia se engancha al patrocinador. Requiere vista
previa, transacción única y reconstrucción de `red_ancestro`.

**Cambio de patrocinador:** permitido con autorización, solo en caso extremo.

**Una sola cuenta por persona.**

**Cliente sin referido** = cliente directo de la empresa, no genera comisión.

---


---

## 🔴 LÍNEA DE ALCANCE V1 — decidida el 26/08/2026

**Se construye:** lo cotizado + estas seis, que van sin costo adicional porque
sin ellas la empresa no opera:

| # | Qué |
|---|---|
| 1 | **Bono del Kit Emprendedor** — 41.7% al nivel 1 |
| 2 | **Solicitud de retiro** con aprobación del admin, mínimo S/. 100 |
| 3 | **Cálculo de detracción** sobre comisiones mayores a S/. 700 |
| 4 | **Baja de socio** con reenganche de la descendencia al patrocinador |
| 5 | **Venta a cliente final** — versión simple, registrada por el admin |
| 6 | **Mínimo legal** — Libro de Reclamaciones, privacidad, términos, pie de página |

**NO se construye:**

| Qué | Motivo |
|---|---|
| ❌ **Tienda replicada por socio** | Rechazado. El enlace `?ref=` resuelve la atribución sin el costo |
| ❌ Cambio de patrocinador | Manual. Ocurre "solo en caso extremo" |
| ❌ Rangos 9 al 16 | Tabla configurable. Cero código cuando los definan |
| ❌ Bono Cumpleaños y Viajes | El cliente los maneja aparte |
| ❌ Factura electrónica SUNAT | Solo se calcula la detracción, no se emite el comprobante |
| ❌ Inventario · app móvil · pasarela · avisos automáticos | Fuera desde la cotización |

**Detalle completo y guion comercial:** `02-PROYECTO/03-LINEA-DE-ALCANCE-V1`.

---

## DOCUMENTACIÓN COMPLETA

| Necesito | Documento |
|---|---|
| Reglas del plan | `01-NEGOCIO/01-PLAN-DE-COMPENSACION` |
| Modelo de datos | `03-SISTEMA/02-MODELO-DE-DATOS` y `schema.sql` |
| Flujos paso a paso | `03-SISTEMA/03-FLUJOS-DEL-SISTEMA` |
| Roles y permisos | `03-SISTEMA/05-ROLES-Y-PERMISOS` |
| Estados y transiciones | `03-SISTEMA/06-MAPA-DE-ESTADOS` |
| Requisitos funcionales | `03-SISTEMA/09`, `10` y `11` |
| **Casos de uso con excepciones** | `03-SISTEMA/12` y **`13` (los críticos)** |

---

## SI ALGO NO ESTÁ DEFINIDO

```
   ¿Equivocarse cuesta dinero pagado a un socio?
            │
      SÍ ───┴─── NO
       │          │
       ▼          ▼
   PREGUNTA   DECIDE TÚ
   al cliente  valor conservador
               configurable
               documentado
```

**En ambos casos, déjalo configurable.**

---

## STACK TÉCNICO

| Capa | Tecnología |
|---|---|
| Build | **Vite** |
| UI | **React** |
| Base de datos + Auth | **Supabase** (PostgreSQL) |
| Lógica de servidor | **Supabase Edge Functions** |
| Tests unitarios | **Vitest** |
| Tests E2E | **Playwright** |

---

## 🔴 DÓNDE VIVE EL MOTOR DE COMISIONES

Esta es la decisión de arquitectura más importante del proyecto.

```
   src/engine/           TypeScript puro, sin dependencias
      ↓                  Entra la red, sale la liquidación
      ↓                  Testeable con Vitest directamente
      ↓
   Edge Function         Lee datos → llama al motor → escribe TODO
      ↓                  en UNA transacción
      ↓
   PostgreSQL            Guarda comisiones de forma atómica
```

### Por qué así y no de otra forma

| Opción | Problema |
|---|---|
| Motor en el frontend | ❌ Cualquiera lo manipula desde la consola del navegador |
| Motor solo en Postgres | ❌ Difícil de testear con Vitest, difícil de leer y auditar |
| **Motor en TS puro + Edge Function** | ✅ Testeable, auditable, seguro y atómico |

**El motor es una función pura:** recibe la estructura de red y la
configuración, devuelve una lista de comisiones. **No consulta la base de datos
por dentro. No escribe nada.** Eso lo hace la Edge Function que lo envuelve.

Así se cumple el principio R7 de la constitución y además se puede testear cada
regla con Vitest sin levantar Supabase.

---

## 🔴 REGLAS DE SUPABASE

### Claves

| # | Regla |
|---|---|
| SB-1 | La clave `service_role` **jamás** aparece en el frontend ni en el repositorio |
| SB-2 | Solo la clave `anon` va en el cliente |
| SB-3 | Toda operación privilegiada pasa por Edge Function |

### Row Level Security

**RLS activado en todas las tablas, sin excepción.**

| Tabla | Política |
|---|---|
| `socio` | Un socio ve su propia fila y su descendencia. Nunca su upline |
| `comision` | Un socio ve **solo** las suyas |
| `orden` | Un socio ve **solo** las suyas |
| `movimiento_puntos` | Un socio ve **solo** los suyos |
| `wallet_movimiento` | Un socio ve **solo** los suyos |
| `config`, `nivel_comision`, `rango` | Lectura para autenticados · escritura solo admin |
| `producto`, `pack` | Lectura pública · escritura solo admin |
| `auditoria` | Solo admin. **Sin política de UPDATE ni DELETE** |

> **La política de descendencia se apoya en la tabla de cierre `red_ancestro`.**
> Sin ella, una política recursiva sobre `patrocinador_id` sería lentísima y
> propensa a recursión infinita.

### Escrituras prohibidas desde el cliente

| Tabla | Por qué |
|---|---|
| `comision` | Solo la escribe el motor |
| `movimiento_puntos` | Solo la escribe el motor |
| `wallet_movimiento` | Solo la escribe el motor |
| `ciclo` | Solo el proceso de cierre |
| `auditoria` | Append-only, desde el servidor |

---

## 🔴 IDEMPOTENCIA — protección contra doble cobro

El riesgo más caro del sistema: confirmar dos veces el mismo pago duplicaría las
comisiones de toda una línea.

**No basta con deshabilitar el botón en pantalla.** Se resuelve en la base de
datos:

```sql
-- Una orden no puede generar dos veces el mismo tipo de comisión
CREATE UNIQUE INDEX uq_comision_orden_tipo_benef
  ON comision (orden_id, tipo, beneficiario_id, nivel);

-- Una orden solo pasa a PAGADA una vez
-- La Edge Function actualiza con condición:
UPDATE orden SET estado = 'pagada'
 WHERE id = :id AND estado = 'por_confirmar'
RETURNING id;
-- Si no devuelve fila, ya estaba pagada: abortar sin escribir comisiones
```

**Ese `RETURNING` vacío es la protección real.** Todo lo demás es cosmético.

---

## ESTRUCTURA DE CARPETAS

```
src/
├── engine/                   🔴 MOTOR — TypeScript puro
│   ├── patrocinio.ts
│   ├── residual.ts
│   ├── rango.ts
│   ├── lineaEstirada.ts
│   ├── bonoGlobal.ts
│   ├── tipos.ts
│   └── index.ts
├── pages/
│   ├── socio/                backoffice
│   └── admin/                panel
├── components/
├── lib/
│   ├── supabase.ts
│   └── money.ts              céntimos, nunca float
└── hooks/

supabase/
├── migrations/               esquema versionado
├── functions/
│   ├── confirmar-pago/       llama al motor
│   ├── cerrar-ciclo/         llama al motor
│   └── registrar-pedido/
└── seed.sql

tests/
├── unit/engine/              🔴 los más importantes
├── unit/
└── e2e/
```

---

## 🔴 TESTING OBLIGATORIO

> **Ningún módulo se da por terminado sin su Vitest y su Playwright.**
> Artículo VI de la constitución: ningún cálculo entra a producción sin su test.

### Vitest — el motor primero

El motor es TypeScript puro, así que se testea **sin levantar Supabase**. Estos
son los tests que protegen la garantía firmada:

| Test | Debe dar exactamente |
|---|---|
| Patrocinio Gold, 7 niveles llenos | `36960` céntimos |
| Patrocinio Empresarial, 7 niveles | `246400` céntimos |
| Residual café 18 pts, 10 niveles | `1746` céntimos |
| Residual con Ejecutivo en N6 | N6 a N10 devuelven cero |
| Kit Emprendedor en el upline | No aparece en la lista de comisiones |
| Socio inactivo en N4 | N4 en cero, N5 cobra, sin sustituto |
| Línea estirada exacta al 50% | Aplica el tope |
| Red completa en una sola línea | No califica al rango |
| Rango sin frontales suficientes | No califica |
| Rango alcanzado | Paga solo ese, no la suma de los menores |

**Todos en céntimos enteros.** Si un test compara `369.60` en decimal, está mal
escrito.

### Vitest — con Supabase local

| Test | Verifica |
|---|---|
| RLS de socio | Un socio no puede leer la fila de otro |
| RLS de comisión | Un socio no puede leer comisiones ajenas |
| Ciclo cerrado | Rechaza INSERT de puntos y órdenes |
| Índice de idempotencia | El segundo INSERT de la misma comisión falla |
| Confirmar pago dos veces | Genera comisiones una sola vez |

### Playwright — E2E por pantalla

**Backoffice del socio**

| Pantalla | Test |
|---|---|
| Login | Entra · redirige según estado |
| Panel | Ve activación, puntos y saldo |
| Mi red | Navega el árbol sin scroll horizontal en móvil |
| Tienda | Arma carrito · ve avance a 70 pts · abre WhatsApp |
| Comisiones | Despliega hasta el origen · ve por qué un nivel no cobró |
| Mi rango | Ve la línea estirada explicada |

**Panel admin**

| Pantalla | Test |
|---|---|
| Registrar pedido | Busca socio · **confirma visualmente** · guarda |
| Bandeja | Ve consecuencias antes de confirmar |
| **Confirmar pago** | 🔴 Doble clic genera comisiones **una sola vez** |
| Cierre de ciclo | Vista previa · cancela sin escribir · ejecuta |
| Configuración | Guarda y queda auditado |

### 🔴 Los tres tests que no pueden faltar

```
1. Doble confirmación de pago
   → confirmar, volver a confirmar
   → las comisiones existen UNA vez

2. Cierre con exceso de pago
   → configurar mal a propósito
   → el cierre se BLOQUEA

3. Un socio intenta leer datos de otro
   → la consulta devuelve vacío, no error
```

---

## INSTRUCCIÓN PARA EL AGENTE

Para cada módulo, en este orden:

```
1. Lee su requisito funcional (09, 10 u 11)
2. Escribe el test de Vitest PRIMERO       ← el test define el contrato
3. Implementa hasta que pase
4. Escribe el test de Playwright
5. Corre todo
6. Recién ahí pasa al siguiente módulo
```

**En el motor, el test va antes que el código.** Los números esperados salen de
la especificación, no de lo que devuelva la implementación.

> Si escribes el código primero y después el test, el test va a confirmar lo que
> el código hace — no lo que el plan de compensación dice. Y ahí se pierde toda
> la protección.

**No avances con tests en rojo.**

---

## ⚖️ OBLIGACIONES LEGALES — PERÚ

> Detalle completo en `08-LEGAL/`. Acá va lo que afecta al sistema.

### 🔴 Libro de Reclamaciones Virtual

**Ley N° 32495**. El sistema necesita el **módulo de gestión**:

| # | Requisito |
|---|---|
| 1 | Enlace visible en todas las pantallas, a ≤2 clics |
| 2 | Cada reclamo recibe un **código único** de seguimiento |
| 3 | Confirmación automática al consumidor al enviarlo |
| 4 | Bandeja para el administrador con **días restantes** del plazo |
| 5 | Plazo legal: **15 días hábiles improrrogables** |
| 6 | Alerta cuando un reclamo se acerque al vencimiento |
| 7 | El registro de reclamos es **inalterable** |

### 🔴 Protección de datos — Ley 29733

Multa hasta 100 UIT. Lo que impacta el código:

| # | Requisito |
|---|---|
| 1 | El socio puede **ver** todos sus datos guardados |
| 2 | El socio puede **corregirlos** |
| 3 | El socio puede **exportarlos** en formato legible (portabilidad) |
| 4 | El socio puede solicitar la baja |
| 5 | Todo acceso a datos sensibles queda **auditado** |
| 6 | Al dar de baja, los datos personales se **anonimizan** |
| 7 | Las comisiones históricas **se conservan** aunque se anonimice al socio |

> **El punto 7 no contradice al 6.** El registro contable sobrevive sin el dato
> personal: se conserva monto y ciclo, se anonimiza el nombre.

### 🔴 La regla más fácil de romper por accidente

```
Los datos bancarios de un socio SOLO los ve él y el administrador.
NUNCA aparecen en el árbol genealógico, en reportes compartidos
ni en exportaciones que vea otro socio.
```

**Un `SELECT *` en la consulta del árbol expone las cuentas bancarias de toda la
red.** Las consultas de red deben listar columnas explícitamente, nunca usar
comodín.

Esto se refuerza con RLS, pero la política de base de datos no salva de una
consulta mal escrita en una Edge Function que corre con `service_role`.

### 🟡 Trazabilidad ante fiscalización

En Perú el multinivel opera en zona gris: no hay ley específica. El criterio que
separa venta directa legítima de esquema piramidal es que **los ingresos vengan
de venta real de producto, no del reclutamiento**.

El sistema debe poder demostrar:

| # | Qué |
|---|---|
| 1 | La proporción de volumen entre packs de afiliación y recompras |
| 2 | Que cada pack entregó producto físico, con su guía de envío |
| 3 | Que hay socios que ganan por vender sin haber reclutado |
| 4 | Que toda comisión es trazable hasta la orden de producto que la originó |

> El punto 4 ya está cubierto por el diseño de comisiones inmutables con rastro
> completo. El punto 1 es un reporte del panel admin.

### Tests obligatorios de cumplimiento

| Test | Verifica |
|---|---|
| Vitest + Supabase | Un socio **no** puede leer datos bancarios de su red |
| Vitest + Supabase | La consulta del árbol no devuelve columnas sensibles |
| Vitest | La exportación de datos del socio incluye todo lo suyo |
| Vitest | La anonimización conserva las comisiones históricas |
| Playwright | El reclamo genera código y confirmación automática |
| Playwright | La bandeja muestra los días restantes del plazo |
