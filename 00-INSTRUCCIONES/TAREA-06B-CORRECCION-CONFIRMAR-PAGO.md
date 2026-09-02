# TAREA-06B · CORRECCIÓN DE `fn_confirmar_orden_pago`

**Para:** Antigravity
**Escrita:** 2 de septiembre de 2026
**Corrige la TAREA-06, que por lo demás quedó bien.**

> **Lo que quedó bien:** la protección contra doble confirmación es correcta y
> está donde tiene que estar. La validación de `fn_is_admin()` al inicio también.
> Las cuatro pantallas están construidas y las seis consultas dan 0 filas.
>
> **Pero la función tiene cuatro errores y solo se salvó porque la única orden
> que probaste fue un Kit Emprendedor con 0 puntos.**

---

## 🔴 REGLA DE REPORTE

```bash
git status --short
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
grep -rlP '\x00' src/ scripts/
npm run build
npx vitest run
```

**Si `git status --short` no está vacío, la tarea NO está terminada.**

> Reportaste "salida vacía" y había **9 archivos cortados a media palabra**:
> `P23BandejaConfirmacion.jsx` con 337 de 651 líneas, `App.jsx` con 281 de 331,
> `persistencia.js` con 202 de 238. Ya están restaurados desde tus commits.
> **Es la sexta vez.**

---

# ERROR 1 🔴 · LA COLUMNA SE LLAMA `origen`, NO `tipo`

## Lo que hace la función

```sql
INSERT INTO public.movimiento_puntos (
  socio_id, orden_id, ciclo_id, tipo, puntos, creado_en
) VALUES (...);
```

## Lo que tiene la tabla

```
   id · socio_id · ciclo_id · orden_id · origen · puntos
   cuenta_activacion · cuenta_residual · cuenta_rango · nota · creado_en
```

**No existe ninguna columna `tipo`.** La función revienta con
`column "tipo" of relation "movimiento_puntos" does not exist`.

## Por qué no lo detectaste

```sql
IF v_orden.puntos_total > 0 THEN   -- ← esta guarda te salvó
```

**La única orden que confirmaste fue la 495: un Kit Emprendedor con
`puntos_total = 0`.** Esa rama nunca se ejecutó.

**En cuanto se confirme un Ejecutivo (70 pts), un Gold (150) o cualquier
recompra, la función falla y la orden no se confirma.**

> Es el mismo error que rompió el `schema.sql` el 28/08: citar una columna sin
> comprobar que exista. **Antes de escribir un INSERT, se consulta
> `information_schema.columns`.**

---

# ERROR 2 🔴 · LAS AFILIACIONES GENERARÍAN RESIDUAL

La función no fija `cuenta_residual`, así que toma el valor por defecto de la
tabla: **`true`**.

## Y eso rompe una regla confirmada por Máximo

> *"Estos puntos es solo para el usuario, mas no comisiona al ascendente."*
> — respuesta 4.1

```
   Los packs de afiliación NO generan bono residual.
   Solo las recompras.
```

**Toda la red simulada respeta esto** — hay 1,042 movimientos de afiliación con
`cuenta_residual = false`. La función nueva los crearía en `true` y el próximo
cierre de ciclo **pagaría residual sobre los packs**.

## Cómo debe quedar

```sql
INSERT INTO public.movimiento_puntos (
  socio_id, ciclo_id, orden_id, origen, puntos,
  cuenta_activacion, cuenta_residual, cuenta_rango, nota, creado_en
) VALUES (
  v_orden.socio_id, v_orden.ciclo_id, v_orden.id,
  CASE WHEN v_orden.tipo = 'afiliacion' THEN 'afiliacion' ELSE 'recompra' END,
  v_orden.puntos_total,
  true,                                              -- cuenta_activacion
  (v_orden.tipo <> 'afiliacion'),                    -- 🔴 cuenta_residual
  true,                                              -- cuenta_rango
  'Confirmado desde P-23',
  now()
);
```

---

# ERROR 3 🔴 · CUALQUIER RECOMPRA ACTIVA AL SOCIO

## Lo que hace

```sql
IF v_orden.tipo = 'afiliacion' OR v_orden.puntos_total > 0 THEN
  INSERT INTO public.activacion (...) VALUES (..., true, ...)
  ON CONFLICT (socio_id, ciclo_id) DO UPDATE
  SET puntos_personales = activacion.puntos_personales + EXCLUDED.puntos_personales,
      activo = true,          -- ← 🔴 SIEMPRE true, sin mirar los puntos
      ...
```

**Un socio que recompra una harina de moringa —6 puntos— queda `activo = true`.**

## La regla real

```
   activo  =  (puntos_personales >= 70)
              OR
              (es su ciclo de afiliación Y la orden está confirmada
               Y el pack tiene cubre_activacion = true)
```

**Confirmado por Máximo, 25/08 4:25 pm:**
> *"Si un socio no llega a los 70 puntos pierde todos los beneficios."*

## Cómo debe quedar

```sql
ON CONFLICT (socio_id, ciclo_id) DO UPDATE
SET puntos_personales = activacion.puntos_personales + EXCLUDED.puntos_personales,
    activo = (
      activacion.puntos_personales + EXCLUDED.puntos_personales >= 70
      OR v_orden.tipo = 'afiliacion'      -- el pack cubre su mes de ingreso
    ),
    calculado_en = now();
```

**El 70 se lee de `config.activacion_puntos_mes`, no se escribe a mano.**

> Si esto no se arregla, el bono de rango y el residual se pagan a socios que
> no se activaron. **Es dinero saliendo mal.**

---

# ERROR 4 🟡 · DOS ESTADOS PARA LO MISMO

```
   La función pone la orden en          'pagada'
   Las 1,042 órdenes de la red están en 'confirmada'
   Y el motor filtra por:

      o.estado === 'confirmada'     ← persistencia.js, línea 143
```

**Una orden confirmada desde la P-23 queda en `pagada` y el cierre de ciclo no
la va a ver.** No entra en el cálculo del bono de rango ni del global.

## Hay que elegir uno

La especificación RF-348 dice "pasar a PAGADA", pero **toda la base y el motor
usan `confirmada`**. Lo barato y seguro es alinearse con lo que ya existe:

```
   ✅  la función pone 'confirmada'
   ✅  el UPDATE condicional sigue igual:  AND estado = 'por_confirmar'
```

**Si prefieres 'pagada', hay que cambiar también el motor y migrar las 1,042
órdenes.** No lo hagas sin avisar.

---

# ERROR 5 🟡 · LAS 4 FUNCIONES NUEVAS SON EJECUTABLES POR `anon`

```
   fn_confirmar_orden_pago         anon=X
   fn_rechazar_orden_pago          anon=X
   fn_registrar_afiliacion_socio   anon=X
   fn_registrar_pedido_recompra    anon=X
```

**El riesgo real es bajo** porque las cuatro validan `fn_is_admin()` en su
primera línea y un anónimo recibe la excepción. **Pero no hay ninguna razón para
que un usuario sin sesión pueda siquiera invocarlas.**

```sql
REVOKE EXECUTE ON FUNCTION public.fn_confirmar_orden_pago(bigint, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_rechazar_orden_pago(bigint, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_registrar_afiliacion_socio(bigint, bigint, text, text, text, text, text, text, date, text, text, text, text, jsonb, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_registrar_pedido_recompra(bigint, jsonb, jsonb, jsonb, text) FROM anon, public;
```

**Deja `authenticated`**, que es quien las necesita.

---

# 🔴 Y UNA OBSERVACIÓN DE DISEÑO — no la cambies ahora, pero anótala

`fn_confirmar_orden_pago` recibe **las comisiones ya calculadas** en un `jsonb`
que viene del navegador.

```
   La función confía en lo que le pasan e inserta tal cual.
```

Hoy el riesgo es bajo: solo un admin autenticado puede llamarla. Pero significa
que **quien controle la pantalla del admin puede insertar las comisiones que
quiera.**

La alternativa —calcular en el servidor— obligaría a reescribir el motor en SQL
y duplicar la lógica, que es peor. **Se queda como está, pero queda registrado
en la bitácora como deuda técnica consciente.**

---

# LAS PRUEBAS QUE FALTABAN

**El bug 1 existía porque no había ninguna prueba con puntos.**

```
   ☐  🔴 confirmar una afiliación EJECUTIVO (70 pts)
         → crea el movimiento con origen='afiliacion'
         → cuenta_residual = FALSE
         → el socio queda activo
   ☐  🔴 confirmar una afiliación GOLD (150 pts)  → igual
   ☐  🔴 confirmar una RECOMPRA de 18 puntos
         → cuenta_residual = TRUE
         → el socio NO queda activo (18 < 70)
   ☐  🔴 confirmar una recompra que lleve al socio de 60 a 80 puntos
         → AHORA sí queda activo
   ☐  confirmar un KIT (0 pts) → no crea movimiento, pero el socio
         queda activo igual porque el pack cubre su mes
   ☐  la orden queda en 'confirmada', no en 'pagada'
   ☐  doble confirmación sigue devolviendo YA_CONFIRMADA
```

**Con órdenes reales de cada pack.** El Kit no vale como único caso: es
precisamente el que esquiva la rama rota.

---

# VERIFICACIÓN

```sql
-- 🔴 0 filas: ninguna afiliación con cuenta_residual = true
SELECT id FROM movimiento_puntos WHERE origen='afiliacion' AND cuenta_residual;

-- 🔴 0 filas: nadie activo sin los 70 puntos y sin afiliación confirmada
SELECT a.socio_id, a.ciclo_id, a.puntos_personales FROM activacion a
WHERE a.activo AND a.puntos_personales < 70
AND NOT EXISTS (SELECT 1 FROM orden o WHERE o.socio_id=a.socio_id
    AND o.ciclo_id=a.ciclo_id AND o.tipo='afiliacion'
    AND o.estado IN ('confirmada','pagada'));

-- 🔴 0 filas: ninguna orden en un estado que el motor no reconoce
SELECT id, estado FROM orden WHERE estado NOT IN ('por_confirmar','confirmada','rechazada','anulada');

-- 🔴 0 filas: movimiento sin su orden o con puntos que no cuadran
SELECT m.id FROM movimiento_puntos m JOIN orden o ON o.id=m.orden_id
WHERE m.puntos <> o.puntos_total OR m.socio_id <> o.socio_id OR m.ciclo_id <> o.ciclo_id;

-- las 4 funciones ya no las ejecuta anon
SELECT proname, array_to_string(proacl,' | ') FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN
 ('fn_confirmar_orden_pago','fn_rechazar_orden_pago',
  'fn_registrar_afiliacion_socio','fn_registrar_pedido_recompra');
```

**Y arregla la orden 495**, que quedó en `pagada` con la función vieja: pásala a
`confirmada` para que el motor la vea.

---

# LO QUE ENTREGAS

```
   1 · La definición completa de la función corregida
   2 · La salida literal de las 5 consultas
   3 · La salida de vitest, con las pruebas nuevas por pack
   4 · git status --short vacío, pegado literal
```
