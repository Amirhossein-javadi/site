from django.db import models


class Company(models.Model):
    """
    مدل هویتی Tenant — شرکت توزیع‌کننده POS که مشترک پلتفرم است.
    مرز اصلی Multi-tenancy همین مدل است؛ هر رکورد بیزینسی در فازهای بعدی
    (مستقیم یا غیرمستقیم) به یک Company متصل خواهد بود.
    """

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
