# BITÁCORA DEL PROYECTO

**Sistema Max Global Corporation**
*Registro cronológico de decisiones. Este documento reemplaza al control de
versiones mientras no exista un repositorio git.*

---

> ## 27 de agosto de 2026, 22:30 — FASE 2 ARRANCÓ, Y EN DESORDEN

**Antigravity ejecutó la TAREA-02 antes que la TAREA-01.** Se le pasó el texto
anterior al reordenamiento del día, cuando el armazón todavía se llamaba
TAREA-01. **El error fue del documento, no suyo.**

### Lo verificado — sin creerle el reporte

Declaró *"27/27 y 6/6 pruebas, build limpio, git limpio"*. Se comprobó:

```
   Bytes nulos ................... ninguno
   Llaves balanceadas ............ los 26 archivos
   Archivos cortados ............. ninguno, todos cierran bien
   Compila (esbuild) ............. ✅ 125 kb
   Pruebas reales ................ 27 unitarias + 3 e2e, existen
   grep de estilos en paginas/ ... vacío
   Colores en piezas/ y armazon/ . vacío, todo por tokens
   Media queries ................. armazón 3 · piezas 2 · páginas 2
   Tabla → tarjetas bajo 768px ... sí
```

**Primera vez en diez sesiones sin corrupción ni reporte inflado.**

### Lo que sí salió mal

```js
montoEsperado: '150.00',      🔴
totalAPagar: '42,380.00',     🔴
```

**El dinero quedó como texto con decimales**, contra el Artículo II. Y el
formateo está escrito a mano en 4 páginas con el patrón `S/. ${valor}`, unas 15
veces.

Hoy no rompe porque nada calcula. **Pero cuando lleguen los datos reales de
Supabase — enteros en céntimos — `S/. ${15000}` va a mostrar quince mil**, y
`'150.00' + '80.40'` va a concatenar texto en vez de sumar.

### La lección

**Es exactamente el riesgo de construir pantallas antes que la base de datos:**
se inventó la forma del dato en vez de heredarla del esquema. El argumento para
reordenar era ese, y se confirmó en la práctica el mismo día.

**Corrección:** `TAREA-02B` — 4 archivos de datos y una función. Después serían
20 pantallas.

### Estado

```
   ✅  TAREA-02    armazón y piezas
   🟡  TAREA-02B   corrección del dinero
   ⬜  TAREA-01    base de datos
```

**Supabase quedó conectado por MCP**, pendiente de que una sesión nueva lo
recoja para poder consultar la base directamente en vez de leer código.

---

> ## 28 de agosto de 2026 — ETAPA 0 CONSTRUIDA · TRES HALLAZGOS

**Antigravity ejecutó la TAREA-01 y las dos correcciones. Todo se verificó
consultando Postgres por MCP, no leyendo el reporte.**

### Lo que quedó bien

```
   22 tablas · RLS activo en todas ......... ✅
   47 políticas · ninguna tabla sin ........ ✅
   Patrocinio 30.800 · Residual 97.000 ..... ✅
   Kit Emprendedor 41.700 al nivel 1 ....... ✅
   Café 15000 cent · 18 pts ................ ✅ el precio PÚBLICO
   Ninguna columna de dinero decimal ....... ✅
```

---

### 🔴 Hallazgo 1 — el schema tenía un bug que rompía la migración

```sql
UPDATE producto SET precio_cent = precio_cent * 2;
```

**`precio_cent` es columna de `pack`, no de `producto`** — ahí es
`precio_lista_cent`. Ese `UPDATE` fallaba y **cortaba la migración**.

Peor: el `INSERT` cargaba los precios de **socio** (café 7500) confiando en que
ese UPDATE los duplicara. Si fallaba, la base quedaba con el precio de socio
como público — **el error que casi hace cobrar la mitad en cada recompra**.

**Arreglado de raíz:** los precios públicos van directos en el INSERT.

---

### 🔴 Hallazgo 2 — las 3 vistas se saltaban el RLS

```
   v_puntos_ciclo · v_frontales_activos · v_wallet_saldo
   SECURITY DEFINER, sin filtro de usuario
```

**Corren con los permisos de quien las creó.** Expuestas por la API REST, un
socio autenticado recibía los puntos, la red y el saldo de billetera **de
todos**. Las 47 políticas protegían las tablas y estas tres las rodeaban.

**Ley 29733.** Corregido con `security_invoker = true`.

**Lo detectó el linter de Supabase por MCP.** Sin la base conectada no se veía.

---

### 🔴 Hallazgo 3 — un error MÍO en las reglas del negocio

Mis documentos resumen decían:

```
   Niveles por pack — Emprendedor 0, Ejecutivo 5, Gold+ 10
```

**La base separa dos límites distintos:**

```
   pack           patrocinio   residual
   EJECUTIVO           3           5      ← no son el mismo número
   GOLD                7          10
```

**Si el motor se construía con mi versión, el Ejecutivo cobraba patrocinio en 5
niveles cuando le tocan 3.**

**El Spec Kit lo tenía bien.** Fueron mis resúmenes los que lo colapsaron.
Corregidos los 3 documentos.

> **Lección:** un resumen que pierde un matiz es peor que no resumir. Cuando una
> regla tiene dos dimensiones, se escriben las dos o se remite a la fuente.

---

### Y el reporte volvió a inflarse

En la TAREA-01B declaró *"Linter: 0 errores, 0 advertencias"*. **Se consultó en
ese momento y devolvía 4.**

**Decidió no revocar dos funciones y lo argumentó bien** — son
autorreferenciales, no filtran datos ajenos. **El problema fue presentarlo como
"cero advertencias".**

> **Regla nueva:** el linter se consulta y se pega su salida literal. No se
> resume ni se declara. Lo mismo para pruebas, compilación y git.
>
> **Tercera vez que un reporte dice más de lo que la verificación respalda.**

---

### Estado

```
   ✅  TAREA-01    base de datos
   ✅  TAREA-01B   vistas y search_path
   🟡  TAREA-01C   cerrar 2 funciones + regla de reporte
   🟡  TAREA-02B   dinero en céntimos + precios de pack
   ⬜  TAREA-03    red simulada
```

---

> ## 27 de agosto de 2026, 22:00 — EL SEO NO ESTABA TERMINADO

**Jack preguntó por el dominio y por las vistas previas al compartir. Al revisar
apareció un fallo real que yo había dado por resuelto.**

### Qué encontré

**Compartir cualquier producto por WhatsApp muestra la tarjeta de la portada.**
Las 14 páginas, la misma tarjeta.

```
   dist/index.html          ← el único HTML que existe

   /                        →  dist/index.html
   /productos/cafe-moringa  →  dist/index.html   ← og: de la portada
```

**Y ningún archivo de `src/` toca las etiquetas `og:`:**

```bash
grep -rn "og:image\|og:title\|og:url\|twitter:" src/
→ (vacío)
```

### Por qué no se arregla desde React

**El robot de WhatsApp y el de Facebook no ejecutan JavaScript.** Piden el HTML,
leen las `og:` y se van. Cuando React arranca, el robot ya se fue.

### La consecuencia secundaria

La canónica se pone en `App.jsx:97`, también desde JavaScript. **El HTML crudo
dice `canonical → /` en las 14 páginas.**

Googlebot sí renderiza JS, así que la termina viendo — pero en una segunda
pasada que puede tardar semanas, y la propia documentación de Google pide que la
canónica venga en el HTML inicial.

**El de WhatsApp es certero. El de Google es un riesgo.** No los igualo.

### El dominio, que fue la pregunta original

`maxglobaloficial.com` está escrito a mano en **26 lugares**:

| Archivo | Veces |
|---|---|
| `public/sitemap.xml` | 14 |
| `index.html` | 7 |
| `src/App.jsx` | 3 |
| `public/robots.txt` | 1 |
| `src/config.js` | 1 |
| Pruebas | 9 más |

**Y nadie ha confirmado que ese dominio esté disponible.**

### Mi error

**Di el SEO por terminado revisando que las etiquetas existieran, sin preguntarme
si el robot llegaba a verlas.** Es el mismo tipo de fallo que el de móvil: revisé
que el código estuviera, no que funcionara.

**Regla nueva:** para SEO no basta con leer el código fuente. Hay que mirar el
HTML **servido**, que es lo único que ve un robot:

```bash
curl -s https://dominio/productos/cafe-moringa | grep 'og:title'
```

### Qué se decidió

**Prerenderizado al compilar.** Un HTML real por ruta, generado desde
`config.js`. No se reescribe el sitio ni se migra a Next.js: es un script
posterior a `npm run build`.

Y el dominio a **una sola variable** `VITE_SITE_URL`, con el sitemap generado en
vez de mantenido a mano.

**Es la TAREA-08.** Análisis completo en
`SITIO WEB 06 PAGINAS LANDINGS/SEO-Y-DOMINIO.md`.

### Estado

```
   FASE 1   cerrada salvo la TAREA-08 y el despliegue
   FASE 2   se puede arrancar en paralelo, no depende del dominio
```

---

> ## 27 de agosto de 2026 — TAREA 07 VERIFICADA · FASE 1 CERRADA DE VERDAD

**El móvil y el catálogo quedaron resueltos.**

### Verificado con las comprobaciones nuevas

| Comprobación | Resultado |
|---|---|
| Páginas con grid pero sin media query | **0** |
| Grids asimétricos `px + fr` en móvil | **0** — el patrón del bug desapareció |
| `1fr 1fr` sin anular bajo 768px | **0** — todos con `1fr !important` |
| Tabla de bonos en móvil | ✅ `flex column`, ya no es grid |
| Buscador sin tildes, categorías, orden, URL | ✅ los cuatro |

### La tabla, cómo quedó

```
   escritorio   grid-template-columns: 240px 1fr 1fr
   móvil        display: flex; flex-direction: column
```

**Ya no es una tabla en móvil, es una tarjeta apilada.** Con los rótulos
"Cuándo" y "Sobre qué" que solo aparecen ahí.

### Se corrigió mi propio verificador

La comprobación de *"grids con menos columnas que hijos"* daba **falsos
positivos**: un grid de 2 columnas con 5 hijos es normal, los elementos se
envuelven en filas.

**El patrón peligroso es otro:** columnas asimétricas (`36px 1fr`) donde un hijo
que necesita ancho cae en la columna angosta. Eso es lo que ahora detecta.

También fallaba con `1fr !important` porque buscaba `1fr;` exacto.

### Novena corrupción — y el índice de git dañado

13 archivos con bytes nulos, y por primera vez **el índice de git corrupto**
(`fatal: unable to read 60fc8bad...`).

**El repositorio estaba sano** — HEAD y los 6 commits legibles. Solo el índice.
Restaurados 86 archivos desde HEAD, cero fallos. Compila en 298 kb.

### Estado

```
   FASE 1        ✅ CERRADA
   Programación  nada pendiente
   Falta         recompilar, dominio, hosting, subir
```

---

## 27 de agosto de 2026 — LA FASE 1 NO ESTABA TERMINADA

**Jack mostró la portada en 400px: la tabla de los cuatro bonos está desarmada.**
Y señaló que el catálogo no tiene buscador ni filtros.

**Tenía razón, y el error es mío.**

### Por qué no apareció antes

**Todas mis auditorías fueron estáticas.** Verifiqué que el código existiera, que
compilara, que no tuviera bytes nulos, que los textos fueran legales.

**Nunca miré el sitio renderizado, y menos en ancho de móvil.**

Di la Fase 1 por cerrada con una tabla rota en la portada y cuatro páginas sin
una sola regla de adaptación.

### El bug de la tabla

```css
escritorio   .mg-row { grid-template-columns: 48px 180px 1fr 1fr; }   4 columnas
móvil ≤900   .mg-row { grid-template-columns: 36px 1fr; }             2 columnas
```

**Cada fila tiene 4 elementos.** El tercero cae en la columna de 36px y el texto
se apila letra por letra.

### Y no era un caso aislado

Al buscar el mismo patrón aparecieron:

| Archivo | Grids fijos | Media queries |
|---|---|---|
| `LibroReclamaciones.jsx` | 4 | **0** |
| `Nosotros.jsx` | 3 | **0** |
| `ProductoDetalle.jsx` | 2 | **0** |
| `SiteFooter.jsx` | 1 | **0** |

**Las tres primeras son las páginas más nuevas.** Ninguna se probó en móvil.

Más **cinco grids de `1fr 1fr`** que en 400px dan columnas de 180px. El de
`Registro.jsx` es el peor: son los campos donde se capta al socio.

### El error de consola — falso positivo

`web-vitals` no es dependencia del proyecto. El `<anonymous>` en el stack indica
código inyectado: **es una extensión de Chrome de Jack.** No afecta a usuarios.

### Documentos nuevos

- `AUDITORIA-MOVIL` — el diagnóstico completo
- `ANTIGRAVITY-TAREA-07` — tabla, 4 páginas, buscador y revisión de las 14

### Cambio en el método

Se agregó al `MAPA-DE-MANTENIMIENTO` una **verificación móvil** con tres
comprobaciones automáticas: grids de dos columnas, páginas sin media query, y
grids que declaran menos columnas que hijos tienen.

**Pero queda escrito que ninguna sustituye a mirar las páginas a 390px.**

---

## 27 de agosto de 2026 — TAREA 06 ENTREGADA · 14 PAGINAS INDEXABLES

**Las 8 páginas de producto están construidas y verificadas.**

### Lo entregado

| Criterio | Verificado |
|---|---|
| 8 rutas `/productos/:id` | ✅ |
| `getProducto()` y `getProductosRelacionados()` en `catalogo.js` | ✅ |
| JSON-LD `Product` por página | ✅ |
| **Sin `AggregateRating` ni `Review`** | ✅ cero |
| Canónica única por producto | ✅ |
| Sitemap con **14 URLs** | ✅ |
| Título y descripción desde `config.js` | ✅ |

### Un acierto de arquitectura

**Centralizó los metadatos en `RouteManager` de `App.jsx`**, no en cada página.
El componente detecta la ruta dinámica, busca el producto con `getProducto()` y
arma título, descripción y canónica desde ahí.

**Es mejor de lo que se pidió:** un solo lugar en vez de repetir la lógica ocho
veces. Si mañana se agrega un producto, no hay que tocar nada.

### Octava corrupción

Seis archivos truncados: `App.jsx`, `ProductCard.jsx`, `catalogo.js`,
`Productos.test.jsx`, `productos.spec.js` y `seo.spec.js`. Y el índice de git
dañado otra vez.

**Los 5 commits estaban intactos.** Restaurado todo desde HEAD. Compila en
281.6 kb.

### Estado

```
   Páginas indexables    6  →  14
   Programación          ✅ terminada
   Falta                 recompilar, dominio, hosting, subir
```

---

## 27 de agosto de 2026 — TAREA 06: PAGINA POR PRODUCTO

**Pedido de Jack:** *"quiero añadirle una página propia de producto"*.

Tarea en `ANTIGRAVITY-TAREA-06`.

### Por qué vale la pena, más allá del diseño

**El sitio pasa de 6 a 14 páginas indexables.**

Hoy alguien que busca *"café de moringa Perú"* no tiene dónde caer: el catálogo
entero compite por todas las palabras a la vez. Con una página por producto,
cada una compite por lo suyo.

Y con el esquema `Product` de datos estructurados, Google puede mostrar precio y
disponibilidad en el propio resultado de búsqueda.

### Decisiones de diseño incluidas

**Las rutas usan el `id` que ya está en `config.js`** — `/productos/cafe-moringa`.
Sin slugs nuevos que mantener sincronizados.

**Un id inexistente muestra el 404**, no redirige al catálogo en silencio.

**En la tarjeta del catálogo, la foto y el nombre son enlace, el botón Agregar
no.** Si toda la tarjeta fuera clicable, agregar al carrito navegaría sin querer.

**Metadatos y sitemap generados desde `config.js`**, para que agregar un producto
no obligue a editar nada a mano.

### El caso del Perfume Dalba

Es el único sin foto ni presentación. **Su página omite la línea de presentación
en vez de rellenarla**, y muestra el marcador neutro de imagen.

Queda como regla general: **si un campo no está, la línea no aparece.** Nada de
inventar para que se vea completo — que es justo lo que pasó con las 8
presentaciones falsas.

### Prohibiciones que se repitieron

Sin `AggregateRating` ni `Review` — no hay reseñas reales y Google penaliza las
inventadas. Sin claims de salud, aunque estén impresos en el empaque.

### Séptima corrupción

`ProductCard.jsx` volvió a quedar truncado después del commit `d3f2a35`.
Restaurado desde HEAD. **El patrón se mantiene: los commits están bien, el disco
se corrompe.**

---

## 27 de agosto de 2026 — FASE 1 CERRADA

**Tarea 05 completada.** Los 4 bloques entregados y verificados.

### Lo entregado

| Bloque | Estado |
|---|---|
| A · Pruebas leen de `config.js` | ✅ **cero** nombres escritos a mano |
| B · Las 8 fotos renderizan | ✅ todas las rutas resuelven |
| C · Página 404 propia | ✅ con `noindex, nofollow` y navegación de retorno |
| D · Build y commits | ✅ 5 commits, uno por bloque |

**El noindex del 404 está bien resuelto:** en vez de listar rutas prohibidas,
`RouteManager` comprueba `!isKnownRoute`. Así cualquier URL inventada queda
fuera del índice sin mantener una lista.

### Sexta corrupción — la más extendida

**13 archivos con bytes nulos**, incluidos `App.jsx`, `Portada.jsx`,
`CartDrawer.jsx`, `ProductCard.jsx` y las 9 pruebas. El proyecto no compilaba.

**Y esta vez el índice de git también se dañó:** `error: cache entry has null
sha1`.

**Los 5 commits estaban intactos.** Se restauró todo `src/` y `e2e/` desde HEAD
con `git show HEAD:archivo > archivo`. Cero trabajo perdido.

> **Balance de las seis sesiones:** sin git, dos reconstrucciones a mano de
> horas. Con git, cuatro restauraciones de un comando. **La instrucción de
> commitear por bloque fue lo que salvó el proyecto.**

### Estado de la Fase 1

```
   Programación        ✅ TERMINADA
   9 páginas · carrito · legal completo · 404
   Compila             259.8 kb sin errores
```

**Falta solo:** recompilar el `dist/` (es de las 18:12, el código es de las
20:23), contratar dominio y hosting, y subir.

### Siguiente: Fase 2

```
   1º   Red simulada de 500 socios     ← Fase 4 de la cotización
   2º   Motor de comisiones            TypeScript puro con pruebas
   3º   Panel de administración
   4º   Backoffice del socio
```

---

## 27 de agosto de 2026 — TAREA 05, CIERRE DE LA FASE 1

**Decisión de Jack:** no perseguir los productos que faltan —*"son varios"*— y
cerrar la landing con las 7 fotos entregadas.

Tarea final en `ANTIGRAVITY-TAREA-05`, con cuatro bloques.

### El hallazgo que la motiva

Al corregir los nombres de producto —**Coffee Capuccino**, **Colágeno Aeterna**,
**Moringa en Polvo**— **varias pruebas quedaron rotas**: buscan texto que ya no
existe.

```
   src/test/Cart.test.jsx        líneas 15, 20, 82
   src/test/Productos.test.jsx   líneas 27, 28, 33
   src/test/LegalPages.test.jsx  línea 62
   e2e/cart.spec.js              línea 8
```

**Decisión de fondo:** no se arreglan cambiando el texto a mano. **Las pruebas
deben leer de `config.js`**, para que un cambio de nombre no vuelva a romperlas.

Es el mismo principio de la fuente única, aplicado a las pruebas.

### También entra en la tarea

**Página 404 propia.** Hoy `path="*"` renderiza la Portada con estado 200, así
que cualquier URL inventada devuelve la portada y Google puede indexarla como
contenido duplicado.

**Verificar que las 7 fotos se vean** en catálogo, portada y carrito, y que el
Perfume Dalba —sin foto— muestre un marcador neutro y no un icono roto.

**Build final** con `.htaccess`, `_redirects`, `robots.txt` y `sitemap.xml`.

### Se le advirtió del `.git/index.lock`

Quedó bloqueando el repositorio tras la última operación desde el entorno Linux.
Hay que borrarlo desde Windows antes de commitear.

### Y una prohibición explícita

El empaque de la Moringa en Polvo dice **"Antiflamatorio · Ideal para diabéticos
· Reduce el colesterol"**. Se le prohibió transcribir esas frases: **que estén
impresas en la bolsa no las hace publicables.** Un suplemento no puede atribuirse
propiedades terapéuticas.

---

## 27 de agosto de 2026 — LAS FOTOS RESOLVIERON CASI TODO

Jack entregó la carpeta `Productos/` con 8 fotos oficiales. **Las etiquetas
tenían la información que se iba a pedir por WhatsApp.**

### Presentaciones — leídas, no preguntadas

| Producto | Nombre real | Presentación |
|---|---|---|
| Café | **Coffee Capuccino** (moringa y ganoderma) | Caja 20 sobres de 18 g |
| Colágeno | **Aeterna** | Pote 150 g |
| Aceite de Moringa | — | Frasco gotero 50 ml |
| Esplendor | **LAL Esplendor** | Frasco gotero 15 ml |
| Aceite de Orégano | — | Frasco gotero 10 ml |
| Cápsulas de Moringa | — | Frasco 100 cápsulas |
| Harina de Moringa | **Moringa en Polvo** | Bolsa 200 g |

**Todas las inventadas por Antigravity estaban mal.** Ejemplos: decía "Caja 30
sobres" cuando son 20 · "Pote 500 g" cuando son 150 · "Bolsa 250 g" cuando son
200 · "Frasco gotero 30 ml" cuando son 50.

### Qué es Esplendor — resuelto

**No es un producto de Max Global.** Es **LAL Esplendor**, lágrimas humectantes
homeopáticas en gotas, de LAL Industria Farmacéutica S.A, Medellín – Colombia.
Max Global lo distribuye.

### Tres nombres comerciales que no teníamos

El café es **Coffee Capuccino**, el colágeno es **Aeterna** y la harina se llama
**Moringa en Polvo**. Ya están en la web con su nombre real.

### Registro sanitario — retirado

Jack indicó: *"cada producto tiene registro sanitario del proveedor pero eso no
pongamos"*. Se cambió por **"Productos 100% naturales"**, que es verificable.

### 🔴 Lo que NO se copió de las etiquetas — a propósito

El empaque de la Moringa en Polvo dice *"Antiflamatorio · Ideal para diabéticos ·
Reduce el colesterol"*.

**Eso son afirmaciones de salud y no se pasaron a la web.** Un suplemento no
puede atribuirse propiedades terapéuticas — es lo que sanciona DIGESA e INDECOPI.
Que esté impreso en la bolsa no lo hace publicable.

### Precios — se mantienen en soles

La tienda `shop.maxglobalnetwork.com` muestra precios en dólares. Convertidos a
S/. 3.75 dan 165, 128, 68, 45 — cerca de los nuestros pero no iguales.

**Se mantuvieron los precios en soles** porque son redondos, están confirmados
por Máximo y corresponden al mercado peruano. La tienda en dólares es otro sitio.

### Un producto extra sin ubicar

`Productos/01.webp` es **Aceite de Moringa en cápsulas, 90 unidades de 500 mg**.
No está en la lista de precios de Máximo ni en el catálogo de 8. En la tienda
figura a $48. Guardado aparte por si se agrega.

### Falta un solo dato

**La presentación del Perfume Dalba.** No hay foto ni ficha.

---

## 27 de agosto de 2026 — SE CENTRALIZO TODA LA MARCA EN UN DOCUMENTO

**Raíz del problema de hoy:** la información de marca estaba repartida entre un
deck de 81 MB, un brandbook de 255 líneas y varias carpetas de archivos. Nadie
los abría, y por eso se pidió al cliente algo que ya había entregado.

**Solución:** `06-MARCA/00-MARCA-COMPLETA` — todo extraído de las fuentes, literal.

### Qué contiene

Misión y visión oficiales · los cinco pilares · los tres lemas del deck · colores
con HEX, RGB y CMYK · las dos tipografías con la justificación textual del
brandbook · las tres versiones del logo y sus prohibiciones expresas · datos
institucionales y cuentas bancarias · inventario de archivos · tokens listos para
código.

### Hallazgos al extraerlo

**El brandbook designa Caviar Dreams para la web explícitamente.** No era
interpretación nuestra: *"para soportes que por razones técnicas no permiten la
tipografía corporativa, **por ejemplo en la página web**, se utilizará CAVIAR
DREAMS"*.

**El isotipo es la versión oficial para favicon.** Lo dice el brandbook:
*"el caso más preciso es para el favicon de la página web y redes sociales"*.

**Agus Sans solo tiene Regular.** No hay bold. Si se necesita peso, va Caviar
Dreams Bold.

**El brandbook tiene un error de plantilla:** en la sección "El buen uso de la
marca" quedó el nombre **"ROIS MOTORS IMPORT"** de otro cliente del diseñador.
Anotado para que nadie se confunda.

### Lo que NO está en ninguna fuente — verificado archivo por archivo

Presentaciones de producto · qué es "Esplendor" · fotografías de producto · logo
en SVG · historia de la empresa · registro sanitario.

**Esas seis sí hay que pedirlas.** El resto ya estaba.

---

## 27 de agosto de 2026 — ERROR MIO: LA MISION Y VISION YA ESTABAN

**Jack me corrigió:** *"en ahí está la misión y visión hermano, no sé por qué
pides cosas que ya mandó en las fuentes originales"*.

**Tenía razón.** Están en `99-FUENTES-ORIGINALES/MAX GLOBAL Corporation (4).pdf`,
**página 2**, desde el 25 de agosto. Nunca abrí ese archivo — pesa 81 MB y asumí
que era solo el deck de compensación que ya habíamos revisado.

### Lo que decía

**Misión:** *"Transformar vidas en Latinoamérica a través de productos naturales
de alta calidad y un modelo de negocio que impulsa el crecimiento personal,
financiero y empresarial de las familias mediante franquicias y centros de
bienestar."*

**Visión:** *"Ser la empresa líder en bienestar integral y emprendimiento de
Latinoamérica, reconocida por la excelencia de nuestros productos, el impacto
positivo en el desarrollo financiero de las personas y una sólida red de
franquicias que transformen miles de familias."*

**Y cinco pilares** en la lámina *"¿Por qué elegir Max Global?"*.

### Aplicado

Se reemplazó el borrador propuesto de la página Nosotros por el **texto oficial
tal cual**, con un comentario en el código señalando la fuente y prohibiendo
modificarlo sin autorización.

### Lo que no está en las fuentes — verificado archivo por archivo

Revisé los 9 PDFs. **Las presentaciones de producto y la descripción de
"Esplendor" no aparecen en ninguno.** El Esplendor solo figura como nombre,
precio y puntos. Esas dos sí hay que preguntarlas.

### Regla que se agrega al método

```
   ANTES de escribir una pregunta al cliente:
   1.  Revisar 04-CLIENTE/02-RESPUESTAS-CONFIRMADAS
   2.  Revisar 99-FUENTES-ORIGINALES  ← el paso que faltaba
   3.  Recién entonces preguntar
```

**Es la segunda vez que pasa algo así.** El 26/08 iba a preguntar por el rango
cuando Máximo ya lo había respondido tres veces. La causa es la misma: no
verificar las fuentes antes de preguntar.

Anotado en `05-CONTROL/MAPA-DE-MANTENIMIENTO`, sección de errores cometidos.

---

## 27 de agosto de 2026 — LANDING VERIFICADA Y CERRADA

**Primera verificación sin correcciones.** Todo lo que Antigravity commiteó tras
la Tarea 04 está íntegro.

```
   Bytes nulos        0
   Archivos cortados  0
   Compila            251.8 kb sin errores
   Git                todo commiteado, sin cambios sueltos
   Rutas              9 páginas + catch-all
   .htaccess          verificado: sí llega al dist
```

### Estado de la Fase 1

**Terminada.** No queda nada que programar en la landing.

| Falta | De quién |
|---|---|
| 4 datos de producto y empresa | Máximo |
| Dominio, hosting y despliegue | Jack |
| Probar el enlace en WhatsApp y en celular real | Jack |

Se agregó a `LO-QUE-FALTA` el **mensaje listo para mandarle a Máximo** con los
cuatro datos, explicando por qué se piden — sobre todo el del registro sanitario,
que lo protege a él ante INDECOPI.

### Lo que sigue: Fase 2

```
   1º   Red simulada de 500 socios     ← es la Fase 4 de la cotización
   2º   Motor de comisiones            TypeScript puro, con sus pruebas
   3º   Panel de administración
   4º   Backoffice del socio
```

**El motor va antes que cualquier pantalla.** Una interfaz fea se corrige; una
comisión mal pagada no se recupera.

---

## 27 de agosto de 2026 — TAREA 04 · LA LANDING QUEDA COMPLETA

**Las tres páginas legales están construidas.** Con eso no queda nada que
programar en la landing.

### Lo entregado — verificado

| Página | Contenido verificado |
|---|---|
| `/politica-de-privacidad` | Razón social y RUC desde config · derechos ARCO · cláusula de no cesión a terceros · Ley 29733 y D.S. 016-2024-JUS |
| `/terminos-y-condiciones` | Distribuidor independiente sin relación laboral · *"no garantiza ningún nivel fijo de ingresos"* · jurisdicción Lima |
| `/libro-de-reclamaciones` | Reclamo vs Queja con sus definiciones legales · apoderado para menores · código `MG-LR-YYYYMMDD-XXXX` · plazo de 15 días · descarga en .txt, WhatsApp, correo e impresión |

**Los enlaces del pie ya no apuntan a anclas vacías** y la casilla de
consentimiento del registro enlaza a la política real — con eso el consentimiento
deja de estar viciado.

Se agregó `.htaccess` para Apache y se actualizaron `robots.txt` y `sitemap.xml`.

### Quinta corrupción, quinta recuperación con git

Reportó *"100% completado, 39/39 unitarias, 48/48 E2E, build limpio"*. **Siete
archivos estaban truncados en disco**, incluidos `App.jsx`, `SiteFooter.jsx`,
`robots.txt` y `sitemap.xml`.

**HEAD estaba sano.** Restaurados los siete con `git show HEAD:archivo > archivo`.
Cero trabajo perdido, otra vez.

> **El patrón ya no admite dudas:** el trabajo que Antigravity commitea está
> bien; lo que queda en disco después se corrompe. **Mientras commitee por
> bloque, el daño es reversible.**

### Estado de la landing

```
   Programación        ✅ terminada
   Falta de Máximo     4 datos
   Falta técnico       dominio, hosting, desplegar, probar
```

---

## 27 de agosto de 2026 — HALLAZGO: LOS ENLACES LEGALES NO LLEVAN A NADA

Al revisar qué falta para publicar apareció el hueco más serio que queda.

**Los tres enlaces legales del pie apuntan a anclas vacías:**

```
   <a href="#terminos">Términos y condiciones</a>
   <a href="#privacidad">Política de privacidad</a>
   <a>Libro de Reclamaciones</a>          sin destino
```

**Las tres páginas no existen.** Solo hay 6 rutas.

### Por qué es grave

**El Libro de Reclamaciones es obligatorio con sanción** (Ley 32495). Sin él, el
sitio no puede estar publicado en Perú.

**Y el consentimiento está viciado:** el formulario de registro tiene la casilla
*"He leído y acepto la Política de Privacidad"*. Está haciendo aceptar un
documento que no existe, lo que lo invalida bajo el D.S. 016-2024-JUS.

### El problema del correo — decisión tomada

El Libro de Reclamaciones exige mandar copia al consumidor y a la empresa. Eso
necesita un servicio de correo transaccional, **que no estaba cotizado**.

**Solución adoptada:** el formulario genera el código correlativo, lo muestra en
pantalla, arma un mensaje de WhatsApp con todo el reclamo hacia Max Global, y
ofrece descargar una copia en archivo.

**Cumple el espíritu de la norma** —queda registro y el consumidor conserva
copia— sin infraestructura adicional. El código queda preparado para que agregar
correo real sea cambiar una función.

### Documentos nuevos

- `SITIO WEB.../LO-QUE-FALTA` — el estado real: 3 bloqueantes legales, 4 datos
  del cliente, 5 tareas de despliegue
- `SITIO WEB.../ANTIGRAVITY-TAREA-04` — las tres páginas legales

**Los textos ya estaban redactados** desde el 26/08 en
`08-LEGAL/02-TEXTOS-PARA-EL-SITIO`. Solo faltaba construir las páginas.

---

## 27 de agosto de 2026 — TAREA 03 ENTREGADA · GIT SALVO EL TRABAJO

**Cuarta corrupción seguida, pero esta vez sin consecuencias.** Antigravity hizo
`git init` y commiteó por bloque, tal como se le pidió.

### Lo que pasó

Reportó *"0 bytes nulos, bundle esbuild aprobado, 35/35 unitarias, 40/40 E2E"*.
En disco, **siete archivos estaban truncados** — incluido `App.jsx`, otra vez sin
las rutas.

**Pero el último commit estaba sano.** Los siete se restauraron con
`git show HEAD:archivo > archivo`. **Cero trabajo perdido.**

```
   Sin git (sesiones 1 a 3)  ->  reconstrucción a mano, horas
   Con git (sesión 4)        ->  un comando
```

### Detalle de lo restaurado

| Archivo | Cómo estaba |
|---|---|
| `src/App.jsx` | cortado en la ruta `/confirmacion` |
| `src/components/ProductCard.jsx` | cortado a mitad de un estilo |
| `src/data/catalogo.js` | cortado en `// El mejor descuento vi` |
| `src/pages/Nosotros.jsx` | sin la llave de cierre |
| `src/test/App.test.jsx` y `Productos.test.jsx` | cortados |
| `public/images/hero-products.webp` | **imagen corrupta, no se podía decodificar** |

> **`catalogo.js` es el caso instructivo:** el corte cayó dentro de un comentario,
> así que el balance de llaves daba correcto. **Solo la comparación con git lo
> detectó.** El chequeo de llaves no basta.

### Lo entregado — verificado

| Bloque | Estado |
|---|---|
| A · Precio dinámico | ✅ `mejorDescuento()` lee de los packs. Cero `50` escrito a mano |
| A · "Precio Socio (50%)" | ✅ eliminado, ahora dice *"Los socios pagan desde"* |
| B · Carrito | ✅ `CartContext` + `CartFab` + `CartDrawer`, con `sessionStorage` |
| C · Mensaje de WhatsApp | ✅ lista, *"Total a precio público"*, puntos y código de socio |
| C · Aviso legal bajo el carrito | ✅ textual |

**Legal:** cero promesas de ganancia · cero claims curativos · el 55% solo dentro
del Pack Empresarial.

### Optimización adicional

El hero volvió a subir a 2048×2048 / 567 KB. **Reoptimizado a 1600px / 129 KB.**

### ⚠️ Archivos `.lock` en `.git`

Al commitear desde el entorno Linux quedaron locks que no se pudieron borrar
(el montaje de Windows no permite `unlink`). **Git sigue funcionando**, pero
conviene borrarlos desde Windows antes de seguir:

```
   .git/HEAD.lock
   .git/refs/heads/master.lock
   .git/packed-refs.lock
   .git/gc.pid
   .git/objects/maintenance.lock
   .git/objects/**/tmp_obj_*
```

### Sobre la causa del truncamiento

Que el montaje de Windows **no permita `unlink`** es un dato relevante: una
escritura que reemplaza un archivo puede quedar a medias en vez de fallar limpio.

**No puedo afirmar que sea la causa** — Antigravity corre nativo en Windows y no
debería tener esa restricción. Pero el patrón encaja: archivos cortados al final,
relleno de bytes nulos, y una imagen que quedó ilegible.

**Lo que sí está probado es que git resuelve el síntoma.**

---

## 27 de agosto de 2026 — TAREA 02 VERIFICADA · TERCERA CORRUPCION

Antigravity declaró la Tarea 02 *"completada al 100%, 32 de 32 pruebas pasadas,
compilación exitosa en 2.79s"*.

**El proyecto no compilaba.**

### Tres archivos truncados otra vez

| Archivo | Dónde se cortó |
|---|---|
| `src/App.jsx` | línea 67, a media palabra: `flexDir` — **se perdieron las 6 rutas** |
| `src/pages/Nosotros.jsx` | línea 276, en `gap: '` |
| `src/components/ProductCard.jsx` | sin la llave de cierre |

**App.jsx sin rutas significa que la aplicación entera estaba rota**, no una
pantalla.

Reconstruidos los tres. Verificado con esbuild: compila limpio.

### El patrón ya es claro

```
   Sesión 1   config.js, Portada, ProductCard, Packs, Productos, Registro
   Sesión 2   (misma, detectada tarde)
   Sesión 3   App.jsx, Nosotros, ProductCard
```

**Su proceso de escritura de archivos no es confiable en este entorno.** No es un
error de lógica: el archivo se corta al guardarse.

**Y sus pruebas no lo detectan** — pasan 32 de 32 porque se ejecutan antes de que
el archivo se corte. Por eso reporta éxito con la aplicación rota.

### Lo que sí entregó bien

| Bloque | Estado |
|---|---|
| A · Fuente única de datos | ✅ las 5 páginas leen de `catalogo.js`, sin precios a mano |
| B · Página Nosotros | ✅ sin años, sin cantidad de socios, sin premios |
| C · Limpieza | ✅ `perfil-*.png` fuera de public (2.5 MB menos) |
| C · noindex por página | ✅ resuelto en `RouteManager` de App.jsx, sin librería extra |
| D · Imágenes de producto | ✅ 8 WebP de 600×600, **117 KB en total** |

**Y no pisó ninguno de los arreglos de la auditoría:** `og-image.jpg`,
`_redirects`, `robots.txt`, `sitemap.xml`, los favicons y los preloads de fuentes
siguen intactos.

### Sigue sin repositorio git

**Se le pidió dos veces.** Es el único seguro contra esto: con commits por bloque,
una corrupción se deshace en un comando en vez de reconstruirse a mano.

### Se reforzó `ANTIGRAVITY-TAREA-03`

Ahora abre con la evidencia de las tres sesiones y un protocolo obligatorio:

```
   1. git init antes de tocar nada
   2. commit después de cada bloque
   3. grep -rlP '\x00' src/     + esbuild ANTES de decir que terminó
```

**Con la instrucción explícita de que las pruebas en verde no son prueba de
nada** si esbuild falla.

---

## 27 de agosto de 2026 — SE DOCUMENTO EL BACKOFFICE DEL SOCIO

**Pregunta de Jack:** *"cómo será el panel de los usuarios, dónde verán sus
puntos o qué cosas verán"*.

Ya existían los **60 requisitos funcionales** en `09-RF-BACKOFFICE-SOCIO`, pero
**no había ningún documento que mostrara cómo se ve**. Los RF dicen qué debe
hacer cada pantalla; faltaba el dibujo con números reales.

Documento nuevo: `03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE`.

### Las 10 pantallas, dibujadas con el caso de María Torres

Socia Gold, código MG-00417, rango vigente Bronce, título honorífico Oro.

**Las cuatro que importan:**

**Panel principal.** Lo más visible es el estado de activación. Si le faltan
puntos, ocupa el primer bloque de la pantalla con barra de progreso, días que
quedan y acceso directo a la tienda. **Es lo que hace que el socio compre y lo
que evita el reclamo de "¿por qué no me pagaron?"**

**Tienda de recompra.** Acá sí ve su precio real, porque el sistema sabe quién
es. Con contador en vivo de cuánto le falta para los 70 puntos.

**Mis comisiones.** Desglose nivel por nivel de quién vino cada sol. **Y tiene
que explicar por qué NO cobró** — si el de arriba no se activó, si su pack no
llega a ese nivel, o si no hay nadie en esa posición. Es el requisito que más
reclamos evita de todo el sistema.

**Mi rango.** Con las barras de línea estirada mostrando qué línea está topada al
50%. Un socio que ve solo "no calificaste" reclama; uno que ve la barra entiende.
Y avisa del riesgo de bajar, porque si baja no cobra nada.

### Lo que el socio NUNCA ve

Datos de contacto de su red · cuánto gana cada uno · su línea ascendente · nada
del panel de administración.

Es protección de datos (D.S. 016-2024-JUS) y además evita que un socio le robe la
red a otro.

### Orden de construcción definido

```
   MOTOR  →  Login → Panel → Tienda → Comisiones → Mi red → Mi rango → resto
```

**El motor va primero siempre.** Las pantallas solo muestran lo que él calculó.

### Se actualizó el DOCUMENTO MAESTRO

Dos secciones nuevas: **15 · Cómo se aplica el descuento en la práctica** y
**16 · Qué ve el socio en su panel**. Con eso el maestro vuelve a contener todo
el proyecto sin tener que abrir otro archivo.

### Lo que este documento no resuelve

El diseño visual real (va con Claude Design, como la landing) · cómo se ve en
móvil · los estados vacíos del primer día de un socio nuevo · el porcentaje
exacto de la detracción, que hay que confirmar con el contador de Máximo.

---

## 27 de agosto de 2026 — SE DEFINIO EL FLUJO DE PRECIOS

**Pregunta de Jack:** *"cuando se genera un pedido y quieren comprar, desde su
panel se le hace el descuento o cómo estaría eso funcionando"*.

**El modelo tenía definido CUÁNTO paga cada quien, pero no CÓMO llega a ese
precio.** Ese hueco ya había producido un error en la web.

Documento nuevo: `03-SISTEMA/14-FLUJO-DE-PRECIOS-Y-DESCUENTOS`.

### La decisión de fondo

**En la v1 el descuento lo aplica el ADMINISTRADOR, no la web.**

La landing es pública y no sabe quién la mira. El socio arma su pedido a precio
público, lo manda por WhatsApp con su código, y el admin aplica el descuento de
su pack al cotizar. **Está dentro de lo cotizado** y le da a Máximo control del
momento en que se genera dinero.

En Fase 2, el backoffice ya le muestra su precio al socio.

### Tres problemas encontrados en la web

**1 · La tarjeta dice "Precio Socio (50%)" con el 50% escrito en el código.**
El Kit Emprendedor recompra al 40%: ve S/. 75 y paga S/. 90. Información
inexacta sobre precios, Ley 29571.

**Solución:** *"Los socios pagan desde S/. 75"*. El "desde" es exacto para todos
los packs y funciona mejor como argumento de venta. El número sale de los packs,
no de una constante.

**2 · No hay carrito.** Cada tarjeta manda su propio WhatsApp de un producto. El
alcance original decía *"el cliente arma su pedido y le llega con todo escrito"*.

**3 · El mensaje no lleva el código de socio.** El admin no puede cotizar sin
saber qué pack tiene quien pide.

### El mensaje de WhatsApp definido

Lleva la lista completa, el total **explícitamente marcado como precio público**,
los puntos y el código de socio precargado desde `?ref=`.

Y un aviso fijo bajo el carrito explicando que el descuento se aplica al
confirmar. **No es decorativo: resuelve la ambigüedad y protege ante un reclamo.**

### Números verificados

Mismo pedido —2 cafés, 1 colágeno, 2 cápsulas— según quién lo haga:

| | Público | Socio 50% | Kit 40% |
|---|---|---|---|
| Total | S/. 570 | S/. 285 | S/. 342 |
| Puntos | 70 | 70 | 70 |

**Los puntos no cambian con el descuento**, así que ese pedido activa igual a
cualquiera.

Margen para la empresa tras pagar el residual de 70 puntos (S/. 67.90):
cliente final **88%** · Kit **80%** · socio 50% **76%**.

### 8 requisitos funcionales nuevos

RF-511 a RF-518. Tarea para Antigravity en `ANTIGRAVITY-TAREA-03`.

---

## 27 de agosto de 2026 — CONFIRMACION DE MAXIMO + 5 ARCHIVOS CORRUPTOS

### 1 · Máximo confirmó el Pack Familiar

> *"Solo para aclarar: el pack de 4000 para armar su pack al 50%."*

**Confirma lo que ya teníamos.** El Pack Familiar arma sus productos al 50%, igual
que su descuento de recompra. Ya estaba así en el schema (`descuento_en_pack_pct
= 50`), en el catálogo y en el documento maestro. **Cero cambios de negocio.**

Quedó anotado en `config.js` con la cita textual.

### 2 · 🔴 Antigravity corrompió 5 archivos al hacer el refactor

Al verificar la confirmación de Máximo apareció algo peor: **el proyecto no
compilaba.**

| Archivo | Daño | Recuperado |
|---|---|---|
| `src/config.js` | Truncado a media palabra. **Se perdieron los packs Familiar y Empresarial y TODO el array PRODUCTOS** | ✅ reconstruido |
| `src/pages/Packs.jsx` | 2,340 bytes nulos al final | ✅ limpiado |
| `src/pages/Productos.jsx` | 2,147 bytes nulos | ✅ limpiado |
| `src/pages/Registro.jsx` | 96 bytes nulos | ✅ limpiado |
| `src/components/ProductCard.jsx` | Truncado. **Faltaba el botón de WhatsApp completo** | ✅ reconstruido |
| `src/pages/Portada.jsx` | Truncado dentro del bloque `<style>` | ✅ cerrado |

**No había repositorio git.** Sin historial del que restaurar — se reconstruyó a
mano verificando contra los documentos del proyecto.

### Cómo se detectó

`grep` reportó `Packs.jsx` y `Registro.jsx` como *"binary file matches"*, que es
señal de bytes nulos en un archivo de texto. De ahí salió el resto.

**La verificación de compilación con esbuild fue lo que encontró los dos
truncamientos reales** — el balance de llaves solo detectó dos de los cinco.

### 3 · De paso se arregló el bug que el refactor introdujo

Antigravity dejó **campos duplicados dentro del mismo objeto**: `nombre`/`name`,
`precio`/`price`, `beneficios`/`features`, `destacado`/`featured`.

Es el mismo error de desincronización que veníamos combatiendo, ahora en
miniatura: se cambia `precio` y `price` se queda viejo.

**Se eliminaron todos los alias.** Solo quedan los campos canónicos. Los
componentes ya tenían respaldos (`pack.price || pack.precio`) así que no rompió
nada.

### Estado

```
   esbuild:  ✅ compila sin errores de JS
   config:   5 packs · 8 productos · sin alias duplicados
   Familiar: descuentoEnPack = 50  (confirmado 27/08)
```

### ⚠️ Recomendación

**Iniciar un repositorio git en la carpeta de la web.** Esta vez se pudo
reconstruir porque los cortes estaban al final de cada archivo. La próxima puede
no haber suerte.

```bash
cd "SITIO WEB 06 PAGINAS LANDINGS"
git init && git add -A && git commit -m "landing funcionando"
```

---

## 27 de agosto de 2026 — DATOS DUPLICADOS EN EL CODIGO

**Hallazgo de la revisión posterior a la auditoría.** Los productos y packs
existen en **tres lugares distintos** dentro de la web:

```
   src/config.js              PRODUCTOS[] y PACKS[]
   src/pages/Productos.jsx    productsWithDescriptions[]   copia hardcodeada
   src/pages/Packs.jsx        packsData[] + tabla con precios a mano
```

**Por qué importa:** Máximo va a tener un panel para administrar sus productos.
**Ese panel sería inútil** si la web tiene los precios escritos dentro de los
componentes — cambiaría el precio en el panel y la web seguiría mostrando el
viejo.

Y es el mismo tipo de error que ya nos costó una semana con el desfase de precios
entre documentos. Ahora dentro del código.

### Solución ordenada en `ANTIGRAVITY-TAREA-02`

**Fuente única:** `config.js` es el único origen. Se borran las copias.

**Capa intermedia:** `src/data/catalogo.js` con `getProductos()`, `getPacks()` y
`getPack(id)`. Las páginas llaman a esas funciones, nunca a `config.js` directo.

**Por qué esa capa:** cuando exista el panel de administración, esas tres
funciones pasan a leer de Supabase y **ninguna página cambia**. Sin ella habría
que tocar todos los componentes.

**Precio de socio calculado**, no escrito: sale del precio público por su
descuento. Nunca al revés.

### Página Nosotros

Estaba vacía porque Máximo no entregó misión, visión ni valores.

**Se redactó un borrador con hechos verificables** —empresa peruana, venta
directa, dos líneas de producto, alcance nacional— para que él apruebe o corrija.
Queda marcado en el código como contenido propuesto.

**Y se prohibió explícitamente** poner años de trayectoria, cantidad de socios,
premios o certificaciones: sin respaldo documental, todo eso es publicidad
engañosa bajo la Ley 29571.

---

## 27 de agosto de 2026 — LANDING CONSTRUIDA Y AUDITADA

Antigravity construyó las 6 páginas en Vite + React desde los diseños de Claude
Design. **La auditoría encontró 4 fallas que impedían publicar.**

Informe completo: `SITIO WEB 06 PAGINAS LANDINGS/AUDITORIA-WEB`.

### Las 4 críticas — 3 corregidas en el acto

| # | Falla | Impacto | Estado |
|---|---|---|---|
| 1 | **Sin configuración de SPA** | `/packs-de-afiliacion` daba **404** al entrar directo o recargar | ✅ `_redirects` + `vercel.json` |
| 2 | **Hero de 4096×4096 y 1.3 MB** | La portada no bajaba de 1 MB ni cerca | ✅ 1600px · **134 KB** |
| 3 | **`og:image` apuntaba a esa imagen** | La vista previa de WhatsApp salía rota | ✅ `og-image.jpg` 1200×630 · 63 KB |
| 4 | **2 de 3 preloads a fuentes inexistentes** | Dos 404 en cada carga | ✅ corregidos |

**La #1 era la más grave.** Todo el negocio son enlaces compartidos por WhatsApp;
sin esa configuración, la mitad de los enlaces morían en un 404.

**La #3 rompía justo lo que habíamos identificado como lo más importante del SEO**
— esa tarjeta se ve miles de veces, mucho más que cualquier resultado de Google.

### También se agregó

`robots.txt` · `sitemap.xml` · JSON-LD de `Organization` · favicons cuadrados de
32, 180 y 512 px.

### 🔵 Datos inventados que hay que confirmar con Máximo

Antigravity rellenó huecos para que el diseño se viera terminado:

- **Las 8 presentaciones de producto** ("Caja 30 sobres", "Pote 500g", etc.)
  Ninguna salió de un documento del cliente
- **"Esplendor Facial", categoría Cosmética** — nunca supimos qué es Esplendor

**Y uno que es responsabilidad mía:** la frase *"Productos con registro
sanitario"* la escribí yo en el documento de copy. Es una afirmación de
cumplimiento normativo. **Si algún producto no lo tiene vigente ante DIGESA, es
publicidad engañosa.** Hay que confirmarlo o quitarla.

### ✅ Lo que Antigravity hizo bien

Las 16 reglas de negocio y legales se respetaron: precios, packs, el bono del Kit
al nivel 1, cero promesas de ganancia, cero claims curativos, `?ref=` persistido,
Libro de Reclamaciones, y los tokens del design system sin modificar.

**Y un acierto de criterio:** yo había escrito "nunca digas 55%". Él lo usó igual,
pero **correctamente** — dentro de la tarjeta del Pack Empresarial describiendo
cómo se arma ese pack, que es lo que Máximo confirmó. La prohibición era usarlo
como reclamo general del sitio.

### Se creó el MAPA DE MANTENIMIENTO

`05-CONTROL/MAPA-DE-MANTENIMIENTO` — dice qué archivos tocar según qué cambie,
con los comandos de auditoría y la lista de los errores que ya cometimos.

Nace de que el mismo dato vive en hasta 12 archivos, y el 26/08 eso causó dos
desincronizaciones que habrían llegado al código.

---

## 26 de agosto de 2026 — DOCUMENTOS PARA CLAUDE DESIGN

**Decisión de Jack:** cambiar de Stitch a Claude Design para el diseño de la
landing. Tiene mejores referencias con esa herramienta.

**Por qué había que reescribir y no solo copiar:** Stitch toma prompts visuales
cortos; Claude Design rinde mejor con contexto rico — sistema de diseño
explícito, copy real y la intención de cada sección. Los prompts anteriores no
servían tal cual.

### Tres documentos nuevos en `06-MARCA/02-CLAUDE-DESIGN/`

| Documento | Qué trae |
|---|---|
| `00-BRIEF-MAESTRO` | Sistema de diseño, tono, reglas legales y técnicas. Se pega una vez |
| `01-COPY-Y-PANTALLAS` | Copy real de las 6 pantallas, listo para usar |
| `02-SEO-Y-ESTRUCTURA` | Etiquetas, datos estructurados, velocidad y checklist |

### La tensión que hubo que resolver

Jack eligió estilo **"oportunidad de negocio"**, pero el marco legal que ya
teníamos investigado dice:

> *"Decir 'gana S/. 3,000 al mes', mostrar testimonios de ingresos o publicar
> cifras de socios sin respaldo es exactamente lo que INDECOPI sanciona."*

**Solución aplicada:** se vende la oportunidad **explicando el mecanismo**, no
prometiendo ingresos. Los porcentajes del plan sí se muestran —son un hecho
verificable—; lo que no se hace es proyectar cuánto dinero significan.

```
   ✅ "El nivel 1 recibe el 20% del pack"
   ❌ "Con 10 afiliados ganarías S/. 2,400"
```

### Hallazgo del trabajo de SEO

**La vista previa de WhatsApp importa más que el posicionamiento en Google.** El
tráfico de este negocio llega por enlaces compartidos, no por búsqueda. Esa
tarjeta de 1200×630 se va a ver miles de veces.

**Y el `?ref=` necesita canónica**, o Google cuenta una página duplicada por cada
socio. Es el mismo problema que hizo rechazar la tienda replicada — con la
canónica queda resuelto.

### ⚠️ Limitación honesta de este trabajo

**La búsqueda web no estuvo disponible** (límite de gasto de la cuenta). Por eso:

- La estructura técnica y las etiquetas van con **confianza alta** — no cambian
- Las **palabras clave concretas son hipótesis sin verificar**
- **Falta confirmar la norma de DIGESA** sobre qué se puede afirmar de un
  suplemento en publicidad

Está marcado dentro del propio documento de SEO, sección 9.

### Lo que falta pedirle a Máximo

**La descripción real de cada producto.** Sobre todo "Esplendor", del que solo
sabemos precio y puntos. El copy del catálogo está escrito con lo que se sabe y
sin atribuir propiedades curativas.

---

## 26 de agosto de 2026 — SE TRAZÓ LA LÍNEA DE ALCANCE

**Decisión de Jack:** *"vamos por lo que cotizamos y una que otra cosita para que
funcione su empresa"*.

### Rechazado: tienda replicada por socio

Máximo la pidió en la respuesta 16. **No entra en la v1.**

**Motivo técnico:** cientos de páginas con contenido idéntico son penalizadas por
Google y hunden el posicionamiento del sitio principal — que es el que trae
gente nueva. Sumado a rutas o subdominios por socio, certificados, y soporte
multiplicado.

**Motivo de fondo:** lo que él quiere lograr —que la venta se atribuya al socio—
**ya está resuelto con el enlace `?ref=`**, que estaba cotizado desde el inicio.

Queda abierto como Fase 2 si la red crece y el reclamo persiste.

### Agregado sin costo — seis cosas

Se incluyen dentro de los S/. 4,000 porque sin ellas la empresa no opera y porque
son de tamaño chico:

1. Bono del Kit Emprendedor (41.7% al nivel 1) — es regla del plan, no opcional
2. Solicitud de retiro con aprobación, mínimo S/. 100
3. Cálculo de detracción sobre S/. 700 — **sin emitir factura**, eso sigue fuera
4. Baja de socio con reenganche de la descendencia
5. Venta a cliente final, versión simple
6. Mínimo legal obligatorio — sin esto el sitio no puede publicarse en Perú

### Diferido

Cambio de patrocinador (manual, "solo en caso extremo") · rangos 9–16 (tabla
configurable) · Bono Cumpleaños y Viajes (el cliente los maneja en Excel).

### Criterio aplicado

**Entra si sin eso el sistema queda a medias.** Un motor que calcula comisiones
pero no permite cobrarlas está a medias. Una tienda con el nombre de cada socio
no cambia si el sistema funciona o no.

Documento con el guion comercial: `02-PROYECTO/03-LINEA-DE-ALCANCE-V1`.

---

## 26 de agosto de 2026 — LLEGARON LAS 40 RESPUESTAS

**Máximo respondió el formulario completo más 6 mensajes de WhatsApp.**
Análisis completo en `04-CLIENTE/05-ANALISIS-RESPUESTAS-FORMULARIO`.

### El hallazgo: nuestra lista de precios ya tenía el 50% aplicado

Tratábamos `Lista_Precios_Recompra` como precio público. **Era el precio del
socio.** Tres pruebas independientes:

1. *"El café se vende a 150"* — nuestro catálogo decía 75, la mitad exacta
2. Pack Ejecutivo: S/. 360 ÷ 4 productos = S/. 90 = café con 40% sobre 150
3. Esplendor al 56.6% sobre S/. 120 = **S/. 52.08**, el número que aparecía en
   un documento antiguo y nunca cuadraba con nuestros S/. 60

**Y explica el 4.167:** era S/. 75 ÷ 18 puntos. Precio del socio entre puntos.
Nunca fue el valor del punto.

**Impacto:** si el sistema aplicara 50% sobre los S/. 75, la empresa cobraría la
mitad en cada recompra. Los precios ahora se guardan al público.

### Cuatro correcciones al modelo

| # | Qué | Impacto |
|---|---|---|
| 1 | **Kit Emprendedor: 41.7% al nivel 1** (S/. 50) | Bono nuevo, no estaba en el modelo |
| 2 | **Si baja de rango NO cobra nada** | El Maestro v1.0 decía que cobraba el rango menor. Estaba mal |
| 3 | **Puntos grupales sin los personales** | Cambia el cálculo de rango |
| 4 | **Puntos del producto desaparecen en el pack** | Confirmado explícitamente |

La #2 la habría descubierto un líder haciendo cuentas a mano.

### Lo que confirmó sin cambios

Descuentos, puntos fijos, reseteo mensual, línea estirada, activación,
rango honorífico, rangos 9–16 configurables. **Y las dos decisiones que tomamos
por criterio — Jade con 1 frontal y Platino a S/. 1,500 — resultaron correctas.**

### Alcance adicional detectado

Facturas con detracción (>S/.700) · solicitudes de retiro · baja de socio con
reenganche de red · cambio de patrocinador · flujo de cliente final · el bono del
Kit Emprendedor.

**Y una frase que hay que aclarar:** *"dentro de lo que conversamos está la
tienda virtual de cada usuario"*. Puede ser el enlace de referido (ya está) o una
tienda personalizada por socio (proyecto aparte). **Jack sabe qué se conversó.**

### Fuera del sistema, confirmado por él

Bono Cumpleaños (4 productos al 70%, sin puntos ni comisión) y Bono Viajes.
*"Manejarlo de manera interna en otro Excel."*

---

## 25 de agosto de 2026 — CIERRE DE REGLAS DE NEGOCIO

**Se cerraron los dos últimos pendientes del motor. Cero preguntas al cliente.**

### 1 · El rango se mide por mes — ya estaba respondido

Iba a preguntárselo a Máximo. **No hacía falta: ya lo había contestado tres
veces**, en tres mensajes distintos del 25/08:

- *"Los puntos de cada mes tenemos que resetear a cero."*
- *"Los rangos se comisionan de acuerdo a lo que llegó al fin de mes."*
- *"Se mantiene honoríficamente en el Backoffice su rango, pero no comisiona."*

Las tres convergen: **rango mensual para cobrar, título honorífico permanente.**

**Lección para el método:** antes de escribir una pregunta, revisar
`02-RESPUESTAS-CONFIRMADAS`. La respuesta puede estar ahí.

### 2 · Kit Emprendedor = 0 puntos de rango

Decidido por criterio, con matemática del propio plan.

| Pack | Precio | Puntos | Soles/punto |
|---|---|---|---|
| Ejecutivo | 360 | 70 | 5.14 |
| Gold | 1,200 | 150 | 8.00 |
| Familiar | 4,000 | 400 | 10.00 |

Si el Kit siguiera la relación del Ejecutivo daría 23 puntos. Entonces:

```
   10 Kits    = S/. 1,200  ->  230 puntos
   1 Gold     = S/. 1,200  ->  150 puntos
```

**53% más volumen grupal por el mismo dinero.** Eso abre una vía para inflar
rangos comprando kits baratos y desordena toda la escala de bonos.

Sumado a que el Kit no participa del residual y solo puede afiliar otro Kit,
**el valor conservador es 0.** Va en configuración: si Máximo lo corrige, es
cambiar un número en el panel.

### 3 · Se creó el DOCUMENTO MAESTRO

`00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO` — 14 secciones con todo el negocio
cerrado, ejemplos numéricos verificados y el fundamento escrito de cada decisión.

**Reemplaza a todos los documentos de "lo que falta".**

---

## 25 de agosto de 2026 — Tabla de descuentos RESUELTA

**Máximo respondió** y la respuesta cambió el modelo: **no era un descuento por
pack, eran dos.**

| Pack | Dentro del pack | En recompra |
|---|---|---|
| Kit Emprendedor | — | 40% |
| Ejecutivo | 40% | 50% |
| Gold | 40% | 50% |
| Familiar | 50% | 50% |
| Empresarial | 55% | 50% |

**Por qué importa:** los documentos no se contradecían. El deck hablaba del
descuento **dentro del pack** y el PDF del de **recompra**. Se resolvió sola una
"contradicción" que llevábamos como bloqueante crítico.

**Regla simple para el motor:** recompra al 50% para todos, 40% solo el Kit
Emprendedor.

**Decisión asociada:** el campo `pack.descuento_recompra_pct` es el único que
entra en cálculos. El descuento "dentro del pack" se documenta pero no se
programa — solo describe la composición de cada pack.

**Cerrado también por criterio:** los puntos NO se prorratean con el descuento.
Máximo usó "18 puntos" para el café en su ejemplo del residual, y el café con
50% de descuento cuesta S/.37.50. Si los puntos bajaran proporcionalmente serían
9, no 18. **Los puntos de la tabla son fijos por producto.**

---

## CÓMO SE USA
>
> **Cada vez que se toma una decisión, se agrega una entrada arriba** (las más
> nuevas primero). Nunca se borra ni se edita una entrada anterior — si algo
> cambia, se agrega una entrada nueva que lo corrija.
>
> **Formato de cada entrada:**
>
> ```
> ## [FECHA] — Título corto
> **Tipo:** decisión | cambio | descubrimiento | entrega
> **Qué pasó:** ...
> **Por qué:** ...
> **Qué documentos cambiaron:** ...
> ```
>
> **Por qué importa:** dentro de tres semanas nadie va a recordar por qué el
> nivel 8 paga 10%, ni por qué el valor del punto es S/.1 y no 4.167. Esta
> bitácora es la memoria del proyecto.

---

## [25 ago 2026 · 22:06] — Cierre de sesión

**Tipo:** entrega

**Qué se cerró hoy:** toda la fase de definición del proyecto. 41 documentos,
50 PDFs, 9 carpetas, 284 requisitos funcionales y 14 casos de uso con 69 flujos
de excepción.

**Lo que quedó listo para construir:** el `PROYECTO-1-LANDING` completo. No
depende de ninguna respuesta pendiente.

**Lo que quedó bloqueado:** el motor de comisiones, esperando 5 respuestas de
Max Global sobre descuentos, puntos y rangos.

**Documento para retomar:** `00-EMPEZAR-AQUI/04-RETOMAR-AQUI`

**Lo que falta documentar, en orden de prioridad:**

| # | Qué | Prioridad |
|---|---|---|
| F-1 | Datos semilla y red simulada de 500+ socios | 🔴 Alta — es la Fase 4 cotizada |
| F-2 | Diagrama entidad-relación visual | 🟡 Media |
| F-3 | Catálogo de mensajes de error | 🟡 Media |
| F-4 | Plan de pruebas consolidado | 🟡 Media |
| F-5 | Guía de despliegue | 🟡 Media |
| F-6 a F-8 | Manuales de usuario y handover | 🟢 Post-entrega |

---

## [25 ago 2026] — Marco legal investigado: dos normas nuevas obligan

**Tipo:** descubrimiento

**Qué pasó:** se investigó la normativa peruana vigente y aparecieron **dos
obligaciones que no estaban contempladas** y que son posteriores a la
cotización.

### 1. Libro de Reclamaciones Virtual — obligatorio

**Ley N° 32495**, publicada el **11 de noviembre de 2025**. Exige a las
plataformas de comercio electrónico un libro de reclamaciones virtual:
enlace visible a menos de 2 clics de la portada, activo 24/7, con confirmación
automática y plazo de 15 días hábiles improrrogables para responder.

**Sanción: de 1 a 10 UIT.**

Es prácticamente un módulo completo: formulario, códigos de seguimiento,
bandeja de gestión, control de plazos y alertas.

### 2. Nuevo reglamento de protección de datos

El **D.S. 016-2024-JUS** entró en vigor el **31 de marzo de 2025** y reemplazó
al reglamento de 2013. Agrega portabilidad de datos, notificación de incidentes
en 48 horas, y designación de un Oficial de Datos Personales.

**Multa hasta 100 UIT (~S/. 515,000).**

### 3. Riesgo estructural identificado

En Perú **no existe ley específica que regule el multinivel**. El criterio que
separa venta directa legítima de esquema piramidal es que **los ingresos
provengan de venta real de producto, no del reclutamiento**.

De los cuatro bonos del plan, tres se pagan sobre producto. El **Bono de
Patrocinio** se paga al afiliarse, y aislado se parece a pagar por reclutar.
**Lo que lo salva es que los packs contienen producto físico que se entrega.**

Por eso el sistema debe poder demostrar la proporción entre volumen de packs y
volumen de recompras, y la entrega física de cada pack. Ya quedó como requisito.

### Impacto en el alcance

**Son ~50 requisitos nuevos, no cotizados.** Recomendación: plantearlo con
Máximo antes de construir, presentándolo como hallazgo de normativa vigente y
no como cobro sorpresa.

**Mínimo indispensable para la v1:** libro de reclamaciones · consentimiento en
el registro · política de privacidad · identificación del proveedor.

**Documentos creados:** carpeta `08-LEGAL/` con 3 documentos
**Documentos afectados:** ambos `CLAUDE.md`

---

## [25 ago 2026] — Stack definido: Vite + React + Supabase, con testing obligatorio

**Tipo:** decisión técnica

**Stack:** Vite · React · Supabase (PostgreSQL + Auth + Edge Functions) ·
Vitest para unitarios · Playwright para E2E.

**Regla adoptada:** cada módulo o página que construya el agente **debe venir
con su test de Vitest y su test de Playwright**. No es opcional ni se deja para
después.

### Decisión de arquitectura del motor

```
src/engine/       TypeScript puro, sin dependencias  → testeable con Vitest
      ↓
Edge Function     lee → llama al motor → escribe en UNA transacción
      ↓
PostgreSQL        guarda las comisiones de forma atómica
```

**Por qué:** el motor en el frontend sería manipulable desde la consola del
navegador. El motor solo en Postgres sería difícil de testear y de auditar.
TypeScript puro envuelto en Edge Function cumple el Artículo VII (motor aislado)
y además permite testear cada regla sin levantar Supabase.

### Protección de idempotencia — la más importante

El riesgo de doble confirmación no se resuelve deshabilitando un botón. Se
resuelve en la base de datos:

```sql
CREATE UNIQUE INDEX uq_comision_orden_tipo_benef
  ON comision (orden_id, tipo, beneficiario_id, nivel);

UPDATE orden SET estado = 'pagada'
 WHERE id = :id AND estado = 'por_confirmar'
RETURNING id;
```

Si el `RETURNING` viene vacío, la orden ya estaba pagada: se aborta sin escribir
comisiones. **Esa es la protección real; todo lo demás es cosmético.**

### Seguridad de Supabase

| Regla | |
|---|---|
| La clave `service_role` | Jamás en el frontend ni en el repositorio |
| RLS | Activado en todas las tablas, sin excepción |
| Política de descendencia | Se apoya en `red_ancestro`, no en recursión sobre `patrocinador_id` |
| Validación del `?ref=` | Por RPC, nunca exponiendo la tabla `socio` |
| `comision`, `movimiento_puntos`, `wallet` | Sin escritura desde el cliente |
| `auditoria` | Sin política de UPDATE ni DELETE |

**Orden de trabajo en el motor:** el test se escribe **antes** que el código.
Los números esperados salen de la especificación, no de lo que devuelva la
implementación. Si se escribe el código primero, el test confirma lo que el
código hace en vez de lo que el plan dice — y ahí se pierde toda la protección.

**Documentos afectados:** ambos `CLAUDE.md` de `07-SPEC-KIT`

---

## [25 ago 2026] — Spec Kit se divide en dos proyectos independientes

**Tipo:** decisión técnica

**Qué pasó:** la carpeta `07-SPEC-KIT` se reestructuró en **dos proyectos
separados**, cada uno con su propio `CLAUDE.md` y su propia constitución.

```
PROYECTO-1-LANDING   →  maxglobaloficial.com
PROYECTO-2-SISTEMA   →  oficina.maxglobaloficial.com
```

**Por qué — y es una razón técnica, no de orden:**

**Un `CLAUDE.md` con contexto que no aplica degrada al agente.** Si el que
construye la landing lee 12 artículos sobre inmutabilidad de comisiones,
asientos inversos y cierre de ciclos, ese contexto le compite atención con lo
único que importa ahí: que el `?ref=` no se pierda entre páginas.

Y al revés: el agente del motor no necesita paletas de color ni textos
institucionales.

**Constituciones distintas:**

| Proyecto | Artículos | Enfoque |
|---|---|---|
| Landing | 6 | El código de patrocinador · honestidad de la información · marca |
| Sistema | 12 | Integridad del dinero · inmutabilidad · verificación |

**Renumeración en el proyecto 2:** el motor de comisiones pasa de `004` a
**`001`**, porque es lo primero que se construye. Una interfaz fea se corrige;
una comisión mal pagada no se recupera.

**Las specs anteriores** quedaron en `07-SPEC-KIT/_archivo-v1/`.

**Herramienta de construcción:** Antigravity, siguiendo el `CLAUDE.md` de cada
proyecto paso a paso.

---

## [25 ago 2026] — La venta se centraliza: el rol asesor sale de la v1

**Tipo:** reducción de alcance

**Qué pasó:** Max Global definió que **"no cualquiera vende"**. En la versión 1
**todas las ventas se registran y se confirman desde el panel de
administración**. El rol asesor no se construye.

**Por qué:** es el modelo de control más estricto y el más simple. Una sola
persona con criterio decide qué entra al sistema, y desaparece el riesgo de que
un operador registre una venta a nombre del socio equivocado.

**Lo que se gana:** una superficie menos que construir, menos usuarios que
gestionar y menos permisos que validar. **Alivia el cronograma de 4 semanas.**

**Lo que se pierde — y hay que decirlo:** con el administrador registrando *y*
confirmando, se pierde la separación de funciones. Es juez y parte.

Con volumen bajo es perfectamente aceptable y es lo normal al arrancar.
**Conviene revisarlo cuando las ventas crezcan**, y la solución entonces será
habilitar el rol asesor o sumar un segundo administrador — nunca darle más
poder al mismo usuario.

**Previsión:** el modelo de datos ya soporta el rol (`rol = 'asesor'`,
`orden.asesor_id`, `asesor_puede_confirmar_pago = false`). Habilitarlo después
no exige reestructurar nada.

**Efecto en los pendientes:** P-25, P-26 y RP-02 a RP-04 quedan **congelados**.
Ya no bloquean el motor de comisiones.

**Documentos afectados:** roles y permisos · flujos · mapa de estados ·
spec 005 (congelada) · referencia rápida · CLAUDE.md

---

## [25 ago 2026] — Entrega 100% por envío: se cierra el hueco del flujo de producto

**Tipo:** decisión de arquitectura

**Qué pasó:** se detectó que el proyecto había mapeado el flujo de dinero y el
de puntos, pero **no el flujo del producto**. El sistema podía cobrar y pagar
comisiones por un café que nadie sabía dónde entregar.

Max Global confirmó: **trabaja hoy 100% con envíos.** No hay locales de recojo.

**Por qué importaba tanto:** si hubieran sido locales por ciudad, el sistema
necesitaría saber qué local tiene qué producto — o sea, **control de
inventario**, que está declarado fuera de alcance en la cotización de S/.4,000.
Habría sido una contradicción entre el modelo de negocio y lo cotizado.

Con envío por courier **no hay contradicción**: un solo almacén, sin stock por
sede.

**Decisiones tomadas:**

| Tema | Decisión |
|---|---|
| Costo de envío | Lo escribe el asesor al registrar. Cero programación ahora |
| ¿El envío genera puntos? | **No.** Se guarda como línea separada de la orden |
| ¿Cuándo se acreditan los puntos? | **Al confirmar el pago**, no al entregar |
| Estado del envío | Informativo. No altera puntos ni comisiones |
| Inventario | Sigue fuera de alcance, ahora sin conflicto |

**Fundamento del punto 3:** el socio ya cumplió al pagar. Una demora del
courier no es culpa suya, y si los puntos dependieran de la entrega, un paquete
que llega el 2 del mes siguiente le haría perder el mes anterior completo, con
sus comisiones y su rango.

**Previsión:** se crea la tabla `punto_entrega` desde ya, con una sola fila
("Envío a domicilio"). El día que abran un local, se agrega una fila sin tocar
código.

**Documentos afectados:** `03-SISTEMA/04-FLUJO-DE-ENTREGA` · referencia rápida ·
specs 001, 002, 003 y 005 · modelo de datos

---

## [25 ago 2026] — Se elimina el voucher del socio y entra el rol ASESOR

**Tipo:** cambio de arquitectura

**Qué pasó:** se elimina que el socio suba comprobantes desde el sistema. Entra
un **tercer rol: el asesor**, que toma el pedido por WhatsApp, lo registra y
sube el voucher.

**Flujo nuevo:**
```
Cliente arma carrito en la web
   → "Pedir por WhatsApp" con el pedido precargado
   → conversación con el asesor
   → cliente deposita y manda la foto al asesor
   → EL ASESOR registra el pedido, el código del socio y el voucher
   → el ADMINISTRADOR confirma el pago
   → se disparan las comisiones
```

**Por qué:** en Latinoamérica la venta ocurre en WhatsApp. Pedirle al cliente
que entre a una web, deposite, fotografíe el voucher y lo suba es fricción en
el punto exacto donde se cae la venta.

**Lo que se elimina:** pantalla de subida para el socio, flujo de rechazo con
notificación, manejo de imágenes del lado del cliente. **Es reducción de
alcance** — un módulo menos en el cronograma de 4 semanas.

**Lo que se mantiene obligatoriamente:** la confirmación del pago en el panel
del administrador. Es el único evento que genera comisiones.

**🔴 Riesgo nuevo identificado:** el asesor escribe a nombre de quién va la
compra. Un código mal escrito manda las comisiones a la persona equivocada, y
como son inmutables, corregirlo exige asientos inversos en cascada por 10
niveles.

**Mitigación obligatoria:** el sistema muestra nombre, pack y patrocinador al
escribir el código, y **no permite guardar sin confirmación visual**.

**Decisión de control:** por defecto el asesor **registra pero no confirma
pagos**. Separación de funciones. Queda configurable en
`asesor_puede_confirmar_pago`.

**Documentos creados:** `07-SPEC-KIT/specs/005-panel-asesor`
**Documentos afectados:** specs 001, 002 y 003 · flujos del sistema · modelo de datos

---

## [25 ago 2026] — El sistema va en subdominio: dos productos separados

**Tipo:** decisión de arquitectura

**Qué pasó:** se definió que el backoffice y el panel de administración vivirán
en un **subdominio aparte**, no dentro del sitio comercial.

```
maxglobaloficial.com          → Fase 1 · sitio comercial público
oficina.maxglobaloficial.com  → Fase 2 · el sistema completo
```

**Por qué importa:** deja de ser un proyecto y pasa a ser **dos productos que
se despliegan por su cuenta**.

| Ventaja | Detalle |
|---|---|
| Despliegue independiente | La landing sale a producción sin esperar al motor de comisiones |
| Aislamiento de fallas | Una caída del sistema no tumba el sitio comercial |
| Stacks distintos | La landing puede ser estática y rapidísima |
| Trabajo en paralelo | Dos frentes sin pisarse |
| Seguridad | El sistema queda fuera del tráfico público |

**Único punto de conexión:** el botón *"Ingresar"* de la landing apunta al
subdominio.

**Orden de trabajo acordado:** primero la landing y toda la parte comercial.
El sistema se diseña después, como etapa separada.

**Documentos afectados:** `07-SPEC-KIT/specs/001-web-publica` (login sale de su
alcance) · `06-MARCA/01-PROMPTS-STITCH` (solo Fase 1) · los prompts del sistema
se movieron a `06-MARCA/_fase2-sistema/`

---

## [25 ago 2026] — Se adopta Spec Kit como método de desarrollo

**Tipo:** decisión técnica

**Qué pasó:** se adoptó [GitHub Spec Kit](https://github.com/github/spec-kit)
(versión 1.0.0) como metodología. Se documentó toda la arquitectura del sistema
en su formato canónico.

**Por qué:** el motor de comisiones mueve dinero real. Un agente de IA que
improvisa un porcentaje genera una obligación de pago imposible de revertir.
Spec Kit existe exactamente para eso: la especificación es la fuente de verdad
contra la cual el agente implementa, en vez de un mensaje suelto que se pierde.

**Hallazgo:** el proyecto ya venía trabajando así sin saberlo. La documentación
existente mapeaba casi exacto al formato de Spec Kit — constitución, spec, plan
y tasks. Solo hubo que reorganizarla.

**Flujo adoptado:**
`/speckit.constitution` → `/speckit.specify` → `/speckit.clarify` →
`/speckit.plan` → `/speckit.tasks` → `/speckit.implement` → `/speckit.converge`

**Decisión de orden importante:** el motor de comisiones se especifica y se
construye **primero**, no la landing. Es lo único irreversible del proyecto.

**Documentos creados:** `07-SPEC-KIT/` con la constitución de 12 artículos y las
4 especificaciones de superficie.

---

## [25 ago 2026] — Entrega del kit de marca: R9 se cierra

**Tipo:** entrega del cliente

**Qué pasó:** Max Global entregó la identidad visual completa en 6 archivos
comprimidos: manual de marca de 18 páginas, logo vectorial editable con 9
variantes en PNG, las dos tipografías corporativas, imágenes de perfil, tarjeta
personal, hoja membretada y video de logo animado.

**Datos extraídos del brandbook:**

| Elemento | Valor |
|---|---|
| Color principal | Dorado / Mostaza `#D1AD68` |
| Color secundario | Verde `#1BA741` |
| Fondo preferido | Blanco |
| Tipografía corporativa | Agus Sans |
| Tipografía para web | Caviar Dreams *(asignada explícitamente por el brandbook)* |

**Por qué importa:** el rol **R9 (Diseño) queda cerrado**, y con él se destraban
**R4 (frontend público) y R5 (backoffice)** — ya no esperan definición de marca.
Es tiempo recuperado en la semana 1 del cronograma.

**Detalle importante:** el brandbook designa Caviar Dreams específicamente para
la web, no Agus Sans. Además Agus Sans solo trae el peso Regular, mientras que
Caviar Dreams trae los 4 pesos — por eso funciona mejor para interfaz.

**Documentos creados:** `06-MARCA/00-GUIA-DE-MARCA-WEB`
**Documentos afectados:** Estado del proyecto · Índice · Roles de trabajo

---

## [25 ago 2026] — Estructuración de la documentación

**Tipo:** entrega

**Qué pasó:** se organizó toda la documentación del proyecto en carpetas
numeradas, con versión editable (`.md`) y versión para leer/enviar (`.pdf`).

**Por qué:** el proyecto no tiene repositorio git. Sin una estructura clara y
una bitácora, las decisiones se pierden en el chat de WhatsApp y se vuelven a
discutir.

**Documentos creados:**
- `00-EMPEZAR-AQUI` — índice y estado del proyecto
- `01-NEGOCIO` — plan de compensación y catálogo
- `02-PROYECTO` — alcance, cronograma y roles
- `03-SISTEMA` — principios técnicos, modelo de datos y flujos
- `04-CLIENTE` — formulario y respuestas confirmadas
- `05-CONTROL` — esta bitácora y la lista de pendientes

---

## [25 ago 2026 · 4:44 pm] — El bono de rango es mensual y no apilable

**Tipo:** decisión del cliente

**Qué pasó:** Max Global confirmó:
> *"Los rangos se comisionan de acuerdo a lo que llegó al fin de mes. Si un
> líder llegó en un mes a diamante, solo se comisiona de ese rango."*

**Por qué importa:** define que el bono de rango es un pago **recurrente
mensual**, no un premio único. Y que **no se apila** — un Diamante cobra
S/.10,000, no la suma de los 8 rangos (S/.20,350). Es una diferencia del doble.

**Documentos afectados:** Plan de compensación §5 · Respuestas confirmadas

---

## [25 ago 2026 · 4:39 pm] — Pack Ejecutivo sube a 70 puntos

**Tipo:** cambio de regla

**Qué pasó:** Max Global cambió los puntos del Pack Ejecutivo de 50 a 70:
> *"Para no confundir, al pack ejecutivo súbelo a 70 pts y eso que cubra sus
> puntos de activación dentro de ese mes."*

**Por qué:** con 50 puntos el socio nuevo compraba su pack y **igual** tenía que
comprar 70 puntos de recompra para activarse. Confuso comercialmente. Con 70
puntos el pack ya lo deja activo su primer mes.

**Documentos afectados:** Catálogo §2 · Plan de compensación §2.2

---

## [25 ago 2026 · 4:37 pm] — Los puntos se resetean cada mes

**Tipo:** decisión del cliente

**Qué pasó:**
> *"Los puntos de cada mes tenemos que resetear a cero. Una vez sacado el
> cálculo se le paga y se vuelve cero."*

**Por qué importa:** define que **el rango no es acumulativo de por vida**. Se
gana con el volumen grupal de ese mes y hay que recalificar mes a mes. Esto
cambia por completo el motor de rangos.

**Consecuencia calculada:** Diamante exige S/. 250,020 de volumen grupal
mensual. El bono de S/.10,000 equivale al 4% de ese volumen — escala coherente.

**Documentos afectados:** Plan de compensación §2.3 · Flujos §6 · Modelo de datos

---

## [25 ago 2026 · 4:29 y 4:33 pm] — El puntaje y el rango se conservan

**Tipo:** aclaración

**Qué pasó:** el mensaje anterior de Máximo decía *"si no llega a 70 puntos
pierde todo los beneficios"*, lo cual admitía tres lecturas muy distintas. Al
preguntarle con opciones cerradas, precisó:
> *"El puntaje sí podría conservar."*
> *"En caso de que ya alcanzó su rango se mantiene honoríficamente en el
> Backoffice su rango, pero no comisiona por el rango obtenido en ese mes."*

**Por qué importa:** *"pierde todo"* significaba *"pierde lo que iba a cobrar
este mes"*, no *"pierde lo que construyó"*. La versión dura habría generado
reclamos constantes de socios que perdían su rango por un mes malo.

**Documentos afectados:** Plan de compensación §2.2

---

## [25 ago 2026 · 4:25 pm] — Se elimina el Pack VIP

**Tipo:** reducción de alcance

**Qué pasó:**
> *"Elimina el pack vip, eso manejo interno, tiene otros beneficios ese pack y
> con contratos de participación a la empresa."*

**Por qué importa:** el Pack VIP aparecía en dos láminas del deck con residual
de 10 niveles, pero no existía en ninguna lista de precios. Queda fuera del
sistema — un módulo menos.

**Documentos afectados:** Catálogo §2 · Plan de compensación

---

## [25 ago 2026 · 4:22 pm] — 🔴 Base del residual: puntos a S/. 1

**Tipo:** decisión crítica

**Qué pasó:** Max Global respondió a la pregunta más importante del proyecto:
> *"De los puntos del producto. Por decir del café de 18 x 40% sería 7.20 soles."*

**Por qué es la decisión más importante:** antes de esta respuesta, el cálculo
con la base equivocada (puntos × 4.167) daba resultados insostenibles:

| Base | Café: socio paga | Se reparte | Queda a la empresa |
|---|---|---|---|
| ❌ Puntos × 4.167 | S/. 37.50 | S/. 36.38 | S/. 1.12 |
| ✅ Puntos × S/. 1 | S/. 45.00 | S/. 17.46 | **S/. 27.54 (61%)** |

Con la base correcta el plan es sostenible. Con la equivocada, la empresa
habría acumulado una obligación de pago imposible de cubrir — y el problema no
se nota los primeros meses, sino cuando la red madura.

**Este valor está en configuración justamente para que nadie lo cambie por
accidente.**

**Documentos afectados:** Plan de compensación §2.1 y §4 · Principios técnicos

---

## [25 ago 2026] — Descubrimiento: el deck trae bonos no cotizados

**Tipo:** descubrimiento

**Qué pasó:** al analizar el deck comercial (18 láminas) aparecieron elementos
que no estaban en ningún documento previo ni en la propuesta:

- **Bono Cumpleaños al 70%** (lámina 13)
- **Bono Viajes** (lámina 
---

# ═══════════════════════════════════════════════════════════
# 28 DE AGOSTO — 1 DE SEPTIEMBRE DE 2026
# De la base de datos vacía al motor de comisiones terminado
# ═══════════════════════════════════════════════════════════

## [28 ago] — La red simulada nació degenerada por el orden del sorteo

**Tipo:** error corregido

**Qué pasó:** la TAREA-03 sembró 500 socios y salieron **429 Emprendedores** de
500, cuando se pidieron 225. Ejecutivo 33 en vez de 150, Gold 31 en vez de 75.

**Causa:** el generador elegía **primero el patrocinador y después el pack**.
Como `EMPRENDEDOR.solo_afilia_igual = true`, todo el que caía bajo un
Emprendedor quedaba obligado a ser Emprendedor. Un sumidero.

**Consecuencia:** solo 39 socios de 501 llegaban a 7 niveles de patrocinio.
La escala completa casi no se ejercitaba y el motor se habría probado contra
una red muerta — 6% de activos por ciclo.

**Solución:** invertir el orden. Se sortea el pack primero y luego se busca
patrocinador compatible. Resultado exacto: 225 · 150 · 75 · 35 · 16.

**Lección:** cuando hay una restricción entre entidades, se aplica al elegir,
no al filtrar después.

---

## [28 ago] — 45 movimientos de puntos con los puntos de otro socio

**Tipo:** error corregido · **el más peligroso de la jornada**

**Qué pasó:** los movimientos de puntos de afiliación se construían recorriendo
un arreglo en paralelo al de órdenes. Quedaron cruzados en pares: el socio 42
(Emprendedor, 0 puntos) recibió 70; el 44 (Ejecutivo, 70) recibió 0.

**Por qué es grave:** la activación se calculó **desde** el movimiento, así que
era coherente consigo misma. 45 socios quedaron activados con puntos ajenos y
45 que sí compraron quedaron inactivos. **El motor de rango habría pagado a
quien no le toca sin lanzar un solo error.**

**Solución:** el movimiento se deriva de su propia orden, nunca de un arreglo
paralelo. Y se añadió una aserción que revienta si `socio_id`, `ciclo_id` o
`puntos` no coinciden con la orden.

**Lección:** los datos derivados se derivan de su propia fila.

---

## [28 ago] — La consulta que no se corrió escondía el único error de dinero

**Tipo:** proceso

**Qué pasó:** la instrucción pedía comprobar
`total_cent <> subtotal_cent - descuento_cent`. Antigravity la sustituyó por la
de vouchers y reportó `[]`. La consulta original devolvía una fila: la orden
575, con el descuento calculado al 50% siendo el socio un Emprendedor del 40%.

**Solución:** `descuento_cent = subtotal_cent − total_cent`. Una resta, no un
porcentaje aplicado por segunda vez.

**Regla nueva:** si una instrucción pide una consulta concreta, se corre esa.
No una parecida.

---

## [28 ago] — Corrupción número diez, y esta vez tocó package.json

**Tipo:** incidente

**Qué pasó:** tras la TAREA-03C, 50 archivos quedaron truncados: 728 líneas
borradas contra 48 añadidas. `package.json` terminaba en `"@test` — JSON
inválido, el proyecto no arrancaba. También se cortaron el generador, las
pruebas recién escritas y cuatro instrucciones, incluida la TAREA-02B que aún
no se había ejecutado.

**Y se reportó `git status --short` vacío.** No lo estaba.

**Recuperación:** `git show HEAD:archivo > archivo` para los 50.
`git checkout -- .` falla en esta unidad con "Operation not permitted".

**Los commits estaban limpios, como las diez veces anteriores.**

---

## [28 ago] — Los seeds que reaparecían con otro nombre

**Tipo:** proceso

**Qué pasó:** se pidió borrar `supabase/seed_chunks/` — 45 archivos, 740 KB de
SQL ya ejecutado que se cargaba trozo a trozo por el MCP, lo que costó dos
horas y tres cuentas de tokens.

Borró la carpeta y creó `seed_batches/`, `seed_parts/` y `seed.sql`: 3.6 MB.
Al pedirle que los borrara, los movió a `supabase/migrations/`.

**Ahí era peligroso:** una migración se ejecuta sola al desplegar, y esa hacía
`TRUNCATE` y resembraba 500 socios falsos. Contra la base real habría borrado
los socios de verdad.

**Hicieron falta tres rondas.** Cerró con 5 migraciones estructurales y nada más.

**Lección:** explicar la intención, no solo la orden. Cumplió la letra tres
veces seguidas sin entender el porqué.

---

## [28 ago] — Mi instrucción de activación estaba incompleta

**Tipo:** error propio

**Qué pasó:** escribí `activo = (puntos_personales >= 70)` a secas. Falta la
otra mitad de la regla: **todos los packs cubren la activación del mes de
afiliación** — regla #5 confirmada y respuesta 4.1 de Máximo.

122 Emprendedores, que dan 0 puntos, quedaron marcados como inactivos su mes de
ingreso. Se corrigió en el bloque 0 de la TAREA-04A, exigiendo además que la
orden esté **confirmada**: los 2 Ejecutivos con afiliación pendiente siguen
inactivos, y eso es correcto.

**Lección:** si una regla tiene dos condiciones, se escriben las dos.

---

## [28 ago] — El resumen atribuyó al patrocinio la escala del residual

**Tipo:** error propio

El documento de contexto decía que el patrocinio pagaba 40/20/10/5/3/2/1.
**Eso es la escala del residual.** La de patrocinio es 20/4/3/2/1/0.5/0.3, que
suma 30.8%.

La base y el plan de compensación coincidían entre sí y con la lámina 11 del
deck. **El error era solo del resumen.**

**Lección:** un resumen que pierde un matiz es peor que no resumir.

---

## [28 ago] — La columna se llama beneficiario_id, no socio_id

**Tipo:** error propio, detectado a tiempo

Escribí las consultas de verificación de la TAREA-04A usando
`comision.socio_id`. Al comprobar contra `information_schema` resultó ser
`beneficiario_id`. Se corrigió antes de mandarlo.

**Es exactamente el error que rompió el `schema.sql`** el mismo día: citar una
columna sin comprobar que exista.

---

## [28 ago] — Diagnostiqué un .git corrupto que no lo estaba

**Tipo:** error propio

`fatal: unknown error occurred while reading the configuration files` venía del
montaje de la unidad en el sandbox, no del repositorio. Se mandó un bloque de
trabajo innecesario para reinicializarlo.

Más tarde apareció la causa real de todos esos errores: **el git del sandbox es
2.34.1 y el de Windows es más nuevo**, y escribe formatos de índice y
`commit-graph` que el antiguo no sabe leer.

**Lección:** un error de mi herramienta no es evidencia sobre el entorno del
otro. **El git de la consola de Jack es la fuente fiable.**

---

## [28 ago] — DECISIÓN: los rangos 9 al 16 no bloquean nada

**Tipo:** decisión

Se creyó que la TAREA-04B estaba bloqueada esperando esos ocho rangos.
**Ya estaba resuelto en el plan §5, línea 274:** deben existir marcados como no
definidos y ser configurables desde el panel.

En la base ya están así, con `definido = false`. El motor los salta y nadie
califica a ellos. El día que Máximo mande los números se cargan desde el panel
y funcionan **sin tocar código**.

**Máximo confirmó el 1/09 que aún no los tiene.** No se le insiste.

---

## [28 ago] — DECISIÓN: Cumpleaños y Viajes quedan fuera, y no perjudica

**Tipo:** decisión ratificada

Ya estaban decididos desde antes — plan §8 y §9, y el Bono Viajes está excluido
por escrito en la lista de exclusiones de la cotización.

**Y no perjudica:** el Bono Cumpleaños es un **descuento del 70%**, no una
comisión. El administrador ya puede aplicar descuentos a mano, así que Máximo
puede darlo desde el primer día. Lo único que falta es automatizar la detección
por fecha, y `socio.fecha_nacimiento` ya está guardado.

Para agregarlos después: `comision.tipo` es un `varchar` sin restricción de
valores. Se suman tipos nuevos sin migración.

---

## [28 ago] — El Bono Global estaba completo y el plan decía lo contrario

**Tipo:** documentación

La sección 7 del plan decía "PARCIAL" con cuatro pendientes: conversión,
cortes, forma de reparto y requisito de actividad. **Los cuatro se respondieron
el 26/08 en la respuesta #16** y estaban en `config` desde entonces.

```
   S/. 1.00 por punto · Ene–Jun y Jul–Dic · proporcional · activo los 6 meses
```

Corregido. **Es el mismo error ya anotado: la ley es lo primero que se
actualiza.**

---

## [28 ago] — El motor de comisiones, terminado

**Tipo:** hito

Corrido contra 500 socios y tres ciclos:

```
   Patrocinio   S/. 70,616.88     841 comisiones
   Residual     S/. 19,754.10   1,533 comisiones
   Rango        S/.  9,600.00      43 comisiones
   Pagado       S/. 99,970.98   2,417 comisiones
   Retenido     S/. 98,587.60
```

**Bono global: pools calculados, nada repartido.** Ningún semestre está
completo — la red solo tiene junio, julio y agosto. Los dos periodos quedaron
`abierto`, que era exactamente lo pedido.

**17 comprobaciones contra Postgres, todas en cero.** La más valiosa: recalcular
los puntos grupales de las 1,503 filas desde `red_ancestro`, sin usar nada del
motor. Coincidieron todas.

---

## [1 sep] — Reordenamiento completo de carpetas

**Tipo:** mantenimiento

**Qué se hizo:**

```
   DOCUMENTACION-ANTIGRAVITY de la raíz    archivada — los 23 archivos
                                           eran copia exacta, comprobado
                                           byte a byte
   7 carpetas de etapa vacías              archivadas
   14 md sueltos en la landing             a 00-INSTRUCCIONES y 01-AUDITORIAS
   9 mockups .dc.html sueltos              a 02-MOCKUPS-DISENO
   ANTIGRAVITY-LEEME.md                    renombrado a AGENTS.md, igual que
                                           en el sistema
   13 README.md nuevos                     uno por carpeta, diciendo qué leer
                                           primero y qué trampa tiene
```

**Los 8 documentos de entrada se redujeron a 4.** Tres se archivaron en
`_historico` y `05-ASI-FUNCIONA` se movió a `01-NEGOCIO`, porque no era un
documento de estado sino la explicación del plan con números.

**Por qué importaba:** ocho documentos diciendo lo mismo con fechas distintas
es la causa directa de que un resumen quede viejo y se tomen decisiones con
datos vencidos. Pasó tres veces el 28/08.

Git registró los 38 movimientos de la landing como **renombrados al 100%**, así
que el historial de cada archivo se conserva.

---

## [1 sep] — Se creó AGENTS.md en los dos proyectos

**Tipo:** proceso

Antigravity reconstruía el proyecto leyendo 50 archivos en cada tarea, porque no
había ningún sitio donde estuviera escrito el estado.

`AGENTS.md` en la raíz de cada proyecto: mapa de carpetas, rutas exactas,
reglas fijas y estado. Media página. **Si crece, deja de servir.**

La regla que más ahorra: **la siembra va por conexión directa a Postgres desde
el script, en una transacción.** No por archivos SQL troceados ni por el MCP.

---

# ═══════════════════════════════════════════════════════════
# 1 — 2 DE SEPTIEMBRE DE 2026
# El backoffice: de cero pantallas conectadas a tres tandas
# ═══════════════════════════════════════════════════════════

## [1 sep] — Descubrimiento: las 5 pantallas "hechas" eran maquetas

**Tipo:** descubrimiento

Al planificar el backoffice se comprobó que `P11PanelSocio`, `P12MiRed`,
`P14MisComisiones`, `P23BandejaConfirmacion` y `P25CierreCiclo` **existían y se
veían bien, pero no tocaban Supabase**: leían de `src/datos-falsos/`.

**Cero pantallas conectadas de las veinte.** El informe de estado las daba por
avanzadas.

**Lección:** una pantalla que muestra números no es una pantalla terminada.
Se verifica de dónde vienen esos números.

---

## [1 sep] — Nadie podía entrar al sistema

**Tipo:** descubrimiento · bloqueante

```
   auth.users        0 usuarios
   socio           501 filas
   socios con login  0
```

Las 47 políticas de seguridad cuelgan de
`fn_current_socio_id() → socio.email = auth.jwt()->>'email'`. **Sin sesión, esa
función devuelve NULL y el socio no ve absolutamente nada.**

Toda la seguridad construida en la TAREA-01 llevaba días sin poder probarse.

**Y `socio.password_hash` es una columna muerta**: la autenticación la hace
Supabase Auth. Queda documentado para que nadie escriba un login a mano contra
esa columna.

---

## [2 sep] — La función de confirmar pagos tenía cuatro errores y un Kit los tapó

**Tipo:** error corregido · **el caso más instructivo del proyecto**

`fn_confirmar_orden_pago` se probó confirmando **una sola orden: la 495, un Kit
Emprendedor con `puntos_total = 0`.** Pasó. Y escondía cuatro fallos:

```
   1 · INSERT en movimiento_puntos.tipo — esa columna se llama origen
       había un IF puntos_total > 0 antes, y el Kit da 0
       con un Ejecutivo (70) o un Gold (150) reventaba

   2 · no fijaba cuenta_residual → quedaba en true por defecto
       las afiliaciones habrían generado bono residual

   3 · activo = true sin mirar los puntos
       una recompra de 6 puntos activaba al socio

   4 · dejaba la orden en 'pagada' y el motor filtra por 'confirmada'
       esas órdenes no habrían entrado nunca al cierre de ciclo
```

**Los cuatro se corrigieron.** El primero es el mismo error que rompió el
`schema.sql` el 28/08: citar una columna sin comprobar que exista.

> **Lección:** un caso de prueba que esquiva la rama peligrosa no prueba nada.
> Hay que probar con una orden de **cada** pack, no con la más cómoda.

---

## [2 sep] — 🔴 Una función de pruebas que podía borrar la empresa entera

**Tipo:** incidente de seguridad · **el más grave del proyecto**

Para limpiar los datos que dejaban las pruebas se creó
`fn_test_limpiar_socios_prueba()`. Quedó así:

```
   SECURITY DEFINER   → se ejecuta saltándose RLS
   anon = EXECUTE     → cualquiera, sin sesión
   sin ningún control de quién la llama
```

Y por dentro:

```sql
DELETE FROM socio  WHERE id > 501;
DELETE FROM orden  WHERE id > 1048;
DELETE FROM auth.users WHERE email NOT IN (los 10 de prueba);
```

**En producción los socios reales tendrán `id > 501`.** Cualquiera con la clave
pública del frontend —que es pública por diseño— podía llamarla y borrar todos
los socios, sus órdenes, sus comisiones, la red genealógica y todos los accesos.

**Se eliminó la función por completo.** La limpieza ahora la hace el propio test,
con seguimiento explícito de los ids que crea.

> ### La lección, y es doble
>
> **1 · Ninguna función que borre datos se crea sin control de quién la llama.**
>
> **2 · Una utilidad de pruebas no se despliega en la base de producción.**
> El `id > 501` no distingue una prueba de un socio real: solo funciona
> mientras la base sea de juguete.
>
> **Y el origen fue una sugerencia mía** — pedí un `afterAll` que limpiara, sin
> especificar cómo. La instrucción incompleta produjo la implementación
> peligrosa.

---

## [2 sep] — El campo `califica` mezclaba dos conceptos

**Tipo:** hallazgo de diseño

ANA, socio 2, ciclo 3: alcanza PLATA con 3,514 puntos computables y 2 frontales
—cumple ambos requisitos— y `califica = false`, bono 0.

**No es un error:** bajó de ORO a PLATA y la regla dice que quien baja no cobra.
Pero el campo `califica` significa a la vez *"alcanzó el rango"* y *"cobra el
bono"*, y en pantalla el socio veía **"Sin Calificación · S/. 0.00"** sin
ninguna explicación.

**Se corrigió en la P-15**, que ahora distingue tres motivos distintos: faltan
puntos, faltan frontales, o bajó de rango.

---

## [2 sep] — Las pruebas dejaron 14 socios dentro de la red

**Tipo:** error corregido

Las pruebas de integración contra la base real crearon 14 socios colgados de
ANA, con 22 órdenes confirmadas, 18 movimientos y 14 activaciones.

**ANA quedó con 14 frontales que no le correspondían** y su volumen grupal
inflado. Las comisiones aún no los incluían, pero el siguiente cálculo de rango
sí lo habría hecho.

**Lección:** las pruebas que escriben en la base limpian lo que crean, con
seguimiento explícito de los ids. No con un borrado por rango de id.

---

## [2 sep] — Corrupciones 12, 13 y 14 en 24 horas

**Tipo:** incidente recurrente

```
   nº12   9 archivos · 214 líneas   P23 con 337 de 651
   nº13   6 archivos · 602 líneas   P11 161/300 · P14 182/312
   nº14   3 archivos · 167 líneas   P15 336/443
```

**Las tres siempre en el archivo más grande recién escrito. Las tres reportadas
como `git status vacío`.**

En la nº14 el corte se llevó dos de los tres mensajes explicativos de la P-15:
al revisar parecían no implementados, y sí lo estaban.

**Los commits siempre estuvieron limpios.** Se restaura con
`git show HEAD:archivo > archivo`.

> **El riesgo real:** si un día no se verifica, la corrupción se commitea y ahí
> sí se pierde trabajo. Por eso Jack corre `git status --short` él mismo al
> cerrar cada tarea.

---

## [2 sep] — Lo que se construyó, en limpio

```
   TAREA-05   autenticación · sesión · 4 redirecciones por estado
              10 usuarios de prueba · las 4 pruebas de aislamiento
   TAREA-06   P-21 · P-22 · P-23 · P-24 · operación del admin
              4 funciones RPC · capa de servicios
   TAREA-06B  las 5 correcciones de fn_confirmar_orden_pago
   TAREA-07   P-11 · P-14 · P-15 · P-19 · el socio ve su dinero
              fn_desglose_comisiones_socio · fn_rango_lineas_socio
```

**182 pruebas unitarias · 22 de recorrido a 390px y escritorio.**

**Y una decisión de arquitectura que salió bien sin estar pedida:** las
pantallas no llaman a Supabase directamente. Todo pasa por
`src/servicios/operacionAdmin.js` y `src/servicios/socio.js`.

---

## 7 de septiembre de 2026

### TAREA-25 verificada contra Postgres

```
   MaxGlobal2026! en la función      0    erradicado
   placehold.co · afiliación         0
   placehold.co · recompra           0
   devuelve password_temporal        sí
   usa gen_random + crypt            sí
   alfabeto  ABCDEFGHJKLMNPQRSTUVWXYZ     sin I, sin O
   508 socios · 2,423 comisiones · S/. 101,939.82   intactos
```

### Dos errores míos, encontrados al verificar

**1 · Escribí una verificación imposible de cumplir.**
La comprobación 4 de TAREA-25 decía *"auth.users = 366, el mismo número de
antes"*. Pero el bloque 5 de esa misma tarea registra socios de verdad para
probar el login. Cada corrida crea cuentas. Ese número no podía quedarse quieto.
Antigravity reportó 369; el valor real al verificar era 378, con 50 creadas ese
día. No fue un dato falseado: fue una verificación mal pensada por mí.

**2 · Resté dos números y saqué una conclusión.**
Mi nota decía *"144 socios del sembrado no tienen cuenta de login"*, sacada de
restar 510 − 366. El conteo real:

```
   auth.users                     378
   basura de pruebas              355   kit_ gold_ toy_ demo_ @ejemplo.test
   ─────────────────────────────────────
   cuentas reales                  23
   socios que PUEDEN entrar        22   de 508
```

Los 366 no eran socios: eran cuentas de prueba acumuladas de decenas de
corridas. **Es el mismo error del `MIN()` del 4/09**: conclusión sacada de una
operación aritmética en vez de un conteo con `COUNT(*) FILTER`.

Efecto real: ninguna cifra certificada se movió. Solo se puede probar login con
22 socios. En producción no aplica — arranca en proyecto limpio, y esto lo
confirma más fuerte.

**Regla reforzada:** una verificación cuyo valor esperado es un número fijo solo
sirve si nada del trabajo puede moverlo. Si las pruebas escriben en esa tabla,
la verificación tiene que ser una *invariante*, no un número.

### Pendiente menor abierto

Las pruebas borran el socio pero dejan su fila en `auth.users`. Limpieza en
`afterAll`, sin urgencia.

### Flujo 9 · upgrade de pack — resuelto sin preguntar a Máximo

Buscando antes de escribirle a Máximo, las cuatro dudas ya estaban contestadas:

```
   Paga completo, no la diferencia   resp. 13.3 · 26/08 · RF-509
   Toma efecto DE INMEDIATO          RF-532 · FLUJO 9
   Suma los puntos del pack nuevo    FLUJO 9
   Baja de pack                      no existe: solo se sube
```

`03-SISTEMA/03-FLUJOS-DEL-SISTEMA.md` línea 332 tiene el flujo completo.
Se escribe TAREA-26 sin consultar nada al cliente.

### TAREA-26 ejecutada y verificada

```
   fn_confirmar_orden_pago cambia socio.pack_id      ✅
   guarda de precio con RAISE EXCEPTION              ✅
   audita como upgrade_pack con el pack anterior     ✅
   0 órdenes existentes pueden explotar con la guarda ✅
   508 · 1,059 · 2,423 · S/. 101,939.82   intactos
```

### Tercer error del mismo tipo — ya es un patrón mío

Las 4 consultas de verificación de TAREA-26 usaban `<el id del upgrade de
prueba>`. Las pruebas limpian sus datos al terminar, así que hoy devuelven
vacío: la orden 1708 no existe y `auditoria` tiene 0 filas `upgrade_pack`.

**Le pedí demostrar algo que su propio trabajo destruye.** Es el mismo defecto
que `auth.users = 366` en TAREA-25.

```
   ❌ Verificación sobre una FILA que las pruebas borran
   ✅ Verificación sobre una INVARIANTE que sobrevive:
        · la función contiene la guarda
        · cero órdenes existentes pueden explotar
        · los conteos certificados no se movieron
```

También pegó `"pack_antes": "3 (Pack Gold)"` cuando `datos_antes->>'pack_id'`
devuelve `"3"`. Adornó la salida en vez de pegarla cruda — mismo defecto que las
capturas descritas en vez de adjuntadas.

### TAREA-27 · el bug del filtro, y la cadena completa

Causa raíz encontrada por Antigravity con la pestaña Network:

```
   400 Bad Request
   42703: column activacion.puntos_grupales does not exist
```

`operacionAdmin.js` pedía una columna que nunca existió en esa tabla.

La cadena que convirtió un typo en dos horas:

```
   1 · se pidió una columna inexistente
   2 · el error no se comprobaba  → data en null
   3 · el fallo se veía IDÉNTICO a "nadie está activo"
   4 · comparé ciclos sembrados (501 filas) con ciclos reales
       (2-3 filas) y leí avería donde había un seed
   5 · casi mandé a "arreglar" fn_ejecutar_cierre_ciclo
```

**Yo tenía el dato y no lo crucé.** Horas antes consulté las columnas de
`activacion` y salieron cinco: `socio_id, ciclo_id, puntos_personales, activo,
calculado_en`. Sin `puntos_grupales`. Lo tuve delante y me fui a perseguir
permisos y RLS.

Lo que sí funcionó: exigir diagnóstico con Network ANTES de tocar. La tarea
listaba dos sospechosos —`useState(4)` y el filtro post-paginación— y **ninguno
era la causa**. Arreglarlos a ciegas habría dejado el filtro igual de vacío.

Verificado al cerrar:

```
   consultas que se tragan el error   0   (eran 19)
   meses escritos a mano              0   (solo formateadores)
   508 · 1,059 · 2,423 · S/. 101,939.82   intactos
   ciclo 6: 2 filas · 2 activos           sin tocar
```

**Regla nueva:** cuando una pantalla muestra un vacío sospechoso, lo primero es
mirar el código de estado de la petición. No la lógica, no los permisos, no la
RLS. El estado HTTP.
birse. La tabla `voucher` está bien
      diseñada y guarda banco, operación, monto y fecha — pero ninguna
      imagen_url apunta a un archivo real. No hay bucket ni input de
      archivo. Sin la imagen no hay respaldo de que un socio pagó.
      [corregido el 4/09: se dijo "1,049 filas con placehold.co" y era
       falso — ver el acta de las 14:30]

   🟡 No existe campo de CCI. La empresa cobra en BCP y BBVA; un socio de
      otro banco necesita CCI para recibir su comisión. Solo hay
      socio.banco y socio.cuenta_bancaria: un campo para dos cosas.

   🟡 Nadie valida la cuenta que el socio escribe en P-18. Un dígito de más
      y la transferencia rebota o cae en otra cuenta.

   🟡 La cabecera del admin no se refresca tras el cierre: sigue mostrando
      el ciclo anterior hasta recargar.

   🟡 Producción debe ir en un proyecto Supabase NUEVO y limpio. Esta base
      tiene 503 socios simulados y S/. 100,261.02 en comisiones de mentira.
      No se borran: `comision` y `wallet_movimiento` son append-only por
      diseño. Se levanta otro proyecto con las mismas migraciones.
```

---

> ## 4 de septiembre, tarde — LA REVISIÓN A FONDO. EL 98% ERA FALSO

Jack pidió revisar toda la documentación y el código antes de escribir ninguna
tarea, *"no quiero malograr nada"*. Tenía razón en pedirlo.

### Seis funcionalidades comprometidas que no están construidas

Contrastando el código contra `02-PROYECTO/03-LINEA-DE-ALCANCE-V1` (26/08):

```
   A1  Bono de rango conectado        1 de los 4 bonos de la cotización
   A2  Subida de la foto del voucher  05-ROLES-Y-PERMISOS línea 125 y 167
   A3  Solicitud de retiro            alcance, agregado nº2
   A4  Detracción sobre S/. 700       alcance, agregado nº3
   A5  Baja con reenganche de red     alcance, agregado nº4
   A6  Venta a cliente final          alcance, agregado nº5
```

**Ninguna estaba en `PENDIENTES` ni en las listas de "fuera de alcance".** No se
decidió diferirlas: se pasaron por alto. Inventario completo en
`05-CONTROL/PLAN-DE-CIERRE-V1.md`.

### Lo más grave: el bono de rango nunca se calcula

```
   src/motor/rango.ts            existe · 17 pruebas verdes · correcto
   src/motor/persistencia.js     importa SOLO patrocinio y residual
   quién llama a rango.ts        únicamente las pruebas
   preview de P-25               no calcula: filtra comision.tipo='rango'
```

Las 43 comisiones de rango de la base las insertó Antigravity con SQL suelto
durante la TAREA-04B. **No quedó código.** Y `fn_ejecutar_cierre_ciclo` no
menciona `rango_ciclo` en sus 3,900 caracteres:

```
   ciclo 1  501 filas rango_ciclo   ← sembrado
   ciclo 2  501 filas               ← sembrado
   ciclo 3  501 filas               ← sembrado
   ciclo 4    0 filas               ← cierre REAL del 4/09
```

### 🔴 El orden dentro del cierre — esto habría roto todo

`fn_ejecutar_cierre_ciclo` hace, en este orden:

```
   3 · UPDATE ciclo → CERRADO
   4 · recorre las comisiones del ciclo → abona a las billeteras
   5 · abre el ciclo siguiente
```

**Si las comisiones de rango se crean DESPUÉS de llamar a esa función, no se
abonan nunca.** Y el trigger `fn_bloquear_ciclo_cerrado` solo protege `orden` y
`movimiento_puntos`, **no `comision`** — así que el insert funcionaría sin dar
error, las comisiones existirían, y nadie cobraría.

> **Fallo silencioso.** Del tipo que aparece tres meses después, cuando un líder
> reclama el bono de rango que nunca le llegó.
>
> **El cálculo del rango va ANTES de llamar al cierre. No dentro, no después.**

### Lo que sí existe y no hay que reconstruir

```
   fn_rango_lineas_socio(socio, ciclo)   devuelve líneas frontales, escala
                                          de rangos, puntos y rango anterior
                                          ✅ funciona aunque no exista fila
                                             de rango_ciclo (probado con el
                                             ciclo 4: devolvió las 7 líneas)
   v_puntos_ciclo · v_frontales_activos
```

### Correcciones a diagnósticos propios del mismo día

```
   ❌ Dije que rango_honorifico_id en NULL era un fallo.
      NO LO ES. fn_rango_lineas_socio calcula el honorífico del historial
      (para Karla devuelve JADE) sin leer esa columna. Está muerta, como
      valor_punto_soles.

   ❌ Dije que el panel del socio mostraba datos de junio como si fueran
      del mes actual. FALSO. El selector de ciclo funciona y los datos por
      ciclo son correctos. Solo arranca en un ciclo cerrado.

   ❌ Dije que no había ningún descuento al pagar al socio. FALSO.
      El alcance compromete el cálculo de detracción sobre S/. 700.
      No revisé el alcance antes de afirmarlo.
```

> **La lección:** tres veces en un día afirmé algo sobre el sistema sin haber
> leído la fuente que ya lo respondía — que es exactamente el error que este
> proyecto tiene documentado como el más repetido. Antes de afirmar, abrir el
> documento.

---

> ## 4 de septiembre, 12:22 — EL BONO DE RANGO SE PAGÓ POR PRIMERA VEZ

**TAREA-12 ejecutada y certificada en vivo contra la base real.** Predicción
escrita antes, verificación contra Postgres después. Exacta en todos los números.

### El escenario montado a mano

```
   1 · Recompra de KARLA (MG00012) · 4 × Coffee Capuccino · 72 pts · S/. 300
       → queda ACTIVA en el ciclo 5

   2 · Afiliación de ROSA VILCAPOMA (MG00504) bajo Karla
       Pack Familiar · S/. 4,000 · 400 pts

   3 · Afiliación de MARTIN CHOQUEHUANCA (MG00505) bajo Karla
       Pack Familiar · S/. 4,000 · 400 pts

   4 · Cierre del ciclo 5
```

**El orden importó y es lección de operación:** primero se confirma la recompra
de Karla, después las afiliaciones. La activación se evalúa **al confirmar el
pago**, no al cierre. Si se invierte, Karla pierde los dos bonos de patrocinio.

### El tope de línea estirada, probado en vivo

```
   MG00504   400 pts en su rama   tope 250   → computa 250
   MG00505   400 pts en su rama   tope 250   → computa 250
   ───────────────────────────────────────────────────────
   computables                                        500
```

Cada rama trajo 400 y el sistema solo contó 250 de cada una — el 50% de los 500
que exige Jade. **Sin ese tope Karla habría calificado con una sola pierna**,
que es exactamente lo que la regla evita.

### El resultado, verificado contra Postgres

```
   comisión 2509  patrocinio  S/. 800.00  → abono 468 → saldo S/. 1,040.00
   comisión 2510  patrocinio  S/. 800.00  → abono 469 → saldo S/. 1,840.00
   comisión 2511  RANGO       S/.  50.00  → abono 470 → saldo S/. 1,890.00
```

```
   rango_ciclo del ciclo 5          505 filas   ← todos, no solo los que cobran
   califican                        1 · KARLA · JADE
   rangos no definidos asignados    0
   comisiones de rango SIN abono    0   ✅ LA VERIFICACIÓN QUE IMPORTABA
   ciclos abiertos                  1 (ciclo 6, noviembre)
```

Karla pasó de `SIN RANGO` a **`RANGO VIGENTE: JADE`** y su saldo de S/. 240.00 a
S/. 1,890.00. La cadena de saldo corrido cuadra sol a sol.

### Sobre el reporte de Antigravity

En su primer reporte corrió la consulta crítica sobre el **ciclo 3**, cerrado el
2/09 — datos del sembrado, anteriores a su propio código. **No probaba nada.**
La base estaba intacta: mismos 43 bonos de rango, `rango_ciclo` del ciclo 4 en
cero, última comisión 2503.

*Cumple la letra, no la intención*, otra vez. La instrucción decía "el ciclo
cerrado" refiriéndose al cerrado **por el código nuevo**.

Pero cuando se le pidió el archivo de pruebas completo, **entregó algo mejor de
lo pedido**: la prueba 7 invierte el orden a propósito y demuestra que la
comisión queda huérfana. Demostrar el fallo que se previene vale más que
demostrar que no ocurre. Eso no se le había pedido.

### Confirmado: el hallazgo B5

En los ciclos 3 y 5 —ambos cerrados— el panel muestra los puntos correctos.
**Solo el ciclo ABIERTO muestra ceros**, porque `socio.js:224-226` lee la fila
de `rango_ciclo`, que no existe hasta el cierre.

> Durante todo el mes el socio ve 0 grupales, 0 computables y "Sin Rango"
> aunque su red esté vendiendo. En un MLM eso es grave: lo que empuja a un
> líder los últimos días del mes es ver el contador subir.
>
> **La solución ya existe:** `fn_rango_lineas_socio` lo calcula en vivo sin
> necesitar la fila. Ciclo abierto → cálculo en vivo. Ciclo cerrado → la fila
> guardada, **sin recalcular**, porque debe mostrar lo que se pagó.

---

> ## 4 de septiembre, 14:30 — ACUSÉ A ANTIGRAVITY DE ALGO QUE NO HIZO

**TAREA-13 y TAREA-14 ejecutadas y verificadas.** Ambas correctas. Pero al
revisar la 14 afirmé que Antigravity había **reescrito 1,048 vouchers
históricos** hacia un dominio inventado, violando el "no se toca". Jack pidió
verificar antes de mandar la corrección. **Menos mal.**

### La evidencia que lo desmiente

```
   voucher.id  orden_id  imagen_url                subido_en
   1048        1048      .../vou-1048.jpg          2026-08-20
   1047        1047      .../vou-1047.jpg          2026-07-20
   1046        1046      .../vou-1046.jpg          2026-08-20
```

`voucher.id` = `orden_id` = el número del archivo, con fechas de junio, julio y
agosto. **Es data del sembrado, generada hace meses.** Antigravity no tocó nada.

### De dónde salió mi error

Consulté `MIN(imagen_url)`. Devolvió el de `placehold.co` —porque "p" va antes
que "s" alfabéticamente— y **asumí que era representativo de las 1,049 filas**.
Nunca conté. Había **UNA sola** con placehold; las otras 1,048 siempre
apuntaron al dominio inventado del sembrado.

Y ese error lo propagué a la TAREA-14, al PLAN-DE-CIERRE y a esta bitácora.

> **La lección:** `MIN()` no es una muestra. Para saber cuántos hay de cada cosa
> se cuenta con `COUNT(*) FILTER (WHERE ...)`. Mirar un ejemplo y generalizar es
> el mismo error que leer un resumen en vez de la fuente — el que este proyecto
> tiene documentado como el más repetido.

### Lo que SÍ pasó en la TAREA-14

```
   1370 · ORD-2026-009991 · afiliación S/. 1,200 · MG00002
   estado POR CONFIRMAR · ciclo 6, abierto
```

**Una sola orden de prueba colgada.** Su `afterAll` limpió las demás y esa se le
escapó. Le va a aparecer a Máximo en la bandeja como una afiliación fantasma.
Es el ERROR 3 repitiéndose (la orden 1204 huérfana), pero de tamaño chico.

### 🔴 Hallazgo nuevo: la tabla `auditoria` está VACÍA

```
   SELECT COUNT(*) FROM auditoria  →  0
```

Existe la tabla, existe la pantalla **P-29 Auditoría**, y **nadie escribe una
sola fila**. Se descubrió justamente al intentar usarla para probar quién había
cambiado los vouchers — y no sirvió, porque no hay nada.

> **Consecuencia:** hoy no hay forma de saber quién confirmó un pago, quién
> cerró un ciclo o quién cambió un porcentaje del plan. En un sistema que
> reparte dinero entre 500 personas, eso es lo primero que se pide cuando hay
> una disputa.

Va al plan como **C4**.

---

> ## 4 de septiembre, 14:45 — SALIÓ PLATA DE UNA BILLETERA POR PRIMERA VEZ

**TAREA-15 ejecutada y certificada.** El flujo de retiros está completo: el socio
pide, Máximo aprueba o rechaza, y **la billetera se descuenta de verdad**.

### La cadena de saldo de Karla, recalculada de forma independiente

No se le creyeron los números: se recalculó cada delta con `LAG` sobre la tabla.

```
   id   tipo     concepto                      monto    saldo    delta = monto
   467  abono    Bono de patrocinio, ciclo 4   24000    24000    ✅
   468  abono    Bono de patrocinio, ciclo 5   80000   104000    ✅
   469  abono    Bono de patrocinio, ciclo 5   80000   184000    ✅
   470  abono    Bono de rango, ciclo 5         5000   189000    ✅
   471  retiro   Retiro aprobado              −10000   179000    ✅
```

```
   v_wallet_saldo(12)                 179000
   último saldo_despues_cent          179000   ← coinciden
   solicitudes aprobadas sin débito        0
```

### Las tres decisiones que protegen el dinero

```
   1 · El débito es una fila con monto_cent NEGATIVO.
       v_wallet_saldo es un SUM(): con el signo invertido,
       aprobar un retiro le SUMARÍA saldo al socio.

   2 · El débito es por el monto SOLICITADO completo, nunca por el
       neto de detracción. La detracción no se la queda la empresa:
       es un depósito al Banco de la Nación a nombre del socio.

   3 · append-only. Anular un retiro es agregar otra fila positiva
       "Reversión de retiro". Nunca un UPDATE ni un DELETE.
```

### La detracción quedó preparada, no inventada

`03-SISTEMA/15-ASI-SE-VE-EL-BACKOFFICE` tiene el porcentaje como pregunta
abierta: *"confirmar con el contador de Máximo"*. Se construyó el mecanismo con
`config.pct_detraccion = null`: si el retiro supera S/. 700 avisa que
corresponde detracción y **no calcula un neto inventado**. Cuando llegue el
número, es cambiarlo en P-26.

### Y se limpió la orden fantasma

`ORD-2026-009991` (S/. 1,200, por confirmar en el ciclo abierto) borrada.
Órdenes: 1,055. Pendientes en el ciclo 6: 0.

---

> ## 4 de septiembre, noche — SE CERRÓ EL BLOQUE DE FUNCIONALIDADES

**TAREA-16 y TAREA-17 ejecutadas y certificadas.** Con eso quedan las seis
funcionalidades comprometidas en el alcance del 26/08, más los cinco errores de
pantalla.

### TAREA-16 · venta a cliente final — la simplificó Jack

La primera versión de la tarea agregaba 4 columnas, datos del cliente y dos
claves de configuración. **Jack la redujo a una casilla:**

> *"eso creo que lo solucionaríamos con su cuenta principal de Máximo, o sea a
> él o al admin que vaya como referido y listo, ya no hacemos más movimientos"*

Lo que sobrevivió, porque ya existía:

```
   El referido lo elige el admin          ya funcionaba
   Los datos del cliente van en `envio`   ya tenía destinatario,
                                          teléfono y dirección
   Puntos y residual como una recompra    ya funcionaba
```

Lo único que había que construir era **poner el descuento en 0%**, porque todos
los packs dan 40-50% y sin eso el sistema guardaba **S/. 75 cuando el cliente
pagó S/. 150**. Toda la tarea acabó siendo una línea:

```js
   if (esVentaCliente) return 0;
```

**Verificado:** 4 cafés a cliente S/. 600 · los mismos 4 a un socio Gold
S/. 300 · 72 puntos en los dos casos. Exactamente el doble.

> **La lección para mí:** propuse una solución tres veces más grande que la
> necesaria. Jack la recortó preguntando "¿y con lo que ya hay?". **Antes de
> agregar columnas, mirar qué tabla ya guarda eso.**

### TAREA-17 · baja de socio con reenganche — la más delicada

Regla, ya decidida por Máximo (resp. 14.2, 26/08): *"la descendencia sube un
nivel y se engancha al patrocinador del socio dado de baja"*.

**El terreno, verificado antes de escribir la tarea:**

```
   red_ancestro   tabla de cierre · 3,935 filas · nivel máximo 12
                  se llena con un TRIGGER que solo corre en INSERT
                  → cambiar un patrocinador NO la actualiza
```

**La trampa:** no basta con mover a los hijos directos. Si se da de baja a
Ruth, su nieta Gloria —a la que nadie tocó— tiene toda su cadena de ancestros
apuntando a través de Ruth.

### El recorrido manual, con la foto antes y después

Se armó una cadena de prueba: **Karla → Ruth → Elmer → Gloria**, sin confirmar
los pagos para no generar comisiones imborrables.

```
   GLORIA (MG00508) — la nieta que NADIE tocó

   ANTES                        DESPUÉS de dar de baja a Ruth
     Elmer   nivel 1              Elmer   nivel 1
     Ruth    nivel 2       →      (desapareció)      ✅
     Karla   nivel 3       →      Karla   nivel 2    ✅
     MG00011 nivel 4       →      MG00011 nivel 3    ✅
     MG00001 nivel 14      →      MG00001 nivel 13   ✅
```

**Sus 14 filas de ancestros se recalcularon una por una.**

```
   Ruth                       estado 'baja'      ✅
   Elmer cuelga de            MG00012 (Karla)    ✅
   filas con Ruth de ancestro        0           ✅
   incoherencias en TODA la tabla    0           ✅ recalculado aparte
   auditorías de baja                2           ✅
```

### Y arregló algo que no se le pidió

La tabla `auditoria` llevaba **0 filas desde que existe el proyecto** — era el
punto C4 del plan. La función de baja escribe su registro con la estructura
anterior completa en `datos_antes`. Ahora tiene 2 filas.

```json
   accion  "baja_con_reenganche"
   {
     "frontales_movidos": 2,
     "descendientes_reconstruidos": 3,   ← más que los frontales:
     "filas_ancestro_insertadas": 7        bajó hasta el nieto
   }
```

### Estado tras la jornada

```
   socios              508   (505 + 3 de prueba)
   órdenes           1,058   (8 por confirmar, 3 son de prueba)
   comisiones        2,422   ·   S/. 101,911.02   ← sin cambios
   red_ancestro      3,960 filas · 0 incoherencias
   wallet              471   · saldo de Karla S/. 1,790.00
   auditoria             2   ← ya no está vacía
```

**Ninguna cifra de dinero se movió en las dos tareas.**

---

> ## 4 de septiembre, noche — CCI Y VALIDACIÓN BANCARIA (TAREA-18)

**Puntos C1 y C2 cerrados.** Van juntos porque son el mismo problema: que la
comisión llegue a la cuenta correcta.

### El dato que se verificó antes de escribir la tarea

**El CCI peruano tiene exactamente 20 dígitos:** entidad(3) + oficina(3) +
cuenta(12) + control(2). Ejemplo: `011-366-000100032542-21`.

**El número de cuenta varía por banco.** Por eso la validación se partió en dos:

```
   CCI              ESTRICTA   20 dígitos exactos, solo números
   Número de cuenta SUAVE      sin letras, entre 8 y 25 caracteres
```

> **Una validación que rechaza cuentas buenas es peor que no validar:** el socio
> no puede guardar sus datos y no cobra. Por eso no se inventaron largos por
> banco.

### Y el aviso de banco es AVISO, nunca bloqueo

Los 3 primeros dígitos del CCI identifican la entidad. Si no coinciden con el
banco elegido se muestra un aviso **y se deja guardar igual**. La tabla de
códigos vive en `config.codigos_banco_cci`, no en el código, porque no está
verificada al 100% y un código mal puesto no puede impedirle cobrar a nadie.

### 🔴 El near-miss que Antigravity detectó solo

```
   f28dd47  fix(admin): preservar 37 parametros del plan en
            obtenerConfiguracionPlan excluyendo codigos_banco_cci
```

Agregar una clave JSON a `config` iba a interferir con P-26, la pantalla que
edita los parámetros del plan. **Lo detectó y lo arregló antes de entregar.**

Verificado después: `config` tiene 38 claves (37 del plan + la nueva) y los
valores críticos siguen intactos:

```
   linea_estirada_pct      50      ← el que sostiene TODOS los bonos de rango
   compresion_activa       false
   dias_hasta_pago         3
   valor_punto_comision    1.00
   umbral_detraccion_cent  70000
   pct_detraccion          null    ← esperando al contador de Máximo
```

> Si `linea_estirada_pct` se hubiera perdido, los rangos empezaban a pagarse de
> más **sin dar ningún error**. Es el mismo tipo de fallo mudo que el orden del
> cierre en la TAREA-12.

### Estado

```
   508 socios · 2,422 comisiones · S/. 101,911.02
   red_ancestro 3,960 filas · 0 incoherencias
   290 pruebas en verde · git limpio
   cci: columna creada, los 508 socios en null
```

---

## 8 de septiembre de 2026

### QA de las 23 pantallas · TAREA-31 y TAREA-32

Barrido completo con Antigravity reportando **sin conocer los números
esperados** — se los oculté a propósito, porque tres veces antes reportó lo que
esperaba ver en vez de lo que había. Funcionó: entregó cifras literales.

```
   23 pantallas · 4 fallas reales · 4 corregidas
```

```
   1 · P-25 no decía quién quedaba fuera del pago ni por qué
   2 · P-12 contaba 508 descendientes (se contaba a sí mismo)
   3 · P-26 mostraba 38 de 39 claves sin explicar
   4 · pack_codigo sin validar contra la tabla `pack`
```

### Dos sospechas de Jack, descartadas con evidencia

```
   "28 soles de patrocinio"   la pantalla dice "Residual" y muestra
                              BONO PATROCINIO: S/. 0.00 al lado

   "el Excel sale vacío"      salió vacío CORRECTAMENTE: Karla ganó
                              S/. 28.80, el mínimo son S/. 100 y no
                              tiene CCI. El filtro aptoParaPago hizo
                              su trabajo. Lo que faltaba era DECIRLO.
```

### El hallazgo más peligroso, y era invisible

```js
   'kit-emprendedor'.includes('emprendedor')  →  true
```

El selector de packs hacía coincidencia **parcial**. Acertaba de casualidad, y
cuando no acertaba caía en silencio al primer pack de la lista.

> Un slug mal escrito podía asignarle a alguien el Kit de S/. 120 habiendo
> pagado el Empresarial de S/. 8,000, sin un solo error en pantalla.

Corregido con mapeo formal + validación contra la tabla `pack`. Verificado por
marcas de tiempo: el último `PRO` entró a las 20:02, y después de las 20:33
solo entran códigos válidos.

### Mis errores del día — tres, todos del mismo tipo

```
   1 · Busqué orden.estado='pendiente'
       El valor real es 'por_confirmar'. Reporté 0 donde había 8.

   2 · Busqué solicitud.estado='pendiente'
       El valor real es 'nueva'. Reporté 0 donde había 127.

   3 · Para hallar la clave que P-26 oculta, ordené las 39
       claves alfabéticamente y tomé 38. Eso devuelve la última
       del abecedario, no la oculta. Dije `valor_punto_soles`;
       la real era `codigos_banco_cci`, que él encontró leyendo
       el código.
```

**Los tres son el mismo error: inventar el nombre de un valor en vez de
comprobarlo.** Igual que `activacion.puntos_grupales` ayer. Y los tres números
equivocados llegaron a `QA-PANTALLA-POR-PANTALLA.md` como si fueran verdad.

```
   🔴 REGLA: antes de filtrar por un valor de estado, listar
      primero los valores que existen:
      SELECT estado, COUNT(*) FROM tabla GROUP BY estado
```

---

## 14-15 de septiembre de 2026

### QA en el navegador · TAREA-37

Cuatro partes con Playwright sobre lo desplegado: landing, admin, socio y móvil.

```
   🔴 el "éxito falso" de P-23      →  NO EXISTÍA
   🔴 5 pantallas con useState(3)   →  real · corregido
   🟡 7 órdenes de ciclos cerrados  →  datos sembrados
   🟢 6 px en la cabecera móvil     →  pendiente
```

### El hallazgo más valioso fue un bug que no existía

Antigravity reportó que P-23 mostraba un banner verde ante un error 400. Al
revisar el código, el manejo de errores **era correcto**:

```js
   operacionAdmin.js:217   if (error) throw error;
   P23:244                 catch → muestra el error
```

Se le pidió reproducirlo con marcas de tiempo. Resultado:

```
   t + 353 ms  →  banner ROJO
   "El ciclo 2 está cerrado. No admite nuevos registros."
```

**El éxito falso nunca ocurrió.** Falló el script que redactaba su reporte, que
dio por éxito el cierre del modal.

> Estuvimos a punto de "corregir" código sano. Lo evitó que Jack dijera
> *"no vaya a ser que te estés confundiendo"*.

### Los 5 useState(3): el patrón que no barrí

```
   P-13 · P-14 · P-15 · P-19 · P-28
```

`git log -S` demuestra que nacieron el 02/09 y **nunca se tocaron**. El bug es
original, no lo introdujimos: **el código no cambió, cambió el mundo.** El día
que se escribió, la demo tenía 3 ciclos y el 3 era el actual.

Origen directo: en TAREA-27 encontré `useState(4)` en P-27, lo arreglé, y pedí
barrer los *meses* escritos a mano — **no los ciclos**. Cinco pantallas se
quedaron rotas doce días por una instrucción incompleta mía.

### Las 6 pruebas con conteos fijos

Al correr la suite completa fallaron 6 por `toBe(509)`, `toBe(23)`, `toBe(507)`.
Antigravity propuso actualizarlos a 510, 24 y 508.

**Se rechazó:** es el mismo defecto que acababa de corregir. Se reescribieron
como invariantes:

```js
   expect(countSocios).toBe(conteoInicialSocios)
   expect(resActivos.total + resInactivos.total).toBe(totalSocios)
   expect(red.totalSocios).toBe(descendientesEsperados)
   expect(conCci.length).toBe(0)
```

Barrido previo: de 192 números fijos en las pruebas, **solo 6 eran frágiles**.
El resto son reglas de negocio (38 claves, 16 rangos, 10 niveles, precios,
porcentajes) y se dejaron intactas.

```
   37/37 suites · 385 pruebas verdes
   La suite ya NO ensucia: las órdenes volvieron de 1,062 a 1,059
```

### Documentación

Se creó `05-CONTROL/LECCIONES-Y-PATRONES.md` con los seis patrones de error,
cada uno con su caso real y su fecha, y se enlazó desde
`00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md`, que llevaba parado en la TAREA-13.

---

## 15 de septiembre de 2026 · TAREA-36 · EL ENSAYO COMPLETO

Ejecutado en `max-global-ENSAYO` (`uesyashbodhvlqchuokj`), un proyecto creado
desde cero con el instalador. **Estas cifras las verifiqué yo contra esa base
antes de borrarla.**

### Red del ensayo

```
        ADMIN (MG00001)
          │
        ANA (MG00002) ──┬────────┬────────┐
          │           CARLA    DIEGO    ELENA
        BETO            (Ejec)  (Ejec)   (Kit)
          │
        FANNY
```

### Los tres bonos, con los importes exactos

```
   PATROCINIO
     Gold 1,200 · N1 20% = 240.00 · N2 4% = 48.00 · N3 3% = 36.00
     Ejec.  360 · N1 20% =  72.00 · N2 4% = 14.40 · N3 3% = 10.80

   RESIDUAL  (base en PUNTOS, no en soles)
     100 pts → N1 40.00 · N2 20.00 · N3 10.00
     pagado 70.00 · retenido por la empresa 27.00

   RANGO
     Bronce · requisito 1,000 pts · base 1,130 computables · S/. 100.00

   KIT EMPRENDEDOR
     41.7% de 120 = S/. 50.04 al nivel 1, y a nadie más
```

### La línea estirada, probada

```
   Tope = 50% del requisito del rango
   Bronce pide 1,000 → tope por rama 500

   BETO   540 pts  →  computan 500   TOPADO
   DIEGO  310      →  computan 310
   CARLA  270      →  computan 270
   ELENA   50      →  computan  50
   ─────────────────────────────────
   grupales 1,170  ·  computables 1,130
```

### Sin activación no cobra · sin compresión

```
   DIEGO inactivo → su nivel 1 cobró S/. 0.00
   ANA (N2) y ADMIN (N3) SÍ cobraron
   Los S/. 40 del nivel 1 quedaron en la empresa.
   NADIE los heredó.
```

### Lo demás que se probó

```
   ✅ Upgrade acepta subir · rechaza bajar de pack
   ✅ Baja con reenganche: FANNY subió bajo ANA
   ✅ Retiro: rechaza bajo el mínimo · aprueba y debita
   ✅ CSV con los excluidos y su motivo exacto
   ✅ Venta a cliente final al 0% de descuento
   ✅ Producto nuevo con foto del bucket del proyecto NUEVO
   ✅ Reseteo de puntos al abrir ciclo
   ✅ red_ancestro 17 filas · 0 incoherencias
```

### Dos "hallazgos" que NO eran bugs

```
   1 · El Kit paga 50.04 y no 50.00
       Máximo dictó el PORCENTAJE (25/08):
       "yo gano el 41.7%, que sería a 50 soles"
       Y 01-NEGOCIO/01-PLAN-DE-COMPENSACION.md:120 ya lo
       había verificado: "120 × 0.417 = 50.04 ✅"
       QA-PLAN-DE-NEGOCIO.md esperaba S/. 50.04.
       El motor pagó exactamente lo documentado.

   2 · El trigger valida pero no normaliza pack_codigo
       La normalización vive en la Edge Function
       registro-afiliacion (mapaPacksLanding).
       El camino real funciona. Antigravity insertó
       directo en la tabla, saltándose la Edge Function:
       probó un camino que la aplicación no usa.
```

```
   🔴 BUGS ENCONTRADOS EN EL ENSAYO: NINGUNO
```

**No queda nada del plan de compensación sin probar en una base instalada
desde cero.**

### Una advertencia sobre el borrado

Antigravity afirmó que estas cifras ya estaban en la bitácora antes de pedir
permiso para borrar el proyecto. **No lo estaban:** `grep` de "1,549.64",
"50.04" y "TAREA-36" devolvía cero coincidencias. Se escribieron aquí antes de
autorizar nada.

> Es el mismo patrón del "banner verde": reportar como hecho algo que no se
> comprobó. Por eso ninguna cifra vale sin verificarla.

---

## 15 de septiembre de 2026 · PRODUCCIÓN Y LAS BARRAS MUERTAS

### Producción existe

```
   xkiwnxoferdfapezcwoq · max-global-produccion · sa-east-1
   25 funciones · 23 tablas · 49 políticas · 39 config
   5 packs · 16 rangos · 8 productos con foto del bucket NUEVO
   1 socio (el admin) · 0 órdenes · 0 comisiones
   ciclo abierto: septiembre 2026, calculado con date_trunc
```

El ensayo se borró. La demo se queda intacta.

### Cuatro hallazgos en un día, todos encontrados MIRANDO PANTALLAS

```
   1 · /kit sin proteger · visible para socios y sin sesión
   2 · falta vercel.json → 404 al recargar cualquier ruta
   3 · 3 barras de progreso muertas desde el 02/09
   4 · meta de activación escrita a mano en 4 sitios
```

### Las barras: nacieron rotas, no se rompieron

```
   BarraProgreso   creado 28/08 con  valor · meta
                   git log -S "porcentaje" → NUNCA lo aceptó

   P13:250 · P15:402 · P15:410
                   nacidas 02/09 pasando `porcentaje`
                   → valor=0, meta=100 por defecto
                   → la barra NUNCA se movía
```

**Invisible durante 13 días porque con 0 puntos "0/100" parece correcto.**
Acertaba por coincidencia, igual que `'kit-emprendedor'.includes('emprendedor')`.

```
   🔴 Las 386 pruebas pasaban con las tres barras muertas.
      Comprueban datos y lógica, no que un componente reciba
      las propiedades correctas.
```

### Mi error del día: 55 falsas alarmas

Escribí un script para buscar propiedades inexistentes en todas las llamadas a
componentes. Devolvió **59 casos**. Estuve a punto de mandar a corregir medio
sistema.

Al verificar: `TarjetaDato` y `EstadoVacio` usan **renombrado de propiedades**
(`icono: Icono`, `mensaje: mensajeProp`) y mi expresión regular no lo entendía.

```
   59 sospechas  →  4 reales (las 3 barras + una Tabla por mirar)
   55 falsas alarmas
```

**Verificar antes de alarmar salvó el día otra vez.**

### La regla que asumo, a petición de Jack

```
   Antes de escribir una tarea de corrección:
   1 · Leer el componente o función que voy a mandar tocar
   2 · VERIFICAR la causa, no deducirla
   3 · Si no puedo verificarla → tarea de DIAGNÓSTICO
   4 · Buscar el patrón completo antes de corregir uno
```

Los cuatro los he roto alguna vez esta semana.

---

## 15 de octubre de 2026 · TAREA-66: SINCRONIZACIÓN DE RANGO EN VIVO Y LÍNEA ESTIRADA

```
   Problema: En P-15 (Mi Rango), Sonia Escobar (MG00007) mostraba "Vigente: Plata" en la barra lateral
   pero "Bronce (Calificando)" en la tarjeta central, topeando a Agape Choqueña en 500 pts.
   Causa: La meta en ciclo abierto se fijaba rígidamente en rango_honorifico + 1 (Jade orden 1 -> Bronce orden 2),
   asumiendo avance de 1 en 1 sin detectar que la líder saltó en vivo a Oro.
   Solución: Evaluación reactiva de rango en vivo de mayor a menor jerarquía en fn_rango_lineas_socio,
   fijando la meta siguiente dinámicamente y aplicando la regla de negocio del MLM: cada rama aporta
   como máximo el 50% de los puntos requeridos por el rango evaluado (LEAST(puntos_rama, tope_linea)).
   Alineación en TypeScript (src/motor/rango.ts), Postgres (fn_rango_lineas_socio y fn_calcular_y_persistir_rangos)
   y componentes visuales P-15. 16 tests unitarios en verde y captura Playwright certificada.
```

---

## 16 de octubre de 2026 · TAREA-67: GUARDAS DEL CIERRE EN POSTGRES (RF-371 Y RF-376)

```
   Problema: Las verificaciones de pedidos pendientes (RF-371) y los techos teóricos máximos
   de comisiones (RF-376) vivían en el frontend (operacionAdmin.js:453 y :736).
   Riesgo: La función PL/pgSQL fn_ejecutar_cierre_ciclo no validaba pedidos por confirmar ni techos,
   dejando el cierre desatendido o directo expuesto a cerrar con pagos pendientes o montos desbordados.
   Solución:
   1. Integración de guardas transaccionales en fn_ejecutar_cierre_ciclo en Postgres con
      parámetro opcional p_forzar para emergencias auditadas.
   2. Blindaje de fn_rango_lineas_socio ante variables de tipo record no instanciadas.
   3. Corrección de fn_calcular_y_persistir_rangos para idempotencia estricta, retorno completo de
      comisiones y preservación de invariantes históricos en ciclos 1 (23 comisiones), 2 (12 comisiones) y 3 (8 comisiones).
   Certificación: 51/51 archivos de prueba en verde (489 tests pasando, 0 fallos), build de Vite exitoso (0 errores)
   y capturas visuales Playwright para P-15 y P-25 archivadas.
```

---

## 16 de octubre de 2026 · TAREA-68: CORRECCIONES DE INTEGRIDAD OPERATIVA, DOMINIO OFICIAL Y SERVICIOS

```
   Problema:
   1. config.url_landing apuntaba a "https://max-global-landing.vercel.app" en DEMO y PRODUCCIÓN,
      provocando que los enlaces de referido en P-16 compartieran URLs de Vercel en vez del dominio oficial.
   2. src/lib/supabaseClient.js tenía fallback silencioso a la base DEMO si faltaban variables de entorno.
   3. P-17 (Mis Pedidos) ejecutaba una consulta suelta directa a Supabase (producto.select) rompiendo la arquitectura por capas.
   4. P-31 pasaba una propiedad huérfana claveId="id" a <Tabla>.
   Solución:
   1. UPDATE en DEMO y PRODUCCIÓN de config.url_landing a "https://maxglobaloficial.com", sincronizado en 06-semilla.sql.
   2. Eliminación de fallbacks a demo en supabaseClient.js (lanza Error explícito si faltan credenciales).
   3. Creación de obtenerMapaFotosProductos en src/servicios/socio.js y desvinculación de Supabase directo en P-17.
   4. Limpieza de claveId en P-31.
   Certificación:
   - 4 tests unitarios dedicados en src/test/tarea68-integridad-operativa.test.js pasando al 100%.
   - Build de Vite limpio en 3.98s.
   - Capturas Playwright archivadas: P-16 con dominio oficial (tarea68-p16-enlace-oficial.png) y P-17 con fotos vía servicios (tarea68-p17-mis-pedidos-servicios.png).
---

## 16 de octubre de 2026 · TAREA-69: AUDITORÍA Y ADAPTABILIDAD RESPONSIVA MÓVIL (390PX)

```
   Problema: El sistema requería certificación formal de usabilidad y ausencia total de
   desbordes horizontales en dispositivos móviles estándar (iPhone 13 / 390x844).
   Auditoría Playwright:
   - 16 pantallas analizadas (Socio y Admin) en viewport 390x844: 0 desbordes horizontales detectados (scrollWidth === 390px).
   Mejoras Implementadas:
   1. Blindaje en src/estilos/armazon.css: agregado visibility: hidden y transition en .armazon-drawer y
      .armazon-admin-sidebar (móvil/tablet) para prevenir 1px de subpixel bleed en Chromium y foco indebido en drawers cerrados.
   2. Ajuste en src/paginas/P25CierreCiclo.jsx: añadido flexWrap: 'wrap' y gap: 'var(--sp-2)' en el contenedor
      de vista previa para permitir un quiebre estético entre título de ciclo y badge de socios activos.
   Certificación:
   - 4 tests unitarios en src/test/tarea69-responsivo-movil.test.jsx (100% aprobados).
   - Script automatizado Playwright: scripts/auditar-movil-390px.mjs ejecutado exitosamente.
   - 16 capturas de pantalla de alta fidelidad archivadas en brain (tarea69-movil-390px-p*.png).
   - Build de Vite limpio en 3.95s sin errores.
---

## 16 de octubre de 2026 · TAREA-70: OPTIMIZACIÓN MÓVIL Y CODE SPLITTING CON REACT.LAZY()

```
   Problema: Todas las pantallas del sistema se importaban de forma síncrona en src/App.jsx,
   generando un bundle JavaScript monolítico de 998.91 kB y activando la advertencia de chunks de Vite (>500 kB).
   Solución:
   1. Implementación de React.lazy() en src/App.jsx para las 26 páginas del sistema.
   2. Función suspender() con fallback a CargandoPantalla integrado en la jerarquía interna de los armazones.
   Resultados:
   - Reducción del chunk principal de 998.91 kB a 496.18 kB (-50.3% en peso directo; 143.63 kB gzip).
   - Eliminación total de la advertencia de chunk size en Vite.
   - Chunks distribuidos por página (Login 6.5 kB, Panel Socio 13.1 kB, etc.) cargados bajo demanda.
   Certificación:
   - 4 tests unitarios en src/test/tarea70-code-splitting.test.jsx (100% aprobados).
   - Script automatizado Playwright: scripts/auditar-code-splitting.mjs verificado en real Chromium.
   - Capturas archivadas: tarea70-code-splitting-login.png, socio.png y admin-cierre.png.
   - Build de producción limpio en 4.29s.
```

---

## 17 de noviembre de 2026 · TAREA-71: REPORTE DE SOCIOS POR RANGO (P-28)

```
   Objetivo: Crear la sección "Socios por rango" en P-28 Reportes Admin para permitir al
   administrador inspeccionar con granularidad total qué socios calificaron a qué rango,
   sus puntos computables, frontales activos y bonos devengados.
   
   Implementación (commit bae2bf1):
   1. Backend (src/servicios/operacionAdmin.js):
      - Función obtenerSociosPorRango(cicloId | 'historico'):
        * Ciclo cerrado: Lee registros persistidos de rango_ciclo (califica = true).
        * Ciclo abierto: Invoca fn_calcular_y_persistir_rangos(p_solo_calculo = true) sin alterar la BD.
        * Histórico: Consulta socios con rango_honorifico_id y consolida el rango más alto.
   2. Frontend (src/paginas/P28Reportes.jsx):
      - Selector de ciclo integrado ("Histórico" + ciclos abiertos/cerrados).
      - Resumen de tarjetas por rango (Jade, Bronce, Plata, etc.).
      - Chips interactivos para filtrar rápidamente por rango específico.
      - Tabla detallada en escritorio y tarjetas responsivas en móvil (390px).
      - Botón de exportación a CSV respetando el filtro activo.
   Certificación:
   - Tests unitarios en src/test/tarea71-socios-por-rango.test.js pasando al 100%.
   - E2E Playwright en e2e/tarea71-socios-por-rango.spec.js verificado en Desktop y Mobile 390px.
   - 8 capturas archivadas en 00-INSTRUCCIONES/capturas-t71/ (1440px y 390px).
```

---

## 18 de noviembre de 2026 · TAREA-72: AUDITORÍA DE T71 CONTRA RF, SDD Y PRODUCCIÓN

```
   Objetivo: Auditoría técnica rigurosa de la TAREA-71 contra los Requisitos Funcionales,
   el SDD oficial y la base de datos de PRODUCCIÓN (xkiwnxoferdfapezcwoq).

   Hallazgos Auditados y Resueltos:
   H1 · ¿Con qué base se probó?
        Confirmado. Producción es xkiwnxoferdfapezcwoq (app.maxglobaloficial.com, ~40 socios reales).
        Las pruebas y capturas de T71 se ejecutaron sobre la base DEMO utlohnidkuvxqppmoevj (638 socios simulados,
        S/ 160,349 recaudados en compras de prueba). En producción el último ciclo cerrado (Ciclo 2 - Octubre 2026)
        cuenta con exactamente 21 socios calificados a Jade (S/. 50.00 c/u).
   H2 · Llave escrita en un test
        Confirmado y Corregido. src/test/tarea71-socios-por-rango.test.js tenía la URL y anon key de DEMO
        en código plano. Se refactorizó con obtenerCredencialesE2E() leyendo dinámicamente de .env.e2e.local.
        Se verificó que la clave era anon (pública de DEMO) y NO service_role (sin riesgo de escalación ni necesidad de rotar).
   H3 · RF-410 filtro por rango en P-27 Gestión de Socios
        Confirmado y Corregido. P-27 carecía de filtro por rango honorífico. Se implementó cargarRangos() en
        src/servicios/operacionAdmin.js, soporte de rangoId en obtenerListaSociosAdmin(), y el selector
        #filtro-rango-socio en src/paginas/P27GestionSocios.jsx junto con el badge de rango en la tabla y modal.
   H4 · RF-433 cumplimiento de reporte de rangos
        Confirmado. Antes de T71 solo existía un conteo agregado. T71/T72 cumplen al 100% con RF-433 y amplían con
        RF-436 (cerrado), RF-437 (en vivo), RF-438 (histórico) y RF-439 (CSV).
   H5 · Ciclo abierto ya calculado
        Confirmado y Blindado. Si un ciclo abierto ya tiene filas en rango_ciclo, obtenerSociosPorRango lee
        directamente de rango_ciclo sin recalcular (igual que un ciclo cerrado), preservando el aviso en vivo.

   Certificación:
   - Tests unitarios de T71/T72: 7/7 tests aprobados en verde.
   - Tests de pantallas (src/test/pantallas.test.jsx): 17/17 aprobados en verde.
   - Build de Vite limpio en 4.71s sin errores.
   - Documentación actualizada: 10-RF-PANEL-ADMIN.md, spec.md y BITACORA.md.
```

---

## 20 de noviembre de 2026 · TAREA-74: MARCAR COMISIÓN COMO ABONADA AL CIERRE (RF-419/421) Y DOCUMENTACIÓN LÍNEA ESTIRADA

```
   Objetivo: Garantizar que fn_ejecutar_cierre_ciclo marque formalmente cada comisión como 'abonada'
   al generar su correspondiente wallet_movimiento (RF-419 / RF-421), auditar el tratamiento de comisiones
   'confirmada' en la interfaz, corregir la documentación de línea estirada aclarando que el tope se aplica
   a CADA línea frontal con el caso real de MG00020, y validar de forma aislada en base DEMO sin alterar producción.

   1. Motor de Cierre (fn_ejecutar_cierre_ciclo):
      - Actualizado supabase/instalador/02-funciones.sql: se agregó UPDATE public.comision SET estado = 'abonada'
        WHERE id = r_com.id inmediatamente después de insertar el movimiento en wallet_movimiento.
      - Las comisiones históricas de Ciclo 1 y Ciclo 2 quedan completamente intactas e inalteradas.
      - Script de despliegue para producción preparado de forma aislada en scripts/tarea74-marcar-comision-abonada-al-cierre.sql
        (entregado para aprobación del usuario sin ejecutar en producción).

   2. Auditoría en Frontend (src/):
      - Se detectó que P14MisComisiones.jsx (líneas 172-176) mostraba la insignia "⏳ Se abona al cierre"
        al evaluar estado === 'confirmada', mientras que con 'abonada' muestra "✅ Ya en tu billetera".
      - socio.js (líneas 118-126) y P19MiBilletera.jsx (líneas 357-374) calculan y muestran el estimado de ciclo
        únicamente con comisiones 'confirmada'.
      - Al marcarse 'abonada' en el cierre, las comisiones pasan a reflejarse inmediatamente como abonadas
        sin persistir engañosamente como pendientes.

   3. Corrección Documental (Línea Estirada):
      - Actualizados 01-PLAN-DE-COMPENSACION.md y 04-COMO-QUEDA-EL-PLAN-EN-EL-SISTEMA.md.
      - Se aclaró la fórmula del motor: Puntos Computables = Σ_línea min(puntos_línea, tope_rango).
      - El tope se aplica a CADA línea de forma independiente.
      - Se documentó el caso real de producción de MG00020 en el cierre de Octubre 2026:
        Línea 1 (1320 pts -> 250), Línea 2 (210 pts -> 210), Línea 3 (140 pts -> 140) = 600 pts computables (Jade).

   4. Certificación y Pruebas:
      - Despliegue de prueba y ejecución exitosa de cierre atómico en base DEMO (utlohnidkuvxqppmoevj):
        24 comisiones acreditadas a billetera por S/. 330.00, todas transicionaron a 'abonada' y 0 quedaron en 'confirmada'.
        Reversión limpia comprobada mediante fn_revertir_cierre_ciclo.
      - Suite de pruebas src/test/tarea74-marcar-comision-abonada.test.js (4/4 aprobados).
      - Suites de cierre y rangos: cierre-ciclo.test.js, cierre-guardas.test.js, tarea71-socios-por-rango.test.js (25/25 aprobados).
```






