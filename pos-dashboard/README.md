# سامانه فروش و انبار — Frontend (React + Vite)

رابط کاربری فارسی/RTL متصل به بک‌اند جنگو.

## اجرا

```powershell
npm install
copy .env.example .env      # لینوکس/مک: cp .env.example .env
npm run dev
```

روی `http://localhost:5173` باز می‌شود. **بک‌اند باید هم‌زمان روی
`http://localhost:8000` در حال اجرا باشد.**

## صفحات

| مسیر | وضعیت |
|---|---|
| `/` داشبورد | متصل — آمار واقعی از API |
| `/products` محصولات | متصل — کاتالوگ با قیمت و موجودی |
| `/inventory` موجودی و سریال | متصل — دو تب: موجودی انبار و سریال دستگاه‌ها |
| `/contracts` قراردادها | متصل |
| بقیه آیتم‌های منو | StubPage — در انتظار ساخت API |

## ساختار

- `src/layout/` — Sidebar، Topbar، Layout
- `src/pages/` — یک فایل به ازای هر صفحه
- `src/components/ui.jsx` — Card، Badge، DataTable، Skeleton، EmptyState و…
- `src/lib/api.js` — کلاینت متمرکز API؛ آدرس از `VITE_API_BASE_URL`
- `src/lib/hooks.js` — هوک `useApi` و توابع قالب‌بندی عدد/مبلغ/تاریخ

## نکته

منطق کسب‌وکار (محاسبه موجودی قابل فروش، اعتبارسنجی رزرو، قیمت) همه در
بک‌اند است. فرانت فقط نمایش‌دهنده است — این قاعده را نشکنید.
