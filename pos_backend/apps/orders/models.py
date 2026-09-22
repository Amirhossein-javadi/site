"""
سفارش‌ها.

طراحی ساده نگه داشته شده چون فعلاً تک‌شرکتی هستیم: هر سفارش مستقیماً
OrderItem دارد، بدون لایه میانی SubOrder. اگر روزی چند تأمین‌کننده
واقعی اضافه شد، آن‌وقت SubOrder بین Order و OrderItem اضافه می‌شود —
نه زودتر، چون الان چیزی آن پیچیدگی را توجیه نمی‌کند.

دو قانون کسب‌وکاری که این ماژول اجرا می‌کند (طبق سند اولیه):
1. بدون قرارداد فعال، ثبت سفارش ممنوع است.
2. سقف خرید قرارداد (تعداد دستگاه) نباید رد شود.
"""

from django.conf import settings
from django.db import models


class Order(models.Model):
    """
    سفارش یک نماینده تحت یک قرارداد مشخص.

    stock_issued_at پر می‌شود وقتی سفارش ارسال (SHIPPED) شده و کالا واقعاً
    از انبار خارج شده — از آن لحظه به بعد، لغو سفارش دیگر مجاز نیست
    (باید از مسیر مرجوعی برود که در فاز بعد ساخته می‌شود).
    """

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        CONFIRMED = "confirmed", "تایید شده"
        PROCESSING = "processing", "در حال آماده‌سازی"
        SHIPPED = "shipped", "ارسال شده"
        DELIVERED = "delivered", "تحویل شده"
        CANCELLED = "cancelled", "لغو شده"

    # وضعیت‌هایی که هنوز می‌شود سفارش را لغو کرد (کالا هنوز از انبار خارج نشده)
    CANCELLABLE_STATUSES = {Status.PENDING, Status.CONFIRMED, Status.PROCESSING}

    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.CASCADE,
        related_name="orders",
        verbose_name="شرکت (Tenant)",
    )
    order_number = models.CharField(
        max_length=30, unique=True, verbose_name="شماره سفارش"
    )
    contract = models.ForeignKey(
        "contracts.Contract",
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="قرارداد",
        help_text="سفارش فقط تحت یک قرارداد فعال قابل ثبت است.",
    )
    warehouse = models.ForeignKey(
        "inventory.Warehouse",
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="انبار مبدا",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        verbose_name="وضعیت",
    )
    notes = models.TextField(blank=True, verbose_name="یادداشت")
    stock_issued_at = models.DateTimeField(
        null=True, blank=True, verbose_name="زمان خروج قطعی کالا از انبار"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_created",
        verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    @property
    def is_cancellable(self):
        return self.status in self.CANCELLABLE_STATUSES


class OrderItem(models.Model):
    """
    ردیف کالای سفارش.

    unit_price/currency در لحظه ثبت سفارش از ProductVariant کپی می‌شوند —
    یک Snapshot سبک. Snapshot رسمی و کامل (همراه نرخ ارز و مالیات) در
    ProformaInvoiceLine ثبت می‌شود، نه اینجا. این‌جا فقط یادمان می‌ماند
    «وقتی سفارش ثبت شد، قیمت چند بود».
    """

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="سفارش"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="نسخه محصول",
    )
    quantity = models.PositiveIntegerField(verbose_name="تعداد")
    unit_price = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="قیمت واحد (لحظه ثبت سفارش)"
    )
    currency = models.CharField(max_length=3, verbose_name="واحد ارز")

    class Meta:
        verbose_name = "ردیف سفارش"
        verbose_name_plural = "ردیف‌های سفارش"

    def __str__(self):
        return f"{self.variant.sku} × {self.quantity}"


class OrderStatusHistory(models.Model):
    """
    تاریخچه تغییر وضعیت سفارش — append-only، برای پاسخ به «کی، چرا، توسط
    چه کسی» وضعیت سفارش عوض شده.
    """

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history"
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    note = models.CharField(max_length=255, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تاریخچه وضعیت سفارش"
        verbose_name_plural = "تاریخچه وضعیت سفارش‌ها"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status} → {self.to_status}"
