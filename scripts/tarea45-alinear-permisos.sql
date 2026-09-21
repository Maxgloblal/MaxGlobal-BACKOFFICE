-- =====================================================================
-- TAREA-45: ALINEACIÓN DE PERMISOS (DEMO Y PRODUCCIÓN)
-- =====================================================================

-- 1. Revocar permisos globales a PUBLIC, anon y authenticated en tablas y vistas
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- 2. Conceder SELECT a anon y authenticated en tablas de catálogo
GRANT SELECT ON public.config TO anon, authenticated;
GRANT SELECT ON public.producto TO anon, authenticated;
GRANT SELECT ON public.pack TO anon, authenticated;
GRANT SELECT ON public.rango TO anon, authenticated;
GRANT SELECT ON public.punto_entrega TO anon, authenticated;
GRANT SELECT ON public.nivel_comision TO anon, authenticated;
GRANT SELECT ON public.pack_comision_especial TO anon, authenticated;

-- 3. Prospectos en landing
GRANT INSERT ON public.solicitud_afiliacion TO anon, authenticated;
GRANT SELECT, UPDATE ON public.solicitud_afiliacion TO authenticated;

-- 4. Tablas operativas bajo RLS
GRANT SELECT, INSERT, UPDATE ON public.socio TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orden TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orden_detalle TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.voucher TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.envio TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.solicitud_retiro TO authenticated;

-- 5. Libros mayores, red y cómputos (solo SELECT)
GRANT SELECT ON public.ciclo TO authenticated;
GRANT SELECT ON public.periodo_global TO authenticated;
GRANT SELECT ON public.red_ancestro TO authenticated;
GRANT SELECT ON public.movimiento_puntos TO authenticated;
GRANT SELECT ON public.activacion TO authenticated;
GRANT SELECT ON public.comision TO authenticated;
GRANT SELECT ON public.rango_ciclo TO authenticated;
GRANT SELECT ON public.wallet_movimiento TO authenticated;
GRANT SELECT, INSERT ON public.auditoria TO authenticated;

-- 6. Vistas
GRANT SELECT ON public.v_puntos_ciclo TO authenticated;
GRANT SELECT ON public.v_wallet_saldo TO authenticated;
GRANT SELECT ON public.v_frontales_activos TO authenticated;

-- 7. Secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 8. Grants de funciones del sistema
GRANT EXECUTE ON FUNCTION public.fn_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_current_socio_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_marcar_password_cambiada TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_afiliacion_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_pedido_recompra TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_orden_upgrade TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_confirmar_orden_pago TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rechazar_orden_pago TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_desglose_comisiones_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rango_lineas_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_actualizar_config_ajustable TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_guardar_rango_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_aprobar_solicitud_retiro TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rechazar_solicitud_retiro TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_dar_de_baja_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_vista_previa_baja_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_convertir_solicitud_afiliacion TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_descartar_solicitud_afiliacion TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_obtener_auditoria_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_obtener_schema_columnas TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_actualizar_datos_socio_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_vista_previa_eliminar_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_eliminar_socio_definitivo TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_pago_directo_socio TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_calcular_y_persistir_rangos(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_crear_producto_admin(jsonb, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_editar_producto_admin(bigint, jsonb, bigint, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_cambiar_estado_producto_admin(bigint, boolean, bigint, jsonb) TO authenticated;
