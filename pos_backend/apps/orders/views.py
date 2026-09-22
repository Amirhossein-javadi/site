from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from apps.inventory.services import InsufficientStockError, SerialConflictError

from . import services
from .models import Order
from .serializers import (
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    TransitionInputSerializer,
)


def _error(message, code="VALIDATION_ERROR", http_status=status.HTTP_400_BAD_REQUEST):
    """همان فرمت خطای یکنواخت که در inventory هم استفاده شده."""
    return Response(
        {"success": False, "error": {"code": code, "message": message}},
        status=http_status,
    )


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    فهرست/جزئیات سفارش‌ها، به‌علاوه سه اکشن برای چرخه عمر سفارش:
    create (ثبت)، cancel (لغو)، transition (تغییر وضعیت دلخواه مجاز).

    عمداً از ModelViewSet استفاده نشده — ثبت و تغییر سفارش نباید از مسیر
    استاندارد POST/PATCH انجام شود، چون آن مسیر منطق کسب‌وکار (رزرو،
    اعتبارسنجی قرارداد) را دور می‌زند. فقط از اکشن‌های زیر که به
    services.py وصل‌اند.
    """

    filter_backends = [SearchFilter]
    search_fields = ["order_number", "contract__number"]

    def get_queryset(self):
        qs = Order.objects.select_related("contract", "warehouse")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            qs = qs.filter(contract_id=contract_id)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OrderDetailSerializer
        return OrderListSerializer

    def create(self, request):
        """POST /api/orders/  — ثبت سفارش جدید."""
        input_serializer = OrderCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        payload = input_serializer.validated_data

        try:
            order = services.place_order(
                contract=payload["contract"],
                warehouse=payload["warehouse"],
                items=[
                    {"variant": i["variant"], "quantity": i["quantity"]}
                    for i in payload["items"]
                ],
                notes=payload.get("notes", ""),
                user=request.user if request.user.is_authenticated else None,
            )
        except services.ContractNotValidError as exc:
            return _error(str(exc), code="CONTRACT_NOT_VALID", http_status=409)
        except services.DeviceCapExceededError as exc:
            return _error(str(exc), code="DEVICE_CAP_EXCEEDED", http_status=409)
        except (InsufficientStockError, SerialConflictError) as exc:
            return _error(str(exc), code="INSUFFICIENT_STOCK", http_status=409)
        except ValueError as exc:
            return _error(str(exc))

        return Response(
            {"success": True, "data": OrderDetailSerializer(order).data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """POST /api/orders/{id}/cancel/"""
        order = self.get_object()
        try:
            order = services.cancel_order(
                order=order,
                user=request.user if request.user.is_authenticated else None,
                note=request.data.get("note", ""),
            )
        except services.InvalidTransitionError as exc:
            return _error(str(exc), code="INVALID_TRANSITION", http_status=409)

        return Response({"success": True, "data": OrderDetailSerializer(order).data})

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        """POST /api/orders/{id}/transition/   {"to_status": "confirmed"}"""
        order = self.get_object()
        input_serializer = TransitionInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        try:
            order = services.transition_status(
                order=order,
                to_status=input_serializer.validated_data["to_status"],
                user=request.user if request.user.is_authenticated else None,
                note=input_serializer.validated_data.get("note", ""),
            )
        except services.InvalidTransitionError as exc:
            return _error(str(exc), code="INVALID_TRANSITION", http_status=409)
        except (InsufficientStockError, SerialConflictError) as exc:
            return _error(str(exc), code="INSUFFICIENT_STOCK", http_status=409)

        return Response({"success": True, "data": OrderDetailSerializer(order).data})
