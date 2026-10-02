# پلتفرم مدیریت فروش و انبار POS — Backend (Django)

بک‌اند سامانه نگین رسا. تک‌شرکتی (single-tenant) پیاده‌سازی شده اما
ساختار Tenant از روز اول وجود دارد تا چندشرکتی‌شدن در آینده بدون
بازنویسی ممکن باشد.

## پیش‌نیاز

- Python 3.11+
- برای توسعه محلی: چیز دیگری لازم نیست (SQLite پیش‌فرض است)
- برای همزمانی واقعی: PostgreSQL 16 (پایین‌تر توضیح داده شده)

## نصب و اجرا

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env

python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

- پنل ادمین: `http://127.0.0.1:8000/admin/`
- ریشه API: `http://127.0.0.1:8000/api/`
- ورود و گرفتن توکن: `POST /api/login/` با `username` (همان ایمیل) و `password`

## ⚠️ نکته حیاتی درباره دیتابیس

`DB_ENGINE` در `.env` بین دو حالت سوییچ می‌کند:

| مقدار | کِی استفاده شود |
|---|---|
| `sqlite` (پیش‌فرض) | توسعه محلی روزمره — نصب و راه‌اندازی صفر است |
| `postgres` | هر جا **همزمانی واقعی** مهم است: تست بار، staging، production |

**چرا این فرق مهم است:** هسته ماژول انبار (`apps/inventory/services.py`)
با `select_for_update()` قفل ردیف می‌گیرد تا وقتی دو سفارش هم‌زمان آخرین
دستگاه موجود را می‌خواهند، فقط یکی موفق شود (نه Overselling). این روی
PostgreSQL واقعاً کار می‌کند و با یک تست ۲۰ Thread همزمان اثبات شده
(`apps/inventory/tests.py`). **روی SQLite این قفل واقعی نیست** — SQLite
کل فایل را قفل می‌کند، نه فقط یک ردیف، و زیر بار همزمان با خطای
`database is locked` شکست می‌خورد. همان تست وقتی `DB_ENGINE=sqlite`
باشد به‌طور خودکار Skip می‌شود (نه Fail) — چون واقعاً چیزی برای اثبات
روی این بک‌اند نیست.

نتیجه عملی: با SQLite همه‌چیز برای توسعه تک‌کاربره درست کار می‌کند.
**قبل از هر تست بار واقعی یا هر جایی که بیش از یک کاربر هم‌زمان سفارش
می‌دهد، `DB_ENGINE=postgres` کنید.**

## اجرای تست‌ها

```bash
python manage.py test
```

۴۰ تست؛ با `DB_ENGINE=sqlite` یکی از آن‌ها (تست همزمانی) Skip می‌شود —
طبیعی است، بالا توضیح داده شد.

## اپلیکیشن‌ها

| اپ | محتوا |
|---|---|
| `tenants` | مدل Company — مرز Multi-tenancy |
| `users` | Custom User با احراز هویت ایمیلی، Role و اتصال به Tenant |
| `catalog` | Category، Brand، Product، ProductVariant |
| `inventory` | Warehouse، InventoryItem، DeviceSerial، InventoryLedger + سرویس‌های اتمیک |
| `contracts` | قرارداد نمایندگان + بررسی اعتبار (`is_valid_for_ordering`) |
| `orders` | Order، OrderItem، OrderStatusHistory + ماشین‌حالت وضعیت |
| `orders.fulfillment` | رهگیری Shipment، درخواست مرجوعی، تأیید و دریافت امن کالا |
| `pricing` | ExchangeRate + ProformaInvoice تغییرناپذیر (Snapshot) |
| `payments` | Payment با Idempotency + انتزاع درگاه (`gateways.py`) |
| `finance` | دفتر مالی هر قرارداد (بدهکار/بستانکار) |
| `suppliers` | تامین‌کنندگان شرکت و زمان تحویل |
| `customers` | فهرست شرکت‌های نماینده و وضعیت قراردادها |

## مسیر کامل یک سفارش

```
1. POST /api/orders/                       ثبت سفارش (رزرو خودکار موجودی)
2. POST /api/proforma-invoices/issue/      صدور پیش‌فاکتور (Snapshot قیمت+ارز+مالیات)
3. POST /api/payments/create/              شروع پرداخت (Idempotent)
4. POST /api/payments/{id}/verify/         تایید پرداخت → سفارش خودکار Confirm می‌شود
5. POST /api/orders/{id}/transition/       PROCESSING → SHIPPED (کالا واقعاً از انبار خارج می‌شود)
```

نمونه بدنه درخواست‌ها را در انتهای این فایل ببینید.

## قواعد معماری که باید رعایت شوند

1. **قیمت و موجودی فقط روی `ProductVariant` است، نه `Product`.**
2. **هیچ‌جا `on_hand`/`reserved` را مستقیم دست نزنید** — فقط از طریق `apps/inventory/services.py`.
3. **مقادیر پولی همیشه `DecimalField`** — هرگز `FloatField` یا `int()`.
4. **`InventoryLedger` و `ProformaInvoice`/`ProformaInvoiceLine` فقط افزودنی‌اند** — در ادمین قفل شده‌اند.
5. **ثبت سفارش بدون قرارداد فعال ممنوع است** (`Contract.is_valid_for_ordering`).
6. **سقف دستگاه قرارداد باید رعایت شود** — `apps/orders/services._validate_device_cap`.
7. هر View که مسیر دستی (نه CRUD استاندارد) دارد را در `urls.py` **قبل از** `router.urls` بگذارید — وگرنه الگوی `<pk>` روتر آن را می‌بلعد (این باگ واقعی رخ داد و در `apps/pricing/urls.py` و `apps/payments/urls.py` مستند شده).

## API — فهرست کامل Endpointها

```
POST /api/login/                              ورود (Token)

GET  /api/products/  /variants/  /categories/  /brands/
GET  /api/warehouses/
GET  /api/inventory/          ?warehouse=  ?low_stock=true
GET  /api/serials/            ?status=  ?warehouse=
GET  /api/inventory-ledger/
POST /api/inventory/receive/  /reserve/  /release/  /issue/

GET  /api/contracts/
GET/POST       /api/suppliers/          ?search=  ?status=active|suspended
GET/PATCH/PUT/DELETE /api/suppliers/{id}/
GET/POST       /api/customers/          ?search=  ?is_active=true|false
GET/PATCH/PUT/DELETE /api/customers/{id}/
GET  /api/orders/             ?status=  ?contract=
POST /api/orders/
POST /api/orders/{id}/cancel/
POST /api/orders/{id}/transition/   {"to_status": "confirmed"}
GET /api/shipments/                فهرست مرسوله‌ها
GET/PATCH /api/shipments/{id}/     مشاهده/ویرایش اطلاعات رهگیری
POST /api/shipments/{id}/deliver/  ثبت تحویل و تغییر وضعیت سفارش
GET/POST /api/returns/             ایجاد و پیگیری درخواست مرجوعی
POST /api/returns/{id}/approve/    تأیید درخواست مرجوعی
POST /api/returns/{id}/reject/     رد درخواست مرجوعی
POST /api/returns/{id}/receive/    دریافت کالا و ثبت ورود مجدد موجودی سالم

GET  /api/exchange-rates/
GET  /api/proforma-invoices/       ?order=<id>
POST /api/proforma-invoices/issue/  {"order": <id>}

GET  /api/payments/                ?proforma=<id>  ?order=<id>
POST /api/payments/create/    {"proforma": <id>, "idempotency_key": "..."}
POST /api/payments/{id}/verify/     {"outcome": "success"}

GET  /api/finance/ledger/     ?contract=
GET  /api/finance/ledger/export/  ?contract=  ?from_date=YYYY-MM-DD  ?to_date=YYYY-MM-DD
GET  /api/finance/balance/    ?contract=
```

تمام endpointهای API به توکن ورود نیاز دارند و queryهای وابسته به شرکت به
Tenant کاربر محدود می‌شوند. گروه‌های کالا و برندها و نرخ ارز داده‌های مشترک
سامانه‌اند. پیش‌فاکتور و دفترهای مالی و انبار فقط از مسیر سرویس‌های
افزودنی‌شان تغییر می‌کنند.

## موارد بیرون از این فاز

- درگاه واقعی پرداخت (`apps/payments/gateways.py` — فقط یک کلاس جدید
  اضافه کنید، services.py و views.py دست نمی‌خورند).
- تسویه نقدی مرجوعی؛ درگاه فعلی Mock است و دریافت مرجوعی فقط موجودی/رهگیری
  انبار را ثبت می‌کند.

خروجی CSV دفتر مالی در `/api/finance/ledger/export/` موجود است. فیلترهای
`contract`، `from_date` و `to_date` با فهرست دفتر یکسان‌اند؛ بازه تاریخ
شامل هر دو روز ابتدا و انتهاست. فایل UTF-8 با BOM ساخته می‌شود تا متن
فارسی در Excel درست نمایش داده شود.
