-- TAREA-16 · VENTA A CLIENTE FINAL
-- Migración Bloque 1: Agregar columna tipo_venta a la tabla orden
-- Valores admitidos: 'socio' | 'cliente'
-- Las 1,055 órdenes existentes quedan en 'socio' por el valor DEFAULT.

ALTER TABLE public.orden
  ADD COLUMN IF NOT EXISTS tipo_venta varchar NOT NULL DEFAULT 'socio';

COMMENT ON COLUMN public.orden.tipo_venta IS 'Indica si la compra es para consumo/recompra de un socio o venta a precio de lista para cliente final (socio | cliente)';
