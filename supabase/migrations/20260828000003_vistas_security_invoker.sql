-- =====================================================================
-- MAX GLOBAL CORPORATION — CORRECCIÓN DE VISTAS Y FUNCIONES DE SEGURIDAD
-- 1. Vistas con security_invoker = true (re-aplican RLS del usuario que consulta)
-- 2. Funciones con search_path inmutable (public, pg_temp)
-- 3. Revocación de permisos de ejecución innecesarios en funciones críticas
-- =====================================================================

-- 1. VISTAS SECURITY INVOKER
ALTER VIEW public.v_puntos_ciclo      SET (security_invoker = true);
ALTER VIEW public.v_frontales_activos SET (security_invoker = true);
ALTER VIEW public.v_wallet_saldo      SET (security_invoker = true);


-- 2. SEARCH_PATH INMUTABLE EN FUNCIONES
ALTER FUNCTION public.fn_current_socio_id()        SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_is_admin()                SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_construir_red_ancestro()  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_bloquear_ciclo_cerrado()  SET search_path = public, pg_temp;


-- 3. REVOCACIÓN DE PERMISOS DE EJECUCIÓN
REVOKE EXECUTE ON FUNCTION public.fn_current_socio_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_is_admin() FROM anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated';
  END IF;
END $$;
