# TAREA-29 · LA A Y LA R ROTAS EN LOS TITULARES

**Para:** Antigravity
**Escrita:** 7 de septiembre de 2026
**Fase:** corrección de bugs · solo presentación

> ## 🔴 ESTA TAREA ES 90% DIAGNÓSTICO
>
> Yo no sé cuál es la causa. Probé tres teorías y **las tres eran falsas.**
> Están listadas abajo para que no las repitas.
>
> **No toques una línea de CSS hasta poder decir cuál es la causa con una
> captura de DevTools que lo demuestre.**

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
npm run build
npx vitest run
```

**Commit después de CADA bloque.**

---

# EL SÍNTOMA

En P-18, y en cualquier titular grande del backoffice:

```
   Se lee        PACK EMPΓESΛΓIAL
   Debe leerse   PACK EMPRESARIAL

   Se lee        EMPΓESΛ (DIΓECTO)
   Debe leerse   EMPRESA (DIRECTO)
```

```
   A  →  Λ    pierde la barra del medio
   R  →  Γ    pierde el ojo y la pata
```

**Solo en titulares grandes.** El menú, las etiquetas y los formularios se ven
bien. `SIN RANGO` en la esquina también.

```
   🔴 Es un defecto de PRESENTACIÓN.
      No toca ni un cálculo, ni un dato, ni una comisión.
```

---

# LO QUE YA ESTÁ DESCARTADO — no lo vuelvas a mirar

Verificado el 7/09 con `fontTools` sobre los `.woff2` del proyecto:

```
   1 · ¿Faltan glifos?
       AgusSans      222 glifos mapeados · no falta ninguno
       CaviarDreams  582 glifos mapeados · no falta ninguno
       A, R, E, N están todos, y con contornos distintos
       entre sí (R ≠ P, N ≠ O)

   2 · ¿Los contornos están invertidos?
       NO. Medí el área con signo de cada contorno de cada
       glifo de las dos fuentes:
         glifos con el contorno principal invertido = 0
       (Al principio creí que sí, pero era el ORDEN de los
        contornos, no su dirección. Falsa alarma.)

   3 · ¿Se ve mal al rasterizar los archivos?
       NO. Renderizados con PIL/FreeType a 52px y a 150px,
       "PACK EMPRESARIAL" sale perfecto en las dos fuentes.
```

**Conclusión firme: los archivos de fuente están bien.** El defecto aparece solo
en el navegador. Ahí es donde hay que mirar, y ahí yo no llego.

---

# BLOQUE 1 · 🔴 EL DIAGNÓSTICO

Abre P-18 en Chrome y responde con capturas, no con texto:

```
   1 · Clic derecho sobre "PACK EMPRESARIAL" → Inspeccionar
       Panel Computed → hasta abajo → "Rendered Fonts"

       · ¿Qué nombre de fuente sale?
       · ¿Cuántos glifos dice que toma de ella?

   2 · En ese mismo panel, para ese elemento:
       · font-family completo, tal como lo resuelve el navegador
       · font-weight
       · font-stretch
       · -webkit-text-stroke  y  text-shadow  (si los hay)

   3 · Pestaña Network, filtro Font:
       · ¿Se descargan los .woff2? ¿Con qué código?
       · ¿Alguno da 404 o se sirve con MIME incorrecto?

   4 · La misma pantalla en Firefox
       · ¿Se ve igual de mal, o bien?
       ← esto separa "fuente rota" de "cosa de Chrome"
```

## Las preguntas que el diagnóstico tiene que cerrar

```
   a · ¿El navegador está usando la fuente que creemos,
       o cayó a una de sistema?

   b · Si es la nuestra: ¿el titular pide un peso que esa
       fuente NO tiene?

       🔴 Agus Sans SOLO trae peso 400.
          El brandkit lo advierte:
          "Solo viene el peso Regular. Para negritas hay que
           usar Caviar Dreams Bold o simular el peso."

       Si un h1 pide 600 o 700, el navegador FINGE la negrita
       engordando el trazo. Es la sospecha más razonable que
       queda — pero es SOSPECHA. Hay que verla en Computed.
```

**Di cuál era la causa antes de tocar nada.** Si no se puede determinar, dilo
también: es una respuesta válida y mejor que un arreglo a ciegas.

**Commit del reporte de diagnóstico.**

---

# BLOQUE 2 · LA CORRECCIÓN

Depende de lo que salga del bloque 1. Los tres caminos, en orden de preferencia:

## Si es negrita sintética sobre Agus Sans

```css
   /* los titulares en Agus Sans se quedan en su único peso */
   font-weight: 400;
   font-synthesis-weight: none;
```

**Y para el peso visual se usa Caviar Dreams Bold**, que es exactamente lo que
manda el brandbook:

> *"Para soportes que no permiten la tipografía corporativa, por ejemplo en la
> página web, se utilizará CAVIAR DREAMS."*

```
   Caviar Dreams tiene los 4 pesos completos.
   Agus Sans solo tiene 1.
```

## Si la fuente no está cargando

```
   Arreglar la ruta o el MIME. NO cambiar de tipografía.
```

## Si no se determina la causa

```
   Salida segura: los titulares pasan a Caviar Dreams Bold.
   Es la tipografía que el brandbook designa para web,
   así que NO es salirse de la marca.
   Se anota como "causa no determinada" en la bitácora.
```

```
   🔴 En cualquiera de los tres:
      NO se agregan fuentes nuevas
      NO se toca tokens.css salvo la variable del titular
      NO se cambian colores ni tamaños ni espaciados
```

**Commit.**

---

# BLOQUE 3 · LAS PRUEBAS

```
   1 · Ningún elemento pide un font-weight que su familia
       no tenga
       ← grep de font-weight en src/estilos/ contra los
         @font-face declarados

   2 · Los 5 .woff2 se sirven con 200 y con MIME font/woff2

   3 · Las fuentes declaradas en @font-face son exactamente
       las 2 de la marca. Ninguna más.
```

**Commit.**

---

# BLOQUE 4 · VERIFICACIÓN

```bash
# 1 · qué pesos declara cada familia
grep -a -A6 "@font-face" src/estilos/index.css | grep -E "font-family|font-weight"

# 2 · qué pesos pide el CSS
grep -rn "font-weight" src/estilos/ | grep -vE "400|normal"

# 3 · ninguna fuente ajena
grep -rn "fonts.googleapis\|fonts.gstatic\|@import url" src/
#    debe quedar VACÍO
```

## Capturas — obligatorias

```
   1 · DevTools → Computed → "Rendered Fonts" ANTES
   2 · El titular "PACK EMPRESARIAL" ANTES
   3 · El mismo titular DESPUÉS, con la R y la A completas
```

**Imágenes, no descripciones.** Esta tarea es visual: sin captura del antes y
el después no está demostrada.

---

# LO QUE NO SE TOCA

```
   ❌ Los archivos .woff2 — están correctos, verificado
   ❌ Los colores de tokens.css — el brandkit está bien
   ❌ La landing — otro proyecto
   ❌ src/servicios/ · src/motor/ · las funciones SQL
   ❌ Cualquier cosa que no sea tipografía
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

Es una tarea de tipografía. **Si movió un número, movió algo que no debía.**

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6 · noviembre 2026)
   wallet              471
   productos             8
   activacion ciclo 6    2 filas · 2 activos
```
