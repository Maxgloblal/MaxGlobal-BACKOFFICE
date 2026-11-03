# ESPECIFICACIÓN · LA ACTIVACIÓN

**Escrita:** 7 de septiembre de 2026
**Motivo:** Jack reportó que P-27 mostraba a todos inactivos. Al investigarlo
aparecieron cuatro sospechas. **Dos eran comportamiento correcto y dos no.**

> Este documento existe porque casi "arreglamos" algo que estaba bien.

---

# 1 · DÓNDE SE CALCULA LA ACTIVACIÓN

## Lo que decía la documentación

```
   03-SISTEMA/02-MODELO-DE-DATOS.md

   ### `activacion`
   Si el socio llegó a sus 70 puntos en el ciclo. Se calcula al cierre.
```

## Lo que hace el código — verificado el 7/09

```sql
   fn_confirmar_orden_pago      INSERT INTO public.activacion   ✅
   fn_ejecutar_cierre_ciclo     no la toca. En absoluto.
   fn_registrar_pedido_recompra no la toca.
```

## Veredicto: **la documentación está mal, el código está bien**

La activación se acumula **al confirmar cada orden**, no al cierre. Y tiene que
ser así:

```
   03-SISTEMA/09-RF-BACKOFFICE-SOCIO.md

   RF-234 · El carrito DEBE mostrar el avance hacia los
            70 puntos de activación
```

**Un avance que solo se calcula al cierre no es un avance.** Si el cálculo
ocurriera al cerrar el mes, RF-234 sería imposible de cumplir y el socio no
podría saber cuánto le falta para activarse — que es justo la decisión que el
plan quiere que tome.

```
   🔴 CORREGIR LA DOCUMENTACIÓN, NO EL CÓDIGO.

   02-MODELO-DE-DATOS.md debe decir:
     "Se acumula al confirmar cada orden del ciclo.
      Sin fila = el socio no ha comprado en ese ciclo."
```

---

# 2 · POR QUÉ LOS CICLOS 4, 5 Y 6 TIENEN 3 FILAS Y LOS OTROS 501

```
   ciclo 1  jun  cerrado   501 filas · 277 activos
   ciclo 2  jul  cerrado   501 filas · 252 activos
   ciclo 3  ago  cerrado   501 filas · 265 activos
   ciclo 4  sep  cerrado     3 filas ·   3 activos
   ciclo 5  oct  cerrado     3 filas ·   3 activos
   ciclo 6  nov  ABIERTO     2 filas ·   2 activos
```

**Parece que el cierre de los ciclos 4 y 5 falló. No falló.**

```
   Ciclos 1-3    datos SEMBRADOS. El seed escribió una fila
                 por socio, hubiera comprado o no.

   Ciclos 4-6    operación REAL, hecha por nosotros en el QA.
                 Solo hay fila de quien confirmó una orden.
                 En esos ciclos compraron 3, 3 y 2 socios.
```

## Veredicto: **no es un bug. Es la diferencia entre el sembrado y la realidad**

```
   Sin fila  =  no compró  =  no está activo  =  no cobra
```

Y eso es exactamente lo que manda el plan:

```
   00-EMPEZAR-AQUI/06-DOCUMENTO-MAESTRO.md · regla 4
   "Sin activación no cobra nada"
   → "si un socio no llega a los 70 puntos pierde todo"
```

El motor lo respeta: `persistenciaRango.js` trata al socio sin fila como
`{ activo: false, puntos_personales: 0 }`. Ya lo certificamos en vivo el 4/09
—sin activación, cero pagado, el dinero se queda en la empresa.

```
   🔴 NO se rellena `activacion` con filas en cero.
   🔴 NO se toca fn_ejecutar_cierre_ciclo para que "arregle" esto.
      No hay nada que arreglar.
```

---

# 3 · QUE 506 SOCIOS SALGAN INACTIVOS EN NOVIEMBRE

## Veredicto: **correcto. La pantalla dice la verdad**

Nadie compró en noviembre salvo dos socios. `Inactivo (0 pts)` es un hecho, no
un dato faltante.

**Corrijo lo que yo mismo escribí en la TAREA-27.** Puse que había que cambiar
el texto a *"sin actividad aún"* porque el cálculo no había ocurrido. Estaba mal
fundado: el cálculo **sí** ocurre, orden por orden. Quien tiene 0 puntos es
porque no compró, no porque falte calcular.

```
   ❌ "Sin actividad aún"   sugiere que falta un cálculo. Falso.
   ✅ "Inactivo (0 pts)"    es correcto y ya está bien.
```

Lo único que vale la pena agregar es contexto, no cambiar el dato:

```
   En un ciclo ABIERTO, junto al filtro:
   ℹ️  El mes está en curso. Estos números cambian con
       cada compra que se confirme.
```

---

# 4 · EL FILTRO "ACTIVOS EN CICLO 6" DEVUELVE VACÍO

## Veredicto: **esto sí es un bug, y no está explicado**

```
   Los 2 activos del ciclo 6 son MG00012 y MG00014
   Los dos están DENTRO de los primeros 25 socios por id
   → con el filtro "Activos", la página 1 debería mostrar 2
   → la pantalla muestra 0
```

Hay además un defecto de diseño independiente, que hoy no causa este síntoma
pero causaría otro peor:

```js
   operacionAdmin.js:1074-1079
   // se filtra DESPUÉS de paginar
   resultadoFinal = sociosConEstado.filter(s => s.activacionCiclo.activo);
```

```
   Con 508 socios y los activos en la página 7:
   las páginas 1 a 6 saldrían vacías
   y el contador seguiría diciendo "508 socios en total"
```

**La causa del síntoma concreto no se puede determinar sin la pestaña Network.**
Queda como diagnóstico pendiente, no como arreglo a ciegas.

---

# 5 · EL ERROR QUE SE TRAGA EN SILENCIO

```js
   operacionAdmin.js:1050
   const { data: activaciones } = await sbClient.from('activacion')...
```

## Veredicto: **es un defecto real, pero NO es lo que rompió esta pantalla**

Hay que decirlo con precisión, porque me equivoqué al presentarlo:

```
   Con .maybeSingle() o con un .in() vacío, una fila que
   NO EXISTE devuelve data en null SIN error.
   Manejarlo con `act?.puntos || 0` es CORRECTO.

   El problema no es el null. Es que un FALLO REAL
   produce exactamente el mismo null.
```

```
   Hoy no está fallando: los permisos están, RLS está,
   el admin lee `activacion` sin problema.
```

**Entonces, ¿por qué corregirlo?** Porque es lo que nos costó dos horas: no se
podía distinguir "nadie está activo" de "la consulta falló". Es un defecto de
**diagnosticabilidad**, no de comportamiento.

## Alcance real, medido

```
   src/servicios    17 consultas sin comprobar error
   src/motor         1
   src/armazon       1
   src/paginas       0
   ─────────────────────
                    19 en código de producción
```

**Y el propio archivo ya lo hace bien en otros sitios** —`operacionAdmin.js:133`
recoge `error: errAct`—, así que es inconsistencia, no criterio.

```
   Prioridad: media. No urgente.
   Ninguna está fallando hoy.
```

---

# 7 · ACUMULAR PUNTOS VS DECIDIR EL PAGO DE COMISIONES (TAREA-49)

## La distinción esencial que faltaba

```
   ✅ CÓMO SE ACUMULA la activación:
      Progresivamente, al confirmar cada orden en fn_confirmar_orden_pago.
      Permite al socio ver su avance hacia los 70 puntos (RF-234).
      Sin fila = el socio aún no ha comprado en este ciclo.

   🔴 CUÁNDO SE DECIDE si una comisión se paga:
      Al CIERRE del ciclo en fn_ejecutar_cierre_ciclo, NO en el instante de la orden.
```

## Por qué es crítico
A principio de mes (ej. día 2), los socios del upline no tienen fila de activación aún.
Si un referido compra, la comisión de la línea ascendente se registra en `comision` con `estado: 'retenida'`.
Al cierre de mes:
- Si el socio terminó **ACTIVO** (`activo = true`) → la comisión pasa a `'confirmada'` y se abona a su billetera.
- Si el socio terminó **INACTIVO** → la comisión pasa a `'anulada'` (queda para la empresa sin compresión, con auditoría de monto y beneficiario).
- Si el nivel superaba el pack (`pack_insuficiente`) → pasa a `'anulada'` siempre.

---

# RESUMEN — qué se corrige y qué no

| # | Sospecha | Veredicto | Acción |
|---|---|---|---|
| 1 | La activación se calcula al cierre | **Doc equivocada** | Corregir 02-MODELO-DE-DATOS |
| 2 | El cierre de los ciclos 4 y 5 falló | **No es bug** | Documentar. No tocar nada |
| 3 | 506 socios salen inactivos | **Correcto** | Solo agregar contexto en pantalla |
| 4 | El filtro "Activos" devuelve vacío | **Bug real** | Diagnosticar con Network primero |
| 5 | El error se traga en silencio | **Defecto real, no urgente** | 19 sitios, sin prisa |
| 6 | `Septiembre 2026` escrito a mano | **Bug real** | P27:527 y P27:60 |

---

# LO QUE ESTO ENSEÑA

Dos de las seis eran comportamiento correcto que estuve a punto de mandar a
"arreglar". La regla que sale de acá:

```
   Antes de llamar bug a una diferencia entre la pantalla
   y lo que uno espera, hay que preguntarse:

   1 · ¿Qué dice el requisito, no la intuición?
   2 · ¿La documentación describe el código, o quedó vieja?
   3 · ¿Los datos que estoy mirando son SEMBRADOS o REALES?
```

**La tercera es la que más me falló.** Comparé ciclos sembrados con ciclos
operados de verdad y leí como avería lo que era la diferencia entre un seed y
el sistema funcionando.
