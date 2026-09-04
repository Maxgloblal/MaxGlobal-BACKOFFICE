# TAREA-12 · CONECTAR EL BONO DE RANGO AL CIERRE DE CICLO

**Para:** Antigravity
**Escrita:** 4 de septiembre de 2026
**Prioridad: BLOQUEANTE.** Es uno de los 4 bonos del plan de compensación y hoy
no se paga nunca.

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

# EL PROBLEMA, EN UNA FRASE

`src/motor/rango.ts` existe, está bien escrito y tiene **17 pruebas en verde** —
pero **ningún código de producción lo llama nunca**.

```
   src/motor/persistencia.js  ← la única puerta al motor en producción
     import { calcularPatrocinio } from './patrocinio';   ✅
     import { calcularResidual }   from './residual';     ✅
     ... y nada más
```

Y el preview de P-25 **no calcula** el bono de rango: filtra
`comision.tipo === 'rango'`. Si nadie las crea, muestra S/. 0.00.

**Prueba de que nunca se ejecutó en un cierre real:**

```
   ciclo 1  501 filas en rango_ciclo   ← las metió el sembrado
   ciclo 2  501 filas                  ← sembrado
   ciclo 3  501 filas                  ← sembrado
   ciclo 4    0 filas                  ← cierre REAL del 4/09/2026
```

---

# 🔴🔴 LO QUE MÁS IMPORTA DE ESTA TAREA · EL ORDEN

`fn_ejecutar_cierre_ciclo` hace esto, y no se va a modificar:

```
   1 · valida que sea admin
   2 · bloquea el ciclo con FOR UPDATE
   3 · UPDATE ciclo → estado = 'cerrado'
   4 · recorre las comisiones DEL CICLO → inserta en wallet_movimiento
   5 · abre el ciclo siguiente
```

**El paso 4 abona lo que exista en `comision` en ese instante.**

```
   ❌ Si las comisiones de rango se crean DESPUÉS de llamar a la función,
      no se abonan NUNCA. El paso 4 ya pasó.

   ✅ El cálculo del rango va ANTES de llamar a fn_ejecutar_cierre_ciclo.
```

## Y por qué el error sería silencioso

El trigger `fn_bloquear_ciclo_cerrado` solo protege `orden` y
`movimiento_puntos`. **NO protege `comision`.**

Es decir: si se insertan comisiones de rango después del cierre, **Postgres no
da ningún error**. Las filas quedan ahí, el total del reporte cuadra, y nadie
cobra. El fallo aparece tres meses después, cuando un líder reclama un bono que
nunca le llegó.

> **Esta es la razón de ser de la TAREA-12. Si sales de acá con el orden
> invertido, la tarea empeoró el sistema en vez de arreglarlo.**

---

# LO QUE YA EXISTE — NO SE RECONSTRUYE

Verificado contra Postgres el 4/09. **Usar esto, no escribir consultas nuevas.**

## `fn_rango_lineas_socio(p_socio_id, p_ciclo_id) → jsonb`

Devuelve todo lo que el motor necesita, y **funciona aunque el socio todavía no
tenga fila en `rango_ciclo`** (probado con el ciclo 4: devolvió las 7 líneas).

```jsonc
{
  "exito": true,
  "lineas": [
    { "frontal_id": 55, "activo": true, "puntos_totales_rama": 400,
      "puntos_computados": 400, "tope_maximo_linea": 500 }
  ],
  "rango_ciclo": { ... },            // la fila guardada, si existe
  "rango_ciclo_anterior": { ... },   // ← esto es el rangoAnterior del motor
  "rangos_escala": [ ... ],          // los 16 rangos con su flag definido
  "rango_honorifico": { ... }        // calculado del historial
}
```

## Las vistas

```
   v_puntos_ciclo        socio_id, ciclo_id, puntos_activacion,
                         puntos_residual, puntos_rango
   v_frontales_activos   socio_id, ciclo_id, frontales_activos
```

## El motor

```ts
// src/motor/rango.ts — NO SE TOCA
calificarRangoSocio(
  puntosSocio: PuntosSocioCiclo,
  rangosDisponibles: RangoDefinicion[],
  rangoAnterior: { orden: number; codigo?: string } | null,
  lineaEstiradaPct: number = 50
): ResultadoCalificacionRango
```

Ya implementa las cuatro reglas del plan y están probadas:

```
   inactivo        → bono 0 · motivo 'inactivo'
   no califica     → bono 0 · motivo 'no_califica'
   primer ciclo    → bono completo
   mantiene rango  → bono completo
   asciende        → bono del rango nuevo
   BAJA de rango   → bono 0 · motivo 'baja'   ← regla crítica del plan
```

---

# BLOQUE 1 · LA FUNCIÓN DE PERSISTENCIA DEL RANGO

Crear `src/motor/persistenciaRango.js`, al lado de `persistencia.js` y con el
mismo estilo.

```
   export async function calcularYPersistirRangosDelCiclo(cicloId, sbClient)
```

## Qué hace, en orden

```
   1 · Trae los socios a evaluar del ciclo
   2 · Para cada socio: llama fn_rango_lineas_socio(socio, ciclo)
   3 · Arma el objeto PuntosSocioCiclo con lo que devolvió
   4 · Llama calificarRangoSocio(puntos, escala, rangoAnterior, 50)
   5 · Inserta la fila en rango_ciclo — para TODOS, califiquen o no
   6 · Inserta en comision SOLO los que tengan bono_cent > 0
   7 · Devuelve un resumen: evaluados, califican, total_bono_cent
```

## Reglas de este bloque

```
   1 · Se inserta rango_ciclo para TODOS los socios evaluados,
       incluidos los que no califican (rango_id = null, califica = false).
       Así lo hizo el sembrado: 501 filas por ciclo, no solo las que cobran.
       P-15 "Mi Rango" necesita esa fila para mostrarle al socio por qué
       no calificó.

   2 · Las comisiones de rango llevan:
          tipo           = 'rango'
          nivel          = null          (el rango no tiene nivel)
          base_cent      = null
          base_puntos    = puntos_computables
          porcentaje     = null
          monto_cent     = bono_cent
          estado         = 'confirmada'
          generador_id   = null          (no lo genera una orden)
          orden_id       = null
          detalle        = el objeto detalle que devuelve el motor

   3 · IDEMPOTENCIA. Si ya existen filas de rango_ciclo o comisiones de
       tipo 'rango' para ese ciclo, NO se duplican. Se corta y se avisa.
       persistencia.js ya resuelve esto para patrocinio y residual —
       seguir ese mismo patrón, no inventar otro.

   4 · lineaEstiradaPct sale de config, NO se escribe 50 en el código.
       Si la clave no existe, se usa 50 y se deja constancia.
```

## 🔴 Lo que NO se toca en este bloque

```
   ❌ src/motor/rango.ts          está probado, no se modifica
   ❌ src/motor/persistencia.js   patrocinio y residual funcionan
   ❌ fn_ejecutar_cierre_ciclo    no se modifica la función SQL
   ❌ fn_rango_lineas_socio       se usa tal cual
```

**Commit.**

---

# BLOQUE 2 · ENGANCHARLO AL CIERRE, EN EL ORDEN CORRECTO

En `src/servicios/operacionAdmin.js`, en la función que ejecuta el cierre:

```js
// ANTES de llamar al RPC del cierre:
const resumenRango = await calcularYPersistirRangosDelCiclo(cicloId, supabase);

// y RECIÉN DESPUÉS:
const { data } = await supabase.rpc('fn_ejecutar_cierre_ciclo', { ... });
```

## Reglas de este bloque

```
   1 · Si el cálculo del rango falla, el cierre NO se ejecuta.
       Nada de "sigo igual y lo arreglo después": el ciclo quedaría
       cerrado sin los bonos de rango, y no se puede reabrir.

   2 · El resumen del rango se devuelve junto al resultado del cierre,
       para que P-25 pueda mostrarlo.

   3 · La vista previa de P-25 (la que corre en seco) también debe
       calcular el rango — SIN escribir nada. Hoy solo lee comisiones
       que no existen y por eso siempre muestra S/. 0.00.
```

**Commit.**

---

# BLOQUE 3 · LAS PRUEBAS

## 3.1 · Pruebas de la persistencia — con números calculados A MANO

```
   1 · Un socio con 958 puntos grupales, 790 computables y 4 frontales
       activos califica a JADE y su bono es 5000 céntimos (S/. 50.00)
       ← son los datos reales de KARLA (MG00012) en el ciclo 1

   2 · Un socio inactivo NO genera comisión, pero SÍ genera su fila de
       rango_ciclo con califica = false

   3 · Un socio que baja de rango genera fila con califica = false
       y bono_cent = 0

   4 · Al correr dos veces sobre el mismo ciclo, no se duplica ninguna
       fila ni ninguna comisión (idempotencia)

   5 · Los rangos con definido = false (los 8 altos) NUNCA se asignan
```

**Números a mano, no llamando a la propia función:**

```js
// ❌ MAL
expect(res.bono_cent).toBe(calcularBono(socio));

// ✅ BIEN
expect(res.bono_cent).toBe(5000);   // S/. 50.00, bono de Jade
```

## 3.2 · La prueba del ORDEN — la más importante de todas

```
   Cerrar un ciclo de prueba donde un socio califica a un rango, y
   comprobar que en wallet_movimiento aparece SU ABONO DE RANGO.

   Si la comisión de rango existe pero no hay abono en la billetera,
   el orden está invertido y la prueba DEBE fallar.
```

Esta prueba es la que protege contra el fallo silencioso. Sin ella, el bloque 2
no está terminado.

## 3.3 · Prueba de no regresión

```
   Un cierre con comisiones de patrocinio y residual sigue abonando
   exactamente lo mismo que antes de esta tarea.
```

**Commit.**

---

# BLOQUE 4 · VERIFICACIÓN CONTRA POSTGRES

Correr y **pegar la salida literal de las cinco**:

```sql
-- 1 · ¿se escribieron las filas de rango del ciclo cerrado?
SELECT ciclo_id, COUNT(*) filas, COUNT(rango_id) califican
FROM rango_ciclo GROUP BY ciclo_id ORDER BY ciclo_id;

-- 2 · ¿se crearon las comisiones de rango?
SELECT ciclo_id, COUNT(*) n, SUM(monto_cent) total_cent
FROM comision WHERE tipo='rango' GROUP BY ciclo_id ORDER BY ciclo_id;

-- 3 · 🔴 LA QUE IMPORTA: ¿cada comisión de rango tiene su abono?
SELECT c.id comision, c.monto_cent, w.id abono
FROM comision c
LEFT JOIN wallet_movimiento w ON w.comision_id = c.id
WHERE c.tipo='rango' AND c.ciclo_id = <el ciclo cerrado>;
-- NINGUNA fila puede tener abono = NULL

-- 4 · ningún rango no definido fue asignado
SELECT COUNT(*) FROM rango_ciclo rc
JOIN rango r ON r.id=rc.rango_id WHERE r.definido = false;
-- debe devolver 0

-- 5 · sigue habiendo un solo ciclo abierto
SELECT COUNT(*) FROM ciclo WHERE estado='abierto';
-- debe devolver 1
```

**La consulta 3 es la razón de ser de esta tarea.** Si alguna comisión de rango
sale con `abono = NULL`, el orden está invertido y hay que corregirlo antes de
declarar nada.

---

# LO QUE ENTREGAS

```
   1 · La salida literal de las 5 consultas del bloque 4
   2 · La salida literal de npx vitest run
   3 · Una CAPTURA de P-25 mostrando el Bono de Rango con un monto real
       (no una descripción de la captura: la imagen)
   4 · git status --short vacío, pegado literal
```

---

# LO QUE NO SE TOCA

```
   ❌ src/motor/rango.ts                  probado, 17 pruebas
   ❌ src/motor/patrocinio.ts · residual.ts
   ❌ src/motor/persistencia.js           patrocinio y residual funcionan
   ❌ fn_ejecutar_cierre_ciclo            no se modifica la función SQL
   ❌ fn_rango_lineas_socio               se usa tal cual
   ❌ Las migraciones de Supabase
   ❌ El diseño y los estilos
   ❌ Las 20 pantallas, salvo el resumen de rango en P-25
```

---

# CONTEXTO QUE CONVIENE QUE SEPAS

```
   Los rangos 9 al 16 existen con definido = false. NO se tocan y NO
   bloquean: el motor ya los filtra. Se cargarán desde P-26 cuando
   Máximo entregue los números.

   rango_honorifico_id está en NULL para los 503 socios y ESO ESTÁ BIEN.
   El honorífico se calcula del historial en fn_rango_lineas_socio.
   Es una columna muerta. NO la llenes.
```

**Después de esta tarea sigue la TAREA-13 con los errores del bloque B del
`PLAN-DE-CIERRE-V1`.**
