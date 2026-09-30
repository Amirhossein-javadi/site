from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tenant", "contact_person", "lead_time_days", "status")
    list_filter = ("status", "tenant")
    search_fields = ("name", "code", "contact_person", "phone")
