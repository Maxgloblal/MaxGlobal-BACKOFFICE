# TAREA-38 · CORRECCIONES DEL QA DEL NAVEGADOR

**Para:** Antigravity
**Escrita:** 15 de septiembre de 2026

> ## 🔴 UNA CORRECCIÓN Y UN DIAGNÓSTICO
>
> El bloque 1 tiene la causa **probada**: se arregla.
> El bloque 2 **no la tiene**: se investiga y no se toca nada.
>
> Tu explicación del banner verde no cuadra con el código. La reviso abajo con
> las líneas exactas. No es un reproche — es que arreglar sobre una causa falsa
> rompe cosas que funcionan.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**:

```bash
git status --short
npm run build
npx vitest run
```

**Commit después de CADA bloque.**

---

# BLOQUE 1 · 🔴 LOS CINCO CICLOS ESCRITOS A MANO

## La causa está probada

```
   src/paginas/P13TiendaRecompra.jsx:31   useState(3)
   src/paginas/P14MisComisiones.jsx:32    useState(3)
   src/paginas/P15MiRango.jsx:27          useState(3)
   src/paginas/P19MiBilletera.jsx:30      useState(3)
   src/paginas/P28Reportes.jsx:30         useState(3)
```

```
   El ciclo abierto es el 30 (diciembre 2026).
   Las cinco arrancan mostrando el ciclo 3 (agosto, cerrado).
```

## Por qué importa

```
   Karla entra a "Mis Comisiones"
   → ve S/. 28.80 del ciclo 3
   → cree que es lo de este mes

   P-28 dice "TOTAL RECAUDADO S/. 160,349.00"
   → es solo el ciclo 3
   → la base tiene S/. 690,521.00 confirmados en total
```

## Lo que hay que hacer

```
   Las cinco arrancan en el CICLO ABIERTO, no en un número.

   · Se obtiene igual que lo hace hoy operacionAdmin.js:
     .from('ciclo').select('id').eq('estado','abierto')
   · El selector queda posicionado en ese ciclo
   · El socio puede cambiarlo a meses anteriores
```

```
   🔴 NO inventes un contexto global ni un hook nuevo
      si no hace falta. La corrección mínima es que el
      valor inicial salga de la base, no de un literal.

   🔴 Mientras carga, la pantalla NO debe mostrar datos
      de un ciclo equivocado. Mejor un estado de carga
      que una cifra falsa.
```

## Este bug es ORIGINAL, no lo introdujimos

Verificado con `git log -S`:

```
   P-13  nació 02/09 · TAREA-08
   P-14  nació 02/09 · TAREA-07
   P-15  nació 02/09 · TAREA-07
   P-19  nació 02/09 · TAREA-07
   P-28  nació 02/09 · TAREA-10

   El useState(3) se escribió el día que nacieron
   y nunca se volvió a tocar.
```

**Ese día era correcto:** la demo tenía tres ciclos y el 3 era el actual. Se
volvió falso cuando la demo avanzó al ciclo 30.

**Commit.**

---

# BLOQUE 2 · 🔴 EL BANNER VERDE — SOLO DIAGNÓSTICO

## Tu explicación no cuadra con el código

Reportaste:

> *"El frontend de P-23 no atrapa el código de error 400 y muestra el banner
> verde falso."*

**El código sí lo atrapa.** Verificado línea por línea:

```js
   operacionAdmin.js:211-219
   export async function confirmarPagoOrden(...) {
     const { data, error } = await sbClient.rpc('fn_confirmar_orden_pago', ...);
     if (error) throw error;      ← LANZA
     return data;
   }
```

```js
   P23BandejaConfirmacion.jsx:226-249
   try {
     const res = await confirmarPagoOrden(...);
     if (res && res.exito === false) { ...error... }
     else { ...éxito... }
   } catch (err) {
     setMensajeAlerta({ tipo: 'error', texto: err.message ... });   ← ATRAPA
   }
```

```
   Si fn_confirmar_orden_pago devuelve 400, el servicio lanza,
   el catch lo recoge y la pantalla DEBERÍA mostrar el error.
```

**Lo que viste es real. La causa que dedujiste no se sostiene.**

## Lo que hay que averiguar — sin tocar nada

```
   1 · Repite el intento con F12 → Network abierto.
       Lista TODAS las peticiones que se disparan al pulsar
       "Sí, Confirmar y Acreditar", en orden, con su código.

       🔴 ¿El 400 vino de fn_confirmar_orden_pago,
          o de otra llamada (calcularImpactoOrden,
          la recarga posterior, el refresco de la bandeja)?

   2 · Pon un punto de interrupción, o mira en Console:
       · ¿entró al catch?
       · ¿qué valía `res`?
       · ¿qué valía `err.message`?

   3 · ¿El banner verde salió ANTES o DESPUÉS del 400?
       Compara las marcas de tiempo.

   4 · ¿Se queda el banner verde en pantalla, o aparece
       y luego lo reemplaza el de error?
```

```
   🔴 NO modifiques P-23 ni operacionAdmin.js en esta tarea.
      Si el manejo de errores ya funciona y lo "arreglas",
      rompes algo que está bien.

   🔴 Si después de investigar no puedes determinar la causa,
      dilo. Es una respuesta válida y mejor que una hipótesis
      presentada como hecho.
```

**Commit del diagnóstico.**

---

# LO QUE SE QUEDA ANOTADO Y NO SE TOCA

## Las 7 órdenes de ciclos cerrados

```
   Ciclo 2 (cerrado):  496 · 497 · 498 · 499
   Ciclo 6 (cerrado):  1385 · 1386 · 1387
```

**Son datos sembrados.** Se estudió crear un estado `caducada` y se **descartó**:

```
   · orden.estado NO tiene CHECK, aceptaría el texto
   · pero el código ya reconoce 4 estados:
     por_confirmar · confirmada · pagada · rechazada
   · P30:149 filtra por  estado !== 'pendiente'
   · motor/persistencia.js:143 solo cuenta 'confirmada'
   · fn_confirmar_orden_pago exige estado='por_confirmar'
```

```
   🔴 Un estado nuevo tocaría el motor, el cierre, cinco
      pantallas y dos funciones SQL. Para siete filas
      sembradas en una demo, NO vale la pena el riesgo.
```

**En producción este problema no existe:** nace vacía. Solo aparecería si Máximo
cierra un mes dejando pedidos sin confirmar.

```
   📌 PARA PRODUCCIÓN, otra tarea:
      P-25 debe AVISAR antes de cerrar si quedan órdenes
      en `por_confirmar` del ciclo que se va a cerrar.
      Prevenir, no inventar un estado después.
```

## Los 6 px de la cabecera móvil

```
   ArmazonSocio.jsx · el badge y el avatar desbordan 6 px
   a 390 px de ancho. Cosmético. Va con el resto del móvil.
```

---

# BLOQUE 3 · LAS PRUEBAS

```
   1 · Ninguna pantalla arranca con un ciclo escrito a mano
       ← grep de useState([0-9]) sobre cicloSeleccionado
         en src/paginas/ debe quedar VACÍO

   2 · P-14 abierta sin tocar nada muestra el ciclo ABIERTO
   3 · P-28 abierta sin tocar nada muestra el ciclo ABIERTO
   4 · El selector sigue permitiendo elegir ciclos anteriores
   5 · Con el ciclo 6 seleccionado, Karla sigue viendo
       Residual · Nivel 1 · 40% · S/. 28.80
       ← que la corrección no rompa lo que ya funcionaba
```

**La 5 es la que importa.** Protege lo certificado.

**Commit.**

---

# BLOQUE 4 · VERIFICACIÓN

```bash
# 1 · ningún ciclo escrito a mano
grep -rnE "cicloSeleccionado.*useState\([0-9]+\)" src/
#    debe quedar VACÍO

# 2 · P-23 y el servicio NO se tocaron
git diff --stat src/paginas/P23BandejaConfirmacion.jsx src/servicios/operacionAdmin.js
#    debe quedar VACÍO
```

## Capturas

```
   1 · P-14 recién abierta, mostrando el ciclo abierto
   2 · P-28 recién abierta, con el total del ciclo abierto
   3 · El Network completo del intento de confirmar la 496
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              510
   órdenes           1,062
   comisiones        2,423   ·   S/. 101,939.82
   red_ancestro      3,973
   config               39 claves
   productos             8 · precios y puntos sin cambios
   ciclos abiertos       1   (ciclo 30)
   Karla · saldo  S/. 1,718.80
```
