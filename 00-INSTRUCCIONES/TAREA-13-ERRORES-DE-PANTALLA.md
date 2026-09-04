# TAREA-13 · LOS CINCO ERRORES DE PANTALLA

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Bloque B del `05-CONTROL/PLAN-DE-CIERRE-V1.md`.**

> **Ninguno rompe el motor.** Los cinco hacen que la pantalla **mienta**: muestra
> S/. 0.00 donde hay dinero, un mes que no es, y un rango inventado. En un
> sistema donde el socio revisa su comisión, una pantalla que miente cuesta lo
> mismo que un cálculo malo.

---

## 🔴 REGLA DE REPORTE

La salida se **pega literal**. Al terminar, siempre:

```bash
git status --short
node -e "const fs=require('fs'),p=require('path');(function w(d){for(const f of fs.readdirSync(d)){const q=p.join(d,f);if(fs.statSync(q).isDirectory())w(q);else{const b=fs.readFileSync(q);if(b.includes(0))console.log('NULL:',q)}}})('src')"
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea no está terminada.**
**Commit después de CADA bloque.**

---

# EL PATRÓN QUE LOS UNE

Cuatro de los cinco son el mismo error: **el código lee un campo que no existe.**

```
   JavaScript no avisa. Devuelve undefined.
   formatearSoles(undefined || 0) pinta S/. 0.00
   La pantalla se ve perfecta y miente.
```

Por eso las 235 pruebas están en verde con estos cinco encima. Y por eso el
bloque 5 de esta tarea construye un guardián que los encuentre solo.

---

# BLOQUE 1 · P-17 MUESTRA S/. 0.00 EN EL DETALLE DEL PEDIDO

```js
   src/paginas/P17MisPedidos.jsx:299   {formatearSoles(d.precio_unit_cent)}
   src/paginas/P17MisPedidos.jsx:300   {formatearSoles(d.subtotal_cent)}
```

**Ninguno de esos dos campos existe.** Lo que trae el servicio
(`socio.js:448-451`) es:

```
   cantidad · precio_final_cent · puntos_unitario · puntos_subtotal
```

**Verificado contra Postgres**, orden `ORD-2026-001306` de Karla:

```
   cantidad             4
   precio_lista_cent    15000   (S/. 150)
   descuento_pct        50.00
   precio_final_cent     7500   (S/.  75)   ← este es el precio unitario
   total de la orden     S/. 300
```

Y la pantalla muestra **S/. 0.00** en las dos columnas.

## Qué se corrige

```
   Precio Unit.   →  d.precio_final_cent
   Subtotal       →  d.precio_final_cent × d.cantidad
```

**No hay columna de subtotal por línea en la tabla.** Se calcula multiplicando.
No inventes un campo ni lo agregues a la base.

**Commit.**

---

# BLOQUE 2 · P-19 MUESTRA S/. 0.00 EN EL SALDO POSTERIOR

```js
   src/paginas/P19MiBilletera.jsx:194   key: 'saldo_posterior_cent'
   src/paginas/P19MiBilletera.jsx:196   formatearSoles(m.saldo_posterior_cent || 0)
```

La columna real es **`saldo_despues_cent`**.

**Verificado:** el movimiento de Karla del ciclo 4 tiene `saldo_despues_cent =
24000` (S/. 240.00) y la pantalla muestra S/. 0.00.

**Commit.**

---

# BLOQUE 3 · LA SOLICITUD DE RETIRO ESTÁ ROTA

Este falla ruidosamente, con el error a la vista del socio:

```
   Could not find the 'cci' column of 'solicitud_retiro' in the schema cache
```

```js
   src/servicios/socio.js  (~línea 148)
   .from('solicitud_retiro').insert({
     socio_id, monto_cent, banco,
     numero_cuenta: numeroCuenta,   ← la columna se llama `cuenta`
     cci,                           ← esa columna NO EXISTE
     estado, solicitado_en
   })
```

**Columnas reales de `solicitud_retiro`:**

```
   id · socio_id · monto_cent · banco · cuenta · estado
   motivo_rechazo · procesado_por · procesado_en · solicitado_en
```

## Qué se hace en este bloque

```
   1 · numero_cuenta  →  cuenta
   2 · El CCI que escribe el socio se guarda dentro de `cuenta`
       SOLO SI no dio número de cuenta. Si dio los dos, manda la cuenta.
   3 · El formulario deja de pedir CCI por ahora
       (el campo de CCI es el punto C1 del plan y va en otra tarea)
```

## 🔴 Lo que NO se hace acá

```
   ❌ NO se agrega la columna cci a la tabla — eso es C1, otra tarea
   ❌ NO se construye la pantalla de admin que aprueba retiros — eso es A3
   ❌ NO se toca la billetera ni se descuenta nada
```

**Este bloque solo hace que el insert funcione.** El flujo completo de retiros
—aprobación del admin y débito de la billetera— es la TAREA siguiente.

**Commit.**

---

# BLOQUE 4 · `ArmazonSocio` TIENE DATOS ESCRITOS A MANO

```jsx
   src/armazon/ArmazonSocio.jsx:27-35
   const socio = socioData || {
     nombre: ... socioAuth ...,
     codigo: ... socioAuth ...,
     rangoVigente: 'Bronce',      ← INVENTADO
     rangoHonorifico: 'Oro',      ← INVENTADO
     ciclo: 'Agosto 2026',        ← INVENTADO
     ...
   };
```

Ninguna pantalla le pasa `socioData`, así que **siempre se usa el respaldo**.
Por eso la barra lateral dice `RANGO: BRONCE` mientras el panel dice
`SIN RANGO` o `JADE`, y la cabecera dice "Agosto 2026" estando en noviembre.

**Verificado contra Postgres:** Karla no tiene ningún rango Bronce. Su honorífico
calculado es **Jade**.

## Qué se hace

```
   1 · Leer el ciclo abierto de la base, igual que ya hace ArmazonAdmin
       tras la TAREA-11. Si no hay ninguno: "Sin ciclo abierto".

   2 · Leer el rango vigente y el honorífico de fn_rango_lineas_socio,
       que ya los devuelve calculados.

   3 · Si no hay dato, mostrar "Sin rango". NUNCA un valor inventado.
```

> 🔴 **Aviso, y es culpa de la instrucción anterior:** la TAREA-11 puso este
> archivo como *"el ejemplo bueno a copiar"* porque la línea 156 usa
> `{socio.ciclo}`. Se leyó la variable sin mirar de dónde salía. **Salía de
> este literal.** Por eso se arregló el admin y el socio quedó igual.

**Commit.**

---

# BLOQUE 5 · EL SOCIO VE CEROS DURANTE TODO EL MES ABIERTO

```js
   src/servicios/socio.js:224   puntosGrupales:    rangoCiclo?.puntos_grupales || 0
   src/servicios/socio.js:225   puntosComputables: rangoCiclo?.puntos_computables || 0
   src/servicios/socio.js:226   frontalesActivos:  rangoCiclo?.frontales_activos || 0
```

Lee la fila de `rango_ciclo`, **y esa fila solo se crea al cerrar el mes**
(lo hace la TAREA-12). Mientras el ciclo está abierto no existe, y el `|| 0`
pinta ceros.

**Comprobado en vivo el 4/09:** con el ciclo 5 abierto, Karla tenía 800 puntos
grupales reales y la pantalla mostraba 0. Al cerrarlo, mostró 800.

## Por qué importa

Lo que empuja a un líder los últimos días del mes es ver el contador subir y
apurar a su equipo para alcanzar el rango. **Si marca cero hasta el día 30, la
pantalla no sirve justo cuando más importa** — y encima parece rota.

## Qué se hace

```
   ciclo ABIERTO   →  calcular en vivo con fn_rango_lineas_socio
   ciclo CERRADO   →  leer la fila guardada de rango_ciclo, SIN recalcular
```

`fn_rango_lineas_socio(socio_id, ciclo_id)` ya devuelve todo lo necesario y
**funciona aunque no exista la fila** — probado con el ciclo 5 abierto:
devolvió las dos líneas con 250 y 250, y 2 frontales activos.

## 🔴 Lo segundo importa TANTO como lo primero

```
   Un ciclo CERRADO debe mostrar lo que SE PAGÓ, no lo que daría
   el cálculo de hoy.
```

Si un ciclo cerrado se recalcula, algún día no va a cuadrar con la comisión que
el socio ya cobró — y esa discusión no se gana con explicaciones. **La fila
guardada es la verdad histórica.**

**Commit.**

---

# BLOQUE 6 · EL GUARDIÁN DE NOMBRES DE CAMPO

Cinco errores del mismo tipo en un día, y 235 pruebas en verde. Hace falta algo
que los encuentre solo.

## Qué se construye

```
   1 · Un script que genera scripts/schema-columnas.json a partir de
       information_schema.columns — las 22 tablas y sus columnas.
       Se genera desde Postgres, NO se escribe a mano.

   2 · Una prueba que recorre src/ buscando accesos del tipo
          .algo_cent   .algo_id   .saldo_*   .precio_*   .puntos_*
       y comprueba que ese nombre exista en alguna tabla o vista.

   3 · Si aparece uno inventado, la prueba FALLA y dice cuál y en qué
       archivo y línea.
```

## Cómo se valida que el guardián sirve

```
   Se corre contra el commit ANTERIOR a esta tarea y debe encontrar
   los cinco: precio_unit_cent, subtotal_cent, saldo_posterior_cent,
   cci, numero_cuenta.

   Si no los encuentra, el guardián no sirve y hay que ajustarlo.
```

**Esa es la prueba del guardián: que detecte los errores que ya conocemos.**

Habrá falsos positivos (variables locales que casualmente terminen en `_cent`).
Se resuelven con una lista de excepciones **corta y comentada**, no ampliando el
patrón hasta que no detecte nada.

**Commit.**

---

# BLOQUE 7 · VERIFICACIÓN

Correr y **pegar la salida literal de las cuatro**:

```bash
# 1 · ya no quedan los campos inventados
grep -rn "precio_unit_cent\|subtotal_cent\|saldo_posterior_cent" src/
#    debe devolver VACÍO

# 2 · el insert de retiro ya no manda cci ni numero_cuenta
grep -n "cci\|numero_cuenta" src/servicios/socio.js
#    debe devolver VACÍO

# 3 · ArmazonSocio ya no tiene valores escritos a mano
grep -n "'Bronce'\|'Oro'\|'Agosto 2026'" src/armazon/ArmazonSocio.jsx
#    debe devolver VACÍO

# 4 · el guardián corre y pasa
npx vitest run src/test/guardian-campos.test.js
```

## Y las capturas, que son la única prueba real

```
   1 · P-17 · un pedido desplegado mostrando Precio Unit. S/. 75.00
       y Subtotal S/. 300.00  (la orden ORD-2026-001306 de Karla)

   2 · P-19 · el historial mostrando Saldo Posterior S/. 1,890.00

   3 · P-19 · el diálogo de retiro enviándose SIN error

   4 · La barra lateral del socio mostrando el rango real y la
       cabecera con el ciclo real

   5 · P-11 con el ciclo ABIERTO mostrando puntos grupales distintos
       de cero
```

**Imágenes, no descripciones de imágenes.** En las tareas 09, 11 y 12 se
entregaron pies de foto en vez de capturas.

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 4 verificaciones
   2 · Las 5 capturas
   3 · La salida del guardián corriendo contra el commit anterior,
       encontrando los 5 errores conocidos
   4 · git status --short vacío, pegado literal
   5 · npx vitest run en verde
```

---

# LO QUE NO SE TOCA

```
   ❌ src/motor/            todo · patrocinio, residual, rango y persistencia
   ❌ fn_ejecutar_cierre_ciclo y el resto de funciones SQL
   ❌ Las migraciones de Supabase — no se agrega ni una columna
   ❌ src/piezas/Formulario.jsx — 6 pantallas dependen de él
   ❌ El diseño y los estilos
   ❌ La lógica de comisiones · quedó certificada el 4/09 en vivo
```

---

# ESTADO CERTIFICADO QUE NO SE PUEDE ROMPER

Si alguna de estas cifras cambia después de tu tarea, algo se rompió:

```
   socios              505
   órdenes           1,054
   comisiones        2,422   ·   S/. 101,911.02
   de tipo rango        44   ·   S/.   9,650.00
   wallet_movimiento   470
   rango_ciclo       2,008
   ciclos abiertos       1   (ciclo 6, noviembre)

   Karla (MG00012) · saldo S/. 1,890.00 · rango vigente JADE en el ciclo 5
```

**Después de esta tarea sigue A2: la subida de la foto del voucher.**
