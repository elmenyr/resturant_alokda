# دليل الإعداد الكامل - Complete Setup Guide

## خطوات الإعداد السريع / Quick Setup Steps

### 1. تثبيت المتطلبات / Install Dependencies

```bash
npm install
```

### 2. إعداد Supabase Database / Setup Supabase Database

#### أ) إنشاء جدول العروض / Create Offers Table

افتح Supabase Dashboard > SQL Editor وقم بتشغيل الاستعلامات التالية من ملف `supabase-setup.sql`:

```sql
-- إنشاء جدول العروض
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تفعيل Row Level Security
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Allow public read access to offers"
ON public.offers FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated users to insert offers"
ON public.offers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update offers"
ON public.offers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete offers"
ON public.offers FOR DELETE TO authenticated USING (true);

-- دالة تحديث الوقت تلقائياً
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

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_title ON public.offers(title);
```

#### ب) إنشاء Storage Bucket / Create Storage Bucket

1. اذهب إلى **Storage** في Supabase Dashboard
2. اضغط على **"New bucket"**
3. الاسم: `menu-pdf`
4. **Public bucket**: ✅ نعم (YES)
5. اضغط **"Create bucket"**

#### ج) إعداد Storage Policies / Setup Storage Policies

بعد إنشاء الـ bucket، قم بتشغيل هذه الاستعلامات في SQL Editor:

```sql
-- السماح للعامة بقراءة ملفات PDF
CREATE POLICY "Allow public read access to menu PDFs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-pdf');

-- السماح للمستخدمين المصادق عليهم برفع ملفات PDF
CREATE POLICY "Allow authenticated users to upload menu PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-pdf');

-- السماح للمستخدمين المصادق عليهم بحذف ملفات PDF
CREATE POLICY "Allow authenticated users to delete menu PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-pdf');
```

### 3. إنشاء مستخدم مسؤول / Create Admin User

1. اذهب إلى **Authentication > Users**
2. اضغط على **"Add user"** > **"Create new user"**
3. أدخل البريد الإلكتروني وكلمة المرور
4. احفظ بيانات الدخول بشكل آمن

### 4. تشغيل المشروع / Run the Project

```bash
npm run dev
```

سيتم فتح الموقع على `http://localhost:3000`

## التحقق من الإعداد / Verify Setup

قم بتشغيل هذه الاستعلامات للتحقق:

```sql
-- التحقق من جدول العروض
SELECT * FROM public.offers LIMIT 1;

-- التحقق من سياسات RLS
SELECT * FROM pg_policies WHERE tablename = 'offers';

-- التحقق من Storage Bucket
SELECT * FROM storage.buckets WHERE name = 'menu-pdf';
```

## ملاحظات مهمة / Important Notes

1. ✅ تأكد من تفعيل RLS على جدول العروض
2. ✅ Storage Bucket يجب أن يكون عام (public) لعرض ملفات PDF
3. ✅ فقط المستخدمون المصادق عليهم يمكنهم إدارة العروض ورفع القائمة
4. ✅ المستخدمون العامون يمكنهم فقط القراءة والمشاهدة
5. ⚠️ قم بتحديث معلومات التواصل في `src/components/Footer.jsx`

## استكشاف الأخطاء / Troubleshooting

### المشكلة: لا يمكن رفع ملف PDF
- تأكد من أن Storage Bucket `menu-pdf` موجود وعام (public)
- تأكد من تطبيق Storage Policies بشكل صحيح

### المشكلة: لا يمكن إضافة عروض
- تأكد من تسجيل الدخول كمسؤول
- تأكد من تطبيق RLS Policies بشكل صحيح
- تحقق من أن جدول `offers` موجود

### المشكلة: لا تظهر العروض للعامة
- تأكد من وجود Policy للقراءة العامة
- تحقق من أن RLS مفعل

## الدعم / Support

للمزيد من المساعدة، راجع ملف `supabase-setup.sql` الكامل.



