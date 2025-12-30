-- ============================================
-- Supabase Setup SQL for العقدة Restaurant Website
-- ============================================
-- Run these queries in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE OFFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to table
COMMENT ON TABLE public.offers IS 'Stores restaurant offers/promotions';

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES FOR OFFERS TABLE
-- ============================================

-- Policy: Allow public users to READ offers
CREATE POLICY "Allow public read access to offers"
ON public.offers
FOR SELECT
TO public
USING (true);

-- Policy: Allow authenticated users to INSERT offers
CREATE POLICY "Allow authenticated users to insert offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE offers
CREATE POLICY "Allow authenticated users to update offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE offers
CREATE POLICY "Allow authenticated users to delete offers"
ON public.offers
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 4. CREATE FUNCTION TO UPDATE updated_at TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_title ON public.offers(title);

-- ============================================
-- END OF SQL QUERIES
-- ============================================

-- ============================================
-- MANUAL SETUP STEPS IN SUPABASE DASHBOARD
-- ============================================

-- STEP 1: CREATE STORAGE BUCKET FOR MENU PDF
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: menu-pdf
-- 4. Public bucket: YES (so PDFs can be accessed publicly)
-- 5. Click "Create bucket"

-- STEP 2: SET UP STORAGE POLICIES
-- After creating the bucket, go to Storage > Policies for "menu-pdf" bucket
-- Run these policies in SQL Editor:

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

-- Policy: Allow authenticated users to DELETE menu PDFs
CREATE POLICY "Allow authenticated users to delete menu PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-pdf');

-- ============================================
-- STEP 3: CREATE ADMIN USER
-- ============================================
-- Option A: Via Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email and password
-- 4. Save the credentials securely

-- Option B: Via SQL (if you want to create programmatically)
-- Note: This requires enabling email auth and setting up email templates
-- Users should sign up via the admin login page instead

-- ============================================
-- STEP 4: VERIFY SETUP
-- ============================================
-- Run this query to verify the offers table is set up correctly:
SELECT * FROM public.offers LIMIT 1;

-- Check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'offers';

-- Check storage bucket exists:
SELECT * FROM storage.buckets WHERE name = 'menu-pdf';

-- ============================================
-- NOTES
-- ============================================
-- 1. Make sure RLS is enabled on the offers table
-- 2. The storage bucket "menu-pdf" must be public for PDFs to be accessible
-- 3. Only authenticated users (admins) can manage offers and upload menu PDFs
-- 4. Public users can only read offers and view menu PDFs
-- 5. Update the footer contact information in src/components/Footer.jsx



