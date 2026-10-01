import uuid

from django.conf import settings
from django.db import models

class Order(models.Model):
    # کدهای قبلی Order بدون تغییر باقی می‌ماند...
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        CONFIRMED = "confirmed", "تایید شده"
        PROCESSING = "processing", "در حال آماده‌سازی"
        SHIPPED = "shipped", "ارسال شده"
        DELIVERED = "delivered", "تحویل شده"
        CANCELLED = "cancelled", "لغو شده"

    CANCELLABLE_STATUSES = {Status.PENDING, Status.CONFIRMED, Status.PROCESSING}

    tenant = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, related_name="orders", verbose_name="شرکت (Tenant)")
    order_number = models.CharField(max_length=30, unique=True, verbose_name="شماره سفارش")
    contract = models.ForeignKey("contracts.Contract", on_delete=models.PROTECT, related_name="orders", verbose_name="قرارداد", help_text="سفارش فقط تحت یک قرارداد فعال قابل ثبت است.")
    warehouse = models.ForeignKey("inventory.Warehouse", on_delete=models.PROTECT, related_name="orders", verbose_name="انبار مبدا")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True, verbose_name="وضعیت")
    notes = models.TextField(blank=True, verbose_name="یادداشت")
    stock_issued_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان خروج قطعی کالا از انبار")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders_created", verbose_name="ثبت‌کننده")
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
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="سفارش"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.PROTECT, related_name="order_items", verbose_name="نسخه محصول"
    )
    
    # فیلد جدید اضافه شده است
    agent = models.ForeignKey(
        "tenants.AgentCompany", on_delete=models.PROTECT, related_name="order_items", verbose_name="شرکت نماینده",
        null=True, blank=True
    )
    
    quantity = models.PositiveIntegerField(verbose_name="تعداد")
    unit_price = models.DecimalField(max_digits=20, decimal_places=4, verbose_name="قیمت واحد (لحظه ثبت سفارش)")
    currency = models.CharField(max_length=3, verbose_name="واحد ارز")
    serial_numbers = models.JSONField(
        default=list,
        blank=True,
        verbose_name="سریال‌های تخصیص‌یافته",
        help_text="Snapshot سریال‌های رزروشده برای رهگیری دقیق ارسال و مرجوعی.",
    )

    class Meta:
        verbose_name = "ردیف سفارش"
        verbose_name_plural = "ردیف‌های سفارش"

    def __str__(self):
        return f"{self.variant.sku} × {self.quantity}"

class OrderStatusHistory(models.Model):
    # بدون تغییر
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    note = models.CharField(max_length=255, blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تاریخچه وضعیت سفارش"
        verbose_name_plural = "تاریخچه وضعیت سفارش‌ها"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status} → {self.to_status}"


class Shipment(models.Model):
    """Tracking information for an order after its stock leaves the warehouse."""

    class Status(models.TextChoices):
        IN_TRANSIT = "in_transit", "در مسیر"
        DELIVERED = "delivered", "تحویل شده"

    tenant = models.ForeignKey(
        "tenants.Company", on_delete=models.CASCADE, related_name="shipments"
    )
    order = models.OneToOneField(
        Order, on_delete=models.PROTECT, related_name="shipment", verbose_name="سفارش"
    )
    carrier = models.CharField(max_length=100, blank=True, verbose_name="شرکت حمل")
    tracking_number = models.CharField(max_length=100, blank=True, verbose_name="کد رهگیری")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_TRANSIT, db_index=True
    )
    notes = models.CharField(max_length=500, blank=True, verbose_name="یادداشت")
    shipped_at = models.DateTimeField(verbose_name="زمان ارسال")
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تحویل")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-shipped_at"]
        verbose_name = "ارسال"
        verbose_name_plural = "ارسال‌ها"

    def __str__(self):
        return f"{self.order.order_number} — {self.get_status_display()}"


class ReturnRequest(models.Model):
    """Auditable request and receipt workflow for customer returns."""

    class Status(models.TextChoices):
        REQUESTED = "requested", "درخواست‌شده"
        APPROVED = "approved", "تأییدشده"
        REJECTED = "rejected", "ردشده"
        RECEIVED = "received", "دریافت‌شده"

    tenant = models.ForeignKey(
        "tenants.Company", on_delete=models.CASCADE, related_name="returns"
    )
    order = models.ForeignKey(
        Order, on_delete=models.PROTECT, related_name="returns", verbose_name="سفارش"
    )
    return_number = models.CharField(max_length=32, unique=True, default="", editable=False)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.REQUESTED, db_index=True
    )
    reason = models.CharField(max_length=255, verbose_name="دلیل مرجوعی")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    decision_note = models.CharField(max_length=255, blank=True, verbose_name="یادداشت بررسی")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="returns_requested",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="returns_resolved",
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]
        verbose_name = "درخواست مرجوعی"
        verbose_name_plural = "درخواست‌های مرجوعی"

    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = f"RET-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.return_number


class ReturnItem(models.Model):
    class Condition(models.TextChoices):
        RESTOCK = "restock", "سالم و قابل بازگشت به موجودی"
        DEFECTIVE = "defective", "معیوب"

    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name="items"
    )
    order_item = models.ForeignKey(
        OrderItem, on_delete=models.PROTECT, related_name="return_items"
    )
    quantity = models.PositiveIntegerField(verbose_name="تعداد")
    serial_numbers = models.JSONField(default=list, blank=True, verbose_name="سریال‌ها")
    condition = models.CharField(
        max_length=20, choices=Condition.choices, default=Condition.RESTOCK
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["return_request", "order_item"], name="uniq_return_item_per_order_line"
            )
        ]

    def __str__(self):
        return f"{self.order_item.variant.sku} × {self.quantity}"
