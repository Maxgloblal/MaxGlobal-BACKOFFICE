-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 05-STORAGE.SQL
-- Creación de Buckets ('vouchers' y 'productos') y Políticas RLS
-- Idempotente: ON CONFLICT DO UPDATE y DROP POLICY IF EXISTS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BUCKETS DE ALMACENAMIENTO
-- ---------------------------------------------------------------------

-- Bucket privado: vouchers (comprobantes de pago, límite 5 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vouchers',
  'vouchers',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[];

-- Bucket público: productos (catálogo comercial, límite 2 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos',
  'productos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- ---------------------------------------------------------------------
-- 2. SEGURIDAD RLS EN STORAGE.OBJECTS
-- ---------------------------------------------------------------------

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. POLÍTICAS RLS: BUCKET 'vouchers' (PRIVADO)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin puede subir vouchers" ON storage.objects;
CREATE POLICY "Admin puede subir vouchers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vouchers' AND public.fn_is_admin() = true
);

DROP POLICY IF EXISTS "Admin puede leer vouchers" ON storage.objects;
CREATE POLICY "Admin puede leer vouchers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vouchers' AND public.fn_is_admin() = true
);

DROP POLICY IF EXISTS "Socio puede leer voucher de su propia orden" ON storage.objects;
CREATE POLICY "Socio puede leer voucher de su propia orden"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vouchers' AND
  EXISTS (
    SELECT 1
    FROM public.voucher v
    JOIN public.orden o ON o.id = v.orden_id
    WHERE (
      v.imagen_url = storage.objects.name 
      OR v.imagen_url = ('vouchers/' || storage.objects.name)
      OR v.imagen_url LIKE ('%' || storage.objects.name)
    )
    AND o.socio_id = public.fn_current_socio_id()
  )
);

-- ---------------------------------------------------------------------
-- 4. POLÍTICAS RLS: BUCKET 'productos' (PÚBLICO)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "productos_select_public" ON storage.objects;
CREATE POLICY "productos_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "productos_insert_admin" ON storage.objects;
CREATE POLICY "productos_insert_admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos' AND public.fn_is_admin() = true);

DROP POLICY IF EXISTS "productos_update_admin" ON storage.objects;
CREATE POLICY "productos_update_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productos' AND public.fn_is_admin() = true)
WITH CHECK (bucket_id = 'productos' AND public.fn_is_admin() = true);
