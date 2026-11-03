# SEO Y ESTRUCTURA TÉCNICA

**Landing de Max Global** · `maxglobaloficial.com`

---

> ## ⚠️ ANTES DE LEER — QUÉ ESTÁ VERIFICADO Y QUÉ NO
>
> La búsqueda web no estuvo disponible al escribir este documento (se alcanzó el
> límite de la cuenta). Eso cambia la confianza de cada parte:
>
> | Parte | Confianza |
> |---|---|
> | Estructura técnica, etiquetas, datos estructurados | **Alta** — no cambia con el tiempo |
> | Arquitectura de contenido y jerarquía | **Alta** |
> | **Palabras clave concretas y su volumen en Perú** | 🔴 **Sin verificar — hay que confirmarlas** |
> | Competencia en el buscador | 🔴 **Sin verificar** |
>
> **Las palabras clave de la sección 2 son hipótesis razonadas, no datos.**
> Antes de escribir los títulos definitivos hay que validarlas con el Planificador
> de Palabras Clave de Google o con Search Console.

---

# 1 · LA REALIDAD DEL SEO PARA ESTE SITIO

## Un sitio de 6 páginas no compite por términos amplios

Buscar posicionar por "moringa" o "colágeno" contra tiendas grandes y farmacias
es perder tiempo. **Ese no es el juego de esta landing.**

## Lo que sí puede ganar

```
   1. MARCA          "max global corporation", "max global perú"
                     Tiene que salir primero. Es lo mínimo.

   2. NEGOCIO        "afiliarse a max global", "negocio multinivel perú"
                     Nicho, poco volumen, pero intención altísima.

   3. PRODUCTO       "café de moringa perú", "comprar moringa lima"
                     Cola larga. Menos competencia.
```

**La prioridad real es 1 y 2.** Alguien que ya escuchó de Max Global por un socio
va a buscar el nombre. Si no aparece la web oficial, el socio pierde credibilidad.

## Lo que más tráfico va a traer no es Google

Este negocio se mueve por **WhatsApp y redes**. Un socio comparte su enlace, la
persona entra directo. **Google es respaldo, no el canal principal.**

Por eso lo que más rinde es:

| Prioridad | Qué | Por qué |
|---|---|---|
| 🔴 1 | **Velocidad en móvil** | El tráfico llega de WhatsApp, en celular, con datos móviles |
| 🔴 2 | **Vista previa al compartir** | Es lo que se ve cuando el socio pega el enlace |
| 🟡 3 | Posicionamiento por marca | Credibilidad |
| 🟢 4 | Cola larga de producto | Bonus |

---

# 2 · PALABRAS CLAVE — 🔴 HIPÓTESIS, NO DATOS

*Ordenadas por intención, no por volumen. **Confirmar antes de usar.***

## Intención de marca — la más importante

```
   max global corporation
   max global perú
   max global corporation opiniones
   max global productos
```

> Alguien que busca "opiniones" está evaluando. **Vale la pena que la web
> responda esa duda** con información clara del plan, no con testimonios
> inventados —que además están prohibidos—.

## Intención de negocio

```
   afiliarse a max global
   como ser distribuidor de max global
   negocio multinivel perú
   venta directa productos naturales perú
   ganar dinero vendiendo productos naturales
```

## Intención de producto — cola larga

```
   café de moringa
   moringa en cápsulas perú
   colágeno hidrolizado perú
   beneficios de la moringa
   donde comprar moringa en lima
```

> ⚠️ **"Beneficios de la moringa" es tentador y es una trampa.** Ese contenido
> obliga a hacer afirmaciones de salud, y ahí es donde se cae en publicidad
> prohibida. Si se hace, se hace con muchísimo cuidado.

---

# 3 · MAPA DE PÁGINAS Y ETIQUETAS

*Los títulos van en menos de 60 caracteres, las descripciones en menos de 155.*

## P-01 · Portada — `/`

```
Título:        Max Global Corporation | Venta directa de productos naturales
Descripción:   Empresa peruana de venta directa. Productos naturales de moringa,
               café y colágeno. Conoce los packs de afiliación y el plan de
               comisiones.
H1:            Un negocio propio con productos que la gente vuelve a comprar
```

## P-02 · Productos — `/productos`

```
Título:        Productos naturales de moringa y colágeno | Max Global
Descripción:   Café de moringa, colágeno, aceites y cápsulas. Precios de venta al
               público. Los socios compran con 50% de descuento.
H1:            Nuestros productos
```

## P-03 · Packs — `/packs-de-afiliacion` 🔴

```
Título:        Packs de afiliación desde S/. 120 | Max Global Corporation
Descripción:   Cinco formas de empezar en Max Global. Compara productos incluidos,
               descuento de recompra y niveles de comisión de cada pack.
H1:            Elige cómo quieres empezar
```

> **Esta es la página que más importa posicionar** después de la portada. La URL
> lleva la palabra clave.

## P-04 · Registro — `/registro`

```
Título:        Regístrate para afiliarte | Max Global Corporation
Descripción:   Completa tus datos y un asesor te contacta por WhatsApp. No se
               cobra nada en este paso.
H1:            Regístrate para afiliarte
Robots:        noindex
```

> **`noindex` a propósito.** Un formulario no aporta nada al buscador.

## P-05 · Confirmación — `/confirmacion`

```
Robots:        noindex, nofollow
```

## P-06 · Nosotros — `/nosotros`

```
Título:        Sobre Max Global Corporation | Empresa peruana
Descripción:   Conoce Max Global Corporation, empresa peruana de venta directa de
               productos naturales.
H1:            Max Global Corporation
```

---

# 4 · 🔴 LO QUE MÁS IMPORTA — LA VISTA PREVIA EN WHATSAPP

**Cada vez que un socio comparta su enlace, WhatsApp va a mostrar una tarjeta.**
Esa tarjeta es la primera impresión de la marca, y va a ocurrir miles de veces.

**Si sale mal, sale mal miles de veces.**

```html
<meta property="og:title"       content="Max Global Corporation">
<meta property="og:description" content="Productos naturales y un plan de negocio
                                         propio. Conoce los packs desde S/. 120.">
<meta property="og:image"       content="https://maxglobaloficial.com/og.jpg">
<meta property="og:url"         content="https://maxglobaloficial.com">
<meta property="og:type"        content="website">
<meta property="og:locale"      content="es_PE">

<meta name="twitter:card"       content="summary_large_image">
```

## La imagen de vista previa

| Requisito | Valor |
|---|---|
| Tamaño | **1200 × 630 px** |
| Peso | Menos de 300 KB |
| Contenido | Logo + producto + una frase corta |
| Texto | **Grande.** En WhatsApp se ve pequeña |
| Fondo | Blanco o dorado suave |

> **Jack: esta imagen es la que más veces va a ver la gente de toda la web.**
> Vale la pena hacerla bien.

## El enlace de referido no debe romper la vista previa

```
   maxglobaloficial.com/?ref=MG-00417
```

El parámetro `?ref=` **no cambia la vista previa** — WhatsApp lee las mismas
etiquetas. Pero hay que agregar la canónica para que Google no vea páginas
duplicadas:

```html
<link rel="canonical" href="https://maxglobaloficial.com/">
```

**Sin esto, cada socio genera una URL distinta y Google las cuenta como
contenido duplicado.** Con cientos de socios, eso hunde el posicionamiento.

> Este es exactamente el problema por el que se rechazó la tienda replicada por
> socio. Con el parámetro y la canónica, se evita.

---

# 5 · DATOS ESTRUCTURADOS

## En todas las páginas — la organización

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Max Global Corporation",
  "url": "https://maxglobaloficial.com",
  "logo": "https://maxglobaloficial.com/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PE",
    "streetAddress": "[domicilio fiscal]"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "[whatsapp]",
    "contactType": "sales",
    "availableLanguage": "Spanish"
  }
}
```

## En la página de productos — cada producto

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Café de Moringa",
  "description": "Café instantáneo con moringa",
  "brand": { "@type": "Brand", "name": "Max Global" },
  "offers": {
    "@type": "Offer",
    "price": "150.00",
    "priceCurrency": "PEN",
    "availability": "https://schema.org/InStock"
  }
}
```

> ⚠️ **El precio del esquema es el PÚBLICO (S/. 150), no el del socio.** Poner el
> precio de socio sería información engañosa para quien llega desde el buscador.

## 🔴 Lo que NO se debe poner

**Nunca uses `AggregateRating` ni `Review` con datos inventados.** Google penaliza
las reseñas falsas y además cae bajo publicidad engañosa en Perú.

---

# 6 · VELOCIDAD — LA MÉTRICA QUE SÍ IMPORTA

El tráfico va a llegar **de WhatsApp, en celular, muchas veces con datos
móviles**. La velocidad no es un detalle de SEO: es si la persona ve la página o
cierra.

## Objetivos

| Métrica | Meta |
|---|---|
| Peso de la portada | < 1 MB |
| Tiempo hasta ver contenido | < 2.5 s en 4G |
| Imágenes | WebP, `loading="lazy"` bajo el pliegue |
| Tipografías | `.woff2` con `font-display: swap` |
| JavaScript | El mínimo. Es una landing, no una aplicación |

## Lo que más pesa en un sitio así

```
   1. Fotografías de producto sin comprimir     ← el problema número uno
   2. Tipografías en .ttf en vez de .woff2
   3. Bibliotecas de animación innecesarias
   4. Iconos cargados como paquete completo
```

**Las tipografías del brandbook están en `.ttf`.** Convertirlas a `.woff2` es de
las cosas de mejor retorno de todo el proyecto: pesan entre 3 y 5 veces menos.

---

# 7 · LISTA DE VERIFICACIÓN ANTES DE PUBLICAR

```
   TÉCNICO
   ☐  Título y descripción únicos en cada página
   ☐  Un solo H1 por página
   ☐  Etiquetas Open Graph con imagen de 1200×630
   ☐  Canónica en la portada (por el ?ref=)
   ☐  noindex en registro y confirmación
   ☐  sitemap.xml y robots.txt
   ☐  Datos estructurados de Organization
   ☐  Certificado HTTPS
   ☐  Redirección de www a sin www (o al revés, pero una sola)

   CONTENIDO
   ☐  Texto alternativo en todas las imágenes
   ☐  Enlaces internos entre productos y packs
   ☐  Ningún texto promete ganancias
   ☐  Ningún producto tiene atribución curativa
   ☐  En ningún lado dice "hasta 55%"

   LEGAL — sin esto no se publica
   ☐  Libro de Reclamaciones visible en el pie
   ☐  Razón social, RUC y domicilio en el pie
   ☐  Política de privacidad enlazada
   ☐  Términos y condiciones enlazados
   ☐  Casilla de consentimiento separada de la de publicidad

   VELOCIDAD
   ☐  Imágenes en WebP y comprimidas
   ☐  Tipografías en .woff2
   ☐  Portada bajo 1 MB
   ☐  Probado en un celular real con datos móviles
```

---

# 8 · DESPUÉS DE PUBLICAR

| # | Qué | Cuándo |
|---|---|---|
| 1 | Dar de alta en **Google Search Console** | El primer día |
| 2 | Enviar el `sitemap.xml` | El primer día |
| 3 | Crear el **Perfil de Empresa de Google** | Primera semana |
| 4 | Verificar cómo se ve el enlace al compartirlo en WhatsApp | Antes de avisar a los socios |
| 5 | Revisar en Search Console qué buscó la gente de verdad | Al mes |

> **El punto 5 es el que reemplaza la investigación de palabras clave que no se
> pudo hacer.** Al mes de estar publicada, Search Console dice exactamente qué
> escribe la gente para llegar. Eso vale más que cualquier estimación previa.

---

# 9 · PENDIENTE CUANDO VUELVA LA BÚSQUEDA WEB

```
   ☐  Validar volúmenes reales de las palabras clave de la sección 2
   ☐  Revisar quién está posicionado hoy para "multinivel perú"
   ☐  Confirmar la normativa vigente de DIGESA sobre qué se puede
      afirmar de un suplemento alimenticio en publicidad
   ☐  Revisar si "Max Global" colisiona con otra marca en el buscador
```

> **El tercer punto es el más importante de los cuatro.** Las reglas de este
> documento sobre atribución de propiedades curativas vienen del Código del
> Consumidor, que sí está verificado en `08-LEGAL`. Pero la norma sanitaria
> específica de DIGESA para rotulado y publicidad de suplementos **conviene
> confirmarla** antes de publicar descripciones de producto.
