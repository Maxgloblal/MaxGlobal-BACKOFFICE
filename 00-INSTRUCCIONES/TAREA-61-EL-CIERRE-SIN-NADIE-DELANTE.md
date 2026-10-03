# TAREA-61 · El cierre sin nadie delante

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 EL CIERRE MUEVE TODO EL DINERO DEL MES · y no se deshace
**Fecha:** 24 de septiembre de 2026

---

# 🔴 ESTA TAREA NO ESCRIBE CÓDIGO

```
   Se investiga. Se reporta. Se para.
```

Máximo pide que el ciclo se cierre solo, **el día 1 de cada mes a las 3 de la
madrugada**, en vez de que él pulse el botón.

Suena a poner un temporizador. No lo es. Mirando el código encontré dos cosas
que hacen que, tal como está hoy, **eso no funcionaría — y si se forzara, sería
peor que no hacerlo.**

---

# LO QUE YA ENCONTRÉ · compruébalo tú también

## 🔴 1 · La red de seguridad vive en el navegador

```
   operacionAdmin.js:736   evaluarTechosCierre
```

Es el RF-376: si las comisiones del ciclo superan lo que la empresa recaudó,
**el cierre se bloquea**. Es la última barrera antes de repartir dinero.

```
   Está en el FRONTEND.

   Se ejecuta porque la pantalla P-25 la llama
   antes de dejar pulsar el botón.

   Un cierre automático NO pasa por esa pantalla.
   La red de seguridad no se ejecutaría nunca.
```

```
   Hoy, si el motor calculara mal y repartiera
   más de lo recaudado, alguien lo ve y para.

   A las 3 de la mañana no hay nadie.
```

## 🔴 2 · La función de base exige un administrador

`fn_ejecutar_cierre_ciclo` empieza con:

```sql
   IF NOT fn_is_admin() THEN
     RAISE EXCEPTION 'Acceso denegado: solo administradores
                      pueden ejecutar el cierre de ciclo.';
```

`fn_is_admin()` compara el correo del JWT contra la tabla `socio`. Un trabajo
programado no tiene sesión ni correo.

```
   Es muy probable que el cierre automático
   falle en la primera línea.

   Compruébalo de verdad. No lo supongas.
```

## 3 · Lo único que la base valida hoy

```
   · que quien llama sea admin
   · que el ciclo exista
   · que el ciclo esté abierto
```

Nada más. **No comprueba si quedan pagos sin confirmar.** Eso también vive en
el frontend (`obtenerVerificacionesPreviasCierre`, línea 453).

---

# LO QUE TIENES QUE INVESTIGAR

## A · ¿Con qué permisos se ejecutaría?

```
   · ¿Qué devuelve fn_is_admin() cuando llama
     el service_role, sin JWT? Pruébalo.
   · ¿Cómo se autoriza un trabajo programado sin
     abrirle la puerta a cualquiera?
   · Si se relaja esa comprobación, ¿qué más
     queda expuesto?
```

```
   🔴 La salida fácil es quitar el IF NOT fn_is_admin().
      Esa NO es la respuesta. Sería dejar el cierre
      del mes abierto a cualquiera con la anon key.
```

## B · ¿Dónde tienen que vivir las validaciones?

Si nadie abre la pantalla, todo lo que hoy comprueba el navegador tiene que
estar **dentro de la función de base**:

```
   · los techos del RF-376
   · los pagos sin confirmar
   · cualquier otra verificación previa
```

Dime exactamente qué habría que mover, desde dónde, y qué se rompe al moverlo.

## C · ¿Qué pasa con los pagos sin confirmar?

Esta es de negocio, no técnica, y es la que más dinero mueve.

```
   El manual dice, y Máximo lo ha leído:

   "Si cierra el mes con pagos pendientes, esas
    ventas quedan fuera de ese ciclo para siempre."

   Hoy él revisa antes de cerrar.
   A las 3 de la mañana no revisa nadie.
```

Plantéame las opciones. Por ejemplo: cerrar igual, o no cerrar y avisar, o
cerrar solo si no hay pendientes. **No elijas tú** — dime qué implica cada una
y lo decide Máximo.

## D · La hora, que es donde todo el mundo se equivoca

```
   Máximo dice 3 de la mañana. Hora de Perú.
   La base está en sa-east-1 y trabaja en UTC.

   3:00 en Lima = 8:00 UTC
```

```
   🔴 Si esto se programa mal por unas horas, el
      ciclo cierra el día equivocado.

   Y "el día 1 cierra el ciclo del mes anterior".
   Comprueba qué ciclo estaría abierto a esa hora
   y cuál es el que hay que cerrar. No es obvio.
```

Mira también cómo se calcula hoy `fecha_fin` del ciclo y si encaja.

## E · Con qué se programa

```
   pg_cron NO está en el instalador.
   Compruébalo en las dos bases.
```

```
   · ¿Está disponible en el plan gratuito?
   · ¿O conviene una Edge Function programada?
   · ¿O algo fuera de Supabase?

   Ventajas, inconvenientes y coste de cada una.
```

## F · 🔴 Qué pasa cuando falle

Porque va a fallar alguna vez. Sin luz, sin internet, la base dormida, un error
del motor.

```
   · ¿Quién se entera, y cómo?
   · ¿Se reintenta? ¿Cuántas veces?
   · Si falla el día 1, ¿el día 2 se cierra igual
     o se queda el ciclo abierto para siempre?
   · ¿Puede correr dos veces y cerrar dos ciclos?
```

```
   El acta dice que Máximo rechazó los avisos
   automáticos por correo y WhatsApp.

   Así que si el cierre falla de madrugada,
   ahora mismo NO HAY FORMA de que se entere.
   Esa contradicción hay que resolverla.
```

## G · ¿Sigue existiendo el botón?

```
   · ¿Máximo puede seguir cerrando a mano si
     quiere adelantar o si el automático falló?
   · ¿Qué pasa si pulsa el botón el día 1 a las
     2:50 de la mañana?
   · ¿Y si el automático arranca mientras él
     está confirmando un pago?
```

---

# LO QUE TIENES QUE REPORTAR

```
· Lo de fn_is_admin() con service_role · PROBADO,
  no supuesto · en la PRIMERA línea
· Qué validaciones hay que mover al servidor y
  qué se rompe al moverlas
· Las opciones para los pagos sin confirmar, sin
  elegir tú
· Cómo se calcula la hora y qué ciclo toca cerrar
· Las alternativas para programarlo, con su coste
· Qué pasa cuando falla, y cómo se entera Máximo
· Qué requisitos del RF-370 al RF-385 habría que
  reescribir
· Tu recomendación, y qué NO harías
```

```
   🔴 NO toques nada. Ni una línea.

   Esto reparte el dinero de toda la red y no se
   deshace. Se investiga entero, se decide con
   Jack y con Máximo, y después se implementa.
```

Si algo no se puede hacer como lo pide Máximo, dilo claro. Es mejor decírselo
ahora que descubrirlo el día 1 a las 3 de la mañana.
