# TAREA-14 · SUBIDA DE LA FOTO DEL VOUCHER

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Punto A2 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

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

El voucher es **la prueba de que un socio pagó**. El día que alguien reclame
*"yo sí deposité"*, o Máximo tenga que sustentar un ingreso, la foto es lo único
que vale.

```
   tabla voucher     bien diseñada
                     imagen_url · banco · numero_operacion · monto_cent
                     fecha_deposito · estado · motivo_rechazo
                     revisado_por · revisado_en

   las 1,049 filas   imagen_url = https://placehold.co/400x300?text=Voucher
   en el código      ninguna subida de archivos, ningún bucket
```

**Los datos escritos a mano sí se guardan. La imagen no tiene por dónde entrar.**

## Fuente del requisito

```
   03-SISTEMA/05-ROLES-Y-PERMISOS línea 125   "Adjuntar el comprobante —
                                               Foto, banco, monto, fecha"
   03-SISTEMA/05-ROLES-Y-PERMISOS línea 167   "📌 En la v1 lo hace él"
                                               (el administrador)
   RF-238                                      "El socio NO debe poder
                                               registrar el pedido ni subir
                                               comprobantes"
```

---

# LO QUE YA ESTÁ HECHO — NO SE TOCA

**Verificado contra Postgres el 4/09:**

```
   fn_registrar_afiliacion_socio    ya lee imagen_url del p_voucher ✅
   fn_registrar_pedido_recompra     ya lee imagen_url del p_voucher ✅
```

**Las dos funciones SQL están listas.** Reciben el voucher como JSON y guardan
la URL que les llegue. **No se modifica ninguna función SQL en esta tarea.**

Lo único que falta es que el navegador suba el archivo y ponga la URL real en
ese JSON, en vez del `placehold.co`.

---

# BLOQUE 1 · EL BUCKET

Crear el bucket `vouchers` en Supabase Storage.

## 🔴 PRIVADO, no público

```
   public = false
```

Un voucher lleva el nombre del titular, el banco, el número de operación y el
monto. **Son datos financieros de terceros.** Un bucket público es una URL que
cualquiera adivina o comparte sin querer.

## Configuración

```
   nombre              vouchers
   public              false
   file_size_limit     5 MB
   allowed_mime_types  image/jpeg · image/png · image/webp · application/pdf
```

El PDF entra porque muchos bancos peruanos dan el comprobante en PDF, no en foto.

## Las políticas

```
   SUBIR      solo el admin        fn_is_admin() = true
   LEER       el admin, siempre
              el socio, SOLO el voucher de SU propia orden
   BORRAR     nadie. Ni el admin.
```

**Nadie borra.** El voucher es respaldo contable. Si uno está mal, se rechaza la
orden y se sube otro — pero el anterior queda. Misma lógica que `comision` y
`wallet_movimiento`.

## La ruta del archivo

```
   vouchers/{ciclo_id}/{orden_codigo}-{timestamp}.{ext}
   ejemplo: vouchers/6/ORD-2026-001367-1757012345.jpg
```

Ordenado por ciclo para que Máximo pueda bajar el respaldo de un mes completo
cuando su contador se lo pida.

**Commit.**

---

# BLOQUE 2 · EL CAMPO EN P-21 Y P-22

En la sección "Comprobante de Pago" de las dos pantallas, junto a los campos de
banco, número de operación, fecha y monto que ya existen.

## Cómo funciona

```
   1 · El admin elige el archivo
   2 · Se valida en el navegador ANTES de subir:
         tipo permitido · tamaño máximo 5 MB
   3 · Se sube al bucket y se obtiene la ruta
   4 · Esa ruta va en el JSON del voucher, campo imagen_url
   5 · Recién entonces se llama a la función SQL de siempre
```

## Reglas de este bloque

```
   1 · Si la subida falla, la orden NO se registra.
       Nada de "registro igual y la foto la subo después":
       una orden sin respaldo es exactamente el problema que
       esta tarea viene a resolver.

   2 · El campo es OPCIONAL por ahora.
       Si el admin no adjunta nada, se guarda imagen_url = null
       y la orden se registra igual. Muchos pagos llegan por
       WhatsApp y Máximo puede no tener la foto a mano.
       ⚠️ NO se pone el placehold.co. Null es null.

   3 · Se muestra una miniatura después de subir, para que el
       admin vea que subió la que era antes de guardar.
```

**Commit.**

---

# BLOQUE 3 · MOSTRAR LA IMAGEN DONDE HOY HAY UN RECUADRO GRIS

## En P-23 · Bandeja de Confirmación

Hoy muestra el recuadro de `placehold.co` con el texto "Voucher Afiliacion".

```
   Si imagen_url apunta a placehold.co  →  "Sin comprobante adjunto"
   Si imagen_url es null                →  "Sin comprobante adjunto"
   Si hay imagen real                   →  se muestra, y "Ampliar" la abre
```

**Como el bucket es privado, hay que pedir una URL firmada** con caducidad corta
(15 minutos alcanza). No se puede armar la URL a mano.

## En P-17 · Mis Pedidos (lado del socio)

El socio puede **ver** el comprobante de su propia orden. No subirlo, no
cambiarlo. Solo verlo.

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · Un archivo de 6 MB es rechazado antes de subirse
   2 · Un archivo .exe o .txt es rechazado
   3 · Si la subida falla, la orden NO se crea
       (verificar que no quedó fila en `orden`)
   4 · Sin archivo adjunto, la orden SÍ se crea y imagen_url queda null
   5 · El socio NO puede subir a `vouchers` (RF-238)
   6 · El socio SÍ puede leer el voucher de SU orden
   7 · El socio NO puede leer el voucher de la orden de OTRO socio
   8 · Nadie puede borrar del bucket
```

**Las pruebas 5, 6 y 7 son las de seguridad y son obligatorias.** Se hacen con
una sesión de socio real, igual que `auth-rls.test.js`.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

Correr y **pegar la salida literal**:

```sql
-- 1 · el bucket existe y es PRIVADO
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE name='vouchers';
-- public debe ser false

-- 2 · las políticas del bucket
SELECT policyname, cmd FROM pg_policies
WHERE schemaname='storage' AND tablename='objects'
ORDER BY policyname;
-- no puede haber ninguna de DELETE

-- 3 · los vouchers viejos siguen intactos
SELECT COUNT(*) total,
       COUNT(*) FILTER (WHERE imagen_url LIKE '%placehold%') con_placeholder
FROM voucher;
-- total debe seguir siendo 1,049 o más · no se toca ninguno
```

## Y la captura, que es la única prueba real

```
   1 · P-22 registrando una afiliación con una imagen adjunta,
       mostrando la miniatura ANTES de guardar

   2 · P-23 mostrando esa misma imagen en el detalle del pedido,
       no el recuadro gris

   3 · P-17, entrando como el socio, viendo su comprobante
```

**Imágenes, no descripciones.** En las tareas 09, 11 y 12 se entregaron pies de
foto. En la 13 sí se entregaron capturas — hay que mantener eso.

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 3 consultas
   2 · Las 3 capturas
   3 · git status --short vacío, pegado literal
   4 · npx vitest run en verde
```

---

# LO QUE NO SE TOCA

```
   ❌ fn_registrar_afiliacion_socio · fn_registrar_pedido_recompra
      ya leen imagen_url · NO se modifica ninguna función SQL
   ❌ La tabla voucher — no se agrega ni se quita una columna
   ❌ Las 1,049 filas existentes con placehold.co — se quedan como están
   ❌ src/motor/ — todo
   ❌ El diseño y los estilos
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

Si alguna de estas cifras cambia después de tu tarea, algo se rompió:

```
   socios              505
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   wallet_movimiento   470
   rango_ciclo       2,008
   ciclos abiertos       1   (ciclo 6, noviembre)

   Karla (MG00012) · saldo S/. 1,890.00 · JADE en el ciclo 5
```

**Después de esta tarea sigue A3: el flujo completo de retiros —la pantalla del
admin y el débito de la billetera.**
