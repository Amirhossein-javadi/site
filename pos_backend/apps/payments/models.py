from django.db import models


class Payment(models.Model):
    """
    یک تلاش پرداخت برای یک پیش‌فاکتور.

    هرگز اطلاعات کارت بانکی اینجا ذخیره نمی‌شود — فقط ارجاع (reference)
    درگاه. دو قید یکتایی برای جلوگیری از پرداخت تکراری:

    - idempotency_key: اگر کلاینت به دلیل قطعی شبکه دوباره همان درخواست
      «شروع پرداخت» را بفرستد، همان Payment قبلی برگردانده می‌شود، نه
      یک رکورد جدید.
    - (gateway, gateway_reference): تضمین می‌کند یک reference از یک
      درگاه دوبار در سیستم پردازش نشود، حتی اگر Webhook دو بار برسد.
    """

    class Status(models.TextChoices):
        CREATED = "created", "ایجادشده"
        PENDING = "pending", "در انتظار تایید"
        SUCCEEDED = "succeeded", "موفق"
        FAILED = "failed", "ناموفق"
        CANCELLED = "cancelled", "لغوشده"

    proforma = models.ForeignKey(
        "pricing.ProformaInvoice",
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name="پیش‌فاکتور",
    )
    gateway = models.CharField(max_length=30, verbose_name="درگاه")
    gateway_reference = models.CharField(max_length=100, verbose_name="ارجاع درگاه")
    idempotency_key = models.CharField(
        max_length=100, unique=True, verbose_name="کلید Idempotency"
    )
    amount_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="مبلغ (تومان)"
    )
    redirect_url = models.URLField(blank=True, verbose_name="آدرس بازگشت")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.CREATED,
        db_index=True, verbose_name="وضعیت",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تایید")

    class Meta:
        verbose_name = "پرداخت"
        verbose_name_plural = "پرداخت‌ها"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["gateway", "gateway_reference"], name="uniq_gateway_reference"
            )
        ]

    def __str__(self):
        return f"{self.gateway_reference} ({self.get_status_display()})"
