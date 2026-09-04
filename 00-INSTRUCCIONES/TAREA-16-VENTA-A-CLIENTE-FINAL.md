# TAREA-16 · VENTA A CLIENTE FINAL

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Punto A6 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

> **Esta tarea es CHICA.** Una casilla y una columna. Casi todo lo que hace
> falta ya existe en el sistema y no se toca.

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

# EL PROBLEMA, EN UNA FRASE

La landing vende al público a **precio de lista**. Máximo recibe esos pedidos por
WhatsApp y **no tiene dónde registrarlos**.

```
   maxglobaloficial.com muestra:
     Público: S/. 150      Los socios pagan desde: S/. 75

   Café que compra un socio Gold   paga S/.  75  →  a la empresa S/.  57.54
   Café que compra un cliente      paga S/. 150  →  a la empresa S/. 132.54
```

**Es la venta que más margen deja y es la única que el sistema no procesa.**

---

# EL DISEÑO — decidido por Jack el 4/09

**Una venta a cliente es una recompra normal, con dos diferencias.**

```
   1 · El socio de la orden lo elige el ADMIN
       Si el cliente vino por el enlace de un socio → ese socio
       Si no vino por nadie → Máximo (MG00001)
       ← esto YA FUNCIONA. Cero desarrollo.

   2 · El precio es DE LISTA, sin descuento
       ← esto es LO ÚNICO que hay que construir
```

## Lo que NO hace falta construir

```
   ❌ Columnas para el cliente
      La tabla `envio` ya tiene: destinatario · telefono ·
      departamento · provincia · distrito · direccion · referencia
      El cliente va ahí. Es a donde va el paquete.

   ❌ Bloquear packs
      P-21 solo vende productos. Los packs están en P-22.
      Ya está resuelto por diseño.

   ❌ Reglas de activación o residual configurables
      La venta se comporta como una recompra normal: los puntos
      van al socio de la orden, lo activan, y suben por sus
      10 niveles. Es lo decidido.

   ❌ Tabla de clientes
      El cliente no tiene cuenta. Vive en el envío.
```

---

# 🔴 POR QUÉ EL PRECIO ES TODO EL PUNTO DE ESTA TAREA

**Verificado contra Postgres el 4/09:**

```
   descuento_recompra_pct por pack:
     Kit Emprendedor   40%
     Ejecutivo         50%
     Gold              50%
     Familiar          50%
     Empresarial       50%   ← el pack de Máximo (MG00001)
```

Si se registra la venta del cliente sin tocar nada, **el sistema le aplica
automáticamente el 50% del pack del socio** y guarda S/. 75 cuando el cliente
pagó S/. 150.

Eso rompe tres cosas a la vez:

```
   1 · El voucher dice S/. 150 y la orden dice S/. 75
       → P-23 compara "Monto Esperado" contra "Monto Declarado
         en Voucher" y va a marcar diferencia en CADA venta

   2 · Los reportes muestran la MITAD de lo que se vendió

   3 · La contabilidad no cuadra con el banco
```

---

# BLOQUE 1 · LA COLUMNA

Migración nueva. **Solo agrega.**

```sql
   ALTER TABLE orden
     ADD COLUMN tipo_venta varchar NOT NULL DEFAULT 'socio';
   -- valores: 'socio' | 'cliente'
```

```
   🔴 Las 1,055 órdenes existentes quedan en 'socio'.
      NO se toca ninguna. El DEFAULT las cubre.

   🔴 orden.tipo sigue siendo 'afiliacion' | 'recompra'.
      Una venta a cliente es tipo='recompra' + tipo_venta='cliente'.
      Son dos ejes distintos, no se mezclan.

   🔴 orden.socio_id sigue NOT NULL y no cambia.
```

**Commit.**

---

# BLOQUE 2 · LA CASILLA EN P-21

Arriba del formulario de "Registrar pedido":

```
   ☐  Precio público — cliente que no es socio
```

## Qué pasa al marcarla

```
   1 · Los precios de los productos pasan a PRECIO DE LISTA
       descuento_pct = 0 en todas las líneas
       precio_final_cent = precio_lista_cent

   2 · Se muestra visible, para que el admin no se confunda:
       "Precio público — el cliente no tiene descuento"

   3 · El buscador de socio cambia de etiqueta:
       "Socio" → "Socio que refirió · si no hay, poner MG00001"

   4 · La orden se guarda con tipo_venta = 'cliente'
```

## Lo que NO cambia al marcarla

```
   Los PUNTOS son los mismos. Un café da 18 puntos lo compre
   quien lo compre. La red cobra igual — la empresa es la que
   gana más.
```

## Los totales

```
   4 cafés a precio público:
     subtotal_cent   60000    (4 × 15000)
     descuento_cent      0
     total_cent      60000    ← S/. 600.00

   Los mismos 4 cafés a un socio Gold:
     subtotal_cent   60000
     descuento_cent  30000
     total_cent      30000    ← S/. 300.00
```

**Recuerda la regla del proyecto: los importes se DERIVAN.**
`descuento = subtotal − total`. Una resta, no un cálculo aparte.

**Commit.**

---

# BLOQUE 3 · DONDE SE VE

```
   P-23 Bandeja   la orden se muestra con una etiqueta
                  "VENTA A CLIENTE" para que Máximo la distinga

   P-24 Envíos    el destinatario es el que se escribió en el envío
                  ← ya funciona así, solo verificar que se vea bien

   P-28 Reportes  separar el total vendido a socios del total
                  vendido a clientes
                  ← es el número que le va a interesar a Máximo:
                    la venta a cliente le deja más del doble
```

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · Con la casilla MARCADA, 4 cafés cuestan S/. 600.00
       (subtotal 60000 · descuento 0 · total 60000)

   2 · Con la casilla SIN marcar y un socio Gold, los mismos
       4 cafés cuestan S/. 300.00
       (subtotal 60000 · descuento 30000 · total 30000)

   3 · Los puntos son 72 en los DOS casos

   4 · La orden queda con tipo_venta = 'cliente'

   5 · Los puntos van al socio de la orden y lo activan,
       igual que una recompra normal

   6 · Si el socio de la orden es MG00001, no se genera
       ninguna comisión (no tiene a nadie arriba)

   7 · Las 1,055 órdenes existentes siguen con tipo_venta='socio'
```

**La 1 y la 2 son las que protegen el margen.** Son el mismo pedido con y sin la
casilla, y tienen que dar exactamente el doble.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```sql
-- 1 · las órdenes viejas no se tocaron
SELECT tipo_venta, COUNT(*) FROM orden GROUP BY tipo_venta;
-- 'socio' debe tener 1,055 · el resto son las nuevas de prueba

-- 2 · una venta a cliente se guardó a precio de lista
SELECT o.codigo, o.tipo_venta, o.subtotal_cent, o.descuento_cent, o.total_cent,
       od.precio_lista_cent, od.descuento_pct, od.precio_final_cent
FROM orden o JOIN orden_detalle od ON od.orden_id=o.id
WHERE o.tipo_venta='cliente';
-- descuento_pct = 0 · precio_final_cent = precio_lista_cent
-- descuento_cent = 0 · total_cent = subtotal_cent

-- 3 · los puntos no cambiaron por el precio
SELECT o.tipo_venta, od.puntos_unitario, od.cantidad, od.puntos_subtotal
FROM orden o JOIN orden_detalle od ON od.orden_id=o.id
WHERE o.tipo_venta='cliente';
-- un café sigue dando 18 puntos
```

## Capturas

```
   1 · P-21 con la casilla marcada, mostrando el precio de S/. 150
       y el aviso de precio público
   2 · La misma pantalla SIN marcar, mostrando S/. 75
   3 · P-23 con la orden etiquetada como venta a cliente
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ La tabla envio — ya tiene todo lo del cliente
   ❌ orden.socio_id · orden.tipo
   ❌ Las 1,055 órdenes existentes
   ❌ src/motor/ — todo
   ❌ Las funciones SQL de comisiones y cierre
   ❌ P-22 · las afiliaciones no cambian
   ❌ Los descuentos de los packs — se quedan como están
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              505
   órdenes           1,055
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet            470 abonos + 1 retiro (−10000)
   saldo de Karla    S/. 1,790.00
```

**Después de esta tarea queda la baja de socio con reenganche de red — la
operación más delicada del sistema. Esa va sola y se prueba a mano.**
