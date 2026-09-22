from rest_framework import serializers

from .models import DeviceSerial, InventoryItem, InventoryLedger, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "code", "address", "is_active"]


class InventoryItemSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    product_title = serializers.CharField(
        source="variant.display_title", read_only=True
    )
    requires_serial = serializers.BooleanField(
        source="variant.requires_serial", read_only=True
    )
    available = serializers.IntegerField(read_only=True)
    is_below_reorder_point = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "sku",
            "product_title",
            "requires_serial",
            "on_hand",
            "reserved",
            "available",
            "reorder_point",
            "is_below_reorder_point",
            "updated_at",
        ]


class DeviceSerialSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    product_title = serializers.CharField(
        source="variant.display_title", read_only=True
    )
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = DeviceSerial
        fields = [
            "id",
            "serial_number",
            "sku",
            "product_title",
            "warehouse",
            "warehouse_name",
            "status",
            "status_label",
            "received_at",
            "note",
        ]


class InventoryLedgerSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    created_by_email = serializers.CharField(
        source="created_by.email", read_only=True, default=None
    )

    class Meta:
        model = InventoryLedger
        fields = [
            "id",
            "warehouse_name",
            "sku",
            "kind",
            "kind_label",
            "quantity",
            "on_hand_after",
            "reserved_after",
            "reference",
            "note",
            "created_by_email",
            "created_at",
        ]
