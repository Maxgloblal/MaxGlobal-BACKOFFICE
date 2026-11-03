# CLAUDE.md — LANDING MAX GLOBAL

> Contexto para el agente que construye **el sitio comercial público**.
> Dominio: `maxglobaloficial.com`
>
> **Versión:** 1.0 · **Última actualización:** 25 ago 2026, 22:06 (Perú)
>
> **Estado:** listo para construir. No depende de respuestas pendientes.
> **Última sesión de trabajo:** martes 25 ago 2026, 22:06
>
> Si vuelves después de días, lee primero
> `00-EMPEZAR-AQUI/04-RETOMAR-AQUI`.

---

## QUÉ SE CONSTRUYE

El sitio público de **Max Global Corporation**, empresa peruana de venta directa
multinivel de productos naturales de salud (moringa, café, colágeno, cosmética).

**Un solo trabajo:** convertir a un visitante en afiliado, siempre vinculado a
quien lo invitó.

**Lo que NO va acá:** login, backoffice, panel admin, árbol de red, comisiones.
Todo eso vive en `app.maxglobaloficial.com`, que es otro proyecto. El botón
*Ingresar* solo enlaza a ese subdominio.

---

## 🔴 LO MÁS IMPORTANTE DE TODO EL PROYECTO

**El tráfico no viene de Google. Viene de los socios compartiendo su enlace por
WhatsApp.**

```
maxglobaloficial.com/?ref=MG-0847
```

Ese parámetro `ref` es el código del patrocinador, y **decide quién cobra las
comisiones** de esa afiliación.

| Regla | |
|---|---|
| El `ref` **debe** capturarse al entrar | Siempre |
| El `ref` **debe** sobrevivir toda la navegación | Catálogo, packs, registro, todo |
| El `ref` **debe** validarse contra el servidor | Que exista y esté activo |
| Sin patrocinador válido **no** se completa el registro | Sin excepción |

**Si el `ref` se pierde entre páginas, un socio pierde su comisión y reclama.**
Es el fallo más caro que puede tener esta superficie.

### Consecuencias de esto

| Prioridad | Por qué |
|---|---|
| 1. Que el `ref` nunca se pierda | Es dinero de una persona real |
| 2. Velocidad en celular | El enlace llega por WhatsApp y se abre en el teléfono |
| 3. Diseño | Importa, pero después de lo anterior |
| 4. SEO | Casi irrelevante: nadie busca "Max Global" antes de afiliarse |

---

## REGLAS DE ORO

### R1 · No inventar datos

**Prohibido** poner cifras, testimonios, cantidad de socios o convenios que no
estén confirmados. Si no hay dato real, se deja el campo claramente editable o
se quita el bloque.

Publicar *"+15,000 distribuidores"* sin respaldo expone a la empresa ante
INDECOPI.

### R2 · No prometer ganancias

Se explica **cómo funciona** el plan de compensación. **Nunca** cuánto puede
ganar alguien. Nada de *"gana S/. 3,000 al mes"* ni ejemplos de ingresos.

### R3 · Precios siempre visibles

Todo precio va en la página. **Nunca** en un PDF descargable. Nadie descarga un
archivo desde el celular para ver cuánto cuesta algo.

### R4 · Un botón por pack

Cada pack lleva **su propio botón**. No un botón general para toda la sección.
Obligar al visitante a decidir antes de poder actuar es donde más se pierde.

### R5 · Mobile-first, no adaptación posterior

Se diseña para celular y se expande a escritorio. La mayoría de visitantes llega
desde WhatsApp en el teléfono.

---

## IDENTIDAD DE MARCA

> Entregada por el cliente. Está normada en un brandbook de 18 páginas y **no se
> improvisa**.

```css
:root {
  --mg-dorado: #D1AD68;   /* principal */
  --mg-verde:  #1BA741;   /* secundario */
  --mg-blanco: #FFFFFF;   /* fondo preferido */
}
```

| Elemento | Valor |
|---|---|
| Color principal | Dorado / Mostaza `#D1AD68` |
| Color secundario | Verde `#1BA741` |
| Fondo | Blanco |
| Tipografía de títulos | Agus Sans |
| **Tipografía de interfaz** | **Caviar Dreams** *(la designa el brandbook para web)* |
| Botones | Cuadrados, `border-radius: 2px` |

**Solo existen esos dos colores institucionales.** Cualquier otro tono es de
apoyo para estados de interfaz y nunca se aplica al logo.

**El logo no se altera, no se estira, no se recolorea, no se redibuja.**

---

## DATOS DEL NEGOCIO

### Productos — precio de lista

| Producto | Precio público | Puntos |
|---|---|---|
| Café | **S/. 150** | 18 |
| Colágeno | **S/. 150** | 18 |
| Aceite de Moringa | **S/. 120** | 14 |
| Esplendor | **S/. 120** | 14 |
| Aceite de Orégano | **S/. 60** | 8 |
| Cápsulas de Moringa | **S/. 60** | 8 |
| Harina de Moringa | **S/. 50** | 6 |
| Perfume Dalba | **S/. 70** | 10 |

🔴 **Corregido el 26/08.** La lista antigua (café S/. 75) era el precio del socio,
no el público. **En la landing se muestran estos precios.**

> En el catálogo público se muestra **precio de lista**. El descuento depende
> del pack del socio y esta pantalla es pública.

### Packs de afiliación — son 5, no existe VIP

| Pack | Precio | Residual | Patrocinio |
|---|---|---|---|
| Kit Emprendedor | S/. 120 | — | solo afilia Kit |
| Ejecutivo | S/. 360 | 5 niveles | 3 niveles |
| **Gold** | S/. 1,200 | 10 niveles | 7 niveles |
| Familiar | S/. 4,000 | 10 niveles | 7 niveles |
| Empresarial | S/. 8,000 | 10 niveles | 7 niveles |

**Regla visible obligatoria:** el Kit Emprendedor **solo puede afiliar a otros
Kit Emprendedor**. Hay que advertirlo en la comparativa y bloquearlo en el
registro.

### Plan de compensación — para explicarlo, no para calcularlo

| Bono | Cómo funciona |
|---|---|
| Patrocinio | 7 niveles: 20 · 4 · 3 · 2 · 1 · 0.5 · 0.3 % |
| Residual | 10 niveles: 40 · 20 · 10 · 5 · 3 · 2 · 1 · 10 · 5 · 1 % |
| Rango | Jade a Diamante, con bono en soles |
| Global | 1% semestral, para Gold en adelante |

> **El nivel 8 del residual paga más que el 7. Es intencional**, es un incentivo
> para los packs altos. **No lo corrijas.**
>
> Acá solo se explican. El cálculo vive en el otro proyecto.

---

## FLUJO DE COMPRA

```
1. El visitante llega con ?ref= y explora
2. Elige su pack y se registra
3. Queda en estado PENDIENTE
4. Se le muestran las cuentas bancarias y el monto
5. Un botón abre WhatsApp con su mensaje precargado
6. Deposita y manda la foto por WhatsApp
7. Max Global confirma el pago en su panel   ← otro proyecto
8. Recién ahí queda activo
```

**El visitante NO sube ningún archivo al sitio.** No hay carga de comprobantes
en esta superficie.

**La entrega es 100% por envío** a la dirección que registró.

---

## LAS 7 PÁGINAS

| # | Página | Trabajo |
|---|---|---|
| P-01 | Portada | Presentar y llevar al registro |
| P-02 | Catálogo | Mostrar los 8 productos |
| P-03 | Packs | **La que vende.** Comparativa de los 5 |
| P-04 | La oportunidad | Explicar el plan de forma simple |
| P-05 | Registro | Capturar al afiliado con su patrocinador |
| P-06 | Confirmación | Cuentas bancarias y WhatsApp |
| P-07 | Nosotros | Institucional |

**Requisitos funcionales completos:** `specs/001-web-publica/spec.md`

---

## DATOS QUE FALTAN

> **No los inventes.** Déjalos como configuración editable y márcalos visiblemente.

| Falta | Dónde impacta |
|---|---|
| ~~Tabla de descuentos~~ | ✅ **RESUELTO.** Ver abajo |
| Puntaje de rango del Kit Emprendedor | Comparativa de packs |
| Composición de los packs Familiar y Empresarial | Comparativa |
| Cuentas bancarias de la empresa | Confirmación de pago |
| Textos de misión, visión y valores | Nosotros |
| Número de WhatsApp de Max Global | Todos los botones |

---

## 🔴 DESCUENTOS — CONFIRMADO 25/08/2026

**En la landing se comunica el descuento de RECOMPRA**, que es el beneficio real
del socio:

| Pack | Descuento en recompra |
|---|---|
| Kit Emprendedor | **40%** |
| Ejecutivo · Gold · Familiar · Empresarial | **50%** |

**En la comparativa de packs usa estos números.**

⚠️ **No escribas "hasta 55%" en ningún texto de la landing.** Ese 55% es el
descuento con que se arman los productos *dentro* del Pack Empresarial, no lo que
el socio paga al recomprar. Decir "hasta 55%" sería publicidad engañosa —y en
Perú el Código del Consumidor sanciona eso.

**El texto correcto es: "hasta 50% de descuento en todos los productos".**

### Los precios que se muestran en la landing son los PÚBLICOS

| Producto | Precio en la landing |
|---|---|
| Café | S/. 150 |
| Colágeno | S/. 150 |
| Aceite de Moringa | S/. 120 |
| Esplendor | S/. 120 |
| Aceite de Orégano | S/. 60 |
| Cápsulas de Moringa | S/. 60 |
| Harina de Moringa | S/. 50 |
| Perfume Dalba | S/. 70 |

**La lista antigua (café S/. 75) era el precio del socio, no el público.**
Confirmado el 26/08: *"el café se vende a 150"*.

---

## LISTA DE VERIFICACIÓN ANTES DE ENTREGAR

- [ ] El `?ref=` se conserva al navegar entre todas las páginas
- [ ] El nombre del patrocinador se ve en portada y registro
- [ ] Un `?ref=` inválido muestra mensaje claro, no error técnico
- [ ] No se puede completar el registro sin patrocinador válido
- [ ] La restricción del Kit Emprendedor está visible y bloqueada
- [ ] Todos los precios visibles en página, ninguno en PDF
- [ ] Cada pack tiene su propio botón
- [ ] Ninguna cifra ni testimonio inventado
- [ ] Ninguna promesa de ganancias
- [ ] Los números de cuenta se copian con un toque
- [ ] El botón *Ingresar* apunta al subdominio del sistema
- [ ] Probado en un celular real
- [ ] Analítica instalada con evento en el botón de afiliación

---

## STACK TÉCNICO

| Capa | Tecnología |
|---|---|
| Build | **Vite** |
| UI | **React** |
| Datos | **Supabase** (PostgreSQL + Auth) |
| Tests unitarios | **Vitest** |
| Tests E2E | **Playwright** |

### Qué usa esta superficie de Supabase

Muy poco. La landing es casi estática:

| Operación | Detalle |
|---|---|
| Leer catálogo | Productos y packs desde tablas públicas |
| Validar `?ref=` | Consulta de solo lectura del código de patrocinador |
| Crear socio `PENDIENTE` | Único INSERT de toda la superficie |
| Crear orden `POR CONFIRMAR` | Junto al registro, en la misma transacción |

**No lee comisiones, no lee la red, no toca puntos.** Nada de eso existe acá.

### 🔴 Reglas de seguridad de Supabase

| # | Regla |
|---|---|
| S1 | **Solo la clave `anon` va en el frontend.** La `service_role` jamás |
| S2 | Las tablas de catálogo llevan RLS con lectura pública |
| S3 | La validación del `?ref=` va por **RPC**, no por SELECT directo — nunca exponer la tabla de socios |
| S4 | El RPC de validación devuelve **solo** nombre y estado. Nunca correo, teléfono ni documento |
| S5 | El registro va por RPC transaccional que crea socio + orden juntos |

> **S3 y S4 importan:** si expones la tabla `socio` con RLS de lectura, cualquiera
> puede enumerar tu red completa desde la consola del navegador.

---

## ESTRUCTURA DE CARPETAS

```
src/
├── pages/            una carpeta por página (P-01 a P-07)
├── components/       reutilizables
├── lib/
│   ├── supabase.ts   cliente único
│   └── ref.ts        captura y persistencia del ?ref=
├── content/          textos y datos de configuración
└── styles/           tokens de marca

tests/
├── unit/             Vitest
└── e2e/              Playwright
```

---

## 🔴 TESTING OBLIGATORIO

> **Ninguna página se da por terminada sin su test unitario y su test E2E.**
> No es opcional ni se deja "para después".

### Vitest — unitarios

| Qué testear | Casos mínimos |
|---|---|
| Captura del `?ref=` | Lo lee de la URL · lo persiste · sobrevive navegación |
| Validación de patrocinador | Código válido · inválido · vacío · inactivo |
| Restricción Kit Emprendedor | Bloquea packs superiores |
| Validaciones de formulario | Correo · documento peruano · contraseña mínima |
| Cálculo de totales | Precios y sumas del carrito |

### Playwright — E2E, uno por página

| Página | Test E2E obligatorio |
|---|---|
| P-01 Portada | Entra con `?ref=` válido → ve el nombre del patrocinador |
| P-02 Catálogo | Ve los 8 productos con precio y puntos |
| P-03 Packs | Ve los 5 packs · cada uno con su botón |
| P-04 Oportunidad | Carga sin errores de consola |
| P-05 Registro | Flujo completo hasta crear socio `PENDIENTE` |
| P-06 Confirmación | Copia número de cuenta · abre WhatsApp con mensaje |
| P-07 Nosotros | Carga sin errores |

### 🔴 El test E2E que no puede faltar

```
Entrar con ?ref=MG-0847
  → navegar a catálogo
  → navegar a packs
  → navegar a la oportunidad
  → volver a la portada
  → ir al registro
  → VERIFICAR que el patrocinador sigue siendo MG-0847
```

**Si este test falla, un socio real pierde su comisión.** Es el más importante
de toda la superficie.

### Otros obligatorios

| Test | Verifica |
|---|---|
| `?ref=` inexistente | Mensaje claro, no error técnico |
| Sin `?ref=` | Pide el código, no deja continuar sin él |
| Kit Emprendedor patrocinando Gold | El sistema lo bloquea |
| Móvil (viewport 390px) | Todo usable, sin scroll horizontal |

---

## INSTRUCCIÓN PARA EL AGENTE

Al construir cada página:

1. Lee su requisito funcional en `08-RF-WEB-PUBLICA`
2. Construye la página
3. **Escribe su test de Vitest**
4. **Escribe su test de Playwright**
5. Corre ambos y verifica que pasen
6. Recién ahí pasa a la siguiente

**No avances con tests en rojo.** Un test que falla es información, no un
obstáculo.

---

## ⚖️ OBLIGACIONES LEGALES — PERÚ

> Detalle completo en `08-LEGAL/`. Acá va lo que afecta directamente al código.

### 🔴 Libro de Reclamaciones Virtual — obligatorio

**Ley N° 32495**, vigente desde noviembre de 2025. Sanción de 1 a 10 UIT.

| Requisito | Detalle |
|---|---|
| Enlace visible y permanente | En el pie de **todas** las páginas |
| A menos de **2 clics** de la portada | Requisito literal de la norma |
| Aviso en la pantalla de registro | Obligatorio |
| Activo 24/7 | Sin horarios |
| Confirmación automática al enviar | Con código de seguimiento |

El formulario distingue **reclamo** (disconformidad con el producto) de **queja**
(malestar con la atención). Son categorías legales distintas.

### 🔴 Consentimiento en el registro

**Ley N° 29733** y su reglamento vigente desde marzo de 2025. Multa hasta 100 UIT.

```
☐  Acepto los Términos y Condiciones y la Política de Privacidad   ← obligatoria
☐  Autorizo el tratamiento de mis datos personales                 ← obligatoria
☐  Deseo recibir información comercial                             ← OPCIONAL
```

| Regla | |
|---|---|
| Ninguna casilla viene premarcada | Sin excepción |
| La tercera **nunca** puede ser obligatoria | Condicionar el servicio a aceptar publicidad invalida el consentimiento |
| Se guarda fecha, hora, IP y **versión del texto aceptado** | Los términos cambian con el tiempo |

### 🔴 Identificación del proveedor

En el pie de todas las páginas: razón social, RUC, domicilio fiscal, correo y
teléfono. Más los enlaces a Términos, Privacidad y Libro de Reclamaciones.

### 🔴 Prohibiciones absolutas

| No hacer | Por qué |
|---|---|
| Prometer o proyectar ingresos | Publicidad engañosa · INDECOPI |
| Simuladores de ganancias | Igual |
| Testimonios no verificables | Igual |
| Cifras de socios o ventas sin respaldo | Igual |
| Frases de enriquecimiento rápido | Igual |

**Avisos obligatorios que sí deben aparecer:**

```
En la comparativa de packs:
  "Los ingresos dependen del esfuerzo comercial de cada distribuidor.
   Max Global Corporation no garantiza ningún nivel de ingresos."

En la explicación del plan:
  "Este plan describe cómo se calculan las comisiones.
   No constituye una proyección ni una promesa de ingresos."
```

### Datos que faltan para completar los textos legales

Razón social · RUC · domicilio fiscal · correo y teléfono oficial.
**Dejarlos como configuración, no inventarlos.**

### Tests obligatorios de cumplimiento

| Test | Verifica |
|---|---|
| Playwright | El Libro de Reclamaciones se alcanza en ≤2 clics desde la portada |
| Playwright | No se puede registrar sin marcar las dos casillas obligatorias |
| Playwright | Se puede registrar **sin** marcar la casilla de marketing |
| Playwright | El pie muestra razón social, RUC y domicilio en todas las páginas |
| Vitest | El registro guarda la versión del texto aceptado |


---

## ❌ NO CONSTRUIR: TIENDA REPLICADA POR SOCIO

El cliente pidió que cada socio tenga su propia tienda con su nombre.
**Rechazado el 26/08/2026. No lo construyas ni lo prepares.**

La atribución de ventas al socio se resuelve con el enlace de referido:

```
   maxglobaloficial.com/?ref=MG-00417
```

El código de referido se guarda y viaja con el pedido hasta el WhatsApp. **Eso
es todo lo que hay que implementar.** Sin rutas por socio, sin subdominios, sin
páginas personalizadas.
