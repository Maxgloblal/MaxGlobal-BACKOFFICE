# BRIEF MAESTRO PARA CLAUDE DESIGN

**Max Global Corporation** · Landing comercial
**Dominio:** `maxglobaloficial.com`

> **Cómo usar este documento:** péguelo completo al inicio de la conversación con
> Claude Design. Define el sistema de diseño y las reglas. Después se le va
> pidiendo pantalla por pantalla con el documento `01-COPY-Y-PANTALLAS`.

---

# 1 · QUÉ ES ESTE PROYECTO

Max Global Corporation es una empresa peruana de **venta directa** de productos
naturales de salud y cosmética: moringa, café, colágeno, aceites y perfumería.

No tiene tiendas físicas. Vende a través de una red de socios distribuidores.

## Los dos públicos de esta web

```
   ┌────────────────────────────────┐   ┌────────────────────────────────┐
   │  EL CONSUMIDOR                 │   │  EL FUTURO SOCIO               │
   │                                │   │                                │
   │  Busca un producto natural     │   │  Busca ingreso adicional       │
   │  Quiere saber qué es y cuánto  │   │  Quiere saber cómo funciona    │
   │  cuesta                        │   │  el negocio                    │
   └────────────────────────────────┘   └────────────────────────────────┘
```

**La web tiene que atender a los dos sin confundirlos.** El consumidor entra por
el producto; el futuro socio entra por la oportunidad.

**El énfasis principal es la oportunidad de negocio.** La jerarquía visual debe
llevar hacia los packs de afiliación.

---

# 2 · SISTEMA DE DISEÑO

## Colores — la paleta oficial tiene solo dos

```css
--mg-dorado:  #D1AD68;   /* PRINCIPAL — el color de la marca */
--mg-verde:   #1BA741;   /* SECUNDARIO — acentos y confirmaciones */
--mg-blanco:  #FFFFFF;   /* fondo preferido */
```

**Escala de apoyo** — derivada, para estados de interfaz. **Nunca sobre el logo:**

```css
--mg-dorado-claro:  #E3CB9B;
--mg-dorado-oscuro: #A8873F;
--mg-verde-claro:   #4FC470;
--mg-verde-oscuro:  #148032;

--mg-gris-900: #1A1A1A;   /* texto principal */
--mg-gris-600: #5C5C5C;   /* texto secundario */
--mg-gris-200: #E8E8E8;   /* bordes y separadores */
--mg-gris-50:  #FAF8F4;   /* fondo alterno, cálido */
```

### Reglas de color — importantes

**El fondo es blanco siempre que sea posible.** Es lo que dice el brandbook.

**El dorado es acento, no fondo.** Grandes superficies doradas se ven baratas y
saturan. Úsalo en botones principales, subrayados, iconos y números destacados.

**El verde existe para que el dorado no se perciba tosco.** Es su función según
el manual. Sirve para confirmaciones, checkmarks y elementos de "beneficio
incluido".

**Nunca dorado sobre verde ni verde sobre dorado.** No hay contraste suficiente
y falla accesibilidad.

**Secciones alternas en `--mg-gris-50`**, no en dorado claro.

## Tipografía

| Uso | Fuente | Notas |
|---|---|---|
| **Titulares** | **Agus Sans** | Es la del logo. Solo para H1 y H2 |
| **Web / cuerpo** | **Caviar Dreams** | El brandbook la designa para digital |
| Respaldo | system-ui, sans-serif | Si las anteriores no cargan |

Los archivos `.ttf` están en `06-MARCA/01. Tipografia`. **Conviértelos a
`.woff2`** — pesan de 3 a 5 veces menos.

### Escala tipográfica

```css
--txt-hero:  clamp(2.5rem, 6vw, 4.5rem);   /* H1 de portada */
--txt-h1:    clamp(2rem, 4vw, 3rem);
--txt-h2:    clamp(1.5rem, 3vw, 2.25rem);
--txt-h3:    1.375rem;
--txt-body:  1.0625rem;    /* 17px — más legible que 16 en Caviar Dreams */
--txt-small: 0.9375rem;
```

**Caviar Dreams es una tipografía de trazo fino.** Necesita más tamaño y más
interlineado que una fuente normal. Cuerpo a 17px y `line-height: 1.7`.

## Espaciado y ritmo

```css
--sp-1: 0.5rem;   --sp-2: 1rem;    --sp-3: 1.5rem;
--sp-4: 2rem;     --sp-6: 3rem;    --sp-8: 4rem;
--sp-12: 6rem;    --sp-16: 8rem;   /* separación entre secciones */

--radio:     12px;    /* tarjetas y botones */
--radio-lg:  20px;    /* tarjetas de pack */
--ancho-max: 1200px;
```

## Componentes

### Botón principal
Fondo `--mg-dorado`, texto `--mg-gris-900`, radio 12px, padding `16px 32px`,
peso 600. Al pasar el cursor: `--mg-dorado-oscuro` con texto blanco.

### Botón WhatsApp
Fondo `#25D366`, icono de WhatsApp a la izquierda, texto blanco.
**Es el botón que más se usa en todo el sitio.**

### Tarjeta de producto
Fondo blanco, borde `--mg-gris-200`, radio 12px. Imagen del producto arriba.
Precio en `--mg-gris-900` grande. Insignia verde redondeada con los puntos.
Al pasar el cursor: se eleva 4px con sombra suave.

### Tarjeta de pack
Radio 20px. **La del Pack Gold va destacada** con borde dorado de 2px y una
cinta superior que diga "EL MÁS ELEGIDO". Las demás con borde gris.

### Insignia de puntos
Pastilla verde, texto blanco, tamaño pequeño: `18 puntos`.

---

# 3 · TONO Y ESTILO VISUAL

## La sensación que se busca

**Oportunidad de negocio seria.** No es una marca de bienestar contemplativa: es
una empresa que ofrece un camino de ingresos y quiere que se note.

| Sí | No |
|---|---|
| Números grandes y claros | Frases motivacionales vacías |
| Comparativas concretas | Fotos de gente saltando en la playa |
| El plan explicado paso a paso | Promesas de riqueza |
| Botones evidentes | Diseño tímido |
| Blanco con aire | Fondos dorados saturados |

## Referencias de estructura

Piensa en cómo presentan sus planes las empresas de venta directa establecidas:
una portada que plantea la propuesta, una comparativa de paquetes clara como
tabla de precios de software, y explicación del mecanismo con diagramas.

**La comparativa de packs es la pantalla más importante del sitio.** Todo lo
demás lleva hacia ahí.

---

# 4 · 🔴 REGLAS LEGALES — NO NEGOCIABLES

> **Esto no es una preferencia de estilo. Es lo que INDECOPI sanciona.**
> El proyecto tiene un documento legal completo en `08-LEGAL`.

## Prohibido en toda la web

| ❌ Nunca | Por qué |
|---|---|
| **Prometer ganancias** — "gana S/. 3,000 al mes" | Publicidad engañosa, Ley 29571 |
| **Mostrar ejemplos de ingresos** de socios | Igual |
| **Testimonios inventados** o sin respaldo | Igual |
| **Cifras sin fuente** — "más de 5,000 socios" | Igual |
| **Atribuir propiedades curativas** a los productos | Son alimentos, no medicamentos |
| **Decir "hasta 55% de descuento"** | El socio recompra al 50%. El 55% es otra cosa |

## La regla que resume todo

> **Se explica CÓMO funciona el plan. Nunca CUÁNTO se gana.**

Los porcentajes del plan sí se pueden mostrar —son un hecho verificable—.
Lo que no se puede es proyectar cuánto dinero significa eso para alguien.

```
   ✅ "El nivel 1 recibe el 20% del pack"
   ❌ "Con 10 afiliados ganarías S/. 2,400"
```

## Sobre los productos

Son **suplementos y alimentos**, no medicamentos. La web puede describir qué
son, de qué están hechos y cómo se usan. **No puede decir que curan, previenen o
tratan ninguna enfermedad.**

```
   ✅ "Café instantáneo con moringa"
   ✅ "Aporta antioxidantes naturales"
   ❌ "Combate la diabetes"
   ❌ "Elimina el dolor articular"
```

## Obligatorio en el sitio

| Qué | Dónde |
|---|---|
| Razón social, RUC y domicilio fiscal | Pie de página, todas las pantallas |
| **Libro de Reclamaciones virtual** | Enlace visible en el pie |
| Política de privacidad | Pie de página |
| Términos y condiciones | Pie de página |
| Casilla de consentimiento de datos | Formulario de registro |

**El Libro de Reclamaciones es obligatorio por la Ley 32495.** Debe estar
visible, no escondido.

---

# 5 · ESTRUCTURA DEL SITIO

Son **6 pantallas**:

```
   P-01  PORTADA          La propuesta y el camino a los packs
   P-02  PRODUCTOS        Catálogo con precios públicos
   P-03  PACKS            🔴 La pantalla clave — comparativa de afiliación
   P-04  REGISTRO         Formulario de pre-registro
   P-05  CONFIRMACIÓN     Datos de pago y contacto por WhatsApp
   P-06  NOSOTROS         La empresa
```

## Cómo se compra — importante para el diseño

**No hay carrito con pago en línea.** El recorrido es:

```
   El visitante arma su pedido
            │
            ▼
   Pulsa "Pedir por WhatsApp"
            │
            ▼
   Se abre WhatsApp con el pedido ya escrito
            │
            ▼
   Max Global cotiza el envío y cierra la venta
```

**Por eso el botón de WhatsApp es el elemento más importante de la interfaz.**
Debe estar siempre a la vista: flotante en móvil, en la barra superior en
escritorio.

## El enlace de referido

Cada socio comparte `maxglobaloficial.com/?ref=MG-00417`.

Ese código **viaja con el visitante por todo el sitio** y se incluye en el
mensaje de WhatsApp. Si existe, se puede mostrar discretamente en la barra
superior: *"Te recomendó: María T."*

**No se construyen tiendas separadas por socio.** Solo el parámetro en la URL.

---

# 6 · REQUISITOS TÉCNICOS

| Requisito | Valor |
|---|---|
| Enfoque | **Móvil primero** — la mayoría del tráfico será de celular |
| Puntos de quiebre | 640 · 768 · 1024 · 1280 |
| Accesibilidad | Contraste AA. El dorado sobre blanco **no** cumple para texto pequeño |
| Peso de la portada | Menos de 1 MB |
| Imágenes | WebP con respaldo, carga diferida bajo el pliegue |
| Sin | Animaciones pesadas, carruseles automáticos, ventanas emergentes |

## ⚠️ Advertencia de contraste

`#D1AD68` sobre blanco da una relación de aproximadamente **2:1**. **No cumple
AA para texto.**

- **Sí:** dorado como fondo de botón con texto oscuro encima
- **Sí:** dorado en elementos gráficos grandes, iconos, líneas
- **No:** texto dorado sobre blanco en tamaño de cuerpo

Para texto de énfasis usa `--mg-dorado-oscuro` (#A8873F), que sí pasa.

---

# 7 · LO QUE FALTA Y HAY QUE PEDIR

*Jack va a adjuntar los recursos gráficos. Estos son los que hacen falta:*

| # | Qué | Para qué |
|---|---|---|
| 1 | **Fotografías de los 8 productos**, fondo transparente | Catálogo y portada |
| 2 | Logo en **SVG** (está en `.ai`) | Barra superior y pie |
| 3 | Tipografías en `.woff2` | Rendimiento |
| 4 | Fotografía de la empresa o el equipo | Pantalla Nosotros |
| 5 | **Descripción real de cada producto** | Copy del catálogo |
| 6 | Razón social, RUC y domicilio | Pie legal |
| 7 | Cuenta bancaria completa | Pantalla de confirmación |

> **El punto 5 es el que más falta.** El copy de productos que se entrega en el
> siguiente documento está redactado con lo que se sabe. **Máximo tiene que
> confirmar qué es cada producto**, sobre todo "Esplendor", del que solo sabemos
> el precio y los puntos.

---

**Siguiente paso:** abrir `01-COPY-Y-PANTALLAS` y pedirle a Claude Design una
pantalla a la vez, empezando por P-03 (packs), que es la que define el estilo de
todo lo demás.
