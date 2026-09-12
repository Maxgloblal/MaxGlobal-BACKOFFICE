# TAREA-26 · UPGRADE DE PACK

**Para:** Antigravity
**Escrita:** 7 de septiembre de 2026

> Es el **FLUJO 9** de `03-SISTEMA/03-FLUJOS-DEL-SISTEMA.md`, línea 332.
> Está definido desde el 26/08 y nunca se construyó.
>
> **No hay nada que decidir en esta tarea. Todo está resuelto en la
> documentación.** Si algo parece ambiguo, no se inventa: se pregunta.

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

# EL PROBLEMA — verificado el 7/09

El socio **ya puede pedir** la mejora: `P18MiPerfil.jsx:252` abre WhatsApp con el
mensaje escrito. Del otro lado no hay nada.

```
   Pantalla admin de upgrade         no existe
   Función SQL que cambie el pack    no existe  (0 funciones)
   Órdenes de afiliación               507
   Socios con 2 afiliaciones             0
```

## Por qué importa

El pack no es una etiqueta. Define tres cosas que son plata:

```
   niveles_patrocinio        cuántos niveles cobra
   niveles_residual          cuántos niveles cobra
   descuento_recompra_pct    a qué precio compra
```

Si Luis paga S/. 8,000 para pasar de Kit a Empresarial y nadie lo registra,
sigue cobrando como Kit. Se entera al cierre de mes, con el dinero ya pagado.

---

# LO QUE YA ESTÁ DECIDIDO — no se discute

| Regla | Dónde está |
|---|---|
| Paga el **pack completo**, no la diferencia | resp. 13.3 del 26/08 · RF-509 |
| Los beneficios se activan **de inmediato** | RF-532 · FLUJO 9 |
| Se suman los **puntos de rango** del pack nuevo | FLUJO 9 |
| Solo se **sube** de pack, nunca se baja | P-18 ya ofrece solo superiores |

---

# LA ARQUITECTURA — y por qué casi no hay que escribir código

**Un upgrade es una orden de afiliación al pack nuevo.** Nada más.

```js
   src/motor/persistencia.js:40
   if (orden.tipo === 'afiliacion') {
       calcularPatrocinio(... total_cent, pack_id ...)
   }
```

El motor paga patrocinio sobre `total_cent` de cualquier orden `afiliacion`.
Como el upgrade cobra el pack completo, **el patrocinio ya sale bien solo**.

```
   ✅ El motor NO se toca
   ✅ fn_confirmar_orden_pago ya acredita los puntos en `activacion`
   ✅ El voucher, P-23 y la auditoría ya funcionan
```

## Lo único que falta, de verdad

```
   Nadie cambia socio.pack_id
```

Esa es toda la funcionalidad que falta. Lo demás es la pantalla para crear
la orden.

---

# BLOQUE 1 · CREAR LA ORDEN DE UPGRADE

Va en **P-27 Gestión de Socios**, sobre el socio ya seleccionado. No en P-22:
P-22 crea un socio nuevo con su cuenta de acceso, y acá el socio ya existe.

```
   Botón "Mejorar pack" en la fila del socio
   → modal:
       Pack actual     Kit Emprendedor   S/. 1,200
       Pack nuevo      [ selector: SOLO los de precio mayor ]
       Total a pagar   S/. 8,000   ← el pack COMPLETO
       Voucher         [ subir imagen ]
```

## Reglas

```
   1 · El selector muestra SOLO packs de precio_cent mayor al actual.
       Nunca uno igual ni menor.

   2 · El total es pack.precio_cent del pack nuevo. Completo.
       🔴 NO se resta lo que ya pagó. RF-509.

   3 · Se crea una orden:
         tipo        'afiliacion'    ← así el motor paga patrocinio
         pack_id     el pack NUEVO
         total_cent  precio del pack nuevo
         estado      pendiente
         ciclo_id    el ciclo abierto

   4 · 🔴 socio.pack_id NO se toca todavía. Recién se paga.

   5 · El voucher se sube con el mismo patrón de la TAREA-14.
       Sin foto → imagen_url en NULL. Nunca un placeholder.
```

## Por qué `tipo = 'afiliacion'` y no un tipo nuevo

```
   Un tipo 'upgrade' obligaría a tocar el motor, el cierre,
   los reportes y P-23. Cuatro sitios certificados.

   Con 'afiliacion' no se toca ninguno: el upgrade ES una
   afiliación al pack nuevo, y el plan lo cobra igual.
```

**Hoy ningún socio tiene dos órdenes de afiliación, pero nada lo impide y
ninguna consulta asume lo contrario** — verificado el 7/09: cero `.single()`
sobre órdenes de afiliación.

**Commit.**

---

# BLOQUE 2 · 🔴 EL CAMBIO DE PACK AL CONFIRMAR

Acá está el único cambio de lógica de toda la tarea, y toca una función
certificada: `fn_confirmar_orden_pago`.

```
   Al confirmar una orden tipo 'afiliacion':

   SI  orden.pack_id  ES DISTINTO DE  socio.pack_id
   Y   el pack de la orden cuesta MÁS que el actual
   ENTONCES
       socio.pack_id := orden.pack_id
       + fila en auditoria
```

## Por qué esa condición se distingue sola

```
   Afiliación inicial   socio.pack_id ya se puso al registrarlo
                        → orden.pack_id == socio.pack_id
                        → no hace nada

   Upgrade              socio.pack_id sigue siendo el viejo
                        → son distintos
                        → cambia
```

**No hace falta ninguna columna nueva ni ninguna bandera.**

## 🔴 La guarda del precio no es opcional

```
   Sin la comparación de precio, una orden mal cargada
   podría BAJARLE el pack a un socio y quitarle niveles
   de comisión sin que nadie se entere.

   Si el pack nuevo NO cuesta más, la función FALLA
   con mensaje claro. No lo cambia "por si acaso".
```

## La auditoría — con el valor anterior

```
   accion          upgrade_pack
   datos_antes     pack_id viejo · nombre · precio · niveles · descuento
   datos_despues   lo mismo del pack nuevo
```

> Cambiar el pack cambia cuántos niveles cobra ese socio para siempre. Sin el
> valor anterior guardado no se puede saber qué tenía ni volver atrás. Mismo
> criterio que `fn_dar_de_baja_socio`.

**Commit.**

---

# BLOQUE 3 · QUE SE VEA

```
   P-18 (socio)   su pack nuevo, ya reflejado, al entrar
   P-27 (admin)   el pack actual del socio en la lista
   P-23           la orden de upgrade se distingue de una
                  afiliación normal: "Upgrade · Kit → Empresarial"
```

Para distinguirla en P-23 basta comparar `orden.pack_id` con `socio.pack_id`:
si difieren y la orden está pendiente, es un upgrade. **Sin columnas nuevas.**

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · El selector NO ofrece packs de precio igual ni menor
   2 · El total es el precio COMPLETO del pack nuevo,
       no la diferencia
       ← número a mano: de Kit S/.1,200 a Empresarial,
         el total es 800000 céntimos, no 680000

   3 · Al CREAR la orden, socio.pack_id NO cambia todavía
   4 · Al CONFIRMARLA, socio.pack_id pasa al pack nuevo
   5 · Confirmar una afiliación NORMAL no cambia nada
       ← la orden y el socio tienen el mismo pack: no toca

   6 · Una orden con un pack MÁS BARATO es rechazada
       ← ésta es la que protege contra la bajada silenciosa

   7 · El patrocinio del upgrade se calcula sobre el precio
       COMPLETO del pack nuevo
       ← número a mano: patrocinador nivel 1 de un upgrade
         a Empresarial S/. 8,000 cobra el 20% = S/. 1,600.00

   8 · Los puntos de rango del pack nuevo se acreditan
       en `activacion` al confirmar

   9 · Queda la fila en auditoria con el pack ANTERIOR
       en datos_antes

  10 · Un socio (no admin) NO puede registrar un upgrade
       — con sesión real
```

**La 6 y la 7 son las que importan.** La 6 porque una bajada silenciosa de pack
le quita comisiones a alguien sin dejar rastro. La 7 porque es la plata que
cobra el patrocinador y es la única razón por la que se reusó `afiliacion`.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```sql
-- 1 · el upgrade quedó como orden de afiliación
SELECT o.codigo, o.tipo, o.total_cent, o.pack_id, s.pack_id AS pack_del_socio
FROM orden o JOIN socio s ON s.id = o.socio_id
WHERE o.id = <el id del upgrade de prueba>;
-- después de confirmar, los dos pack_id deben COINCIDIR

-- 2 · la comisión de patrocinio salió sobre el precio completo
SELECT nivel, monto_cent FROM comision
WHERE orden_id = <el id del upgrade> AND tipo='patrocinio'
ORDER BY nivel;
-- nivel 1 = 20% del precio del pack NUEVO

-- 3 · quedó auditado con el pack anterior
SELECT accion, datos_antes->>'pack_id', datos_despues->>'pack_id'
FROM auditoria WHERE accion='upgrade_pack';

-- 4 · nadie bajó de pack
SELECT COUNT(*) FROM auditoria a
WHERE a.accion='upgrade_pack'
  AND (a.datos_despues->>'precio_cent')::bigint
    <= (a.datos_antes->>'precio_cent')::bigint;
-- debe devolver 0, siempre
```

## Capturas

```
   1 · El modal de mejorar pack, mostrando el total COMPLETO
   2 · P-23 con la orden marcada como upgrade
   3 · P-18 del socio con su pack ya cambiado
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ src/motor/ — TODO. El patrocinio ya sale bien solo.
   ❌ El orden de fn_ejecutar_cierre_ciclo
   ❌ P-22 · el registro de socios nuevos
   ❌ fn_registrar_afiliacion_socio — recién certificada en TAREA-25
   ❌ La tabla `pack` — precios y niveles no se tocan
   ❌ Las 507 órdenes de afiliación existentes
   ❌ La landing — otro proyecto
```

> De `fn_confirmar_orden_pago` se toca **solo** el caso en que los dos `pack_id`
> difieren. Todo lo demás de esa función queda idéntico. **Pega el diff.**

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

Sin contar lo que agregue la prueba del upgrade:

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8   · precios y puntos sin cambios
```

**Si el upgrade de prueba agrega filas, dilo y di cuántas. Lo que no puede pasar
es que cambie algo que el upgrade no tocó.**

---

# DESPUÉS DE ESTA

Con el FLUJO 9 construido, el alcance de la v1 queda cerrado en funcionalidad.
Lo que sigue es el **móvil a 390px**, que nunca se probó y es donde los socios
van a entrar a ver cuánto ganaron.
