-- =====================================================================
-- TAREA-64 · BLOQUE 1: ALINEACIÓN RLS ACTIVACIÓN (RF-221)
-- Permite que los socios consulten el estado de activación y puntos
-- de su red descendiente (red_ancestro) garantizando privacidad (Ley 29733).
-- =====================================================================

DROP POLICY IF EXISTS "activacion_select" ON public.activacion;

CREATE POLICY "activacion_select" ON public.activacion FOR SELECT USING (
    fn_is_admin() 
    OR socio_id = fn_current_socio_id() 
    OR EXISTS (
        SELECT 1 FROM public.red_ancestro ra 
        WHERE ra.ancestro_id = fn_current_socio_id() 
          AND ra.descendiente_id = activacion.socio_id
    )
);
