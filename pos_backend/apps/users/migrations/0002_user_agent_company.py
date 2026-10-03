import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0002_agentcompany"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="agent_company",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="users",
                to="tenants.agentcompany",
                verbose_name="شرکت نماینده",
                help_text="برای حساب‌های نقش نماینده الزامی است.",
            ),
        ),
    ]
