# TAREA-48 · El límite de las mil filas

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 La vista previa del cierre muestra menos de lo que se paga
**Fecha:** 17 de septiembre de 2026
**Viene de:** TAREA-47

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
```

**Tú encontraste esto.** El diagnóstico de la TAREA-47 fue correcto y el arreglo
también: las seis cifras del histórico coinciden al centavo con la base.

Lo que sigue es aplicar ese mismo hallazgo donde todavía no se aplicó. Es el
patrón 2 del documento de lecciones: **arreglar el patrón, no el caso**.

---

# EL PATRÓN

```
   PostgREST devuelve como máximo 1,000 filas
   cuando no se pagina con .range().

   No falla. No avisa. Solo devuelve menos.
```

Tablas que **hoy** ya pasan ese límite en la DEMO:

```
   red_ancestro   3,972 filas
   comision       2,423 filas
   orden          1,059 filas
```

---

# BLOQUE 1 · 🔴 LA VISTA PREVIA DEL CIERRE

`src/servicios/operacionAdmin.js:564`, dentro de `obtenerVistaPreviaCierre`:

```js
.from('comision')
  ...
  .eq('ciclo_id', cId);
```

Sin paginar. **El ciclo 1 tiene 1,356 comisiones: la vista previa lee 1,000.**

```
   Máximo abre la pantalla de cierre.
   Ve un total que le falta dinero.
   Lo aprueba.

   El cierre corre en Postgres, que NO tiene ese
   límite, y paga el total completo.

   Aprobó un número y pagó otro.
```

Es el mismo problema de los dos motores de la TAREA-46, entrando por otra
puerta. Y esta vez no es que calculen distinto: es que **uno de los dos lee
menos datos de los que existen**.

Se arregla con el `consultarPaginado` que ya escribiste.

---

# BLOQUE 2 · LAS OTRAS DOS DEL MISMO ARCHIVO

```
   operacionAdmin.js:776    .eq('ciclo_id', cId - 1)
                            comparación con el ciclo anterior

   operacionAdmin.js:1405   .eq('ciclo_id', cId)
                            alimenta los reportes de P-28
```

Las dos truncan igual en cualquier ciclo con más de 1,000 comisiones.

---

# BLOQUE 3 · EL BARRIDO COMPLETO

Hice un barrido y salieron **21 consultas en código de producción** (sin contar
pruebas) que leen tablas capaces de pasar las 1,000 filas sin paginar, sin
`limit`, sin `single` y sin `count`.

```
   motor/persistenciaRango.js:62      socio
   servicios/operacionAdmin.js        105, 134, 464, 564, 621, 689,
                                      716, 776, 857, 1124, 1157,
                                      1382, 1405, 1456, 2512
   servicios/socio.js                 110, 119, 268, 486, 506
```

```
   🔴 NO las paginues todas a ciegas.
```

Muchas están acotadas por su filtro y nunca pasarán de 1,000: pedir los
ancestros de UN socio devuelve su línea ascendente, que son diez o veinte filas.
Paginar eso no aporta nada y ensucia el código.

## Lo que sí hay que hacer, una por una

Para cada línea de esa lista, responde **con el filtro delante**:

```
   ¿Puede esta consulta devolver más de 1,000 filas
   algún día, con la red creciendo?
```

```
   SÍ  →  paginar con consultarPaginado
   NO  →  dejarla, y escribir en una línea POR QUÉ
          está acotada
```

Quiero la lista de las 21 con su veredicto y su motivo. **Ese documento vale más
que el arreglo**, porque es lo que evita que alguien vuelva a escribir una
consulta sin paginar dentro de seis meses.

## Una que ya sé que va a doler

```
   servicios/socio.js:486    .eq('ancestro_id', socioId)
```

Devuelve **todos los descendientes** de un socio. Hoy Máximo tiene 517, así que
no trunca. **Pero el objetivo del negocio es pasar de 1,000.**

El día que la red llegue a mil personas, la pantalla *Mi Red* empezará a mostrar
una red incompleta, sin avisar. Y nadie lo va a relacionar con esto.

---

# BLOQUE 4 · QUE NO SE REPITA

Dos cosas, y la segunda importa más que la primera:

**1 · Un aviso en el helper.** Que `consultarPaginado` registre en consola
cuando traiga más de un lote, para que se vea cuándo se está cerca del límite.

**2 · Una prueba de invariante**, que no dependa de cifras escritas a mano:

```
   Para cada ciclo cerrado:
     la suma de comisiones que devuelve el servicio
     es IGUAL a la suma que devuelve un count/sum
     directo sobre la tabla
```

Si algún día alguien mete una consulta sin paginar, esa prueba se pone roja sola.

```
   🔴 NO fijes 1,356 ni 66,137.40 en la prueba.
      Esas cifras cambian cuando entra una venta.
      Es el patrón 3 del documento de lecciones.
```

---

# LO QUE TIENES QUE REPORTAR

```
· La vista previa del ciclo 1 ANTES y DESPUÉS
  del arreglo, con su total
· La lista de las 21 consultas, cada una con
  PAGINADA o ACOTADA, y el motivo en una línea
· La prueba de invariante, con su salida
· La suite completa en verde
```

Si algo de esta tarea no cuadra con lo que ves, para y dilo antes de tocar nada.
