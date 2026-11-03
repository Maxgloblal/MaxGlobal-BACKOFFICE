# REQUISITOS FUNCIONALES — MOTOR Y SISTEMA

**Alcance:** lógica sin interfaz · **Numeración:** RF-4xx y RT
**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

## RT · TRANSVERSALES DE TODO EL SISTEMA

### Integridad del dinero

| # | Requisito | Estado |
|---|---|---|
| RT-30 | Todo monto **debe** almacenarse en céntimos como entero | ✅ |
| RT-31 | Queda **prohibido** usar coma flotante para dinero o puntos | ✅ |
| RT-32 | El redondeo **debe** ser a 2 decimales, en un único lugar del código | ✅ |
| RT-33 | El residuo del redondeo **debe** quedar a favor de la empresa | ✅ |

### Inmutabilidad

| # | Requisito | Estado |
|---|---|---|
| RT-34 | Los registros de puntos **deben** ser append-only (`04-rls-y-grants.sql:303` solo `GRANT SELECT ON movimiento_puntos`) | ✅ |
| RT-35 | Los registros de comisiones **deben** ser append-only (`04-rls-y-grants.sql:305` y `307` solo `GRANT SELECT ON comision, wallet_movimiento`) | ✅ |
| RT-36 | Un error **debe** corregirse con asiento inverso, nunca con edición | ✅ |
| RT-37 | Cada comisión **debe** guardar el rastro completo de su cálculo | ✅ |

### Configuración

| # | Requisito | Estado |
|---|---|---|
| RT-38 | Ningún porcentaje, umbral, precio ni monto **debe** estar escrito en el código | ✅ |
| RT-39 | Toda regla ajustable **debe** ser editable desde el panel | ✅ |

### Ciclo

| # | Requisito | Estado |
|---|---|---|
| RT-40 | Ningún punto ni comisión **debe** existir sin un ciclo asociado | ✅ |
| RT-41 | Un ciclo cerrado **debe** rechazar escrituras a nivel de base de datos | ✅ |
| RT-42 | Solo **debe** existir un ciclo abierto a la vez | ✅ |

---

## RF-400 · MOTOR — PRINCIPIOS

| # | Requisito | Estado |
|---|---|---|
| RF-401 | El motor **debe** ser un módulo puro, sin efectos secundarios | ✅ |
| RF-402 | El motor **debe** recibir la estructura de red y devolver una liquidación | ✅ |
| RF-403 | Ningún otro componente **debe** reimplementar lógica de comisiones | ✅ |
| RF-404 | El motor **debe** leer toda regla desde configuración | ✅ |
| RF-405 | El motor **debe** operar en enteros de céntimos | ✅ |

---

## RF-410 · BONO DE PATROCINIO

| # | Requisito | Estado |
|---|---|---|
| RF-411 | El bono **debe** dispararse al confirmarse el pago de un pack | ✅ |
| RF-412 | El bono **debe** calcularse sobre el **precio completo** del pack | ✅ |
| RF-413 | El bono **debe** recorrer hasta 7 niveles de upline | ✅ |
| RF-414 | Los porcentajes son 20 · 4 · 3 · 2 · 1 · 0.5 · 0.3 | ✅ |
| RF-415 | El motor **debe** verificar que el pack del beneficiario habilite ese nivel | ✅ |
| RF-416 | 🔴 Si el nivel no está habilitado, **no debe** pagarse ni buscarse sustituto | ✅ |
| RF-417 | El bono **debe** pagarse una sola vez por pack comprado | ✅ |
| RF-418 | Un Pack Gold **debe** repartir exactamente S/. 369.60 con los 7 niveles llenos | ✅ |
| RF-419 | El bono de patrocinio de socios activos **debe** abonarse directamente a su billetera virtual (`wallet_movimiento`) al confirmarse el pago de la orden (`fn_confirmar_orden_pago`), pasando a estado `'abonada'`. Si el patrocinador está inactivo, queda en estado `'retenida'` a la espera del cierre | ✅ |
| RF-420 | Red de seguridad local: la suma de comisiones de patrocinio por orden **no debe** superar el porcentaje configurado en `config.tope_patrocinio_por_orden_pct` (50%) sobre el precio base del pack (`RF-412`). Si lo supera, la confirmación de la orden se bloquea por excepción en base de datos | ✅ |

---

## RF-420 · BONO RESIDUAL

| # | Requisito | Estado |
|---|---|---|
| RF-421 | El bono **debe** acumularse progresivamente orden por orden al confirmarse el pago (en estado confirmada/retenida), y su resolución final y abono a billetera se evalúa al cierre de cada ciclo | ✅ |
| RF-422 | El bono **debe** aplicarse **solo** a órdenes de recompra | ✅ |
| RF-423 | Los packs de afiliación **no deben** generar residual | ✅ |
| RF-424 | 🔴 La base **debe** ser los puntos del producto valorados a **S/. 1.00** | ✅ |
| RF-425 | 🔴 El motor **no debe** multiplicar por 4.167 | ✅ |
| RF-426 | El costo de envío **no debe** entrar en la base | ✅ |
| RF-427 | El bono **debe** recorrer hasta 10 niveles de upline | ✅ |
| RF-428 | Los porcentajes son 40 · 20 · 10 · 5 · 3 · 2 · 1 · **10** · 5 · 1 | ✅ |
| RF-429 | 🔴 El nivel 8 al 10% es intencional y **no debe** corregirse | ✅ |
| RF-430 | El motor **debe** verificar que el pack habilite ese nivel | ✅ |
| RF-431 | El motor **debe** verificar que el beneficiario esté `ACTIVO` | ✅ |
| RF-432 | 🔴 Si falla cualquiera de las dos, **no debe** pagarse ni buscarse sustituto | ✅ |
| RF-433 | Un café de 18 puntos **debe** repartir exactamente S/. 17.46 con 10 niveles llenos | ✅ |

---

## RF-440 · ACTIVACIÓN MENSUAL

| # | Requisito | Estado |
|---|---|---|
| RF-441 | El sistema **debe** acumular los puntos de activación progresivamente con cada orden (RF-234), pero la **decisión final de cobro** de comisiones se evalúa al cierre de cada ciclo | ✅ |
| RF-442 | El umbral **debe** ser 70 puntos personales del ciclo | ✅ |
| RF-443 | Un socio inactivo **no debe** cobrar residual, bono de rango ni patrocinio | ✅ |
| RF-444 | Un socio inactivo **debe** conservar su puntaje acumulado | ✅ |
| RF-445 | Un socio inactivo **debe** conservar su rango honorífico | ✅ |
| RF-446 | Los puntos del pack **deben** cubrir la activación del mes de ingreso en **todos los packs** | ✅ *resp. 4.1* |
| RF-447 | Los puntos de venta a cliente **SÍ** cuentan para la activación del socio (`02-funciones.sql:1805-1824`, `operacionAdmin.js:214-218`). *Nota: La activación asegura que el socio mueva producto ese mes; vender a un cliente califica como movimiento legítimo de producto según las reglas del negocio.* | ✅ |
| RF-448 | Las comisiones no pagadas por inactividad o límite de pack **deben** quedar registradas en `comision` con estado `'anulada'` y su motivo en `detalle` | ✅ |

---

## RF-450 · CÁLCULO DE RANGO

| # | Requisito | Estado |
|---|---|---|
| RF-451 | El rango **debe** recalcularse en cada cierre de ciclo (`02-funciones.sql:2768`, invocado atómicamente por `fn_ejecutar_cierre_ciclo` antes de liquidar billeteras) | ✅ |
| RF-452 | El rango **no debe** ser acumulativo de por vida | ✅ |
| RF-453 | El motor **debe** calcular los puntos de cada línea por separado | ✅ |
| RF-454 | El motor **debe** identificar la línea de mayor volumen | ✅ |
| RF-455 | 🔴 De la línea mayor **solo debe** computarse hasta el 50% de los puntos requeridos para rangos desde BRONCE (orden >= 2) en adelante | ✅ |
| RF-455-B | 🔴 **Excepción Oficial Jade (TAREA-68):** Para el rango JADE (orden 1 — 500 pts — 1 frontal), la rama única puede aportar hasta el 100% (500 pts) requeridos, ya que exigir el 50% a un rango que solo pide 1 frontal haría matemáticamente imposible calificar (250 < 500) | ✅ |
| RF-456 | El resto **debe** provenir de las demás líneas (a partir de BRONCE en adelante) | ✅ |
| RF-457 | El motor **debe** contar los frontales activos | ✅ |
| RF-458 | El motor **debe** evaluar los rangos de mayor a menor y detenerse en el primero que califique | ✅ |
| RF-459 | 🔴 El motor **debe** pagar **solo** el bono del rango alcanzado, sin apilar los menores | ✅ |
| RF-460 | El rango honorífico se calcula dinámicamente como el máximo histórico alcanzado en `rango_ciclo` (`fn_rango_lineas_socio`, `servicios/socio.js:256`, `P15MiRango.jsx:97`). *Nota técnica: la columna `socio.rango_honorifico_id` es huérfana.* | ✅ |
| RF-461 | El rango honorífico **nunca debe** bajar, garantizado por el cálculo dinámico del máximo histórico alcanzado en `rango_ciclo` | ✅ |
| RF-462 | El motor **debe** guardar el cálculo intermedio para poder explicarlo | ✅ |
| RF-463 | El motor **debe** leer los umbrales de rango **desde la tabla**, nunca del código | ✅ *los rangos 9–16 se agregan como filas cuando el cliente los defina* |
| RF-464 | **Frontal activo** = afiliado directo (nivel 1) con sus 70 puntos del mes | ✅ *resp. 8.1* |
| RF-465 | Los puntos grupales **NO deben** incluir los puntos personales del socio | ✅ *resp. 8.2* |

---

## RF-470 · BONO GLOBAL SEMESTRAL

| # | Requisito | Estado |
|---|---|---|
| RF-471 | El bono **debe** calcularse cada 6 meses | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-472 | El bono **debe** ser el 1% de los puntos acumulados de la compañía | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-473 | Solo **deben** participar los packs Gold, Familiar y Empresarial | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-474 | El Bono Global **debe** convertir cada punto a **S/. 1.00** | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-475 | Los cortes semestrales **deben** ser **Enero–Junio** y **Julio–Diciembre** | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-476 | El reparto **debe** ser **proporcional al puntaje** de cada calificado | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-477 | El Bono Global **debe** exigir que el socio esté activo **los 6 meses del corte**, no solo el del reparto | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |

---

## RF-480 · CIERRE DE CICLO

| # | Requisito | Estado |
|---|---|---|
| RF-481 | El cierre **debe** bloquear el ciclo antes de calcular | ✅ |
| RF-482 | El cierre **debe** calcular y persistir el rango del ciclo (`02-funciones.sql:2768` vía `fn_calcular_y_persistir_rangos`), aplicando el tope del 50% exclusivamente a la línea de mayor volumen, resolver comisiones retenidas, abonar comisiones a billeteras y abrir el ciclo siguiente | ✅ |
| RF-483 | El cierre **debe** generar una vista previa sin escribir nada | ✅ |
| RF-484 | 🔴 El cierre **debe** verificar que lo pagado no exceda el porcentaje comprometido ni los techos teóricos de patrocinio, residual y rango en Postgres (`fn_ejecutar_cierre_ciclo`) | ✅ |
| RF-485 | Si lo excede, el cierre **debe** bloquearse por excepción SQL (`RAISE EXCEPTION`), cancelando la transacción completa salvo autorización forzada explícita | ✅ |
| RF-486 | El cierre **debe** abonar las comisiones a las billeteras | ✅ |
| RF-487 | El cierre **debe** resetear los puntos a cero | ✅ |
| RF-488 | El histórico de movimientos **no debe** borrarse | ✅ |
| RF-489 | El cierre **debe** dejar el ciclo inmutable | ✅ |
| RF-490 | El sistema **debe** abrir el ciclo siguiente automáticamente | ✅ |

---

## RF-500 · SEGURIDAD

| # | Requisito | Estado |
|---|---|---|
| RF-501 | Todo permiso **debe** validarse en el servidor | ✅ |
| RF-502 | Un socio **solo debe** acceder a datos de su descendencia | ✅ |
| RF-503 | Los datos bancarios **solo debe** verlos su dueño y el administrador | ✅ |
| RF-504 | Las contraseñas **deben** guardarse con hash | ✅ |
| RF-505 | El sistema **debe** limitar intentos de inicio de sesión | ✅ |
| RF-506 | Las sesiones **deben** expirar por inactividad | ✅ |
| RF-507 | El registro de auditoría **debe** ser inmutable | ✅ |

---

## RF-510 · TRANSICIONES PROHIBIDAS

> El sistema **debe impedir activamente** estas transiciones, no solo evitarlas
> por convención.

| # | Transición prohibida | Estado |
|---|---|---|
| RF-511 | Orden `ANULADA` → `PAGADA` | ✅ |
| RF-512 | Ciclo `CERRADO` → `ABIERTO` | ✅ |
| RF-513 | Orden `ENTREGADA` → `POR CONFIRMAR` | ✅ |
| RF-514 | Editar una orden `PAGADA` | ✅ |
| RF-515 | Escribir en un ciclo `CERRADO` | ✅ |
| RF-516 | Confirmar dos veces el mismo pago | ✅ |
| RF-517 | Anular una orden de un ciclo ya cerrado | ✅ |

---

## RF-520 · PRUEBAS OBLIGATORIAS

> Ningún cálculo entra a producción sin su test. Artículo VI de la constitución.

| # | Test | Resultado esperado |
|---|---|---|
| RF-521 | Patrocinio Gold, 7 niveles llenos | S/. 369.60 exactos |
| RF-522 | Patrocinio Empresarial, 7 niveles | S/. 2,464.00 exactos |
| RF-523 | Residual café, 10 niveles llenos | S/. 17.46 exactos |
| RF-524 | Residual con Ejecutivo en nivel 6 | N6 a N10 no se pagan |
| RF-525 | Kit Emprendedor en el upline | No cobra residual |
| RF-526 | Socio inactivo en nivel 4 | N4 no cobra, N5 sí, sin sustituto |
| RF-527 | Línea estirada exactamente al 50% | Se aplica el tope |
| RF-528 | Toda la red en una sola línea | No califica |
| RF-529 | Rango sin frontales suficientes | No califica |
| RF-530 | Ciclo cerrado recibe escritura | La rechaza |
| RF-531 | Doble confirmación de pago | Genera comisiones una sola vez |
| RF-532 | Upgrade a mitad de ciclo | Beneficios inmediatos |
| RF-533 | Red simulada de 500+ socios | El cierre corre completo sin error |
| RF-534 | Suma total de comisiones | Nunca excede lo comprometido |
| RF-535 | Ciclo con todos inactivos | Total pagado = 0 |
| RF-536 | Reseteo de puntos | Todos a cero, histórico intacto |

---

## RESUMEN GLOBAL DE AUDITORÍA (TAREA-50 · 20/09/2026)

| Superficie / Documento | Total | ✅ Cumple | 🔴 No cumple | ❓ Sin código | 🔵 Fuera alcance v1 | ⚠ Caduca |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Web pública (`08-RF-WEB-PUBLICA.md`) | 76 | 68 | 4 | 2 | 2 | 0 |
| Backoffice del socio (`09-RF-BACKOFFICE-SOCIO.md`) | 81 | 80 | 1 | 0 | 0 | 0 |
| Panel de administración (`10-RF-PANEL-ADMIN.md`) | 102 | 100 | 0 | 1 | 1 | 0 |
| Motor y sistema (`11-RF-MOTOR-Y-SISTEMA.md`) | 130 | 119 | 0 | 0 | 9 | 2 |
| **TOTAL** | **389** | **367** | **5** | **3** | **12** | **2** |

**Estado del proyecto:** 389 requisitos auditados con evidencia `archivo:línea`. 367 cumplidos (94.3%), 5 pendientes de corrección de código, 3 sin código implementado, 12 formalmente fuera del alcance de la versión 1 (Acta del cliente) y 2 con cifras a desvincular.

---

## REQUISITOS BLOQUEADOS POR PREGUNTAS AL CLIENTE

**No hay requisitos bloqueados (0).** Todas las decisiones de negocio y preguntas del formulario fueron resueltas o descartadas. Ningún requisito depende de respuestas pendientes del cliente ni de terceros.


---

## RF INCORPORADOS EL 26/08/2026

*Salen de las 40 respuestas del formulario. Todos afectan el cálculo de dinero.*

| RF | Requisito | Estado |
|---|---|---|
| RF-490 | El motor **debe** pagar el Kit Emprendedor con **41.7% al nivel 1 únicamente**, consultando `pack_comision_especial` antes que la escala de patrocinio | ✅ |
| RF-491 | El motor **no debe** aplicar la escala de 7 niveles a los packs que tengan comisión especial | ✅ |
| RF-492 | El motor **debe** comparar el rango del mes con el del mes anterior y **no pagar bono si el socio bajó de rango** | ✅ |
| RF-493 | El motor **no debe** pagar el bono del rango inferior cuando un socio desciende | ✅ |
| RF-494 | El cálculo del rango **debe** usar solo puntos de la red, **excluyendo los puntos personales** del socio | ✅ |
| RF-495 | Un pack **no debe** aportar los puntos de los productos que contiene, solo su `puntos_rango` | ✅ |
| RF-496 | Los precios de producto **deben** guardarse al público; el precio del socio se calcula con su `descuento_recompra_pct` | ✅ |
| RF-497 | El sistema **debe** permitir al socio solicitar retiro con un mínimo de S/. 100 | ✅ |
| RF-498 | El administrador **debe** poder aprobar o rechazar una solicitud de retiro | ✅ |
| RF-499 | El sistema **debe** calcular y mostrar la detracción cuando la comisión supere S/. 700 | ✅ |
| RF-500 | El sistema **debe** permitir dar de baja a un socio y reenganchar su descendencia al patrocinador | ✅ |
| RF-501 | La baja de socio **debe** mostrar vista previa de a quién afecta antes de ejecutarse | ✅ |
| RF-502 | La baja de socio **debe** ejecutarse en una sola transacción y reconstruir `red_ancestro` | ✅ |
| RF-503 | La baja de socio **no debe** permitirse con un ciclo abierto sin cerrar | ✅ |
| RF-504 | El administrador **debe** poder registrar una venta a un cliente que no es socio | ✅ |
| RF-505 | Una venta a cliente sin referido **no debe** generar comisión a ningún socio | ✅ |
| RF-506 | El Bono Global **debe** exigir estar activo los **6 meses** del corte, no solo el del reparto | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-507 | El Bono Global **debe** repartirse proporcional al puntaje de cada calificado | 🔵 Fuera de alcance v1 (*Acta: "Bono Global · Definido, pero fuera del alcance de esta versión"*) |
| RF-508 | El cierre **debe** ejecutarse el último día del mes (`02-funciones.sql:2757` y `P25CierreCiclo.jsx`) y el pago habilitarse 3 días después | ✅ |
| RF-509 | El upgrade de pack **debe** cobrar el pack completo, no la diferencia | ✅ |
| RF-510 | El sistema **no debe** permitir dos cuentas para la misma persona | ✅ |

**Total de esta superficie: 130 requisitos funcionales (119 ✅, 0 🔴, 0 ❓, 9 🔵, 2 ⚠).**

### ❌ Requisitos explícitamente EXCLUIDOS de la v1

| Qué | Motivo |
|---|---|
| Tienda replicada por socio | Rechazado el 26/08. El enlace `?ref=` cubre la atribución |
| Cambio de patrocinador automatizado | Manual. Ocurre "solo en caso extremo" |
| Emisión de factura electrónica | Solo se calcula la detracción |
| Avisos automáticos por correo o WhatsApp | El cliente respondió "no por ahora" |

---

## Tratamiento de imágenes al subirlas

**Añadido el 23/09/2026.** No estaban contados en el total de arriba porque
todavía no se han implementado.

### Por qué existen estos requisitos

Hasta hoy, **ningún documento decía qué formatos admite el sistema, cuánto
pueden pesar ni qué se hace con ellos.** Los límites vivían solo en el código
(`operacionAdmin.js:1634`) y en el instalador (`05-storage.sql`), sin ningún
requisito detrás contra el que verificarlos.

Es el patrón A de la TAREA-50: funcionalidad sin requisito, imposible de
comprobar.

```
   El problema real que resuelven

   Una foto de celular moderno pesa de 3 a 8 MB.
   El bucket de productos corta en 2 MB y el de
   vouchers en 5 MB.

   Máximo fotografía un producto con su teléfono
   y el sistema se lo rechaza. Un socio fotografía
   su voucher y también.
```

### Los requisitos

| ID | Requisito | Estado |
|---|---|---|
| RF-537 | El sistema **debe** aceptar cualquier formato de imagen que el navegador pueda leer, sin restringir por dispositivo ni por sistema operativo | ✅ *verificado por inspección* (`CampoArchivoVoucher.jsx:106`, `P32GestionProductos.jsx:908`, `procesadorImagenes.js:27`) |
| RF-538 | Las fotos de producto **deben** convertirse a WebP antes de subirse | ✅ *verificado por inspección* (`P32GestionProductos.jsx:193`, `operacionAdmin.js:2257`) |
| RF-539 | La conversión **debe** usar WebP con calidad **85**, medida como indistinguible del original a simple vista | ✅ (`tarea60-procesador-imagenes.test.js:324`) |
| RF-540 | La conversión **debe** conservar la transparencia cuando la imagen original la tenga | ✅ (`tarea60-procesador-imagenes.test.js:77`) |
| RF-541 | El comprobante de pago **debe** guardarse tal como lo envió el socio, y convertirse **solo** si excede el límite del almacenamiento | ✅ (`tarea60-procesador-imagenes.test.js:189`, `:216`) |
| RF-542 | Un comprobante en PDF **no debe** convertirse nunca | ✅ (`tarea60-procesador-imagenes.test.js:246`) |
| RF-543 | Si el WebP resultante pesa **igual o más** que el original, el sistema **debe** subir el original y descartar la conversión | ✅ (`tarea60-procesador-imagenes.test.js:106`) |
| RF-544 | Si la conversión de un **comprobante** falla, el sistema **debe** subir el archivo original en lugar de rechazarlo | ✅ (`tarea60-procesador-imagenes.test.js:294`) |
| RF-545 | Si la conversión de una **foto de producto** falla, el sistema **no debe** subir el original: **debe** rechazarla y pedir otra foto | ✅ (`tarea60-procesador-imagenes.test.js:272`) |
| RF-546 | Las fotos de producto **deben** reducirse a un máximo de 1600 px en su lado mayor antes de convertirse | ✅ (`tarea60-procesador-imagenes.test.js:164`) |
| RF-547 | La conversión **debe** respetar la orientación EXIF del original, para que una foto vertical no quede de costado | ✅ (`tarea60-procesador-imagenes.test.js:133`) |
| RF-548 | El sistema **debe** avisar al usuario mientras convierte, y **no debe** bloquear la pantalla | ✅ *verificado por inspección* (`CampoArchivoVoucher.jsx:161-181`, `P32GestionProductos.jsx:913-929`) |
| RF-549 | Los límites de peso y los formatos admitidos **deben** vivir en un solo lugar y coincidir entre el código, el instalador y las dos bases | ✅ (`tarea60-procesador-imagenes.test.js:355`) |

### La regla que manda sobre el comprobante

```
   El voucher no es una foto decorativa.
   Es la prueba de que alguien pagó, y es lo que
   Máximo mira para confirmar dinero.

   Por eso se guarda tal cual siempre que quepa.
   Solo se toca el que no cabría de ninguna forma,
   y ahí es preferible convertirlo a rechazarlo.
```

### Por qué el producto y el comprobante se tratan al revés (RF-544 y RF-545)

Parecen contradictorios y no lo son. Dependen de a quién le duele el fallo.

```
   COMPROBANTE · si falla, se sube el original

   Va a un almacén privado que solo ve Máximo.
   Que pese mucho no le molesta a nadie.
   Perder la prueba de un pago, sí.


   PRODUCTO · si falla, se rechaza

   Va al catálogo público, que hoy pesa 358 KB
   entre las OCHO fotos.

   Una sola foto de celular sin convertir mete
   4 MB ahí dentro. El catálogo se vuelve diez
   veces más pesado y nadie se entera hasta que
   la landing tarda en cargar.

   Una subida rechazada se reintenta.
   Un catálogo lento no avisa.
```

### Medición que sostiene el RF-539

Medido sobre seis imágenes reales del proyecto, el 23/09/2026:

| Imagen | Antes | WebP q85 | |
|---|---|---|---|
| Tarjeta personal | 1,042 KB | 54 KB | −95% |
| Hoja membretada | 1,317 KB | 156 KB | −88% |
| Ícono de perfil | 1,229 KB | 168 KB | −86% |
| Logo con transparencia | 55 KB | 26 KB | −53% |
| Imagen de redes | 63 KB | 50 KB | −21% |
| Foto ya comprimida | 304 KB | **305 KB** | **+0.4%** |

```
   La última es la que justifica el RF-543.

   A calidad 92 esa imagen ENGORDABA. WebP
   intenta preservar los artefactos que el JPEG
   anterior ya había dejado, y gasta bits en
   conservar basura.

   Por eso la regla no es "convertir siempre",
   es "convertir y quedarse con el que pese menos".
```

### Lo que estos requisitos NO piden

```
   · Recortar ni reencuadrar imágenes
   · Poner marcas de agua
   · Generar miniaturas
   · Convertir las imágenes que YA están subidas
```
