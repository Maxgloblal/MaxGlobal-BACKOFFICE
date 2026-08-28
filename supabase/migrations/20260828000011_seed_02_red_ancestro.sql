TRUNCATE red_ancestro;
WITH RECURSIVE cadena AS (
  SELECT id AS descendiente_id, patrocinador_id AS ancestro_id, 1::smallint AS nivel
  FROM socio WHERE patrocinador_id IS NOT NULL
  UNION ALL
  SELECT c.descendiente_id, s.patrocinador_id, (c.nivel + 1)::smallint
  FROM cadena c JOIN socio s ON s.id = c.ancestro_id
  WHERE s.patrocinador_id IS NOT NULL AND c.nivel < 50
)
INSERT INTO red_ancestro (descendiente_id, ancestro_id, nivel)
SELECT descendiente_id, ancestro_id, nivel FROM cadena;