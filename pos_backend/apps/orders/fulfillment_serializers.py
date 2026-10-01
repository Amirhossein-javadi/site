from rest_framework import serializers

from .models import Order, OrderItem, ReturnItem, ReturnRequest, Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    contract_number = serializers.CharField(source="order.contract.number", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    item_count = serializers.IntegerField(source="order.items.count", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id", "order", "order_number", "contract_number", "carrier",
            "tracking_number", "status", "status_label", "notes", "item_count",
            "shipped_at", "delivered_at",
        ]
        read_only_fields = [
            "id", "order", "status", "shipped_at", "delivered_at",
            "order_number", "contract_number", "status_label", "item_count",
        ]


class ReturnItemInputSerializer(serializers.Serializer):
    order_item = serializers.PrimaryKeyRelatedField(queryset=OrderItem.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    serial_numbers = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, default=list
    )
    condition = serializers.ChoiceField(
        choices=ReturnItem.Condition.choices, required=False,
        default=ReturnItem.Condition.RESTOCK,
    )


class CreateReturnSerializer(serializers.Serializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    reason = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = ReturnItemInputSerializer(many=True)


class ReturnItemSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="order_item.variant.sku", read_only=True)
    product_title = serializers.CharField(
        source="order_item.variant.display_title", read_only=True
    )
    order_item_id = serializers.IntegerField(read_only=True)
    condition_label = serializers.CharField(source="get_condition_display", read_only=True)

    class Meta:
        model = ReturnItem
        fields = [
            "id", "order_item_id", "sku", "product_title", "quantity",
            "serial_numbers", "condition", "condition_label",
        ]


class ReturnRequestSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = ReturnItemSerializer(many=True, read_only=True)
    requested_by_email = serializers.CharField(
        source="requested_by.email", read_only=True, default=None
    )

    class Meta:
        model = ReturnRequest
        fields = [
            "id", "return_number", "order", "order_number", "status", "status_label",
            "reason", "notes", "decision_note", "items", "requested_by_email",
            "requested_at", "resolved_at", "received_at",
        ]
        read_only_fields = fields


class ReturnDecisionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
