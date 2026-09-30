from django.db.models import Count
from rest_framework import viewsets
from rest_framework.filters import SearchFilter

from apps.tenants.models import AgentCompany

from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """مشتریان سامانه همان شرکت‌های نماینده متصل به قراردادها هستند."""

    queryset = AgentCompany.objects.annotate(contracts_count=Count("contracts"))
    serializer_class = CustomerSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        active = self.request.query_params.get("is_active")
        if active in ("true", "false"):
            queryset = queryset.filter(is_active=(active == "true"))
        return queryset
