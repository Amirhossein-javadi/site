from django.contrib import admin

from .models import DeviceSerial, InventoryItem, InventoryLedger, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tenant", "is_active")
    search_fields = ("name", "code")


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("variant", "warehouse", "on_hand", "reserved", "available", "reorder_point")
    list_filter = ("warehouse",)
    search_fields = ("variant__sku", "variant__product__name")
    # on_hand/reserved فقط از طریق سرویس‌ها تغییر می‌کنند، نه دستی در ادمین
    readonly_fields = ("on_hand", "reserved")

    @admin.display(description="قابل فروش")
    def available(self, obj):
        return obj.available


@admin.register(DeviceSerial)
class DeviceSerialAdmin(admin.ModelAdmin):
    list_display = ("serial_number", "variant", "warehouse", "status", "received_at")
    list_filter = ("status", "warehouse")
    search_fields = ("serial_number", "variant__sku")


@admin.register(InventoryLedger)
class InventoryLedgerAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "variant", "warehouse", "quantity", "on_hand_after", "reference")
    list_filter = ("kind", "warehouse")
    search_fields = ("variant__sku", "reference")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
