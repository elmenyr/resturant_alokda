# تعليمات إصلاح خطأ "new row violates row-level security policy"

## المشكلة
عند محاولة رفع صورة للعروض، يظهر خطأ: `new row violates row-level security policy`

## الحل

### الخطوة 1: إنشاء Storage Bucket للصور

1. اذهب إلى **Supabase Dashboard**
2. اضغط على **Storage** من القائمة الجانبية
3. اضغط على **"New bucket"**
4. أدخل المعلومات التالية:
   - **Name**: `offers-images`
   - **Public bucket**: ✅ **نعم (YES)** - هذا مهم جداً!
5. اضغط **"Create bucket"**

### الخطوة 2: تشغيل SQL Policies

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. افتح ملف `supabase-fix-storage-policies.sql`
3. انسخ كل الكود والصقه في SQL Editor
4. اضغط **"Run"** أو **"Run all"**

أو انسخ هذا الكود مباشرة:

```sql
-- Delete existing policies if any
DROP POLICY IF EXISTS "Allow public read access to offer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload offer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete offer images" ON storage.objects;

-- Create new policies for offers-images bucket
CREATE POLICY "Allow public read access to offer images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'offers-images');

CREATE POLICY "Allow authenticated users to upload offer images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'offers-images');

CREATE POLICY "Allow authenticated users to update offer images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'offers-images')
WITH CHECK (bucket_id = 'offers-images');

CREATE POLICY "Allow authenticated users to delete offer images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'offers-images');
```

### الخطوة 3: التحقق من الإعداد

شغّل هذا الاستعلام للتحقق:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'offers-images';

-- Check if policies exist
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%offer%';
```

### الخطوة 4: التحقق من أنك مسجل دخول

- تأكد من تسجيل الدخول كمسؤول في الموقع
- جرب تسجيل الخروج والدخول مرة أخرى

## ملاحظات مهمة

1. ✅ **Bucket يجب أن يكون Public** - هذا ضروري لعرض الصور
2. ✅ **يجب تشغيل SQL Policies** - بدونها لن تتمكن من رفع الصور
3. ✅ **يجب أن تكون مسجل دخول** - فقط المستخدمون المصادق عليهم يمكنهم الرفع

## إذا استمرت المشكلة

1. تحقق من أن Bucket موجود و Public:
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE name = 'offers-images';
   ```
   يجب أن يكون `public = true`

2. تحقق من Policies:
   ```sql
   SELECT policyname, cmd, roles FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

3. تأكد من تسجيل الدخول:
   - افتح Console في المتصفح (F12)
   - اكتب: `localStorage.getItem('sb-bcihwbulbwajxoxmgqmy-auth-token')`
   - إذا كان `null`، يجب تسجيل الدخول

