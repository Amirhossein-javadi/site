import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def create_existing_shipments(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    Shipment = apps.get_model("orders", "Shipment")
    for order in Order.objects.filter(status__in=["shipped", "delivered"]).iterator():
        Shipment.objects.get_or_create(
            order_id=order.pk,
            defaults={
                "tenant_id": order.tenant_id,
                "status": "delivered" if order.status == "delivered" else "in_transit",
                "shipped_at": order.stock_issued_at or order.created_at,
                "delivered_at": order.updated_at if order.status == "delivered" else None,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("orders", "0002_orderitem_agent"),
        ("tenants", "0002_agentcompany"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="serial_numbers",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Snapshot سریال‌های رزروشده برای رهگیری دقیق ارسال و مرجوعی.",
                verbose_name="سریال‌های تخصیص‌یافته",
            ),
        ),
        migrations.CreateModel(
            name="Shipment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("carrier", models.CharField(blank=True, max_length=100, verbose_name="شرکت حمل")),
                ("tracking_number", models.CharField(blank=True, max_length=100, verbose_name="کد رهگیری")),
                ("status", models.CharField(choices=[("in_transit", "در مسیر"), ("delivered", "تحویل شده")], db_index=True, default="in_transit", max_length=20)),
                ("notes", models.CharField(blank=True, max_length=500, verbose_name="یادداشت")),
                ("shipped_at", models.DateTimeField(verbose_name="زمان ارسال")),
                ("delivered_at", models.DateTimeField(blank=True, null=True, verbose_name="زمان تحویل")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="shipment", to="orders.order", verbose_name="سفارش")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="shipments", to="tenants.company")),
            ],
            options={"verbose_name": "ارسال", "verbose_name_plural": "ارسال‌ها", "ordering": ["-shipped_at"]},
        ),
        migrations.CreateModel(
            name="ReturnRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("return_number", models.CharField(default="", editable=False, max_length=32, unique=True)),
                ("status", models.CharField(choices=[("requested", "درخواست‌شده"), ("approved", "تأییدشده"), ("rejected", "ردشده"), ("received", "دریافت‌شده")], db_index=True, default="requested", max_length=20)),
                ("reason", models.CharField(max_length=255, verbose_name="دلیل مرجوعی")),
                ("notes", models.TextField(blank=True, verbose_name="توضیحات")),
                ("decision_note", models.CharField(blank=True, max_length=255, verbose_name="یادداشت بررسی")),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("received_at", models.DateTimeField(blank=True, null=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="returns", to="orders.order", verbose_name="سفارش")),
                ("requested_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="returns_requested", to=settings.AUTH_USER_MODEL)),
                ("resolved_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="returns_resolved", to=settings.AUTH_USER_MODEL)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="returns", to="tenants.company")),
            ],
            options={"verbose_name": "درخواست مرجوعی", "verbose_name_plural": "درخواست‌های مرجوعی", "ordering": ["-requested_at"]},
        ),
        migrations.CreateModel(
            name="ReturnItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(verbose_name="تعداد")),
                ("serial_numbers", models.JSONField(blank=True, default=list, verbose_name="سریال‌ها")),
                ("condition", models.CharField(choices=[("restock", "سالم و قابل بازگشت به موجودی"), ("defective", "معیوب")], default="restock", max_length=20)),
                ("order_item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="return_items", to="orders.orderitem")),
                ("return_request", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="orders.returnrequest")),
            ],
        ),
        migrations.AddConstraint(
            model_name="returnitem",
            constraint=models.UniqueConstraint(fields=("return_request", "order_item"), name="uniq_return_item_per_order_line"),
        ),
        migrations.RunPython(create_existing_shipments, migrations.RunPython.noop),
    ]
