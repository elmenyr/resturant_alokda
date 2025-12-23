-- ============================================
-- FIX STORAGE POLICIES FOR العقدة RESTAURANT
-- ============================================
-- Run this to fix "new row violates row-level security policy" error
-- ============================================

-- ============================================
-- STEP 1: DELETE EXISTING POLICIES (if any)
-- ============================================
-- Delete existing policies for offers-images bucket
DROP POLICY IF EXISTS "Allow public read access to offer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload offer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete offer images" ON storage.objects;

-- Delete existing policies for menu-pdf bucket (if needed)
DROP POLICY IF EXISTS "Allow public read access to menu PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload menu PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete menu PDFs" ON storage.objects;

-- ============================================
-- STEP 2: CREATE STORAGE POLICIES FOR OFFERS IMAGES
-- ============================================
-- Make sure bucket "offers-images" exists and is PUBLIC

-- Policy: Allow public users to READ offer images
CREATE POLICY "Allow public read access to offer images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'offers-images');

-- Policy: Allow authenticated users to UPLOAD offer images
CREATE POLICY "Allow authenticated users to upload offer images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'offers-images');

-- Policy: Allow authenticated users to UPDATE offer images
CREATE POLICY "Allow authenticated users to update offer images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'offers-images')
WITH CHECK (bucket_id = 'offers-images');

-- Policy: Allow authenticated users to DELETE offer images
CREATE POLICY "Allow authenticated users to delete offer images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'offers-images');

-- ============================================
-- STEP 3: CREATE STORAGE POLICIES FOR MENU PDF
-- ============================================
-- Make sure bucket "menu-pdf" exists and is PUBLIC

-- Policy: Allow public users to READ menu PDFs
CREATE POLICY "Allow public read access to menu PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-pdf');

-- Policy: Allow authenticated users to UPLOAD menu PDFs
CREATE POLICY "Allow authenticated users to upload menu PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-pdf');

-- Policy: Allow authenticated users to UPDATE menu PDFs
CREATE POLICY "Allow authenticated users to update menu PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-pdf')
WITH CHECK (bucket_id = 'menu-pdf');

-- Policy: Allow authenticated users to DELETE menu PDFs
CREATE POLICY "Allow authenticated users to delete menu PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-pdf');

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if policies are created:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check if buckets exist:
-- SELECT * FROM storage.buckets WHERE name IN ('menu-pdf', 'offers-images');

