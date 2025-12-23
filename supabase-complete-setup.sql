-- ============================================
-- COMPLETE SUPABASE SETUP FOR العقدة RESTAURANT
-- ============================================
-- Copy and paste these queries into Supabase SQL Editor
-- Run them in order
-- ============================================

-- ============================================
-- PART 1: CREATE OFFERS TABLE
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

COMMENT ON TABLE public.offers IS 'Stores restaurant offers/promotions';

-- ============================================
-- PART 2: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE RLS POLICIES FOR OFFERS
-- ============================================

-- Allow public users to READ offers
CREATE POLICY "Allow public read access to offers"
ON public.offers
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to INSERT offers
CREATE POLICY "Allow authenticated users to insert offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to UPDATE offers
CREATE POLICY "Allow authenticated users to update offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to DELETE offers
CREATE POLICY "Allow authenticated users to delete offers"
ON public.offers
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- PART 4: CREATE AUTO-UPDATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PART 5: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_title ON public.offers(title);

-- ============================================
-- PART 6: STORAGE POLICIES (Run AFTER creating bucket)
-- ============================================
-- IMPORTANT: First create the bucket "menu-pdf" in Storage section
-- Then run these policies:

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
-- PART 7: STORAGE POLICIES FOR OFFERS IMAGES
-- ============================================
-- IMPORTANT: First create the bucket "offers-images" in Storage section
-- Then run these policies:

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
-- VERIFICATION QUERIES (Optional - to check setup)
-- ============================================

-- Check offers table exists
-- SELECT * FROM public.offers LIMIT 1;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'offers';

-- Check storage buckets exist
-- SELECT * FROM storage.buckets WHERE name IN ('menu-pdf', 'offers-images');

-- ============================================
-- SETUP CHECKLIST
-- ============================================
-- ✅ Run Parts 1-5 (offers table and policies)
-- ✅ Create Storage Bucket "menu-pdf" (public) in Dashboard
-- ✅ Run Part 6 (storage policies for menu)
-- ✅ Create Storage Bucket "offers-images" (public) in Dashboard
-- ✅ Run Part 7 (storage policies for offers images)
-- ✅ Create admin user in Authentication > Users
-- ✅ Update footer contact info in src/components/Footer.jsx
-- ✅ Run: npm install
-- ✅ Run: npm run dev
-- ============================================

