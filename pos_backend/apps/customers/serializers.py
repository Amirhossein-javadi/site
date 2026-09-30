from rest_framework import serializers

from apps.tenants.models import AgentCompany


class CustomerSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    contracts_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AgentCompany
        fields = ["id", "name", "is_active", "status", "status_label", "contracts_count"]

    def get_status(self, obj):
        return "active" if obj.is_active else "inactive"

    def get_status_label(self, obj):
        return "فعال" if obj.is_active else "غیرفعال"
