"""
نرخ ارز و پیش‌فاکتور.

قانون کسب‌وکاری این ماژول (طبق سند اولیه): «هنگام صدور پیش‌فاکتور، قیمت
کالا، نرخ ارز و مالیات باید Snapshot شوند. تغییرات آینده قیمت نباید
فاکتورهای صادرشده را تغییر دهد.»

برای همین ProformaInvoice و ProformaInvoiceLine بعد از ساخته‌شدن هرگز
UPDATE نمی‌شوند — فقط خوانده می‌شوند. اگر قیمتی عوض شود یا خطایی باشد،
پیش‌فاکتور جدید صادر می‌شود، پیش‌فاکتور قدیم دست‌نخورده می‌ماند.
"""

from django.db import models


class ExchangeRate(models.Model):
    """
    نرخ روزانه تبدیل ارز به تومان.

    هر روز حداکثر یک نرخ برای هر ارز ثبت می‌شود (UniqueConstraint پایین).
    اگر برای امروز نرخی ثبت نشده باشد، آخرین نرخ ثبت‌شده قبل از امروز
    استفاده می‌شود (به‌جای خطا دادن) — این رفتار در services.py است.
    """

    currency = models.CharField(max_length=3, verbose_name="ارز")
    rate_date = models.DateField(verbose_name="تاریخ نرخ")
    rate_to_irt = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        verbose_name="نرخ به تومان",
        help_text="مثلاً اگر ۱ دلار = ۶۵,۰۰۰ تومان، این مقدار 65000.0000 است.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نرخ ارز"
        verbose_name_plural = "نرخ‌های ارز"
        ordering = ["-rate_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["currency", "rate_date"], name="uniq_rate_per_currency_per_day"
            )
        ]

    def __str__(self):
        return f"{self.currency} @ {self.rate_date} = {self.rate_to_irt}"


class ProformaInvoice(models.Model):
    """
    پیش‌فاکتور یک سفارش — Snapshot غیرقابل‌تغییر قیمت، نرخ ارز و مالیات
    در لحظه صدور.

    OneToOne با Order چون در نسخه فعلی هر سفارش حداکثر یک پیش‌فاکتور دارد؛
    اگر روزی نیاز به صدور مجدد شد (مثلاً پیش‌فاکتور منقضی شد)، به‌جای
    ویرایش رکورد موجود، این محدودیت باید عمداً بازبینی شود، نه این‌که
    از کنارش رد شویم.
    """

    class Status(models.TextChoices):
        ISSUED = "issued", "صادرشده"
        EXPIRED = "expired", "منقضی‌شده"
        CONVERTED = "converted", "تبدیل به فاکتور قطعی"

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="proforma_invoice",
        verbose_name="سفارش",
    )
    number = models.CharField(max_length=30, unique=True, verbose_name="شماره پیش‌فاکتور")
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=4, verbose_name="نرخ مالیات",
        help_text="مثلاً 0.1000 برای ۱۰٪",
    )
    subtotal_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="جمع قبل از مالیات (تومان)"
    )
    tax_amount_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="مبلغ مالیات (تومان)"
    )
    total_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="مبلغ نهایی (تومان)"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ISSUED, verbose_name="وضعیت"
    )
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان صدور")
    valid_until = models.DateTimeField(verbose_name="اعتبار تا")

    class Meta:
        verbose_name = "پیش‌فاکتور"
        verbose_name_plural = "پیش‌فاکتورها"
        ordering = ["-issued_at"]

    def __str__(self):
        return self.number

    @property
    def is_expired(self):
        from django.utils import timezone

        return self.status == self.Status.ISSUED and timezone.now() > self.valid_until


class ProformaInvoiceLine(models.Model):
    """
    ردیف پیش‌فاکتور — کپی کامل و منجمدشده اطلاعات لازم برای محاسبه، تا
    حتی اگر ProductVariant یا نرخ ارز بعداً عوض شود، این ردیف بدون تغییر
    بماند.
    """

    proforma = models.ForeignKey(
        ProformaInvoice, on_delete=models.CASCADE, related_name="lines"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.PROTECT, related_name="+"
    )
    description = models.CharField(
        max_length=255, verbose_name="شرح کالا (Snapshot نام در لحظه صدور)"
    )
    quantity = models.PositiveIntegerField(verbose_name="تعداد")

    unit_price_original = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="قیمت واحد (ارز اصلی)"
    )
    currency_original = models.CharField(max_length=3, verbose_name="ارز اصلی")
    exchange_rate_applied = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="نرخ ارز اعمال‌شده",
        help_text="برای اقلام تومانی همیشه 1.0000 است.",
    )
    unit_price_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="قیمت واحد (تومان)"
    )
    line_subtotal_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="جمع ردیف قبل از مالیات"
    )
    line_tax_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="مالیات ردیف"
    )
    line_total_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="جمع نهایی ردیف"
    )

    class Meta:
        verbose_name = "ردیف پیش‌فاکتور"
        verbose_name_plural = "ردیف‌های پیش‌فاکتور"

    def __str__(self):
        return f"{self.description} × {self.quantity}"
