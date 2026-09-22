from rest_framework import serializers

from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source="agent_name")
    status = serializers.CharField(source="get_status_display")

    class Meta:
        model = Contract
        fields = [
            "id",
            "number",
            "title",
            "company",
            "device_cap",
            "end_date",
            "status",
        ]
