from rest_framework import viewsets
from rest_framework.filters import SearchFilter

from apps.tenants.querysets import for_user_tenant

from .models import Contract
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ReadOnlyModelViewSet):
    """فهرست فقط قراردادهای شرکت کاربر را ارائه می‌کند."""
    serializer_class = ContractSerializer
    filter_backends = [SearchFilter]
    search_fields = ["number", "title", "agent__name"]

    def get_queryset(self):
        return for_user_tenant(
            Contract.objects.select_related("tenant", "agent"), self.request.user
        )
