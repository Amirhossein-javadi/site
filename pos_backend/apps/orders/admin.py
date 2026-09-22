from django.contrib import admin
from .models import Order, SubOrder, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class SubOrderInline(admin.TabularInline):
    model = SubOrder
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "status", "total_amount", "created_at")
    list_filter = ("status", "tenant")
    search_fields = ("id",)
    inlines = [SubOrderInline]

@admin.register(SubOrder)
class SubOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "status")  # کلمه supplier از اینجا حذف شد
    list_filter = ("status",)                 # کلمه supplier از اینجا حذف شد
    inlines = [OrderItemInline]