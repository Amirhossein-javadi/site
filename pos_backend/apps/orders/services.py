"""
سرویس‌های سفارش.

قانون همیشگی این پروژه اینجا هم برقرار است: هیچ View نباید مستقیم Order
بسازد یا وضعیتش را عوض کند. همه از این توابع عبور می‌کنند.
"""

import uuid

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.inventory import services as inventory_services
from apps.inventory.models import Warehouse

from .models import Order, OrderItem, OrderStatusHistory


class ContractNotValidError(Exception):
    """قرارداد فعال نیست یا منقضی شده — طبق قانون کسب‌وکار، ثبت سفارش ممنوع است."""


class DeviceCapExceededError(Exception):
    """سقف تعداد دستگاه قرارداد با این سفارش رد می‌شود."""


class InvalidTransitionError(Exception):
    """تغییر وضعیت درخواستی از وضعیت فعلی مجاز نیست."""


# نقشه گذارهای مجاز؛ کلید = وضعیت فعلی، مقدار = وضعیت‌های بعدی مجاز
_ALLOWED_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
    Order.Status.CONFIRMED: {Order.Status.PROCESSING, Order.Status.CANCELLED},
    Order.Status.PROCESSING: {Order.Status.SHIPPED, Order.Status.CANCELLED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}


def _generate_order_number(tenant) -> str:
    """
    شماره سفارش خوانا برای انسان: ORD-<سال>-<شمارنده>.
    از UUID کوتاه به‌عنوان بخش پایانی استفاده می‌کنیم تا زیر بار همزمانی
    (دو سفارش در یک لحظه) هم تصادم شماره رخ ندهد — به‌جای شمارش دستی که
    خودش نیاز به قفل جداگانه دارد.
    """
    year = timezone.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{year}-{suffix}"


def _validate_device_cap(contract, requested_qty: int, *, exclude_order_id=None):
    """
    مجموع تعداد دستگاه‌های سریال‌دار در سفارش‌های غیرلغوشده این قرارداد
    به‌علاوه تعداد درخواستی، نباید از device_cap قرارداد بیشتر شود.

    فقط اقلام سریال‌دار شمرده می‌شوند چون «سقف دستگاه» درباره کارتخوان
    است، نه لوازم جانبی مثل رول کاغذ.
    """
    qs = OrderItem.objects.filter(
        order__contract=contract,
        variant__requires_serial=True,
    ).exclude(order__status=Order.Status.CANCELLED)

    if exclude_order_id:
        qs = qs.exclude(order_id=exclude_order_id)

    already_ordered = qs.aggregate(total=Sum("quantity"))["total"] or 0

    if already_ordered + requested_qty > contract.device_cap:
        remaining = max(contract.device_cap - already_ordered, 0)
        raise DeviceCapExceededError(
            f"سقف دستگاه این قرارداد {contract.device_cap} عدد است؛ "
            f"{already_ordered} عدد قبلاً سفارش داده شده و فقط {remaining} عدد "
            f"باقی مانده، اما {requested_qty} عدد درخواست شده."
        )


@transaction.atomic
def place_order(*, contract, warehouse: Warehouse, items: list, user=None, notes=""):
    """
    ثبت سفارش جدید.

    items: [{"variant": ProductVariant, "quantity": int}, ...]

    ترتیب کار عمداً این‌طور است: اول همه اعتبارسنجی‌های ارزان (قرارداد،
    سقف دستگاه)، بعد رزرو موجودی که گران‌ترین و قفل‌دارترین بخش است.
    اگر رزرو هر کدام از اقلام شکست بخورد، کل تراکنش (شامل اقلامی که قبلاً
    موفق رزرو شده بودند) برمی‌گردد — یا کل سفارش رزرو می‌شود یا هیچ‌کدام.
    """
    if not items:
        raise ValueError("سفارش باید حداقل یک قلم کالا داشته باشد.")

    if not contract.is_valid_for_ordering:
        raise ContractNotValidError(
            f"قرارداد {contract.number} فعال نیست یا منقضی شده است؛ "
            "بدون قرارداد معتبر ثبت سفارش ممکن نیست."
        )

    # اعتبارسنجی سقف دستگاه قبل از هرگونه رزرو
    serial_qty_requested = sum(
        i["quantity"] for i in items if i["variant"].requires_serial
    )
    if serial_qty_requested:
        _validate_device_cap(contract, serial_qty_requested)

    order = Order.objects.create(
        tenant=contract.tenant,
        order_number=_generate_order_number(contract.tenant),
        contract=contract,
        warehouse=warehouse,
        status=Order.Status.PENDING,
        notes=notes,
        created_by=user if (user and getattr(user, "is_authenticated", False)) else None,
    )
    OrderStatusHistory.objects.create(
        order=order, from_status="", to_status=Order.Status.PENDING, changed_by=user
    )

    for entry in items:
        variant = entry["variant"]
        quantity = entry["quantity"]

        # reserve_stock خودش select_for_update دارد و اگر موجودی کافی
        # نباشد InsufficientStockError می‌اندازد — همان‌جا کل تراکنش
        # برمی‌گردد، از جمله ساخت Order بالا.
        inventory_services.reserve_stock(
            warehouse=warehouse,
            variant=variant,
            quantity=quantity,
            reference=order.order_number,
            note="رزرو در زمان ثبت سفارش",
            user=user if (user and getattr(user, "is_authenticated", False)) else None,
        )

        OrderItem.objects.create(
            order=order,
            variant=variant,
            quantity=quantity,
            unit_price=variant.base_price,
            currency=variant.currency,
        )

    return order


@transaction.atomic
def transition_status(*, order: Order, to_status: str, user=None, note=""):
    """
    تغییر وضعیت سفارش طبق ماشین‌حالت بالا.

    اثرات جانبی:
      → SHIPPED    خروج قطعی موجودی از انبار (رزرو تبدیل به فروش می‌شود)
      → CANCELLED  آزادسازی رزرو (فقط اگر کالا هنوز خارج نشده باشد)
    """
    order = Order.objects.select_for_update().get(pk=order.pk)
    current = order.status

    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    if to_status not in allowed:
        raise InvalidTransitionError(
            f"تغییر وضعیت از «{order.get_status_display()}» به «{to_status}» مجاز نیست."
        )

    if to_status == Order.Status.SHIPPED:
        for item in order.items.select_related("variant"):
            inventory_services.issue_stock(
                warehouse=order.warehouse,
                variant=item.variant,
                quantity=item.quantity,
                reference=order.order_number,
                note="خروج کالا هنگام ارسال سفارش",
                user=user,
            )
        order.stock_issued_at = timezone.now()

    if to_status == Order.Status.CANCELLED:
        if not order.is_cancellable:
            raise InvalidTransitionError(
                "این سفارش دیگر قابل لغو نیست — کالا از انبار خارج شده است."
            )
        for item in order.items.select_related("variant"):
            inventory_services.release_reservation(
                warehouse=order.warehouse,
                variant=item.variant,
                quantity=item.quantity,
                reference=order.order_number,
                note="آزادسازی رزرو به دلیل لغو سفارش",
                user=user,
            )

    order.status = to_status
    order.save(update_fields=["status", "stock_issued_at", "updated_at"])

    OrderStatusHistory.objects.create(
        order=order, from_status=current, to_status=to_status, changed_by=user, note=note
    )
    return order


def cancel_order(*, order: Order, user=None, note=""):
    """میان‌بر خوانا برای رایج‌ترین حالت استفاده از transition_status."""
    return transition_status(
        order=order, to_status=Order.Status.CANCELLED, user=user, note=note
    )
