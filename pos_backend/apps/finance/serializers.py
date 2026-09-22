from rest_framework import serializers

from .models import LedgerEntry


class LedgerEntrySerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    contract_number = serializers.CharField(source="contract.number", read_only=True)

    class Meta:
        model = LedgerEntry
        fields = [
            "id", "contract", "contract_number", "kind", "kind_label",
            "amount_irt", "reference", "note", "created_at",
        ]
