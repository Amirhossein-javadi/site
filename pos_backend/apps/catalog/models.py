"""
کاتالوگ محصولات.

نکته معماری: قیمت و موجودی همیشه روی ProductVariant است، نه Product.
Product فقط یک گروه‌بندی نمایشی است (مثلاً «کارتخوان سیار V72») و
Variant نسخه واقعی قابل فروش است (مثلاً «V72 - نسخه GPRS - مشکی»).
این جداسازی از داده متناقض جلوگیری می‌کند.
"""

from django.core.validators import MinValueValidator
from django.db import models


class Category(models.Model):
    """دسته‌بندی سلسله‌مراتبی محصولات."""

    name = models.CharField(max_length=150, verbose_name="نام دسته")
    slug = models.SlugField(max_length=150, unique=True, verbose_name="شناسه یکتا")
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="دسته والد",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "دسته‌بندی"
        verbose_name_plural = "دسته‌بندی‌ها"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Brand(models.Model):
    """برند/سازنده محصول (مثلاً Vanstone، PAX، Ingenico)."""

    name = models.CharField(max_length=150, unique=True, verbose_name="نام برند")
    slug = models.SlugField(max_length=150, unique=True, verbose_name="شناسه یکتا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "برند"
        verbose_name_plural = "برندها"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    محصول در سطح گروه. خودش قابل فروش نیست — فروش روی Variant انجام می‌شود.
    """

    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name="شرکت (Tenant)",
    )
    name = models.CharField(max_length=255, verbose_name="نام محصول")
    code = models.CharField(max_length=50, verbose_name="کد محصول")
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="دسته‌بندی",
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="برند",
    )
    description = models.TextField(blank=True, verbose_name="توضیحات")
    warranty_months = models.PositiveSmallIntegerField(
        default=12, verbose_name="گارانتی (ماه)"
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "محصول"
        verbose_name_plural = "محصولات"
        ordering = ["name"]
        constraints = [
            # کد محصول فقط داخل هر شرکت یکتاست، نه سراسری
            models.UniqueConstraint(
                fields=["tenant", "code"], name="uniq_product_code_per_tenant"
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class ProductVariant(models.Model):
    """
    واحد واقعی قابل فروش. موجودی، سریال و قیمت همه به این مدل وصل می‌شوند.

    درباره قیمت: طبق قواعد کسب‌وکار، قیمت ممکن است دلاری باشد و با نرخ روز
    به تومان تبدیل شود. این‌جا فقط قیمت پایه و واحد ارز نگهداری می‌شود؛
    موتور قیمت‌گذاری (تخفیف، مالیات، Snapshot در پیش‌فاکتور) در فاز بعد
    ساخته می‌شود.
    """

    class Currency(models.TextChoices):
        IRT = "IRT", "تومان"
        USD = "USD", "دلار"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
        verbose_name="محصول",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="عنوان نسخه",
        help_text="مثلاً «GPRS - مشکی» یا «WiFi - سفید»",
    )
    sku = models.CharField(max_length=60, unique=True, verbose_name="SKU")
    barcode = models.CharField(
        max_length=60, blank=True, verbose_name="بارکد"
    )

    base_price = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        validators=[MinValueValidator(0)],
        verbose_name="قیمت پایه",
        help_text="مقادیر پولی همیشه Decimal هستند — استفاده از Float ممنوع است.",
    )
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.IRT,
        verbose_name="واحد ارز",
    )

    requires_serial = models.BooleanField(
        default=True,
        verbose_name="نیازمند ثبت سریال",
        help_text="برای دستگاه‌های کارتخوان فعال است؛ برای لوازم جانبی معمولاً خیر.",
    )
    min_order_quantity = models.PositiveIntegerField(
        default=1, verbose_name="حداقل تعداد سفارش"
    )
    lead_time_days = models.PositiveSmallIntegerField(
        default=0, verbose_name="زمان آماده‌سازی (روز)"
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نسخه محصول"
        verbose_name_plural = "نسخه‌های محصول"
        ordering = ["product__name", "name"]

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    @property
    def display_title(self):
        return f"{self.product.name} — {self.name}"
