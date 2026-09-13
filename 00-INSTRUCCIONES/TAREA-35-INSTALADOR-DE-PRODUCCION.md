# TAREA-35 · EL INSTALADOR DE PRODUCCIÓN

**Para:** Antigravity
**Escrita:** 8 de septiembre de 2026 · **revisada a fondo** el mismo día
**Fase:** preparación de producción

> ## 🔴 LA TAREA MÁS IMPORTANTE QUE QUEDA
>
> **Nadie ha levantado nunca este sistema desde cero.** El esquema se construyó
> en tres semanas aplicando 22 archivos a mano, en un orden que solo existe en
> la bitácora.
>
> El día que Máximo diga "empecemos" no puede ser el día en que descubramos que
> falta un script.

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

# LO QUE YA ESTÁ VERIFICADO — no lo repitas, arráncalo de acá

Análisis hecho el 8/09 comparando la base viva contra los 22 archivos SQL.

## 🔴 Hallazgo 1 · Cuatro funciones NO tienen archivo

Comprobado dos veces, con búsqueda por nombre en todo el repositorio:

```
   fn_desglose_comisiones_socio    P-14 · comisiones del socio
   fn_rango_lineas_socio           P-15 · la línea estirada
   fn_obtener_auditoria_admin      P-29 · la auditoría
   fn_validar_pack_solicitud       la validación de packs (trigger)
```

**Solo existen dentro de `utlohnidkuvxqppmoevj`.** Un proyecto limpio nacería
sin ellas: el socio no vería sus comisiones, el rango no calcularía, y los
códigos de pack basura volverían a entrar.

## 🔴 Hallazgo 2 · Cuatro funciones están definidas DOS veces

```
   fn_confirmar_orden_pago          tarea19  y  tarea26
   fn_aprobar_solicitud_retiro      retiros-funciones  y  tarea19
   fn_rechazar_solicitud_retiro     retiros-funciones  y  tarea19
   fn_actualizar_config_ajustable   tarea19  y  tarea20
```

**En los cuatro casos el archivo más nuevo CONTIENE al viejo**, verificado
midiendo cuerpo y marcadores:

```
   fn_confirmar_orden_pago
     tarea19   193 líneas · auditoría · activación · comisión
     tarea26   264 líneas · TODO lo anterior + el upgrade
```

```
   → El orden cronológico es OBLIGATORIO.
     Si tarea19 corre después de tarea26, el upgrade de pack
     desaparece sin un solo error.
```

## 🔴 Hallazgo 3 · El orden por carpetas NO funciona, en ninguna dirección

```
   migrations/20260908000002 hace:
     REVOKE EXECUTE ON FUNCTION fn_registrar_orden_upgrade(...)
     REVOKE EXECUTE ON FUNCTION fn_marcar_password_cambiada()

   Esas funciones las crean:
     scripts/tarea26-upgrade-pack.sql
     scripts/tarea25-contrasena-por-socio.sql
```

```
   ❌ migrations → scripts
      El REVOKE falla (la función no existe todavía).
      Y si se ignora el error, la función se crea después
      con EXECUTE abierto a PUBLIC, que es el defecto de
      Supabase. Queda ABIERTA sin que nadie lo note.

   ❌ scripts → migrations
      tarea19 pisaría a tarea26. Se pierde el upgrade.

   ✅ Orden CRONOLÓGICO real, mezclando las dos carpetas.
```

## 🔴 Hallazgo 4 · EL SISTEMA NO ARRANCA · el callejón sin salida

**Este es el que habría hecho fracasar el arranque el mismo día.**

```
   Ningún archivo siembra el PRIMER ciclo.
   El único INSERT INTO ciclo está DENTRO de
   fn_ejecutar_cierre_ciclo: abre el mes siguiente
   DESPUÉS de cerrar uno. En una base nueva no hay
   ninguno que cerrar.

   Ningún archivo crea la cuenta del ADMIN.
   El único INSERT INTO socio está DENTRO de
   fn_registrar_afiliacion_socio, que exige ser admin.
```

```
   Para crear un socio          →  hay que ser admin
   Para ser admin               →  hace falta un socio con rol admin
   Para registrar cualquier cosa→  hace falta un ciclo abierto
   Para tener un ciclo abierto  →  hay que cerrar uno anterior
```

**Instalado con los 22 archivos, el sistema queda inservible.** Hay que
escribir el arranque a mano, y no existe en ninguna parte.

```
   El instalador DEBE crear:
   · El primer ciclo, abierto, del mes de instalación
   · El socio admin, con rol 'admin' y su cuenta en auth.users

   🔴 Ambos por SQL directo, no por las funciones:
      las funciones exigen justo lo que todavía no existe.
```

## 🔴 Hallazgo 5 · Las fotos apuntan al proyecto DEMO

```
   migrations/20260906000004 fija las 8 imagen_url a:
   https://utlohnidkuvxqppmoevj.supabase.co/storage/...
```

En un proyecto nuevo **funcionaría por casualidad**, mientras la demo siga viva.
El día que se borre o se pause, la web pública de Máximo se queda sin fotos:
la landing lee `imagen_url` de la base.

```
   🔴 Producción NO puede depender de la base de pruebas.

   El instalador debe:
   1 · Subir las 8 fotos al bucket del proyecto NUEVO
   2 · Construir imagen_url con la URL de ESE proyecto,
       no escrita a mano
```

## 🔴 Hallazgo 6 · Nada es idempotente

```
   22 CREATE TABLE · 0 con IF NOT EXISTS
   Las semillas de config, pack, rango, nivel_comision,
   producto, punto_entrega y pack_comision_especial
   NO llevan ON CONFLICT.
```

```
   Si la instalación falla a la mitad, no se puede reintentar:
   hay que borrar el proyecto y empezar de cero.

   El instalador debe poder correrse dos veces sin romper
   ni duplicar.
```

## ✅ Lo que SÍ está bien — no lo toques

```
   · Ningún script re-otorga permisos a `anon`
     (el endurecimiento de la TAREA-28 no se deshace)

   · Las firmas de las funciones coinciden con lo que
     revocan las migraciones. No hay desajuste.

   · Los datos semilla están cubiertos:
     config · pack · rango · nivel_comision · producto
     punto_entrega · pack_comision_especial
```

---

# BLOQUE 1 · RESCATAR LAS 4 FUNCIONES PERDIDAS

```
   Para cada una:
   1 · SELECT pg_get_functiondef(oid) de la base actual
   2 · Guardarla en un archivo con su fecha real
   3 · Incluir sus GRANT y REVOKE
```

```
   🔴 fn_validar_pack_solicitud es un TRIGGER.
      Hace falta la función Y el CREATE TRIGGER sobre
      solicitud_afiliacion. Sin el trigger, la función
      existe y no se dispara nunca.
```

**Al terminar, repite el barrido: las 25 funciones deben tener archivo.**

**Commit.**

---

# BLOQUE 2 · EL BARRIDO DE TODO LO DEMÁS

Yo solo comprobé funciones. **Falta comprobar el resto con el mismo método:**
listar lo que hay en la base y buscar si está en algún archivo.

```
   Tablas            23
   Políticas RLS     49
   Triggers           9
   Vistas             ?
   Índices y UNIQUE   ?
   Extensiones        ?
   Buckets            2 (vouchers · productos) + sus políticas
```

```
   🔴 Los buckets son los que más se olvidan y los que más
      tardan en descubrirse: el sistema arranca perfecto y
      falla el día que alguien sube su primer voucher.
```

**Lista lo que falte. NO lo arregles todavía — primero el inventario completo.**

**Commit del inventario.**

---

# BLOQUE 3 · EL INSTALADOR EN UN SOLO SITIO

```
   supabase/instalador/
     00-extensiones.sql
     01-esquema.sql
     02-funciones.sql       ← las 25, en orden cronológico
     03-triggers.sql
     04-rls-y-grants.sql
     05-storage.sql         ← los 2 buckets y sus políticas
     06-semilla.sql
     07-admin.sql
```

```
   🔴 El 04 va DESPUÉS del 02. Los permisos se ajustan
      cuando todas las funciones ya existen. Es justo el
      error del hallazgo 3.
```

## Mi propuesta de orden cronológico — **verifícala, no la asumas**

```
   1 · migrations 20260828000001 a 000005
   2 · scripts    retiros-funciones · storage-vouchers
   3 · scripts    tarea16 · tarea17 · tarea18 · tarea19 · tarea20
   4 · migrations 20260906000001 a 000004
   5 · scripts    tarea25 · tarea26
   6 · las 4 funciones rescatadas del bloque 1
   7 · migrations 20260908000001 a 000004
```

```
   🔴 Esto lo deduje de las fechas de los nombres y de la
      bitácora. NO lo tomes por bueno: contrástalo con
      05-CONTROL/BITACORA.md y con el orden de los commits.
      Si algo no encaja, dilo antes de construir nada.
```

## Reglas del instalador

```
   · NADA de datos de prueba. Ni una orden, ni una comisión,
     ni un ciclo cerrado, ni un socio que no sea el admin.

   · 🔴 EL ARRANQUE (hallazgo 4), por SQL directo:
       - UN ciclo abierto, el del mes de instalación,
         calculado con date_trunc, no escrito a mano
       - EL SOCIO ADMIN con rol 'admin' y su fila en
         auth.users, creada igual que lo hace
         fn_registrar_afiliacion_socio
     Sin esto el sistema no arranca. Es el bloque que
     no existía en ninguna parte.

   · 🔴 LAS 8 FOTOS (hallazgo 5):
       - subirlas al bucket del proyecto NUEVO
       - imagen_url construida con la URL de ESE proyecto
       - 🔴 cero apariciones de 'utlohnidkuvxqppmoevj'
         en todo el instalador

   · 🔴 IDEMPOTENCIA (hallazgo 6):
       - CREATE TABLE IF NOT EXISTS
       - ON CONFLICT DO NOTHING en todas las semillas
       - correrlo dos veces no debe romper ni duplicar

   · 🔴 NINGUNA contraseña escrita en los archivos.
     El instalador la genera y la muestra una vez, igual
     que fn_registrar_afiliacion_socio con los socios.
     Si el instalador lleva una clave escrita, acabamos de
     reinventar el problema que cerró la TAREA-25.
```

**Commit.**

---

# BLOQUE 4 · 🔴 EL ENSAYO

**Sin ensayo, el instalador es una teoría.**

```
   1 · Crear un proyecto Supabase NUEVO y vacío
       (de prueba, NO el de producción)
   2 · Correr el instalador de principio a fin
   3 · Apuntar el backoffice ahí y recorrer el negocio entero
```

## El recorrido completo

```
   0 · 🔴 Hay UN ciclo abierto y UNA cuenta admin
       nada más terminar el instalador, sin tocar nada
       ← si esto falla, el hallazgo 4 no se resolvió
   a · Entra el admin con la clave que dio el instalador
   b · Registra un socio → recibe sus credenciales
   c · El socio entra y cambia su contraseña
   d · Se le registra una recompra con productos y voucher
   e · Se confirma el pago → se acreditan sus puntos
   f · Se afilia un segundo socio BAJO el primero
   g · Compra lo suficiente para activarse
   h · Se cierra el ciclo
   i · 🔴 El patrocinador COBRÓ su comisión
   j · El dinero aparece en su billetera
   k · Se abre el ciclo siguiente, y hay UNO solo abierto
   l · 🔴 La ficha de un producto muestra su foto, servida
       desde el bucket del proyecto NUEVO
       ← si la URL lleva 'utlohnidkuvxqppmoevj', el
         hallazgo 5 no se resolvió
   m · 🔴 Correr el instalador OTRA VEZ sobre el mismo
       proyecto no rompe nada ni duplica filas
       ← el hallazgo 6
```

```
   🔴 Si algo de la a a la k falla: se anota qué faltó,
      se agrega al instalador, y se REPITE EL ENSAYO DESDE
      CERO en OTRO proyecto limpio.

      NO se parchea el proyecto de ensayo a mano.
      Parchear a mano es exactamente lo que nos trajo hasta
      aquí: un esquema que nadie sabe reproducir.
```

## Lo que hay que reportar del proyecto nuevo

```
   funciones    25      tablas       23
   políticas    49      triggers      9
   config       39      packs         5
   rangos       16      productos     8
   buckets       2      ciclos abiertos  1
   socios        1 (solo el admin)
   órdenes · comisiones · wallet · red_ancestro   TODOS EN 0
```

**Commit.**

---

# BLOQUE 5 · EL MANUAL

`supabase/instalador/COMO-INSTALAR.md`, corto, para seguir sin acordarse de nada:

```
   1 · Crear el proyecto en Supabase
   2 · Correr los 8 archivos EN ORDEN
   3 · Guardar la contraseña del admin
   4 · Poner las variables en Vercel (los DOS proyectos)
   5 · 🔴 Cambiar url_landing en P-26 al dominio real
   6 · Recorrer las 11 pruebas de la a a la k
```

```
   🔴 El punto 5 rompe el negocio en silencio si se olvida:
      los enlaces de referido de TODOS los socios seguirían
      apuntando a vercel.
```

**Commit.**

---

# LO QUE NO SE TOCA

```
   ❌ La base de DEMO (utlohnidkuvxqppmoevj) — es lo que
      Jack le va a enseñar a Máximo. Se queda intacta.
   ❌ Los 509 socios, sus órdenes y sus comisiones
   ❌ El código de la aplicación — esta tarea es SQL y
      documentación
   ❌ La landing
```

> **El ensayo va en un proyecto NUEVO.** Si esta tarea te lleva a escribir en
> `utlohnidkuvxqppmoevj`, está mal enfocada. Para y pregunta.

---

# POR QUÉ ESTO IMPORTA MÁS QUE NINGUNA OTRA TAREA

```
   El primer socio real tiene que nacer en una base limpia.
   No hay vuelta atrás.
```

Si entra en la demo, su red cuelga de 509 socios inventados y sus comisiones se
calculan sobre un histórico que nunca ocurrió. Separarlos después no es "borrar
los de prueba": es cirugía sobre `red_ancestro`, `comision` y cierres ya
ejecutados.

**Esta tarea es lo que permite decirle a Máximo "empecemos" sin miedo.**
