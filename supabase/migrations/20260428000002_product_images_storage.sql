-- ============================================================
-- Migration: Product image storage setup
-- - creates/verifies public product-images bucket
-- - aligns bucket MIME and size limits with vendor UI
-- - allows seller/admin uploads to products/<store_id>/* while keeping bucket reads public
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
CREATE POLICY "Public can read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
    AND (storage.foldername(name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
);

DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
    AND (storage.foldername(name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
)
WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
    AND (storage.foldername(name))[2] IS NOT NULL
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.stores s
            WHERE s.id::TEXT = (storage.foldername(name))[2]
              AND s.user_id = auth.uid()
              AND s.deleted_at IS NULL
        )
    )
);
