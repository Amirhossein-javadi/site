from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from . import services
from .models import Payment
from .serializers import (
    CreatePaymentIntentSerializer,
    PaymentSerializer,
    VerifyPaymentSerializer,
)


def _error(message, code="VALIDATION_ERROR", http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "error": {"code": code, "message": message}},
        status=http_status,
    )


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related("proforma", "proforma__order")
    serializer_class = PaymentSerializer

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """
        POST /api/payments/{id}/verify/   {"outcome": "success"}

        در دنیای واقعی این همان چیزی است که Webhook درگاه یا صفحه بازگشت
        کاربر صدا می‌زند؛ اینجا برای محیط توسعه دستی صدا زده می‌شود.
        """
        payment = self.get_object()
        input_serializer = VerifyPaymentSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        payment = services.verify_payment(
            payment=payment, callback_data=input_serializer.validated_data
        )
        return Response({"success": True, "data": PaymentSerializer(payment).data})


@api_view(["POST"])
def create_payment_intent(request):
    """POST /api/payments/create/"""
    input_serializer = CreatePaymentIntentSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)
    payload = input_serializer.validated_data

    try:
        payment = services.create_payment_intent(
            proforma=payload["proforma"],
            idempotency_key=payload["idempotency_key"],
            gateway=payload.get("gateway", "mock"),
        )
    except services.ProformaNotPayableError as exc:
        return _error(str(exc), code="PROFORMA_NOT_PAYABLE", http_status=409)
    except services.ProformaExpiredError as exc:
        return _error(str(exc), code="PROFORMA_EXPIRED", http_status=409)
    except services.AlreadyPaidError as exc:
        return _error(str(exc), code="ALREADY_PAID", http_status=409)
    except ValueError as exc:
        return _error(str(exc))

    return Response(
        {"success": True, "data": PaymentSerializer(payment).data},
        status=status.HTTP_201_CREATED,
    )
