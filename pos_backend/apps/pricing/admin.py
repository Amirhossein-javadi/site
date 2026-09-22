from django.contrib import admin

from .models import ExchangeRate, ProformaInvoice, ProformaInvoiceLine


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ("currency", "rate_date", "rate_to_irt")
    list_filter = ("currency",)
    ordering = ("-rate_date",)


class ProformaInvoiceLineInline(admin.TabularInline):
    model = ProformaInvoiceLine
    extra = 0
    readonly_fields = [f.name for f in ProformaInvoiceLine._meta.fields if f.name != "id"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ProformaInvoice)
class ProformaInvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "order", "total_irt", "status", "issued_at", "valid_until")
    list_filter = ("status",)
    search_fields = ("number", "order__order_number")
    readonly_fields = [
        "number", "subtotal_irt", "tax_amount_irt", "total_irt", "issued_at",
    ]
    inlines = [ProformaInvoiceLineInline]

    def has_add_permission(self, request):
        # پیش‌فاکتور فقط از طریق services.issue_proforma_invoice ساخته می‌شود
        return False

    def has_change_permission(self, request, obj=None):
        # تغییرناپذیر — طبق قانون کسب‌وکار
        return False
