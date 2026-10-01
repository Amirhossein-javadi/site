from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from apps.inventory.services import SerialConflictError
from apps.tenants.querysets import for_user_tenant

from . import fulfillment
from .fulfillment_serializers import (
    CreateReturnSerializer,
    ReturnDecisionSerializer,
    ReturnRequestSerializer,
    ShipmentSerializer,
)
from .models import ReturnRequest, Shipment
from .services import InvalidTransitionError


def _error(message, code="VALIDATION_ERROR", http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "error": {"code": code, "message": message}},
        status=http_status,
    )


class ShipmentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Shipment tracking data; delivery changes the linked order lifecycle."""

    serializer_class = ShipmentSerializer
    filter_backends = [SearchFilter]
    search_fields = ["order__order_number", "tracking_number", "carrier"]

    def get_queryset(self):
        queryset = for_user_tenant(
            Shipment.objects.select_related("order", "order__contract"), self.request.user
        )
        status_filter = self.request.query_params.get("status")
        if status_filter in Shipment.Status.values:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        shipment = self.get_object()
        try:
            shipment = fulfillment.deliver_shipment(
                shipment=shipment, user=request.user
            )
        except InvalidTransitionError as exc:
            return _error(str(exc), "INVALID_TRANSITION", status.HTTP_409_CONFLICT)
        return Response({"success": True, "data": ShipmentSerializer(shipment).data})


class ReturnRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Return request, decision and warehouse intake endpoints."""

    serializer_class = ReturnRequestSerializer
    filter_backends = [SearchFilter]
    search_fields = ["return_number", "order__order_number", "reason"]

    def get_queryset(self):
        queryset = for_user_tenant(
            ReturnRequest.objects.select_related("order", "requested_by")
            .prefetch_related("items", "items__order_item", "items__order_item__variant"),
            self.request.user,
        )
        status_filter = self.request.query_params.get("status")
        if status_filter in ReturnRequest.Status.values:
            queryset = queryset.filter(status=status_filter)
        order_id = self.request.query_params.get("order")
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        return queryset

    def create(self, request, *args, **kwargs):
        input_serializer = CreateReturnSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        payload = input_serializer.validated_data
        if (
            not request.user.is_superuser
            and payload["order"].tenant_id != request.user.tenant_id
        ):
            from django.http import Http404

            raise Http404
        try:
            instance = fulfillment.create_return_request(
                order=payload["order"],
                items=payload["items"],
                reason=payload["reason"],
                notes=payload.get("notes", ""),
                user=request.user,
            )
        except fulfillment.ReturnWorkflowError as exc:
            return _error(str(exc), "RETURN_NOT_ALLOWED", status.HTTP_409_CONFLICT)
        except ValueError as exc:
            return _error(str(exc))
        return Response(
            {"success": True, "data": ReturnRequestSerializer(instance).data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._decide(request, approved=True)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._decide(request, approved=False)

    def _decide(self, request, *, approved):
        instance = self.get_object()
        input_serializer = ReturnDecisionSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        try:
            instance = fulfillment.decide_return(
                return_request=instance,
                approved=approved,
                user=request.user,
                note=input_serializer.validated_data["note"],
            )
        except fulfillment.ReturnWorkflowError as exc:
            return _error(str(exc), "RETURN_NOT_ALLOWED", status.HTTP_409_CONFLICT)
        return Response({"success": True, "data": ReturnRequestSerializer(instance).data})

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        instance = self.get_object()
        try:
            instance = fulfillment.receive_return(
                return_request=instance, user=request.user
            )
        except fulfillment.ReturnWorkflowError as exc:
            return _error(str(exc), "RETURN_NOT_ALLOWED", status.HTTP_409_CONFLICT)
        except (ValueError, SerialConflictError) as exc:
            return _error(str(exc), "RETURN_INTAKE_FAILED", status.HTTP_409_CONFLICT)
        return Response({"success": True, "data": ReturnRequestSerializer(instance).data})
