from rest_framework import mixins, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.tenants.querysets import for_user_tenant, tenant_for_user

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SupplierSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name", "code", "contact_person", "phone"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = for_user_tenant(
            Supplier.objects.select_related("tenant"), self.request.user
        )
        status = self.request.query_params.get("status")
        if status in (Supplier.Status.ACTIVE, Supplier.Status.SUSPENDED):
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        tenant = tenant_for_user(self.request.user)
        if tenant is None:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("حساب کاربری به شرکت متصل نیست.")
        serializer.save(tenant=tenant)
