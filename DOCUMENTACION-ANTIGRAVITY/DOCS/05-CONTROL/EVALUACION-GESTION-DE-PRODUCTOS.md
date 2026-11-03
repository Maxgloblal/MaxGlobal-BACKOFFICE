# EVALUACIÓN · GESTIÓN DE PRODUCTOS CON FOTOS

**Fecha:** 6 de septiembre de 2026
**Antes de escribir ninguna tarea.** Todo verificado contra Postgres y contra el
código de los dos proyectos.

---

# 1 · EL DIAGNÓSTICO

## 🔴 Nadie puede crear ni editar un producto. Hoy no existe la pantalla.

```
   Pantallas del admin que escriben en `producto`     NINGUNA
   Funciones SQL que escriben en `producto`           NINGUNA
   Los 8 productos entraron con el sembrado y ahí se quedaron
```

**Y el `RF-392` está marcado como hecho y no lo está:**

> `03-SISTEMA/10-RF-PANEL-ADMIN` línea 154
> *"RF-392 · El sistema **debe** permitir editar precio, puntaje y estado de cada
> producto"* — marcado ✅

P-26 no menciona productos en ninguna línea. **Es un requisito dado por
cumplido sin construir**, como pasó con el bono de rango.

## Y el requisito escrito se queda corto

RF-392 solo pide **editar precio, puntaje y estado**. No dice nada de:

```
   ❌ crear un producto nuevo
   ❌ subir su foto
   ❌ descripción, categoría, presentación
   ❌ que aparezca en la landing
```

Lo que pides es más que RF-392: es **gestión completa del catálogo**.

---

# 2 · LOS DOS CATÁLOGOS QUE HOY NO SE HABLAN

## Lo que la LANDING necesita para pintar un producto

```js
   src/config.js · PRODUCTOS[]
     id            'cafe-moringa'          ← es el slug de la URL
     nombre        'Coffee Capuccino'
     descripcion   texto largo
     precioPublico 150
     puntos        18
     categoria     'Salud y Nutrición'     ← alimenta el filtro del catálogo
     presentacion  'Caja 20 sobres de 18 g'
     imagen        '/images/productos/cafe-moringa.webp'
     activo        true
```

## Lo que la BASE tiene hoy

```
   id · codigo · nombre · descripcion · imagen_url
   precio_lista_cent · puntos · descuento_pct · activo · orden · creado_en
```

## El cruce

| Campo | Landing | Base | Situación |
|---|---|---|---|
| slug para la URL | `cafe-moringa` | `codigo` = `CAFE` | 🔴 **falta columna** |
| nombre | `Coffee Capuccino` | `Café` | 🔴 **son distintos** |
| descripción | texto largo | `NULL` en los 8 | 🟡 hay que poblar |
| precio público | 150 | `15000` cent | ✅ cuadra |
| puntos | 18 | 18 | ✅ cuadra |
| categoría | `Salud y Nutrición` | — | 🔴 **falta columna** |
| presentación | `Caja 20 sobres` | — | 🔴 **falta columna** |
| imagen | `.webp` local | `NULL` en los 8 | 🔴 **falta todo** |
| activo · orden | ✅ | ✅ | ✅ cuadra |

**Precios y puntos son lo único que ya coincide.** Todo lo que se ve en pantalla
vive solo en `config.js`.

## Las fotos

```
   9 archivos .webp en la landing, en public/images/productos/
   0 imágenes en Supabase Storage
   imagen_url NULL en los 8 productos
```

## Una columna muerta que conviene aclarar

```
   producto.descuento_pct   existe · NULL en los 8 · NADIE la usa
```

El descuento sale del **pack del socio** (`descuento_recompra_pct`, 40-50%), no
del producto. Esa columna es peso muerto, como `valor_punto_soles`.

> **Hay que decidir:** o se borra, o se usa para permitir una oferta por
> producto. Dejarla ahí sin usar es cómo alguien la llena algún día y nadie
> entiende por qué cambió un precio.

---

# 3 · EL PROBLEMA DE FONDO: LA LANDING ES ESTÁTICA

```
   scripts/prerender.mjs  →  import { PRODUCTOS } from '../src/config.js'
```

Los 17 HTML se generan **en el build**, con los datos de `config.js` incrustados.
Eso es lo que hace que WhatsApp y Google lean bien cada ficha.

**Si Máximo cambia un precio en el admin, la web pública no se entera.** Hoy hay
dos fuentes de verdad para el mismo precio, y eso ya lo vimos con las cuentas
bancarias: termina en una discusión con un cliente.

---

# 4 · LAS TRES DECISIONES DE ARQUITECTURA

## Decisión A · ¿Dónde vive el catálogo?

| | Cómo | Consecuencia |
|---|---|---|
| **A1** | Sigue en `config.js`, Máximo pide cambios a Jack | 🔴 no resuelve nada |
| **A2** | Vive en Supabase · la landing lee **en RUNTIME** | 🔴 rompe el prerenderizado y el SEO |
| **A3 ⭐** | Vive en Supabase · la landing lee **en BUILD** | ✅ una sola fuente, SEO intacto |

**Recomendado: A3.** La base manda, el sitio sigue siendo estático.

## Decisión B · ¿Dónde viven las fotos?

| | Cómo | Consecuencia |
|---|---|---|
| **B1** | Archivos en el repo, como hoy | 🔴 subir una foto = tocar código |
| **B2 ⭐** | Bucket **público** de Supabase Storage | ✅ Máximo sube desde el admin |
| **B3** | Bucket público + copiarlas al repo en el build | ✅ más rápido · 🟡 más complejo |

**Recomendado: B2.**

> 🔴 **Este bucket es PÚBLICO, al revés que el de vouchers.** Un voucher lleva
> datos bancarios de un tercero. Una foto de producto está hecha para que la vea
> todo el mundo, y la landing tiene que poder mostrarla sin pedir permiso.

## Decisión C · ¿Cómo se entera la web de un cambio?

| | Cómo | Consecuencia |
|---|---|---|
| **C1** | Jack reconstruye a mano | 🔴 Máximo depende de ti para todo |
| **C2 ⭐** | Un botón "Publicar en la web" que dispara un Deploy Hook de Vercel | ✅ Máximo publica solo, en 2 minutos |
| **C3** | Rebuild automático en cada guardado | 🔴 20 cambios = 20 builds |

**Recomendado: C2.** Máximo edita lo que quiera y cuando termina pulsa
*"Publicar cambios en la web"*. La pantalla le avisa que hay cambios sin
publicar.

---

# 5 · EL PLAN, EN CUATRO FASES

## Fase 1 · La base al día

```
   ALTER TABLE producto
     ADD COLUMN slug         varchar UNIQUE,
     ADD COLUMN categoria    varchar,
     ADD COLUMN presentacion varchar;

   Y poblar los 8 productos con lo que YA está en config.js:
     slug · categoria · presentacion · descripcion · nombre correcto
```

> 🔴 **El nombre de la base está mal en al menos dos:** dice `Café` y
> `Colágeno`, y la web muestra `Coffee Capuccino` y `Colágeno Aeterna`. La web
> tiene el nombre comercial bueno. **Se corrige la base, no la web.**

**Tamaño:** chico. Es una migración y un script de datos.

## Fase 2 · El bucket y la subida

```
   Bucket `productos` · PÚBLICO · 2 MB · jpeg/png/webp
   Políticas:  lectura pública · escritura solo admin · sin borrado

   Subir las 9 imágenes que ya existen y llenar imagen_url
```

**Tamaño:** chico. El patrón de subida ya está resuelto en la TAREA-14.

## Fase 3 · La pantalla P-32 · Gestión de productos

```
   Lista con foto, nombre, precio, puntos, categoría, activo y orden

   Crear producto      código · slug · nombre · descripción
                       categoría · presentación · precio · puntos
                       foto · orden

   Editar              lo mismo
   Activar/desactivar  en vez de borrar
   Reordenar           lo que se ve primero en la web
```

```
   🔴 NUNCA se borra un producto. Se desactiva.
      Hay órdenes históricas que lo referencian. Borrarlo
      rompería el historial de compras y de comisiones.

   🔴 Cambiar el precio o los puntos NO altera órdenes pasadas.
      orden_detalle guarda precio_lista_cent y puntos_unitario
      de la venta. Eso ya funciona así y no se toca.

   🔴 Todo cambio se audita. El precio es plata.
```

**Tamaño:** mediano. Es la pantalla más grande de las cuatro fases.

## Fase 4 · La landing lee de la base

```
   1 · prerender.mjs deja de importar config.js y consulta Supabase
       con la clave anon (la tabla producto ya es de lectura pública)

   2 · Si la consulta falla, el build FALLA.
       Nunca se publica un catálogo a medias.

   3 · Botón "Publicar cambios en la web" en P-32
       → dispara el Deploy Hook de Vercel
       → aviso de "hay N cambios sin publicar"
```

**Tamaño:** mediano. Toca el script que ya está certificado, así que va con
cuidado y con su prueba de que los 17 HTML siguen saliendo.

---

# 6 · LO QUE HAY QUE DECIDIR ANTES DE EMPEZAR

```
   1 · ¿El descuento sigue siendo por PACK, o se permite una
       oferta por producto?
       → si es por pack: se borra producto.descuento_pct
       → si se quiere oferta: se usa esa columna y hay que
         definir cómo convive con el descuento del pack

   2 · ¿Máximo puede cambiar el PRECIO PÚBLICO de un producto?
       → es lo que ve el cliente en la web y lo que paga
       → cambiarlo afecta el margen, no las comisiones
         (las comisiones van por puntos, no por precio)

   3 · ¿Máximo puede cambiar los PUNTOS de un producto?
       🔴 ESTO SÍ MUEVE COMISIONES. Los puntos son la base del
          residual: 1 punto = S/. 1.00 de base.
          Subir un producto de 18 a 30 puntos sube lo que cobra
          toda la red en cada recompra.
       → mi recomendación: que pueda, pero con una advertencia
         explícita en pantalla, como la que ya existe para el
         valor del punto (RF-400)
```

---

# 7 · POR QUÉ ESTO DESBLOQUEA MÁS DE LO QUE PARECE

```
   Hoy   Máximo quiere agregar un producto  →  te escribe a ti
                                                tú editas config.js
                                                haces build y deploy

   Con esto   entra al panel, lo crea con su foto, pulsa publicar
```

Y de paso resuelve tres cosas que ya estaban en el plan:

```
   · El catálogo de la landing pasa a leer de la base (era D3)
   · Se acaba la doble fuente de verdad de los precios
   · imagen_url deja de estar en NULL en los 8 productos
```

---

# 8 · ORDEN RECOMENDADO

```
   Fase 1  →  Fase 2  →  Fase 3  →  Fase 4
```

Las fases 1 y 2 se pueden mandar juntas: son datos y un bucket, sin pantalla.
La 3 es la que Máximo va a usar. La 4 es la que conecta con la web pública y va
al final, cuando ya haya algo que publicar.

**Ninguna toca el motor de comisiones, el cierre, los retiros ni la red.**
