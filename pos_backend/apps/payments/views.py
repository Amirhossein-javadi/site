from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from apps.tenants.querysets import for_user_tenant

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
    serializer_class = PaymentSerializer

    def get_queryset(self):
        queryset = for_user_tenant(
            Payment.objects.select_related("proforma", "proforma__order"),
            self.request.user,
            lookup="proforma__order__tenant_id",
        )
        proforma_id = self.request.query_params.get("proforma")
        order_id = self.request.query_params.get("order")
        if proforma_id:
            queryset = queryset.filter(proforma_id=proforma_id)
        if order_id:
            queryset = queryset.filter(proforma__order_id=order_id)
        return queryset

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

    if (
        not request.user.is_superuser
        and payload["proforma"].order.tenant_id != request.user.tenant_id
    ):
        from django.http import Http404

        raise Http404
    reused_key = Payment.objects.filter(
        idempotency_key=payload["idempotency_key"]
    ).select_related("proforma__order").first()
    if reused_key and reused_key.proforma_id != payload["proforma"].pk:
        return _error(
            "این کلید درخواست برای پیش‌فاکتور دیگری استفاده شده است.",
            "IDEMPOTENCY_KEY_USED",
            409,
        )
    if (
        reused_key
        and not request.user.is_superuser
        and reused_key.proforma.order.tenant_id != request.user.tenant_id
    ):
        return _error("کلید درخواست پرداخت قبلاً استفاده شده است.", "IDEMPOTENCY_KEY_USED", 409)

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
