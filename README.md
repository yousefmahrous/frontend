# Book Haven AR

ابنِ لي واجهة أمامية كاملة لمتجر/مكتبة كتب إلكتروني (Online Bookstore) باللغة العربية واتجاه RTL بالكامل، باستخدام React + Vite + Tailwind CSS + shadcn/ui + React Router + Axios (أو fetch) + React Query (TanStack Query) لإدارة حالة السيرفر + Socket.io-client للتحديث اللحظي.

الباك إند جاهز وشغال ومبني بـ Express + Prisma + Redis + Socket.io، ومصمم أصلاً كنظام إدارة عناصر (اسمه الأصلي "students/bookings") وتم تحويله مفاهيميًا لمتجر كتب. اربط كل الواجهات بالـ APIs الحقيقية دي بالضبط زي ما هي تحت، من غير ما تخترع أي endpoint إضافي.

=====================================================

1) إعدادات الاتصال العامة بالـ Backend

=====================================================

- Base URL: استخدمه من environment variable باسم VITE_API_URL (مثال قيمة افتراضية: http://localhost:3000/api/v1)

- كل الـ APIs تحت prefix: /api/v1

- الـ Authentication قائم على Session Cookie (اسم الكوكي: sessionId) مش JWT. لازم كل طلب يبعت الكوكيز:

  - لو Axios: خلي withCredentials: true بشكل افتراضي في instance واحدة مشتركة

  - لو fetch: خلي credentials: 'include' في كل استدعاء

- الردود بتيجي دايمًا JSON، ورسائل الأخطاء والنجاح بالعربي جاهزة من السيرفر (اعرضها زي ما هي في toast/alert، من غير ما تعيد صياغتها)

- عند أي رد بحالة 401 من أي API محمي: يوجّه المستخدم تلقائيًا لصفحة تسجيل الدخول ويمسح حالة المستخدم من الـ state

- عند 403: اعرض رسالة "غير مصرح لك" بدون توجيه لصفحة تانية (يفيد في حالة يوزر عادي بيحاول يدخل صفحات الأدمن)

=====================================================

2) Auth APIs (جاهزة، مفيش داعي لتغيير أسمائها)

=====================================================

POST /auth/signup

Body: { "name": string (3 أحرف على الأقل), "email": string, "password": string (6 أحرف على الأقل) }

Response 201: { "message": string, "user": {...} }

Response 400: { "message": string } أو { "errors": [...] } (Zod validation errors)

ملاحظة: فيه rate limiter على الإندبوينت ده، لازم الواجهة تتعامل بشكل لطيف مع رسالة "طلبات كتير" لو رجعت

POST /auth/login

Body: { "email": string, "password": string }

Response 200: { "message": string, "user": { "id", "name", "email", "role" } }

role ممكن تكون "student" أو "admin" — تعامل معاها في الفرونت كـ "customer" و "admin"

بعد النجاح: خزّن بيانات اليوزر في Context/Store (مش localStorage للتوكن لأنه مفيش توكن، الاعتماد على الكوكي، بس ممكن تخزن بيانات العرض بس)

POST /auth/logout

بدون body، بيمسح السيشن والكوكي

GET /auth/me

محمي (لازم يكون فيه سيشن سارية)

Response 200: { "success": true, "user": { id, name, email, role } }

استخدمها عند تحميل التطبيق (App bootstrap) عشان تعرف هل فيه يوزر مسجل دخول ولا لأ، واعمل بيها useQuery مرة واحدة على مستوى الـ App

POST /auth/forgot-password

Body: { "email": string }

Response 200: رسالة عامة (سواء الإيميل موجود أو لأ لأسباب أمنية)

POST /auth/reset-password

Body: { "token": string, "newPassword": string }

التوكن بييجي من رابط في الإيميل بالشكل: /reset-password?token=xxxx — اعمل صفحة بتاخد الـ token من query params

POST /auth/change-password

محمي، Body: { "oldPassword": string, "newPassword": string }

بعد النجاح بيتم إنهاء السيشن تلقائيًا من السيرفر، لازم الفرونت يوجّه اليوزر لصفحة اللوجين فورًا مع رسالة "غيّرت كلمة المرور، سجّل دخول تاني"

=====================================================

3) Books APIs (الاسم الأصلي كان /students — استخدم [books] أو أي اسم هتأكده لي، خليه في متغير واحد سهل التغيير)

=====================================================

كل الإندبوينتس دي محمية (لازم تسجيل دخول)، وعمليات الإضافة/التعديل/الحذف للأدمن بس (role === "admin")

GET [/books]?page=1&limit=10&search=كلمة

Response 200:

{

  "success": true,

  "data": {

    "users": [ ...array of book objects... ],   // لاحظ اسم المفتاح users من الباك الأصلي، لو اتغير خليه data.items أو زي ما هيتفق عليه

    "pagination": {

      "totalCount": number,

      "totalPages": number,

      "currentPage": number,

      "limit": number,

      "hasNextPage": boolean,

      "hasPreviousPage": boolean

    }

  }

}

اعمل بيها صفحة "الكتالوج/تصفح الكتب" بـ pagination حقيقي (أزرار تالي/سابق + أرقام صفحات) + خانة بحث بتستخدم debounce (بحث بعد ما اليوزر يوقف عن الكتابة بـ 400ms) وتبعت query param search

GET [/books]/:id

Response 200: { "success": true, "data": { "user": {...book} } }

Response 404: { "message": "غير موجود" }

استخدمها في صفحة تفاصيل الكتاب

POST [/books]  (أدمن فقط)

Body (الماپينج النهائي المتفق عليه — استخدم أسماء الحقول دي بالظبط في الـ request، وأسماء العرض دي في الـ UI):

{

  "name": string,          // = عنوان الكتاب — label في الفورم: "عنوان الكتاب" — 3 أحرف على الأقل

  "number": string,        // = ISBN — label: "الرقم الدولي المعياري (ISBN)" — كان فيه validation رقم موبايل مصري، هيتغير على الباك إند لصيغة ISBN (شوف قسم "تعديلات مطلوبة على الباك إند" تحت)

  "email": string,         // = إيميل الناشر/المورد — label: "إيميل الناشر"

  "adress": string,        // = وصف الكتاب — label: "وصف الكتاب" — 5 أحرف على الأقل

  "centre": string,        // = دار النشر — label: "دار النشر" — حرفين على الأقل

  "grade": enum,           // = تصنيف الكتاب — label: "التصنيف" — القيم النهائية: "روايات" | "علمي" | "تاريخي" | "أطفال"

  "avatar_key": string | null  // = مفتاح صورة الغلاف الراجع من إندبوينت الرفع

}

Response 201: { "success": true, "message": "تمت الإضافة بنجاح" }

Response 400: { "success": false, "errors": {...} } أو { "message": "الايميل مكرر" }

ابنِ الفورم والـ validation schema (Zod) في الفرونت بنفس الأسماء بالظبط دي (name, number, email, adress, centre, grade, avatar_key) لأنها هي اللي الباك إند فعليًا بيستقبلها، بس الـ labels والـ placeholders في الواجهة اكتبها بمسمياتها الجديدة (عنوان، ISBN، الناشر، الوصف، دار النشر، التصنيف). خلي الفورم schema في ملف واحد منعزل (schemas/book.schema.ts) لسهولة أي تعديل مستقبلي.

Select التصنيف (grade) خليه Dropdown بـ 4 خيارات بس بالترتيب ده: "روايات", "علمي", "تاريخي", "أطفال" — من غير أي خيار خامس.

PUT [/books]/:id  (أدمن فقط)

نفس Body بتاع الإضافة تقريبًا (تأكد من endpoint التعديل الفعلي هل بياخد كل الحقول ولا حقول محددة زي الاسم والإيميل بس — النسخة الحالية من الباك بتقبل تعديل جزئي، جهّز الفورم يبعت كل الحقول المتاحة)

Response 200: { "success": true, "message": "تم التعديل بنجاح" }

DELETE [/books]/:id  (أدمن فقط)

Response 200: { "success": true, "message": "تم الحذف بنجاح" }

اعرض Confirmation Dialog قبل الحذف

=====================================================

4) رفع صورة الغلاف (Upload API)

=====================================================

GET /upload?fileName=xxx.jpg&fileType=image/jpeg

Response 200: { "success": true, "data": { presignedUrl أو uploadUrl, key, ... } }  // اعرض شكل الرد بالظبط زي ما بيرجع وتعامل معاه ديناميكيًا

خطوات الرفع (Two-step upload):

1. الفرونت يبعت GET /upload بالاسم ونوع الملف قبل ما يبعت أي حاجة للسيرفر الرئيسي

2. ياخد presignedUrl ويعمل PUT مباشر للملف نفسه على الرابط ده (Amazon S3)، مش على باك إندك

3. بعد نجاح الرفع، ياخد الـ key الراجع ويبعته كـ avatar_key (أو cover_key) في فورم إضافة/تعديل الكتاب

اعمل الخطوات دي جوه component واحد لرفع الصورة (Dropzone / input file) مع preview وProgress bar وError handling لو فشل الرفع لأي سبب.

=====================================================

5) تحديث لحظي (Socket.io)

=====================================================

اتصل بنفس الـ Base URL (بدون /api/v1) عبر socket.io-client

استمع للحدث: students_list_updated (هيتغير اسمه لاحقًا لحاجة زي books_updated)

لما الحدث ده يوصل: اعمل invalidateQueries لكويري قائمة الكتب (React Query) عشان القائمة تتحدث لايف عند أي زائر لصفحة الكتالوج من غير ريفرش، خصوصًا مفيدة لو فيه أكتر من أدمن بيضيفوا كتب في نفس الوقت

=====================================================

6) الصفحات والمكونات المطلوبة

=====================================================

صفحات عامة (بدون تسجيل دخول):

- / الصفحة الرئيسية: هيرو سكشن لمتجر الكتب + عرض أحدث/أشهر الكتب (Grid Cards) + رابط لصفحة الكتالوج

- /books صفحة الكتالوج: Grid من كروت الكتب (صورة الغلاف، العنوان، السعر لو موجود لاحقًا) + خانة بحث + Pagination + فلترة حسب التصنيف (grade/category)

- /books/:id صفحة تفاصيل الكتاب الواحد

- /login تسجيل الدخول

- /signup إنشاء حساب

- /forgot-password نسيت كلمة المرور

- /reset-password استرجاع كلمة المرور (بتاخد token من الرابط)

صفحات محمية (لازم تسجيل دخول):

- /account/change-password تغيير كلمة المرور

- /account بيانات الحساب (name, email, role)

لوحة تحكم الأدمن (محمية + role === admin بس، لو يوزر عادي حاول يدخلها اعمل Redirect لصفحة "غير مصرح"):

- /admin/books جدول بكل الكتب مع بحث وpagination وأزرار تعديل/حذف

- /admin/books/new فورم إضافة كتاب جديد (مع رفع صورة الغلاف)

- /admin/books/:id/edit فورم تعديل كتاب

مكونات مشتركة:

- Navbar فيها حالة تسجيل الدخول (لو مسجل: اسم اليوزر + Dropdown فيه "حسابي"/"تسجيل خروج"، ولو أدمن زر إضافي "لوحة التحكم". لو مش مسجل: أزرار "دخول"/"إنشاء حساب")

- Protected Route wrapper بيستخدم نتيجة GET /auth/me

- Admin Route wrapper بيتأكد من role

- Loading skeletons لكل عملية fetch

- Toast notifications للنجاح/الخطأ (استخدم رسائل السيرفر العربية زي ما هي)

- Empty states (مفيش نتائج بحث / مفيش كتب لسه)

=====================================================

7) التصميم

=====================================================

- تصميم عصري لمتجر كتب: ألوان دافئة (بيج/بني فاتح/كحلي غامق) بدل الألوان الافتراضية الزرقاء التقليدية، خط عربي واضح (Cairo أو Tajawal من Google Fonts)

- اتجاه الصفحة كله RTL بشكل كامل (بما فيها الأيقونات والـ spacing والـ dropdowns)

- كروت الكتب بظل خفيف وhover effect بسيط، صورة الغلاف بنسبة عرض/ارتفاع كتاب (مش مربعة)

- تصميم متجاوب بالكامل (Mobile-first)، خصوصًا صفحة الكتالوج والداشبورد

=====================================================

8) التعامل مع الأخطاء والحالات الحدّية

=====================================================

- Rate limit errors (429) على login/signup/forgot-password: اعرض رسالة واضحة "حاول تاني بعد شوية"

- أخطاء Validation ترجع كـ array أو object من Zod: اعرضها تحت كل حقل في الفورم مش toast عام

- لو الـ API الرئيسي مش راجع رد (network error): اعرض رسالة "تعذر الاتصال بالسيرفر" مع زرار إعادة المحاولة

ابنِ الكود منظم في مجلدات: /api (كل استدعاءات الباك إند في ملفات منفصلة حسب الموضوع: auth.api.ts, books.api.ts, upload.api.ts)، /hooks (custom hooks زي useAuth, useBooks)، /pages، /components، /schemas (validation)، /context أو /store لحالة اليوزر.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bookhaven-arabic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0be9417a-ab78-4442-96a8-53923e6fda8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
