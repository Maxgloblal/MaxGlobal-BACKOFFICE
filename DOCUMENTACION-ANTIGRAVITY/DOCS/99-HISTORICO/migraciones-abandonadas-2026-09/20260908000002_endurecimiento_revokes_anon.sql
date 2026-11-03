-- Migración TAREA-28 Bloque 2: Revocar permisos innecesarios a anon y PUBLIC

-- 1. Revocar EXECUTE a anon y PUBLIC en las 9 funciones identificadas
REVOKE EXECUTE ON FUNCTION public.fn_aprobar_solicitud_retiro(bigint, bigint) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_rechazar_solicitud_retiro(bigint, bigint, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_convertir_solicitud_afiliacion(bigint, bigint) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_descartar_solicitud_afiliacion(bigint, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_registrar_orden_upgrade(bigint, bigint, jsonb, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_registrar_pedido_recompra(bigint, jsonb, jsonb, jsonb, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_marcar_password_cambiada() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_marcar_password_cambiada() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_obtener_schema_columnas() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_test_limpiar_socio_prueba(text) FROM anon, PUBLIC;

-- 2. Revocar mutaciones (INSERT, UPDATE, DELETE, TRUNCATE) a anon en tablas sensibles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.socio FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.orden FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.activacion FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.producto FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.pack FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.solicitud_afiliacion FROM anon;
