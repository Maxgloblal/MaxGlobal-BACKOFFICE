# TAREA-60 · Convertir las imágenes

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🟠 Toca el comprobante de pago y el catálogo público
**Fecha:** 23 de septiembre de 2026
**Viene de:** tu análisis de la TAREA-59

---

# ANTES DE ESCRIBIR

```
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md
     "Tratamiento de imágenes al subirlas"
     RF-537 a RF-549 · ACTUALIZADOS con tu medición
```

**Los requisitos cambiaron después de tu informe.** Ahora son trece, no nueve.
Léelos antes de tocar nada: lo que implementes se verifica contra ellos.

---

# LO QUE ACEPTÉ DE TU ANÁLISIS

```
   Calidad 85, no 92          · lo mediste, tenías razón
   Reducir a 1600 px          · sin eso se cuelga un
                                celular de gama baja
   Orientación EXIF           · buen hallazgo
   Convertir en el navegador  · de acuerdo
   Si el WebP pesa más, se
   sube el original           · lo descubriste tú
```

# LO QUE NO ACEPTÉ

```
   🔴 Subir los dos buckets a 10 MB. NO.
```

Tu lógica era que si la conversión falla hay que poder subir el original. Para
el comprobante sí. Para el catálogo no:

```
   El catálogo pesa hoy 358 KB entre OCHO fotos.

   Una sola foto de celular sin convertir mete
   4 MB. Diez veces más que todo lo demás junto,
   en el bucket PÚBLICO que carga la landing.

   Y nadie se entera hasta que la web va lenta.
```

Por eso el RF-544 y el RF-545 se comportan al revés a propósito. Está explicado
en el documento.

---

# EL TRABAJO

## 1 · Una sola pieza que convierte

Un módulo, no dos. Lo usan el voucher y el producto.

```
   Recibe   el archivo y qué se quiere de él
   Devuelve el archivo a subir, y si convirtió o no

   Dentro:
     · lee la orientación EXIF y la respeta
     · reduce si se le pide un máximo
     · codifica a WebP calidad 85
     · compara pesos y devuelve el menor
```

```
   🔴 createImageBitmap(file, { imageOrientation: 'from-image' })
      Sin eso los vouchers verticales salen de costado.
```

## 2 · Foto de producto

```
   · máximo 1600 px en el lado mayor
   · WebP calidad 85
   · si el WebP pesa igual o más → sube el original
   · si la conversión FALLA → rechaza y pide otra foto
     NO sube el original
```

El mensaje de rechazo en español y que diga qué hacer. Nada de "error al
procesar".

## 3 · Comprobante de pago

```
   · si cabe en el límite → se sube TAL CUAL
     no se toca, no se reduce, no se convierte
   · si NO cabe → se convierte, sin reducir tamaño
   · si la conversión falla → sube el original
   · PDF → nunca se toca
```

```
   🔴 No reduzcas la resolución de un voucher.

   Ahí hay números de operación pequeños que
   Máximo tiene que leer para confirmar un pago.
```

## 4 · Mientras convierte

Un aviso de que está procesando. La pantalla no se bloquea y el botón de
guardar no se puede pulsar dos veces.

## 5 · Los límites en un solo sitio

```
   operacionAdmin.js:1634    5 MB  voucher
   operacionAdmin.js:2145    2 MB  producto
   05-storage.sql            los dos buckets
```

Que salgan de un solo lugar. **No cambies los valores** — solo que dejen de
estar escritos en tres sitios distintos.

---

# 🔴 LAS DOS PRUEBAS QUE TÚ MISMO ENCONTRASTE

```
   gestion-productos.test.js:227
     "8 · Una foto de 3 MB es rechazada antes de subirse"

   subida-voucher.test.js:102
     "1 · Un archivo de 6 MB es rechazado antes de subirse"
```

Las dos siguen siendo correctas y **no se tocan**. Los límites no cambian, así
que deben seguir pasando tal cual están.

```
   🔴 Si te ves editando un expect para que pase,
      para. Es lo que nos costó tres semanas con
      la cifra quemada del cierre.
```

---

# LAS PRUEBAS NUEVAS

```
   1 · Un PNG con transparencia · sale WebP y la
       transparencia se conserva
   2 · Una foto ya comprimida que engorda en WebP
       · se sube el original
   3 · Una foto vertical con EXIF · no sale de costado
   4 · Una foto de 4000 px · sale a 1600 px
   5 · Un voucher de 300 KB · se sube SIN TOCAR
   6 · Un voucher de 6 MB · se convierte y cabe
   7 · Un PDF · pasa intacto
   8 · Conversión que falla en producto · rechaza
   9 · Conversión que falla en voucher · sube original
```

---

# LO QUE TIENES QUE REPORTAR

```
· El diff completo
· Las 9 pruebas nuevas con su salida
· Las 2 pruebas viejas, en verde y sin tocar
· Una tabla de 5 fotos reales · peso antes y después
· Capturas: subir producto · subir voucher ·
  el aviso mientras convierte · un rechazo
· Probado en móvil de 390 px
· La suite completa en verde
· Commit y publicación
```

```
   🔴 Y las capturas DENTRO del repositorio, en
      00-INSTRUCCIONES/capturas-t60/

      Van siete informes seguidos nombrando
      capturas que no están donde dices.
```

Si algo no cuadra con los requisitos, para y dilo. No implementes a medias un
requisito que crees que está mal: se reescribe el requisito.
