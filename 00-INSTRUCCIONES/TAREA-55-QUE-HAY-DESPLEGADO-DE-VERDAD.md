# TAREA-55 · Qué hay desplegado de verdad

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE + SITIO WEB
**Gravedad:** 🔴 PRODUCCIÓN · un socio puede estar viendo mal su dinero AHORA
**Fecha:** 20 de septiembre de 2026

---

# POR QUÉ EXISTE ESTA TAREA

Todo lo que hemos verificado esta semana fue **en el repositorio y en la base de
datos**. Nadie ha comprobado **qué está publicado**.

```
   La base de PRODUCCIÓN ya paga el patrocinio
   al instante. Lo verifiqué: fn_confirmar_orden_pago
   tiene la lógica nueva, con md5 idéntico en las
   dos bases.

   Las pantallas que acompañan ese cambio
   —P-19, P-14, P-25— están en el repositorio.

   ¿Están en app.maxglobaloficial.com?
```

```
   🔴 SI LA RESPUESTA ES NO:

   La base abona el patrocinio hoy. La P-19 vieja
   suma ese mismo dinero dentro del "estimado del
   ciclo".

   El socio ve su plata DOS VECES. Pide un retiro
   por un saldo que no tiene, y a Máximo le llega
   el reclamo.
```

**Esta tarea no escribe código. Mide.**

---

# BLOQUE 1 · 🔴 QUÉ VERSIÓN ESTÁ PUBLICADA

Para los **dos** despliegues, `app.maxglobaloficial.com` y
`maxglobaloficial.com`:

```
   · el commit que está publicado ahora mismo
   · la fecha y hora de ese despliegue
   · cuántos commits tiene el repositorio POR DELANTE
     de lo publicado, y cuáles son
```

```
   🔴 No me digas "está actualizado".
      Pégame el hash del commit publicado y el
      hash de la rama. Si no son el mismo, dime
      qué hay en medio.
```

---

# BLOQUE 2 · 🔴 LA COMPROBACIÓN QUE IMPORTA

En **producción**, con el navegador, no con una prueba local:

```
   1 · Busca un socio que tenga al menos una comisión
       de patrocinio en estado 'abonada' en el ciclo
       abierto. Si no existe ninguna, dilo y para:
       significa que el cambio no ha corrido todavía
       con datos reales.

   2 · Entra a su P-19 Mi Billetera.

   3 · Compáralo:

         saldo de la billetera
         estimado del ciclo
         suma de sus 'abonada'
         suma de sus 'confirmada'
```

```
   🔴 LA INVARIANTE:

   el estimado del ciclo NO debe incluir
   ni un céntimo de las 'abonada'

   Si las incluye, el socio ve su dinero dos veces
   y eso se corrige HOY, antes que ninguna otra cosa.
```

Haz lo mismo con **P-14 Mis Comisiones** (que distinga los cuatro estados) y
con **P-25 Vista previa del cierre** (que desglose lo ya abonado).

Capturas de las tres, de producción.

---

# BLOQUE 3 · 🟠 LA LANDING, DESPUÉS DE LA TAREA-52

Tu informe de la 52 lo verifiqué y está bien. Queda comprobar que **está
publicado y que funciona con las variables de producción**.

```
   1 · Abre maxglobaloficial.com/registro?ref=<un código real>
       · ¿sale el campo bloqueado?
       · ¿sale "Te invitó el socio ..."?

   2 · Abre maxglobaloficial.com/registro sin ref
       · ¿el campo es editable?

   3 · El botón Ingresar de la cabecera
       · ¿a dónde lleva EXACTAMENTE?
```

## 🔴 Y aquí hay un riesgo que tú mismo creaste

`URL_BACKOFFICE` sale de `VITE_BACKOFFICE_URL` y **no tiene respaldo** — eso
está bien, es lo que pedí. Pero el botón se pinta siempre:

```jsx
   SiteHeader.jsx:201   href={URL_BACKOFFICE}
   SiteHeader.jsx:314   href={URL_BACKOFFICE}
```

```
   Si esa variable no está cargada en Vercel, el
   botón sale igual, con href vacío. El socio hace
   clic, no pasa nada, y llama a Máximo.

   Te lo advertí en el mensaje de la tarea y no
   está puesto.
```

Dos cosas:

```
   a · Comprueba en Vercel que VITE_BACKOFFICE_URL
       existe en el despliegue de producción de la
       landing. Pégame la captura.

   b · Que el botón NO se pinte si la variable
       viene vacía. En la cabecera y en el pie.
```

---

# BLOQUE 4 · 🟡 LO QUE FALTA POR PUBLICAR

Después de medir, dime en una lista:

```
   · qué cambios están en el repositorio y NO en
     producción, de los dos proyectos
   · cuáles de esos tocan dinero o lo que ve el socio
   · en qué orden habría que publicarlos
```

**No publiques nada todavía.** Primero quiero ver la lista.

---

# LO QUE NO ENTRA

```
   🔵 No arregles nada del Bloque 2 en esta tarea.
      Si encuentras que el socio ve el dinero dos
      veces, me lo dices y abrimos una tarea con
      eso solo. Medir y arreglar a la vez es como
      se nos escaparon las cosas.

   🔵 El único arreglo que SÍ entra es el b del
      Bloque 3, porque es una línea y es tuyo.
```

---

# LO QUE TIENES QUE REPORTAR

```
· Los hashes: publicado vs rama, de los dos proyectos
· Las cuatro cifras del socio real, de producción
· Si la invariante se cumple o no · en la PRIMERA línea
· Capturas de P-19, P-14 y P-25 en producción
· Las tres comprobaciones de la landing
· La captura de las variables de Vercel
· La lista de lo que falta publicar, en orden
```

```
   🔴 Y una cosa sobre tus informes.

   En las últimas cinco tareas, cinco veces me has
   dado números de línea o firmas que no coinciden
   con tus propios archivos. La última: dijiste
   config.js:46 y es config.js:66.

   El código lo escribes bien. El informe es lo
   único que yo uso para verificar. Cuando el
   informe es falso, tu trabajo bueno no vale,
   porque no hay forma de confirmarlo.

   Antes de mandarme una línea, ábrela.
```

Si algo no cuadra, para y dilo.
