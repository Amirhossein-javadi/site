"""
سرویس‌های پرداخت.
"""

from django.db import transaction
from django.utils import timezone

from apps.finance import services as finance_services
from apps.orders import services as orders_services
from apps.orders.models import Order
from apps.pricing.models import ProformaInvoice

from .gateways import get_gateway, new_reference
from .models import Payment


class ProformaNotPayableError(Exception):
    """پیش‌فاکتور در وضعیتی نیست که بتوان برایش پرداخت شروع کرد."""


class ProformaExpiredError(Exception):
    """اعتبار پیش‌فاکتور تمام شده — باید پیش‌فاکتور جدید صادر شود."""


class AlreadyPaidError(Exception):
    """این پیش‌فاکتور قبلاً با موفقیت پرداخت شده است."""


class AmountMismatchError(Exception):
    """مبلغ تاییدشده توسط درگاه با مبلغ پیش‌فاکتور یکی نیست."""


@transaction.atomic
def create_payment_intent(*, proforma: ProformaInvoice, idempotency_key: str, gateway: str = "mock") -> Payment:
    """
    شروع یک تلاش پرداخت.

    اگر idempotency_key قبلاً استفاده شده، همان Payment قبلی برگردانده
    می‌شود — این یعنی اگر کلاینت به‌خاطر Timeout دوباره همان درخواست را
    بفرستد، دو Payment جدا و دو بار کسر پول رخ نمی‌دهد.
    """
    existing = Payment.objects.filter(idempotency_key=idempotency_key).first()
    if existing:
        return existing

    if proforma.status != ProformaInvoice.Status.ISSUED:
        raise ProformaNotPayableError(
            f"پیش‌فاکتور {proforma.number} در وضعیت قابل پرداخت نیست."
        )
    if proforma.is_expired:
        raise ProformaExpiredError(
            f"اعتبار پیش‌فاکتور {proforma.number} در {proforma.valid_until} تمام شده است."
        )
    if Payment.objects.filter(proforma=proforma, status=Payment.Status.SUCCEEDED).exists():
        raise AlreadyPaidError(f"پیش‌فاکتور {proforma.number} قبلاً پرداخت شده است.")

    reference = new_reference()
    gw = get_gateway(gateway)
    result = gw.start_payment(amount_irt=proforma.total_irt, reference=reference)

    return Payment.objects.create(
        proforma=proforma,
        gateway=gateway,
        gateway_reference=result.reference,
        idempotency_key=idempotency_key,
        amount_irt=proforma.total_irt,
        redirect_url=result.redirect_url or "",
        status=Payment.Status.PENDING,
    )


@transaction.atomic
def verify_payment(*, payment: Payment, callback_data: dict) -> Payment:
    """
    اعتبارسنجی نتیجه پرداخت (از Callback درگاه یا صفحه بازگشت کاربر).

    Idempotent: اگر این پرداخت قبلاً به وضعیت نهایی (موفق/ناموفق) رسیده،
    دوباره پردازش نمی‌شود — یعنی اگر Webhook درگاه دو بار برسد (که رایج
    است)، دو بار سفارش تایید یا دو بار موجودی تغییر نمی‌کند.

    اگر مبلغ اعلام‌شده در callback با مبلغ پرداخت یکی نباشد، صرف‌نظر از
    این‌که درگاه «موفق» گفته یا نه، پرداخت ناموفق ثبت می‌شود — طبق قانون
    امنیتی «مبلغ پرداخت‌شده باید با مبلغ سفارش مقایسه شود».
    """
    payment = Payment.objects.select_for_update().get(pk=payment.pk)

    if payment.status in (Payment.Status.SUCCEEDED, Payment.Status.FAILED):
        return payment

    gw = get_gateway(payment.gateway)
    result = gw.verify(reference=payment.gateway_reference, callback_data=callback_data)

    reported_amount = callback_data.get("amount_irt") if callback_data else None
    amount_ok = reported_amount is None or str(reported_amount) == str(payment.amount_irt)

    if result.success and amount_ok:
        payment.status = Payment.Status.SUCCEEDED
        payment.verified_at = timezone.now()
        payment.save(update_fields=["status", "verified_at"])

        finance_services.record_credit(
            contract=payment.proforma.order.contract,
            amount_irt=payment.amount_irt,
            reference=payment.gateway_reference,
            note="پرداخت موفق",
        )
        _auto_confirm_order(payment.proforma.order)
    else:
        payment.status = Payment.Status.FAILED
        payment.verified_at = timezone.now()
        payment.save(update_fields=["status", "verified_at"])

    return payment


def _auto_confirm_order(order: Order):
    """
    پس از پرداخت موفق، سفارش را در صورت امکان خودکار به «تایید شده»
    می‌برد. اگر سفارش از قبل در وضعیت دیگری بود (مثلاً یک ادمین دستی
    تغییرش داده)، این خطا را نادیده می‌گیریم — پرداخت موفق شده و این
    مهم‌ترین چیز است؛ ناهماهنگی وضعیت سفارش یک تصمیم دستی مدیر است، نه
    چیزی که پرداخت باید رویش بجنگد.
    """
    if order.status != Order.Status.PENDING:
        return
    try:
        orders_services.transition_status(
            order=order,
            to_status=Order.Status.CONFIRMED,
            note="تایید خودکار پس از پرداخت موفق",
        )
    except orders_services.InvalidTransitionError:
        pass
