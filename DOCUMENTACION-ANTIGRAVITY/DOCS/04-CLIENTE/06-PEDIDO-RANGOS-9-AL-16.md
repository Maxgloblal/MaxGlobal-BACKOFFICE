# PEDIDO A MÁXIMO · LOS RANGOS QUE FALTAN

**Fecha:** 28 de agosto de 2026
**Estado:** listo para mandar
**Bloquea:** TAREA-04B — bono de rango y bono global

---

## POR QUÉ ESTE PEDIDO ES CORTO

Se revisaron el deck completo, los tres PDF oficiales y las 25 respuestas ya
dadas por WhatsApp. **Casi todo lo que parecía faltar ya estaba respondido.**

```
   ✅  Bono Global          completo — deck lámina 14 + respuesta #16
   ✅  Cierre y pago        fin de mes, pago +3 días, retiro mínimo S/.100
   ✅  Upgrade, baja de socio, cliente sin referido
   ✅  Frontal activo, línea estirada 50%, no apilable
   ✅  Doble Diamante       100,000 pts · 8 frontales · S/.20,000
                            está en Bono_Rangos_Max_Global.pdf
```

**Solo faltan los rangos altos y una decisión de alcance.**

---

## MENSAJE PARA MANDARLE — copiar tal cual

```
Máximo, buenas. El sistema de comisiones ya está funcionando:
patrocinio y residual calculando bien, probado contra 500 socios
de prueba.

Para terminar el bono de rango me faltan los rangos altos.
Del 1 al 8 ya los tengo de tu documento:

   Jade          500 pts     1 frontal    S/.     50
   Bronce      1,000 pts     2 frontales  S/.    100
   Plata       2,000 pts     2 frontales  S/.    200
   Oro         4,000 pts     3 frontales  S/.    500
   Platino     8,000 pts     4 frontales  S/.  1,500
   Esmeralda  15,000 pts     5 frontales  S/.  3,000
   Zafiro     30,000 pts     6 frontales  S/.  5,000
   Diamante   60,000 pts     7 frontales  S/. 10,000

Me faltan estos. ¿Me pasas puntos grupales, frontales activos
y bono de cada uno?

   09  Diamante Negro       ____ pts   ____ front.  S/. ____
   10  Doble Diamante       ____ pts   ____ front.  S/. ____
   11  Triple Diamante      ____ pts   ____ front.  S/. ____
   12  Club de Millonarios  ____ pts   ____ front.  S/. ____
   13  Imperial             ____ pts   ____ front.  S/. ____
   14  Titán                ____ pts   ____ front.  S/. ____
   15  Embajador Royal      ____ pts   ____ front.  S/. ____
   16  Embajador Corona     ____ pts   ____ front.  S/. ____

Y una duda con uno de ellos:

En tu PDF de rangos, después de Diamante viene directo
"Doble Diamante" con 100,000 pts, 8 frontales y S/.20,000.
Pero en el deck, después de Diamante viene "Diamante Negro"
y recién después el Doble Diamante.

¿Esos 100,000 pts / 8 frontales / S/.20,000 son del
Diamante Negro o del Doble Diamante?

Con eso cierro el motor completo.
```

> ## 🔴 CORREGIDO EL 28/08 — se quitó la pregunta de Cumpleaños y Viajes
>
> **Ya estaba decidido y documentado. No se le pregunta.**
>
> ```
>    01-PLAN-DE-COMPENSACION línea 334
>       BONO CUMPLEAÑOS ✅ DEFINIDO — ❌ FUERA DEL SISTEMA
>       el cliente lo maneja aparte
>
>    01-PLAN-DE-COMPENSACION línea 364
>       BONO VIAJES ❌ FUERA DEL SISTEMA
>
>    01-FORMULARIO-PREGUNTAS línea 242
>       el Bono Viajes está en la lista de exclusiones
>       de la cotización, por escrito
> ```
>
> **Y no perjudica dejarlos fuera:**
>
> El Cumpleaños es un **descuento del 70%**, no una comisión. El administrador
> ya puede aplicar descuentos a mano en la orden — es una regla que ya existe.
> Máximo puede darlo desde el primer día. Lo único que falta es automatizar la
> detección por fecha, y `socio.fecha_nacimiento` ya está en la tabla.
>
> El Viajes nunca estuvo dentro del alcance.
>
> **Para agregarlos después:** `comision.tipo` es un `varchar` sin restricción
> de valores. Se suman tipos nuevos sin migración y sin tocar nada existente.

---

## POR QUÉ SE PREGUNTA CADA COSA

### Los 7 rangos sin valores

El deck (lámina 15) tiene los **nombres** de los 16 rangos, pero los números
solo llegan hasta Diamante. Sin puntos, frontales y bono, el motor no puede
calificar a nadie por encima del rango 8.

**No bloquea nada más.** El bono de rango es independiente del patrocinio y del
residual, que ya funcionan.

### La ambigüedad del rango 9

```
   Bono_Rangos_Max_Global.pdf     Diamante  →  Doble Diamante (100,000)
   Deck, lámina 15                Diamante  →  Diamante Negro  →  Doble Diamante
```

El PDF no menciona el Diamante Negro. **Si se asume mal, todos los rangos del 9
al 16 quedan corridos una posición** y el sistema paga el bono equivocado a
todos los líderes altos.

### Cumpleaños y Viajes

Son los dos únicos bonos del plan **sin ninguna definición en ninguna fuente**.
No están en el deck con reglas, ni en los PDF, ni en las 25 respuestas.

```
   Si entran a la v1   →  hay que definirlos y programarlos
   Si no entran        →  se documentan como fuera de alcance
                          y se agregan en una fase posterior
```

---

## LO QUE **NO** SE LE PREGUNTA — ya está respondido

*Para que nadie lo vuelva a preguntar. Cada uno con su fuente.*

| Tema | Dónde está |
|---|---|
| Bono Global: 1%, semestral, Gold+, proporcional, S/.1/punto | Deck lámina 14 + resp. #16 del 26/08 |
| Día de cierre y de pago, retiro mínimo S/.100 | Resp. #17 del 26/08 |
| Upgrade paga pack completo | Resp. #18 del 26/08 |
| Baja de socio: el equipo sube un nivel | Resp. #19 del 26/08 |
| Bono de rango no apilable, según el rango al cierre | 25/08 4:44 pm |
| Si no se activa con 70 pts, no cobra nada | 25/08 4:25 pm |
| Todos los packs cubren la activación del primer mes | Resp. 4.1 |
| Frontal activo = directo con sus 70 puntos | Análisis, regla #10 |
| Línea estirada 50% | Requisitos_Rangos_Backoffice.pdf |
| Jade 1 frontal · Platino S/.1,500 | Decidido por criterio, el deck manda |
| Doble Diamante 100,000 / 8 / S/.20,000 | Bono_Rangos_Max_Global.pdf |

---

## PENDIENTE DE JACK, NO DE MÁXIMO

```
   config tiene DOS reglas de pago conviviendo:
      dia_pago_comisiones = 5
      dias_hasta_pago     = 3

   La respuesta #17 dice "pago +3 días" después del cierre.
   Sobra la fila dia_pago_comisiones. Decidir y borrar una.
```
