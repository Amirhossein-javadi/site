"""Business rules for shipment tracking and return intake."""

from uuid import uuid4

from django.db import transaction
from django.utils import timezone

from apps.inventory import services as inventory_services

from .models import Order, ReturnItem, ReturnRequest, Shipment


class ReturnWorkflowError(Exception):
    """A return request cannot make the requested state transition."""


@transaction.atomic
def create_return_request(*, order, items, reason, notes="", user=None):
    order = Order.objects.select_for_update().select_related("tenant").get(pk=order.pk)
    if order.status not in (Order.Status.SHIPPED, Order.Status.DELIVERED):
        raise ReturnWorkflowError("فقط سفارش ارسال‌شده یا تحویل‌شده قابل مرجوعی است.")
    if not items:
        raise ValueError("درخواست مرجوعی باید حداقل یک قلم داشته باشد.")

    active_returns = order.returns.exclude(status=ReturnRequest.Status.REJECTED)
    prior_items = list(
        ReturnItem.objects.filter(return_request__in=active_returns)
        .select_related("order_item")
    )
    prior_quantities = {}
    prior_serials = set()
    for prior in prior_items:
        prior_quantities[prior.order_item_id] = (
            prior_quantities.get(prior.order_item_id, 0) + prior.quantity
        )
        prior_serials.update(prior.serial_numbers or [])

    seen_order_items = set()
    request_serials = set()
    for entry in items:
        order_item = entry["order_item"]
        quantity = entry["quantity"]
        serial_numbers = list(entry.get("serial_numbers", []))
        if order_item.order_id != order.pk:
            raise ValueError("قلم انتخاب‌شده متعلق به این سفارش نیست.")
        if order_item.pk in seen_order_items:
            raise ValueError("هر قلم سفارش را فقط یک‌بار در درخواست مرجوعی وارد کنید.")
        seen_order_items.add(order_item.pk)
        if prior_quantities.get(order_item.pk, 0) + quantity > order_item.quantity:
            raise ValueError(
                f"تعداد مرجوعی {order_item.variant.sku} از تعداد ارسال‌شده بیشتر است."
            )

        if order_item.variant.requires_serial:
            if len(serial_numbers) != quantity or len(set(serial_numbers)) != quantity:
                raise ValueError("برای هر دستگاه مرجوعی باید سریال یکتا وارد شود.")
            if not set(serial_numbers).issubset(set(order_item.serial_numbers or [])):
                raise ValueError("سریال واردشده در میان دستگاه‌های این سفارش نیست.")
            if request_serials.intersection(serial_numbers) or prior_serials.intersection(serial_numbers):
                raise ValueError("یک یا چند سریال قبلاً در درخواست مرجوعی ثبت شده است.")
            request_serials.update(serial_numbers)
        elif serial_numbers:
            raise ValueError("برای این کالا نیازی به ثبت سریال نیست.")

    request = ReturnRequest.objects.create(
        tenant=order.tenant,
        order=order,
        return_number=f"RET-{uuid4().hex[:10].upper()}",
        reason=reason,
        notes=notes,
        requested_by=user,
    )
    ReturnItem.objects.bulk_create(
        [
            ReturnItem(
                return_request=request,
                order_item=entry["order_item"],
                quantity=entry["quantity"],
                serial_numbers=list(entry.get("serial_numbers", [])),
                condition=entry.get("condition", ReturnItem.Condition.RESTOCK),
            )
            for entry in items
        ]
    )
    return request


@transaction.atomic
def decide_return(*, return_request, approved, user=None, note=""):
    request = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if request.status != ReturnRequest.Status.REQUESTED:
        raise ReturnWorkflowError("این درخواست قبلاً بررسی شده است.")
    request.status = (
        ReturnRequest.Status.APPROVED if approved else ReturnRequest.Status.REJECTED
    )
    request.resolved_by = user
    request.resolved_at = timezone.now()
    request.decision_note = note
    request.save(
        update_fields=["status", "resolved_by", "resolved_at", "decision_note"]
    )
    return request


@transaction.atomic
def receive_return(*, return_request, user=None):
    request = ReturnRequest.objects.select_for_update().select_related("order").get(
        pk=return_request.pk
    )
    if request.status != ReturnRequest.Status.APPROVED:
        raise ReturnWorkflowError("برای دریافت کالا، درخواست باید ابتدا تأیید شود.")

    for item in request.items.select_related("order_item", "order_item__variant"):
        inventory_services.receive_return(
            warehouse=request.order.warehouse,
            variant=item.order_item.variant,
            quantity=item.quantity,
            serial_numbers=item.serial_numbers,
            restock=item.condition == ReturnItem.Condition.RESTOCK,
            reference=request.return_number,
            note=f"مرجوعی سفارش {request.order.order_number}",
            user=user,
        )

    request.status = ReturnRequest.Status.RECEIVED
    request.received_at = timezone.now()
    request.save(update_fields=["status", "received_at"])
    return request


@transaction.atomic
def deliver_shipment(*, shipment, user=None):
    shipment = Shipment.objects.select_for_update().select_related("order").get(
        pk=shipment.pk
    )
    if shipment.status == Shipment.Status.DELIVERED:
        return shipment
    from . import services as order_services

    order_services.transition_status(
        order=shipment.order,
        to_status=Order.Status.DELIVERED,
        user=user,
        note="تحویل مرسوله ثبت شد",
    )
    return Shipment.objects.get(pk=shipment.pk)
