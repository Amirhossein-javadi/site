from django.db import models


class Supplier(models.Model):
    """تامین‌کننده‌ای که شرکت از او کالا تهیه می‌کند."""

    class Status(models.TextChoices):
        ACTIVE = "active", "فعال"
        SUSPENDED = "suspended", "معلق"

    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.CASCADE,
        related_name="suppliers",
        verbose_name="شرکت",
    )
    name = models.CharField(max_length=255, verbose_name="نام تامین‌کننده")
    code = models.CharField(max_length=30, verbose_name="کد")
    contact_person = models.CharField(max_length=150, blank=True, verbose_name="رابط")
    phone = models.CharField(max_length=30, blank=True, verbose_name="تلفن")
    lead_time_days = models.PositiveSmallIntegerField(default=7, verbose_name="زمان تحویل (روز)")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE, verbose_name="وضعیت"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تامین‌کننده"
        verbose_name_plural = "تامین‌کنندگان"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["tenant", "code"], name="uniq_supplier_code_per_tenant")
        ]

    def __str__(self):
        return self.name
