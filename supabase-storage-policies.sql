-- ============================================
-- STORAGE POLICIES FOR العقدة RESTAURANT
-- ============================================
-- Run these AFTER creating the storage buckets
-- ============================================

-- ============================================
-- PART 1: MENU PDF STORAGE POLICIES
-- ============================================
-- Create bucket "menu-pdf" (public) first, then run:

-- Allow public users to READ menu PDFs
CREATE POLICY "Allow public read access to menu PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-pdf');

-- Allow authenticated users to UPLOAD menu PDFs
CREATE POLICY "Allow authenticated users to upload menu PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-pdf');

-- Allow authenticated users to DELETE menu PDFs
CREATE POLICY "Allow authenticated users to delete menu PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-pdf');

-- ============================================
-- PART 2: OFFERS IMAGES STORAGE POLICIES
-- ============================================
-- Create bucket "offers-images" (public) first, then run:

-- Allow public users to READ offer images
CREATE POLICY "Allow public read access to offer images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'offers-images');

-- Allow authenticated users to UPLOAD offer images
CREATE POLICY "Allow authenticated users to upload offer images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'offers-images');

-- Allow authenticated users to DELETE offer images
CREATE POLICY "Allow authenticated users to delete offer images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'offers-images');

-- ============================================
-- VERIFICATION
-- ============================================
-- Check storage policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

