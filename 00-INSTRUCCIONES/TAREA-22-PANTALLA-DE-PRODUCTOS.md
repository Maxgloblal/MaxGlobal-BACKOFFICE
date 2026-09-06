# TAREA-22 · P-32 · GESTIÓN DE PRODUCTOS

**Para:** Antigravity
**Escrita:** 6 de septiembre de 2026
**Fase 3 de `05-CONTROL/EVALUACION-GESTION-DE-PRODUCTOS.md`.**

> **Es la pantalla que Máximo va a usar de verdad.** Hoy no puede crear ni
> editar un producto: tiene que pedírselo a Jack.

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

# LO QUE YA ESTÁ LISTO — de la TAREA-21

```
   ✅ producto tiene slug · categoria · presentacion · imagen_url
   ✅ Los 8 productos poblados, con foto y nombre comercial correcto
   ✅ Bucket `productos` PÚBLICO · 2 MB · jpeg/png/webp
      políticas: leer público · subir y actualizar solo admin · sin borrado
   ✅ RLS de la tabla: producto_admin_all (ALL, fn_is_admin)
      → el admin YA puede escribir. No hay que crear políticas.
   ✅ UNIQUE en codigo y en slug
   ✅ CHECK: precio_lista_cent > 0 · puntos >= 0
```

**Esta tarea es pantalla y servicio. Nada de base de datos.**

---

# BLOQUE 1 · LA PANTALLA P-32

Entrada nueva en el menú del admin, **después de "Configuración del plan"**:

```js
   { label: 'Productos', path: '/admin/productos', icon: Package }
```

## La lista

```
   Foto (miniatura) · Código · Nombre · Categoría
   Precio público · Puntos · Orden · Activo

   Ordenada por `orden`
   Filtro por categoría y por activo/inactivo
   Botón "Nuevo producto"
```

**Commit.**

---

# BLOQUE 2 · CREAR Y EDITAR

## Los campos que escribe Máximo

```
   Código          único · en MAYÚSCULAS · sin espacios
   Slug            único · minúsculas y guiones · va en la URL de la web
   Nombre          el comercial, el que ve el cliente
   Descripción     texto largo
   Categoría       selector con las que ya existen + opción de escribir una nueva
   Presentación    "Caja 20 sobres de 18 g"
   Precio público  en soles, se guarda en céntimos
   Puntos          entero
   Foto
   Orden           posición en la web y en la tienda
   Activo          sí/no
```

## Reglas de validación — antes de mandar nada a Postgres

```
   1 · Precio > 0 y puntos >= 0
       ← hay CHECK en la base, pero el usuario no puede ver
         un error crudo de Postgres. Se valida antes.

   2 · Código y slug únicos
       ← hay UNIQUE en la base. Se comprueba antes y se avisa
         "ese código ya existe", no un error 23505.

   3 · El slug se genera solo desde el nombre, y se puede editar
       "Coffee Capuccino" → "coffee-capuccino"

   4 · 🔴 Al EDITAR, el slug avisa antes de cambiar:
       "Cambiar el slug rompe el enlace de la web que ya
        compartieron. La URL vieja va a dar 404."
       Se permite, pero se avisa.
```

## 🔴 NUNCA se borra un producto

```
   Solo se DESACTIVA.

   Hay una FK: orden_detalle.producto_id → producto.id
   Postgres no dejaría borrar uno con ventas, pero además
   un producto desactivado tiene que seguir apareciendo en
   el historial de compras de quien lo compró.

   No pongas un botón de borrar. Ni escondido.
```

**Commit.**

---

# BLOQUE 3 · EL PANEL DE CONSECUENCIAS

Al lado del precio y los puntos, en vivo mientras Máximo escribe:

```
   ┌──────────────────────────────────────────────────────┐
   │  Precio público      S/. 150.00                      │
   │  Precio de socio     S/.  75.00   (Gold, 50%)        │
   │                      S/.  90.00   (Kit, 40%)         │
   │  Puntos              18                              │
   │                                                       │
   │  ── Qué pasa con estos puntos ──                     │
   │  Residual máximo a la red    S/. 17.46  (97% × 18)   │
   │                                                       │
   │  Si lo compra un SOCIO Gold                           │
   │    paga S/.  75.00  →  a la empresa S/.  57.54       │
   │  Si lo compra un CLIENTE                              │
   │    paga S/. 150.00  →  a la empresa S/. 132.54       │
   │                                                       │
   │  Referencia: tus otros productos dan entre 3.50 y     │
   │  4.29 soles de socio por punto. Este da 4.17.  ✅     │
   └──────────────────────────────────────────────────────┘
```

## De dónde sale cada número — no se inventa ninguno

```
   Precio de socio    precio × (1 − pack.descuento_recompra_pct)
                      se leen los packs de la base, no se escribe 50

   Residual máximo    puntos × config.valor_punto_comision × 97%
                      el 97% es la suma de la escala residual
                      se lee de nivel_comision, no se escribe

   La banda 3.50-4.29 se calcula de los otros productos activos,
   no es un número fijo
```

## El aviso cuando se sale de la banda

```
   ⚠️  Este producto daría más puntos por sol que todos los demás.
       La red se llevaría el 41% de la venta, contra el ~23% habitual.
       Revisa que sea lo que quieres.
```

**Avisa, no bloquea.** Mismo criterio que ya usa P-26 con el valor del punto y
con el nivel 8 del residual: Máximo decide, pero informado.

**Commit.**

---

# BLOQUE 4 · LA FOTO

Se reusa el patrón de la TAREA-14 (vouchers), con dos diferencias.

```
   1 · El bucket es PÚBLICO → la URL se arma directa,
       no hace falta firmarla

   2 · 🔴 EL NOMBRE DEL ARCHIVO LLEVA TIMESTAMP

       productos/{slug}-{timestamp}.{ext}
       ejemplo: productos/cafe-moringa-1757100000.webp
```

## Por qué el timestamp importa

En la TAREA-21 las fotos se subieron como `{slug}.webp`, sin timestamp.

```
   Máximo cambia la foto del café
   → el archivo se llama igual
   → el CDN sigue sirviendo la vieja durante horas
   → él cree que el sistema no guardó su cambio
```

**Al reemplazar una foto, el archivo nuevo siempre lleva nombre nuevo.** El
viejo queda huérfano en el bucket y no molesta a nadie — recuerda que no hay
política de borrado.

## Validación antes de subir

```
   tipo    jpeg · png · webp
   tamaño  máximo 2 MB
   Se muestra la miniatura antes de guardar
   Si la subida falla, el producto NO se guarda
```

## Y un aviso sobre la forma

```
   ℹ️  La web muestra las fotos en cuadrado (1:1).
      Si subes una foto muy alargada, se va a recortar.
```

**Commit.**

---

# BLOQUE 5 · AUDITORÍA

Los cambios de producto se registran, como las 8 acciones de la TAREA-19.

```
   crear_producto      datos_despues: el producto completo
   editar_producto     datos_antes: los valores ANTERIORES
                       datos_despues: los nuevos
   activar_producto    /  desactivar_producto
```

> 🔴 **El precio y los puntos son plata.** Cambiar los puntos de un producto
> cambia lo que cobra toda la red en cada recompra de ese producto. Sin el valor
> anterior guardado no se puede saber qué cambió ni volver atrás.

**Se sigue el patrón que ya funciona en `fn_dar_de_baja_socio`.**

**Commit.**

---

# BLOQUE 6 · LAS PRUEBAS

```
   1 · Crear un producto con precio 0 falla ANTES de llegar a Postgres
   2 · Crear con un código que ya existe falla con mensaje claro,
       no con el error 23505 crudo
   3 · Crear con un slug que ya existe falla igual
   4 · El slug se genera solo: "Coffee Capuccino" → "coffee-capuccino"
   5 · Editar el precio NO cambia orden_detalle de órdenes pasadas
       ← número a mano: la orden ORD-2026-001489 sigue con
         precio_lista_cent 15000 aunque el producto cambie
   6 · Desactivar un producto NO lo borra: sigue en la tabla
       y sigue apareciendo en el historial de quien lo compró
   7 · NO existe ninguna función ni botón que borre un producto
   8 · Una foto de 3 MB es rechazada antes de subirse
   9 · Un .pdf o .exe es rechazado
  10 · Al reemplazar la foto, el nombre del archivo CAMBIA
       (lleva timestamp distinto)
  11 · Crear un producto deja su fila en `auditoria`
  12 · Editar el precio guarda el valor ANTERIOR en datos_antes
  13 · Un socio (no admin) NO puede crear ni editar productos
       — con sesión real
```

**La 5 es la que protege el histórico. La 13 es la de seguridad.**

**Commit.**

---

# BLOQUE 7 · VERIFICACIÓN

```sql
-- 1 · los 8 originales siguen intactos
SELECT codigo, precio_lista_cent, puntos FROM producto
WHERE codigo IN ('CAFE','COLAGENO','AC-MORINGA','ESPLENDOR',
                 'AC-OREGANO','CAP-MORINGA','HAR-MORINGA','DALBA')
ORDER BY orden;
-- CAFE 15000/18 · COLAGENO 15000/18 · AC-MORINGA 12000/14
-- ESPLENDOR 12000/14 · AC-OREGANO 6000/8 · CAP-MORINGA 6000/8
-- HAR-MORINGA 5000/6 · DALBA 7000/10

-- 2 · ningún slug ni código duplicado
SELECT COUNT(*) FROM (SELECT slug FROM producto GROUP BY slug HAVING COUNT(*)>1) t;
SELECT COUNT(*) FROM (SELECT codigo FROM producto GROUP BY codigo HAVING COUNT(*)>1) t;
-- las dos deben devolver 0

-- 3 · el histórico no se movió
SELECT od.precio_lista_cent, od.puntos_unitario
FROM orden_detalle od JOIN orden o ON o.id=od.orden_id
WHERE o.codigo='ORD-2026-001489';
-- 15000 y 18, pase lo que pase con el producto

-- 4 · las acciones nuevas quedaron auditadas
SELECT accion, COUNT(*) FROM auditoria
WHERE accion LIKE '%producto%' GROUP BY accion;
```

## Las capturas

```
   1 · P-32 con la lista de los 8 productos y sus miniaturas
   2 · El formulario de crear, con el panel de consecuencias
       mostrando los S/. 57.54 y S/. 132.54
   3 · El aviso cuando los puntos se salen de la banda
   4 · Un producto desactivado, que sigue en la lista
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ Los precios y puntos de los 8 productos — certificados
   ❌ La tabla `pack` — esta pantalla no toca packs
   ❌ orden_detalle — su copia del precio protege el histórico
   ❌ src/motor/ — todo
   ❌ Las políticas RLS de producto y del bucket — ya están bien
   ❌ La landing — es la TAREA-23. Acá no se toca ni un archivo suyo.
   ❌ src/piezas/Formulario.jsx — 6 pantallas dependen de él
      Recuerda: CampoSelect espera { value, label }, no { valor, etiqueta }
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
   productos             8   con foto, slug, categoría y presentación
```

**Después de esta tarea viene la TAREA-23: que la landing lea el catálogo de la
base. Ahí hay que acordarse de que `public/sitemap.xml` es un archivo estático
escrito a mano y también tiene que generarse en el build.**
