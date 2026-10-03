# TAREA-63 · El cierre debe pagar el rango

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 UN BONO ENTERO DEL PLAN NO SE PAGA · hasta S/. 10.000 al mes
**Fecha:** 2 de octubre de 2026
**Plazo:** ANTES DEL 31 DE OCTUBRE · ese día Máximo cierra el mes de verdad
**Es:** la Parte 3 de cuatro

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md  · patrón 11
   00-INSTRUCCIONES/TAREA-45-EL-CIERRE-ESCRIBE-DINERO-DESDE-EL-NAVEGADOR.md
   03-SISTEMA/11-RF-MOTOR-Y-SISTEMA.md · RF-451, RF-482
```

---

# EL FALLO, Y DE QUIÉN ES

```
   fn_ejecutar_cierre_ciclo
     NO llama a fn_calcular_y_persistir_rangos

   El frontend solo lo llama en la vista previa,
   con p_solo_calculo = true · en seco
   (operacionAdmin.js:626)

   Ninguna comisión de rango se persiste jamás.
```

Confirmado en producción: **`rango_ciclo` tiene 0 filas en el ciclo 2.** Esa
función inserta una fila por socio aunque no califique. Cero filas = nunca
corrió.

```
   🔴 ESTO NO ES CULPA TUYA.

   La TAREA-45 te decía, en la línea 124:

     "lo IDEAL ES que fn_ejecutar_cierre_ciclo
      llame dentro a fn_calcular_y_persistir_rangos"

   Y en la línea 116 te pegaba el código nuevo de
   ejecutarCierreCiclo con el paso de rangos YA
   BORRADO.

   El frontend dejó de llamarlo porque el ejemplo
   se lo quitó. La base nunca empezó porque solo
   se sugirió. Está documentado como patrón 11.
```

Lo escribo para que no pierdas tiempo buscando qué hiciste mal. Ahora hay que
arreglarlo.

---

# BLOQUE 1 · CONECTAR EL MOTOR AL CIERRE

Dentro de `fn_ejecutar_cierre_ciclo`, **antes** de resolver las comisiones
retenidas y antes de abonar a billeteras:

```
   PERFORM public.fn_calcular_y_persistir_rangos(p_ciclo_id, false);
```

El orden importa y no es negociable:

```
   1 · calcular y persistir los rangos
       → crea las comisiones de tipo 'rango'
       → en estado 'confirmada'

   2 · resolver las comisiones 'retenida'
       → las de rango ya están puestas

   3 · abonar TODO a las billeteras
       → incluidas las de rango
```

```
   🔴 Si lo pones DESPUÉS de abonar, las comisiones
      de rango se crean pero nadie las paga, y el
      socio las ve en pantalla sin que le lleguen.

   🔴 Si lo pones DESPUÉS de resolver retenidas,
      funciona igual hoy, pero deja de funcionar
      el día que el rango genere retenciones.

      Va PRIMERO.
```

## Lo que hay que comprobar al conectarlo

```
   · fn_calcular_y_persistir_rangos es idempotente
     (comprueba rango_ciclo y comision tipo 'rango').
     Dentro del cierre no debería saltar esa guarda,
     pero confírmalo.

   · Esa función valida fn_is_admin() con el patrón
     de service_role. Comprueba que sigue funcionando
     llamada desde dentro de otra función.

   · El cierre ya está en una transacción. El rango
     tiene que quedar DENTRO de la misma.
     Si el rango falla, no se cierra nada.
```

---

# BLOQUE 2 · 🔴 LA PRUEBA QUE MINTIÓ

```
   src/test/persistencia-rango.test.js:177

   if (nombre === 'fn_ejecutar_cierre_ciclo') {
     // En Postgres real (TAREA-45), fn_ejecutar_cierre_ciclo
     // ejecuta fn_calcular_y_persistir_rangos primero
     const res = await this.rpc('fn_calcular_y_persistir_rangos', args);
```

```
   Esa prueba SIMULA que el cierre llama al motor,
   y después verifica que lo llamó.

   Inventa el comportamiento y comprueba su propio
   invento. Lleva en verde desde el 15 de septiembre.
```

Quítale la simulación. Que la prueba corra contra el cierre **de verdad**, sin
mockear ese paso. Si para eso hace falta Postgres real en vez de un mock, dilo y
lo montamos: una prueba que miente es peor que no tenerla.

---

# BLOQUE 3 · LA PRUEBA QUE SÍ LO HABRÍA CAZADO

Es la que pedía la TAREA-45 y nunca se ejecutó de verdad:

```
   En la DEMO, un ciclo con AL MENOS UN SOCIO QUE
   CALIFIQUE A RANGO.

   1 · Antes de cerrar:
       rango_ciclo del ciclo       → 0 filas
       comision tipo 'rango'       → 0 filas

   2 · Cerrar el ciclo.

   3 · Después:
       rango_ciclo                 → una fila POR SOCIO
       comision tipo 'rango'       → las de los que califican
       la billetera del que califica → subió por su bono

   4 · Pégame el monto exacto y a quién le llegó.
```

```
   🔴 Si el ciclo de prueba no tiene a nadie que
      califique, la prueba NO demuestra nada.

   Constrúyelo: un socio con la red y los puntos
   necesarios para llegar a Jade (500 puntos
   grupales, 1 frontal activo).

   Y dime a quién usaste y por qué califica.
```

---

# BLOQUE 4 · EL CICLO 1, QUE YA ESTÁ CERRADO

```
   El ciclo 1 se cerró el 30/09, ya con el fallo.
```

Comprueba en producción si el ciclo 1 tiene comisiones de rango. Si no las
tiene, hay socios que calificaron en septiembre y no cobraron.

```
   🔴 NO lo arregles. Solo mídelo y dime:
      · cuántos socios habrían calificado
      · cuánto suma ese bono

   Si hay dinero pendiente de septiembre, eso lo
   decide Máximo, no nosotros.
```

---

# BLOQUE 5 · LOS REQUISITOS

```
   RF-451 · "El rango debe recalcularse en cada
             cierre de ciclo"                    ✅ ← falso
   RF-482 · "El cierre debe ... calcular el rango
             del ciclo"                          ✅ ← falso
```

Los dos están en ✅ y son falsos. Cuando el cierre lo haga de verdad,
actualízalos con su `archivo:línea`.

---

# LO QUE TIENES QUE REPORTAR

```
· El diff de fn_ejecutar_cierre_ciclo
· La prueba del Bloque 3, con el socio que calificó,
  el monto y la billetera · en la PRIMERA línea
· La prueba de persistencia-rango sin el mock
· Lo del ciclo 1 · cuántos socios y cuánto dinero
· Los tres ciclos históricos de la demo sin moverse
    ciclo 1 · 1.356 comisiones · S/. 66.137,40
    ciclo 2 ·   596            · S/. 20.403,94
    ciclo 3 ·   466            · S/. 13.479,68
· Las DOS bases con la misma definición
· La suite completa en verde
· Commit y publicación
```

```
   🔴 TODO en la DEMO primero. Producción se toca
      cuando yo lo apruebe.

   🔴 Y el 31 de octubre Máximo cierra el mes de
      verdad. Si esto no está listo y probado antes,
      octubre se queda sin bono de rango para siempre.
```

Si algo no cuadra, para y dilo.
