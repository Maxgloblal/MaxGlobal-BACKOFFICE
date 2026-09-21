# TAREA-51 · El patrocinio al instante

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 TOCA EL MOTOR · el dinero sale antes del cierre
**Fecha:** 20 de septiembre de 2026
**Es:** la Parte 2 de tres. La Parte 1 fue la TAREA-49.

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   00-INSTRUCCIONES/TAREA-49-EL-MOTOR-TIRA-COMISIONES.md
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md · RF-441, RF-443, RF-448
```

---

# LA DECISIÓN DE MÁXIMO

Confirmada el 17/09:

```
   PATROCINIO   se cobra el MISMO DÍA
                si el socio está activo

   RESIDUAL     al cierre · no cambia
   RANGO        al cierre · no cambia
```

---

# BLOQUE 0 · PRIMERO COMPRUEBA QUE LA PARTE 1 FUNCIONA

```
   🔴 NO ESCRIBAS CÓDIGO HASTA RESPONDER ESTO.
```

Verificado por mí hoy en la DEMO:

```sql
select estado, tipo, count(*) from comision group by estado, tipo;
```

```
   confirmada · patrocinio   845
   confirmada · rango         44
   confirmada · residual   1,534

   retenida    →  CERO
   anulada     →  CERO
```

**No existe ni una comisión `'retenida'` en la base.** Tus pruebas de la
TAREA-49 son unitarias del motor: ninguna orden real ha pasado por el flujo
completo.

Antes de construir encima, demuéstralo de punta a punta:

```
   1 · En la DEMO, confirma una orden real de un socio
       cuyo patrocinador esté INACTIVO en el ciclo abierto.

   2 · Pégame la fila de comision que quedó:
       estado, tipo, monto_cent y detalle->>'motivo'

   3 · Comprueba que la billetera del patrocinador
       NO subió.

   4 · Confirma otra de un patrocinador ACTIVO.
       Pégame esa fila también.
```

Si el flujo no produce `'retenida'`, **para**: la Parte 1 no está terminada y
la 2 no se puede construir encima.

---

# 🔴 LO QUE HAY QUE DECIDIR ANTES · LA RED DE SEGURIDAD

El cierre tiene hoy un control que **se pierde** si el patrocinio se paga antes:

```
   RF-376 · evaluarTechosCierre
   Si el total de comisiones supera lo que la compañía
   recaudó, el cierre SE BLOQUEA.
```

```
   Es la última red antes de pagar.

   Si el patrocinio sale el mismo día, ese dinero YA
   SALIÓ cuando el cierre calcula el techo. El control
   llega tarde.
```

Tres salidas. **No elijas tú: repórtame cuál recomiendas y por qué.**

```
   A · Comprobar el techo en cada pago inmediato
       Antes de abonar, mirar si lo pagado del ciclo
       más este abono supera lo recaudado.
       Lo más seguro. Una consulta extra por orden.

   B · Un tope por ciclo en config
       No pagar al instante más de X soles por ciclo;
       pasado eso, todo espera al cierre.
       Simple y acotado, pero es un número que alguien
       tiene que fijar.

   C · Dejarlo sin red
       El patrocinio sale del precio de un pack que la
       empresa YA cobró, así que el riesgo sería bajo.
       COMPRUÉBALO antes de proponerlo: ¿el 30.8% del
       patrocinio siempre sale de dinero ya recaudado?
```

---

# EL DISEÑO

Solo después del Bloque 0 y de decidir la red de seguridad.

## 1 · Un estado nuevo

```
   'abonada'   ya está en la billetera del socio
               el cierre NO la vuelve a abonar
```

```
   🔴 NO reutilices 'pagada'. El cierre abona
      estado IN ('confirmada','pagada'), así que
      marcarla 'pagada' la abonaría DOS VECES.
```

## 2 · Al confirmar el pago

Dentro de `fn_confirmar_orden_pago`, en la misma transacción que ya existe:

```
   Para cada comisión insertada:
     tipo = 'patrocinio'  Y  estado = 'confirmada'
       → abonar a wallet_movimiento
       → marcarla 'abonada'

   Las 'retenida' NO se tocan: van al cierre.
   El residual y el rango NO se tocan.
```

```
   🔴 Dentro de la función, no en una llamada aparte
      desde el navegador. Patrón de la TAREA-45.
```

Y cuida la cadena: `saldo_despues_cent` tiene que seguir siendo continuo aunque
ahora haya abonos a mitad de mes.

## 3 · El cierre excluye lo ya abonado

```sql
AND estado = 'confirmada'   -- 'abonada' fuera
```

Revisa también `v_total_comisiones_a_abonar`, que usa el mismo filtro.

## 4 · Las pantallas

```
   P-19 Mi Billetera
     el estimado del ciclo NO debe sumar las 'abonada':
     ya están en el saldo. Si las suma, el socio ve
     su dinero DOS VECES. Esta es la crítica.

   P-14 Mis Comisiones
     ✅ Ya en tu billetera        abonada
     ⏳ Se abona al cierre         confirmada
     ⏸ Esperando tu activación    retenida
     ❌ No se pagó                 anulada

   P-25 Vista previa del cierre
     desglosar: total del ciclo · ya abonado ·
     neto a abonar en este cierre

   Los filtros de operacionAdmin.js (699, 856, 1322,
   1405, 2748) tienen que incluir 'abonada' donde
   cuenten el total del ciclo.
```

---

# LAS PRUEBAS

```
   1 · Socio ACTIVO afilia
       → billetera sube HOY · comisión 'abonada'

   2 · Se cierra el ciclo
       → su billetera NO vuelve a subir por esa

   3 · Socio INACTIVO afilia
       → NO sube · queda 'retenida'
       → se activa · al cierre cobra

   4 · El residual de un socio activo
       → NO se abona al instante · espera al cierre

   5 · Dos afiliaciones seguidas del mismo socio activo
       → las dos se abonan · la cadena de
         saldo_despues_cent queda continua
```

```
   🔴 LA INVARIANTE:

   lo abonado a la billetera de un socio
   ==
   la suma de sus comisiones 'abonada' + 'confirmada'
   + 'pagada'

   contando cada una UNA SOLA VEZ, antes y después
   del cierre.
```

Sobre cifras vivas, no escritas a mano.

Y comprueba que no se mueven:

```
   ciclo 1   1,356 comisiones   S/. 66,137.40
   ciclo 2     596              S/. 20,403.94
   ciclo 3     466              S/. 13,479.68
```

---

# LOS DOCUMENTOS

```
   11-RF-MOTOR-Y-SISTEMA.md
     RF nuevo: el patrocinio se abona al confirmar
     el pago si el beneficiario está activo.
     Y lo que decidas de la red de seguridad.

   06-DOCUMENTO-MAESTRO.md
     el ciclo mensual ya no es "todo se paga al cierre"
```

El manual del cliente está **fuera de este repositorio**. No lo toques: dime qué
debe decir y lo escribo yo.

---

# LO QUE TIENES QUE REPORTAR

```
· El Bloque 0, con las dos filas de comision pegadas
· Qué recomiendas para la red de seguridad, y por qué
· El diff de fn_confirmar_orden_pago y del cierre
· Las 5 pruebas con su salida
· La invariante en un socio real, antes y después
  del cierre
· Los tres ciclos históricos sin moverse
· Las DOS bases con la misma definición
  (pégame el select de pg_proc de cada una)
· La suite completa en verde
```

```
   🔴 Si queda algo sin ejecutar, va en la PRIMERA
      línea. Y si una tarea toca la base, se aplica
      en las DOS o se declara cuál falta.
```

Si algo no cuadra, para y dilo. Esto saca dinero de la empresa antes de que el
mes cierre.
