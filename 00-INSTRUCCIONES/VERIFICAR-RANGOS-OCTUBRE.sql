-- =====================================================================
-- VERIFICACIÓN DE RANGOS · OCTUBRE 2026 · Max Global (PRODUCCIÓN)
-- Pegar en Supabase → proyecto xkiwnxoferdfapezcwoq → SQL Editor
-- SOLO LECTURA: son SELECT, no cambian nada.
-- Correr cada consulta por separado y copiar el resultado (botón "Copy" o CSV).
-- =====================================================================


-- ---------------------------------------------------------------------
-- CONSULTA 0 · ¿Cuál es el id de octubre?
-- (Si octubre NO es el 2, cambia el 2 por el id correcto en las consultas 1 y 2)
-- ---------------------------------------------------------------------
SELECT id, anio, mes, estado FROM ciclo ORDER BY id;


-- ---------------------------------------------------------------------
-- CONSULTA 1 · Recálculo independiente vs lo guardado (todos los socios)
-- ---------------------------------------------------------------------
WITH c AS (SELECT 2::bigint AS id),
pts AS (
  SELECT socio_id, SUM(puntos) AS p
  FROM movimiento_puntos, c
  WHERE ciclo_id = c.id AND cuenta_rango
  GROUP BY socio_id
),
frontal AS (
  SELECT ancestro_id AS socio_id, descendiente_id AS frontal_id
  FROM red_ancestro WHERE nivel = 1
),
linea AS (
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
  SELECT r.socio_id, rg.orden, rg.nombre,
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
SELECT s.codigo,
       k.nombre  AS rango_recalculado, k.computables AS comp_recalc, k.frontales_activos AS front_recalc,
       r2.nombre AS rango_guardado,    rc.puntos_computables AS comp_guardado, rc.frontales_activos AS front_guardado,
       rc.bono_cent
FROM califica k
FULL JOIN (SELECT * FROM rango_ciclo WHERE ciclo_id = (SELECT id FROM c) AND califica) rc
       ON rc.socio_id = k.socio_id
LEFT JOIN rango r2 ON r2.id = rc.rango_id
JOIN socio s ON s.id = COALESCE(k.socio_id, rc.socio_id)
ORDER BY s.codigo;


-- ---------------------------------------------------------------------
-- CONSULTA 2 · Detalle por línea de 3 socios (MG00020, MG00021, MG00029)
-- ---------------------------------------------------------------------
WITH c AS (SELECT 2::bigint AS id),
pts AS (
  SELECT socio_id,
         SUM(puntos) FILTER (WHERE cuenta_rango)      AS p_rango,
         SUM(puntos) FILTER (WHERE cuenta_activacion) AS p_activacion
  FROM movimiento_puntos, c
  WHERE ciclo_id = c.id
  GROUP BY socio_id
)
SELECT s.codigo AS socio, fr.codigo AS frontal,
       a.activo AS frontal_activo,
       COALESCE(pf.p_activacion,0) AS pts_personales_frontal_activacion,
       COALESCE(pf.p_rango,0)      AS pts_personales_frontal_rango,
       COALESCE(pf.p_rango,0)
     + COALESCE((SELECT SUM(p2.p_rango) FROM red_ancestro ra JOIN pts p2 ON p2.socio_id = ra.descendiente_id
                 WHERE ra.ancestro_id = fr.id),0) AS pts_linea
FROM socio s
JOIN red_ancestro r1 ON r1.ancestro_id = s.id AND r1.nivel = 1
JOIN socio fr ON fr.id = r1.descendiente_id
LEFT JOIN activacion a ON a.socio_id = fr.id AND a.ciclo_id = (SELECT id FROM c)
LEFT JOIN pts pf ON pf.socio_id = fr.id
WHERE s.codigo IN ('MG00020','MG00021','MG00029')
ORDER BY s.codigo, pts_linea DESC;
