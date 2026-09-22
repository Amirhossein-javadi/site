from rest_framework import serializers
from .models import Order, SubOrder, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "variant", "quantity", "unit_price"]

class SubOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SubOrder
        fields = ["id", "status", "status_label", "items"]

class OrderSerializer(serializers.ModelSerializer):
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "tenant", "status", "status_label", "total_amount", "created_at", "sub_orders"]