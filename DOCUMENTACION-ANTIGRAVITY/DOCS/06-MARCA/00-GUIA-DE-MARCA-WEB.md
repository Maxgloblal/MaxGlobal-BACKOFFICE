# GUÍA DE MARCA PARA WEB

> ## 📌 ESTE DOCUMENTO ES SOLO LA PARTE DE CÓDIGO
>
> **Para todo lo demás de la marca —misión, visión, pilares, reglas del logo,
> datos institucionales— ve a `00-MARCA-COMPLETA`.**
>
> Ese documento tiene extraído todo lo que dicen las fuentes originales, así que
> no hace falta abrir ningún PDF.


**Versión:** 1.0 · **Fecha:** 25 de agosto de 2026
**Fuente:** `02. Logo/00. Manual de Marca/Brandbook_Max_Global.pdf` (18 páginas)

> Este documento traduce el manual de marca a **valores listos para código**.
> Es lo que necesitan los roles R4 (frontend público) y R5 (backoffice) para
> que el sistema respete la identidad visual.
>
> **El brandbook manda.** Si algo acá contradice al PDF original, vale el PDF.

---

## 1. COLORES INSTITUCIONALES

La paleta oficial tiene **solo dos colores**.

### Dorado / Mostaza — color principal

| Formato | Valor |
|---|---|
| **HEX** | `#D1AD68` |
| RGB | 209, 173, 104 |
| CMYK | 22 · 32 · 66 · 0 |

> *"El MOSTAZA (DORADO) es el color principal de MAX GLOBAL. Buscamos
> transmitir estos valores y crear una conexión visual positiva con nuestros
> clientes y socios."*

### Verde — color secundario

| Formato | Valor |
|---|---|
| **HEX** | `#1BA741` |
| RGB | 27, 167, 65 |
| CMYK | 79 · 0 · 95 · 0 |

> *"El VERDE tiene un carácter neutro y evita que el DORADO se perciba de forma
> tosca."*

### Fondo

> *"El color preferido para usar de fondo es el blanco siempre que sea posible."*

---

## 2. TOKENS PARA CÓDIGO

```css
:root {
  /* Institucionales — únicos colores de marca */
  --mg-dorado:  #D1AD68;   /* principal */
  --mg-verde:   #1BA741;   /* secundario */
  --mg-blanco:  #FFFFFF;   /* fondo preferido */

  /* Escala de apoyo — derivada, NO institucional.
     Usar solo para estados de interfaz, nunca para el logo. */
  --mg-dorado-claro:  #E3CB9B;
  --mg-dorado-oscuro: #A8873F;
  --mg-verde-claro:   #4FC470;
  --mg-verde-oscuro:  #13802F;

  /* Neutros de interfaz */
  --mg-texto:       #1F2328;
  --mg-texto-suave: #6B7280;
  --mg-borde:       #E3E6E8;
  --mg-fondo-suave: #F7F9F8;

  /* Estados del sistema */
  --mg-exito:   #1BA741;   /* usa el verde de marca */
  --mg-alerta:  #D97706;
  --mg-error:   #DC2626;
}
```

### Cómo aplicarlos en el sistema

| Elemento | Color |
|---|---|
| Botón principal (comprar, registrarse) | Dorado `#D1AD68` |
| Botón secundario / confirmación | Verde `#1BA741` |
| Fondo general | Blanco |
| Encabezados de tabla | Verde oscuro o dorado |
| Estado ACTIVO del socio | Verde `#1BA741` |
| Estado INACTIVO | Gris `#6B7280` |
| Alertas de puntos faltantes | Alerta `#D97706` |
| Errores y rechazos | Error `#DC2626` |

> **Regla del brandbook:** *"La aplicación de estos colores debe mantenerse
> constante en la medida de lo posible."* No inventar colores de marca nuevos.

---

## 3. TIPOGRAFÍA

### Agus Sans — corporativa

Es la familia oficial de la marca. Elegida *"por su claridad, modernidad y
buena legibilidad"*.

**Uso en el sistema:** títulos, encabezados, nombres de rango, cifras
destacadas.

**Archivo:** `01. Tipografia/Agus Sans/AgusSans-Regular.ttf`
⚠️ Solo viene el peso Regular. Para negritas hay que usar Caviar Dreams Bold o
simular el peso.

### Caviar Dreams — secundaria, **la designada para web**

El brandbook la asigna explícitamente a la página web:

> *"Para soportes o aplicaciones que, por razones técnicas, no permiten la
> utilización de la tipografía corporativa, **por ejemplo en la página web**, o
> los textos editados por la empresa, se utilizará la tipografía CAVIAR
> DREAMS."*

**Uso en el sistema:** cuerpo de texto, tablas, formularios, todo el backoffice.

**Archivos disponibles:**
- `CaviarDreams.ttf` (regular)
- `CaviarDreams_Bold.ttf`
- `CaviarDreams_Italic.ttf`
- `CaviarDreams_BoldItalic.ttf`

*Los 4 pesos completos — por eso funciona mejor para interfaz.*

### Implementación

```css
@font-face {
  font-family: 'Agus Sans';
  src: url('/fonts/AgusSans-Regular.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'Caviar Dreams';
  src: url('/fonts/CaviarDreams.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}
/* repetir para Bold, Italic y BoldItalic */

:root {
  --mg-fuente-titulo: 'Agus Sans', 'Caviar Dreams', sans-serif;
  --mg-fuente-texto:  'Caviar Dreams', system-ui, sans-serif;
}
```

> **Nota técnica:** convertir los `.ttf` a `.woff2` antes de subirlos. Pesan
> entre 3 y 5 veces menos y el sitio carga notablemente más rápido en móvil,
> que es donde va a entrar la mayoría de socios.

---

## 4. LOGOTIPO

### Versiones disponibles

| Versión | Cuándo usarla |
|---|---|
| **Horizontal** | Cabecera del sitio, barra del backoffice, correos |
| **Vertical** | Portadas, pantallas de carga, documentos |
| **Isotipo** (solo símbolo) | Favicon, avatar de redes, ícono de la app |

Cada una viene en **3 acabados**: Color, Negro y Blanco.

### Archivos

```
02. Logo/
├── 00. Manual de Marca/  Brandbook_Max_Global.pdf
├── 01. Editable/         Logo_Max_Global.ai        ← vectorial fuente
├── 02. PDF/              Logo_Max_Global.pdf       ← vectorial para imprenta
└── 03. PNG/              9 variantes listas para web
```

**Para el sitio web usar:**

| Ubicación | Archivo |
|---|---|
| Cabecera (fondo blanco) | `Logo_Max_Global-[Color-Horizontal].png` |
| Pie de página (fondo oscuro) | `Logo_Max_Global-[Blanco-Horizontal].png` |
| Favicon | `Logo_Max_Global-[Color-Isotipo].png` |
| Carga / splash | `Logo_Max_Global-[Color-Vertical].png` |

> **Recomendación:** exportar el `.ai` a SVG para la web. El PNG se pixela en
> pantallas retina y pesa más. El SVG escala perfecto en cualquier tamaño.

### 🔴 Reglas obligatorias del brandbook

> *"Nuestro logo nunca debe ser alterado, modificado o recreado; cualquier
> intento de modificar o alterar nuestro logotipo es una violación directa de
> nuestra política de marca."*

**Prohibido:**
- Cambiar las proporciones o estirarlo
- Cambiar los porcentajes de color
- Recrearlo o redibujarlo
- Ponerlo sobre fondos sin contraste suficiente
- Modificar los márgenes de respeto

---

## 5. OTROS RECURSOS DISPONIBLES

| Carpeta | Contenido | Uso en el sistema |
|---|---|---|
| `03. Imagen Perfil` | 8 imágenes de perfil (4 logo + 4 símbolo) | Redes sociales, avatar por defecto del socio |
| `04. Tarjeta Personal` | Editable AI + PDF + 2 JPG | Material impreso. Posible módulo futuro: tarjeta digital del socio |
| `05. Hoja Membretada` | AI + PDF + JPG + **DOCX** | Plantilla para comunicados. El DOCX sirve para generar constancias |
| `06. Video Logo Animado` | MP4 horizontal y vertical | Intro del landing, pantalla de carga, redes |

> **Idea aprovechable:** el video del logo animado funciona muy bien como
> animación de carga mientras el sistema calcula comisiones o dibuja el árbol
> genealógico. Da sensación de producto terminado con cero esfuerzo extra.

---

## 6. QUÉ SIGNIFICA ESTO PARA EL PROYECTO

✅ **El rol R9 (Diseño de marca) queda CERRADO.**
El cliente entregó un kit completo y profesional: manual de marca, logo
vectorial en todas sus variantes, tipografías con licencia, papelería y video.

**Consecuencias:**

1. **R4 y R5 se destraban.** Ya no esperan a que Jack defina la marca — tienen
   colores, tipografías y logos listos.
2. **No hay que inventar identidad visual.** Todo está normado.
3. **Ahorro de tiempo real** en la semana 1 del cronograma.

**Lo único que queda por hacer:**

| Tarea | Rol | Esfuerzo |
|---|---|---|
| Convertir `.ttf` a `.woff2` | R4 | 10 minutos |
| Exportar el `.ai` a SVG | R4 | 15 minutos |
| Generar el favicon en varios tamaños | R4 | 10 minutos |
| Armar mockups de pantallas con estos colores | R9 | — |

📌 *Espacio reservado para los mockups de pantallas cuando estén listos.*
