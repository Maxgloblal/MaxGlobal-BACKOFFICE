-- ==============================================================================
-- TAREA-21: Bloque 5 - Actualizar imagen_url de los 8 productos con URLs públicas
-- ==============================================================================

UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/cafe-moringa.webp' WHERE codigo = 'CAFE';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/colageno-hidrolizado.webp' WHERE codigo = 'COLAGENO';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/aceite-moringa.webp' WHERE codigo = 'AC-MORINGA';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/esplendor.webp' WHERE codigo = 'ESPLENDOR';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/aceite-oregano.webp' WHERE codigo = 'AC-OREGANO';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/capsulas-moringa.webp' WHERE codigo = 'CAP-MORINGA';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/harina-moringa.webp' WHERE codigo = 'HAR-MORINGA';
UPDATE public.producto SET imagen_url = 'https://utlohnidkuvxqppmoevj.supabase.co/storage/v1/object/public/productos/perfume-dalba.webp' WHERE codigo = 'DALBA';
