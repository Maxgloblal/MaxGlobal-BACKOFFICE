-- =============================================================================
-- TAREA-14 · BLOQUE 1: CREACIÓN DEL BUCKET 'vouchers' Y POLÍTICAS RLS
-- =============================================================================

-- 1. Crear el bucket privado 'vouchers' con límite de 5 MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vouchers',
  'vouchers',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Asegurar RLS en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad
DROP POLICY IF EXISTS "Admin puede subir vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede leer vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Socio puede leer voucher de su propia orden" ON storage.objects;

-- SUBIR: solo el admin
CREATE POLICY "Admin puede subir vouchers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vouchers' AND public.fn_is_admin() = true
);

-- LEER: admin siempre
CREATE POLICY "Admin puede leer vouchers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vouchers' AND public.fn_is_admin() = true
);

-- LEER: socio solo su propia orden
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
