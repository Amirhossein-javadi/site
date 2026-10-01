from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from apps.catalog.models import ProductVariant
from apps.tenants.querysets import for_user_tenant

from . import services
from .models import DeviceSerial, InventoryItem, InventoryLedger, Warehouse
from .serializers import (
    DeviceSerialSerializer,
    InventoryItemSerializer,
    InventoryLedgerSerializer,
    WarehouseSerializer,
)


def _error(message, code="VALIDATION_ERROR", http_status=status.HTTP_400_BAD_REQUEST):
    """فرمت خطای یکنواخت مطابق استاندارد تعیین‌شده در سند معماری."""
    return Response(
        {"success": False, "error": {"code": code, "message": message}},
        status=http_status,
    )


class WarehouseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WarehouseSerializer

    def get_queryset(self):
        return for_user_tenant(
            Warehouse.objects.filter(is_active=True), self.request.user
        )


class InventoryItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    موجودی به تفکیک (انبار، نسخه محصول).

    فیلترهای اختیاری روی query string:
      ?warehouse=<id>   محدود کردن به یک انبار
      ?low_stock=true   فقط اقلامی که به نقطه سفارش مجدد رسیده‌اند
    """

    serializer_class = InventoryItemSerializer
    filter_backends = [SearchFilter]
    search_fields = ["variant__sku", "variant__product__name", "warehouse__name"]

    def get_queryset(self):
        qs = for_user_tenant(
            InventoryItem.objects.select_related(
                "warehouse", "variant", "variant__product"
            ),
            self.request.user,
            lookup="warehouse__tenant_id",
        )
        warehouse_id = self.request.query_params.get("warehouse")
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
        if self.request.query_params.get("low_stock") == "true":
            # مقایسه در پایتون ممکن نیست چون باید در SQL فیلتر شود
            from django.db.models import F

            qs = qs.filter(on_hand__lte=F("reserved") + F("reorder_point"))
        return qs

    @action(detail=False, methods=["post"], url_path="reserve")
    def reserve(self, request):
        """
        رزرو موجودی. بدنه درخواست:
          {"warehouse": 1, "variant": 3, "quantity": 2, "reference": "ORD-1001"}
        """
        return self._run_stock_action(request, services.reserve_stock, unpack=True)

    @action(detail=False, methods=["post"], url_path="release")
    def release(self, request):
        """آزادسازی رزرو — همان بدنه درخواست reserve."""
        return self._run_stock_action(request, services.release_reservation)

    @action(detail=False, methods=["post"], url_path="issue")
    def issue(self, request):
        """خروج قطعی کالا از موجودی رزروشده."""
        return self._run_stock_action(request, services.issue_stock)

    @action(detail=False, methods=["post"], url_path="receive")
    def receive(self, request):
        """ورود موجودی با ثبت دفتر و کنترل سریال در سرویس موجودی."""
        try:
            warehouse = get_object_or_404(
                for_user_tenant(Warehouse.objects.all(), request.user),
                pk=request.data.get("warehouse"),
            )
            variant = get_object_or_404(
                for_user_tenant(
                    ProductVariant.objects.select_related("product"), request.user,
                    lookup="product__tenant_id",
                ),
                pk=request.data.get("variant"),
            )
            quantity = int(request.data.get("quantity", 0))
            serial_numbers = request.data.get("serial_numbers", [])
            if not isinstance(serial_numbers, list) or not all(
                isinstance(number, str) for number in serial_numbers
            ):
                return _error("فهرست شماره‌سریال‌ها نامعتبر است.")
        except (TypeError, ValueError):
            return _error("پارامترهای ورودی نامعتبر است.")

        if not warehouse.is_active or warehouse.tenant_id != variant.product.tenant_id:
            return _error("انبار فعال و کالا باید متعلق به یک شرکت باشند.")
        try:
            item = services.receive_stock(
                warehouse=warehouse,
                variant=variant,
                quantity=quantity,
                serial_numbers=serial_numbers,
                reference=request.data.get("reference", ""),
                note=request.data.get("note", ""),
                user=request.user,
            )
        except services.SerialConflictError as exc:
            return _error(str(exc), code="SERIAL_CONFLICT", http_status=409)
        except ValueError as exc:
            return _error(str(exc))
        return Response({
            "success": True,
            "data": {"inventory": InventoryItemSerializer(item).data, "serials": []},
        }, status=status.HTTP_201_CREATED)

    def _run_stock_action(self, request, service_fn, unpack=False):
        """بدنه مشترک سه اکشن بالا — اعتبارسنجی ورودی و ترجمه خطاها."""
        try:
            warehouse = get_object_or_404(
                for_user_tenant(Warehouse.objects.all(), request.user),
                pk=request.data.get("warehouse"),
            )
            variant = get_object_or_404(
                for_user_tenant(
                    ProductVariant.objects.all(), request.user,
                    lookup="product__tenant_id",
                ),
                pk=request.data.get("variant"),
            )
            quantity = int(request.data.get("quantity", 0))
        except (TypeError, ValueError):
            return _error("پارامترهای ورودی نامعتبر است.")

        if not warehouse.is_active or warehouse.tenant_id != variant.product.tenant_id:
            return _error("انبار فعال و کالا باید متعلق به یک شرکت باشند.")

        try:
            result = service_fn(
                warehouse=warehouse,
                variant=variant,
                quantity=quantity,
                reference=request.data.get("reference", ""),
                note=request.data.get("note", ""),
                user=request.user if request.user.is_authenticated else None,
            )
        except services.InsufficientStockError as exc:
            return _error(str(exc), code="INSUFFICIENT_STOCK", http_status=409)
        except services.SerialConflictError as exc:
            return _error(str(exc), code="SERIAL_CONFLICT", http_status=409)
        except ValueError as exc:
            return _error(str(exc))

        item, serials = result if unpack else (result, [])
        return Response(
            {
                "success": True,
                "data": {
                    "inventory": InventoryItemSerializer(item).data,
                    "serials": DeviceSerialSerializer(serials, many=True).data,
                },
            }
        )


class DeviceSerialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    فهرست سریال دستگاه‌ها.

    فیلترها:  ?status=in_stock   ?warehouse=<id>
    """

    serializer_class = DeviceSerialSerializer
    filter_backends = [SearchFilter]
    search_fields = ["serial_number", "variant__sku", "variant__product__name"]

    def get_queryset(self):
        qs = for_user_tenant(
            DeviceSerial.objects.select_related(
                "warehouse", "variant", "variant__product"
            ),
            self.request.user,
            lookup="warehouse__tenant_id",
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        warehouse_id = self.request.query_params.get("warehouse")
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
        return qs


class InventoryLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """دفتر تغییرات موجودی — فقط خواندنی، چون append-only است."""

    serializer_class = InventoryLedgerSerializer
    def get_queryset(self):
        return for_user_tenant(
            InventoryLedger.objects.select_related(
                "warehouse", "variant", "created_by"
            ),
            self.request.user,
            lookup="warehouse__tenant_id",
        )
