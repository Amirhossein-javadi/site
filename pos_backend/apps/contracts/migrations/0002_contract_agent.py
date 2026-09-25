import django.db.models.deletion
from django.db import migrations, models


def copy_agent_names(apps, schema_editor):
    Contract = apps.get_model("contracts", "Contract")
    AgentCompany = apps.get_model("tenants", "AgentCompany")
    for contract in Contract.objects.all():
        name = (contract.agent_name or "").strip() or "نامشخص"
        agent, _ = AgentCompany.objects.get_or_create(
            tenant_id=contract.tenant_id,
            name=name,
        )
        contract.agent = agent
        contract.save(update_fields=["agent"])


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0001_initial"),
        ("tenants", "0002_agentcompany"),
    ]

    operations = [
        migrations.AddField(
            model_name="contract",
            name="agent",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="contracts",
                to="tenants.agentcompany",
                verbose_name="شرکت نماینده",
            ),
        ),
        migrations.RunPython(copy_agent_names, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="contract",
            name="agent",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="contracts",
                to="tenants.agentcompany",
                verbose_name="شرکت نماینده",
            ),
        ),
        migrations.RemoveField(
            model_name="contract",
            name="agent_name",
        ),
    ]
