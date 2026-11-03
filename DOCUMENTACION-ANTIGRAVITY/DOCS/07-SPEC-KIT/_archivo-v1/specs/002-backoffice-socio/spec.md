# SPEC 002 — BACKOFFICE DEL SOCIO

**Estado:** borrador · **Rama sugerida:** `002-backoffice-socio`
**Fecha:** 25 de agosto de 2026
**Entregable de:** Semana 2 del cronograma

---

## RESUMEN

La oficina virtual del distribuidor. Es donde el socio vive día a día y donde se
juega la retención del negocio.

**La pregunta que el socio se hace cada vez que entra:**
*"¿Cuánto llevo, cuánto me falta y cuánto voy a cobrar?"*

Todo lo demás es secundario. Si esas tres respuestas no están visibles en los
primeros dos segundos, el diseño falló.

---

## CONTEXTO

El socio de Max Global no es un usuario de software. Es un vendedor que entra
desde su celular, entre visita y visita, para ver cómo va.

| Realidad | Consecuencia de diseño |
|---|---|
| Entra desde el celular | Mobile-first obligatorio, no adaptación posterior |
| No entiende de multinivel al inicio | El lenguaje debe explicar, no asumir |
| Le importa el dinero y su red | Puntos y comisiones primero, el resto después |
| Revisa varias veces al mes | La velocidad de carga importa más que la animación |

**La métrica que gobierna esta superficie:** que el socio entienda **por qué**
cobró lo que cobró. Un socio que no entiende su comisión reclama, y el reclamo
llega al sistema.

---

## HISTORIAS DE USUARIO

### HU-1 · El socio revisa si va a cobrar este mes — *prioridad P1*

Entra y necesita saber en segundos si ya está activo, cuántos puntos le faltan
y cuánto lleva acumulado.

**Criterios de aceptación**

1. **Dado** un socio con menos de 70 puntos, **cuando** entra, **entonces** ve
   cuántos le faltan y un acceso directo a la tienda.
2. **Dado** un socio con 70 puntos o más, **cuando** entra, **entonces** ve
   confirmado que está activo este mes.
3. **Dado** cualquier socio, **cuando** entra, **entonces** ve sus puntos
   personales y grupales del ciclo en curso.
4. **Dado** que faltan pocos días para el cierre, **cuando** el socio no está
   activo, **entonces** el aviso es más prominente.

---

### HU-2 · El socio entiende su comisión — *prioridad P1*

Recibió un pago y quiere saber de dónde salió cada sol.

**Por qué es P1:** es lo que evita reclamos. La propuesta firmada compromete
código auditable; la interfaz es donde esa auditoría se vuelve visible.

**Criterios de aceptación**

1. **Dado** un ciclo liquidado, **cuando** el socio abre su historial,
   **entonces** ve cada comisión con su tipo, su nivel y quién la generó.
2. **Dado** una comisión residual, **cuando** la despliega, **entonces** ve qué
   compra la originó, cuántos puntos y qué porcentaje se aplicó.
3. **Dado** un nivel que no cobró, **cuando** el socio lo consulta,
   **entonces** el sistema explica el motivo: pack sin ese nivel habilitado, o
   socio inactivo.

> Este último punto es el que más reclamos evita. El socio no ve un vacío, ve la
> razón.

---

### HU-3 · El socio ve crecer su red — *prioridad P1*

Necesita saber quién está debajo suyo, en qué nivel y si están activos.

**Criterios de aceptación**

1. El árbol muestra hasta 10 niveles de profundidad.
2. Cada persona muestra: nombre, pack, estado activo o inactivo, y sus puntos
   del ciclo.
3. Se puede plegar y desplegar cada rama.
4. En celular el árbol se navega sin zoom ni desplazamiento horizontal.
5. Se distinguen visualmente los frontales (nivel 1) del resto.

---

### HU-4 · El socio compra su recompra mensual — *prioridad P1*

Necesita llegar a sus 70 puntos comprando productos con su descuento.

**Criterios de aceptación**

1. Los precios ya vienen con el descuento de su pack aplicado.
2. El carrito muestra en todo momento cuántos puntos suma la compra.
3. El carrito avisa cuando la compra alcanza los 70 puntos de activación.
4. Al confirmar, el botón abre WhatsApp con el pedido precargado para el asesor.
5. El asesor registra el pedido y el comprobante.
6. Los puntos **no se acreditan** hasta que el administrador confirme el pago.

---

### HU-5 · El socio invita a alguien — *prioridad P2*

Necesita su enlace de patrocinador para compartirlo.

**Criterios de aceptación**

1. Su enlace personal está visible y se copia con un toque.
2. Existe un botón para compartirlo directo por WhatsApp.
3. Si tiene Kit Emprendedor, se le advierte que solo puede afiliar Kit
   Emprendedor.

---

### HU-6 · El socio consulta su rango — *prioridad P2*

Quiere saber en qué rango está y qué le falta para el siguiente.

**Criterios de aceptación**

1. Ve su rango del ciclo en curso y su rango honorífico máximo.
2. Ve cuántos puntos grupales lleva y cuántos exige el siguiente rango.
3. Ve cuántos frontales activos tiene y cuántos necesita.
4. **La regla de línea estirada se explica visualmente**, mostrando cuánto
   aporta cada línea y cuánto se le está computando.

> El punto 4 es el más difícil de comunicar de todo el sistema. Un socio con
> 800 puntos en una sola línea que no califica a Jade con 500 va a reclamar, a
> menos que vea con sus ojos que solo le cuentan 250.

---

## PANTALLAS

### P-01 · Panel principal

| Zona | Contenido |
|---|---|
| Cabecera | Logo · nombre del socio · su rango · salir |
| Estado del mes | **Activo / Le faltan N puntos** — el bloque más visible |
| Contadores | Puntos personales · puntos grupales · frontales activos |
| Billetera | Saldo disponible · comisión estimada del ciclo |
| Accesos rápidos | Comprar · Mi red · Mis comisiones · Mi enlace |
| Avisos | Pago rechazado · cierre próximo · cambio de rango · estado de envío |

---

### P-02 · Mi red — árbol genealógico

Visualización jerárquica plegable, con buscador por nombre o código.

**En celular:** navegación por niveles, no árbol completo. Se entra a una rama
y se vuelve. Nunca desplazamiento horizontal.

**Cada nodo muestra:** nombre, código, pack, estado y puntos del ciclo.

**Resumen superior:** total de la red, activos, inactivos y cuántos por nivel.

---

### P-03 · Tienda de recompra

Grid de los 8 productos con el descuento del socio ya aplicado.

**Cada tarjeta:** imagen, nombre, precio de lista tachado, precio con
descuento, puntaje, selector de cantidad y su propio botón.

**Carrito flotante persistente:** total en soles, total en puntos y la barra de
progreso hacia los 70 puntos de activación.

⏳ *Depende de: tabla de descuentos definitiva y de si los puntos se otorgan
sobre precio de lista o con descuento.*

---

### P-04 · Mis comisiones

Historial por ciclo. Cada ciclo despliega el detalle por tipo:

```
Ciclo agosto 2026 ....................... S/. 1,247.30

  Bono de Patrocinio ............ S/. 369.60
     └─ Nivel 1 · Juan Pérez · Pack Gold · 20% ..... S/. 240.00
     └─ Nivel 2 · Ana Torres · Pack Gold · 4% ...... S/.  48.00

  Bono Residual ................. S/. 727.70
     └─ Nivel 1 · 18 compras · 40% ................. S/. 312.40

  Bono de Rango ................. S/. 150.00
     └─ Rango Plata alcanzado
```

**Requisito clave:** cada línea debe poder desplegarse hasta el origen — qué
orden, qué producto, qué puntos, qué porcentaje.

---

### P-05 · Mi rango

Rango actual, rango honorífico y progreso hacia el siguiente.

**Visualización de la línea estirada:**

```
Para JADE necesitas 500 puntos grupales
Tope por línea (50%): 250 puntos

  Línea de Carlos ...... 800 pts  →  te cuentan 250  (llegó al tope)
  Línea de María ....... 180 pts  →  te cuentan 180
  Línea de José .........  90 pts  →  te cuentan  90
                                     ─────────────────
                          COMPUTABLE: 520 pts   ✓ calificas
```

---

### P-06 · Mi enlace

Enlace personal, botón de copiar, botón de compartir por WhatsApp y contador de
afiliados directos.

---

### P-07 · Mis pedidos

Historial de órdenes con su estado, y acceso a subir voucher en las pendientes.

---

### P-08 · Mi perfil

Datos personales, datos bancarios para el cobro, cambio de contraseña y su pack
actual con opción de mejorarlo.

---

## REQUISITOS FUNCIONALES

| # | Requisito |
|---|---|
| RF-101 | El sistema **debe** mostrar el estado de activación del ciclo en curso |
| RF-102 | El sistema **debe** mostrar puntos personales y grupales en tiempo real |
| RF-103 | El sistema **debe** mostrar el árbol hasta 10 niveles con estado de cada socio |
| RF-104 | El sistema **debe** aplicar el descuento del pack automáticamente en la tienda |
| RF-105 | El sistema **debe** mostrar el avance hacia los 70 puntos en el carrito |
| RF-106 | El sistema **debe** desglosar cada comisión hasta su origen |
| RF-107 | El sistema **debe** explicar por qué un nivel no fue pagado |
| RF-108 | El sistema **debe** mostrar el progreso de rango con la línea estirada explicada |
| RF-109 | El sistema **debe** generar el enlace de patrocinio y permitir compartirlo |
| RF-110 | El sistema **debe** conservar el rango honorífico aunque el socio no se active |
| RF-111 | El sistema **no debe** acreditar puntos antes de la aprobación del voucher |
| RF-112 | El sistema **debe** advertir al Kit Emprendedor su restricción de patrocinio |

---

## REQUISITOS NO FUNCIONALES

| # | Requisito |
|---|---|
| RNF-101 | El panel carga en menos de 2 segundos en 4G |
| RNF-102 | El árbol responde con fluidez con 500 socios en la red |
| RNF-103 | Mobile-first. El árbol se navega sin zoom |
| RNF-104 | Ningún socio puede ver datos de otro fuera de su downline |
| RNF-105 | Los montos se muestran siempre con 2 decimales |
| RNF-106 | Identidad visual según `06-MARCA` |

---

## REGLAS DE SEGURIDAD

| # | Regla |
|---|---|
| SEG-01 | Un socio **solo** ve su propia red descendente |
| SEG-02 | Un socio **nunca** ve el upline por encima de su patrocinador directo |
| SEG-03 | Un socio **nunca** ve comisiones de otro socio |
| SEG-04 | Los datos bancarios de otros socios **nunca** son visibles |
| SEG-05 | Todo acceso a datos se valida en el servidor, no solo en la interfaz |

---

## FUERA DE ALCANCE

- Mensajería interna entre socios
- Material de marketing descargable
- Capacitaciones o cursos
- Notificaciones automáticas por correo o WhatsApp *(no cotizado)*
- Tarjeta digital del socio

---

## PENDIENTES DE DEFINICIÓN

| # | Qué falta | Bloquea |
|---|---|---|
| B-01 | Tabla de descuentos por pack | Tienda de recompra |
| B-02 | Puntos sobre precio de lista o con descuento | Carrito y contadores |
| B-03 | Definición exacta de "frontal activo" | Panel y pantalla de rango |
| B-04 | Si los puntos grupales incluyen los personales | Contadores |
| B-05 | Si el sistema gestiona solicitudes de retiro | Billetera |
| B-06 | Monto mínimo de retiro | Billetera |
| B-07 | Si el upgrade paga la diferencia o el pack completo | Perfil |
| B-08 | Rangos 9 al 16 | Pantalla de rango |

---

## DEPENDENCIAS

| Depende de | Para qué |
|---|---|
| `004-motor-comisiones` | Todo el historial de comisiones y el cálculo de rango |
| `003-panel-admin` | La aprobación de vouchers acredita los puntos |
| `001-web-publica` | El inicio de sesión |
| `06-MARCA` | Identidad visual — **ya disponible** |
