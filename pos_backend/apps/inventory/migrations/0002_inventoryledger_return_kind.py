from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("inventory", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="inventoryledger",
            name="kind",
            field=models.CharField(
                choices=[
                    ("receipt", "ورود کالا"),
                    ("issue", "خروج کالا"),
                    ("reserve", "رزرو"),
                    ("release", "آزادسازی رزرو"),
                    ("adjustment", "اصلاح دستی"),
                    ("transfer_in", "انتقال ورودی"),
                    ("transfer_out", "انتقال خروجی"),
                    ("return", "ورود کالای مرجوعی"),
                ],
                max_length=20,
                verbose_name="نوع تغییر",
            ),
        ),
    ]
