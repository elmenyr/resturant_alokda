# مطعم العقدة - Restaurant Website

موقع ويب كامل لمطعم العقدة مبني باستخدام React و Supabase.

## المميزات

- ✅ صفحات عامة: الرئيسية، القائمة، العروض
- ✅ إدارة القائمة: رفع واستبدال ملف PDF للقائمة
- ✅ إدارة العروض: إضافة، تعديل، وحذف العروض
- ✅ نظام المصادقة: تسجيل دخول للمسؤولين فقط
- ✅ أمان: Row Level Security (RLS) policies
- ✅ تصميم عربي متجاوب

## التقنيات المستخدمة

- **Frontend**: React 18, React Router, Vanilla CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Build Tool**: Vite

## التثبيت والتشغيل

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. إعداد Supabase

1. افتح ملف `supabase-setup.sql` في محرر SQL في Supabase Dashboard
2. قم بتنفيذ جميع الاستعلامات SQL
3. أنشئ Storage Bucket باسم `menu-pdf` (راجع التعليمات في ملف SQL)
4. قم بإعداد سياسات Storage (موجودة في ملف SQL)
5. أنشئ مستخدم مسؤول من خلال Authentication > Users

### 3. تشغيل المشروع

```bash
npm run dev
```

سيتم فتح الموقع على `http://localhost:3000`

### 4. بناء المشروع للإنتاج

```bash
npm run build
```

## هيكل المشروع

```
├── src/
│   ├── components/       # المكونات المشتركة
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── pages/           # الصفحات
│   │   ├── Home.jsx
│   │   ├── Menu.jsx
│   │   ├── Offers.jsx
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   ├── lib/             # الإعدادات
│   │   └── supabase.js
│   ├── App.jsx          # المكون الرئيسي
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── supabase-setup.sql   # استعلامات SQL لإعداد Supabase
├── package.json
└── vite.config.js
```

## الصفحات

- `/` - الصفحة الرئيسية
- `/menu` - عرض قائمة الطعام (PDF)
- `/offers` - عرض العروض الخاصة
- `/admin/login` - تسجيل دخول المسؤول
- `/admin/dashboard` - لوحة تحكم المسؤول

## الأمان

- Row Level Security (RLS) مفعل على جدول العروض
- المستخدمون العامون يمكنهم القراءة فقط
- المستخدمون المصادق عليهم فقط يمكنهم الإضافة/التعديل/الحذف
- سياسات Storage تمنع الوصول غير المصرح به

## ملاحظات

- تأكد من تحديث معلومات التواصل في `src/components/Footer.jsx`
- تأكد من أن Storage Bucket `menu-pdf` عام (public) لعرض ملفات PDF
- استخدم بيانات تسجيل الدخول التي أنشأتها في Supabase للوصول إلى لوحة التحكم

## الدعم

للمساعدة أو الاستفسارات، يرجى مراجعة ملف `supabase-setup.sql` للحصول على تعليمات الإعداد الكاملة.



