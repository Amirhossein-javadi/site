from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255, verbose_name="نام شرکت")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="شناسه یکتا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "شرکت (Tenant)"
        verbose_name_plural = "شرکت‌ها (Tenants)"

    def __str__(self):
        return self.name

class AgentCompany(models.Model):
    """
    شرکت نماینده که مستقیماً با شرکت اصلی (Tenant) کار می‌کند.
    """
    tenant = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="agents",
        verbose_name="شرکت (Tenant)"
    )
    name = models.CharField(max_length=255, verbose_name="نام شرکت نماینده")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "شرکت نماینده"
        verbose_name_plural = "شرکت‌های نماینده"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name