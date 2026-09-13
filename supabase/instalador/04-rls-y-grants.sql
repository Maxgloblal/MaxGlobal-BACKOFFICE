-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 04-RLS-Y-GRANTS.SQL
-- Habilitación de RLS en las 23 tablas, las 49 políticas de seguridad
-- y la matriz de permisos y revocaciones (Endurecimiento TAREA-28)
-- Idempotente: DROP POLICY IF EXISTS, REVOKE/GRANT
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ACTIVACIÓN DE ROW LEVEL SECURITY EN LAS 23 TABLAS
-- ---------------------------------------------------------------------
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nivel_comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_comision_especial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rango ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punto_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodo_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.red_ancestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimiento_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rango_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitud_retiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitud_afiliacion ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. POLÍTICAS DE SEGURIDAD (49 POLÍTICAS)
-- ---------------------------------------------------------------------

-- config (2)
DROP POLICY IF EXISTS "config_select_public" ON public.config;
CREATE POLICY "config_select_public" ON public.config FOR SELECT USING (true);

DROP POLICY IF EXISTS "config_admin_all" ON public.config;
CREATE POLICY "config_admin_all" ON public.config FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- producto (2)
DROP POLICY IF EXISTS "producto_select_public" ON public.producto;
CREATE POLICY "producto_select_public" ON public.producto FOR SELECT USING (true);

DROP POLICY IF EXISTS "producto_admin_all" ON public.producto;
CREATE POLICY "producto_admin_all" ON public.producto FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- pack (2)
DROP POLICY IF EXISTS "pack_select_public" ON public.pack;
CREATE POLICY "pack_select_public" ON public.pack FOR SELECT USING (true);

DROP POLICY IF EXISTS "pack_admin_all" ON public.pack;
CREATE POLICY "pack_admin_all" ON public.pack FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- nivel_comision (2)
DROP POLICY IF EXISTS "nivel_comision_select" ON public.nivel_comision;
CREATE POLICY "nivel_comision_select" ON public.nivel_comision FOR SELECT USING (true);

DROP POLICY IF EXISTS "nivel_comision_admin" ON public.nivel_comision;
CREATE POLICY "nivel_comision_admin" ON public.nivel_comision FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- pack_comision_especial (2)
DROP POLICY IF EXISTS "pack_comision_especial_select" ON public.pack_comision_especial;
CREATE POLICY "pack_comision_especial_select" ON public.pack_comision_especial FOR SELECT USING (true);

DROP POLICY IF EXISTS "pack_comision_especial_admin" ON public.pack_comision_especial;
CREATE POLICY "pack_comision_especial_admin" ON public.pack_comision_especial FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- rango (2)
DROP POLICY IF EXISTS "rango_select_public" ON public.rango;
CREATE POLICY "rango_select_public" ON public.rango FOR SELECT USING (true);

DROP POLICY IF EXISTS "rango_admin_all" ON public.rango;
CREATE POLICY "rango_admin_all" ON public.rango FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- punto_entrega (2)
DROP POLICY IF EXISTS "punto_entrega_select" ON public.punto_entrega;
CREATE POLICY "punto_entrega_select" ON public.punto_entrega FOR SELECT USING (true);

DROP POLICY IF EXISTS "punto_entrega_admin" ON public.punto_entrega;
CREATE POLICY "punto_entrega_admin" ON public.punto_entrega FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- ciclo (2)
DROP POLICY IF EXISTS "ciclo_select" ON public.ciclo;
CREATE POLICY "ciclo_select" ON public.ciclo FOR SELECT USING (true);

DROP POLICY IF EXISTS "ciclo_admin" ON public.ciclo;
CREATE POLICY "ciclo_admin" ON public.ciclo FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- periodo_global (2)
DROP POLICY IF EXISTS "periodo_global_select" ON public.periodo_global;
CREATE POLICY "periodo_global_select" ON public.periodo_global FOR SELECT USING (true);

DROP POLICY IF EXISTS "periodo_global_admin" ON public.periodo_global;
CREATE POLICY "periodo_global_admin" ON public.periodo_global FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- socio (4)
DROP POLICY IF EXISTS "socio_select_propio_o_red" ON public.socio;
CREATE POLICY "socio_select_propio_o_red" ON public.socio FOR SELECT USING (
    fn_is_admin() OR
    id = fn_current_socio_id() OR
    EXISTS (
        SELECT 1 FROM public.red_ancestro ra
        WHERE ra.ancestro_id = fn_current_socio_id()
          AND ra.descendiente_id = socio.id
    )
);

DROP POLICY IF EXISTS "socio_update_propio" ON public.socio;
CREATE POLICY "socio_update_propio" ON public.socio FOR UPDATE USING (
    fn_is_admin() OR id = fn_current_socio_id()
) WITH CHECK (
    fn_is_admin() OR id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "socio_insert_admin" ON public.socio;
CREATE POLICY "socio_insert_admin" ON public.socio FOR INSERT WITH CHECK (
    fn_is_admin()
);

DROP POLICY IF EXISTS "socio_delete_admin" ON public.socio;
CREATE POLICY "socio_delete_admin" ON public.socio FOR DELETE USING (
    fn_is_admin()
);

-- red_ancestro (2)
DROP POLICY IF EXISTS "red_ancestro_select" ON public.red_ancestro;
CREATE POLICY "red_ancestro_select" ON public.red_ancestro FOR SELECT USING (
    fn_is_admin() OR ancestro_id = fn_current_socio_id() OR descendiente_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "red_ancestro_admin" ON public.red_ancestro;
CREATE POLICY "red_ancestro_admin" ON public.red_ancestro FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- orden (2)
DROP POLICY IF EXISTS "orden_select" ON public.orden;
CREATE POLICY "orden_select" ON public.orden FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "orden_admin" ON public.orden;
CREATE POLICY "orden_admin" ON public.orden FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- orden_detalle (2)
DROP POLICY IF EXISTS "orden_detalle_select" ON public.orden_detalle;
CREATE POLICY "orden_detalle_select" ON public.orden_detalle FOR SELECT USING (
    fn_is_admin() OR
    EXISTS (
        SELECT 1 FROM public.orden o
        WHERE o.id = orden_detalle.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

DROP POLICY IF EXISTS "orden_detalle_admin" ON public.orden_detalle;
CREATE POLICY "orden_detalle_admin" ON public.orden_detalle FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- voucher (2)
DROP POLICY IF EXISTS "voucher_select" ON public.voucher;
CREATE POLICY "voucher_select" ON public.voucher FOR SELECT USING (
    fn_is_admin() OR
    EXISTS (
        SELECT 1 FROM public.orden o
        WHERE o.id = voucher.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

DROP POLICY IF EXISTS "voucher_admin" ON public.voucher;
CREATE POLICY "voucher_admin" ON public.voucher FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- envio (2)
DROP POLICY IF EXISTS "envio_select" ON public.envio;
CREATE POLICY "envio_select" ON public.envio FOR SELECT USING (
    fn_is_admin() OR
    EXISTS (
        SELECT 1 FROM public.orden o
        WHERE o.id = envio.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

DROP POLICY IF EXISTS "envio_admin" ON public.envio;
CREATE POLICY "envio_admin" ON public.envio FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- movimiento_puntos (2)
DROP POLICY IF EXISTS "movimiento_puntos_select" ON public.movimiento_puntos;
CREATE POLICY "movimiento_puntos_select" ON public.movimiento_puntos FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "movimiento_puntos_admin" ON public.movimiento_puntos;
CREATE POLICY "movimiento_puntos_admin" ON public.movimiento_puntos FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- activacion (2)
DROP POLICY IF EXISTS "activacion_select" ON public.activacion;
CREATE POLICY "activacion_select" ON public.activacion FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "activacion_admin" ON public.activacion;
CREATE POLICY "activacion_admin" ON public.activacion FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- comision (2)
DROP POLICY IF EXISTS "comision_select" ON public.comision;
CREATE POLICY "comision_select" ON public.comision FOR SELECT USING (
    fn_is_admin() OR beneficiario_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "comision_admin" ON public.comision;
CREATE POLICY "comision_admin" ON public.comision FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- rango_ciclo (2)
DROP POLICY IF EXISTS "rango_ciclo_select" ON public.rango_ciclo;
CREATE POLICY "rango_ciclo_select" ON public.rango_ciclo FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "rango_ciclo_admin" ON public.rango_ciclo;
CREATE POLICY "rango_ciclo_admin" ON public.rango_ciclo FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- wallet_movimiento (2)
DROP POLICY IF EXISTS "wallet_movimiento_select" ON public.wallet_movimiento;
CREATE POLICY "wallet_movimiento_select" ON public.wallet_movimiento FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "wallet_movimiento_admin" ON public.wallet_movimiento;
CREATE POLICY "wallet_movimiento_admin" ON public.wallet_movimiento FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- solicitud_retiro (3)
DROP POLICY IF EXISTS "solicitud_retiro_select" ON public.solicitud_retiro;
CREATE POLICY "solicitud_retiro_select" ON public.solicitud_retiro FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "solicitud_retiro_insert_propio" ON public.solicitud_retiro;
CREATE POLICY "solicitud_retiro_insert_propio" ON public.solicitud_retiro FOR INSERT WITH CHECK (
    socio_id = fn_current_socio_id()
);

DROP POLICY IF EXISTS "solicitud_retiro_admin" ON public.solicitud_retiro;
CREATE POLICY "solicitud_retiro_admin" ON public.solicitud_retiro FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- auditoria (2)
DROP POLICY IF EXISTS "auditoria_admin_select" ON public.auditoria;
CREATE POLICY "auditoria_admin_select" ON public.auditoria FOR SELECT USING (fn_is_admin());

DROP POLICY IF EXISTS "auditoria_admin_insert" ON public.auditoria;
CREATE POLICY "auditoria_admin_insert" ON public.auditoria FOR INSERT WITH CHECK (true);

-- solicitud_afiliacion (2)
DROP POLICY IF EXISTS "solicitud_afiliacion_admin_select" ON public.solicitud_afiliacion;
CREATE POLICY "solicitud_afiliacion_admin_select" ON public.solicitud_afiliacion FOR SELECT USING (
  public.fn_is_admin()
);

DROP POLICY IF EXISTS "solicitud_afiliacion_admin_update" ON public.solicitud_afiliacion;
CREATE POLICY "solicitud_afiliacion_admin_update" ON public.solicitud_afiliacion FOR UPDATE USING (
  public.fn_is_admin()
) WITH CHECK (
  public.fn_is_admin()
);

-- ---------------------------------------------------------------------
-- 3. PERMISOS Y REVOCACIONES (ENDURECIMIENTO TAREA-28)
-- ---------------------------------------------------------------------

-- Revocar permisos globales a PUBLIC y anon en todas las tablas
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;

-- Conceder SELECT público a tablas de catálogo (necesarias para landing y consultas públicas)
GRANT SELECT ON public.config TO anon, authenticated;
GRANT SELECT ON public.producto TO anon, authenticated;
GRANT SELECT ON public.pack TO anon, authenticated;
GRANT SELECT ON public.rango TO anon, authenticated;
GRANT SELECT ON public.punto_entrega TO anon, authenticated;
GRANT SELECT ON public.nivel_comision TO anon, authenticated;
GRANT SELECT ON public.pack_comision_especial TO anon, authenticated;

-- Permitir a prospectos registrar solicitudes de afiliación desde la landing
GRANT INSERT ON public.solicitud_afiliacion TO anon, authenticated;
GRANT SELECT, UPDATE ON public.solicitud_afiliacion TO authenticated;

-- Conceder operaciones a authenticated bajo RLS en tablas operativas
GRANT SELECT, INSERT, UPDATE ON public.socio TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orden TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orden_detalle TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.voucher TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.envio TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.solicitud_retiro TO authenticated;

GRANT SELECT ON public.ciclo TO authenticated;
GRANT SELECT ON public.periodo_global TO authenticated;
GRANT SELECT ON public.red_ancestro TO authenticated;
GRANT SELECT ON public.movimiento_puntos TO authenticated;
GRANT SELECT ON public.activacion TO authenticated;
GRANT SELECT ON public.comision TO authenticated;
GRANT SELECT ON public.rango_ciclo TO authenticated;
GRANT SELECT ON public.wallet_movimiento TO authenticated;
GRANT SELECT, INSERT ON public.auditoria TO authenticated;

-- Permisos sobre vistas
GRANT SELECT ON public.v_puntos_ciclo TO authenticated;
GRANT SELECT ON public.v_wallet_saldo TO authenticated;
GRANT SELECT ON public.v_frontales_activos TO authenticated;

-- Permisos sobre secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 4. PERMISOS DE EJECUCIÓN EN FUNCIONES (RPC)
-- ---------------------------------------------------------------------
-- Por defecto, revocar execute de PUBLIC y anon en todas las funciones
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Conceder execute solo a authenticated para funciones operativas del sistema
GRANT EXECUTE ON FUNCTION public.fn_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_current_socio_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_marcar_password_cambiada() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_afiliacion_socio(text, text, text, text, text, text, text, text, text, text, bigint, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_pedido_recompra(bigint, jsonb, text, text, text, text, jsonb, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registrar_orden_upgrade(bigint, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_confirmar_orden_pago TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rechazar_orden_pago(bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ejecutar_cierre_ciclo(int, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_desglose_comisiones_socio(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rango_lineas_socio(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_actualizar_config_ajustable(text, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_guardar_rango_config(int, int, int, numeric, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_aprobar_solicitud_retiro(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_rechazar_solicitud_retiro(bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_dar_de_baja_socio(bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_vista_previa_baja_socio(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_convertir_solicitud_afiliacion(bigint, int, bigint, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_descartar_solicitud_afiliacion(bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_obtener_auditoria_admin(int, int, text, text, timestamptz, timestamptz) TO authenticated;
