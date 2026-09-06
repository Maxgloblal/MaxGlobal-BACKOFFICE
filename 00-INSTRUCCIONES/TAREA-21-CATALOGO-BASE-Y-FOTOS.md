# TAREA-21 · EL CATÁLOGO EN LA BASE Y SUS FOTOS

**Para:** Antigravity
**Escrita:** 6 de septiembre de 2026
**Fases 1 y 2 de `05-CONTROL/EVALUACION-GESTION-DE-PRODUCTOS.md`.**

> **Esta tarea NO construye pantalla.** Deja la base y el almacenamiento listos
> para que la TAREA-22 construya la gestión de productos. Son datos y un bucket.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "const fs=require('fs'),p=require('path');(function w(d){for(const f of fs.readdirSync(d)){const q=p.join(d,f);if(fs.statSync(q).isDirectory())w(q);else{const b=fs.readFileSync(q);if(b.includes(0))console.log('NULL:',q)}}})('src')"
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# EL PROBLEMA

Hoy **nadie puede crear ni editar un producto**. Ni una pantalla, ni una función
SQL escribe en `producto`. Los 8 que hay entraron con el sembrado.

Y hay dos catálogos que no se hablan:

```
   La BASE tiene     codigo · nombre · precio · puntos · activo · orden
   La LANDING usa    slug · nombre · descripcion · precio · puntos
                     categoria · presentacion · imagen · activo
```

```
   slug          NO existe en la base   🔴
   categoria     NO existe en la base   🔴
   presentacion  NO existe en la base   🔴
   descripcion   existe pero NULL en los 8
   imagen_url    existe pero NULL en los 8
   nombre        🔴 SON DISTINTOS: la base dice "Café",
                    la web "Coffee Capuccino"
```

---

# LO QUE YA VERIFIQUÉ — no lo averigües otra vez

**Todo comprobado contra Postgres y contra el código el 6/09.**

```
   ✅ orden_detalle guarda SU PROPIA copia de precio_lista_cent y
      puntos_unitario → cambiar un producto NO reescribe el histórico

   ✅ FK orden_detalle.producto_id → producto.id
      Postgres NO deja borrar un producto con ventas

   ✅ Las políticas RLS ya existen y bastan:
        producto_admin_all      ALL     fn_is_admin()
        producto_select_public  SELECT  público
      NO hay que crear ninguna política nueva

   ✅ operacionAdmin.js y socio.js leen con select('*')
      → agregar columnas no rompe nada

   ✅ El backoffice solo usa 5 campos del producto:
        id · codigo · nombre · precio_lista_cent · puntos
      Ninguno de los nuevos

   ✅ Las órdenes de PACK no tienen líneas de detalle
      puntos_total = pack.puntos_rango
      → cambiar los puntos de un producto NO afecta los packs

   ✅ CHECK activos:  precio_lista_cent > 0  ·  puntos >= 0
   ✅ UNIQUE en codigo
```

---

# BLOQUE 1 · REGENERAR EL GUARDIÁN — VA PRIMERO

```
   scripts/schema-columnas.json
```

Ese archivo es la lista de columnas válidas que usa
`src/test/guardian-campos.test.js`, creado en la TAREA-13.

> 🔴 **Si agregas las columnas sin regenerarlo, el guardián marca el código
> nuevo como inválido y la suite se cae.** Por eso este bloque va primero: se
> deja el script listo para regenerarlo al final del bloque 2.

Comprueba que el script de generación exista y funcione. Si no existe, créalo:
lee `information_schema.columns` de las 22 tablas y escribe el JSON.

**Commit.**

---

# BLOQUE 2 · LA MIGRACIÓN

```sql
   ALTER TABLE producto
     ADD COLUMN slug          varchar,
     ADD COLUMN categoria     varchar,
     ADD COLUMN presentacion  varchar;

   -- después de poblar (bloque 3):
   ALTER TABLE producto ADD CONSTRAINT producto_slug_key UNIQUE (slug);
```

```
   🔴 El UNIQUE del slug se agrega DESPUÉS de poblar, no antes.
      Si se agrega antes, los 8 productos con slug NULL... en Postgres
      varios NULL no chocan, pero si algo sale a medias quedas con
      duplicados imposibles de arreglar. Primero se puebla, después
      se cierra.

   🔴 Dos productos con el mismo slug = una URL que pisa a la otra
      en la web. Por eso es UNIQUE.
```

## Y se borra la columna muerta

```sql
   ALTER TABLE producto DROP COLUMN descuento_pct;
```

**Verificado: nadie la lee.** El descuento del socio sale del pack
(`descuento_recompra_pct`), nunca del producto. Dejarla ahí es cómo alguien la
llena algún día y aparece un cuarto precio que nadie sabe de dónde salió.

**Commit.**

---

# BLOQUE 3 · POBLAR LOS 8 PRODUCTOS

Los datos buenos están en `SITIO WEB 06 PAGINAS LANDINGS/src/config.js`, en
`PRODUCTOS[]`. **De ahí se copian, no se inventan.**

| codigo | slug | nombre correcto | categoría |
|---|---|---|---|
| CAFE | `cafe-moringa` | **Coffee Capuccino** | Salud y Nutrición |
| COLAGENO | `colageno-hidrolizado` | **Colágeno Aeterna** | Salud y Nutrición |
| AC-MORINGA | `aceite-moringa` | Aceite de Moringa | Cuidado Personal |
| ESPLENDOR | `esplendor` | *(el de config.js)* | Cuidado Personal |
| AC-OREGANO | `aceite-oregano` | Aceite de Orégano | Salud y Nutrición |
| CAP-MORINGA | `capsulas-moringa` | Cápsulas de Moringa | Salud y Nutrición |
| HAR-MORINGA | `harina-moringa` | Moringa en Polvo | Salud y Nutrición |
| DALBA | `perfume-dalba` | Perfume Dalba | Perfumería |

> 🔴 **El nombre de la base está mal en al menos dos.** Dice `Café` y `Colágeno`;
> la web muestra `Coffee Capuccino` y `Colágeno Aeterna`. **La web tiene el
> nombre comercial bueno. Se corrige la base, no la web.**
>
> Copia el nombre, la descripción, la categoría y la presentación **tal cual
> están en `config.js`**. No los redactes de nuevo.

```
   🔴 NO se tocan precio_lista_cent ni puntos.
      Ya cuadran con la web y están certificados.
```

**Commit.**

---

# BLOQUE 4 · EL BUCKET DE FOTOS

```
   nombre              productos
   public              TRUE          ← 🔴 al revés que `vouchers`
   file_size_limit     2 MB
   allowed_mime_types  image/jpeg · image/png · image/webp
```

## 🔴 Por qué este bucket SÍ es público

```
   vouchers   PRIVADO   lleva datos bancarios de un tercero
   productos  PÚBLICO   una foto de producto está hecha para
                        que la vea todo el mundo, y la landing
                        tiene que mostrarla sin pedir permiso
```

Un bucket privado obligaría a la landing a pedir URLs firmadas, y la landing es
un sitio estático que no habla con Supabase en runtime. **Sería imposible.**

## Las políticas

```
   LEER     público, cualquiera
   SUBIR    solo admin (fn_is_admin)
   ACTUALIZAR solo admin  ← se necesita para reemplazar una foto
   BORRAR   nadie
```

> A diferencia de los vouchers, acá **sí hace falta UPDATE**: cambiar la foto de
> un producto es una operación normal. Pero borrar no: si una foto deja de
> usarse, se sube otra y la vieja queda huérfana. No molesta a nadie.

## La ruta

```
   productos/{slug}-{timestamp}.{ext}
   ejemplo: productos/cafe-moringa-1757100000.webp
```

El timestamp evita que una foto nueva quede cacheada con la imagen vieja.

**Commit.**

---

# BLOQUE 5 · SUBIR LAS 9 IMÁGENES QUE YA EXISTEN

```
   Origen:  SITIO WEB 06 PAGINAS LANDINGS/public/images/productos/
            9 archivos .webp
```

```
   1 · Subirlas al bucket con el nombre del slug
   2 · Llenar producto.imagen_url con la URL pública resultante
   3 · Los archivos de la landing SE QUEDAN donde están
       ← la landing sigue funcionando igual hasta la TAREA-23,
         cuando lea de la base. No se rompe nada en el camino
```

**Commit.**

---

# BLOQUE 6 · REGENERAR EL GUARDIÁN Y VERIFICAR

```bash
   # regenerar la lista de columnas con las 3 nuevas y sin descuento_pct
   node scripts/generar-schema-columnas.js   # o como se llame
   npx vitest run src/test/guardian-campos.test.js
```

## Las consultas — pegar la salida literal

```sql
-- 1 · las columnas quedaron
SELECT column_name FROM information_schema.columns
WHERE table_name='producto' ORDER BY ordinal_position;
-- deben estar slug, categoria, presentacion
-- NO debe estar descuento_pct

-- 2 · los 8 productos con todo lleno
SELECT codigo, slug, nombre, categoria, presentacion,
       precio_lista_cent, puntos,
       (imagen_url IS NOT NULL) tiene_foto
FROM producto ORDER BY orden;
-- ningún slug, categoria, presentacion ni imagen_url en NULL

-- 3 · los nombres se corrigieron
SELECT codigo, nombre FROM producto WHERE codigo IN ('CAFE','COLAGENO');
-- Coffee Capuccino · Colágeno Aeterna

-- 4 · los precios y puntos NO se movieron
SELECT codigo, precio_lista_cent, puntos FROM producto ORDER BY orden;
-- CAFE 15000/18 · COLAGENO 15000/18 · AC-MORINGA 12000/14
-- ESPLENDOR 12000/14 · AC-OREGANO 6000/8 · CAP-MORINGA 6000/8
-- HAR-MORINGA 5000/6 · DALBA 7000/10

-- 5 · el slug es único
SELECT COUNT(*) FROM (SELECT slug FROM producto GROUP BY slug HAVING COUNT(*)>1) t;
-- debe devolver 0

-- 6 · el bucket es público
SELECT id, public, file_size_limit FROM storage.buckets WHERE name='productos';
-- public = true
```

## Y una captura

```
   Una de las URLs de imagen_url abierta en el navegador,
   mostrando la foto del producto sin pedir login
```

**Es la prueba de que el bucket público funciona.** Imagen, no descripción.

---

# LO QUE NO SE TOCA

```
   ❌ precio_lista_cent y puntos de los 8 productos — están certificados
   ❌ La tabla `pack` — ni una columna
   ❌ Los archivos de imagen de la landing — se quedan donde están
   ❌ El prerender · el sitemap · config.js de la landing
      Todo eso es la TAREA-23. En esta tarea la landing NO se toca.
   ❌ src/motor/ — todo
   ❌ Las políticas RLS de producto — ya existen y bastan
   ❌ orden_detalle — su copia del precio es lo que protege el histórico
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8   · precios y puntos SIN CAMBIOS
```

**Después de esta tarea viene la TAREA-22: la pantalla P-32 de gestión de
productos. Y la TAREA-23: que la landing lea el catálogo de la base.**
