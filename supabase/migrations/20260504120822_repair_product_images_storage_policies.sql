-- ============================================================
-- Migration: Repair product image storage policies
-- - fixes product image path authorization after unqualified name
--   resolved to public.stores.name inside the ownership subquery
-- - keeps bucket restrictions aligned with the vendor uploader
-- - removes broad public storage.objects SELECT listing
-- ============================================================

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(storage.objects.name))[1] = 'products'
    AND (storage.foldername(storage.objects.name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(storage.objects.name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
);

CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND (storage.foldername(storage.objects.name))[1] = 'products'
    AND (storage.foldername(storage.objects.name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(storage.objects.name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
)
WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(storage.objects.name))[1] = 'products'
    AND (storage.foldername(storage.objects.name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(storage.objects.name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
);
