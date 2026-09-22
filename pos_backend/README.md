# پلتفرم مدیریت فروش و انبار POS — Backend (Django)

بک‌اند سامانه نگین رسا. تک‌شرکتی (single-tenant) پیاده‌سازی شده اما
ساختار Tenant از روز اول وجود دارد تا چندشرکتی‌شدن در آینده بدون
بازنویسی ممکن باشد.

## پیش‌نیاز

- Python 3.11+
- PostgreSQL 16 در حال اجرا

## نصب و اجرا

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1     # لینوکس/مک: source .venv/bin/activate
pip install -r requirements.txt

# دیتابیس بسازید (یک‌بار):
#   CREATE DATABASE pos_platform;

copy .env.example .env           # لینوکس/مک: cp .env.example .env
# در .env مقدار DB_PASSWORD را با رمز postgres خودتان عوض کنید

python manage.py migrate
python manage.py seed_demo       # داده نمونه: محصول، انبار، سریال، قرارداد
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

- پنل ادمین: `http://127.0.0.1:8000/admin/`
- ریشه API: `http://127.0.0.1:8000/api/`

## اجرای تست‌ها

```bash
python manage.py test
```

مهم‌ترین تست `test_parallel_reservations_never_oversell` است: ۲۰ درخواست
هم‌زمان برای ۱۰ دستگاه می‌فرستد و بررسی می‌کند که دقیقاً ۱۰ تا موفق شوند.

## اپلیکیشن‌ها

| اپ | محتوا |
|---|---|
| `tenants` | مدل Company — مرز Multi-tenancy |
| `users` | Custom User با احراز هویت ایمیلی، Role و اتصال به Tenant |
| `catalog` | Category، Brand، Product، ProductVariant |
| `inventory` | Warehouse، InventoryItem، DeviceSerial، InventoryLedger + سرویس‌های اتمیک |
| `contracts` | مدل حداقلی قرارداد |

## قواعد معماری که باید رعایت شوند

1. **قیمت و موجودی فقط روی `ProductVariant` است، نه `Product`.**
   `Product` صرفاً گروه‌بندی نمایشی است.

2. **هیچ‌جا `on_hand` یا `reserved` را مستقیم تغییر ندهید.**
   همه تغییرات باید از `apps/inventory/services.py` عبور کنند تا قفل
   ردیف، ثبت در دفتر موجودی و سازگاری سریال‌ها تضمین شود.

3. **مقادیر پولی همیشه `DecimalField`** — استفاده از `FloatField` ممنوع.

4. **`InventoryLedger` فقط افزودنی است.** در ادمین هم امکان افزودن،
   ویرایش و حذف آن بسته شده است.

5. قید `CHECK (reserved <= on_hand)` در سطح دیتابیس آخرین سد جلوگیری از
   Overselling است و نباید حذف شود.

## API

```
GET  /api/products/            محصولات + نسخه‌ها + موجودی قابل فروش
GET  /api/variants/            فهرست تخت نسخه‌ها
GET  /api/categories/  /brands/
GET  /api/warehouses/
GET  /api/inventory/           ?warehouse=<id>  ?low_stock=true
GET  /api/serials/             ?status=in_stock ?warehouse=<id>
GET  /api/inventory-ledger/
GET  /api/contracts/

POST /api/inventory/reserve/   {"warehouse":1,"variant":3,"quantity":2,"reference":"ORD-1"}
POST /api/inventory/release/   همان بدنه
POST /api/inventory/issue/     همان بدنه
```

## کارهای باقی‌مانده (فاز بعد)

- ماژول سفارش: `Order` → `OrderItem` با اتصال به `reserve_stock`
- موتور قیمت‌گذاری: نرخ ارز، تخفیف، مالیات ۱۰٪ و Snapshot در پیش‌فاکتور
- احراز هویت: API فعلاً `AllowAny` است چون فرانت صفحه Login ندارد.
  پس از ساخت لاگین باید به `IsAuthenticated` تغییر کند و ViewSetها بر
  اساس `request.tenant` فیلتر شوند.
