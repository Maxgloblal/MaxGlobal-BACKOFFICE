# TAREA-31 · QA PANTALLA POR PANTALLA

**Para:** Antigravity
**Escrita:** 8 de septiembre de 2026
**Fase:** corrección de bugs · barrido completo

> ## 🔴 ESTA TAREA NO ARREGLA NADA
>
> **Solo observa y reporta.** No toques una línea de código.
> Si encuentras algo roto, lo anotas y sigues. Las correcciones salen después,
> en una sola tarea, cuando esté el cuadro completo.
>
> Si al terminar `git diff` no está vacío, la tarea se hizo mal.

---

## 🔴 POR QUÉ NO TE DOY LOS NÚMEROS ESPERADOS

Ya pasó tres veces en este proyecto: se corrió una consulta *parecida* a la
pedida, o se reportó lo que se esperaba ver en vez de lo que había.

```
   TAREA-12   verificó el ciclo 3 en vez del recién cerrado
   TAREA-19   corrió un chequeo de huérfanos en vez del pedido
   TAREA-26   pegó "3 (Pack Gold)" donde la consulta devuelve "3"
```

**Por eso acá no van los valores esperados.** Yo los tengo medidos contra
Postgres. Tú reportas lo que la pantalla muestra, yo comparo.

```
   ❌ "P-20 muestra los socios correctamente"
   ✅ "P-20 · Total de socios: 509"
```

**Número exacto o cita literal. Nunca un juicio.**

---

# CÓMO SE REPORTA CADA PANTALLA

```
   P-XX · nombre
   Captura:  [imagen, no descripción]
   Datos:    cada cifra que muestra, con su etiqueta
   Consola:  errores en rojo, si los hay (copiados literal)
   Red:      cualquier petición que no sea 200
   Roto:     lo que no funciona al usarlo
```

---

# BLOQUE A · LAS 10 DEL SOCIO

Entra como `socio001@ejemplo.test` (es MÁXIMO ADMIN, tiene rol admin y
también ve el backoffice de socio).

```
   P-10  Login          ¿entra? ¿el "olvidé mi contraseña" abre?
   P-11  Inicio         ciclo mostrado · puntos personales ·
                        avance a 70 · días al cierre
   P-12  Mi red         frontales directos · descendientes totales
   P-13  Tienda         cuántos productos · precio público y de
                        socio del Café · avance de puntos del carrito
   P-14  Comisiones     cada comisión: TIPO, NIVEL y MONTO
                        🔴 copia el tipo literal como aparece
   P-15  Mi rango       rango · puntos grupales · computables
   P-16  Mi enlace      la URL completa, tal cual
   P-17  Mis pedidos    cuántos · qué pasa con uno sin comprobante
   P-18  Mi perfil      pack · ¿el correo es editable? ·
                        ¿"Mejorar pack" qué packs ofrece?
   P-19  Mi billetera   saldo · los últimos 3 movimientos con su signo
```

## 🔴 En P-14, lo más importante de este bloque

```
   Entra también como KARLA (MG00012) y mira el CICLO 6.

   Copia LITERAL cómo se llama esa comisión en pantalla.
   No la interpretes. Solo cópiala.
```

---

# BLOQUE B · LAS 13 DEL ADMIN

```
   P-20  Tablero        cada tarjeta con su cifra
   P-21  Registrar
        pedido          precio con socio vs. "venta a cliente"
                        ¿el total cuadra con las líneas?
   P-22  Registrar
        afiliación      ¿muestra credenciales? ¿se repiten
                        entre dos registros seguidos?
   P-23  Bandeja        cuántas pendientes
   P-24  Envíos         qué muestra
   P-25  Cierre         ciclo mostrado
                        🔴 DESCARGA EL EXCEL Y ÁBRELO
                           di cuántas filas trae
   P-26  Configuración  cuántas claves · valor_punto_comision ·
                        linea_estirada_pct · url_landing
   P-27  Socios         total · el filtro "Activos" cuántos da ·
                        cómo se nombra el ciclo
   P-28  Reportes       qué muestra
   P-29  Auditoría      cuántos registros · qué acciones distintas
   P-30  Retiros        cuántas solicitudes
   P-31  Solicitudes    🔴 ver abajo, es la más importante
   P-32  Productos      cuántos activos · ¿hay botón de BORRAR?
```

---

# 🔴 P-31 · LA PRUEBA CRÍTICA DE TODA LA TAREA

Encontrado el 8/09. **Afecta el camino por el que entra un socio desde la web,
que es el camino principal del negocio.**

```
   La tabla solicitud_afiliacion guarda `pack_codigo` como
   texto libre. NADIE lo valida contra la tabla `pack`.
```

## Lo que hay que hacer

```
   1 · Lista los pack_codigo DISTINTOS que hay en
       solicitud_afiliacion, con su conteo

   2 · Compara cada uno contra pack.codigo
       ¿cuáles NO existen?

   3 · Busca las solicitudes REALES
       (las que NO terminan en @ejemplo.test)
       Hay pocas. Dime cuántas y con qué pack_codigo.

   4 · 🔴 A una solicitud real cuyo pack NO exista en la tabla,
       dale CONVERTIR y reporta cuál de las tres pasa:

       a · convierte bien y le asigna el pack correcto
       b · da error
       c · convierte pero con otro pack, o sin pack
```

```
   🔴 Reporta el resultado. NO lo arregles.
      La corrección depende de cuál de las tres sea,
      y esa decisión la tomamos después.
```

---

# LO QUE NO HAY QUE REPORTAR — ya está verificado

Si ves esto, **es correcto**. No lo anotes como fallo:

```
   · Máximo activo y ganando S/. 0
     Los dos que compraron están a nivel 11 y 12.
     Su pack alcanza 10 niveles. Sin compresión, ese dinero
     se queda en la empresa. Es el plan funcionando.

   · Casi todos "Inactivo (0 pts)" en el ciclo abierto
     La activación se acumula al confirmar cada orden.
     Sin fila = no compró. Ver 05-CONTROL/ESPECIFICACION-ACTIVACION.md

   · El pack "PRO" en P-31
     No existe. Son 123 solicitudes, todas de prueba.
     Es basura, se limpia en la TAREA-28.

   · El enlace de referido apunta a vercel
     Correcto: el dominio aún no se conecta.

   · Los packs no dicen qué productos llevan
     Decisión de negocio cerrada.
```

---

# LAS TRAMPAS — no te avisaré cuáles son

Hay cosas en la lista de arriba que **parecen bugs y no lo son**, y hay al
menos una cifra en el sistema que **parece correcta y no lo es**.

```
   Si reportas todo en verde, la tarea está mal hecha.
   Si reportas como bug algo de la lista de arriba,
   también.
```

**Reporta lo que ves, no lo que crees que debería ver.**

---

# AL TERMINAR

```bash
git status --short
git diff --stat
```

```
   🔴 Los dos deben estar VACÍOS.
      Esta tarea no cambia una sola línea.
```

## El entregable

```
   Un documento con las 23 pantallas, cada una con:
   su captura, sus cifras literales, y qué se rompió al usarla.

   Guárdalo en 00-INSTRUCCIONES/REPORTE-QA-08-09.md
```

**Imágenes, no descripciones.** Una pantalla sin captura no está probada.
