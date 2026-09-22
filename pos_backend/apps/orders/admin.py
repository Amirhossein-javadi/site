from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("variant", "quantity", "unit_price", "currency")
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
    readonly_fields = ("order_number", "stock_issued_at", "created_at", "updated_at")
    inlines = [OrderItemInline, OrderStatusHistoryInline]

    def has_add_permission(self, request):
        # ثبت سفارش فقط از طریق API (که services.place_order را صدا می‌زند)
        # مجاز است، نه از پنل ادمین — چون رزرو موجودی باید هم‌زمان انجام شود.
        return False
