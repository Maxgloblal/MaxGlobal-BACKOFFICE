# TAREA-59 · Analizar antes de tocar las imágenes

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🟠 Toca el comprobante de pago · se analiza antes de escribir
**Fecha:** 23 de septiembre de 2026

---

# 🔴 ESTA TAREA NO ESCRIBE CÓDIGO

```
   Se analiza. Se reporta. Se para.

   La implementación va en una tarea aparte,
   después de leer lo que encuentres.
```

Es a propósito. Esto toca el comprobante de pago, que es la prueba de que
alguien pagó, y el catálogo que ve todo el mundo.

---

# ANTES DE NADA, LEE

```
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md
     sección "Tratamiento de imágenes al subirlas"
     RF-537 a RF-545 · escritos hoy

   05-CONTROL/LECCIONES-Y-PATRONES.md
```

Los requisitos ya están escritos. **No los inventes ni los cambies**; si alguno
te parece imposible o mal planteado, dilo en el informe.

---

# LO QUE YA SÉ · verificado hoy

```
   VOUCHER · CampoArchivoVoucher.jsx:65
     accept   image/jpeg, image/png, image/webp, application/pdf
     límite   5 MB · operacionAdmin.js:1634
     bucket   5 MB · 05-storage.sql

   PRODUCTO · P32GestionProductos.jsx:894
     accept   image/jpeg, image/png, image/webp
     límite   ninguno en el cliente
     bucket   2 MB · 05-storage.sql

   Ninguno de los dos convierte ni redimensiona nada.
```

---

# LO QUE TIENES QUE AVERIGUAR

## 1 · Por dónde pasa de verdad una imagen

Sigue el recorrido completo, **archivo y línea**, desde que el usuario elige el
archivo hasta que queda en el bucket. Los dos caminos, voucher y producto.

```
   ¿Sube el navegador directo a Storage?
   ¿Pasa por una Edge Function?
   ¿Hay algún sitio donde ya se toque el archivo?
```

## 2 · Qué se rompería si el archivo cambia de tipo

```
   · ¿Se guarda el nombre o la extensión en la base?
     ¿En qué columna, de qué tabla?
   · ¿Hay algo que asuma .jpg o .png al mostrarlo?
   · Las imágenes YA subidas, ¿siguen funcionando
     si el código nuevo espera .webp?
```

```
   🔴 Esta es la pregunta que más importa.

   Hay vouchers y fotos de producto ya guardados
   en las DOS bases. Lo que se construya no puede
   romper lo que ya está.
```

## 3 · Qué navegadores usan de verdad

Máximo y sus socios trabajan desde el celular.

```
   ¿Qué formatos puede convertir un canvas en
   Chrome de Android y en Safari de iPhone?

   ¿Qué pasa con un HEIC de iPhone?

   ¿Y con una foto de 12 megapíxeles en un
   teléfono de gama baja? ¿Se queda colgado?
```

Pruébalo, no lo deduzcas.

## 4 · Los tres sitios donde viven los límites

```
   operacionAdmin.js:1634       5 MB
   05-storage.sql               5 MB y 2 MB
   las DOS bases                los buckets ya creados
```

```
   Si se cambia el límite, hay que cambiarlo en
   los tres. El instalador arreglado NO cambia
   un bucket que ya existe.

   Dime exactamente qué habría que ejecutar en
   cada base, sin ejecutarlo.
```

## 5 · Cuánto se gana de verdad

Coge **cinco fotos reales** de las que ya están subidas y conviértelas a WebP
calidad 92, en tu máquina.

```
   Para cada una, en una tabla:
     peso antes · peso después · dimensiones
     y si se nota la diferencia mirándolas
```

```
   🔴 Si en alguna el WebP sale MÁS PESADO que
      el original, dilo. Pasa con imágenes muy
      pequeñas o con mucho texto plano, y
      cambiaría la decisión.
```

## 6 · Qué recomiendas

Con todo lo anterior en la mano:

```
   · ¿Convertir en el navegador o en el servidor?
   · ¿Qué calidad exacta?
   · ¿Hay que tocar los límites de los buckets,
     o convertir los hace innecesarios?
   · ¿Qué riesgo tiene esto que yo no haya visto?
```

---

# LO QUE TIENES QUE REPORTAR

```
· El recorrido completo de los dos caminos,
  con archivo:línea
· Qué se rompería · en la PRIMERA línea si
  encuentras algo
· La prueba de navegadores, ejecutada
· Las cinco fotos con sus pesos reales
· Los comandos que harían falta en cada base,
  SIN ejecutar
· Tu recomendación, con el porqué
```

```
   🔴 Si un requisito del RF-537 al RF-545 no se
      puede cumplir como está escrito, dilo. Se
      reescribe el requisito, no se implementa
      a medias.
```

No escribas código. Cuando tenga tu análisis, decidimos y te mando la tarea de
implementación.
