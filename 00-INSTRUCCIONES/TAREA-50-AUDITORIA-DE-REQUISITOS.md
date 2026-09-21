# TAREA-50 · Auditoría de requisitos

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE + SITIO WEB
**Gravedad:** 🟠 No arregla código · arregla la forma de verificar
**Fecha:** 17 de septiembre de 2026
**Orden:** DESPUÉS de la TAREA-49, no antes

---

# POR QUÉ EXISTE ESTA TAREA

```
   366 requisitos
   373 marcados ✅
     7 pendientes
```

Y sin embargo, en tres días encontramos que el motor tiraba comisiones, que la
vista previa leía 1.000 filas de 1.356, que un admin podía borrar dinero y que
la función de rango nunca se instaló.

```
   🔴 Las marcas ✅ no son evidencia de nada.
```

Caso concreto, verificado:

```
   RF-441 · "El sistema DEBE calcular la activación
             de cada socio EN CADA CIERRE"        ✅

   El código lo calcula en el instante de cada orden.
   Marcado como cumplido durante semanas.
```

**No estábamos verificando el código contra los requisitos. Estábamos
comparando código no verificado contra requisitos no verificados.**

---

# LO QUE YA ENCONTRÉ · ARRÉGLALO Y BUSCA MÁS COMO ESTO

## A · Funcionalidad sin ningún requisito

```
   El pago directo a socios (TAREA-43) no tiene RF.
   Ni uno.
```

Una pantalla que mueve dinero, construida, probada e instalada, **sin que exista
un documento que diga qué debe hacer**. No se puede verificar contra nada.

Escribe los RF que le faltan, en `10-RF-PANEL-ADMIN.md`, a partir de lo que el
código hace hoy **y de lo que la TAREA-43 dice que debía hacer**. Si los dos no
coinciden, repórtalo antes de escribir.

## B · Requisitos que fueron falsos mientras estaban en ✅

```
   RT-34 · Los registros de puntos DEBEN ser append-only    ✅
   RT-35 · Los registros de comisiones DEBEN ser append-only ✅
```

Hasta el 16/09 un administrador podía borrarlos. Hoy es cierto gracias a la
TAREA-44, pero estuvo marcado como cumplido siendo falso.

**Añade a cada uno la línea que lo garantiza hoy**, para que se pueda volver a
comprobar:

```
   04-rls-y-grants.sql:307  GRANT SELECT ON wallet_movimiento
```

## C · Requisitos con cifras que caducan

```
   RF-120 · "debe mostrar los 8 productos"
   RF-230 · "debe mostrar los 8 productos"
```

Máximo edita productos desde P-32. **El día que suba el noveno, esos dos
requisitos son falsos**, y cualquier prueba derivada de ellos se cae.

Reescríbelos sin la cifra: *"debe mostrar todos los productos activos"*.

```
   🔴 OJO, no todos los números están mal:

   ✅ "los 5 packs" · "los 16 rangos" · "los 10 niveles"
      son regla de negocio, confirmada por Máximo.
      NO los toques.

   🔴 "los 8 productos" · conteos de socios · de órdenes
      crecen con el uso. Fuera.
```

Es el patrón 1 del documento de lecciones, **dentro del documento que debería
ser la fuente de verdad**.

## D · Requisitos que describen código que ya no existe

```
   RF-187 · metadatos "generados desde config.js"   ✅
```

Falso desde la TAREA-23. Verificado: `scripts/prerender.mjs:10` lee de
`src/data/productos-generado.json`.

---

# EL TRABAJO · UNA TABLA, NO UN INFORME

Para cada requisito, una fila:

```
   RF-xxx | el texto | archivo:línea que lo cumple | veredicto
```

Los cuatro veredictos posibles:

```
   ✅ CUMPLE
      con su archivo:línea pegado. Sin línea, no cuenta.

   🔴 NO CUMPLE
      el código hace otra cosa. Di QUÉ hace.
      NO lo arregles en esta tarea: solo repórtalo.

   ⚠ CADUCA
      el requisito es correcto hoy pero tiene una cifra
      o un nombre que va a envejecer. Reescríbelo.

   ❓ SIN CÓDIGO
      no encuentras qué lo implementa. Dilo.
      Puede que sea funcionalidad que nunca se hizo.
```

```
   🔴 "Lo revisé y está bien" NO es un veredicto.
      Sin archivo:línea, es ✅ sin evidencia, que es
      exactamente lo que nos trajo hasta aquí.
```

---

# EL ORDEN · LO QUE TOCA DINERO PRIMERO

No son 366 de golpe. Van por tandas, y **me reportas cada una antes de seguir**:

```
   TANDA 1 · 11-RF-MOTOR-Y-SISTEMA.md
             116 requisitos · el motor de comisiones
             Es donde está el dinero. Empieza aquí.

   TANDA 2 · 10-RF-PANEL-ADMIN.md
             94 requisitos · lo que opera Máximo

   TANDA 3 · 09-RF-BACKOFFICE-SOCIO.md
             80 requisitos · lo que ve el socio

   TANDA 4 · 08-RF-WEB-PUBLICA.md
             76 requisitos · la landing
```

Si en la tanda 1 aparecen más de tres 🔴, **para y avísame**. Significa que hay
que arreglar antes de seguir auditando.

---

# LO QUE NO HAY QUE HACER

```
   🔴 NO arregles el código en esta tarea.
      Encontrar y arreglar a la vez es como se nos
      escaparon las cosas. Primero el inventario
      completo, después decidimos qué se arregla.

   🔴 NO marques ✅ para cerrar filas.
      Un ❓ honesto vale más que un ✅ inventado.
      Patrón 10 del documento de lecciones.

   🔴 NO inventes RF nuevos salvo en el punto A.
      Si crees que falta uno, anótalo aparte.
```

---

# LO QUE TIENES QUE REPORTAR

```
· La tabla de la tanda 1, completa, con archivo:línea
· El conteo: cuántos ✅ · 🔴 · ⚠ · ❓
· Los RF nuevos del pago directo
· Los RF reescritos sin cifras que caducan
· Si la TAREA-49 cambió algún RF, que quede reflejado
```

Cuando esté la tanda 1, la reviso yo contra la base y el código antes de que
sigas con la 2.

```
   Esta tarea no arregla nada hoy. Lo que arregla es
   que dentro de un mes podamos decir "está bien" y
   que signifique algo.
```
