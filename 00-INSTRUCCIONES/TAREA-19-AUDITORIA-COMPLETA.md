# TAREA-19 · COMPLETAR LA AUDITORÍA

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Punto C4 del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

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

Existe la tabla `auditoria`, existe la pantalla **P-29 Auditoría**, y hasta la
TAREA-17 **nadie escribía una sola fila**.

Hoy hay 2 registros, los dos de bajas de socio. **Todo lo demás no deja rastro.**

```
   ¿Quién confirmó este pago?
   ¿Quién cerró el ciclo de octubre?
   ¿Quién cambió el porcentaje del bono de rango?
   ¿Quién aprobó este retiro de S/. 800?
   ¿Quién rechazó el pago de este socio, y por qué?

   → Hoy no se puede responder ninguna.
```

En un sistema que reparte dinero entre 500 personas, ese registro es lo primero
que se pide cuando hay un reclamo. Y lo primero que pide un contador.

---

# 🔴 PRIMERO: EL ADMIN PUEDE BORRAR LA AUDITORÍA

**Verificado el 4/09:**

```
   auditoria_admin_select   SELECT   fn_is_admin()    ✅ correcto
   auditoria_admin_insert   INSERT   —                ✅ correcto
   auditoria_admin_delete   DELETE   fn_is_admin()    🔴 NO PUEDE EXISTIR
```

**Una auditoría que se puede borrar no es una auditoría.** Si la persona con
acceso puede eliminar filas, el registro de "quién hizo qué" se puede reescribir
justo cuando más importa.

Misma regla que `comision` y `wallet_movimiento`: **solo se agrega**.

---

# EL PATRÓN YA EXISTE — cópialo, no lo inventes

`fn_dar_de_baja_socio` ya escribe su auditoría bien. Así queda una fila:

```json
   usuario_id      1
   accion          "baja_con_reenganche"
   tabla           "socio"
   registro_id     508
   datos_antes     { la estructura anterior completa }
   datos_despues   { "frontales_movidos": 2,
                     "descendientes_reconstruidos": 3,
                     "filas_ancestro_insertadas": 7 }
   creado_en       2026-09-05 01:01:38
```

**Ese es el modelo.** Todas las demás siguen la misma forma.

---

# BLOQUE 1 · CERRAR EL BORRADO

```sql
   DROP POLICY auditoria_admin_delete ON auditoria;
```

Y comprobar que **tampoco existe una política de UPDATE**. Hoy no hay, y no debe
haberla.

```
   Queda:  INSERT (cualquiera autenticado, vía las funciones)
           SELECT (solo admin)
           nada más
```

**Commit.**

---

# BLOQUE 2 · LAS SIETE FUNCIONES

Agregar la escritura de auditoría **dentro de cada función**, en la misma
transacción. Todas son funciones SQL que ya existen.

| Función | acción | tabla | registro_id |
|---|---|---|---|
| `fn_confirmar_orden_pago` | `confirmar_pago` | `orden` | id de la orden |
| `fn_rechazar_orden_pago` | `rechazar_pago` | `orden` | id de la orden |
| `fn_ejecutar_cierre_ciclo` | `cerrar_ciclo` | `ciclo` | id del ciclo |
| `fn_aprobar_solicitud_retiro` | `aprobar_retiro` | `solicitud_retiro` | id de la solicitud |
| `fn_rechazar_solicitud_retiro` | `rechazar_retiro` | `solicitud_retiro` | id de la solicitud |
| `fn_actualizar_config_ajustable` | `cambiar_config` | `config` | — (usar 0) |
| `fn_guardar_rango_config` | `cambiar_rango` | `rango` | id del rango |

## Qué guardar en cada una

```
   confirmar_pago    antes:   estado de la orden, monto, socio
                     después: puntos acreditados, comisiones generadas
                              y su total

   rechazar_pago     antes:   estado de la orden
                     después: el MOTIVO del rechazo   ← lo que va a
                              preguntar el socio

   cerrar_ciclo      antes:   ciclo, total de comisiones a abonar
                     después: total abonado, cantidad de abonos,
                              id del ciclo nuevo

   aprobar_retiro    antes:   monto solicitado, saldo del socio antes
                     después: saldo después, id del movimiento de
                              billetera

   rechazar_retiro   antes:   monto solicitado
                     después: el MOTIVO

   cambiar_config    antes:   la clave y su valor ANTERIOR
                     después: el valor nuevo
                     ← esta es la más importante de todas

   cambiar_rango     antes:   puntos, frontales y bono anteriores
                     después: los nuevos
```

## 🔴 `cambiar_config` es la que más importa

Un cambio en `config` puede alterar **cuánto cobran 500 personas**. Si alguien
mueve `linea_estirada_pct` de 50 a 80, todos los rangos empiezan a pagarse de
más y **el sistema no da ningún error**.

**Guardar siempre el valor anterior.** Sin eso no se puede saber qué cambió ni
volver atrás.

## Reglas

```
   1 · La escritura va DENTRO de la misma transacción.
       Si la operación falla, no queda auditoría de algo que
       no pasó. Si la auditoría falla, la operación tampoco pasa.

   2 · usuario_id = el admin que ejecuta (fn_current_socio_id()
       o el p_admin_id que ya recibe la función).

   3 · NO se audita ninguna lectura. Solo lo que cambia algo.

   4 · No se cambia la firma de ninguna función. Los servicios
       de JavaScript que las llaman siguen igual.
```

**Commit después de cada función, o cada dos. No las siete de un golpe.**

---

# BLOQUE 3 · P-29 · QUE SE ENTIENDA

La pantalla ya existe y lee con `fn_obtener_auditoria_admin`. Ahora que va a
tener contenido:

```
   Fecha y hora  ·  Quién  ·  Qué hizo  ·  Sobre qué  ·  Detalle

   05/09 01:01   Máximo   Dio de baja a un socio      MG00508
   04/09 22:14   Máximo   Cerró el ciclo              Octubre 2026
   04/09 21:30   Máximo   Confirmó un pago            ORD-2026-001367
   04/09 20:15   Máximo   Cambió la configuración     dias_hasta_pago: 5 → 3
```

```
   1 · La acción se muestra en castellano, no como
       "cambiar_config" sino "Cambió la configuración"

   2 · Filtro por tipo de acción y por rango de fechas

   3 · Al pulsar una fila se ve el antes y el después completos

   4 · Ordenado por fecha, lo más reciente primero
```

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · Confirmar un pago deja UNA fila con accion='confirmar_pago'
       y el id de la orden

   2 · Rechazar un pago guarda el MOTIVO en datos_despues

   3 · Cerrar un ciclo deja su fila con el total abonado

   4 · Aprobar un retiro guarda el saldo ANTES y el saldo DESPUÉS

   5 · Cambiar una clave de config guarda el valor anterior
       Ejemplo a mano: cambiar dias_hasta_pago de 3 a 5 deja
       datos_antes = {"dias_hasta_pago": "3"}

   6 · 🔴 El admin NO puede borrar una fila de auditoria
       (la política ya no existe)

   7 · 🔴 El admin NO puede modificar una fila de auditoria

   8 · Un socio NO puede leer la auditoría — con sesión real

   9 · Si la operación falla, NO queda fila de auditoría
```

**La 6 y la 7 son las que hacen que esto sirva para algo.** Una bitácora que se
puede editar no prueba nada.

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```sql
-- 1 · las políticas quedaron como deben
SELECT policyname, cmd FROM pg_policies
WHERE tablename='auditoria' ORDER BY policyname;
-- solo INSERT y SELECT. Ninguna de DELETE ni de UPDATE

-- 2 · las siete acciones aparecen tras ejercitarlas
SELECT accion, COUNT(*) FROM auditoria GROUP BY accion ORDER BY accion;

-- 3 · ninguna fila quedó sin usuario ni sin fecha
SELECT COUNT(*) FROM auditoria
WHERE usuario_id IS NULL OR creado_en IS NULL;
-- debe devolver 0

-- 4 · el cambio de config guardó el valor anterior
SELECT accion, datos_antes, datos_despues FROM auditoria
WHERE accion='cambiar_config' ORDER BY id DESC LIMIT 3;
-- datos_antes no puede estar vacío
```

## Capturas

```
   1 · P-29 con varias acciones distintas listadas, en castellano
   2 · El detalle de un cambio de configuración mostrando
       el antes y el después
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ La firma de las 7 funciones — solo se les agrega la escritura
   ❌ La lógica de comisiones, cierre, retiros y baja
      Todo eso está certificado. Solo se agrega el registro.
   ❌ src/motor/ — todo
   ❌ Los 2 registros de auditoría que ya existen
   ❌ Las políticas de INSERT y SELECT de auditoria
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

```
   socios              508
   órdenes           1,058
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6, noviembre)
   wallet              471   · saldo de Karla S/. 1,790.00
   config               38 claves · linea_estirada_pct = 50
```

> 🔴 **Ojo con `config`:** esta tarea toca `fn_actualizar_config_ajustable`. Si
> al terminar `linea_estirada_pct` no vale 50, o faltan claves, algo se rompió —
> y eso hace que todos los bonos de rango se paguen mal sin dar error.

**Después de esta tarea solo quedan dos cosas: el proyecto Supabase limpio para
producción, y el code splitting.**
