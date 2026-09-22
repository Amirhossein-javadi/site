from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
    queryset = ProformaInvoice.objects.select_related("order").prefetch_related("lines")
    serializer_class = ProformaInvoiceSerializer


@api_view(["POST"])
def issue_proforma(request):
    """POST /api/proforma-invoices/issue/   {"order": <id>}"""
    input_serializer = IssueProformaSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)

    try:
        proforma = services.issue_proforma_invoice(
            order=input_serializer.validated_data["order"]
        )
    except services.ProformaAlreadyIssuedError as exc:
        return _error(str(exc), code="PROFORMA_ALREADY_ISSUED", http_status=409)
    except services.ExchangeRateNotFoundError as exc:
        return _error(str(exc), code="EXCHANGE_RATE_MISSING", http_status=409)

    return Response(
        {"success": True, "data": ProformaInvoiceSerializer(proforma).data},
        status=status.HTTP_201_CREATED,
    )
