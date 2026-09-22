from rest_framework import serializers

from apps.orders.models import Order

from .models import ExchangeRate, ProformaInvoice, ProformaInvoiceLine


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ["id", "currency", "rate_date", "rate_to_irt"]


class ProformaInvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProformaInvoiceLine
        fields = [
            "id", "description", "quantity",
            "unit_price_original", "currency_original", "exchange_rate_applied",
            "unit_price_irt", "line_subtotal_irt", "line_tax_irt", "line_total_irt",
        ]


class ProformaInvoiceSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    lines = ProformaInvoiceLineSerializer(many=True, read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProformaInvoice
        fields = [
            "id", "number", "order", "order_number", "status", "status_label",
            "tax_rate", "subtotal_irt", "tax_amount_irt", "total_irt",
            "issued_at", "valid_until", "is_expired", "lines",
        ]


class IssueProformaSerializer(serializers.Serializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
