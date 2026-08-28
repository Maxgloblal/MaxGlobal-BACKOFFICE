-- =====================================================================
-- MAX GLOBAL CORPORATION — POLÍTICAS DE SEGURIDAD POR FILA (RLS)
-- Protección de datos conforme a la Ley N° 29733
-- =====================================================================

-- 0. FUNCIONES AUXILIARES DE AUTORIZACIÓN
CREATE OR REPLACE FUNCTION public.fn_current_socio_id()
RETURNS BIGINT AS $$
    SELECT id FROM public.socio WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.socio
        WHERE email = auth.jwt() ->> 'email'
          AND rol IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 1. ACTIVACIÓN DE RLS EN LAS 22 TABLAS
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack ENABLE ROW LEVEL SECURITY;
ALTER TABLE nivel_comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_comision_especial ENABLE ROW LEVEL SECURITY;
ALTER TABLE rango ENABLE ROW LEVEL SECURITY;
ALTER TABLE socio ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_ancestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE punto_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE activacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE rango_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_retiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodo_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;


-- 2. POLÍTICAS DE CATÁLOGO Y CONFIGURACIÓN PÚBLICA / AUTENTICADA
-- config
CREATE POLICY "config_select_public" ON config FOR SELECT USING (true);
CREATE POLICY "config_admin_all" ON config FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- producto
CREATE POLICY "producto_select_public" ON producto FOR SELECT USING (true);
CREATE POLICY "producto_admin_all" ON producto FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- pack
CREATE POLICY "pack_select_public" ON pack FOR SELECT USING (true);
CREATE POLICY "pack_admin_all" ON pack FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- nivel_comision
CREATE POLICY "nivel_comision_select" ON nivel_comision FOR SELECT USING (true);
CREATE POLICY "nivel_comision_admin" ON nivel_comision FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- pack_comision_especial
CREATE POLICY "pack_comision_especial_select" ON pack_comision_especial FOR SELECT USING (true);
CREATE POLICY "pack_comision_especial_admin" ON pack_comision_especial FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- rango
CREATE POLICY "rango_select_public" ON rango FOR SELECT USING (true);
CREATE POLICY "rango_admin_all" ON rango FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- punto_entrega
CREATE POLICY "punto_entrega_select" ON punto_entrega FOR SELECT USING (true);
CREATE POLICY "punto_entrega_admin" ON punto_entrega FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- ciclo
CREATE POLICY "ciclo_select" ON ciclo FOR SELECT USING (true);
CREATE POLICY "ciclo_admin" ON ciclo FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- periodo_global
CREATE POLICY "periodo_global_select" ON periodo_global FOR SELECT USING (true);
CREATE POLICY "periodo_global_admin" ON periodo_global FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());


-- 3. POLÍTICAS DE RED Y SOCIOS (LEY 29733)
-- socio: Un socio solo lee su propio registro o registros de su red descendente.
-- Solo admin puede insertar/eliminar o modificar roles.
CREATE POLICY "socio_select_propio_o_red" ON socio FOR SELECT USING (
    fn_is_admin() OR
    id = fn_current_socio_id() OR
    EXISTS (
        SELECT 1 FROM red_ancestro ra
        WHERE ra.ancestro_id = fn_current_socio_id()
          AND ra.descendiente_id = socio.id
    )
);

CREATE POLICY "socio_update_propio" ON socio FOR UPDATE USING (
    fn_is_admin() OR id = fn_current_socio_id()
) WITH CHECK (
    fn_is_admin() OR id = fn_current_socio_id()
);

CREATE POLICY "socio_insert_admin" ON socio FOR INSERT WITH CHECK (
    fn_is_admin()
);

CREATE POLICY "socio_delete_admin" ON socio FOR DELETE USING (
    fn_is_admin()
);

-- red_ancestro: Un socio solo ve su descendencia
CREATE POLICY "red_ancestro_select" ON red_ancestro FOR SELECT USING (
    fn_is_admin() OR ancestro_id = fn_current_socio_id()
);

CREATE POLICY "red_ancestro_admin" ON red_ancestro FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());


-- 4. POLÍTICAS DE TRANSACCIONES Y PEDIDOS
-- orden: El socio solo ve sus pedidos. Solo admin crea y aprueba pedidos.
CREATE POLICY "orden_select" ON orden FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

CREATE POLICY "orden_admin" ON orden FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- orden_detalle
CREATE POLICY "orden_detalle_select" ON orden_detalle FOR SELECT USING (
    fn_is_admin() OR EXISTS (
        SELECT 1 FROM orden o
        WHERE o.id = orden_detalle.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

CREATE POLICY "orden_detalle_admin" ON orden_detalle FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- voucher
CREATE POLICY "voucher_select" ON voucher FOR SELECT USING (
    fn_is_admin() OR EXISTS (
        SELECT 1 FROM orden o
        WHERE o.id = voucher.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

CREATE POLICY "voucher_admin" ON voucher FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- envio
CREATE POLICY "envio_select" ON envio FOR SELECT USING (
    fn_is_admin() OR EXISTS (
        SELECT 1 FROM orden o
        WHERE o.id = envio.orden_id
          AND o.socio_id = fn_current_socio_id()
    )
);

CREATE POLICY "envio_admin" ON envio FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());


-- 5. POLÍTICAS DE CÁLCULO Y COMISIONES
-- movimiento_puntos
CREATE POLICY "movimiento_puntos_select" ON movimiento_puntos FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

CREATE POLICY "movimiento_puntos_admin" ON movimiento_puntos FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- activacion
CREATE POLICY "activacion_select" ON activacion FOR SELECT USING (
    fn_is_admin() OR
    socio_id = fn_current_socio_id() OR
    EXISTS (
        SELECT 1 FROM red_ancestro ra
        WHERE ra.ancestro_id = fn_current_socio_id()
          AND ra.descendiente_id = activacion.socio_id
    )
);

CREATE POLICY "activacion_admin" ON activacion FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- comision: UN SOCIO NUNCA VE LAS COMISIONES DE OTROS
CREATE POLICY "comision_select" ON comision FOR SELECT USING (
    fn_is_admin() OR beneficiario_id = fn_current_socio_id()
);

CREATE POLICY "comision_admin" ON comision FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- rango_ciclo
CREATE POLICY "rango_ciclo_select" ON rango_ciclo FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

CREATE POLICY "rango_ciclo_admin" ON rango_ciclo FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());


-- 6. POLÍTICAS DE BILLETERA, RETIROS Y AUDITORÍA
-- wallet_movimiento
CREATE POLICY "wallet_movimiento_select" ON wallet_movimiento FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

CREATE POLICY "wallet_movimiento_admin" ON wallet_movimiento FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- solicitud_retiro
CREATE POLICY "solicitud_retiro_select" ON solicitud_retiro FOR SELECT USING (
    fn_is_admin() OR socio_id = fn_current_socio_id()
);

CREATE POLICY "solicitud_retiro_insert_propio" ON solicitud_retiro FOR INSERT WITH CHECK (
    socio_id = fn_current_socio_id() OR fn_is_admin()
);

CREATE POLICY "solicitud_retiro_admin" ON solicitud_retiro FOR ALL USING (fn_is_admin()) WITH CHECK (fn_is_admin());

-- auditoria: SOLO EL ADMINISTRADOR
CREATE POLICY "auditoria_admin_select" ON auditoria FOR SELECT USING (fn_is_admin());
CREATE POLICY "auditoria_admin_insert" ON auditoria FOR INSERT WITH CHECK (fn_is_admin());
