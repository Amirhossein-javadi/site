from django.db.models import Count
from django.db.models.deletion import ProtectedError
from rest_framework import mixins, status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tenants.models import AgentCompany

from .serializers import CustomerSerializer


class CustomerViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """مشتریان سامانه همان شرکت‌های نماینده متصل به قراردادها هستند."""

    serializer_class = CustomerSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = getattr(self.request.user, "tenant_id", None)
        queryset = AgentCompany.objects.annotate(contracts_count=Count("contracts"))
        if tenant_id is None:
            return queryset.none()
        queryset = queryset.filter(tenant_id=tenant_id)
        active = self.request.query_params.get("is_active")
        if active in ("true", "false"):
            queryset = queryset.filter(is_active=(active == "true"))
        return queryset

    def perform_create(self, serializer):
        tenant = getattr(self.request.user, "tenant", None)
        if tenant is None:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("حساب کاربری به شرکت متصل نیست.")
        serializer.save(tenant=tenant)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.contracts.exists():
            return Response(
                {"detail": "این مشتری قرارداد دارد و قابل حذف نیست؛ وضعیت آن را غیرفعال کنید."},
                status=status.HTTP_409_CONFLICT,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            # رابطه محافظت‌شده ممکن است بین بررسی بالا و حذف ایجاد شده باشد.
            return Response(
                {"detail": "این مشتری قرارداد دارد و قابل حذف نیست؛ وضعیت آن را غیرفعال کنید."},
                status=status.HTTP_409_CONFLICT,
            )
