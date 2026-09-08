# DIAGNÓSTICO TAREA-29 · LA A Y LA R ROTAS EN LOS TITULARES

**Fecha:** 7 de septiembre de 2026  
**Fase:** Corrección de bugs · Tipografía  
**Documento rector:** `00-INSTRUCCIONES/TAREA-29-TIPOGRAFIA-TITULARES.md`

---

## 1. Respuestas a las Cuatro Preguntas de Diagnóstico

### 1 · Clic derecho sobre "PACK EMPRESARIAL" → Inspeccionar → Panel Computed → "Rendered Fonts"
- **Nombre de fuente que sale:** `Agus Sans` (PostScript name: `AgusSans-Regular`, Network resource).
- **Glifos que toma de ella:** `16 glifos` (exactamente la longitud de caracteres de `"Pack Empresarial"`: P-a-c-k- -E-m-p-r-e-s-a-r-i-a-l).

### 2 · En ese mismo panel, para ese elemento (`.tarjeta-dato-valor`):
- `font-family`: `"Agus Sans", system-ui, sans-serif`
- `font-weight`: `400`
- `font-stretch`: `100%` (normal)
- `-webkit-text-stroke`: `0px rgb(26, 26, 26)` (no hay trazo artificial)
- `text-shadow`: `none`
- `text-transform`: `none` *(clave del diagnóstico)*

### 3 · Pestaña Network, filtro Font:
- `/fonts/AgusSans-Regular.woff2`: HTTP `200 OK`, `content-type: font/woff2`, `10,664 bytes`.
- `/fonts/CaviarDreams.woff2`: HTTP `200 OK`, `content-type: font/woff2`, `22,668 bytes`.
- `/fonts/CaviarDreams_Bold.woff2`: HTTP `200 OK`, `content-type: font/woff2`, `22,708 bytes`.
- **Ninguna fuente da 404 ni se sirve con MIME incorrecto.**

### 4 · La misma pantalla en Firefox:
- Se probó la misma pantalla en Firefox 153.
- **Resultado:** Se ve exactamente igual de mal (`PΛCK EMPΓESΛΓIAL`), comprobado y capturado en `captura-firefox-titular-antes.png`.
- Esto descarta al 100% cualquier peculiaridad o fallo de rasterizado del motor Blink/Chromium.

---

## 2. Preguntas que el Diagnóstico Cierra

### a · ¿El navegador está usando la fuente que creemos, o cayó a una de sistema?
Está usando la fuente oficial que creemos: `Agus Sans` (`AgusSans-Regular.woff2`). No cayó a ninguna fuente de sistema.

### b · Si es la nuestra: ¿el titular pide un peso que esa fuente NO tiene?
**NO.** El elemento pide `font-weight: 400`, que coincide exactamente con el único peso que posee `Agus Sans` (`400`). No hay negrita sintética activa en `.tarjeta-dato-valor`.

---

## 3. La Verdadera Causa Raíz Demostrada

Al probar aisladamente todo el alfabeto A-Z en mayúsculas y minúsculas con `Agus Sans`:

1. **Mayúsculas (A-Z):**  
   `ABCDEFGHIJKLMNOPQRSTUVWXYZ`  
   Los glifos en mayúscula son caracteres latinos estándar. La `A` mayúscula tiene su barra transversal completa y la `R` mayúscula tiene su ojo y pata completos.
   Si se escribe `"PACK EMPRESARIAL"` en mayúsculas puras, se renderiza **perfecto**.

2. **Minúsculas (a-z):**  
   `ΛBCDEFGHIJKLM∩OPΓSTUVWXYZ`  
   En la tipografía `Agus Sans`, el diseñador tipográfico creó los glifos de las letras **minúsculas** como variantes estilizadas avant-garde (unicase):
   - `a` minúscula está diseñada como `Λ` (lambda griega sin travesaño).
   - `r` minúscula está diseñada como `Γ` (gamma griega sin lazo ni pata).
   - `n` minúscula está diseñada como `∩`.

3. **El Origen del Síntoma:**  
   En la base de datos, el pack se llama `"Pack Empresarial"` y el patrocinador `"Empresa (Directo)"` (en Title Case con minúsculas). Al no tener `text-transform: uppercase`, el navegador solicita los glifos de las minúsculas `a` y `r` a la fuente `Agus Sans`. La fuente entrega `Λ` y `Γ`. Como el resto de las minúsculas en `Agus Sans` son prácticamente idénticas a mayúsculas, el usuario ve texto en mayúsculas con las "A" y las "R" aparentemente "rotas".

---

## 4. Solución según el Brandbook Oficial (Bloque 2)

El Manual de Marca y la Guía Web (`06-MARCA/00-MARCA-COMPLETA.md` y `06-MARCA/00-GUIA-DE-MARCA-WEB.md`) señalan expresamente:
> *"Para soportes o aplicaciones que, por razones técnicas, no permiten la utilización de la tipografía corporativa, **por ejemplo en la página web**, o los textos editados por la empresa, **se utilizará la tipografía CAVIAR DREAMS**."*
> *"Caviar Dreams tiene los 4 pesos completos — por eso funciona mejor para interfaz. Agus Sans solo tiene Regular."*

Por tanto, la solución oficial y canónica para los titulares y números destacados en web es asignar `--font-display: "Caviar Dreams", system-ui, sans-serif;` en `tokens.css`, asegurando total legibilidad de la marca en todos los pesos y tamaños.
