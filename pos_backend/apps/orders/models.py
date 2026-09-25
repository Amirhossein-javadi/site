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