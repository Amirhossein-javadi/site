from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "gateway_reference", "proforma", "amount_irt", "gateway",
        "status", "created_at", "verified_at",
    )
    list_filter = ("gateway", "status")
    search_fields = ("gateway_reference", "idempotency_key", "proforma__number")
    readonly_fields = ("created_at", "verified_at")

    def has_add_permission(self, request):
        # پرداخت فقط از طریق services.create_payment_intent ساخته می‌شود
        return False
