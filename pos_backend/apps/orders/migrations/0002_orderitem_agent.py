import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
        ("tenants", "0002_agentcompany"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="agent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="order_items",
                to="tenants.agentcompany",
                verbose_name="شرکت نماینده",
            ),
        ),
    ]
