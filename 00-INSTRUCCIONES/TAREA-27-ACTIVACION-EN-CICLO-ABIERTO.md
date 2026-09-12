# TAREA-27 · EL FILTRO DE ACTIVOS Y EL CICLO ESCRITO A MANO

**Para:** Antigravity
**Escrita:** 7 de septiembre de 2026 · **reescrita** el mismo día
**Fase:** corrección de bugs

> ## 🔴 LEE PRIMERO `05-CONTROL/ESPECIFICACION-ACTIVACION.md`
>
> Ese documento investiga seis sospechas y concluye que **dos eran
> comportamiento correcto**. Esta tarea solo ataca las que sí son fallas.
>
> **Si algo de acá te lleva a escribir en `activacion` o a tocar el cierre,
> está mal enfocado. Para y pregunta.**

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

# LO QUE NO ES UN BUG — no lo toques

Verificado contra Postgres el 7/09:

```
   ciclo 1  jun  cerrado   501 filas · 277 activos   ← SEMBRADO
   ciclo 2  jul  cerrado   501 filas · 252 activos   ← SEMBRADO
   ciclo 3  ago  cerrado   501 filas · 265 activos   ← SEMBRADO
   ciclo 4  sep  cerrado     3 filas ·   3 activos   ← real
   ciclo 5  oct  cerrado     3 filas ·   3 activos   ← real
   ciclo 6  nov  ABIERTO     2 filas ·   2 activos   ← real
```

```
   ✅ Que los ciclos 4-6 tengan 2 o 3 filas es CORRECTO.
      La activación se acumula al confirmar cada orden.
      Sin fila = no compró = no está activo = no cobra.

   ✅ Que 506 socios salgan "Inactivo (0 pts)" en noviembre
      es CORRECTO. Nadie compró salvo dos.
```

```
   🔴 NO se rellena `activacion` con filas en cero.
   🔴 NO se toca fn_ejecutar_cierre_ciclo.
   🔴 NO se cambia el texto "Inactivo (0 pts)". Es un hecho.
```

---

# BLOQUE 1 · 🔴 EL FILTRO "ACTIVOS EN CICLO 6" DEVUELVE VACÍO

**Este es el bug que reportó Jack.** Reproducido el 7/09.

```
   Filtro "Activos en Ciclo 6", buscador vacío

   La pantalla     "No se encontraron socios"
                   "Mostrando página 1 de 21 (508 socios en total)"

   La base         2 activos: MG00012 y MG00014
                   los dos están dentro de los primeros 25 socios
                   ordenados por id
                   → la página 1 debería mostrarlos
```

## 🔴 DIAGNOSTICAR ANTES DE TOCAR

```
   Reprodúcelo con la pestaña Network abierta y responde:

   1 · ¿Con qué ciclo_id se pidió la consulta a `activacion`?
   2 · ¿Qué código de estado devolvió?
   3 · ¿Cuántas filas trajo?
   4 · ¿Con qué lista de socio_id se pidió?
```

**Di cuál era la causa antes de arreglar nada.** Hay al menos dos sospechosos y
no sabemos cuál es:

```js
   a · P27GestionSocios.jsx:60
       const [cicloId, setCicloId] = useState(4);
       → un 4 escrito a mano como valor inicial.
         Si la consulta sale con 4 en vez de 6, el resultado
         es otro.

   b · operacionAdmin.js:1074-1079
       el filtro activo/inactivo se aplica DESPUÉS de paginar
```

## El defecto de diseño, que se arregla igual

Aunque no sea la causa de este síntoma, filtrar después de paginar está mal:

```
   Con 508 socios y los activos en la página 7,
   las páginas 1 a 6 saldrían vacías
   y el contador seguiría diciendo "508 socios en total".

   Máximo concluiría que no hay nadie activo.
```

```
   1 · El filtro activo/inactivo se resuelve ANTES de paginar
   2 · El contador y el número de páginas reflejan el filtro,
       no el total sin filtrar
```

**Commit.**

---

# BLOQUE 2 · EL CICLO ESCRITO A MANO

```js
   P27GestionSocios.jsx:527
   <strong>Ciclo Actual ({cicloId} · Septiembre 2026):</strong>
```

**El ciclo abierto es noviembre 2026.** Ese texto está escrito a mano y va a
estar mal siempre.

```
   Es el MISMO error que costó la TAREA-11:
   ArmazonSocio.jsx pintaba {socio.ciclo} y ese valor venía
   de un literal 'Agosto 2026' diez líneas más arriba.
```

```
   1 · El nombre del ciclo se arma desde ciclo.anio y ciclo.mes

       🔴 La tabla `ciclo` NO tiene columna `nombre`.
          Tiene: id · anio · mes · fecha_inicio · fecha_fin ·
                 estado · cerrado_en · cerrado_por

   2 · P27GestionSocios.jsx:60 · useState(4)
       ese 4 no se queda escrito a mano

   3 · Barrer TODO src/ buscando meses escritos a mano
```

**Commit.**

---

# BLOQUE 3 · LOS ERRORES QUE SE TRAGAN EN SILENCIO

```js
   operacionAdmin.js:1050
   const { data: activaciones } = await sbClient.from('activacion')...
```

**No recoge `error`. No lo comprueba.**

```
   Si esa consulta falla, `data` viene nulo, el mapa queda
   vacío, y TODOS los socios se pintan "Inactivo (0 pts)".
   Un fallo se ve idéntico al comportamiento correcto.
```

> **Ninguna de estas está fallando hoy.** Los permisos están bien y RLS también.
> Esto no es una vulnerabilidad: es que un fallo futuro sería invisible. Fue lo
> que nos impidió distinguir un bug de un comportamiento correcto durante dos
> horas.

## Alcance medido el 7/09

```
   src/servicios   17
   src/motor        1
   src/armazon      1
   src/paginas      0
   ──────────────────
                   19 en código de producción
```

```
   Se recoge `error` y se lanza, como YA lo hace
   operacionAdmin.js:133 con `error: errAct`.
   Es inconsistencia, no criterio.
```

```
   🔴 OJO: con .maybeSingle(), una fila que no existe devuelve
      data en null SIN error. Eso es CORRECTO y se sigue
      manejando con `act?.puntos || 0`.
      Lo que se agrega es comprobar el error, no dejar de
      aceptar el null.
```

**Commit.**

---

# BLOQUE 4 · LAS PRUEBAS

```
   1 · El filtro "activos" en el ciclo 6 devuelve los 2 activos
       ← número a mano: MG00012 y MG00014
       ← ésta es la que prueba que el bug de Jack se arregló

   2 · El filtro se aplica antes de paginar: el contador de
       resultados coincide con las filas mostradas

   3 · Un socio SIN fila de activación sale "Inactivo (0 pts)"
       ← sigue siendo el comportamiento correcto, no cambia

   4 · El nombre del ciclo se calcula: ciclo 6 → "Noviembre 2026"
       ← nunca "Septiembre 2026"

   5 · Si la consulta a `activacion` falla, la función LANZA
       en vez de devolver a todos en cero

   6 · Una fila inexistente sigue devolviendo null sin lanzar
       ← que el bloque 3 no rompa el caso correcto
```

**La 1 es la que cierra el reporte de Jack. La 6 es la que protege lo que ya
estaba bien.**

**Commit.**

---

# BLOQUE 5 · VERIFICACIÓN

```bash
# 1 · ninguna consulta se traga el error
grep -rn "const { data: [a-zA-Z_]* } = await" src/servicios/ src/motor/ src/armazon/
#    debe quedar VACÍO

# 2 · ningún mes escrito a mano
grep -rnE "Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre" src/
#    solo puede aparecer en un formateador de fechas
```

```sql
-- 3 · el estado real, para contrastar con la pantalla
SELECT c.id, c.anio, c.mes, c.estado,
       COUNT(a.socio_id) filas,
       COUNT(a.socio_id) FILTER (WHERE a.activo) activos
FROM ciclo c LEFT JOIN activacion a ON a.ciclo_id=c.id
GROUP BY c.id, c.anio, c.mes, c.estado ORDER BY c.id;
-- ciclo 6 · 2026 · 11 · abierto · 2 filas · 2 activos
-- 🔴 estos números NO deben cambiar con esta tarea
```

## Capturas

```
   1 · El filtro "Activos en Ciclo 6" mostrando los 2 socios
   2 · La ficha de un socio con el nombre del ciclo correcto
```

**Imágenes, no descripciones.**

---

# LO QUE NO SE TOCA

```
   ❌ fn_ejecutar_cierre_ciclo — su orden está certificado
   ❌ La tabla `activacion` — no se rellena ni se corrige
   ❌ Las 2 filas del ciclo 6 — son correctas
   ❌ El texto "Inactivo (0 pts)" — es un hecho, no un error
   ❌ fn_confirmar_orden_pago — recién tocada en TAREA-26
   ❌ src/motor/ — todo
```

---

# ESTADO CERTIFICADO QUE NO PUEDE CAMBIAR

```
   socios              508
   órdenes           1,059
   comisiones        2,423   ·   S/. 101,939.82
   rango_ciclo       2,008
   red_ancestro      3,960 filas · 0 incoherencias
   ciclos abiertos       1   (ciclo 6 · noviembre 2026)
   wallet              471   · saldo de Karla S/. 1,790.00
   productos             8
   activacion ciclo 6    2 filas · 2 activos
```
