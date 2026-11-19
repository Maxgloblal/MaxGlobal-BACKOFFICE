# TAREA-73 · Verificación independiente de los rangos de octubre (PRODUCCIÓN)

**SOLO LECTURA.** Ningún INSERT, UPDATE, DELETE ni RPC que escriba.
No llames a fn_calcular_y_persistir_rangos ni a ninguna función del motor.

Ya sabemos que la pantalla "Socios por rango" muestra lo mismo que `rango_ciclo`
(21 socios Jade en el ciclo 2). Falta saber si **`rango_ciclo` es correcto**.
Para eso hay que recalcular desde los datos crudos, sin usar el motor, y comparar.

- Base: **producción** `xkiwnxoferdfapezcwoq`
- Ciclo: el de **octubre 2026** (confirma su id con
  `SELECT id, anio, mes, estado FROM ciclo ORDER BY id;`; se supone que es el 2)

---

## Reglas vigentes (confírmalas antes de calcular)

```
   ✅ Puntos grupales = puntos de la RED (NO incluyen los personales del socio)
      Fuente: movimiento_puntos con cuenta_rango = true y ciclo = octubre
   ✅ Línea = un frontal (hijo directo: red_ancestro nivel 1) + toda su red
   ✅ Línea estirada: la línea más fuerte cuenta hasta el 50 % de los puntos
      del rango. EXCEPCIÓN Jade: hasta el 100 % (parche TAREA-68)
   ✅ Frontales activos = hijos directos con activacion.activo = true en octubre
   ✅ El socio mismo debe estar activo en octubre (activacion.activo = true)
   ✅ Requisitos por rango: tabla rango (puntos_grupales, frontales_activos)
```

Si en `01-PLAN-DE-COMPENSACION.md`, `04-COMO-QUEDA-EL-PLAN-EN-EL-SISTEMA.md` o el
SQL de `tarea68` alguna regla dice otra cosa, **para y repórtalo** antes de seguir.

## Consulta de recálculo (ajústala solo si un nombre de columna no coincide)

```sql
WITH c AS (SELECT <ID_OCTUBRE>::bigint AS id),
pts AS (            -- puntos de rango de cada socio en octubre
  SELECT socio_id, SUM(puntos) AS p
  FROM movimiento_puntos, c
  WHERE ciclo_id = c.id AND cuenta_rango
  GROUP BY socio_id
),
frontal AS (        -- hijos directos
  SELECT ancestro_id AS socio_id, descendiente_id AS frontal_id
  FROM red_ancestro WHERE nivel = 1
),
linea AS (          -- puntos de cada línea = frontal + su red
  SELECT f.socio_id, f.frontal_id,
         COALESCE((SELECT p FROM pts WHERE pts.socio_id = f.frontal_id),0)
       + COALESCE((SELECT SUM(pts.p) FROM red_ancestro ra JOIN pts ON pts.socio_id = ra.descendiente_id
                   WHERE ra.ancestro_id = f.frontal_id),0) AS pts_linea
  FROM frontal f
),
resumen AS (
  SELECT l.socio_id,
         SUM(l.pts_linea) AS grupales,
         MAX(l.pts_linea) AS linea_mayor,
         COUNT(*) FILTER (WHERE a.activo) AS frontales_activos
  FROM linea l
  LEFT JOIN activacion a ON a.socio_id = l.frontal_id AND a.ciclo_id = (SELECT id FROM c)
  GROUP BY l.socio_id
),
evaluado AS (
  SELECT r.socio_id, rg.orden, rg.nombre, rg.bono_cent,
         r.grupales - r.linea_mayor
           + LEAST(r.linea_mayor,
                   CASE WHEN rg.orden = 1 THEN rg.puntos_grupales
                        ELSE FLOOR(rg.puntos_grupales * 0.5) END) AS computables,
         r.frontales_activos, rg.puntos_grupales AS req_pts, rg.frontales_activos AS req_front
  FROM resumen r CROSS JOIN rango rg
  WHERE rg.definido AND rg.activo
),
califica AS (
  SELECT DISTINCT ON (e.socio_id) e.*
  FROM evaluado e
  JOIN activacion a ON a.socio_id = e.socio_id AND a.ciclo_id = (SELECT id FROM c) AND a.activo
  WHERE e.computables >= e.req_pts AND e.frontales_activos >= e.req_front
  ORDER BY e.socio_id, e.orden DESC
)
SELECT s.codigo, s.nombres || ' ' || s.apellidos AS socio,
       k.nombre AS rango_recalculado, k.computables, k.frontales_activos,
       r2.nombre AS rango_guardado, rc.puntos_computables AS computables_guardados,
       rc.frontales_activos AS frontales_guardados, rc.bono_cent
FROM califica k
FULL JOIN (SELECT * FROM rango_ciclo WHERE ciclo_id = (SELECT id FROM c) AND califica) rc
       ON rc.socio_id = k.socio_id
LEFT JOIN rango r2 ON r2.id = rc.rango_id
JOIN socio s ON s.id = COALESCE(k.socio_id, rc.socio_id)
ORDER BY s.codigo;
```

## Qué comparar y reportar

```
   1 · Tabla completa del resultado
   2 · Diferencias: socios que el recálculo da y rango_ciclo no (o al revés),
       rango distinto, puntos computables o frontales distintos.
       Si hay CERO diferencias, dilo claramente
   3 · Pagos: para cada socio calificado, compara rc.bono_cent con la suma de
       comision tipo 'rango' del ciclo (SELECT beneficiario_id, SUM(monto_cent),
       estado FROM comision WHERE tipo='rango' AND ciclo_id=<id> GROUP BY 1,3).
       Si alguien no tiene bono, explica por qué (ej. regla de "baja de rango")
   4 · Si hay diferencias: NO corrijas nada. Muestra el detalle por línea
       del socio afectado (frontal, pts de su línea, activo sí/no)
```

# NO TOCAR

Nada. Esta tarea no escribe en ninguna base, no cambia código y no hace commit.
