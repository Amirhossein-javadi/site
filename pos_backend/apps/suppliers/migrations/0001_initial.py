from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("tenants", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Supplier",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, verbose_name="نام تامین‌کننده")),
                ("code", models.CharField(max_length=30, verbose_name="کد")),
                ("contact_person", models.CharField(blank=True, max_length=150, verbose_name="رابط")),
                ("phone", models.CharField(blank=True, max_length=30, verbose_name="تلفن")),
                ("lead_time_days", models.PositiveSmallIntegerField(default=7, verbose_name="زمان تحویل (روز)")),
                ("status", models.CharField(choices=[("active", "فعال"), ("suspended", "معلق")], default="active", max_length=20, verbose_name="وضعیت")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="suppliers", to="tenants.company", verbose_name="شرکت")),
            ],
            options={
                "verbose_name": "تامین‌کننده",
                "verbose_name_plural": "تامین‌کنندگان",
                "ordering": ["name"],
            },
        ),
        migrations.AddConstraint(
            model_name="supplier",
            constraint=models.UniqueConstraint(fields=("tenant", "code"), name="uniq_supplier_code_per_tenant"),
        ),
    ]
