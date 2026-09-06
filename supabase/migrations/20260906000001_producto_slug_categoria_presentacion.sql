-- TAREA-21 · Bloque 2: Migración de producto (slug, categoria, presentacion y eliminar descuento_pct)
ALTER TABLE public.producto
  ADD COLUMN slug varchar,
  ADD COLUMN categoria varchar,
  ADD COLUMN presentacion varchar;

ALTER TABLE public.producto DROP COLUMN descuento_pct;
