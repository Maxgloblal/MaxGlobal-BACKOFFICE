# SPEC 001 — WEB PÚBLICA

**Estado:** borrador · **Rama sugerida:** `001-web-publica`
**Fecha:** 25 de agosto de 2026
**Entregable de:** Semana 1 del cronograma

---

## RESUMEN

La cara pública y comercial de Max Global. Su único trabajo es **convertir a un
visitante en afiliado**, siempre vinculado a quien lo invitó.

---

## ARQUITECTURA DE DOMINIOS ✅ DECIDIDO

El proyecto son **dos productos separados que se despliegan por su cuenta**:

```
maxglobaloficial.com              ← ESTA SPEC · Fase 1
   Sitio comercial público
   Vende la oportunidad y capta afiliados
   Sin lógica de comisiones, sin base de datos pesada

oficina.maxglobaloficial.com      ← Specs 002 y 003 · Fase 2
   El sistema: backoffice del socio y panel de administración
   Motor de comisiones, árbol de red, vouchers
```

**Por qué es la decisión correcta:**

| Ventaja | Detalle |
|---|---|
| Despliegue independiente | La landing sale a producción sin esperar al motor |
| Aislamiento de fallas | Una caída del sistema no tumba el sitio comercial |
| Stacks distintos | La landing puede ser estática y rapidísima |
| Trabajo en paralelo | Dos frentes sin pisarse |
| Seguridad | El sistema queda fuera del tráfico público |

**Único punto de conexión:** el botón *"Ingresar"* de la landing apunta al
subdominio. Nada más.

> El **login, el backoffice y el panel admin salen del alcance de esta spec** y
> pasan a `002-backoffice-socio` y `003-panel-admin`.

---

## CONTEXTO QUE CAMBIA TODO EL DISEÑO

> **El tráfico no viene de Google. Viene de los propios socios.**

En un negocio multinivel, quien trae al visitante es un distribuidor que
comparte su enlace por WhatsApp. Eso tiene tres consecuencias directas:

| Consecuencia | Qué implica |
|---|---|
| El SEO importa poco | Nadie busca "Max Global" en Google antes de afiliarse |
| El enlace de patrocinador es sagrado | Si `?ref=` se pierde, el socio pierde su comisión |
| Es una experiencia de celular | El enlace llega por WhatsApp y se abre en el teléfono |

**Prioridad de esfuerzo:** que el `?ref=` nunca se pierda **>** velocidad en
móvil **>** diseño **>** SEO.

---

## HISTORIAS DE USUARIO

### HU-1 · Visitante invitado se afilia — *prioridad P1*

Una persona recibe por WhatsApp el enlace de su conocido, entra desde el
celular, entiende qué es Max Global, elige un pack y se registra quedando
vinculada a quien la invitó.

**Por qué es P1:** es el único camino de crecimiento de la red. Si esto falla,
no hay negocio.

**Criterios de aceptación**

1. **Dado** un enlace `maxglobal.com/?ref=ABC123`, **cuando** el visitante
   entra, **entonces** el código del patrocinador queda guardado y sobrevive a
   la navegación por toda la página.
2. **Dado** que el visitante navega al catálogo y vuelve, **cuando** llega al
   formulario, **entonces** el patrocinador sigue precargado y visible.
3. **Dado** un `?ref=` de un código inexistente, **cuando** se intenta el
   registro, **entonces** el sistema lo informa con claridad y no permite
   continuar sin un patrocinador válido.
4. **Dado** un patrocinador con Kit Emprendedor, **cuando** el visitante elige
   un pack superior al Kit, **entonces** el sistema lo impide y explica la
   restricción.
5. **Dado** un registro completado, **cuando** se confirma, **entonces** se
   muestran las cuentas bancarias, el monto exacto y el WhatsApp del asesor.

---

### HU-2 · Socio existente va a su oficina — *prioridad P2*

Un distribuidor ya afiliado necesita llegar a su oficina virtual.

**Criterio de aceptación único**

1. **Dado** un socio en cualquier página, **cuando** pulsa *"Ingresar"*,
   **entonces** se le lleva a `oficina.maxglobaloficial.com`.

> El login vive en el subdominio, no acá. Esta spec solo provee el enlace.

---

### HU-3 · Visitante evalúa antes de decidir — *prioridad P2*

Una persona quiere entender qué vende Max Global y cuánto cuesta antes de
comprometerse.

**Criterios de aceptación**

1. Los 8 productos se muestran con precio y puntaje visibles en la página.
2. Los packs se comparan lado a lado, con lo que incluye cada uno.
3. Ningún precio está escondido en un PDF descargable.
4. Desde el catálogo se puede pasar al registro sin perder el `?ref=`.

---

## PANTALLAS

### P-01 · Portada

| Bloque | Contenido | Notas |
|---|---|---|
| Cabecera | Logo horizontal · menú · botón *Ingresar* | Logo en color sobre blanco |
| Hero | Propuesta de valor · botón principal *Quiero afiliarme* | Si el patrocinador viene en la URL, mostrar *"Te invitó [Nombre]"* |
| Productos | Los 8 productos con precio y puntos | Producto recortado sobre bloque de color |
| Packs | Comparativa de los 5 packs | Cada uno con su propio botón |
| Cómo funciona | 4 pasos con ícono | Una línea por paso |
| Cierre | Botón de afiliación | — |
| Pie | Logo blanco · contacto · legales | Sobre fondo oscuro |

**Estados:** con patrocinador en la URL · sin patrocinador · patrocinador inválido.

---

### P-02 · Catálogo de productos

Grid de los 8 productos. Cada tarjeta: imagen recortada, nombre, precio de
lista, puntaje.

**Importante:** el precio con descuento **no se muestra aquí**. El descuento
depende del pack del socio y esta pantalla es pública. Mostrarlo confundiría.

---

### P-03 · Packs de afiliación

Comparativa de los 5 packs con: precio, productos incluidos, niveles de
residual, niveles de patrocinio, descuento en recompras y puntaje de rango.

**Regla:** el Kit Emprendedor debe mostrar visiblemente su restricción — solo
puede patrocinar a otros Kit Emprendedor.

⏳ *Depende de: tabla de descuentos definitiva (P-01 del formulario) y puntaje
del Kit Emprendedor (P-04).*

---

### P-04 · Registro

Formulario en pasos, no todo en una pantalla:

```
Paso 1  Tu patrocinador     → precargado desde ?ref=, no editable si es válido
Paso 2  Tus datos           → nombres, apellidos, documento, correo, teléfono
Paso 3  Elige tu pack       → con la restricción del Kit aplicada
Paso 4  Crea tu contraseña
Paso 5  Confirmación        → cuentas bancarias, monto y siguiente paso
```

**Validaciones**

| Campo | Regla |
|---|---|
| Patrocinador | Debe existir y estar activo |
| Correo | Único en el sistema |
| Documento | Único · formato de documento peruano |
| Pack | Compatible con el pack del patrocinador |
| Contraseña | Mínimo 8 caracteres |

**Al completarse:** se crea el socio en estado `PENDIENTE` y la orden de
afiliación en estado `PENDIENTE`. **No se genera ninguna comisión todavía.**

---

### P-05 · Confirmación y contacto con el asesor

Tras completar el registro se muestra el código de socio, el monto a pagar y
las cuentas bancarias con botón de copiar.

**El socio NO sube nada.** Un botón abre WhatsApp con el mensaje precargado
para que le mande la foto del depósito al asesor:

```
Hola, soy María Torres · MG-1284
Me afilié con el Pack Gold · S/ 1,200.00
Le mando mi voucher.
```

El asesor es quien registra el comprobante en el sistema.

---

### P-06 · Nosotros

Página institucional: misión, visión, valores, por qué elegir Max Global y
cifras. El video del logo animado va acá.

⏳ *Depende de: textos institucionales del cliente.*

---

> **El inicio de sesión NO vive en esta superficie.** Está en el subdominio del
> sistema. La landing solo enlaza.

---

## REQUISITOS FUNCIONALES

| # | Requisito |
|---|---|
| RF-001 | El sistema **debe** capturar el parámetro `ref` y conservarlo durante toda la sesión de navegación |
| RF-002 | El sistema **debe** mostrar el nombre del patrocinador cuando el `ref` sea válido |
| RF-003 | El sistema **debe** impedir el registro sin un patrocinador válido |
| RF-004 | El sistema **debe** impedir que un Kit Emprendedor patrocine un pack superior |
| RF-005 | El sistema **debe** validar unicidad de correo y documento |
| RF-006 | El sistema **debe** crear al socio en estado PENDIENTE hasta que el administrador confirme el pago |
| RF-007 | El sistema **no debe** generar comisiones en el registro, únicamente al aprobarse el voucher |
| RF-008 | El sistema **debe** mostrar precios y puntajes de los 8 productos |
| RF-009 | El sistema **debe** ofrecer contacto directo por WhatsApp con el asesor |
| RF-010 | El botón *Ingresar* **debe** apuntar al subdominio del sistema |
| RF-011 | El sistema **debe** funcionar completo en pantalla de celular |
| RF-012 | El sistema **debe** permitir copiar los números de cuenta con un toque |

---

## REQUISITOS NO FUNCIONALES

| # | Requisito |
|---|---|
| RNF-001 | La portada carga en menos de 3 segundos en 4G |
| RNF-002 | Diseño **mobile-first**: se diseña para celular y se adapta a escritorio |
| RNF-003 | Identidad visual según `06-MARCA/00-GUIA-DE-MARCA-WEB` |
| RNF-004 | Tipografía de interfaz: **Caviar Dreams** (designada por el brandbook) |
| RNF-005 | Colores institucionales: dorado `#D1AD68` y verde `#1BA741` sobre blanco |
| RNF-006 | Imágenes en formato moderno con carga diferida |
| RNF-007 | El botón principal queda al alcance del pulgar en móvil |
| RNF-008 | Contraseñas con hash. Nunca en texto plano |
| RNF-009 | Límite de intentos de inicio de sesión |

---

## FUERA DE ALCANCE

**Pasa al subdominio (Fase 2):**
- Inicio de sesión y recuperación de contraseña
- Backoffice del distribuidor
- Panel de administración
- Árbol genealógico
- Tienda de recompra
- Historial de comisiones

**Fuera del proyecto:**
- Pasarela de pago automática — el flujo acordado es voucher manual
- Tienda pública sin registro — solo compran socios afiliados
- Blog o contenido editorial
- Cambio de idioma
- Aplicación móvil nativa

---

## PENDIENTES DE DEFINICIÓN

> Marcar como `[NECESITA ACLARACIÓN]` al pasar por `/speckit.clarify`.

| # | Qué falta | Bloquea |
|---|---|---|
| A-01 | Tabla de descuentos por pack (40 / 50 / 55%) | Pantalla de packs |
| A-02 | Puntaje del Kit Emprendedor | Comparativa de packs |
| A-03 | Cuentas bancarias a mostrar | Pantalla de voucher |
| A-04 | Composición del Pack Familiar y Empresarial | Comparativa de packs |
| A-05 | Si existen clientes que compran sin ser distribuidores | Alcance del catálogo |
| A-06 | Textos institucionales: misión, visión, quiénes somos | Portada |

---

## DEPENDENCIAS

| Depende de | Para qué |
|---|---|
| `004-motor-comisiones` | Nada en el registro. La comisión se dispara al aprobar el voucher |
| `003-panel-admin` | La aprobación del voucher ocurre allí |
| `06-MARCA` | Colores, tipografías y logos — **ya disponible** |

**Se puede construir en paralelo desde el día 1.** Es la única superficie que no
depende del motor de comisiones.
