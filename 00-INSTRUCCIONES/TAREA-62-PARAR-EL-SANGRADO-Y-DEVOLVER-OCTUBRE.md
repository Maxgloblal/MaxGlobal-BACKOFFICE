# TAREA-62 · Parar el sangrado y devolver octubre

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 PRODUCCIÓN CON CLIENTE DENTRO · 34 socios sin su comisión
**Fecha:** 1 de octubre de 2026
**Es:** la Parte 1 de cuatro. Las otras tres ya están decididas y van después.

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md · RF-451, RF-482, RF-508
```

---

# QUÉ PASÓ, EN UNA FRASE

El 1 de octubre Máximo cerró el ciclo de octubre a las 7:57, y a las 18:44 cerró
el de noviembre, que ni siquiera había empezado.

```
   Pudo hacerlo porque el cierre, al terminar,
   CREA Y ABRE el mes siguiente.

   Así que siempre hay un ciclo abierto esperando
   a que alguien vuelva a pulsar el botón.

   Y nada comprueba la fecha.
```

El RF-508 dice *"el cierre debe ejecutarse el último día del mes"*. Está marcado
✅ desde hace semanas. **Nada en el código lo cumple.**

---

# EL DAÑO, MEDIDO

Lo mediste tú y lo verifiqué:

```
   ciclo 2 · OCTUBRE
     34 comisiones de patrocinio ANULADAS
        S/. 482,40
     1 comisión 'abonada'  S/. 72,00   ← se respeta
     6 movimientos de billetera        ← se respetan
        1 abono + 5 retiros (−S/. 4.490,28)

   ciclo 3 · NOVIEMBRE   fantasma, vacío
   ciclo 4 · DICIEMBRE   fantasma, con
     1 orden · 3 comisiones · 1 activación
     1 movimiento de puntos
```

```
   🔴 Las 34 son lo que duele.

   Eran comisiones RETENIDAS esperando a que
   esos socios se activaran. Tenían hasta el 31
   de octubre para hacerlo.

   El cierre del día 1 se las anuló a todas.
```

---

# BLOQUE 1 · LA GUARDA · esto va primero

```sql
   IF (now() AT TIME ZONE 'America/Lima')::date < v_ciclo.fecha_fin THEN
     RAISE EXCEPTION 'No se puede cerrar el ciclo %/%: termina el %. Hoy es %.',
       v_ciclo.mes, v_ciclo.anio, v_ciclo.fecha_fin,
       (now() AT TIME ZONE 'America/Lima')::date;
   END IF;
```

Dentro de `fn_ejecutar_cierre_ciclo`, **antes** del UPDATE del estado.

```
   🔴 NO uses CURRENT_DATE.

   En Postgres es UTC. A las 19:00 en Lima el
   servidor ya está en el día siguiente, y la
   guarda dejaría cerrar un día antes.

   Este negocio opera en Perú. La fecha se
   evalúa en America/Lima, siempre.
```

Y en la P-25, antes de que se pueda pulsar nada:

```
   · si el ciclo que carga no ha terminado,
     el botón sale DESHABILITADO
   · con el motivo escrito: en qué fecha
     se podrá cerrar
```

```
   🔴 La guarda de la base es la que manda.
      La de la pantalla es cortesía. Las dos.
```

---

# BLOQUE 2 · LA REVERSIÓN

Una función nueva, `fn_revertir_cierre_ciclo(p_ciclo_id, p_admin_id)`.
**Transaccional, SECURITY DEFINER, auditada.** Nada de UPDATE sueltos desde el
editor SQL.

## Lo que tiene que deshacer

```
   1 · Las comisiones anuladas por ESE cierre
       vuelven a 'retenida', con su motivo original

   2 · Las que el cierre pasó de 'retenida' a
       'confirmada' vuelven a 'retenida'

   3 · Los abonos a billetera que creó ESE cierre
       se eliminan, y la cadena de saldo_despues_cent
       se recalcula

   4 · El ciclo vuelve a 'abierto'
       cerrado_en y cerrado_por a NULL

   5 · El ciclo siguiente, si lo creó ese cierre
       y está vacío, se elimina
```

```
   🔴 "Las que creó ESE cierre", no todas.

   El abono de S/. 72,00 del ciclo 2 NO lo hizo
   el cierre: es patrocinio al instante de la
   orden 38. Y los 5 retiros son pagos reales.

   Si los tocas, le quitas dinero a gente que
   ya lo cobró.

   Usa el registro de auditoría id 79 para saber
   qué hizo ese cierre exactamente. Si no basta,
   dímelo antes de inventarte un criterio.
```

## Cómo distinguir lo que anuló el cierre

```
   El cierre anula poniendo estado='anulada'
   sobre las que estaban 'retenida'.

   Averigua si el detalle o alguna marca permite
   identificarlas sin ambigüedad.

   Si NO se puede distinguir con certeza, PARA
   y dímelo. Prefiero decidirlo yo que que
   restaures 34 comisiones equivocadas.
```

---

# BLOQUE 3 · LOS CICLOS FANTASMA

```
   ciclo 4 tiene colgando
     1 orden · 3 comisiones · 1 activación
     1 movimiento de puntos
```

Todo eso pertenece a octubre: se registró el 1 de octubre por la tarde.

```
   ORDEN DE OPERACIONES · importa

   1 · reabrir el ciclo 2
   2 · mover las filas del 4 al 2
   3 · comprobar que NADA apunta ya al 3 ni al 4
   4 · recién entonces borrar el 3 y el 4
```

```
   🔴 No puedes borrar un ciclo con filas
      apuntándole. La clave foránea lo rechaza.
      Tu plan original tenía este orden al revés.
```

```
   🔴 Y OJO con activacion.

   Su clave primaria es (socio_id, ciclo_id).
   Si el socio de la activación del ciclo 4 YA
   tiene fila en el ciclo 2, moverla revienta
   por duplicado.

   Hay que FUSIONAR: sumar los puntos personales
   y recalcular si queda activo. No sobrescribir.

   Compruébalo antes y dime qué encontraste.
```

Las seis tablas que apuntan a un ciclo, para que no se te escape ninguna:

```
   orden · movimiento_puntos · activacion
   comision · rango_ciclo · wallet_movimiento
```

---

# BLOQUE 4 · LOS REQUISITOS QUE MIENTEN

```
   RF-508 · "el cierre debe ejecutarse el último
             día del mes"                        ✅
```

Está marcado ✅ y es falso desde siempre. Corrígelo con su `archivo:línea` real
cuando la guarda esté puesta.

```
   🔴 Y NO toques el RF-451 ni el RF-482.

   Esos dos también están en ✅ siendo falsos —
   el cierre no calcula el rango — pero eso es
   la PARTE 3 y se arregla aparte. Si los tocas
   ahora mezclas dos problemas.
```

---

# EL ORDEN DE EJECUCIÓN

```
   1 · La guarda, en la DEMO
   2 · Probar la reversión entera en la DEMO,
       sobre un ciclo de prueba
   3 · Enseñarme el resultado
   4 · PARAR

   Producción se toca cuando yo lo apruebe.
```

```
   🔴 NO ejecutes nada en PRODUCCIÓN en esta
      tarea. Ni la guarda.

   Hay 25 socios reales dentro y la reversión
   mueve comisiones. Se prueba entero en la
   demo primero.
```

---

# LO QUE TIENES QUE REPORTAR

```
· Si las 34 anuladas se pueden identificar con
  certeza · en la PRIMERA línea
· Lo de la clave primaria de activacion · qué
  encontraste
· El código de fn_revertir_cierre_ciclo
· La prueba completa en la DEMO:
    estado antes · reversión · estado después
· Que el abono de S/. 72 y los 5 retiros
  siguen intactos
· Que la guarda bloquea cerrar antes de tiempo
  Y que SIGUE dejando cerrar el día correcto
· El guion exacto para producción, SIN EJECUTAR
· La suite en verde
```

```
   🔴 Si algo no se puede revertir con certeza,
      PARA y dilo.

   Prefiero un ciclo mal cerrado y honesto que
   34 comisiones restauradas a ojo.
```
