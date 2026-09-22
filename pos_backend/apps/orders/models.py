from django.db import models

class Order(models.Model):
    """سفارش اصلی کاربر/نماینده"""
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار تایید"
        CONFIRMED = "confirmed", "تایید شده"
        SHIPPED = "shipped", "ارسال شده"
        DELIVERED = "delivered", "تحویل داده شده"
        CANCELED = "canceled", "لغو شده"

    tenant = models.ForeignKey(
        "tenants.Company", 
        on_delete=models.CASCADE, 
        related_name="orders",
        verbose_name="شرکت (Tenant)"
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING,
        verbose_name="وضعیت سفارش"
    )
    total_amount = models.DecimalField(
        max_digits=20, 
        decimal_places=4, 
        default=0,
        verbose_name="مبلغ کل (ریال)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارشات"
        ordering = ["-created_at"]

    def __str__(self):
        return f"سفارش #{self.id} - {self.tenant}"


class SubOrder(models.Model):
    """زیر‌سفارش برای تفکیک سفارش"""
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name="sub_orders",
        verbose_name="سفارش اصلی"
    )
    # فعلاً این قسمت را کامنت می‌کنیم چون هنوز اپلیکیشن suppliers را نساخته‌ایم:
    # supplier = models.ForeignKey(
    #     "suppliers.Supplier", 
    #     on_delete=models.PROTECT, 
    #     null=True, 
    #     blank=True,
    #     verbose_name="تامین‌کننده"
    # )
    status = models.CharField(
        max_length=20, 
        choices=Order.Status.choices, 
        default=Order.Status.PENDING,
        verbose_name="وضعیت زیر‌سفارش"
    )

    class Meta:
        verbose_name = "زیر‌سفارش"
        verbose_name_plural = "زیر‌سفارشات"

    def __str__(self):
        return f"زیر‌سفارش #{self.id} از سفارش اصلی #{self.order_id}"
class OrderItem(models.Model):
    """آیتم‌های داخل هر زیر‌سفارش"""
    sub_order = models.ForeignKey(
        SubOrder, 
        on_delete=models.CASCADE, 
        related_name="items",
        verbose_name="زیر‌سفارش"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant", 
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="نسخه محصول"
    )
    quantity = models.PositiveIntegerField(verbose_name="تعداد")
    unit_price = models.DecimalField(
        max_digits=20, 
        decimal_places=4,
        verbose_name="قیمت واحد (ریال)"
    )

    class Meta:
        verbose_name = "آیتم سفارش"
        verbose_name_plural = "آیتم‌های سفارش"

    def __str__(self):
        return f"{self.quantity} عدد {self.variant}"