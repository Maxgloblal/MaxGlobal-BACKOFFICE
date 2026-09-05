-- ==============================================================================
-- TAREA-18 · CAMPO CCI Y VALIDACIÓN DE CUENTAS BANCARIAS
-- ==============================================================================
-- 1. Agregar columna cci a tabla socio (nullable para preservar a los 508 socios)
ALTER TABLE public.socio ADD COLUMN IF NOT EXISTS cci varchar;

-- 2. Cargar prefijos de 3 dígitos del CCI según entidad bancaria peruana en config
INSERT INTO public.config (clave, valor, tipo, descripcion)
VALUES (
  'codigos_banco_cci',
  '{"BCP":["002"],"BBVA":["011"],"Interbank":["003"],"Scotiabank":["009"],"Banco de la Nación":["018"]}',
  'json',
  'Prefijos de 3 dígitos del CCI según entidad bancaria peruana'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
