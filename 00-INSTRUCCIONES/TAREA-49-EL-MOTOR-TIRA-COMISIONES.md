# TAREA-49 · El motor tira comisiones a la basura

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 TOCA EL MOTOR DE COMISIONES · dinero de socios
**Fecha:** 17 de septiembre de 2026

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   05-CONTROL/ESPECIFICACION-ACTIVACION.md
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md   · RF-440 a RF-447
   00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md  · líneas 318-362
```

**Esta es la Parte 1 de tres.** No adelantes las otras dos. Al final de la tarea
está qué viene después y por qué en ese orden.

---

# EL DEFECTO

```
   Ana tiene socios debajo. El día 3, uno recompra.
   A Ana le tocaría su residual.

   Pero ese día Ana no ha hecho sus 70 puntos.

   El sistema mira ESE INSTANTE, la ve inactiva,
   y TIRA la comisión. No la guarda en ningún sitio.

   Día 20 · Ana hace sus 70 puntos. Se activa.
   Fin de mes · Ana cobra solo lo de después del día 20.
                Lo del día 3 ya no existe.
```

Está en `motor/patrocinio.ts:97` y en `motor/residual.ts`, **con la misma
forma en los dos**:

```ts
const activo = ancestro.activo === true;
if (packHabilitado && activo) {
  comisiones.push({ ... });        // se crea
} else {
  totalBloqueadoCent += montoNivelCent;
  nivelesBloqueados.push({...});   // se descarta
}
```

Verificado contra la base: **ese dinero no deja rastro en ninguna parte.**

```
   tabla de bloqueados      no existe
   registros en auditoría   0
```

`niveles_bloqueados` se devuelve desde el motor pero **ningún sitio fuera de
`motor/` lo consume**. Se calcula y se tira.

Nadie puede responder por qué un socio no cobró. La empresa tampoco sabe cuánto
retuvo ni de quién.

## 🔴 Y es mucho más grande de lo que parece

`servicios/operacionAdmin.js:166`

```js
const activo = mapaActivos.get(ancId) ?? false;
```

Las filas de `activacion` **solo se crean cuando el socio compra algo ese mes**
(`fn_confirmar_orden_pago`). Quien no ha comprado todavía **no tiene fila**, y
esa línea lo trata como inactivo.

Verificado contra la DEMO, en el ciclo abierto de hoy:

```
   523 socios activos en el sistema
    10 con fila de activación en este ciclo
   513 tratados como INACTIVOS
```

```
   No es un caso raro. Es el estado NORMAL
   al empezar cada mes.

   Si el día 2 alguien recompra, toda su línea
   ascendente pierde su comisión, porque ninguno
   ha comprado todavía ese mes.
```

En un mes real las ventas ocurren a lo largo de todo el mes. **Las comisiones de
principio de mes se tirarían casi enteras.** Por eso esto no puede esperar.

---

# NO ES UNA FUNCIONALIDAD NUEVA · EL REQUISITO YA LO DECÍA

Esto es lo importante de la tarea y por eso va antes que el código.

```
   RF-441 · "El sistema DEBE calcular la activación
             de cada socio EN CADA CIERRE"       ✅
```

**Marcado como cumplido, y no lo está.** El código lo decide en el instante de
cada orden, no al cierre.

El documento maestro dice lo mismo desde agosto:

```
   | Comisiones de ESE MES | ❌ No cobra nada |
   | El mes siguiente      | ✅ Vuelve a cobrar si se activa |
```

Y Máximo, con sus palabras, el 25/08:

> *"Los rangos se comisionan de acuerdo a lo que llegó al **fin de mes**."*

Y confirmándolo el 17/09:

> *"si se activa a fin de mes le pagamos igual"*

```
   🔴 No estamos cambiando el plan.
      Estamos corrigiendo el código para que haga
      lo que el plan dice desde agosto.
```

## No confundir con lo ya analizado

`ESPECIFICACION-ACTIVACION.md` concluyó *"la doc está mal, el código está
bien"*. **Era sobre otra cosa** y sigue siendo cierto:

```
   ✅ CÓMO SE ACUMULA la activación
      progresivamente, al confirmar cada orden
      NO SE TOCA · el socio necesita ver su avance
      hacia los 70 puntos (RF-234)

   🔴 CUÁNDO SE DECIDE si una comisión se paga
      hoy en el instante · debe ser al cierre
      ESTO es lo que se corrige
```

Son dos cosas distintas. **Si las mezclas rompes el contador del carrito.**

---

# EL ARREGLO

## 1 · El motor guarda siempre

En `patrocinio.ts` y `residual.ts`, la rama `else` deja de descartar y crea la
comisión con `estado: 'retenida'` y el motivo en `detalle`.

```
   🔴 EL MOTIVO DECIDE SI SE RECUPERA. No los mezcles.

   'inactivo'            SÍ se recupera si se activa
   'pack_insuficiente'   NUNCA se recupera

   El pack del socio no alcanza ese nivel, y eso no
   cambia porque se active. Si los tratas igual,
   vas a pagar niveles que su pack no cubre.
```

Dime explícitamente cómo los distingues antes de seguir.

## 2 · El cierre decide

En `fn_ejecutar_cierre_ciclo`, **antes** de abonar nada:

```
   Para cada comisión 'retenida' del ciclo:

     motivo 'pack_insuficiente'
       → 'anulada' siempre

     motivo 'inactivo'
       ¿el beneficiario terminó el mes ACTIVO?
         SÍ → 'confirmada'  · se abona
         NO → 'anulada'     · se queda la empresa
```

```
   Los cuatro estados quedan así

   'confirmada'  se abona en este cierre
   'retenida'    esperando a ver si se activa
   'anulada'     no se pagó · con nombre y monto
   'pagada'      ya existía · no la toques
```

`'anulada'` es lo que arregla el dinero que hoy desaparece sin nombre.

## 3 · Que no se cuente dos veces

`'retenida'` y `'anulada'` **no son dinero a cobrar**. Revisa cada sitio que
suma `comision` y decide qué hace con ellas:

```
   socio.js:122       P-19 Mi Billetera · el estimado del ciclo
   socio.js:48        P-14 Mis Comisiones
   operacionAdmin.js  569, 699, 852, 1322, 1398, 2738
```

```
   🔴 La de P-19 es la crítica. Si suma las retenidas,
      el socio ve como suyo un dinero que quizá nunca
      cobre.
```

En P-14, el socio tiene que entender su situación:

```
   ⏳ Se abona al cierre            confirmada
   ⏸ Esperando tu activación       retenida
   ❌ No se pagó · no te activaste  anulada
```

Ese aviso es el que convierte la regla en algo accionable: el socio ve que tiene
dinero esperando y se activa.

---

# LOS DOCUMENTOS QUE HAY QUE CORREGIR

**No los des por buenos.** Son parte de la tarea:

```
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md

   RF-441  está marcado ✅ y no se cumple.
           Precisar que la ACUMULACIÓN es progresiva
           pero la DECISIÓN de pago es al cierre.

   RF-443  dice "no debe cobrar residual ni bono de
           rango". Falta el patrocinio, que Máximo
           confirmó el 17/09 que también lo exige.

   Añadir un RF nuevo: las comisiones no pagadas
   DEBEN quedar registradas con su motivo.
   Hoy no existe ese requisito y por eso nadie lo echó
   de menos.
```

```
   05-CONTROL/ESPECIFICACION-ACTIVACION.md

   Añadir la distinción entre acumular y decidir.
   Ese documento analizó lo primero y nunca miró
   lo segundo.
```

```
   00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md

   La sección de no compresión debe decir que el
   dinero retenido se decide AL CIERRE, no en el
   momento de la venta.
```

---

# DOS COSAS QUE APARECIERON AL BARRER · ARRÉGLALAS DE PASO

No son de esta tarea, pero son del mismo tipo y están a mano.

## A · El umbral de 70 escrito a mano en el motor de rango

```sql
-- fn_calcular_y_persistir_rangos, DOS veces:
(COALESCE(act.activo, false) OR COALESCE(act.puntos_personales, 0) >= 70)
```

La clave existe en config:

```
   activacion_puntos_mes = 70
```

Y `fn_confirmar_orden_pago` **sí la lee** (líneas 1712 y 1800, con 70 solo como
respaldo). El motor de rango no: lo tiene fijo.

```
   Si Máximo cambia el umbral en P-26 de 70 a 100,
   el patrocinio y el residual usarían 100,
   y el rango seguiría usando 70.
```

Es el patrón 1 del documento de lecciones, en la función que se creó ayer.

## B · Dos respaldos a la dirección de Vercel

```
   servicios/socio.js:453
   paginas/P16MiEnlace.jsx:88

   cfgLanding?.valor || 'https://max-global-landing.vercel.app'
```

Es la pantalla **Mi Enlace**, la que el socio usa para invitar. Si la consulta a
config falla, cada socio reparte la dirección provisional.

Es exactamente el patrón de la TAREA-41. **Se borra el respaldo y se falla con
mensaje claro**, no se cambia por el dominio nuevo: un respaldo escrito a mano
vuelve a ser falso el día que el dominio cambie.

---

# LAS PRUEBAS

```
   1 · Socio INACTIVO · su red recompra el día 3
       → la comisión EXISTE, en estado 'retenida'
       → su billetera NO sube

   2 · Ese socio se activa · se cierra el ciclo
       → la comisión pasa a 'confirmada' y se abona
       → cobra lo del día 3

   3 · Socio que NUNCA se activa · se cierra
       → 'anulada' · no cobra
       → pero queda REGISTRADA, con monto y dueño

   4 · Nivel bloqueado por 'pack_insuficiente'
       → 'anulada' aunque el socio esté activo

   5 · Socio ACTIVO todo el mes
       → todo igual que hoy · nada cambia

   6 · 🔴 EL CASO QUE MÁS OCURRE · principio de mes
       Ciclo recién abierto · NADIE tiene fila
       de activación todavía.

       Un socio de abajo recompra el día 2.

       → TODA la línea ascendente genera comisiones
         'retenida', ninguna se pierde
       → los que compren durante el mes las cobran
         al cierre
       → los que no, se anulan con su registro

       Hoy este caso tira la comisión de los 10
       niveles de golpe. Es el escenario normal,
       no el excepcional.
```

```
   🔴 LA INVARIANTE QUE NO PUEDE ROMPERSE:

   lo abonado a la billetera de un socio
   ==
   la suma de sus comisiones 'confirmada' + 'pagada'

   Ni un céntimo de las 'retenida' ni de las 'anulada'.
```

Sobre cifras vivas, **no sobre números escritos a mano** (patrón 3).

## Y una comprobación de que no rompiste nada

Los ciclos 1, 2 y 3 de la DEMO están cerrados y no deben moverse:

```
   ciclo 1   1,356 comisiones   S/. 66,137.40
   ciclo 2     596              S/. 20,403.94
   ciclo 3     466              S/. 13,479.68
```

Si alguna de esas cifras cambia, algo se rompió.

---

# LO QUE TIENES QUE REPORTAR

```
· Cómo distingues 'inactivo' de 'pack_insuficiente'
· El diff de patrocinio.ts, residual.ts y
  fn_ejecutar_cierre_ciclo
· Los sitios que suman comision, uno por uno,
  con qué decidiste para 'retenida' y 'anulada'
· Los 5 escenarios, con su salida
· La invariante billetera == comisiones, en un socio real
· Las tres cifras de los ciclos 1, 2 y 3, sin moverse
· Los documentos corregidos
· La suite completa en verde
```

```
   🔴 Si no mediste algo, dilo. Patrón 10.
   🔴 Si algo queda sin ejecutar, va en la PRIMERA línea.
```

---

# LO QUE NO ENTRA · Y POR QUÉ ESE ORDEN

```
   PARTE 2 · que el patrocinio se cobre al instante
     Necesita que las comisiones existan primero.
     Sobre esto construye, no al revés.

   PARTE 3 · el resto de pantallas y el manual
     Cuando las dos primeras estén funcionando.
```

Si algo de esta tarea no cuadra con lo que ves, **para y dilo antes de tocar
nada**. Esto toca dinero de gente real.
