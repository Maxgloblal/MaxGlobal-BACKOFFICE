# MARCA MAX GLOBAL — TODO EN UN SOLO LUGAR

**Este documento reemplaza tener que abrir los PDFs.**

**Versión:** 1.0 · **Fecha:** 27 de agosto de 2026

---

> ## POR QUÉ EXISTE
>
> El 27/08 se pidió al cliente la misión y la visión **que ya estaban entregadas**
> desde el 25, en la página 2 del deck institucional. Nadie abrió ese PDF porque
> pesa 81 MB y se asumió que solo traía el plan de compensación.
>
> **Acá está todo lo que dicen las fuentes originales sobre la marca**, extraído
> literal. Si algo no está en este documento, no está en las fuentes.

## De dónde salió cada cosa

| Fuente | Qué aportó |
|---|---|
| `99-FUENTES-ORIGINALES/MAX GLOBAL Corporation (4).pdf` | Misión, visión, pilares y lemas — **página 2** |
| `06-MARCA/02. Logo/00. Manual de Marca/Brandbook_Max_Global.pdf` | Colores, tipografías y reglas de uso del logo |
| `04-CLIENTE/02-RESPUESTAS-CONFIRMADAS` | Datos institucionales confirmados por WhatsApp |

---

# 1 · IDENTIDAD INSTITUCIONAL

## Misión — texto oficial, literal

> *"Nuestra misión es transformar vidas en Latinoamérica a través de productos
> naturales de alta calidad y un modelo de negocio que impulsa el crecimiento
> personal, financiero y empresarial de las familias mediante franquicias y
> centros de bienestar."*

## Visión — texto oficial, literal

> *"Ser la empresa líder en bienestar integral y emprendimiento de Latinoamérica,
> reconocida por la excelencia de nuestros productos, el impacto positivo en el
> desarrollo financiero de las personas y una sólida red de franquicias que
> transformen miles de familias."*

**🔴 No parafrasear ninguno de los dos.** Van tal cual en la web y en cualquier
material.

## Los cinco pilares

*Lámina **"¿Por qué elegir Max Global?"** del deck.*

| Pilar | Texto oficial |
|---|---|
| **Productos naturales** | De alta calidad y listos para vender |
| **Espacio para tu talento** | Posibilidad de proponer e incorporar productos innovadores al catálogo |
| **Negocio inteligente** | Plan de ganancias competitivo y modelo de franquicia global |
| **Sistema educativo** | Capacitación en ventas digitales, finanzas y desarrollo personal |
| **Soporte real** | Un equipo que te acompaña y una comunidad enfocada en tu éxito |

**Estos son los valores de la marca.** No hay otra lista de valores en las fuentes.

## Lemas que aparecen en el deck

```
   "Bienvenido al mundo de la tecnología, bienestar, cosmética y natural"
   "E-commerce compensatorio"
   "Empieza un negocio sostenible"
```

**Se pueden usar.** Salen del material oficial.

## ⚠️ Dos cosas que el deck menciona y conviene tener presentes

**"Franquicias y centros de bienestar"** aparece en la misión y en la visión.
**Hoy no existe nada de eso en el sistema.** Es la ambición declarada del negocio,
no una funcionalidad. No confundir.

**El Pack VIP aparece en dos láminas** del deck. **Máximo lo eliminó el 25/08.**
Si se vuelve a ver, se ignora.

---

# 2 · COLORES

**La paleta institucional tiene solo dos colores.** Lo dice el brandbook
textualmente.

## Dorado / Mostaza — principal

| Formato | Valor |
|---|---|
| **HEX** | `#D1AD68` |
| RGB | 209 · 173 · 104 |
| CMYK | 22 · 32 · 66 · 0 |

> *"El MOSTAZA (DORADO) es el color principal de MAX GLOBAL. Buscamos transmitir
> estos valores y crear una conexión visual positiva con nuestros clientes y
> socios."*

## Verde — secundario

| Formato | Valor |
|---|---|
| **HEX** | `#1BA741` |
| RGB | 27 · 167 · 65 |
| CMYK | 79 · 0 · 95 · 0 |

> *"El VERDE tiene un carácter neutro y evita que el DORADO [sea] percibido de
> forma tosca."*

**El verde tiene una función declarada:** existe para equilibrar el dorado. No es
decorativo.

## Fondo

> *"El color preferido para usar de fondo es el blanco siempre que sea posible."*

## 🔴 Advertencia de accesibilidad — no está en el brandbook pero importa

`#D1AD68` sobre blanco da una relación de contraste de aproximadamente **2:1**.
**No cumple AA para texto.**

```
   ✅  Dorado como fondo de botón, con texto oscuro encima
   ✅  Dorado en iconos, líneas y elementos gráficos grandes
   ❌  Texto dorado sobre blanco en tamaño de cuerpo
```

Para texto de énfasis usar `#A8873F` (dorado oscuro derivado), que sí pasa.

## Escala derivada — para interfaz, NO institucional

```css
--gold-50:#FAF6EE;  --gold-100:#F3EAD6; --gold-200:#E8D6B4;
--gold-300:#E3CB9B; --gold-400:#D1AD68; --gold-500:#C09A50;
--gold-600:#A8873F; --gold-700:#7C612C; --gold-800:#55421D;

--green-50:#EBF8EE;  --green-100:#D2F0DA; --green-200:#A5E1B6;
--green-300:#4FC470; --green-400:#1BA741; --green-500:#148032;
--green-600:#106B29; --green-700:#0B4C1D;

--n-0:#FFFFFF;  --n-50:#FAF8F4;  --n-100:#F2F1ED; --n-200:#E8E8E8;
--n-300:#C8C5BC; --n-400:#8E8A80; --n-500:#5C5C5C; --n-600:#3A3733;
--n-700:#1A1A1A;

--whatsapp:#25D366;  --whatsapp-dark:#1EB558;
```

**Solo `--gold-400` y `--green-400` son institucionales.** El resto se derivó para
estados de interfaz y **nunca se aplica al logo**.

---

# 3 · TIPOGRAFÍA

## Agus Sans — corporativa

> *"La familia tipográfica corporativa de MAX GLOBAL es la AGUS SANS. Se eligió
> esta tipografía por su claridad, modernidad y buena legibilidad."*

**Uso:** títulos, logo, material impreso.

## Caviar Dreams — secundaria, y es la de la web

> *"Para soportes o aplicaciones que, por razones técnicas no permiten la
> utilización de la tipografía corporativa, **por ejemplo en la página web**, o
> los textos editados por la empresa se utilizará la tipografía CAVIAR DREAMS.
> De uso en toda la comunicación interna, señalética y comunicación externa."*

**🔴 El brandbook designa explícitamente Caviar Dreams para la web.** No es una
interpretación nuestra.

## Nota práctica

Caviar Dreams es de trazo fino. **Necesita más tamaño e interlineado que una
fuente normal:** cuerpo a 17px y `line-height: 1.7`.

## Archivos

```
   06-MARCA/01. Tipografia/
     Agus Sans/AgusSans-Regular.ttf
     Caviar Dreams/CaviarDreams.ttf
     Caviar Dreams/CaviarDreams_Bold.ttf
     Caviar Dreams/CaviarDreams_Italic.ttf
     Caviar Dreams/CaviarDreams_BoldItalic.ttf
```

**Para web van convertidas a `.woff2`** — pesan de 3 a 5 veces menos. Ya están
convertidas en `SITIO WEB.../public/fonts/`.

> **Agus Sans solo tiene Regular.** No hay bold. Si se necesita peso, se usa
> Caviar Dreams Bold.

---

# 4 · LOGO

## Qué es, según el brandbook

> *"El logotipo como representación gráfica de la marca está formado por la
> construcción tipográfica de los caracteres que componen la frase 'MAX GLOBAL',
> la cual busca transmitir y proyectar la característica principal de la empresa."*

## Las tres versiones

| Versión | Cuándo se usa |
|---|---|
| **Horizontal** | Barra superior, pie de página, hoja membretada |
| **Vertical** | Formatos altos o cuadrados |
| **Isotipo** *(solo el símbolo)* | Favicon y redes sociales |

## Sobre el isotipo — dato del brandbook

> *"El ícono de MAX GLOBAL es usado en materiales de marketing donde se utilizan
> íconos sociales. **El caso más preciso es para el favicon de la página web y
> redes sociales.** Este símbolo es la versión vertical oficial de la marca."*

## 🔴 Prohibiciones expresas

> *"Nuestro logo nunca debe ser alterado, modificado o recreado; cualquier intento
> de modificar o alterar nuestro logotipo es una **violación directa de nuestra
> política de marca**."*

El brandbook ilustra estos errores concretos:

```
   ❌ Cambiar las proporciones
   ❌ Usar porcentajes de color incorrectos
   ❌ Recrear el logo con otra tipografía
   ❌ Aplicarlo sobre fondos sin contraste suficiente
```

> *"El logotipo siempre debe aparecer de manera legible sobre cualquier fondo.
> Siempre se debe respetar la ley de márgenes y especificaciones."*

## Archivos disponibles

```
   06-MARCA/02. Logo/
     01. Editable/Logo_Max_Global.ai          ← el original vectorial
     02. PDF/Logo_Max_Global.pdf
     03. PNG/
       Logo_Max_Global-[Color-Horizontal].png     1400×220
       Logo_Max_Global-[Color-Vertical].png       1148×587
       Logo_Max_Global-[Color-Isotipo].png         825×587
       Logo_Max_Global-[Blanco-Horizontal].png
       Logo_Max_Global-[Blanco-Isotipo].png
       Logo_Max_Global-[Blanco-Vertical].png
       Logo_Max_Global-[Negro-Horizontal].png
       Logo_Max_Global-[Negro-Isotipo].png
       Logo_Max_Global-[Negro-Vertical].png
```

**Todos los PNG conservan transparencia.** Verificado.

> 📌 **Falta el SVG.** El `.ai` es el original vectorial pero no sirve en web.
> Convertirlo a SVG sigue pendiente — hoy la web usa el PNG horizontal.

---

# 5 · DATOS INSTITUCIONALES

| Dato | Valor |
|---|---|
| Nombre comercial | Max Global Corporation |
| **Razón social** | **Max Global Corporation S.A** |
| **RUC** | **20615864014** |
| Domicilio | Lima, Perú |
| WhatsApp oficial | **+51 993 516 053** → `51993516053` |
| Correo | `contacto@maxglobaloficial.com` |
| Web | `www.maxglobaloficial.com` |

## Cuentas bancarias

| Banco | Cuenta | CCI |
|---|---|---|
| **BCP Soles** | `1947426439033` | `00219400742643903392` |
| **BBVA Soles** | `0011-0150-0200867749` | `011-150-000200867749-00` |

**Titular en ambas:** Max Global Corporation S.A

> **En el código todo esto sale de `SITIO WEB.../src/config.js`**, objeto
> `EMPRESA`. Nunca escrito a mano en una página.

---

# 6 · OTROS MATERIALES ENTREGADOS

| Carpeta | Contenido |
|---|---|
| `03. Imagen Perfil` | 8 imágenes para redes y avatares |
| `04. Tarjeta Personal` | Editable, PDF y JPG |
| `05. Hoja Membretada` | Editable, PDF, JPG y DOCX |
| `06. Video Logo Animado` | MP4 horizontal y vertical |

**Ninguno se usa en la web.** Están para material impreso y redes.

---

# 7 · TOKENS LISTOS PARA CÓDIGO

*Ya implementados en `SITIO WEB.../src/styles/tokens/`.*

```css
:root {
  /* Institucionales — los únicos de marca */
  --mg-dorado:  #D1AD68;
  --mg-verde:   #1BA741;
  --mg-blanco:  #FFFFFF;

  /* Derivados de apoyo */
  --mg-dorado-claro:  #E3CB9B;
  --mg-dorado-oscuro: #A8873F;   /* el que sí pasa contraste en texto */
  --mg-verde-claro:   #4FC470;
  --mg-verde-oscuro:  #148032;

  --mg-gris-900: #1A1A1A;
  --mg-gris-600: #5C5C5C;
  --mg-gris-200: #E8E8E8;
  --mg-gris-50:  #FAF8F4;

  --font-display: 'Agus Sans', system-ui, sans-serif;
  --font-body:    'Caviar Dreams', system-ui, sans-serif;
}
```

---

# 8 · LO QUE NO ESTÁ EN NINGUNA FUENTE

*Verificado archivo por archivo el 27/08. Si hace falta, hay que pedirlo.*

| Falta | Nota |
|---|---|
| **Presentaciones de los productos** | Cuántos ml, gramos, sobres o cápsulas trae cada uno |
| **Qué es "Esplendor"** | Solo figura como nombre, precio S/. 120 y 14 puntos |
| **Fotografías de producto** | Las que hay en la web las puso Jack |
| **Logo en SVG** | Existe el `.ai`, falta convertirlo |
| **Historia de la empresa** | Años de operación, fundadores, hitos |
| **Registro sanitario** | Si los productos lo tienen vigente ante DIGESA |

---

# 9 · CURIOSIDAD DEL BRANDBOOK

En la sección *"El buen uso de la marca"* el texto dice:

> *"Para evitar resultados no deseados en la puesta en práctica de la marca
> **ROIS MOTORS IMPORT** se tienen que seguir una serie de normas genéricas."*

**Es un error de la plantilla** que usó el diseñador — quedó el nombre de otro
cliente. No significa nada para el proyecto, pero conviene saberlo para que nadie
se confunda al leer el PDF.

---

**Documentado el 27 de agosto de 2026.**

*Si algo de la marca no está acá, no está en las fuentes originales.*
