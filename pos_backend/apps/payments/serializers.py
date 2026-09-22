from rest_framework import serializers

from apps.pricing.models import ProformaInvoice

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    proforma_number = serializers.CharField(source="proforma.number", read_only=True)
    order_number = serializers.CharField(source="proforma.order.order_number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "proforma", "proforma_number", "order_number",
            "gateway", "gateway_reference", "amount_irt", "redirect_url",
            "status", "status_label", "created_at", "verified_at",
        ]


class CreatePaymentIntentSerializer(serializers.Serializer):
    proforma = serializers.PrimaryKeyRelatedField(queryset=ProformaInvoice.objects.all())
    idempotency_key = serializers.CharField(max_length=100)
    gateway = serializers.CharField(max_length=30, default="mock")


class VerifyPaymentSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=["success", "fail"], default="success")
    amount_irt = serializers.CharField(required=False, allow_blank=True)
