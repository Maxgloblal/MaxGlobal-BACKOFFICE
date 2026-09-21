# TAREA-49 · El patrocinio se cobra el mismo día

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 TOCA EL MOTOR DE COMISIONES
**Fecha:** 17 de septiembre de 2026
**Bloque 0 ya respondido por ti el 17/09** — gracias, cambió el diseño

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   05-CONTROL/ESPECIFICACION-ACTIVACION.md
   00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md  · líneas 318-362
```

---

# LO QUE TU BLOQUE 0 DESTAPÓ

Tu comprobación tumbó el diseño anterior, y bien. Esto es lo que quedó claro:

```
   Si el patrocinador NO está activo cuando su referido
   compra, la comisión NO SE CREA. Se bloquea en memoria
   (niveles_bloqueados) y se descarta.
```

Verificado por mí contra la base:

```
   tabla de bloqueados      no existe
   registros en auditoría   0
```

**Ese dinero desaparece sin dejar rastro.** Nadie puede responder por qué un
socio no cobró, y la empresa tampoco sabe cuánto retuvo.

---

# EL PROBLEMA DE FONDO · NO ES UN CAMBIO, ES UNA DESVIACIÓN

Esto es lo más importante de la tarea, así que léelo despacio.

## Lo que el plan dice desde agosto

`06-DOCUMENTO-MAESTRO.md:319` y su tabla:

```
   "Cada mes, un socio debe acumular 70 puntos
    personales para cobrar comisiones."

   | Comisiones de ESE MES | ❌ No cobra nada |
   | El mes siguiente      | ✅ Vuelve a cobrar si se activa |
```

**La activación siempre fue una condición MENSUAL.**

## Lo que el código hace

Evalúa `ancestro.activo === true` **en el instante** en que se confirma cada
orden (`motor/patrocinio.ts:97` y `motor/residual.ts`, misma forma en los dos).

```
   Ana afilia a Bruno el día 3, sin haber hecho
   todavía sus 70 puntos.
     → su comisión se descarta para siempre

   Ana hace sus 70 puntos el día 20.
     → no la recupera

   Si hubiera afiliado el día 21, cobraba.
```

```
   🔴 Dos socios haciendo exactamente lo mismo, con
      días de diferencia: uno cobra y el otro no.
```

## Lo que decidió Máximo el 17/09

> *"si se activa a fin de mes le pagamos igual"*

```
   NO es un cambio de reglas.
   Es alinear el código con el plan que él ya aprobó.
```

## No confundir con lo ya analizado

`ESPECIFICACION-ACTIVACION.md` concluyó *"la documentación está mal, el código
está bien"*. **Eso era sobre otra cosa** y sigue vigente:

```
   ✅ CÓMO SE ACUMULA la activación
      progresivamente, al confirmar cada orden
      NO SE TOCA · el socio necesita ver su avance (RF-234)

   🔴 CUÁNDO SE DECIDE si una comisión se paga
      hoy en el instante · debe ser al cierre
      ESTO es lo que se corrige
```

Son dos cosas distintas y no se contradicen.

---

# 🔴 ALCANCE · ESTO NO ES SOLO PATROCINIO

Máximo pidió que el **pago inmediato** sea solo para patrocinio. Eso se respeta.

Pero la corrección de **cuándo se decide** aplica también al residual, porque:

```
   · residual.ts tiene el MISMO código que patrocinio.ts
   · la regla documentada dice "comisiones de ese mes",
     sin distinguir por tipo
```

Si se arregla solo el patrocinio, quedan dos reglas distintas para la misma
condición, y el socio no va a entender por qué le pagaron un bono y el otro no.

```
   🔴 Esto es una RECOMENDACIÓN mía, no una orden de
      Máximo. Si Jack dice que solo patrocinio, se hace
      solo patrocinio. Pregúntale antes de empezar.
```

---

# EL DISEÑO

## Los cuatro estados de una comisión

```
   'abonada'      ya está en la billetera
                  solo patrocinio, solo si el socio
                  estaba activo en ese momento

   'confirmada'   se abona en el cierre
                  el socio estaba activo

   'retenida'     el socio NO estaba activo
                  se decide en el cierre

   'anulada'      el socio no se activó en todo el mes
                  el dinero se queda en la empresa
                  CON REGISTRO de cuánto y de quién
```

`'anulada'` es lo que arregla el dinero que hoy desaparece sin nombre.

```
   🔴 NO reutilices 'pagada'. El cierre hoy abona
      estado IN ('confirmada','pagada'), así que
      marcarla 'pagada' la abonaría DOS VECES.
```

## 1 · El motor deja de descartar

En `motor/patrocinio.ts` y `motor/residual.ts`, donde hoy dice:

```ts
} else {
  totalBloqueadoCent += montoNivelCent;
  nivelesBloqueados.push({...});   // ← se descarta
}
```

Pasa a **crear la comisión igual**, con `estado: 'retenida'` y el motivo
(`'inactivo'` o `'pack_insuficiente'`) en `detalle`.

```
   🔴 OJO CON EL MOTIVO.

   'pack_insuficiente' NO se recupera nunca: el pack
   del socio no llega a ese nivel y eso no cambia
   porque se active.

   Solo 'inactivo' es recuperable.

   Si los mezclas, vas a pagar niveles que el pack
   del socio no cubre. Compruébalo y dime cómo lo
   distingues.
```

## 2 · Al confirmar · el patrocinio inmediato

Dentro de `fn_confirmar_orden_pago`, en la misma transacción que ya existe:

```
   comisión de tipo 'patrocinio' y estado 'confirmada'
     → abonar a wallet_movimiento
     → marcarla 'abonada'

   todo lo demás queda como está
```

```
   🔴 Dentro de la función. NO una llamada aparte que
      el navegador haga después. Eso es el patrón de
      la TAREA-45: dinero escrito desde el cliente.
```

## 3 · Al cerrar · resolver lo retenido

Dentro de `fn_ejecutar_cierre_ciclo`, **antes** de abonar:

```
   Para cada comisión 'retenida' del ciclo,
   con motivo 'inactivo':

     ¿el beneficiario terminó el mes ACTIVO?
       SÍ  → pasa a 'confirmada' y se abona
       NO  → pasa a 'anulada', se queda la empresa

   Las de motivo 'pack_insuficiente' → 'anulada'
   siempre, sin mirar la activación
```

Y el abono pasa a ser solo `estado = 'confirmada'`: `'abonada'` ya está pagada y
`'anulada'` no se paga.

---

# 🔴 LAS OCHO PANTALLAS QUE TU BLOQUE 0 ENCONTRÓ

Tú mismo las listaste. **Todas suman `comision` y todas cambian**, porque ahora
existen filas que antes no existían:

```
   socio.js:122        P-19 Mi Billetera
     hoy suma TODAS las comisiones del ciclo
     → si suma las 'abonada', el socio ve su dinero DOS VECES
       (en su saldo real y en el estimado por cobrar)
     → debe sumar solo 'confirmada'

   socio.js:48         P-14 Mis Comisiones
     fn_desglose_comisiones_socio devuelve true AS pagado
     para todo. Debe devolver el estado real:
       ✅ Ya en tu billetera        abonada
       ⏳ Se abona al cierre         confirmada
       ⏸ Esperando tu activación    retenida
       ❌ No se pagó · no te activaste   anulada

   operacionAdmin.js:569   P-25 vista previa
     debe desglosar: total del ciclo · ya abonado ·
     neto a abonar en el cierre

   operacionAdmin.js:699, 852, 1322, 1398, 2738
     filtran .in('estado', ['confirmada','pagada'])
     → añadir 'abonada' o desaparecen del histórico
     → NO añadir 'retenida' ni 'anulada' a los totales
       pagados, pero sí mostrarlas aparte
```

```
   🔴 La de P-19 es la peor: el socio vería el mismo
      dinero contado dos veces. Esa no puede fallar.
```

---

# LA PRUEBA QUE DECIDE TODO

```
   1 · Socio ACTIVO afilia hoy
       → billetera sube HOY · comisión 'abonada'

   2 · Se cierra el ciclo
       → su billetera NO vuelve a subir por esa comisión

   3 · Socio INACTIVO afilia el día 3
       → NO sube · comisión 'retenida'

   4 · Ese socio se activa el día 20 · se cierra el mes
       → AHORA sí cobra · pasa a 'confirmada' y se abona

   5 · Otro socio inactivo que NUNCA se activa
       → 'anulada' · no cobra · queda REGISTRADO

   6 · Nivel bloqueado por 'pack_insuficiente'
       → 'anulada' aunque el socio esté activo
```

```
   🔴 LA INVARIANTE QUE NO PUEDE ROMPERSE:

   para cualquier socio y cualquier ciclo,
   lo abonado a su billetera == la suma de sus
   comisiones 'abonada' + 'confirmada',
   contando cada una UNA SOLA VEZ.

   Ni un céntimo más, ni uno menos.
```

Escríbela sobre cifras vivas, **no sobre números escritos a mano** (patrón 3).

---

# LO QUE TIENES QUE REPORTAR

```
· Cómo distingues 'inactivo' de 'pack_insuficiente'
· El diff de patrocinio.ts, residual.ts,
  fn_confirmar_orden_pago y fn_ejecutar_cierre_ciclo
· Las 8 pantallas, una por una, con qué cambió
· Los 6 escenarios de prueba, con su salida
· La invariante billetera == comisiones, en un socio real,
  antes y después del cierre
· La suite completa en verde
```

```
   🔴 Si no mediste algo, dilo. No lo reconstruyas
      en una tabla. Patrón 10.
   🔴 Si algo queda sin ejecutar, va en la PRIMERA
      línea del informe.
```

Si algo de esta tarea no cuadra con lo que ves, **para y dilo**. Esto toca el
dinero de gente real y prefiero rehacer el plan que arreglarlo después.
