# TAREA-46 · Dos motores calculando el mismo dinero

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 Decide lo que se paga · sin verificar
**Fecha del hallazgo:** 17 de septiembre de 2026
**Viene de:** TAREA-45

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   00-INSTRUCCIONES/TAREA-45-EL-CIERRE-ESCRIBE-DINERO-DESDE-EL-NAVEGADOR.md
```

**La TAREA-45 está bien hecha y verificada.** Las cinco funciones existen en las
dos bases, los permisos quedaron idénticos al instalador y `persistenciaRango.js`
ya no escribe: llama al RPC. Eso está cerrado y no se toca.

Esta tarea es lo único que quedó sin comprobar, y es lo que decide cuánto cobra
cada socio.

---

# EL PROBLEMA · HAY DOS MOTORES

```
   VISTA PREVIA del cierre
     operacionAdmin.js:583  →  calcularRangosEnMemoria()
     calcula el bono de rango en JAVASCRIPT

   CIERRE del ciclo
     fn_ejecutar_cierre_ciclo
       →  fn_calcular_y_persistir_rangos()
     calcula el bono de rango en POSTGRES
```

```
   Máximo abre la pantalla de cierre.
   Ve un total de bono de rango.
   Lo aprueba.

   Al confirmar, Postgres lo vuelve a calcular por
   su cuenta, con otro código.

   Si los dos no coinciden, aprobó un número
   y pagó otro.
```

**Nadie los ha comparado nunca.** No digo que estén mal: digo que no lo sabemos.

## Por qué la verificación de la TAREA-45 no sirvió

El informe ejecutó:

```sql
SELECT public.fn_calcular_y_persistir_rangos(1);
```

Y devolvió `"yaExistia": true`.

```
   El ciclo 1 ya tenía sus 501 filas de rango_ciclo,
   así que la función salió por la puerta de la
   idempotencia SIN CALCULAR NADA.

   La tabla de "paridad" comparó los datos viejos
   de JavaScript contra sí mismos.
```

Comprobado contra la base: la última comisión de rango de la DEMO es del **4 de
septiembre**. La función nueva **jamás ha calculado un bono de rango**.

---

# LA SOLUCIÓN · UN SOLO MOTOR

No se trata de comparar los dos para siempre. Se trata de **quedarse con uno**.

## Paso 1 · Modo de solo cálculo

Darle a la función un modo que calcule y devuelva, **sin escribir nada y sin
cortarse por idempotencia**:

```sql
fn_calcular_y_persistir_rangos(
  p_ciclo_id  bigint,
  p_solo_calculo boolean DEFAULT false
)
```

```
   p_solo_calculo = true
     · NO inserta en rango_ciclo
     · NO inserta en comision
     · NO se detiene aunque el ciclo ya tenga filas
     · devuelve el mismo jsonb: evaluados, califican,
       totalBonoCent, comisionesCreadas
     · y además el detalle por socio, para poder
       comparar uno a uno
```

## Paso 2 · La vista previa usa ese modo

En `obtenerVistaPreviaCierre`, sustituir la llamada a
`calcularRangosEnMemoria` por el RPC en modo solo cálculo.

```
   Con eso, el número que ve Máximo y el número que
   se paga salen del MISMO código. Ya no pueden
   diferir nunca.
```

`calcularRangosEnMemoria` deja de usarse en producción. **No lo borres todavía**:
lo necesitamos para el paso 3.

---

# PASO 3 · LA PRUEBA QUE DECIDE SI ESTÁ BIEN TRADUCIDO

Hay un banco de pruebas perfecto en la DEMO, sin tocar nada. Tres ciclos
calculados por el motor viejo, con tres resultados distintos:

```
   ciclo 1    501 filas    23 comisiones    S/. 7,800.00
   ciclo 2    501 filas    12 comisiones    S/. 1,200.00
   ciclo 3    501 filas     8 comisiones    S/.   600.00
```

Verificado hoy con:

```sql
select ciclo_id, count(*), sum(monto_cent)
from comision where tipo='rango' group by ciclo_id order by ciclo_id;
```

## Lo que hay que hacer

Correr la función en **modo solo cálculo** contra los ciclos 1, 2 y 3, y
comparar con esas cifras.

```
   ✅ Si devuelve 23 / 12 / 8 y los mismos totales,
      la traducción a Postgres es correcta.

   🔴 Si alguno difiere, PARA. No lo ajustes para que
      cuadre. Dime qué socio y qué cifra bailan, y lo
      miramos juntos antes de tocar nada.
```

**Y la comparación va socio por socio, no solo el total.** Dos errores que se
compensan dan el mismo total y pagan mal a dos personas.

## Lo que más probablemente falle

Si algo baila, mira primero estas tres, que son las difíciles de traducir:

```
   · La línea estirada
     máximo el 50% de los puntos desde UNA sola línea
     (config.linea_estirada_pct)

   · El conteo de frontales activos
     qué cuenta exactamente como "frontal activo"

   · El rango NO es apilable
     cada mes se evalúa de cero, no se acumula
```

---

# PASO 4 · DEJARLO PROBADO PARA SIEMPRE

Una prueba nueva que fije esas tres cifras como invariante:

```
   ✅ fn_calcular_y_persistir_rangos(1, true) → 23 · 780000
   ✅ fn_calcular_y_persistir_rangos(2, true) → 12 · 120000
   ✅ fn_calcular_y_persistir_rangos(3, true) →  8 ·  60000
```

Son datos cerrados de agosto y septiembre que **no van a cambiar nunca**. Si un
día esa prueba se pone roja, alguien tocó el cálculo del bono de rango.

```
   🔴 NO uses el ciclo 30, que está abierto.
      Sus cifras cambian con cada venta.
      Ese es el patrón 3 del documento de lecciones.
```

---

# LO QUE TIENES QUE REPORTAR

```
· La firma nueva de la función, en las DOS bases
· Las tres corridas en modo solo cálculo, pegadas
  tal cual, contra los ciclos 1, 2 y 3
· La comparación SOCIO POR SOCIO del ciclo 1:
  los 23 beneficiarios y sus montos, viejo contra nuevo
· El diff de obtenerVistaPreviaCierre
· La prueba nueva, con su salida
· Confirmación de que calcularRangosEnMemoria ya no
  se llama desde ninguna ruta de producción
```

```
   🔴 Si algo queda sin ejecutar, va en la PRIMERA
      línea del informe. No en un paréntesis.
```

Si algo de esta tarea no cuadra con lo que ves, para y dilo antes de tocar nada.
