from django.db import models
from django.utils import timezone

class Contract(models.Model):
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
    
    # فیلد جدید جایگزین agent_name شد
    agent = models.ForeignKey(
        "tenants.AgentCompany",
        on_delete=models.PROTECT,
        related_name="contracts",
        verbose_name="شرکت نماینده"
    )
    
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

    @property
    def is_valid_for_ordering(self):
        return self.status == self.Status.ACTIVE and self.end_date >= timezone.now().date()