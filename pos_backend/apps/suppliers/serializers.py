from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id", "name", "code", "contact_person", "phone",
            "lead_time_days", "status", "status_label",
        ]
