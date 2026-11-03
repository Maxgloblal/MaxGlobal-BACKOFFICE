-- ==============================================================================
-- TAREA-21: Bloque 3 - Poblar los 8 productos con datos comerciales de config.js
-- y agregar restricción UNIQUE en columna slug.
-- ==============================================================================

UPDATE public.producto SET
  slug = 'cafe-moringa',
  nombre = 'Coffee Capuccino',
  categoria = 'Salud y Nutrición',
  presentacion = 'Caja 20 sobres de 18 g',
  descripcion = 'Café capuccino instantáneo con moringa y ganoderma. Para reemplazar tu café de la mañana.'
WHERE codigo = 'CAFE';

UPDATE public.producto SET
  slug = 'colageno-hidrolizado',
  nombre = 'Colágeno Aeterna',
  categoria = 'Salud y Nutrición',
  presentacion = 'Pote 150 g',
  descripcion = 'Colágeno hidrolizado en polvo con extracto de arándano, extracto de uva, acerola y vitaminas del complejo B. Sabor frutos rojos.'
WHERE codigo = 'COLAGENO';

UPDATE public.producto SET
  slug = 'aceite-moringa',
  nombre = 'Aceite de Moringa',
  categoria = 'Cuidado Personal',
  presentacion = 'Frasco gotero 50 ml',
  descripcion = 'Aceite de moringa 100% natural, de uso tópico. Nutre, regenera y rejuvenece.'
WHERE codigo = 'AC-MORINGA';

UPDATE public.producto SET
  slug = 'esplendor',
  nombre = 'Esplendor — Lágrimas Humectantes',
  categoria = 'Cuidado Personal',
  presentacion = 'Frasco gotero 15 ml',
  descripcion = 'Gotas humectantes homeopáticas para los ojos, de la marca LAL. Se aplica una gota tres veces al día.'
WHERE codigo = 'ESPLENDOR';

UPDATE public.producto SET
  slug = 'aceite-oregano',
  nombre = 'Aceite de Orégano',
  categoria = 'Salud y Nutrición',
  presentacion = 'Frasco gotero 10 ml',
  descripcion = 'Aceite esencial de orégano 100% esencial.'
WHERE codigo = 'AC-OREGANO';

UPDATE public.producto SET
  slug = 'capsulas-moringa',
  nombre = 'Cápsulas de Moringa',
  categoria = 'Salud y Nutrición',
  presentacion = 'Frasco 100 cápsulas',
  descripcion = 'Harina de hojas de moringa seleccionadas en cápsulas, sin amargor. 100% natural.'
WHERE codigo = 'CAP-MORINGA';

UPDATE public.producto SET
  slug = 'harina-moringa',
  nombre = 'Moringa en Polvo',
  categoria = 'Salud y Nutrición',
  presentacion = 'Bolsa 200 g',
  descripcion = 'Hojas de moringa molidas, para agregar a comidas y batidos.'
WHERE codigo = 'HAR-MORINGA';

UPDATE public.producto SET
  slug = 'perfume-dalba',
  nombre = 'Perfume Dalba',
  categoria = 'Perfumería',
  presentacion = 'Frasco 50 ml',
  descripcion = 'Perfume de la línea Dalba.'
WHERE codigo = 'DALBA';

ALTER TABLE public.producto ADD CONSTRAINT producto_slug_key UNIQUE (slug);
