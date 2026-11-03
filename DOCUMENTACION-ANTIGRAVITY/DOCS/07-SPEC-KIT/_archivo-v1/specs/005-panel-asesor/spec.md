# SPEC 005 — PANEL DEL ASESOR

**Estado:** 📌 **FASE 2 — no se construye en la versión 1**
**Rama sugerida:** `005-panel-asesor` · **Fecha:** 25 de agosto de 2026

> ## ⚠️ ESTA SPEC ESTÁ CONGELADA
>
> **Decisión del 25/08:** *"no cualquiera vende"*. En la v1 **todas las ventas
> se registran y confirman desde el panel de administración**. El rol asesor no
> se construye.
>
> El modelo de datos ya lo soporta (`rol = 'asesor'`, `orden.asesor_id`), así
> que habilitarlo después no exige reestructurar nada.
>
> **Todo lo que sigue describe lo que hará el administrador en la v1.**

---

## RESUMEN

Se elimina que el socio suba comprobantes. En su lugar entra un **tercer rol:
el asesor**, que toma el pedido por WhatsApp, lo registra en el sistema y sube
el comprobante.

**Motivo del cambio:** en Latinoamérica la venta ocurre en WhatsApp. Pedirle al
cliente que entre a una web, arme un carrito, deposite, fotografíe el voucher y
lo suba es fricción en el punto exacto donde se cae la venta.

---

## EL FLUJO NUEVO

```
1. El cliente arma su carrito en la web
        ↓
2. Pulsa "Pedir por WhatsApp"
   → se abre el chat de un asesor con el pedido precargado
        ↓
3. Conversación humana: el asesor resuelve dudas y cierra la venta
        ↓
4. El cliente deposita y le manda la foto del voucher al asesor
        ↓
5. EL ASESOR entra al sistema y registra:
   · Los productos del pedido
   · El código del socio a cuyo nombre va la compra   ← crítico
   · La foto del voucher
   · Banco, monto y fecha
        ↓
6. El administrador confirma el pago
        ↓
7. Se disparan las comisiones
```

**Lo que desaparece:** la pantalla de subida para el socio, el flujo de rechazo
con notificación, y el manejo de imágenes del lado del cliente.

**Lo que se mantiene obligatoriamente:** la confirmación del pago en el panel.
Es el único evento que genera comisiones.

---

## 🔴 EL RIESGO PRINCIPAL DE ESTE DISEÑO

> El asesor escribe **a nombre de quién** va la compra. Ese código determina
> quién recibe los puntos y quién cobra las comisiones de toda la línea.
>
> **Un código mal escrito manda el dinero a la persona equivocada.**

Y como las comisiones son inmutables, corregirlo después exige un asiento
inverso en cascada por los 10 niveles.

### Mitigación obligatoria

El sistema **no acepta un código a ciegas**. Al escribirlo debe mostrar de
inmediato a quién pertenece, y el asesor tiene que confirmarlo visualmente:

```
Código: MG-0847
        ↓
   ┌──────────────────────────────────────┐
   │  María Torres Quispe                 │
   │  Pack Gold · Activa · Ayacucho       │
   │  Patrocinador: Carlos Mendoza        │
   │                                      │
   │  [ No es esta persona ]  [ Confirmar ]│
   └──────────────────────────────────────┘
```

**Sin esa confirmación visual, el pedido no se puede guardar.**

---

## HISTORIAS DE USUARIO

### HU-1 · El asesor registra un pedido — *prioridad P1*

Cerró una venta por WhatsApp y necesita registrarla en el sistema.

**Criterios de aceptación**

1. **Dado** un asesor con sesión iniciada, **cuando** crea un pedido nuevo,
   **entonces** puede buscar al socio por código, nombre o documento.
2. **Dado** un código ingresado, **cuando** el sistema lo encuentra,
   **entonces** muestra nombre, pack, estado y patrocinador para confirmación
   visual.
3. **Dado** un socio sin confirmar, **cuando** el asesor intenta guardar,
   **entonces** el sistema lo impide.
4. **Dado** un socio confirmado, **cuando** el asesor arma el pedido,
   **entonces** los precios se calculan con el descuento del pack **de ese
   socio**, no del asesor.
5. **Dado** un pedido armado, **cuando** el asesor lo guarda, **entonces** debe
   adjuntar el comprobante con banco, monto y fecha.
6. **Dado** un pedido guardado, **cuando** se confirma, **entonces** queda en
   estado POR CONFIRMAR y aparece en la bandeja del administrador.

---

### HU-2 · El asesor registra una afiliación nueva — *prioridad P1*

Una persona quiere afiliarse y el asesor la registra completa.

**Criterios de aceptación**

1. El asesor puede crear el socio nuevo: datos personales, pack y patrocinador.
2. **El patrocinador se confirma visualmente igual que en HU-1.**
3. Se aplica la restricción del Kit Emprendedor.
4. El socio nuevo queda en estado PENDIENTE hasta la confirmación del pago.

---

### HU-3 · El asesor consulta sus ventas — *prioridad P2*

Necesita ver qué registró y en qué estado está.

**Criterios de aceptación**

1. Ve sus pedidos del mes con estado: por confirmar, confirmado, rechazado.
2. Ve el motivo cuando un pedido fue rechazado.
3. Puede corregir un pedido **solo mientras esté POR CONFIRMAR**.

---

## PANTALLAS

### P-01 · Tablero del asesor

Pedidos por confirmar, confirmados del mes, monto total registrado y accesos
rápidos: *Nuevo pedido* · *Nueva afiliación* · *Mis ventas*.

---

### P-02 · Nuevo pedido — la pantalla principal

```
Paso 1  ¿A nombre de quién es la compra?
        [ buscador por código, nombre o documento ]
        → tarjeta de confirmación visual obligatoria

Paso 2  Productos
        Catálogo con el descuento del socio YA aplicado
        Contador de puntos visible

Paso 3  Comprobante
        Foto del voucher · banco · número de operación
        · monto · fecha del depósito

Paso 4  Revisión y guardado
        Resumen completo antes de confirmar
```

**Aviso permanente en pantalla:**
> Verifica el nombre del socio antes de guardar. Las comisiones se calculan
> sobre este código.

---

### P-03 · Nueva afiliación

Igual que el registro público, pero operado por el asesor: datos del nuevo
socio, patrocinador **con confirmación visual**, pack y comprobante.

---

### P-04 · Mis ventas

Lista de pedidos registrados con su estado y filtros por fecha.

---

## REQUISITOS FUNCIONALES

| # | Requisito |
|---|---|
| RF-501 | El sistema **debe** permitir buscar socios por código, nombre o documento |
| RF-502 | El sistema **debe** mostrar los datos del socio para confirmación visual |
| RF-503 | El sistema **no debe** permitir guardar sin esa confirmación |
| RF-504 | El sistema **debe** aplicar el descuento del pack **del socio**, no del asesor |
| RF-505 | El sistema **debe** exigir comprobante con banco, monto y fecha |
| RF-506 | El sistema **debe** registrar **qué asesor** hizo cada operación |
| RF-507 | El sistema **debe** dejar el pedido en POR CONFIRMAR hasta aprobación |
| RF-508 | El asesor **solo** puede editar pedidos en estado POR CONFIRMAR |
| RF-509 | El sistema **debe** aplicar la restricción del Kit Emprendedor |
| RF-510 | El sistema **debe** auditar toda operación del asesor |

---

## REGLAS DE SEGURIDAD

| # | Regla |
|---|---|
| SEG-21 | El asesor **no** ve comisiones de ningún socio |
| SEG-22 | El asesor **no** ve el árbol de red |
| SEG-23 | El asesor **no** accede a la configuración del plan |
| SEG-24 | El asesor **no** puede confirmar pagos *(salvo que se habilite — ver abajo)* |
| SEG-25 | El asesor **solo** ve los pedidos que él registró |
| SEG-26 | Toda operación queda auditada con su autor |

### Decisión configurable: ¿el asesor puede confirmar pagos?

**Por defecto: NO.** El asesor registra, el administrador confirma. Es
separación de funciones básica: quien toma el pedido no es quien aprueba el
dinero.

Se deja el parámetro `asesor_puede_confirmar_pago` en configuración por si Max
Global prefiere velocidad sobre control. **Recomendación: dejarlo en NO.**

---

## CAMBIOS EN OTRAS SUPERFICIES

### Web pública (spec 001)
- ❌ Se elimina la pantalla de subida de voucher
- ✅ El carrito termina en botón *"Pedir por WhatsApp"* con el pedido precargado
- ✅ La confirmación de registro muestra el WhatsApp del asesor, no cuentas

### Backoffice del socio (spec 002)
- ❌ Se elimina la subida de voucher
- ✅ El carrito genera un mensaje de WhatsApp al asesor
- ✅ El socio ve sus pedidos y su estado, pero no los registra él

### Panel admin (spec 003)
- ✅ La bandeja ahora muestra **quién registró** cada pedido
- ✅ Se agrega gestión de asesores: alta, baja y asignación
- ✅ Reporte de ventas por asesor

---

## MODELO DE DATOS — CAMBIOS

```
socio.rol            → agregar valor 'asesor'
orden.asesor_id      → quién registró la operación (nullable)
orden.canal          → 'web' | 'asesor'
config               → asesor_puede_confirmar_pago = false
```

**Importante:** el asesor **no** es un socio de la red. Es personal de Max
Global. No tiene patrocinador, no genera comisiones, no aparece en el árbol.

⏳ *Pendiente: confirmar si algún asesor podría además ser socio. Si es así, hay
que separar la cuenta de trabajo de la cuenta de red.*

---

## MENSAJE DE WHATSAPP PRECARGADO

El botón del carrito debe abrir WhatsApp con el pedido ya escrito:

```
Hola, quiero hacer un pedido:

• Café x2 ......... S/ 75.00
• Colágeno x1 ..... S/ 37.50
Total: S/ 112.50

Mi código: MG-0847
Nombre: María Torres
```

**Por qué importa:** si el asesor recibe el código escrito, lo copia y lo pega
en el buscador. Sin eso tiene que preguntarlo y transcribirlo a mano, que es
justo donde se producen los errores de código.

---

## PENDIENTES

| # | Qué falta | Impacto |
|---|---|---|
| E-01 | ¿Cuántos asesores hay y quiénes son? | Alta de usuarios |
| E-02 | ¿Cómo se elige el asesor desde la web? ¿Fijo, rotativo, o elige el cliente? | Botón de WhatsApp |
| E-03 | ¿Un asesor puede además ser socio de la red? | Modelo de datos |
| E-04 | ¿El asesor cobra comisión por sus ventas? | Motor de comisiones |
| E-05 | ¿Qué pasa si el cliente no tiene código todavía? | Flujo de afiliación |

> **E-04 es el más importante de los cinco.** Si el asesor cobra por vender,
> deja de ser solo un operador y entra al plan de compensación, lo que agrega
> un sexto bono al motor.

---

## DEPENDENCIAS

| Depende de | Para qué |
|---|---|
| `003-panel-admin` | La confirmación del pago sigue siendo del administrador |
| `004-motor-comisiones` | Se dispara al confirmar, no al registrar |
