# TAREA-45 · El cierre escribe dinero desde el navegador

**Proyecto:** SISTEMA MOTOR Y BACKOFFICE
**Gravedad:** 🔴 EL CIERRE DE MES ESTÁ ROTO AHORA MISMO
**Fecha del hallazgo:** 17 de septiembre de 2026
**Viene de:** TAREA-44

---

# ANTES DE TOCAR NADA

```
   05-CONTROL/LECCIONES-Y-PATRONES.md
   00-INSTRUCCIONES/TAREA-44-EL-PAGO-DIRECTO-NUNCA-SE-INSTALO.md
   supabase/instalador/04-rls-y-grants.sql
```

La TAREA-44 quedó bien hecha y verificada. **Pero destapó algo que llevaba
meses ahí**, y al cerrar el permiso lo convirtió en un fallo visible.

No hay nada que reprochar: el fallo es viejo, el arreglo lo sacó a la luz. Eso
es exactamente para lo que sirve cerrar permisos.

---

# BLOQUE 0 · 🔴 URGENTE · EL CIERRE DE MES NO FUNCIONA

## Lo que pasa

`src/servicios/operacionAdmin.js:802`

```js
export async function ejecutarCierreCiclo(cicloId, sbClient = supabase) {
  // 1. PASO CRÍTICO: Calcular y persistir rangos y comisiones de rango
  const resumenRango = await calcularYPersistirRangosDelCiclo(cicloId, sbClient);

  // 2. PASO ATÓMICO: Ejecutar cierre en Postgres
  const { data, error } = await sbClient.rpc('fn_ejecutar_cierre_ciclo', {...});
```

El paso 1 va a `src/motor/persistenciaRango.js`, que escribe **desde el
navegador**:

```
   línea 263   INSERT en rango_ciclo
   línea 273   INSERT en comision      ← esto es DINERO
```

Verificado hoy en producción:

```sql
select has_table_privilege('authenticated','public.comision','INSERT');
→ false
```

```
   🔴 Máximo no puede cerrar el mes.
      El bono de rango no se puede escribir.
```

## Por qué es peor de lo que parece

```
   Solo falla cuando alguien CALIFICA a un bono de rango.

   Si nadie califica, calculo.comisiones.length === 0,
   el bucle no se ejecuta y el cierre pasa sin problema.

   Es decir: falla justo el mes en que hay dinero
   que repartir, no antes.
```

Por eso la suite de la TAREA-44 no lo detectó.

## Y el problema de fondo, que es más grave que el permiso

Aunque devolvieras el permiso, **esto estaría mal igual**:

```
   El bono de rango de toda la red se calcula en
   JavaScript, en el navegador de Máximo, y se
   escribe en lotes de 500 filas sin transacción.

   Si se corta la luz, se cierra el navegador o
   falla la red en el lote 3 de 7:
     · quedan comisiones a medias
     · el ciclo NO está cerrado
     · y al reintentar, la idempotencia ve que
       rango_ciclo ya tiene filas y se salta todo
```

Eso deja el cierre en un estado del que no se sale solo.

## Qué hacer

**Mover el cálculo y la persistencia del rango a una función de Postgres**, como
ya está todo lo demás.

```
   fn_calcular_y_persistir_rangos(p_ciclo_id bigint)
     SECURITY DEFINER
     · calcula el rango de cada socio del ciclo
     · aplica la línea estirada (50% máximo por línea)
     · inserta en rango_ciclo
     · inserta las comisiones de tipo 'rango'
     · TODO en una transacción
     · idempotente: si el ciclo ya tiene rangos, no hace nada
```

La lógica ya existe y está probada en `src/motor/persistenciaRango.js` y
`calcularRangosEnMemoria`. **No la reinventes: tradúcela.**

Después, `ejecutarCierreCiclo` queda así:

```js
export async function ejecutarCierreCiclo(cicloId, sbClient = supabase) {
  const { data, error } = await sbClient.rpc('fn_ejecutar_cierre_ciclo', {
    p_ciclo_id: Number(cicloId)
  });
  ...
}
```

Y lo ideal es que `fn_ejecutar_cierre_ciclo` llame dentro a
`fn_calcular_y_persistir_rangos`, para que **cerrar el mes sea una sola
transacción de principio a fin**. Si ves un motivo para no hacerlo así, dilo
antes de decidirlo tú.

```
   🔴 NO devuelvas el permiso de INSERT sobre comision
      para que esto vuelva a funcionar. Eso es tapar
      el agujero con el problema original.
```

## Cómo se comprueba

```
   1 · En la DEMO, en un ciclo abierto con al menos un
       socio que califique a rango, cerrar el mes.
       Debe funcionar y escribir las comisiones de rango.

   2 · Comprobar que las comisiones de rango del ciclo
       coinciden una a una con el cálculo anterior.
       Pega los dos totales.

   3 · Volver a ejecutar el cierre del mismo ciclo:
       debe rechazarlo, no duplicar nada.
```

---

# BLOQUE 1 · P-32 ESCRIBE PRODUCTOS DIRECTAMENTE

`src/servicios/operacionAdmin.js`

```
   2299  INSERT en producto
   2399  UPDATE en producto
   2439  UPDATE en producto
```

Hoy funciona porque `producto` todavía conserva `INSERT` y `UPDATE` para
`authenticated`. **Pero el instalador dice que solo debería tener `SELECT`**
(línea 281). Producción y el instalador no coinciden.

Esto **no es dinero** y no corre prisa, pero hay que decidirlo:

```
   A · Moverlo a una función, como todo lo demás
       Coherente, auditable, y alinea con el instalador

   B · Concederlo explícitamente en el instalador
       GRANT SELECT, INSERT, UPDATE ON producto
       Más simple, pero el catálogo se edita sin
       pasar por auditoría
```

**Reporta cuál eliges y por qué. No lo decidas en silencio.** Fíjate en que
las líneas 2316, 2417 y 2451 ya insertan en `auditoria` a mano: si se mueve a
una función, eso se hace dentro y deja de depender del cliente.

---

# BLOQUE 2 · ALINEAR EL RESTO DE PERMISOS

Verificado hoy: **24 tablas conservan `DELETE`, `UPDATE` y `TRUNCATE` para
`authenticated`** en las dos bases, cuando el instalador solo concede `SELECT` a
la mayoría.

Las trece sensibles tienen además una política `ALL`, así que **una sesión de
admin puede cambiarlas directamente, saltándose las funciones y sin dejar rastro
en auditoría**:

```
   config              los porcentajes del plan
   nivel_comision      el % de cada nivel
   activacion          quién está activo → quién cobra
   red_ancestro        el árbol de la red → a quién le toca
   rango_ciclo         el rango alcanzado → el bono
   pack                los precios
   movimiento_puntos · periodo_global · ciclo
   producto · rango · punto_entrega · pack_comision_especial
```

Cambiar un porcentaje de `config` a mano, sin pasar por
`fn_actualizar_config_ajustable`, **no queda registrado en ninguna parte**. Y
decide lo que cobra toda la red.

## El objetivo

Que las dos bases queden **exactamente** como dice el instalador. Esa lista es
la fuente de verdad y ya está escrita en `04-rls-y-grants.sql`, líneas 279-313.

## Cómo, sin romper nada

```
   1 · Barrido previo. Busca en src/ (sin tests) toda
       escritura directa a esas tablas:
       insert, update, delete, upsert.

       Ya te adelanto lo que encontré:
         motor/persistenciaRango.js  263 y 273  (Bloque 0)
         servicios/operacionAdmin.js 2299, 2399, 2439 (Bloque 1)

       Si encuentras más, PARA y repórtalo antes de revocar.

   2 · Aplica el estado del instalador en la DEMO.

   3 · Corre la suite COMPLETA y recorre a mano las
       pantallas de administración.

   4 · Lo que se rompa se arregla moviéndolo a una
       función. NO devolviendo el permiso.

   5 · Solo cuando la demo esté limpia, producción.
```

---

# BLOQUE 3 · LAS DOS PRUEBAS QUE DEJASTE REPORTADAS

Hiciste bien en no tocarlas. Ahora sí se arreglan:

**`src/test/baja-socio.test.js:145`** — su preparación inserta en
`wallet_movimiento` desde el cliente. Es la prueba la que está mal, no el
permiso: debe montar el escenario con una función, o con `service_role`.

**`src/test/auth-rls.test.js:107`** — esperaba
`violates row-level security policy` y ahora llega
`permission denied for table comision`. **El sistema mejoró**: el rechazo
ocurre antes, a nivel de permisos, sin llegar a evaluar RLS. Actualiza la
expectativa para aceptar los dos, y deja un comentario explicando por qué.

---

# LO QUE TIENES QUE REPORTAR

```
· La función de rango nueva, y la salida del cierre
  de un ciclo real en la DEMO con bono de rango
· Los totales del bono de rango antes y después,
  para comprobar que calcula igual
· El segundo intento de cierre, que debe rechazarse
· Qué decidiste en el Bloque 1 y por qué
· El barrido de escrituras directas, completo
· La tabla de permisos de las DOS bases, después
· La suite completa en verde
```

```
   🔴 Si algo queda sin ejecutar, va en la PRIMERA
      línea del informe. No en un paréntesis.
      Y ese informe no se titula "de cierre".
```

Si algo de esta tarea no cuadra con lo que ves, para y dilo antes de tocar nada.
