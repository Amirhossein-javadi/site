from rest_framework import serializers
from .models import Contract

class ContractSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source="agent.name", read_only=True)
    status = serializers.CharField(source="get_status_display", read_only=True)

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