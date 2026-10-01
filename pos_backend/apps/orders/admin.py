from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory, ReturnItem, ReturnRequest, Shipment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("variant", "agent", "quantity", "unit_price", "currency", "serial_numbers")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        # اقلام فقط از طریق services.place_order ساخته می‌شوند
        return False


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ("from_status", "to_status", "note", "changed_by", "changed_at")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "contract", "warehouse", "status",
        "stock_issued_at", "created_at",
    )
    list_filter = ("status", "warehouse")
    search_fields = ("order_number", "contract__number")
    readonly_fields = tuple(field.name for field in Order._meta.fields)
    inlines = [OrderItemInline, OrderStatusHistoryInline]

    def has_add_permission(self, request):
        # ثبت سفارش فقط از طریق API (که services.place_order را صدا می‌زند)
        # مجاز است، نه از پنل ادمین — چون رزرو موجودی باید هم‌زمان انجام شود.
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ("order", "carrier", "tracking_number", "status", "shipped_at", "delivered_at")
    list_filter = ("status", "carrier")
    search_fields = ("order__order_number", "tracking_number")
    readonly_fields = ("tenant", "order", "status", "shipped_at", "delivered_at")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0
    can_delete = False
    readonly_fields = ("order_item", "quantity", "serial_numbers", "condition")


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ("return_number", "order", "status", "reason", "requested_at", "received_at")
    list_filter = ("status",)
    search_fields = ("return_number", "order__order_number", "reason")
    readonly_fields = tuple(field.name for field in ReturnRequest._meta.fields)
    inlines = (ReturnItemInline,)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
