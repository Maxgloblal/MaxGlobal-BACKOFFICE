# REQUISITOS FUNCIONALES — PANEL DE ADMINISTRACIÓN

**Superficie:** `app.maxglobaloficial.com/admin` · **Fase 2**
**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Numeración:** RF-3xx

---

> ## SUPERFICIE DE MÁXIMO RIESGO
>
> Desde acá se aprueba el dinero que entra y se liquida el que sale.
>
> **Principio que gobierna todo el panel:** toda acción con consecuencia
> financiera debe ser **explícita, mostrada antes de ejecutarse, y auditada
> siempre**.

---

## RT · TRANSVERSALES DE ESTA SUPERFICIE

| # | Requisito | Estado |
|---|---|---|
| RT-20 | El panel **debe** estar optimizado para escritorio | ✅ |
| RT-21 | El acceso **debe** restringirse a usuarios con rol administrador | ✅ |
| RT-22 | Ninguna acción destructiva **debe** ejecutarse sin confirmación explícita | ✅ |
| RT-23 | Toda acción financiera **debe** quedar auditada con autor y marca de tiempo | ✅ |
| RT-24 | El lenguaje **debe** ser del negocio, nunca términos de base de datos | ✅ |
| RT-25 | La sesión **debe** expirar por inactividad | ✅ |

---

## P-20 · TABLERO

| # | Requisito | Estado |
|---|---|---|
| RF-301 | El tablero **debe** mostrar cuántos pedidos esperan confirmación | ✅ |
| RF-302 | El tablero **debe** mostrar cuántos días faltan para el cierre del ciclo | ✅ |
| RF-303 | El volumen acumulado del ciclo se reporta en P-28 (Reportes), reservando P-20 para métricas de operación diaria | ✅ |
| RF-304 | El tablero **debe** mostrar socios activos e inactivos del ciclo | ✅ |
| RF-305 | El tablero **debe** mostrar la comisión estimada del ciclo | ✅ |
| RF-306 | El tablero **debe** alertar si hay configuración incompleta | ❓ *Sin código · Pendiente de construcción. Motivo: url_landing apuntó a la dirección de Vercel en producción durante días y se encontró de casualidad. Una alerta en el tablero lo habría cantado el primer día.* |

---

## P-21 · REGISTRAR PEDIDO

> En la v1 esta pantalla la usa el administrador. Es la que reemplaza al panel
> del asesor.

| # | Requisito | Estado |
|---|---|---|
| RF-310 | El sistema **debe** permitir buscar socios por código, nombre o documento | ✅ |
| RF-311 | 🔴 Al encontrar el socio, el sistema **debe** mostrar nombre, pack, estado y patrocinador | ✅ |
| RF-312 | 🔴 El sistema **no debe** permitir guardar sin confirmación visual del socio | ✅ |
| RF-313 | El sistema **debe** aplicar el `descuento_recompra_pct` del pack **del socio**, no del operador | ✅ *confirmado 25/08* |
| RF-314 | El sistema **debe** mostrar el puntaje acumulado del pedido mientras se arma | ✅ |
| RF-315 | El sistema **debe** exigir comprobante: foto, banco, número de operación, monto y fecha | ✅ |
| RF-316 | El sistema **debe** capturar los datos de envío: dirección, agencia y costo | ✅ |
| RF-317 | El costo de envío **debe** guardarse como línea separada, sin generar puntos | ✅ |
| RF-318 | El sistema **debe** advertir si el monto declarado no coincide con el esperado | ✅ |
| RF-319 | El pedido guardado **debe** quedar en estado `POR CONFIRMAR` | ✅ |
| RF-320 | El sistema **debe** registrar quién creó el pedido | ✅ |

> **RF-311 y RF-312 son el control más importante de esta pantalla.** El código
> del socio decide quién cobra las comisiones de toda la línea. Un código mal
> escrito manda el dinero a otra persona, y como las comisiones son inmutables,
> corregirlo exige asientos inversos en cascada por 10 niveles.

---

## P-22 · REGISTRAR AFILIACIÓN

| # | Requisito | Estado |
|---|---|---|
| RF-330 | El sistema **debe** permitir crear un socio nuevo con todos sus datos | ✅ |
| RF-331 | 🔴 El patrocinador **debe** confirmarse visualmente igual que en RF-311 | ✅ |
| RF-332 | El sistema **debe** aplicar la restricción del Kit Emprendedor | ✅ |
| RF-333 | El sistema **debe** validar unicidad de correo y documento | ✅ |
| RF-334 | El socio nuevo **debe** quedar en estado `PENDIENTE` | ✅ |
| RF-335 | El sistema **debe** generar y mostrar el código de socio asignado | ✅ |

---

## P-23 · BANDEJA DE CONFIRMACIÓN — 🔥 la pantalla crítica

| # | Requisito | Estado |
|---|---|---|
| RF-340 | La bandeja **debe** listar los pedidos pendientes ordenados por antigüedad | ✅ |
| RF-341 | Cada pedido **debe** mostrar comprobante, socio, tipo, monto esperado y declarado | ✅ |
| RF-342 | El sistema **debe** destacar visiblemente cuando los montos no coincidan | ✅ |
| RF-343 | El comprobante **debe** poder ampliarse para leerlo | ✅ |
| RF-344 | 🔴 Antes de confirmar, el sistema **debe** mostrar **qué va a ocurrir** | ✅ |
| RF-345 | Debe indicar: qué socio se activa, qué puntos se acreditan y cuántas comisiones se generan, con el monto total | ✅ |
| RF-346 | La confirmación **debe** ser explícita, no un clic simple | ✅ |
| RF-347 | 🔴 El sistema **debe** impedir la doble confirmación del mismo pedido | ✅ |
| RF-348 | Al confirmar, el pedido **debe** pasar a `PAGADA` y dispararse el motor de comisiones | ✅ |
| RF-349 | Al confirmar una afiliación, el socio **debe** pasar a `ACTIVO` | ✅ |
| RF-350 | Al rechazar, el motivo **debe** ser obligatorio | ✅ |
| RF-351 | Un pedido rechazado **debe** poder volver a `POR CONFIRMAR` con otro comprobante | ✅ |
| RF-352 | Toda confirmación **debe** registrar quién la hizo y cuándo | ✅ |

> **RF-347 es el riesgo más peligroso del sistema.** Un doble clic generaría
> las comisiones de toda una línea dos veces. Necesita protección real, no solo
> deshabilitar el botón en pantalla.

---

## P-24 · ENVÍOS

| # | Requisito | Estado |
|---|---|---|
| RF-360 | El sistema **debe** listar los pedidos pagados pendientes de despacho | ✅ |
| RF-361 | El sistema **debe** permitir marcar un pedido como despachado | ✅ |
| RF-362 | Al despachar, el sistema **debe** capturar agencia y número de guía | ✅ |
| RF-363 | El sistema **debe** permitir marcar como entregado | ✅ |
| RF-364 | El sistema **debe** permitir registrar una incidencia con su motivo | ✅ |
| RF-365 | Ningún estado de envío **debe** alterar puntos ni comisiones | ✅ |
| RF-366 | El sistema **debe** poder imprimir la etiqueta de envío con los datos del destinatario | ✅ |

---

## P-25 · CIERRE DE CICLO — 🔥 la operación más delicada

| # | Requisito | Estado |
|---|---|---|
| RF-370 | El cierre **debe** ejecutarse en pasos, no en una sola acción | ✅ |
| RF-371 | El sistema **debe** verificar previamente si hay pedidos sin confirmar (bloqueando el cierre transaccionalmente en `fn_ejecutar_cierre_ciclo` salvo bandera `p_forzar`) | ✅ |
| RF-372 | El sistema **debe** verificar previamente si hay configuración incompleta | ✅ |
| RF-373 | 🔴 El sistema **debe** mostrar una **vista previa** antes de escribir nada | ✅ |
| RF-374 | La vista previa **debe** mostrar socios activos, total por cada bono y total a pagar | ✅ |
| RF-375 | 🔴 Desde la vista previa **debe** poder cancelarse sin que se escriba nada | ✅ |
| RF-376 | 🔴 El sistema **debe** bloquear el cierre si el total excede el porcentaje comprometido o techos teóricos (validación dual: UI y Postgres transaccional en `fn_ejecutar_cierre_ciclo`) | ✅ |
| RF-377 | La ejecución **debe** requerir confirmación explícita | ✅ |
| RF-378 | Al ejecutar, el sistema **debe** calcular activación, residual, rango y bono global si toca | ✅ |
| RF-379 | Al ejecutar, el sistema **debe** abonar todas las comisiones a las billeteras | ✅ |
| RF-380 | Al cerrar, el sistema **debe** resetear los puntos a cero | ✅ |
| RF-381 | El histórico de movimientos **no debe** borrarse en el reseteo | ✅ |
| RF-382 | Un ciclo cerrado **no debe** admitir escrituras | ✅ |
| RF-383 | El sistema **debe** abrir automáticamente el ciclo siguiente | ✅ |
| RF-384 | El sistema **debe** permitir exportar la liquidación para el pago bancario | ✅ |
| RF-385 | La exportación **debe** incluir socio, monto, banco y cuenta | ✅ |

> **RF-376 es la última red de seguridad del sistema.** Si por un error de
> configuración o anomalía de datos el cálculo sale desproporcionado, el cierre se bloquea tanto en la interfaz como en el RPC de base de datos `fn_ejecutar_cierre_ciclo` (TAREA-67).

---

## P-26 · CONFIGURACIÓN DEL PLAN

| # | Requisito | Estado |
|---|---|---|
| RF-390 | El sistema **debe** permitir editar los 7 porcentajes de patrocinio | ✅ |
| RF-391 | El sistema **debe** permitir editar los 10 porcentajes residuales | ✅ |
| RF-392 | El sistema **debe** permitir editar precio, puntaje y estado de cada producto | ✅ |
| RF-393 | El sistema **debe** permitir editar precio, puntos, niveles y descuento de cada pack | ✅ |
| RF-394 | El sistema **debe** permitir cargar y editar los 16 rangos | ✅ |
| RF-395 | El sistema **debe** permitir editar valor del punto, puntos de activación y límite de línea estirada | ✅ |
| RF-396 | El sistema **debe** permitir editar día de cierre y de pago. **Por defecto: último día del mes y 3 días después** | ✅ *resp. 12.1 y 12.2* |
| RF-397 | El sistema **debe** permitir gestionar las cuentas bancarias desde el panel | ✅ *el dato del cliente se carga después, no bloquea* |
| RF-398 | 🔴 Todo cambio **debe** auditarse con autor, fecha, valor anterior y nuevo | ✅ |
| RF-399 | 🔴 Un cambio de configuración **no debe** alterar ciclos ya cerrados | ✅ |
| RF-400 | El sistema **debe** advertir al editar el valor del punto de comisión | ✅ |
| RF-401 | El sistema **debe** advertir que el nivel 8 residual es intencional y no un error | ✅ |

> **RF-401 existe para impedir que alguien "corrija" el N8 al 10%.**

---

## P-27 · GESTIÓN DE SOCIOS

| # | Requisito | Estado |
|---|---|---|
| RF-410 | El sistema **debe** listar socios con filtros por estado, pack, rango y fecha | ✅ *TAREA-72: Filtro por rango honorífico en P-27 y operacionAdmin* |
| RF-411 | El sistema **debe** ofrecer buscador por nombre, código o documento | ✅ |
| RF-412 | La ficha **debe** mostrar datos, pack, patrocinador, red, órdenes, comisiones y puntos por ciclo | ✅ |
| RF-413 | El sistema **debe** permitir editar los datos de un socio | ✅ |
| RF-414 | El sistema **debe** permitir suspender y reactivar, con motivo obligatorio | ✅ |
| RF-415 | El sistema **debe** permitir cambiar el pack manualmente, con motivo | ✅ |
| RF-416 | El sistema **debe** ver el árbol completo desde cualquier socio | ✅ |
| RF-417 | Toda acción sobre un socio **debe** quedar auditada | ✅ |
| RF-418 | Al dar de baja, la descendencia **debe** engancharse al patrocinador del socio dado de baja | ✅ *resp. 14.2* |
| RF-419 | El cambio de patrocinador **NO se construye en la v1** — se hace manualmente | ❌ *fuera de alcance. Ocurre "solo en caso extremo"* |

---

## P-28 · REPORTES

| # | Requisito | Estado |
|---|---|---|
| RF-430 | El sistema **debe** generar la liquidación del ciclo, exportable | ✅ |
| RF-431 | El sistema **debe** reportar volumen de ventas por periodo | ✅ |
| RF-432 | El sistema **debe** reportar crecimiento de red por periodo | ✅ |
| RF-433 | El sistema **debe** reportar rangos alcanzados por ciclo | ✅ *TAREA-71/72: Sección dedicada "Socios por rango"* |
| RF-434 | El sistema **debe** reportar comisiones por tipo de bono | ✅ |
| RF-435 | El sistema **debe** reportar cuánto quedó en la empresa por niveles no pagados | ✅ |
| RF-436 | El sistema **debe** listar los socios calificados por rango en un ciclo cerrado con datos persistidos de rango_ciclo (puntos computables, frontales activos y bono) | ✅ |
| RF-437 | El sistema **debe** calcular y reportar en vivo los socios por rango para el ciclo abierto sin alterar la base de datos (con aviso explícito) | ✅ |
| RF-438 | El sistema **debe** reportar el histórico consolidado de rangos honoríficos más altos alcanzados por los socios | ✅ |
| RF-439 | El sistema **debe** permitir exportar la nómina de socios por rango a archivo CSV respetando los filtros activos | ✅ |

> **RF-435 le muestra a Max Global el efecto real de la regla de no
> compresión.** Es información que ninguna otra pantalla da.

---

## P-29 · AUDITORÍA

| # | Requisito | Estado |
|---|---|---|
| RF-440 | El sistema **debe** registrar toda acción sensible con autor, fecha y datos antes y después | ✅ |
| RF-441 | El registro **debe** filtrarse por usuario, tipo de acción y fechas | ✅ |
| RF-442 | 🔴 El registro de auditoría **no debe** poder editarse ni borrarse | ✅ |

---

## P-30 · GESTIÓN DE RETIROS Y PAGO DIRECTO

| # | Requisito | Estado |
|---|---|---|
| RF-445 | El administrador **debe** poder buscar socios con saldo disponible mediante búsqueda predictiva por código, nombre o DNI | ✅ |
| RF-446 | El sistema **debe** mostrar en tiempo real el saldo disponible en billetera (`v_wallet_saldo`) del socio seleccionado | ✅ |
| RF-447 | El sistema **debe** rechazar montos menores o iguales a cero, o que superen el saldo disponible del socio | ✅ |
| RF-448 | El pago directo **debe** debitar la billetera de forma append-only en `wallet_movimiento` con monto negativo y actualizar la continuidad de saldo | ✅ |
| RF-449 | El pago directo **debe** registrarse automáticamente como `solicitud_retiro` en estado `'aprobado'` para unificar el historial contable del admin (P-30) y del socio (P-19) | ✅ |
| RF-450 | Todo pago directo **debe** registrarse en auditoría con acción `'PAGO_DIRECTO_SALDO_SOCIO'`, datos antes y después, y admin responsable | ✅ |

---

## RESUMEN DE ESTA SUPERFICIE (TAREA-50 · 20/09/2026)

| Estado | Cantidad |
|---|:---:|
| ✅ Cumple | 100 |
| 🔴 No cumple | 0 |
| ❓ Sin código | 1 *(RF-306 alerta de configuración incompleta en cierre P-25)* |
| 🔵 Fuera de alcance v1 | 1 *(RF-419 cambio de patrocinador automatizado)* |
| ⚠ Caduca | 0 |
| **Total** | **102** |

**Bloqueados esperando al cliente:** 0 (todas las preguntas del formulario fueron resueltas o descartadas).
