from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tenants.querysets import for_user_tenant
from apps.users.models import User
from apps.users.permissions import require_roles

from . import services
from .models import ExchangeRate, ProformaInvoice
from .serializers import (
    ExchangeRateSerializer,
    IssueProformaSerializer,
    ProformaInvoiceSerializer,
)


def _error(message, code="VALIDATION_ERROR", http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "error": {"code": code, "message": message}},
        status=http_status,
    )


class ExchangeRateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer


class ProformaInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProformaInvoiceSerializer

    def get_queryset(self):
        queryset = for_user_tenant(
            ProformaInvoice.objects.select_related("order").prefetch_related("lines"),
            self.request.user,
            lookup="order__tenant_id",
            agent_lookup="order__contract__agent_id",
        )
        order_id = self.request.query_params.get("order")
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        return queryset


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_proforma(request):
    """POST /api/proforma-invoices/issue/   {"order": <id>}"""
    require_roles(
        request.user,
        User.Role.SUPER_ADMIN,
        User.Role.FINANCE,
        User.Role.SALES_MANAGER,
        User.Role.SALES_EXPERT,
    )
    input_serializer = IssueProformaSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)

    try:
        order = input_serializer.validated_data["order"]
        if not request.user.is_superuser and order.tenant_id != request.user.tenant_id:
            from django.http import Http404

            raise Http404
        proforma = services.issue_proforma_invoice(
            order=order
        )
    except services.ProformaAlreadyIssuedError as exc:
        return _error(str(exc), code="PROFORMA_ALREADY_ISSUED", http_status=409)
    except services.ExchangeRateNotFoundError as exc:
        return _error(str(exc), code="EXCHANGE_RATE_MISSING", http_status=409)

    return Response(
        {"success": True, "data": ProformaInvoiceSerializer(proforma).data},
        status=status.HTTP_201_CREATED,
    )
