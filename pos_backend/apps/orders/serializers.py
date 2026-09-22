from rest_framework import serializers

from apps.catalog.models import ProductVariant
from apps.contracts.models import Contract
from apps.inventory.models import Warehouse

from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="variant.sku", read_only=True)
    product_title = serializers.CharField(source="variant.display_title", read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "variant", "sku", "product_title",
            "quantity", "unit_price", "currency", "line_total",
        ]

    def get_line_total(self, obj):
        return str(obj.unit_price * obj.quantity)


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    from_status_label = serializers.SerializerMethodField()
    to_status_label = serializers.CharField(source="get_to_status_display", read_only=True)
    changed_by_email = serializers.CharField(
        source="changed_by.email", read_only=True, default=None
    )

    class Meta:
        model = OrderStatusHistory
        fields = [
            "id", "from_status", "from_status_label",
            "to_status", "to_status_label", "note",
            "changed_by_email", "changed_at",
        ]

    def get_from_status_label(self, obj):
        return dict(Order.Status.choices).get(obj.from_status, obj.from_status)


class OrderListSerializer(serializers.ModelSerializer):
    """برای فهرست — بدون اقلام و تاریخچه، تا سبک بماند."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)
    contract_number = serializers.CharField(source="contract.number", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    is_cancellable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "status_label",
            "contract", "contract_number", "warehouse", "warehouse_name",
            "item_count", "is_cancellable", "created_at",
        ]


class OrderDetailSerializer(OrderListSerializer):
    """برای جزئیات یک سفارش — همراه اقلام و تاریخچه کامل."""

    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            "notes", "stock_issued_at", "items", "status_history",
        ]


class OrderItemInputSerializer(serializers.Serializer):
    """اعتبارسنجی هر ردیف کالا در بدنه درخواست ثبت سفارش."""

    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    """
    ورودی ثبت سفارش. عمداً ModelSerializer نیست چون اقلام سفارش یک
    آرایه تودرتو با اعتبارسنجی جداست، نه یک فیلد ساده مدل.
    """

    contract = serializers.PrimaryKeyRelatedField(queryset=Contract.objects.all())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("سفارش باید حداقل یک قلم کالا داشته باشد.")
        return value


class TransitionInputSerializer(serializers.Serializer):
    to_status = serializers.ChoiceField(choices=Order.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")
