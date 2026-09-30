from rest_framework import serializers
from .models import Contract

class ContractSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source="agent.name", read_only=True)
    status = serializers.CharField(source="get_status_display", read_only=True)
    status_code = serializers.CharField(read_only=True)
    is_valid_for_ordering = serializers.BooleanField(read_only=True)
    tenant_id = serializers.IntegerField(read_only=True)

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
            "status_code",
            "is_valid_for_ordering",
            "tenant_id",
        ]
