"""
سرویس‌های قیمت‌گذاری.
"""

import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.finance import services as finance_services

from .models import ExchangeRate, ProformaInvoice, ProformaInvoiceLine

DEFAULT_TAX_RATE = Decimal("0.10")
PROFORMA_VALIDITY_DAYS = 3


class ExchangeRateNotFoundError(Exception):
    """برای ارز موردنیاز هیچ نرخی ثبت نشده — نه امروز، نه هیچ روز قبل."""


class ProformaAlreadyIssuedError(Exception):
    """این سفارش قبلاً پیش‌فاکتور دارد؛ پیش‌فاکتور صادرشده تغییرناپذیر است."""


def get_latest_rate(currency: str, as_of=None) -> Decimal:
    """
    آخرین نرخ ثبت‌شده برای این ارز در تاریخ as_of یا قبل از آن.

    عمداً «آخرین نرخ قبل از تاریخ» را برمی‌گردانیم، نه فقط «نرخ دقیقاً
    امروز» — چون در آخر هفته یا تعطیلی ممکن است نرخ جدید ثبت نشده باشد و
    نباید کل سیستم صدور پیش‌فاکتور متوقف شود.
    """
    if currency == "IRT":
        return Decimal("1.0000")

    as_of = as_of or timezone.now().date()
    rate = (
        ExchangeRate.objects.filter(currency=currency, rate_date__lte=as_of)
        .order_by("-rate_date")
        .first()
    )
    if not rate:
        raise ExchangeRateNotFoundError(
            f"هیچ نرخ ثبت‌شده‌ای برای ارز {currency} تا تاریخ {as_of} وجود ندارد."
        )
    return rate.rate_to_irt


def set_exchange_rate(*, currency: str, rate_to_irt: Decimal, rate_date=None) -> ExchangeRate:
    """ثبت یا به‌روزرسانی نرخ ارز یک روز مشخص (پیش‌فرض: امروز)."""
    rate_date = rate_date or timezone.now().date()
    obj, _ = ExchangeRate.objects.update_or_create(
        currency=currency,
        rate_date=rate_date,
        defaults={"rate_to_irt": rate_to_irt},
    )
    return obj


def _generate_proforma_number() -> str:
    year = timezone.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"PF-{year}-{suffix}"


@transaction.atomic
def issue_proforma_invoice(*, order, tax_rate: Decimal = DEFAULT_TAX_RATE) -> ProformaInvoice:
    """
    صدور پیش‌فاکتور برای یک سفارش.

    هر ProformaInvoiceLine همه چیزی که برای محاسبه لازم است را از
    OrderItem کپی و منجمد می‌کند: قیمت واحد سفارش (که خودش از قبل یک
    Snapshot سبک از لحظه ثبت سفارش است)، نرخ ارز *همین لحظه*، و مالیات.
    بعد از این تابع، هیچ تغییر قیمتی در جای دیگر سیستم روی این پیش‌فاکتور
    اثر نمی‌گذارد.
    """
    if hasattr(order, "proforma_invoice"):
        raise ProformaAlreadyIssuedError(
            f"سفارش {order.order_number} قبلاً پیش‌فاکتور "
            f"{order.proforma_invoice.number} را دارد."
        )

    proforma = ProformaInvoice.objects.create(
        order=order,
        number=_generate_proforma_number(),
        tax_rate=tax_rate,
        subtotal_irt=Decimal("0"),
        tax_amount_irt=Decimal("0"),
        total_irt=Decimal("0"),
        valid_until=timezone.now() + timezone.timedelta(days=PROFORMA_VALIDITY_DAYS),
    )

    subtotal_total = Decimal("0")
    tax_total = Decimal("0")

    for item in order.items.select_related("variant"):
        rate = get_latest_rate(item.currency)
        unit_price_irt = (item.unit_price * rate).quantize(Decimal("0.0001"))
        line_subtotal = (unit_price_irt * item.quantity).quantize(Decimal("0.0001"))
        line_tax = (line_subtotal * tax_rate).quantize(Decimal("0.0001"))
        line_total = line_subtotal + line_tax

        ProformaInvoiceLine.objects.create(
            proforma=proforma,
            variant=item.variant,
            description=item.variant.display_title,
            quantity=item.quantity,
            unit_price_original=item.unit_price,
            currency_original=item.currency,
            exchange_rate_applied=rate,
            unit_price_irt=unit_price_irt,
            line_subtotal_irt=line_subtotal,
            line_tax_irt=line_tax,
            line_total_irt=line_total,
        )

        subtotal_total += line_subtotal
        tax_total += line_tax

    proforma.subtotal_irt = subtotal_total
    proforma.tax_amount_irt = tax_total
    proforma.total_irt = subtotal_total + tax_total
    proforma.save(update_fields=["subtotal_irt", "tax_amount_irt", "total_irt"])

    finance_services.record_debit(
        contract=order.contract,
        amount_irt=proforma.total_irt,
        reference=proforma.number,
        note="صدور پیش‌فاکتور",
    )

    return proforma
