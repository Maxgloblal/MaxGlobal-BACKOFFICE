# TAREA-33 · LAS FOTOS DEL PRODUCTO AL COMPRAR

**Para:** Antigravity
**Escrita:** 8 de septiembre de 2026
**Fase:** presentación

> ## 🔴 ESTA TAREA ES SOLO DE PRESENTACIÓN
>
> No se toca ni una consulta, ni un precio, ni un punto, ni el motor.
> **El dato ya llega a la pantalla.** Solo hay que pintarlo.
>
> Si al terminar alguna cifra de la base cambió, algo se hizo mal.

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

# EL PROBLEMA

Máximo y sus socios compran a ciegas: eligen productos de una lista de texto.

```
   P-13 Tienda del socio      sin foto
   P-21 Registrar pedido      sin foto
   P-17 Mis pedidos           sin foto del producto
```

En un negocio de venta directa, la foto **es** el producto. Un socio que entra a
recomprar tiene que reconocer el frasco, no leer un código.

## El dato YA está — verificado el 8/09

```js
   src/servicios/socio.js:328
   .from('producto').select('*')       ← imagen_url viene incluida
```

```
   Los 8 productos tienen su foto en el bucket `productos`
   desde la TAREA-21. El bucket es PÚBLICO: la URL se usa
   directa, sin firmar.
```

```
   🔴 NO hay que tocar ninguna consulta.
      NO hay que firmar URLs — el bucket es público.
      Es distinto del voucher, que sí va firmado.
```

---

# BLOQUE 1 · P-13 · LA TIENDA DEL SOCIO

Es la más importante: es donde el socio decide su recompra del mes.

```
   ┌──────────────────────────────┐
   │   ┌────────┐                 │
   │   │  foto  │  COFFEE CAPUCCINO│
   │   │  1:1   │  Caja 20 sobres  │
   │   └────────┘                  │
   │                               │
   │   Público   S/. 150.00 (tachado)
   │   Tu precio S/.  75.00        │
   │   18 puntos                   │
   │                               │
   │   [ Agregar ]                 │
   └──────────────────────────────┘
```

```
   1 · La foto en cuadrado (1:1), recortada con object-fit: cover
   2 · Si imagen_url es null → un marcador con el icono de
       producto, NUNCA una imagen rota
   3 · loading="lazy" en todas
   4 · El alt es el nombre del producto
```

**Commit.**

---

# BLOQUE 2 · P-21 · REGISTRAR PEDIDO

Es la pantalla que Máximo usa por teléfono mientras el cliente le dicta.

```
   Miniatura pequeña junto al nombre, en la lista y
   en las líneas del carrito.
```

```
   🔴 CUIDADO: en P-21 ya hay un `imagen_url` en la línea 237,
      pero es del VOUCHER, no del producto. No lo toques.
```

**Commit.**

---

# BLOQUE 3 · P-17 · MIS PEDIDOS

En el detalle de cada pedido, la miniatura de cada producto comprado.

```
   🔴 OJO CON EL HISTÓRICO:
      orden_detalle guarda el precio y los puntos de la compra,
      pero la FOTO se lee del producto actual.
      Si Máximo cambia la foto, los pedidos viejos mostrarán
      la nueva. Es aceptable y no se arregla acá.
```

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · P-13 muestra 8 productos, los 8 con su imagen
   2 · Un producto sin imagen_url muestra el marcador,
       no una imagen rota
   3 · Las URLs apuntan al bucket público de Supabase
       y NO están firmadas (no llevan ?token=)
   4 · Los precios NO cambiaron
       ← número a mano: Café público 15000 · socio 7500
   5 · Los puntos NO cambiaron
       ← Café 18 puntos
   6 · Ninguna consulta de src/servicios/ se modificó
```

**La 4 y la 5 son las que importan.** Es una tarea de fotos: si movió un precio,
movió lo que no debía.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```bash
# 1 · no se firmó ninguna URL de producto
grep -rn "createSignedUrl" src/paginas/P13TiendaRecompra.jsx src/paginas/P21RegistrarPedido.jsx
#    debe quedar VACÍO — el bucket de productos es público

# 2 · las consultas no se tocaron
git diff --stat src/servicios/
#    debe quedar VACÍO
```

```sql
-- 3 · los productos y sus precios, intactos
SELECT codigo, precio_lista_cent, puntos, imagen_url IS NOT NULL tiene_foto
FROM producto ORDER BY orden;
-- CAFE 15000/18 · COLAGENO 15000/18 · AC-MORINGA 12000/14
-- ESPLENDOR 12000/14 · AC-OREGANO 6000/8 · CAP-MORINGA 6000/8
-- HAR-MORINGA 5000/6 · DALBA 7000/10
-- los 8 con tiene_foto = true
```

## Capturas

```
   1 · P-13 con las 8 fichas y sus fotos
   2 · P-21 con las miniaturas en la lista
   3 · Un producto sin foto mostrando el marcador
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ src/servicios/ — ninguna consulta
   ❌ Los precios, los puntos, los descuentos
   ❌ src/motor/ · las funciones SQL · las políticas RLS
   ❌ El voucher y sus URLs firmadas — es otro flujo
   ❌ La landing — otro proyecto
   ❌ tokens.css — no se agregan colores ni tamaños
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              509
   comisiones        2,423   ·   S/. 101,939.82
   red_ancestro      3,972 filas
   ciclos abiertos       1   (ciclo 30 · diciembre 2026)
   config               39 claves
   productos             8   · precios y puntos sin cambios
   auth.users           23
   Karla · saldo  S/. 1,718.80
```
