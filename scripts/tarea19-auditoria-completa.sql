-- ==============================================================================
-- SISTEMA MAX GLOBAL · TAREA-19: AUDITORÍA COMPLETA DEL SISTEMA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BLOQUE 1: CERRAR EL BORRADO DE LA AUDITORÍA
-- Una bitácora que el admin puede borrar no prueba nada.
-- Solo se permiten operaciones de INSERT y SELECT.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS auditoria_admin_delete ON public.auditoria;

-- Verificación de políticas:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'auditoria';
-- Debe retornar únicamente auditoria_admin_insert y auditoria_admin_select.
