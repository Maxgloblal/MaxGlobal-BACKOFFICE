# CASOS DE USO — SOCIO Y AFILIACIÓN

**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

## PARA QUÉ SIRVE ESTE DOCUMENTO

Los **requisitos funcionales** dicen *qué debe hacer* el sistema.
Los **casos de uso** dicen *qué pasa paso a paso*, **incluido lo que sale mal**.

> **Los flujos de excepción son la parte valiosa.** El camino feliz lo adivina
> cualquiera. Un sistema se rompe en lo que nadie previó: el código que no
> existe, el monto que no coincide, la sesión que expira a mitad del formulario.

---

## CU-01 · AFILIACIÓN DE UN SOCIO NUEVO

| | |
|---|---|
| **Actor principal** | Visitante |
| **Actor secundario** | Administrador |
| **Precondición** | Tiene un enlace con `?ref=` válido |
| **Postcondición** | Socio en estado `PENDIENTE`, orden `POR CONFIRMAR` |
| **Superficie** | Landing pública |

### Flujo principal

```
 1. El visitante abre maxglobaloficial.com/?ref=MG-0847
 2. El sistema captura y valida el código contra el servidor
 3. El sistema muestra "Te invita: Carlos Mendoza"
 4. El visitante explora catálogo, packs y el plan
      → el ?ref= se conserva en toda la navegación
 5. Elige un pack y pulsa "Quiero afiliarme"
 6. Completa sus datos personales
 7. Completa su dirección de envío
 8. Crea su contraseña
 9. Marca las casillas de consentimiento obligatorias
10. El sistema valida todo
11. El sistema crea el socio en PENDIENTE y la orden en POR CONFIRMAR
12. El sistema muestra código de socio, monto y cuentas bancarias
13. El visitante pulsa "Enviar mi voucher por WhatsApp"
```

### Flujos alternativos

**A1 · Entra sin `?ref=`**
En el paso 1, si no hay parámetro, el sistema pide el código del patrocinador
como campo obligatorio del registro. Continúa en el paso 5.

**A2 · El patrocinador es Kit Emprendedor**
En el paso 5, el sistema **solo muestra el Kit Emprendedor** como opción y
explica la restricción. Continúa en el paso 6.

**A3 · Ya tiene cuenta**
En el paso 6, si el correo ya existe, el sistema ofrece iniciar sesión en lugar
de registrarse.

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | El código de patrocinador no existe | Mensaje claro: *"No encontramos ese código. Verifica el enlace con quien te invitó."* **No continúa.** |
| **E2** | El patrocinador está `INACTIVO` | Permite continuar. Un socio inactivo **sí puede** patrocinar; simplemente no cobra ese mes |
| **E3** | El patrocinador está `SUSPENDIDO` o de `BAJA` | **No permite** el registro. Mensaje de contacto con Max Global |
| **E4** | El correo ya está registrado | *"Ese correo ya tiene una cuenta"* con enlace a inicio de sesión |
| **E5** | El documento ya está registrado | *"Ese documento ya está registrado"* con contacto a soporte |
| **E6** | Kit Emprendedor intenta afiliar un Gold | Bloquea la selección y explica la restricción |
| **E7** | No marca las casillas obligatorias | El botón de envío queda deshabilitado |
| **E8** | Se cae la conexión al enviar | **No crea el socio a medias.** Reintenta o muestra error, y el formulario conserva lo escrito |
| **E9** | El visitante cierra sin depositar | El socio queda `PENDIENTE` indefinidamente. **No se anula automáticamente** |
| **E10** | Se registra dos veces por doble clic | El sistema crea **un solo** socio. Protección por unicidad de correo y documento |

> **E8 es el más subestimado.** Un registro parcial deja un socio sin orden, o
> una orden sin socio. Ambas cosas rompen el árbol. El registro debe ser
> **transaccional**: o se crea todo, o no se crea nada.

---

## CU-02 · RECOMPRA MENSUAL

| | |
|---|---|
| **Actor principal** | Socio |
| **Actor secundario** | Administrador |
| **Precondición** | Socio `ACTIVO` o `INACTIVO` con sesión iniciada |
| **Postcondición** | Orden `POR CONFIRMAR` con su comprobante |

### Flujo principal

```
1. El socio entra a su backoffice
2. Ve cuántos puntos le faltan para los 70 de activación
3. Entra a la tienda
4. El sistema muestra los precios con SU descuento aplicado
5. Arma su carrito
      → el contador de puntos se actualiza en vivo
6. El sistema avisa cuando alcanza los 70 puntos
7. Pulsa "Pedir por WhatsApp"
8. Se abre WhatsApp con el pedido, su código y su nombre precargados
9. Conversa con Max Global y acuerda el envío
10. Deposita y manda la foto del voucher
11. El administrador registra el pedido en el sistema
```

### Flujos alternativos

**A1 · Ya está activo**
En el paso 2, si ya tiene sus 70 puntos, el sistema lo confirma y el socio
compra igual — los puntos extra suman a su volumen grupal.

**A2 · Compra sin llegar a 70**
Perfectamente válido. El sistema no obliga a alcanzar el umbral.

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | El socio está `SUSPENDIDO` | No accede a la tienda. Pantalla informativa |
| **E2** | Un producto está desactivado | No aparece en el catálogo |
| **E3** | El carrito queda vacío | El botón de pedido se deshabilita |
| **E4** | WhatsApp no abre (escritorio sin app) | Ofrece **copiar el texto del pedido** como alternativa |
| **E5** | La sesión expira mientras arma el carrito | Al reingresar, el carrito **se conserva** |
| **E6** | Cambian los precios mientras arma el carrito | El precio se congela al momento de generar el pedido, y se registra en la orden |

> **E4 importa más de lo que parece.** Si el socio entra desde una laptop sin
> WhatsApp instalado, el botón no hace nada y la venta se cae en silencio.

---

## CU-03 · CONSULTA DE COMISIONES

| | |
|---|---|
| **Actor principal** | Socio |
| **Precondición** | Tiene al menos un ciclo liquidado |
| **Postcondición** | Ninguna. Es solo lectura |

### Flujo principal

```
1. El socio entra a "Mis comisiones"
2. El sistema muestra el ciclo más reciente liquidado
3. Ve el total cobrado
4. Despliega cada tipo de bono
5. Despliega un nivel específico
6. Ve qué orden lo originó, cuántos puntos y qué porcentaje se aplicó
```

### 🔴 Flujo de excepción crítico

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Un nivel **no le pagó** | 🔴 **Muestra el motivo explícito**, no un vacío |

Los motivos posibles y su texto:

```
"Tu pack Ejecutivo habilita hasta el nivel 5"
"Este socio no estaba activo en el ciclo"
"No hay nadie en este nivel de tu red"
```

> **Este es el requisito que más reclamos evita de todo el sistema.** Un socio
> que ve un vacío escribe a soporte. Un socio que ve la razón, entiende.

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E2** | Todavía no tiene ciclos liquidados | Mensaje explicando cuándo se liquida |
| **E3** | El ciclo está en `CALCULANDO` | Avisa que el cálculo está en proceso |
| **E4** | Cobró S/. 0 en el ciclo | Explica por qué: no estuvo activo, o su red no compró |

---

## CU-04 · NAVEGACIÓN DEL ÁRBOL DE RED

| | |
|---|---|
| **Actor principal** | Socio |
| **Precondición** | Sesión iniciada |
| **Postcondición** | Ninguna. Solo lectura |

### Flujo principal

```
1. El socio entra a "Mi red"
2. Ve el resumen: total, activos, inactivos
3. Ve la lista de sus frontales (nivel 1)
4. Toca uno con descendencia
5. Entra a ese nivel
6. Puede volver con la migaja de pan
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | El socio no tiene red todavía | Mensaje con su enlace de patrocinio y botón de compartir |
| **E2** | Un socio de su red está `PENDIENTE` | **No aparece.** Solo entra al árbol al confirmarse su pago |
| **E3** | Intenta ver a alguien fuera de su descendencia | 🔴 La consulta devuelve **vacío**, no un error. No revela que esa persona existe |
| **E4** | Su red tiene 500+ personas | Carga por niveles, nunca todo de golpe |

> **E3 es una decisión de seguridad, no de interfaz.** Devolver "no tienes
> permiso" confirma que esa persona existe en el sistema. Devolver vacío no
> revela nada.

---

## CU-05 · UPGRADE DE PACK

| | |
|---|---|
| **Actor principal** | Socio |
| **Actor secundario** | Administrador |
| **Precondición** | Socio activo con pack inferior al Empresarial |
| **Postcondición** | Orden de upgrade `POR CONFIRMAR` |

### Flujo principal

```
1. El socio entra a su perfil
2. Ve su pack actual y los superiores disponibles
3. Elige uno
4. El sistema muestra el monto              ⏳ ¿diferencia o pack completo?
5. Genera la orden de upgrade
6. Pide por WhatsApp y deposita
7. El administrador registra y confirma
8. 🔥 Al confirmar:
      → el pack cambia INMEDIATAMENTE
      → desbloquea niveles residuales y de patrocinio al instante
      → se suman los puntos de rango del pack nuevo
      → se genera Bono de Patrocinio sobre el upgrade
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Ya tiene el pack máximo | No muestra la opción |
| **E2** | Tiene un upgrade pendiente de confirmar | No permite iniciar otro |
| **E3** | El upgrade se confirma cerca del cierre | Los beneficios aplican **desde ese momento**, no retroactivo al mes |
| **E4** | Intenta bajar de pack | **No se permite.** Solo se sube |

> **E3 necesita definición explícita:** si un Ejecutivo sube a Gold el día 28 y
> el ciclo cierra el 31, ¿sus niveles 6 a 10 cobran el residual de todo el mes o
> solo de los últimos 3 días?
>
> **Recomendación:** desde el momento del upgrade hacia adelante. Retroactivo
> obligaría a recalcular comisiones ya generadas.

---

## CU-06 · PRESENTAR UN RECLAMO

| | |
|---|---|
| **Actor principal** | Consumidor (socio o no) |
| **Precondición** | Ninguna. Debe funcionar sin sesión |
| **Postcondición** | Reclamo registrado con código de seguimiento |
| **Base legal** | Ley N° 32495 |

### Flujo principal

```
1. Entra al Libro de Reclamaciones desde cualquier página
2. Elige si es RECLAMO o QUEJA
3. Completa sus datos de identificación
4. Describe el bien o servicio y el monto
5. Detalla el reclamo y su pedido
6. Envía
7. El sistema genera un código único (LR-2026-0001)
8. Muestra la confirmación en pantalla
9. Envía la confirmación por correo
10. Inicia el conteo de 15 días hábiles
```

### 🔴 Flujos de excepción

| # | Qué pasa | Qué hace el sistema |
|---|---|---|
| **E1** | Es menor de edad | Pide los datos del padre o apoderado |
| **E2** | Falla el envío del correo | 🔴 **El reclamo igual se registra.** Muestra el código en pantalla para que lo anote |
| **E3** | El mismo consumidor reclama dos veces | Ambos se registran. Son reclamos independientes |
| **E4** | Se acerca el día 15 sin respuesta | El sistema alerta al administrador |

> **E2 es la excepción más importante de este caso de uso.** Si el correo falla
> y el reclamo no se guarda, hay incumplimiento legal con multa. **Registrar
> primero, notificar después.**

---

## RESUMEN

| Caso de uso | Flujos alternativos | Flujos de excepción |
|---|---|---|
| CU-01 Afiliación | 3 | 10 |
| CU-02 Recompra | 2 | 6 |
| CU-03 Comisiones | — | 4 |
| CU-04 Árbol | — | 4 |
| CU-05 Upgrade | — | 4 |
| CU-06 Reclamo | — | 4 |
| **Total** | **5** | **32** |

**Los casos de uso del administrador**, que son los que mueven dinero, están en
`13-CASOS-DE-USO-CRITICOS`.
