-- ==============================================================================
-- TAREA-21: Bloque 4 - Bucket de fotos de productos (público) y políticas RLS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('productos', 'productos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "productos_select_public" ON storage.objects;
CREATE POLICY "productos_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "productos_insert_admin" ON storage.objects;
CREATE POLICY "productos_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos' AND public.fn_is_admin() = true);

DROP POLICY IF EXISTS "productos_update_admin" ON storage.objects;
CREATE POLICY "productos_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos' AND public.fn_is_admin() = true)
WITH CHECK (bucket_id = 'productos' AND public.fn_is_admin() = true);
