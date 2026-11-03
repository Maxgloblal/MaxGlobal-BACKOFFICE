# REQUISITOS FUNCIONALES — BACKOFFICE DEL SOCIO

**Superficie:** `app.maxglobaloficial.com` · **Fase 2**
**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Numeración:** RF-2xx

---

## RT · TRANSVERSALES DE ESTA SUPERFICIE

| # | Requisito | Estado |
|---|---|---|
| RT-10 | El panel **debe** cargar en menos de 2 segundos en 4G | ✅ |
| RT-11 | Toda la superficie **debe** ser mobile-first | ✅ |
| RT-12 | Los montos **deben** mostrarse siempre con 2 decimales | ✅ |
| RT-13 | Todo permiso **debe** validarse en el servidor, nunca solo en la interfaz | ✅ |
| RT-14 | El árbol **debe** responder con fluidez con 500 socios en la red | ✅ |

---

## P-10 · INICIO DE SESIÓN

| # | Requisito | Estado |
|---|---|---|
| RF-201 | El sistema **debe** autenticar con correo y contraseña | ✅ |
| RF-202 | El sistema **debe** limitar los intentos fallidos de inicio de sesión | ✅ |
| RF-203 | El sistema **debe** permitir recuperar contraseña sin intervención del administrador | ✅ |
| RF-204 | Las contraseñas **deben** guardarse con hash, nunca en texto plano | ✅ |
| RF-205 | La sesión **debe** expirar por inactividad | ✅ |

### Redirección según estado

| # | Requisito | Estado |
|---|---|---|
| RF-206 | Un socio `ACTIVO` **debe** ir a su panel completo | ✅ |
| RF-207 | Un socio `PENDIENTE` **debe** ver solo el estado de su solicitud | ✅ |
| RF-208 | Un socio `INACTIVO` **debe** entrar a su panel con aviso visible | ✅ |
| RF-209 | Un socio `SUSPENDIDO` **debe** ver una pantalla informativa con contacto | ✅ |

---

## P-11 · PANEL PRINCIPAL

> **La pregunta que responde esta pantalla:** *"¿cuánto llevo, cuánto me falta
> y cuánto voy a cobrar?"*

| # | Requisito | Estado |
|---|---|---|
| RF-210 | El panel **debe** mostrar el estado de activación del ciclo como elemento más visible | ✅ |
| RF-211 | Si le faltan puntos, **debe** indicar cuántos y ofrecer acceso directo a la tienda | ✅ |
| RF-212 | El panel **debe** mostrar puntos personales del ciclo | ✅ |
| RF-213 | El panel **debe** mostrar puntos grupales del ciclo | ✅ |
| RF-214 | El panel **debe** mostrar cuántos frontales activos tiene | ✅ |
| RF-215 | El panel **debe** mostrar el saldo disponible de su billetera | ✅ |
| RF-216 | El panel **debe** mostrar su rango vigente y su rango honorífico | ✅ |
| RF-217 | El panel **debe** avisar cuando falten pocos días para el cierre | ✅ |
| RF-218 | El aviso de cierre **debe** ser más prominente si el socio no está activo | ✅ |
| RF-219 | El panel **debe** mostrar avisos de pagos rechazados y cambios de estado de envío | ✅ P11PanelSocio.jsx:248 |

---

## P-12 · MI RED — ÁRBOL GENEALÓGICO

| # | Requisito | Estado |
|---|---|---|
| RF-220 | El árbol **debe** mostrar hasta 10 niveles de descendencia | ✅ |
| RF-221 | Cada nodo **debe** mostrar nombre, código, pack, estado y puntos del ciclo | ✅ |
| RF-222 | El sistema **debe** distinguir visualmente los frontales del resto | ✅ |
| RF-223 | El árbol **debe** poder plegarse y desplegarse por rama | ✅ |
| RF-224 | En celular el árbol **debe** navegarse por niveles, sin desplazamiento horizontal | ✅ |
| RF-225 | El sistema **debe** ofrecer buscador por nombre o código dentro de su red | ✅ |
| RF-226 | El sistema **debe** mostrar un resumen: total, activos e inactivos | ✅ |
| RF-227 | Un socio `PENDIENTE` **no debe** aparecer en el árbol | ✅ |

### Seguridad del árbol

| # | Requisito | Estado |
|---|---|---|
| RF-228 | El socio **solo** puede ver su descendencia, nunca su upline | ✅ |
| RF-229 | El socio **no debe** ver comisiones ni datos bancarios de nadie de su red | ✅ |

---

## P-13 · TIENDA DE RECOMPRA

| # | Requisito | Estado |
|---|---|---|
| RF-230 | La tienda **debe** mostrar todos los productos activos con el `descuento_recompra_pct` del pack del socio ya aplicado | ✅ *confirmado 25/08* |
| RF-231 | Cada producto **debe** mostrar precio de lista tachado y precio final | ✅ |
| RF-232 | Cada producto **debe** mostrar su puntaje | ✅ |
| RF-233 | El carrito **debe** mostrar en todo momento el total en soles y en puntos | ✅ |
| RF-234 | El carrito **debe** mostrar el avance hacia los 70 puntos de activación | ✅ |
| RF-235 | El sistema **debe** avisar cuando el carrito alcance los 70 puntos | ✅ |
| RF-236 | Al confirmar, el sistema **debe** abrir WhatsApp con el pedido precargado | ✅ |
| RF-237 | El mensaje **debe** incluir productos, cantidades, total, código y nombre del socio | ✅ |
| RF-238 | El socio **no debe** poder registrar el pedido ni subir comprobantes | ✅ |
| RF-239 | Los puntos **no deben** acreditarse hasta que el administrador confirme el pago | ✅ |

---

## P-14 · MIS COMISIONES

> **El requisito que más reclamos evita del sistema entero.**

| # | Requisito | Estado |
|---|---|---|
| RF-240 | El historial **debe** organizarse por ciclo mensual | ✅ |
| RF-241 | Cada ciclo **debe** desglosarse por tipo de bono | ✅ |
| RF-242 | Cada comisión **debe** mostrar tipo, nivel, quién la generó y el porcentaje aplicado | ✅ |
| RF-243 | Cada comisión residual **debe** poder desplegarse hasta la orden que la originó | ✅ |
| RF-244 | 🔴 El sistema **debe** explicar por qué un nivel **no** fue pagado | ✅ |
| RF-245 | Los motivos posibles son: pack sin ese nivel habilitado, o socio inactivo | ✅ |
| RF-246 | El sistema **debe** mostrar el total cobrado por ciclo | ✅ |

> **RF-244 es la diferencia entre un socio que entiende y un socio que
> reclama.** No ve un vacío, ve la razón.

---

## P-15 · MI RANGO

| # | Requisito | Estado |
|---|---|---|
| RF-250 | La pantalla **debe** mostrar el rango del ciclo vigente calculado dinámicamente en vivo de mayor a menor jerarquía | ✅ |
| RF-251 | La pantalla **debe** mostrar el rango honorífico máximo alcanzado | ✅ |
| RF-252 | La pantalla **debe** mostrar cuántos puntos grupales lleva y cuántos exige el rango siguiente real | ✅ |
| RF-253 | La pantalla **debe** mostrar frontales activos actuales y requeridos | ✅ |
| RF-254 | 🔴 La pantalla **debe** explicar visualmente la regla de línea estirada | ✅ |
| RF-255 | Debe mostrar, línea por línea, cuánto aporta y cuánto se le computa | ✅ |
| RF-256 | Debe indicar explícitamente cuando la línea mayor llegó al tope del 50% del rango meta | ✅ |
| RF-257 | La pantalla **debe** mostrar la escala de rangos **leyéndola de la tabla**, no del código | ✅ *los rangos 9–16 se agregan desde el panel cuando el cliente los defina* |
| RF-258 | El rango meta evaluado en ciclo abierto **debe** fijarse dinámicamente en el orden siguiente al rango ya alcanzado en vivo (`orden + 1`), permitiendo saltos de múltiples rangos en un mismo ciclo | ✅ |
| RF-259 | La pantalla **debe** ofrecer la Doble Perspectiva de Análisis conmutable: (1) **Plan Conquistado (Rango Actual)** encuadrado con el tope del 50% de su rango conquistado para auditar la calificación exacta y el bono que cobrará, y (2) **Para Conquistar (Próxima Meta)** con el tope ampliado al 50% del rango siguiente para visualizar la meta y lo que falta ascender | ✅ |
| RF-259b | **Parche Jade (TAREA-68):** Para el rango JADE (orden 1 / 500 pts), al exigir únicamente 1 frontal activo en la escala oficial, la línea mayor **no** sufre recorte del 50%, permitiendo computar hasta el 100% de los 500 puntos exigidos. A partir de BRONCE (orden >= 2) rige la regla estricta de línea estirada del 50% | ✅ |
| RF-259c | **Liquidación y Pago sobre Rango Conquistado:** Al cierre mensual, las comisiones de rango se liquidan y pagan **exclusivamente sobre el rango efectivamente conquistado** (con su tope del 50% de dicho rango y bono correspondiente), garantizando que la proyección al siguiente nivel sea únicamente métrica de carrera | ✅ |

> **RF-254 a RF-259c:** El tope del 50% aplica a cada brazo frontal hacia el rango evaluado.
> - **Encuadre Conquistado:** Muestra cómo conquistó su rango actual (ej. para Oro, el tope es 2,000 pts y Anita aporta 2,000 pts; suma 4,538 >= 4,000 pts y cobra S/. 500.00).
> - **Para Conquistar:** Muestra el camino hacia el siguiente rango (ej. hacia Platino, el tope se amplía a 4,000 pts y Anita aporta 4,000 pts; suma 6,538 / 8,000 pts y faltan 1,462 pts para ascender a S/. 1,500.00).
> - **Al cierre del ciclo:** El motor liquida con el monto y rango conquistado en firme. Si no alcanzó Platino, se le paga Oro.
> - **Excepción Jade:** Para Jade (500 pts y 1 frontal), la rama única aporta hasta el 100% (500 pts).

---

## P-16 · MI ENLACE DE PATROCINIO

| # | Requisito | Estado |
|---|---|---|
| RF-260 | El sistema **debe** mostrar el enlace personal del socio | ✅ |
| RF-261 | El enlace **debe** copiarse con un toque | ✅ |
| RF-262 | El sistema **debe** ofrecer compartir directo por WhatsApp | ✅ |
| RF-263 | Un Kit Emprendedor **debe** ver la advertencia de que solo puede afiliar Kit Emprendedor | ✅ |
| RF-264 | El sistema **debe** mostrar cuántos afiliados directos lleva | ✅ |

---

## P-17 · MIS PEDIDOS

| # | Requisito | Estado |
|---|---|---|
| RF-270 | El socio **debe** ver el historial de sus pedidos con su estado | ✅ |
| RF-271 | El socio **debe** ver el detalle de cada pedido: productos, montos y puntos | ✅ |
| RF-272 | El socio **debe** ver el estado del envío y el número de guía | ✅ |
| RF-273 | El socio **debe** ver el motivo cuando un pago fue rechazado | ✅ |
| RF-274 | El socio **no debe** poder editar ni anular un pedido | ✅ |

---

## P-18 · MI PERFIL

| # | Requisito | Estado |
|---|---|---|
| RF-280 | El socio **debe** poder editar sus datos personales y de contacto | ✅ |
| RF-281 | El socio **debe** poder editar su dirección de envío por defecto | ✅ |
| RF-282 | El socio **debe** poder registrar sus datos bancarios para el cobro | ✅ |
| RF-283 | El socio **debe** poder cambiar su contraseña | ✅ |
| RF-284 | El socio **debe** ver su pack actual y poder solicitar mejora | ✅ |
| RF-285 | La solicitud de mejora **debe** generar un pedido por el **pack completo**, no por la diferencia | ✅ *resp. 13.3* |
| RF-286 | El socio **no debe** poder cambiar su patrocinador | ✅ |

---

## P-19 · MI BILLETERA

| # | Requisito | Estado |
|---|---|---|
| RF-290 | El socio **debe** ver su saldo disponible | ✅ |
| RF-291 | El socio **debe** ver el historial de movimientos con su concepto | ✅ |
| RF-292 | El socio **debe** ver la comisión estimada del ciclo en curso | ✅ |
| RF-293 | El sistema **debe** permitir solicitar retiro, con aprobación del administrador | ✅ *resp. 12.4* |
| RF-294 | El sistema **debe** validar el monto mínimo de retiro de **S/. 100** | ✅ *resp. 12.3* |

---

## RESUMEN DE ESTA SUPERFICIE (TAREA-50 · 20/09/2026)

| Estado | Cantidad |
|---|:---:|
| ✅ Cumple | 81 |
| 🔴 No cumple | 0 |
| ❓ Sin código | 0 |
| 🔵 Fuera de alcance v1 | 0 |
| ⚠ Caduca | 0 |
| **Total** | **81** |

**Bloqueados esperando al cliente:** 0 (todas las preguntas del formulario fueron resueltas o descartadas).
