from rest_framework import mixins, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated

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
        tenant_id = getattr(self.request.user, "tenant_id", None)
        queryset = Supplier.objects.select_related("tenant")
        if tenant_id is None:
            return queryset.none()
        queryset = queryset.filter(tenant_id=tenant_id)
        status = self.request.query_params.get("status")
        if status in (Supplier.Status.ACTIVE, Supplier.Status.SUSPENDED):
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        tenant = getattr(self.request.user, "tenant", None)
        if tenant is None:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("حساب کاربری به شرکت متصل نیست.")
        serializer.save(tenant=tenant)
