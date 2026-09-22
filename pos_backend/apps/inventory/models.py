"""
انبار، موجودی و سریال دستگاه‌ها.

دو سطح از حقیقت وجود دارد و باید همیشه با هم سازگار بمانند:

1. InventoryItem  — شمارش تجمیعی (on_hand / reserved) برای هر (انبار، نسخه محصول)
2. DeviceSerial   — رکورد تک‌تک دستگاه‌ها برای نسخه‌هایی که requires_serial=True

سازگاری این دو از طریق سرویس‌های apps/inventory/services.py تضمین می‌شود،
نه با نوشتن مستقیم روی فیلدها. قیدهای سطح دیتابیس آخرین سد هستند.
"""

from django.db import models


class Warehouse(models.Model):
    """انبار فیزیکی متعلق به یک شرکت."""

    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.CASCADE,
        related_name="warehouses",
        verbose_name="شرکت (Tenant)",
    )
    name = models.CharField(max_length=150, verbose_name="نام انبار")
    code = models.CharField(max_length=30, verbose_name="کد انبار")
    address = models.TextField(blank=True, verbose_name="آدرس")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "انبار"
        verbose_name_plural = "انبارها"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "code"], name="uniq_warehouse_code_per_tenant"
            )
        ]

    def __str__(self):
        return self.name


class InventoryItem(models.Model):
    """
    موجودی تجمیعی یک نسخه محصول در یک انبار.

    فرمول پایه:  available = on_hand - reserved

    قید CHECK در سطح دیتابیس تضمین می‌کند که حتی اگر یک باگ در کد اپلیکیشن
    از فیلترها عبور کند، موجودی منفی یا رزرو بیشتر از موجودی در دیتابیس
    ذخیره نمی‌شود. این آخرین سد جلوگیری از Overselling است.
    """

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="inventory_items",
        verbose_name="انبار",
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.PROTECT,
        related_name="inventory_items",
        verbose_name="نسخه محصول",
    )
    on_hand = models.PositiveIntegerField(default=0, verbose_name="موجودی فیزیکی")
    reserved = models.PositiveIntegerField(default=0, verbose_name="رزرو شده")
    reorder_point = models.PositiveIntegerField(
        default=0, verbose_name="نقطه سفارش مجدد"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "موجودی انبار"
        verbose_name_plural = "موجودی انبارها"
        ordering = ["warehouse__name", "variant__sku"]
        constraints = [
            models.UniqueConstraint(
                fields=["warehouse", "variant"], name="uniq_inventory_warehouse_variant"
            ),
            models.CheckConstraint(
                condition=models.Q(reserved__lte=models.F("on_hand")),
                name="chk_reserved_not_exceeding_on_hand",
            ),
        ]

    def __str__(self):
        return f"{self.variant.sku} @ {self.warehouse.code}"

    @property
    def available(self):
        """موجودی قابل فروش."""
        return self.on_hand - self.reserved

    @property
    def is_below_reorder_point(self):
        return self.available <= self.reorder_point


class DeviceSerial(models.Model):
    """
    یک دستگاه فیزیکی مشخص با سریال یکتا.

    سریال در کل سیستم یکتاست (نه فقط داخل یک شرکت) — چون سریال را سازنده
    تولید می‌کند و دو دستگاه واقعی هرگز سریال یکسان ندارند.
    """

    class Status(models.TextChoices):
        IN_STOCK = "in_stock", "موجود در انبار"
        RESERVED = "reserved", "رزرو شده"
        SOLD = "sold", "فروخته شده"
        RETURNED = "returned", "مرجوعی"
        DEFECTIVE = "defective", "معیوب"

    serial_number = models.CharField(
        max_length=100, unique=True, verbose_name="شماره سریال"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.PROTECT,
        related_name="serials",
        verbose_name="نسخه محصول",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="serials",
        verbose_name="انبار",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_STOCK,
        db_index=True,
        verbose_name="وضعیت",
    )
    received_at = models.DateTimeField(
        auto_now_add=True, verbose_name="تاریخ ورود به انبار"
    )
    note = models.CharField(max_length=255, blank=True, verbose_name="یادداشت")

    class Meta:
        verbose_name = "سریال دستگاه"
        verbose_name_plural = "سریال دستگاه‌ها"
        ordering = ["-received_at"]
        indexes = [
            # کوئری داغ سیستم: «سریال‌های قابل تخصیص این نسخه در این انبار»
            models.Index(
                fields=["variant", "warehouse", "status"],
                name="idx_serial_allocation",
            ),
        ]

    def __str__(self):
        return self.serial_number


class InventoryLedger(models.Model):
    """
    دفتر تغییرات موجودی — فقط افزودنی (append-only).

    هیچ رکوردی از این جدول حذف یا ویرایش نمی‌شود؛ هر تغییر موجودی یک ردیف
    جدید می‌سازد. این تنها راه پاسخ دادن به «چرا موجودی این کالا الان X است»
    و لازمه‌ی قابلیت حسابرسی است.
    """

    class Kind(models.TextChoices):
        RECEIPT = "receipt", "ورود کالا"
        ISSUE = "issue", "خروج کالا"
        RESERVE = "reserve", "رزرو"
        RELEASE = "release", "آزادسازی رزرو"
        ADJUSTMENT = "adjustment", "اصلاح دستی"
        TRANSFER_IN = "transfer_in", "انتقال ورودی"
        TRANSFER_OUT = "transfer_out", "انتقال خروجی"

    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="ledger_entries"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.PROTECT, related_name="ledger_entries"
    )
    kind = models.CharField(max_length=20, choices=Kind.choices, verbose_name="نوع تغییر")
    quantity = models.IntegerField(
        verbose_name="تعداد",
        help_text="مثبت برای افزایش موجودی فیزیکی، منفی برای کاهش.",
    )
    on_hand_after = models.PositiveIntegerField(verbose_name="موجودی پس از تغییر")
    reserved_after = models.PositiveIntegerField(verbose_name="رزرو پس از تغییر")
    reference = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="مرجع",
        help_text="شماره سفارش، رسید انبار یا هر شناسه مرتبط.",
    )
    note = models.CharField(max_length=255, blank=True, verbose_name="توضیح")
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_entries",
        verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "دفتر موجودی"
        verbose_name_plural = "دفتر موجودی"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_kind_display()} — {self.variant.sku} ({self.quantity:+d})"
