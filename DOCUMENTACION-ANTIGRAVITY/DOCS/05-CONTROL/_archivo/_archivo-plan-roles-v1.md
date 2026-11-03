# MAX GLOBAL — Plan de Roles y Orden de Ejecución
**Base:** propuesta-max-global-v2.pdf + 6 documentos oficiales
**Modalidad:** desarrollo asistido por IA · 1 desarrollador (Jack) + diseño propio
**Fecha:** 25 ago 2026

---

## PARTE 1 — AUDITORÍA DE LA COTIZACIÓN

### 1.1 Lo que SÍ está bien definido (listo para codear)

| Regla | Estado | Fuente |
|---|---|---|
| Bono Patrocinio 7 niveles (20/4/3/2/1/0.5/0.3 = 30.8%) | ✅ Suma exacta, coherente | Plan Uninivel |
| Packs y precios (120 / 360 / 1,200 / 4,000 / 8,000) | ✅ Definido | Packs Afiliación |
| Descuentos recompra 40% / 50% | ✅ Definido | Req. Rangos Backoffice |
| Activación mensual 70 pts personales | ✅ Definido | Bono Residual |
| Tabla de rangos Jade→Doble Diamante (pts + frontales + bono S/.) | ✅ Definido | Bono Rangos |
| Regla Línea Estirada 50% | ✅ Definido | Req. Rangos Backoffice |
| Niveles habilitados por pack (Emprendedor 0 / Ejecutivo 5-3 / Gold+ 10-7) | ✅ Definido | Políticas Afiliación |
| Aguinaldo 1% semestral, solo Gold/Familiar/Empresarial | ✅ Definido | Políticas Afiliación |
| Flujo voucher manual (sin pasarela) | ✅ Definido | Propuesta |

### 1.2 VACÍOS CRÍTICOS — resolver ANTES de escribir código

> Estos 4 puntos no están en ningún documento. Si los asumes mal, el motor calcula mal y la garantía "libre de fallas matemáticas" se cae.

**🔴 V1 — Los packs no tienen puntaje asignado.**
Los rangos se miden en PUNTOS (Jade 500 → Doble Diamante 100,000), pero el catálogo de puntos solo existe para productos de RECOMPRA (Café 18, Colágeno 18, Moringa 14...). No hay tabla de puntos para los packs de afiliación.
→ *¿Un Pack Gold de S/.1,200 cuánto puntaje inyecta a la red? ¿Se calcula sumando los 13 productos escogidos? ¿O tiene puntaje fijo?*
**Sin esto no se puede calcular ningún rango.**

**🟢 V2 — RESUELTO. El N8 al 10% es intencional, no es error.**
Secuencia oficial confirmada: N1 40% · N2 20% · N3 10% · N4 5% · N5 3% · N6 2% · N7 1% · **N8 10%** · N9 5% · N10 1%
El salto en el nivel 8 es un **incentivo comercial deliberado**: solo los packs Gold, Familiar y Empresarial alcanzan 10 niveles, así que el N8 funciona como el premio que empuja a comprar el plan alto. No se corrige. Se programa tal cual.

**🟢 V4 — RESUELTO. NO hay compresión.**
Cada socio cobra únicamente los niveles que su pack habilita. Los niveles por encima de su límite quedan **bloqueados** — la comisión simplemente no se paga y queda en la empresa. No sube al siguiente calificado, no se redistribuye.
→ *Implicación:* el motor no necesita recorrer el upline buscando calificados. Es un simple corte por nivel. Mucho más simple y más rápido de auditar.

**Tabla de reparto efectivo por pack (resultado de V2 + V4):**

| Pack | Niveles residuales | % total que cobra | % que retiene la empresa |
|---|---|---|---|
| Kit Emprendedor | 0 | 0% | 100% |
| Ejecutivo | 5 (N1–N5) | 78% | 22% |
| Gold / Familiar / Empresarial | 10 (N1–N10) | 97% | 3% |

---

**🟢 V1 — RESUELTO. Puntaje de packs (solo para rango, no comisionable):**

| Pack | Precio | Puntos de rango |
|---|---|---|
| Kit Emprendedor | S/. 120 | **⚠️ sin definir** |
| Ejecutivo | S/. 360 | 50 |
| Gold | S/. 1,200 | 150 |
| Familiar | S/. 4,000 | 400 |
| Empresarial | S/. 8,000 | 800 |

**Regla confirmada (versión final, corrige una versión anterior):**
- **Rango:** suman TODOS los puntos — recompra + packs.
- **Residual:** la base son los puntos de recompra **+** los puntos de pack de membresía.
- **Patrocinio:** 30.8% del valor neto del pack, adicional.

→ *Falta:* puntos del Kit Emprendedor (¿0?) y si el puntaje de rango es **acumulativo de por vida** o **por ciclo mensual**. Con Doble Diamante en 100,000 pts, mensual sería inalcanzable.

---

**🔴 V3 — VALOR DEL PUNTO: S/. 4.167 — y aquí aparece un problema de solvencia**
**Dato confirmado:** 1 punto = S/. 4.167 · los puntos se otorgan sobre el **precio con descuento**.

**Hallazgo 1 — el 4.167 sale del precio de LISTA, no del descontado.**
El catálogo oficial ya trae los puntos calculados sobre precio de lista: Café S/.75 ÷ 4.167 = **18 pts exactos**. Harina S/.25 ÷ 4.167 = **6 pts exactos**.
Pero si los puntos se dan sobre el precio con descuento, ese mismo Café paga S/.37.50 y otorga **9 pts, no 18**.
→ **El catálogo oficial y la regla de asignación se contradicen.** Hay que fijar cuál manda: ¿la tabla de puntos publicada, o el cálculo sobre lo efectivamente pagado?

**Hallazgo 2 — con el 97% de reparto, el residual no deja margen para el producto.**
Café, socio Gold, línea de 10 niveles completa:

| Base de puntos | Socio paga | Base comisión | Se reparte (97%) | Queda a la empresa |
|---|---|---|---|---|
| 9 pts (sobre descuento) | S/. 37.50 | S/. 37.50 | S/. 36.38 | **S/. 1.12** |
| 18 pts (sobre lista) | S/. 37.50 | S/. 75.01 | S/. 72.76 | **−S/. 35.26** |

En el escenario de arriba (el que tú indicaste) quedan **S/. 1.12** — y de ahí todavía sale el costo del producto, el envío, la plataforma y la operación. En el de abajo la empresa paga el doble de lo que cobra.

**Esto no rompe hoy, rompe después.** Con la red nueva casi nadie tiene 10 niveles llenos, así que los primeros meses el reparto real será mucho menor y las cuentas van a cuadrar. El déficit aparece cuando la red madura — que es justo cuando ya hay miles de socios esperando su pago.

**Lo más probable:** que los porcentajes 40/20/10/5/3/2/1/10/5/1 no sean del valor total del punto, sino el **reparto de un pool comisionable** (ej. la empresa destina 35% del volumen al plan residual, y esos porcentajes dividen ese 35%). Así funcionan la mayoría de planes uninivel, y encaja con que sumen ~100%.

**Hallazgo 3 — con los packs alimentando también el residual, el déficit se repite.**
Confirmado que la base residual = puntos de recompra + puntos de pack:

| Pack | Precio | Residual 97% | Patrocinio 30.8% | Total comisiones | % del precio |
|---|---|---|---|---|---|
| Ejecutivo | S/. 360 | S/. 202.10 | S/. 110.88 | S/. 312.98 | **87%** |
| Gold | S/. 1,200 | S/. 606.30 | S/. 369.60 | S/. 975.90 | **81%** |
| Familiar | S/. 4,000 | S/. 1,616.80 | S/. 1,232.00 | S/. 2,848.80 | **71%** |
| Empresarial | S/. 8,000 | S/. 3,233.59 | S/. 2,464.00 | S/. 5,697.59 | **71%** |

Un Gold de S/.1,200 pagaría S/.976 en comisiones **y encima entrega 13 productos físicos**.

---

### 🔴 CONCLUSIÓN — LA PREGUNTA QUE DESBLOQUEA TODO

Tres cálculos independientes (recompra, packs, y la suma de niveles) dan el mismo resultado imposible. Eso no significa que el plan esté mal diseñado — significa que **falta una capa en la especificación**.

La explicación casi segura: los porcentajes **40/20/10/5/3/2/1/10/5/1 no son porcentajes del valor del punto, son el reparto de un POOL comisionable.** La empresa aparta un % del volumen para el plan residual, y esos números dividen ese pool. Por eso suman ~100% — todo reparto suma 100. Si fueran porcentajes directos del valor total, jamás sumarían casi el total.

**Comparación con pool del 30%:**

| Escenario | Gold paga en comisiones | % del precio | ¿Viable? |
|---|---|---|---|
| % directos sobre valor del punto | S/. 975.90 | 81% | ❌ |
| Reparto de pool 30% | S/. 556.62 | 46% | ✅ |

**Pregunta textual para Max Global:**

> *"Los porcentajes del bono residual (40%, 20%, 10%, 5%, 3%, 2%, 1%, 10%, 5%, 1%) ¿se aplican sobre el valor total en soles de los puntos generados, o son el reparto de un pool comisionable que representa un porcentaje del volumen? Si es un pool, ¿qué porcentaje del volumen se destina a ese pool?"*

**No se codifica el residual hasta tener esta respuesta.** Es el único punto del sistema capaz de generar una obligación de pago que la empresa no pueda cubrir — y no se manifiesta al inicio, sino cuando la red ya está madura y llena de socios esperando cobrar.

**🟢 V4-b — RESUELTO.** Cambio de membresía activa los beneficios de inmediato. El desbloqueo de niveles es instantáneo al aprobarse el upgrade, sin esperar al siguiente ciclo.

### 1.2-b — Constantes de configuración (ya confirmadas, van en tabla `config`, nunca hardcodeadas)

```
VALOR_PUNTO_SOLES        = 4.167
PUNTOS_SOBRE             = "precio_con_descuento"   // ⚠ sujeto a Hallazgo 1
ACTIVACION_MENSUAL_PTS   = 70
DESCUENTO_EMPRENDEDOR    = 0.40
DESCUENTO_EJECUTIVO_SUP  = 0.50
PATROCINIO_NIVELES       = [20, 4, 3, 2, 1, 0.5, 0.3]        // 30.8%
RESIDUAL_NIVELES         = [40, 20, 10, 5, 3, 2, 1, 10, 5, 1] // 97% ⚠ ver V3
UPGRADE_EFECTO           = "inmediato"
COMPRESION               = false
PACK_PUNTOS_RANGO        = {ejecutivo:50, gold:150, familiar:400, empresarial:800}
```

### 1.3 Vacíos secundarios (definir antes de Fase 3)

- **V5** — Bono de Rangos: ¿se paga una sola vez al alcanzarlo, o cada mes que se mantenga?
- **V6** — "Frontales activos" para rango: ¿activo = 70 pts personales del mes?
- **V7** — Fecha de corte del ciclo mensual y fecha de pago de comisiones.
- **V8** — Pack Familiar (S/.4,000 "a costo de recompra"): requiere selector dinámico de productos con carrito, es el pack más caro de programar. ¿Se lanza en v1 o en v2?
- **V9** — Retiros: ¿el sistema solo muestra el saldo, o gestiona solicitudes de retiro? (No está en el alcance cotizado.)
- **V10** — No cotizado: hosting, dominio, correos corporativos, backups, mantenimiento tras los 30 días de estabilización.

### 1.4 Problema de ORDEN en el cronograma cotizado

La cotización ordena: **S1 landing → S2 backoffice → S3 motor de comisiones → S4 pruebas.**

Eso es riesgo alto: el motor de comisiones (lo único irreversible y lo único que puede quebrar al cliente) queda para la semana 3, con solo 1 semana de colchón.

**Reordenamiento recomendado (mismo plazo, mismo precio, sin renegociar con el cliente):**
El motor se construye y se prueba en paralelo desde el día 1 con datos simulados, y las entregas visibles por semana se mantienen intactas para el cliente. El cliente ve el mismo cronograma; internamente tú inviertes el riesgo.

---

## PARTE 2 — ROLES DE TRABAJO

Cada rol es una unidad de trabajo con contexto propio (una sesión / un agente IA dedicado). No los mezcles en un mismo hilo: el motor de comisiones se contamina si lo trabajas junto al CSS.

### R0 · DIRECTOR DE PROYECTO — *Jack (humano, no delegable)*
Decide V1–V10, aprueba entregables, es el único que habla con el cliente.
**Entregable:** documento de reglas confirmadas y firmado por Max Global. Es tu escudo legal ante "el sistema calcula mal".

---

### R1 · ARQUITECTO DE DATOS 🔒 *bloqueante — nadie avanza sin esto*
Diseña el esquema SQL completo antes de que exista una sola pantalla.
- Tablas: `usuarios`, `packs`, `productos`, `red_patrocinio` (con path materializado para consultas de árbol rápidas), `ordenes`, `vouchers`, `movimientos_puntos`, `comisiones`, `ciclos_mensuales`, `rangos_historial`, `wallet`.
- Reglas duras: puntos y comisiones **jamás** se recalculan al vuelo — se registran como movimientos inmutables con su ciclo.
- Montos en enteros (céntimos), nunca `float`.
**Entregable:** `schema.sql` + diagrama + datos semilla (productos, packs, tabla de rangos).

---

### R2 · MOTOR DE COMISIONES 🔥 *el corazón — 40% del valor del proyecto*
Módulo puro, aislado, sin interfaz, sin base de datos acoplada: entra estructura de red, sale liquidación.
- Bono Patrocinio 7 niveles (30.8%)
- Bono Residual 10 niveles + regla de activación (70 pts) + límite de niveles por pack
- Regla de Línea Estirada 50% para rangos
- Bono de Rangos (Jade → Doble Diamante)
- Aguinaldo 1% semestral
**Entregable:** motor + suite de tests unitarios con casos escritos a mano y verificados en papel/Excel. **Ningún cálculo entra a producción sin su test.**

---

### R3 · BACKEND / API
Autenticación, sesiones, roles (socio / admin), endpoints REST, validación de patrocinador, subida de vouchers, seguridad (rate limit, hash de contraseñas, permisos por rol).
Consume R2, nunca reimplementa lógica de comisiones.

---

### R4 · FRONTEND PÚBLICO
Landing institucional responsive, catálogo de productos (Moringa, Café, Colágeno, Esplendor, Orégano, Perfume Dalba) con precios y puntos, formulario de registro con link de patrocinador (`?ref=codigo`).
**Recibe todo el arte de Jack — no inventa diseño.**

---

### R5 · BACKOFFICE DEL DISTRIBUIDOR
Login privado, dashboard, contómetros de puntos (personal / grupal), árbol genealógico interactivo, estado activo/inactivo de red, tienda de recompra con descuento automático 40%/50%, carga de voucher, historial de comisiones y wallet.

---

### R6 · PANEL ADMINISTRADOR (Max Global)
Bandeja de aprobación de vouchers (aprobar/rechazar con motivo) — **al aprobar se dispara el motor de comisiones**. Gestión de productos y packs, cierre de ciclo mensual, reportes de red, liquidación de comisiones, control de aguinaldo semestral.

---

### R7 · QA / SIMULADOR DE RED
Genera 500+ afiliados falsos con estructura realista, corre ciclos mensuales completos, verifica que la suma de comisiones pagadas jamás exceda el porcentaje comprometido, prueba casos borde (Kit Emprendedor patrocinando, socio inactivo, línea estirada al límite).
**Este rol es la Fase 4 cotizada y es lo que te protege de la garantía que firmaste.**

---

### R8 · DEVOPS / ENTREGA
Despliegue a producción, backups automáticos, variables de entorno, y el paquete de entrega prometido: código fuente documentado línea por línea, SQL limpia, scripts de despliegue y manual, todo a nombre de Max Global Corporation.

---

### R9 · DISEÑO Y MARCA — *Jack*
Logo, paleta, tipografía, flyers, banners, fichas de producto, mockups de las pantallas clave. Alimenta a R4 y R5.

---

## PARTE 3 — ORDEN DE ARRANQUE

| # | Acción | Rol | Bloquea a |
|---|---|---|---|
| 1 | Enviar V1, V3, V4-b a Max Global y obtener respuesta escrita *(V2 y V4 ya resueltos)* | R0 | R1, R2 |
| 2 | Diseñar esquema SQL + semillas | R1 | todo |
| 3 | Construir motor de comisiones con tests | R2 | R6 |
| 4 | Definir marca y mockups | R9 | R4, R5 |
| 5 | Auth + API base | R3 | R4, R5, R6 |
| 6 | Landing + catálogo + registro *(entregable visible Semana 1)* | R4 | — |
| 7 | Backoffice del socio *(entregable visible Semana 2)* | R5 | — |
| 8 | Panel admin + árbol + conexión al motor *(Semana 3)* | R6 | — |
| 9 | Simulación masiva y depuración *(Semana 4)* | R7 | — |
| 10 | Despliegue y entrega de código fuente | R8 | — |

**Ruta crítica real:** 1 → 2 → 3. Mientras el cliente no responda V1 y V3, se avanza en R9 (diseño) y R4 (landing), que no dependen de la matemática.

> **Nota para R2 (motor):** con V2 y V4 confirmados, el residual se programa como un corte plano por nivel — se recorre el upline 10 posiciones, y en cada una se verifica (a) que el pack habilite ese nivel y (b) que tenga los 70 pts de activación del mes. Si falla cualquiera de las dos, no se paga y no se busca sustituto. Sin recursión de compresión, sin búsqueda de calificados.

---

## PARTE 4 — RIESGO COMERCIAL A VIGILAR

- **S/. 4,000 por un sistema MLM completo con motor de comisiones es un precio de entrada muy por debajo del mercado.** Es defendible como caso de portafolio, pero cualquier cambio de reglas del cliente después de firmado debe cotizarse aparte.
- **Blindaje inmediato:** anexar a la cotización el documento de reglas confirmadas (V1–V10) firmado. Todo lo que no esté en ese anexo es un *cambio de alcance*, no un *ajuste*.
- Lo no cotizado (hosting, dominio, mantenimiento después de los 30 días, Pack Familiar dinámico, módulo de retiros) debe quedar por escrito como fuera de alcance.
