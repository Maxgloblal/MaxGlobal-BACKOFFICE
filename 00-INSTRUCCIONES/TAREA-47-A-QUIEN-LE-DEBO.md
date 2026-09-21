# TAREA-47 · A quién le debo

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🟠 El cliente ya cerró un ciclo y no sabe a quién pagar
**Fecha:** 17 de septiembre de 2026

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   00-INSTRUCCIONES/TAREA-15-RETIROS-COMPLETOS.md
   00-INSTRUCCIONES/TAREA-43-PAGO-DIRECTO-DE-BILLETERA.md
```

```
   🔴 ESTA TAREA NO TOCA EL MOTOR DE COMISIONES.

   Ni fn_ejecutar_cierre_ciclo, ni
   fn_calcular_y_persistir_rangos, ni
   fn_confirmar_orden_pago.

   Todo lo que se pide aquí es LEER lo que el motor
   ya calculó y mostrarlo bien. Si te ves modificando
   cómo se calcula algo, para: te saliste de la tarea.
```

```
   🔴 NO SE QUITA NADA. TODO SE SUMA.

   El socio SIGUE pidiendo su retiro desde P-19.
   A Máximo le SIGUE llegando a la bandeja de
   pendientes. La aprueba igual que siempre.

   P-19 · Mi Billetera         NO SE TOCA
   P-30 · pestaña pendientes   NO SE TOCA
   P-30 · pestaña historial    NO SE TOCA
   fn_aprobar_solicitud_retiro NO SE TOCA

   Lo único nuevo es UNA pestaña más en P-30.

   Si en algún momento te parece que la pestaña de
   pendientes "ya no hace falta", PARA. Sí hace
   falta, y por un motivo que no es técnico:
```

**Por qué el socio tiene que poder seguir pidiendo.** Una solicitud de retiro es
la constancia, con fecha y monto, de que el socio quiso cobrar. Si el único
camino fuera que Máximo pague por su cuenta, esa huella desaparece — y el día
que haya una discusión sobre cuándo se pidió y cuándo se pagó, no habría con qué
resolverla.

Los dos caminos conviven, igual que en la TAREA-43:

```
   El socio pide   →  P-30 pendientes       →  aprobar
   Máximo decide   →  P-30 a quién le debo  →  pagar directo
```

---

# EL PROBLEMA, EN UNA FRASE

```
   El sistema espera que el socio PIDA.
   Máximo trabaja al revés: quiere ver a quién le
   debe y pagarle.
```

Datos reales de la DEMO, hoy:

```
   66 socios con saldo        S/. 16,398.47 en total
   40 pueden cobrar ya        (llegan a los S/. 100)
   11 lo han solicitado
  530 socios SIN CCI cargado
```

Máximo cerró el ciclo 1 y **no tiene ninguna pantalla que le diga eso**.

## Las tres carencias concretas

**1 · El CSV bancario se evapora.** `P25CierreCiclo.jsx:110` lo genera en el
momento del cierre. No hay pantalla de cierres anteriores: una vez que sale de
ahí, no puede recuperarlo.

**2 · Dos cifras distintas que parecen la misma.**

```
   operacionAdmin.js:838
     el CSV suma las COMISIONES DEL CICLO

   v_wallet_saldo
     la billetera acumula TODO lo no cobrado
```

Si un socio no cobró el mes pasado, su billetera trae más que sus comisiones de
este ciclo. **Lo que Máximo debe pagar es la billetera, no el ciclo.**

**3 · Nadie persigue el CCI.** El CSV marca a los socios sin CCI como no aptos
y ahí muere. No hay lista, ni aviso, ni forma de pedírselo.

---

# BLOQUE 1 · LA PANTALLA DE "A QUIÉN LE DEBO"

Va dentro de **P-30 · Gestión de Retiros**, como una pestaña nueva junto a
`pendientes` e `historial` (hoy el filtro está en `P30GestionRetiros.jsx:55`).

```
   [ Solicitudes pendientes ]  [ A quién le debo ]  [ Historial ]
```

## Qué muestra

Todos los socios con `v_wallet_saldo.saldo_cent > 0`, **pidan o no**, ordenados
de mayor a menor saldo:

| Columna | De dónde sale |
|---|---|
| Código y nombre | `socio` |
| Saldo disponible | `v_wallet_saldo.saldo_cent` |
| Banco y CCI | `socio.banco`, `socio.cci` |
| Estado | calculado, ver abajo |
| Acción | el botón de pago directo de la TAREA-43 |

## Los cuatro estados

```
   ✅ LISTO PARA PAGAR
      saldo >= mínimo  ·  tiene banco  ·  tiene CCI

   🟡 LE FALTA EL CCI
      saldo >= mínimo  ·  pero no se le puede transferir

   ⬜ AÚN NO LLEGA AL MÍNIMO
      saldo < S/. 100 · sigue acumulando, no es un problema

   🔵 YA LO SOLICITÓ
      tiene una solicitud_retiro pendiente
      → se atiende por la pestaña de siempre
```

El mínimo sale de `config`, **no lo escribas a mano**. Ya se lee así en
`operacionAdmin.js:834`.

## Arriba, tres cifras

```
   TOTAL ADEUDADO        suma de todos los saldos
   LISTO PARA PAGAR      suma de los que están en verde
   TRABADO POR EL CCI    suma de los amarillos
```

Esa tercera cifra es la que hace que alguien se ocupe del problema.

## El botón de pagar

Reusa `registrarPagoDirectoSocioAdmin` de la TAREA-43, que ya está instalada y
verificada en las dos bases. **No escribas una función nueva.**

---

# BLOQUE 2 · EL CSV, DESDE LA BILLETERA

Hoy el CSV se arma desde las comisiones del ciclo. Añade la posibilidad de
armarlo **desde el saldo de la billetera**, que es lo que de verdad se paga.

```
   Botón:  Descargar CSV de lo que debo hoy
```

Mismas columnas y mismos motivos de exclusión que el de P-25 — **reusa esa
lógica, no la dupliques**. Lo único que cambia es la fuente: `v_wallet_saldo` en
vez de `comision` filtrada por ciclo.

```
   🔴 NO toques el CSV de P-25. Ese sigue igual:
      es la foto del cierre y tiene su propio valor.
      Este es otro, con otro propósito.
```

---

# BLOQUE 3 · HISTÓRICO DE CIERRES

En **P-25**, una sección o pestaña que liste los ciclos ya cerrados, y por cada
uno permita volver a ver y descargar lo que se generó ese día.

```
   ciclo · mes · fecha de cierre · total en comisiones ·
   socios beneficiados · [ ver detalle ] [ descargar CSV ]
```

El detalle se reconstruye de `comision` filtrando por `ciclo_id`, que es
exactamente lo que ya hace `operacionAdmin.js:838`. **Es la misma consulta con
otro ciclo.**

Máximo cerró el ciclo 1 sin guardar nada. Con esto lo recupera.

---

# BLOQUE 4 · PERSEGUIR EL CCI

530 socios sin CCI. Sin ese dato no se les puede transferir aunque tengan saldo.

Dos cosas pequeñas:

```
   · En P-27 · Gestión de socios, un filtro:
     "sin datos bancarios completos"

   · En el panel del socio (P-11 o P-19), un aviso
     cuando tenga saldo y le falte el CCI:
     "Completa tus datos bancarios para poder cobrar"
     con enlace a Mi Perfil
```

El segundo resuelve el problema solo: el socio que ve dinero suyo trabado lo
completa el mismo día.

---

# BLOQUE 5 · EL MANUAL ESTÁ INCOMPLETO

`ENTREGA-MAX-GLOBAL/01-MANUAL-DE-OPERACION`, capítulo 5, hoy solo enseña el
camino donde el socio pide primero:

```
   1 · El socio pide su retiro desde SU propia pantalla
   2 · A usted le aparece en Retiros
   ...
```

**No menciona el pago directo de la TAREA-43 ni la pantalla nueva.** Hay que
añadir el segundo camino, con las mismas palabras llanas que el resto del
manual.

```
   🔴 Ese archivo NO está en este repositorio.
      Está en la carpeta de entrega al cliente.
      NO lo edites: dime qué debe decir y lo
      escribo yo.
```

---

# LO QUE TIENES QUE REPORTAR

```
· Capturas de la pestaña nueva, DENTRO del repositorio,
  en 00-INSTRUCCIONES/capturas-t47/
· Las tres cifras de arriba, contra la consulta directa
  a v_wallet_saldo · tienen que coincidir
· El CSV descargado, con sus filas
· El histórico de cierres, con el ciclo 1 recuperado
· Las pruebas nuevas, con su salida
· Confirmación de que NO tocaste ninguna función
  del motor de comisiones
```

Si algo de esta tarea no cuadra con lo que ves, para y dilo antes de tocar nada.

---

# LO QUE NO ENTRA EN ESTA TAREA

```
   El cobro rápido del patrocinio.

   Depende de dos respuestas de Máximo que todavía
   no tenemos, y toca el motor de comisiones, que es
   lo único hoy verificado al centavo.

   Está agendado en 00-EMPEZAR-AQUI/01-ESTADO-DEL-PROYECTO.md
   No lo adelantes.
```
