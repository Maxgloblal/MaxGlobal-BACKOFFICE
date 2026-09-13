-- =====================================================================
-- MAX GLOBAL CORPORATION · TAREA-19: CONSULTA DE AUDITORÍA ADMIN
-- Fecha original: 2026-09-06
-- Rescatado para TAREA-35 (Hallazgo 1)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_obtener_auditoria_admin(
    p_pagina INT DEFAULT 1,
    p_limite INT DEFAULT 25,
    p_accion TEXT DEFAULT NULL,
    p_tabla TEXT DEFAULT NULL,
    p_fecha_desde TIMESTAMPTZ DEFAULT NULL,
    p_fecha_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_offset INT;
    v_total BIGINT;
    v_eventos JSONB;
BEGIN
    IF NOT fn_is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo administradores pueden ver la auditoría.';
    END IF;

    v_offset := (p_pagina - 1) * p_limite;

    SELECT count(*)
      INTO v_total
      FROM auditoria a
     WHERE (p_accion IS NULL OR a.accion = p_accion)
       AND (p_tabla IS NULL OR a.tabla = p_tabla)
       AND (p_fecha_desde IS NULL OR a.creado_en >= p_fecha_desde)
       AND (p_fecha_hasta IS NULL OR a.creado_en <= p_fecha_hasta);

    SELECT jsonb_agg(row_to_json(sub))
      INTO v_eventos
      FROM (
        SELECT a.id, a.usuario_id, a.accion, a.tabla, a.registro_id,
               a.datos_antes, a.datos_despues, a.ip, a.creado_en,
               s.codigo AS socio_codigo,
               s.nombres AS socio_nombres,
               s.apellidos AS socio_apellidos
          FROM auditoria a
          LEFT JOIN socio s ON s.id = a.usuario_id
         WHERE (p_accion IS NULL OR a.accion = p_accion)
           AND (p_tabla IS NULL OR a.tabla = p_tabla)
           AND (p_fecha_desde IS NULL OR a.creado_en >= p_fecha_desde)
           AND (p_fecha_hasta IS NULL OR a.creado_en <= p_fecha_hasta)
         ORDER BY a.creado_en DESC, a.id DESC
         LIMIT p_limite
        OFFSET v_offset
      ) sub;

    RETURN jsonb_build_object(
        'total', v_total,
        'pagina', p_pagina,
        'total_paginas', CEIL(v_total::numeric / p_limite),
        'eventos', COALESCE(v_eventos, '[]'::jsonb)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_obtener_auditoria_admin(INT, INT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fn_obtener_auditoria_admin(INT, INT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
