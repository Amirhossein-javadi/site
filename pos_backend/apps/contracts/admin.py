from django.contrib import admin

from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("number", "title", "agent", "tenant", "status", "end_date")
    list_filter = ("status", "tenant")
    search_fields = ("number", "title", "agent__name")
