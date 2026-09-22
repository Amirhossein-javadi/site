"""
انتزاع درگاه پرداخت.

هدف این فایل این است که روزی اتصال یک درگاه واقعی (زرین‌پال، سداد و...)
فقط یعنی «یک کلاس جدید بنویس که از BasePaymentGateway ارث می‌برد»،
بدون این‌که services.py یا views.py دست بخورند.
"""

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class GatewayResult:
    success: bool
    reference: str
    redirect_url: Optional[str] = None
    raw: dict = field(default_factory=dict)


class BasePaymentGateway(ABC):
    name: str = "base"

    @abstractmethod
    def start_payment(self, *, amount_irt: Decimal, reference: str) -> GatewayResult:
        """شروع پرداخت؛ باید یک GatewayResult با آدرس ریدایرکت برگرداند."""

    @abstractmethod
    def verify(self, *, reference: str, callback_data: dict) -> GatewayResult:
        """اعتبارسنجی نتیجه پرداخت پس از بازگشت کاربر یا Webhook."""


class MockGateway(BasePaymentGateway):
    """
    درگاه آزمایشی محیط توسعه — هیچ تماس شبکه‌ای واقعی برقرار نمی‌کند.

    برای تست موفق/ناموفق، در callback_data مقدار زیر را بفرستید:
        {"outcome": "success"}   یا   {"outcome": "fail"}
    پیش‌فرض (اگر outcome داده نشود) موفق در نظر گرفته می‌شود.
    """

    name = "mock"

    def start_payment(self, *, amount_irt, reference):
        return GatewayResult(
            success=True,
            reference=reference,
            redirect_url=f"https://mock-gateway.local/pay/{reference}",
        )

    def verify(self, *, reference, callback_data):
        outcome = (callback_data or {}).get("outcome", "success")
        return GatewayResult(
            success=(outcome == "success"), reference=reference, raw=callback_data or {}
        )


_GATEWAYS = {"mock": MockGateway()}


def get_gateway(name: str) -> BasePaymentGateway:
    try:
        return _GATEWAYS[name]
    except KeyError:
        raise ValueError(f"درگاه پرداخت «{name}» پشتیبانی نمی‌شود.")


def new_reference() -> str:
    return f"PAY-{uuid.uuid4().hex[:10].upper()}"
