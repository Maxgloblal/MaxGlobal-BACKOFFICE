-- =====================================================================
-- MAX GLOBAL CORPORATION · TAREA-32: VALIDACIÓN DE PACK EN SOLICITUD
-- Fecha original: 2026-09-08
-- Rescatado para TAREA-35 (Hallazgo 1)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_validar_pack_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_codigo_normalizado TEXT;
  v_existe BOOLEAN;
BEGIN
  IF NEW.pack_codigo IS NULL OR TRIM(NEW.pack_codigo) = '' THEN
    RAISE EXCEPTION 'El campo pack_codigo es obligatorio';
  END IF;

  v_codigo_normalizado := CASE LOWER(TRIM(NEW.pack_codigo))
    WHEN 'kit-emprendedor' THEN 'EMPRENDEDOR'
    WHEN 'pack-ejecutivo' THEN 'EJECUTIVO'
    WHEN 'pack-gold' THEN 'GOLD'
    WHEN 'pack-familiar' THEN 'FAMILIAR'
    WHEN 'pack-empresarial' THEN 'EMPRESARIAL'
    ELSE UPPER(TRIM(NEW.pack_codigo))
  END;

  SELECT EXISTS(
    SELECT 1 FROM pack WHERE UPPER(codigo) = v_codigo_normalizado AND activo = true
  ) INTO v_existe;

  IF NOT v_existe THEN
    RAISE EXCEPTION 'El pack_codigo "%" no existe en la tabla pack', NEW.pack_codigo;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.fn_validar_pack_solicitud() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_validar_pack_solicitud ON public.solicitud_afiliacion;
CREATE TRIGGER trg_validar_pack_solicitud
BEFORE INSERT ON public.solicitud_afiliacion
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_pack_solicitud();
