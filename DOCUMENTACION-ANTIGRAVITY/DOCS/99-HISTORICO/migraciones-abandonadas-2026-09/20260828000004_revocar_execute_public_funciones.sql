-- =====================================================================
-- MAX GLOBAL CORPORATION — REVOCACIÓN DE EXECUTE EN FUNCIONES DE PUBLIC
-- Cierre estricto de la superficie expuesta a la API REST (RPC)
-- =====================================================================

-- 1. REVOCAR PRIVILEGIOS DE EJECUCIÓN A 'PUBLIC'
REVOKE EXECUTE ON FUNCTION public.fn_current_socio_id()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_is_admin()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_construir_red_ancestro() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_bloquear_ciclo_cerrado() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
  END IF;
END $$;


-- 2. REVOCAR PRIVILEGIOS EXPLÍCITOS A 'anon' Y 'authenticated'
REVOKE EXECUTE ON FUNCTION public.fn_current_socio_id()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_is_admin()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_construir_red_ancestro() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_bloquear_ciclo_cerrado() FROM anon, authenticated;
