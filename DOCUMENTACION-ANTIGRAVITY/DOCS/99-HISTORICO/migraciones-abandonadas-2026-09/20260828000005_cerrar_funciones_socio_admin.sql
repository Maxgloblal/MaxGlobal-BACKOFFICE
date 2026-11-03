-- =====================================================================
-- MAX GLOBAL CORPORATION — CONTROL DE EXECUTE EN FUNCIONES AUXILIARES
-- 1. fn_construir_red_ancestro, fn_bloquear_ciclo_cerrado, rls_auto_enable
--    REVOCADAS de PUBLIC, anon, authenticated (inaccesibles por API).
-- 2. fn_current_socio_id y fn_is_admin
--    CONCEDIDAS a anon y authenticated porque son indispensables para que
--    el motor de Postgres evalúe las expresiones de políticas RLS en SELECT.
-- =====================================================================

-- 1. REVOCACIÓN TOTAL EN FUNCIONES MUTABLES Y DE DISPARADOR
REVOKE EXECUTE ON FUNCTION public.fn_construir_red_ancestro() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_bloquear_ciclo_cerrado() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 2. PRIVILEGIOS DE EVALUACIÓN PARA POLÍTICAS RLS (Autorreferenciales)
GRANT EXECUTE ON FUNCTION public.fn_current_socio_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_admin()         TO anon, authenticated;
