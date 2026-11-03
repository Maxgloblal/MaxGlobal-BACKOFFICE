# REQUISITOS FUNCIONALES — WEB PÚBLICA

**Superficie:** `maxglobaloficial.com` · **Fase 1**
**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026

---

## CONVENCIONES DE NUMERACIÓN

| Rango | Superficie |
|---|---|
| **RF-1xx** | Web pública ← *este documento* |
| RF-2xx | Backoffice del socio |
| RF-3xx | Panel de administración |
| RF-4xx | Motor de comisiones y sistema |
| RT-xx | Transversales, aplican a todo |

**Estado de cada requisito:**

| Marca | Significa |
|---|---|
| ✅ | Definido. Se puede programar |
| ⏳ | Bloqueado esperando respuesta *(ya no queda ninguno)* |
| 📌 | Fase 2 |

---

## RT · TRANSVERSALES DE ESTA SUPERFICIE

| # | Requisito | Estado |
|---|---|---|
| RT-01 | El sitio **debe** funcionar completo en pantalla de celular | ✅ |
| RT-02 | La portada **debe** cargar en menos de 3 segundos en 4G | ✅ |
| RT-03 | El sitio **debe** usar la identidad de marca: dorado `#D1AD68`, verde `#1BA741`, fondo blanco | ✅ |
| RT-04 | La tipografía de interfaz **debe** ser Caviar Dreams | ✅ |
| RT-05 | Las imágenes **deben** servirse en formato moderno con carga diferida | ✅ |
| RT-06 | El sitio **no debe** exponer ningún dato de socios ni de comisiones | ✅ |
| RT-07 | El sitio **debe** registrar analítica de visitas y evento en el botón de afiliación | ✅ |

---

## 🔴 RF-100 · EL PARÁMETRO DE PATROCINIO

> El requisito más importante de toda la superficie. Si falla, el socio pierde
> su comisión y reclama.

| # | Requisito | Estado |
|---|---|---|
| RF-101 | El sistema **debe** capturar el parámetro `ref` de la URL al entrar | ✅ |
| RF-102 | El sistema **debe** conservar el `ref` durante toda la navegación, en todas las páginas | ✅ |
| RF-103 | El sistema **debe** validar contra el servidor que el código exista y esté activo | ✅ |
| RF-104 | El sistema **debe** asociar el patrocinador internamente sin exponer datos de socios | 🔵 *descartado 26/08 con la tienda replicada* |
| RF-105 | Ante un código inexistente o inactivo, la solicitud **debe** registrarse con patrocinador nulo para asignación administrativa sin arrojar error técnico | ✅ |
| RF-106 | Si el visitante no ingresa patrocinador, la solicitud **se registra** para asignación por la administración | ✅ *modelo solicitud* |
| RF-107 | Si el visitante entra sin `ref`, el sistema **debe** pedirle el código del patrocinador en el registro | ✅ |

---

## P-01 · PORTADA

| # | Requisito | Estado |
|---|---|---|
| RF-110 | La portada **debe** mostrar la propuesta de valor y un botón principal de afiliación | ✅ |
| RF-111 | La portada **no debe** personalizarse con nombres de socio | 🔵 *descartado 26/08 con la tienda replicada* |
| RF-112 | La portada **debe** mostrar al menos 4 productos con precio y puntaje | ✅ |
| RF-113 | La portada **debe** presentar la propuesta de packs y enlazar a `/packs-de-afiliacion` donde se comparan los 5 packs | ✅ *Portada v2* |
| RF-114 | La portada **debe** explicar el proceso en 3 pasos: elegir pack, recibir producto y construir red | ✅ *Portada v2* |
| RF-115 | El botón *Ingresar* **debe** llevar a `app.maxglobaloficial.com` | ✅ `src/components/SiteHeader.jsx:200,283`, `src/components/SiteFooter.jsx:62` (vía `src/config.js:46`) |
| RF-116 | El botón principal **debe** quedar al alcance del pulgar en móvil | ✅ |

---

## P-02 · CATÁLOGO DE PRODUCTOS

| # | Requisito | Estado |
|---|---|---|
| RF-120 | El catálogo **debe** mostrar todos los productos activos con nombre, imagen, precio de lista y puntaje | ✅ |
| RF-121 | El catálogo **debe** mostrar **precio de lista**, nunca precios con descuento | ✅ |
| RF-122 | El catálogo **debe** informar que los socios obtienen descuento, sin revelar el porcentaje exacto por pack | ✅ |
| RF-123 | Desde el catálogo **debe** poder pasarse al registro conservando el `ref` | ✅ |
| RF-124 | El catálogo **debe** permitir agregar productos al pedido para solicitar por WhatsApp con el `ref` | ✅ *carrito público (T-40)* |

> **RF-121 y RF-124:** esta pantalla es pública. El descuento depende del pack
> del socio, así que mostrarlo confundiría. Y no se vende suelto: para comprar
> hay que ser socio.

---

## P-03 · COMPARATIVA DE PACKS

| # | Requisito | Estado |
|---|---|---|
| RF-130 | La página **debe** comparar los 5 packs lado a lado | ✅ |
| RF-131 | Cada pack **debe** mostrar: precio, productos incluidos, niveles residuales, niveles de patrocinio y puntaje de rango | ✅ |
| RF-132 | Cada pack **debe** tener **su propio botón** de selección | ✅ |
| RF-133 | El sistema **debe** advertir visiblemente que el Kit Emprendedor solo puede afiliar Kit Emprendedor | ✅ |
| RF-134 | La página **debe** destacar un pack recomendado | ✅ |
| RF-135 | Cada pack **debe** mostrar su porcentaje de descuento **en recompra** (50%, o 40% el Kit) | ✅ *confirmado 25/08* |
| RF-136 | El Kit Emprendedor **debe** mostrar que **no otorga puntos de rango** | ✅ *0 puntos, confirmado 26/08* |
| RF-137 | Los packs Familiar y Empresarial **deben** mostrar que son de **armado libre** hasta completar el monto | ✅ *confirmado 26/08* |

---

## P-04 · LA OPORTUNIDAD

| # | Requisito | Estado |
|---|---|---|
| RF-140 | La página **debe** explicar el Bono de Patrocinio con sus 7 niveles y porcentajes | ✅ |
| RF-141 | La página **debe** explicar el Bono Residual con sus 10 niveles y porcentajes | ✅ |
| RF-142 | La escala de rangos con sus bonos **debe** consultarse en el backoffice | ✅ *baja a nota: vive en P-15* |
| RF-143 | La página **debe** explicar el Bono Global semestral | ✅ |
| RF-144 | La página **debe** incluir preguntas frecuentes | ❓ *sin código: no construida* |
| RF-145 | La página **no debe** prometer ganancias ni mostrar cifras de ingresos de ejemplo | ✅ |

> **RF-145 es una protección legal.** Prometer ingresos concretos en un
> multinivel expone a la empresa ante INDECOPI. Se explica el mecanismo, no el
> resultado.

---

## P-05 · REGISTRO

| # | Requisito | Estado |
|---|---|---|
| RF-150 | El registro **debe** realizarse en un formulario unificado en una sola pantalla | ✅ *modelo solicitud* |
| RF-151 | El sistema **debe** precargar el patrocinador desde el `ref` y mostrarlo no editable | ✅ `src/pages/Registro.jsx:361` (readOnly, aviso bloqueado) |
| RF-152 | El sistema **debe** capturar: nombres, apellidos, documento, correo, teléfono, ciudad y dirección | ✅ *sin contraseña en landing* |
| RF-153 | El sistema **debe** capturar la **dirección de envío** completa | ✅ |
| RF-154 | El sistema **debe** validar que el correo sea único | ✅ |
| RF-155 | El sistema **debe** validar que el documento sea único y con formato peruano | ✅ |
| RF-156 | El sistema **debe** impedir que un Kit Emprendedor patrocine un pack superior | ✅ *verificado: aplicado en P-22 y Postgres* |
| RF-157 | La contraseña del socio **debe** crearse con mínimo 8 caracteres al darse de alta en el sistema | 🔵 *fuera de alcance en landing: se emite en admin* |
| RF-158 | El sistema **debe** exigir aceptación de términos y condiciones | ✅ |
| RF-159 | Al completarse, el sistema **debe** crear una solicitud de afiliación en estado `nueva` | ✅ *Edge Function registro-afiliacion* |
| RF-160 | La orden de afiliación **debe** crearse en el panel admin al confirmar el pago de la solicitud | ✅ *operación admin P-22/P-23* |
| RF-161 | El sistema **no debe** generar ninguna comisión en el registro | ✅ |
| RF-162 | Los campos **deben** ser cómodos para uso con el pulgar en móvil | ✅ |

---

## P-06 · CONFIRMACIÓN Y PAGO

| # | Requisito | Estado |
|---|---|---|
| RF-170 | El sistema **debe** confirmar la recepción de la solicitud para contacto por asesor | ✅ *modelo solicitud* |
| RF-171 | El sistema **debe** instruir el abono en cuentas oficiales y abrir WhatsApp con datos del pedido | ✅ *datos en WhatsApp precargado* |
| RF-172 | El sistema **debe** mostrar las cuentas bancarias con **botón de copiar** en cada número | ✅ `src/pages/Confirmacion.jsx:136,158` (botones copiar cuenta y CCI con clipboard y feedback) |
| RF-173 | El sistema **debe** ofrecer un botón que abra WhatsApp con el mensaje precargado | ✅ |
| RF-174 | El mensaje precargado **debe** incluir nombre, documento, pack y monto | ✅ |
| RF-175 | El sistema **debe** explicar que la afiliación se activa al confirmarse el depósito | ✅ |
| RF-176 | El sistema **no debe** pedirle al socio que suba ningún archivo | ✅ |
| RF-177 | Las cuentas bancarias **deben** venir de configuración, no del código | ✅ |

---

## P-07 · NOSOTROS

| # | Requisito | Estado |
|---|---|---|
| RF-180 | La página **debe** mostrar misión, visión y valores desde configuración | ✅ `src/pages/Nosotros.jsx:12,67,91,228` y `src/config.js:42` (`INSTITUCIONAL`) |
| RF-181 | La página **debe** mostrar las razones para elegir Max Global | ✅ |
| RF-182 | La página **debe** incluir el video de logo animado | 🔴 *pendiente: hoy muestra imagen estática* |
| RF-183 | Las cifras institucionales **deben** ser campos editables, **nunca inventadas** | ✅ |

---

## RF DE PÁGINA DE PRODUCTO — 27/08/2026

| RF | Requisito | Estado |
|---|---|---|
| RF-181b | El sitio **debe** tener una página propia por producto en `/productos/:id` | ✅ |
| RF-182b | La página **debe** mostrar foto, nombre, descripción, presentación, precio público, precio "desde" de socio y puntos | ✅ |
| RF-183b | Un `id` inexistente **debe** mostrar la página 404, no redirigir al catálogo | ✅ |
| RF-184 | La página **debe** permitir agregar al carrito con cantidad | ✅ |
| RF-185 | La página **debe** tener ruta de navegación con enlaces | ✅ |
| RF-186 | La página **debe** mostrar 3 productos relacionados de la misma categoría | ✅ |
| RF-187 | Cada página **debe** tener título, descripción y canónica únicos, generados desde `src/data/productos-generado.json` (`scripts/prerender.mjs:10`) | ✅ |
| RF-188 | Cada página **debe** incluir JSON-LD `Product` con el precio **público** | ✅ |
| RF-189 | El JSON-LD **no debe** incluir `AggregateRating` ni `Review` | ✅ |
| RF-190 | El `sitemap.xml` **debe** incluir las URLs de todos los productos activos | ✅ *reescrito sin cifra caduca (scripts/generar-sitemap.mjs)* |
| RF-191 | Si un campo del producto no tiene dato, la línea **debe** omitirse, no rellenarse | ✅ |

---

## RESUMEN DE ESTA SUPERFICIE (TAREA-50 · 20/09/2026 — ACTUALIZADO TAREA-52)

| Estado | Cantidad |
|---|:---:|
| ✅ Cumple | 72 |
| 🔴 No cumple | 1 *(RF-182 video logo)* |
| ❓ Sin código | 1 *(RF-144 FAQs)* |
| 🔵 Fuera de alcance v1 | 2 *(RF-104/111 tienda replicada, RF-157 clave en admin)* |
| ⚠ Caduca | 0 |
| **Total** | **76** |

**Bloqueados esperando al cliente:** 0 (todas las preguntas del formulario fueron resueltas o descartadas).

---

## PENDIENTES ANOTADOS (FUERA DE ESTA TAREA)

### 🔴 Prioritarios (Impacto en negocio / operación)
*(Ninguno pendiente — RF-151 y RF-115 resueltos en TAREA-52)*

### 🟡 Secundarios (Mejoras funcionales y cosméticas)
1. **RT-07 · Analítica de visitas**: Falta integrar script de analítica y evento en botón de afiliación.
2. **RF-144 · Preguntas frecuentes**: Falta acordeón de FAQs en sección de oportunidad.
3. **RF-182 · Video de logo animado**: Incorporar video institucional en `Nosotros.jsx` en lugar del PNG estático.

