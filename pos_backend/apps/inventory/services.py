"""
سرویس‌های موجودی.

قانون: هیچ جای دیگری از پروژه نباید مستقیماً on_hand یا reserved را تغییر
دهد. همه تغییرات از این توابع عبور می‌کنند تا سه چیز تضمین شود:

1. قفل ردیف با select_for_update تا Race Condition رخ ندهد
2. ثبت خودکار در InventoryLedger
3. سازگاری شمارش تجمیعی با رکوردهای DeviceSerial
"""

from django.db import transaction

from apps.catalog.models import ProductVariant

from .models import DeviceSerial, InventoryItem, InventoryLedger, Warehouse


class InsufficientStockError(Exception):
    """موجودی قابل فروش برای انجام عملیات کافی نیست."""


class SerialConflictError(Exception):
    """سریال تکراری است یا در وضعیتی نیست که عملیات روی آن مجاز باشد."""


def _log(item, kind, quantity, reference="", note="", user=None):
    """ثبت یک ردیف در دفتر موجودی. فقط از داخل این ماژول صدا زده می‌شود."""
    InventoryLedger.objects.create(
        warehouse=item.warehouse,
        variant=item.variant,
        kind=kind,
        quantity=quantity,
        on_hand_after=item.on_hand,
        reserved_after=item.reserved,
        reference=reference,
        note=note,
        created_by=user,
    )


@transaction.atomic
def receive_stock(
    *, warehouse: Warehouse, variant: ProductVariant, quantity: int,
    serial_numbers=None, reference="", note="", user=None,
) -> InventoryItem:
    """
    ورود کالا به انبار.

    اگر نسخه محصول requires_serial باشد، تعداد سریال‌های داده‌شده باید دقیقاً
    برابر quantity باشد؛ در غیر این صورت شمارش تجمیعی و رکوردهای سریال از هم
    واگرا می‌شوند و کل سیستم رهگیری بی‌اعتبار می‌شود.
    """
    if quantity <= 0:
        raise ValueError("تعداد ورودی باید بزرگ‌تر از صفر باشد.")

    serial_numbers = list(serial_numbers or [])

    if variant.requires_serial:
        if len(serial_numbers) != quantity:
            raise SerialConflictError(
                f"برای این محصول ثبت سریال اجباری است: {quantity} سریال لازم است، "
                f"{len(serial_numbers)} سریال داده شد."
            )
        if len(set(serial_numbers)) != len(serial_numbers):
            raise SerialConflictError("در فهرست سریال‌های ورودی تکرار وجود دارد.")

        existing = set(
            DeviceSerial.objects.filter(serial_number__in=serial_numbers)
            .values_list("serial_number", flat=True)
        )
        if existing:
            raise SerialConflictError(
                "این سریال‌ها قبلاً ثبت شده‌اند: " + "، ".join(sorted(existing))
            )
    elif serial_numbers:
        raise SerialConflictError(
            "برای این محصول ثبت سریال فعال نیست، اما فهرست سریال ارسال شده است."
        )

    # قفل ردیف موجودی تا پایان تراکنش
    item, _ = InventoryItem.objects.get_or_create(warehouse=warehouse, variant=variant)
    item = InventoryItem.objects.select_for_update().get(pk=item.pk)

    if serial_numbers:
        DeviceSerial.objects.bulk_create(
            [
                DeviceSerial(
                    serial_number=sn,
                    variant=variant,
                    warehouse=warehouse,
                    status=DeviceSerial.Status.IN_STOCK,
                )
                for sn in serial_numbers
            ]
        )

    item.on_hand += quantity
    item.save(update_fields=["on_hand", "updated_at"])

    _log(item, InventoryLedger.Kind.RECEIPT, quantity, reference, note, user)
    return item


@transaction.atomic
def reserve_stock(
    *, warehouse: Warehouse, variant: ProductVariant, quantity: int,
    reference="", note="", user=None,
):
    """
    رزرو موجودی — هسته جلوگیری از Overselling.

    select_for_update ردیف InventoryItem را تا پایان تراکنش قفل می‌کند، پس
    دو درخواست هم‌زمان برای آخرین دستگاه، پشت سر هم اجرا می‌شوند و دومی
    با InsufficientStockError رد می‌شود.

    برای محصولات سریال‌دار، سریال‌های مشخصی هم به حالت رزرو می‌روند تا
    پذیرنده بتواند از همان لحظه ثبت سفارش، دستگاه‌های تخصیص‌یافته را ببیند.

    خروجی: (InventoryItem, لیست DeviceSerial رزروشده)
    """
    if quantity <= 0:
        raise ValueError("تعداد رزرو باید بزرگ‌تر از صفر باشد.")

    try:
        item = InventoryItem.objects.select_for_update().get(
            warehouse=warehouse, variant=variant
        )
    except InventoryItem.DoesNotExist:
        raise InsufficientStockError(
            f"هیچ موجودی‌ای از {variant.sku} در انبار {warehouse.code} ثبت نشده است."
        )

    if item.available < quantity:
        raise InsufficientStockError(
            f"موجودی کافی نیست: {item.available} عدد قابل فروش است، "
            f"{quantity} عدد درخواست شده."
        )

    reserved_serials = []
    if variant.requires_serial:
        # قفل روی خود ردیف‌های سریال تا دو تراکنش هم‌زمان یک سریال را نگیرند
        serial_qs = (
            DeviceSerial.objects.select_for_update()
            .filter(
                variant=variant,
                warehouse=warehouse,
                status=DeviceSerial.Status.IN_STOCK,
            )
            .order_by("received_at")[:quantity]
        )
        reserved_serials = list(serial_qs)

        if len(reserved_serials) < quantity:
            # شمارش تجمیعی و رکوردهای سریال ناسازگارند — بهتر است تراکنش
            # برگردد تا داده اشتباه ثبت شود.
            raise InsufficientStockError(
                f"تعداد سریال‌های قابل تخصیص ({len(reserved_serials)}) کمتر از "
                f"درخواست ({quantity}) است."
            )

        DeviceSerial.objects.filter(
            pk__in=[s.pk for s in reserved_serials]
        ).update(status=DeviceSerial.Status.RESERVED)

    item.reserved += quantity
    item.save(update_fields=["reserved", "updated_at"])

    _log(item, InventoryLedger.Kind.RESERVE, 0, reference, note, user)
    return item, reserved_serials


@transaction.atomic
def release_reservation(
    *, warehouse: Warehouse, variant: ProductVariant, quantity: int,
    serial_numbers=None, reference="", note="", user=None,
) -> InventoryItem:
    """
    آزادسازی رزرو — مثلاً وقتی سفارش لغو می‌شود یا مهلت پرداخت می‌گذرد.
    """
    if quantity <= 0:
        raise ValueError("تعداد آزادسازی باید بزرگ‌تر از صفر باشد.")

    item = InventoryItem.objects.select_for_update().get(
        warehouse=warehouse, variant=variant
    )

    if item.reserved < quantity:
        raise InsufficientStockError(
            f"مقدار رزرو فعلی ({item.reserved}) کمتر از مقدار آزادسازی "
            f"({quantity}) است."
        )

    if variant.requires_serial:
        qs = DeviceSerial.objects.select_for_update().filter(
            variant=variant, warehouse=warehouse, status=DeviceSerial.Status.RESERVED
        )
        if serial_numbers:
            qs = qs.filter(serial_number__in=list(serial_numbers))
        target_ids = list(qs.values_list("pk", flat=True)[:quantity])
        DeviceSerial.objects.filter(pk__in=target_ids).update(
            status=DeviceSerial.Status.IN_STOCK
        )

    item.reserved -= quantity
    item.save(update_fields=["reserved", "updated_at"])

    _log(item, InventoryLedger.Kind.RELEASE, 0, reference, note, user)
    return item


@transaction.atomic
def issue_stock(
    *, warehouse: Warehouse, variant: ProductVariant, quantity: int,
    serial_numbers=None, reference="", note="", user=None,
) -> InventoryItem:
    """
    خروج قطعی کالا از انبار (تحویل به پذیرنده).

    رزرو قبلی را به فروش تبدیل می‌کند: هم از on_hand و هم از reserved کم
    می‌شود و سریال‌ها به وضعیت «فروخته شده» می‌روند.
    """
    if quantity <= 0:
        raise ValueError("تعداد خروج باید بزرگ‌تر از صفر باشد.")

    item = InventoryItem.objects.select_for_update().get(
        warehouse=warehouse, variant=variant
    )

    if item.reserved < quantity or item.on_hand < quantity:
        raise InsufficientStockError(
            "خروج کالا فقط از موجودی رزروشده ممکن است؛ مقادیر فعلی کافی نیست."
        )

    if variant.requires_serial:
        qs = DeviceSerial.objects.select_for_update().filter(
            variant=variant, warehouse=warehouse, status=DeviceSerial.Status.RESERVED
        )
        if serial_numbers:
            qs = qs.filter(serial_number__in=list(serial_numbers))
        target_ids = list(qs.values_list("pk", flat=True)[:quantity])
        if len(target_ids) < quantity:
            raise SerialConflictError(
                "تعداد سریال‌های رزروشده برای خروج کافی نیست."
            )
        DeviceSerial.objects.filter(pk__in=target_ids).update(
            status=DeviceSerial.Status.SOLD
        )

    item.on_hand -= quantity
    item.reserved -= quantity
    item.save(update_fields=["on_hand", "reserved", "updated_at"])

    _log(item, InventoryLedger.Kind.ISSUE, -quantity, reference, note, user)
    return item
