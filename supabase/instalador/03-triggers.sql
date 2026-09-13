-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 03-TRIGGERS.SQL
-- Los 5 disparadores de lógica de negocio y seguridad
-- Idempotente: DROP TRIGGER IF EXISTS seguido de CREATE TRIGGER
-- =====================================================================

-- 1. Mantenimiento automático del árbol de ancestros al registrar un socio
DROP TRIGGER IF EXISTS trg_red_ancestro ON public.socio;
CREATE TRIGGER trg_red_ancestro
BEFORE INSERT ON public.socio
FOR EACH ROW
EXECUTE FUNCTION public.fn_construir_red_ancestro();

-- 2. Protección de inmutabilidad en columnas críticas de socio (Ley 29733 / RF-333)
DROP TRIGGER IF EXISTS trg_proteger_inmutables_socio ON public.socio;
CREATE TRIGGER trg_proteger_inmutables_socio
BEFORE UPDATE ON public.socio
FOR EACH ROW
EXECUTE FUNCTION public.fn_proteger_columnas_inmutables_socio();

-- 3. Inmutabilidad contable: bloquear puntos en ciclos cerrados
DROP TRIGGER IF EXISTS trg_bloq_mov_puntos ON public.movimiento_puntos;
CREATE TRIGGER trg_bloq_mov_puntos
BEFORE INSERT ON public.movimiento_puntos
FOR EACH ROW
EXECUTE FUNCTION public.fn_bloquear_ciclo_cerrado();

-- 4. Inmutabilidad contable: bloquear órdenes en ciclos cerrados
DROP TRIGGER IF EXISTS trg_bloq_orden ON public.orden;
CREATE TRIGGER trg_bloq_orden
BEFORE INSERT ON public.orden
FOR EACH ROW
EXECUTE FUNCTION public.fn_bloquear_ciclo_cerrado();

-- 5. Validación y normalización de pack en solicitudes de afiliación
DROP TRIGGER IF EXISTS trg_validar_pack_solicitud ON public.solicitud_afiliacion;
CREATE TRIGGER trg_validar_pack_solicitud
BEFORE INSERT ON public.solicitud_afiliacion
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_pack_solicitud();
