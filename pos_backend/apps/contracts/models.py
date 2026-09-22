from django.db import models


class Contract(models.Model):
    """
    مدل حداقلی قرارداد — فقط برای اتصال واقعی صفحه «قراردادها» در فرانت
    به یک API واقعی ساخته شده؛ منطق کامل قرارداد (تمدید، اعتبارسنجی سقف
    خرید real-time در زمان سفارش و...) در فاز بعدی اضافه می‌شود.

    agent_name به‌صورت CharField ساده نگه داشته شده چون مدل مستقل
    AgentCompany (شرکت نماینده) هنوز ساخته نشده — طبق برنامه فازبندی،
    این فیلد در فاز مربوط به «نمایندگان» به ForeignKey تبدیل می‌شود.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "فعال"
        EXPIRED = "expired", "منقضی‌شده"
        PENDING = "pending", "در انتظار تایید"

    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.CASCADE,
        related_name="contracts",
        verbose_name="شرکت (Tenant)",
        help_text="مرز Multi-tenancy؛ شرکت توزیع‌کننده‌ای که این قرارداد متعلق به آن است.",
    )
    number = models.CharField(max_length=30, unique=True, verbose_name="شماره قرارداد")
    title = models.CharField(max_length=255, verbose_name="عنوان")
    agent_name = models.CharField(max_length=255, verbose_name="شرکت نماینده")
    device_cap = models.PositiveIntegerField(verbose_name="سقف دستگاه")
    end_date = models.DateField(verbose_name="تاریخ انقضا")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="وضعیت"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "قرارداد"
        verbose_name_plural = "قراردادها"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.number} — {self.title}"
