import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.contracts.models import Contract
from apps.finance import services as finance_services
from apps.inventory import services as inventory_services
from apps.inventory.models import Warehouse
from apps.orders import services as orders_services
from apps.orders.models import Order
from apps.pricing import services as pricing_services
from apps.tenants.models import Company

from . import services


class FullChainTests(TestCase):
    """
    ثبت سفارش → صدور پیش‌فاکتور (با نرخ ارز) → پرداخت → تایید خودکار
    سفارش → ثبت در دفتر مالی. این تست همان مسیری است که یک سفارش واقعی
    طی می‌کند.
    """

    def setUp(self):
        self.company = Company.objects.create(name="تست", slug="test-co-2")
        self.warehouse = Warehouse.objects.create(
            tenant=self.company, name="انبار", code="WH-P"
        )
        category = Category.objects.create(name="کارتخوان", slug="pos-p")
        brand = Brand.objects.create(name="برند", slug="brand-p")
        product = Product.objects.create(
            tenant=self.company, name="دستگاه دلاری", code="USD-1",
            category=category, brand=brand,
        )
        # عمداً ارز دلاری تا مسیر تبدیل نرخ ارز هم تست شود
        self.variant = ProductVariant.objects.create(
            product=product, name="نسخه", sku="USD-1-SKU",
            base_price="100.0000", currency=ProductVariant.Currency.USD,
            requires_serial=False,
        )
        inventory_services.receive_stock(
            warehouse=self.warehouse, variant=self.variant, quantity=50
        )
        self.contract = Contract.objects.create(
            tenant=self.company, number="CT-PAY-1", title="قرارداد",
            agent_name="نماینده", device_cap=100,
            end_date=timezone.now().date() + datetime.timedelta(days=30),
            status=Contract.Status.ACTIVE,
        )
        pricing_services.set_exchange_rate(currency="USD", rate_to_irt=Decimal("60000"))

        self.order = orders_services.place_order(
            contract=self.contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 3}],
        )

    def test_proforma_snapshot_survives_price_change(self):
        proforma = pricing_services.issue_proforma_invoice(order=self.order)

        # 3 × 100 دلار × 60000 = 18,000,000 + مالیات ۱۰٪ = 19,800,000
        self.assertEqual(proforma.subtotal_irt, Decimal("18000000.0000"))
        self.assertEqual(proforma.tax_amount_irt, Decimal("1800000.0000"))
        self.assertEqual(proforma.total_irt, Decimal("19800000.0000"))

        # حالا قیمت و نرخ ارز را عوض می‌کنیم — پیش‌فاکتور باید دست‌نخورده بماند
        self.variant.base_price = Decimal("999.0000")
        self.variant.save()
        pricing_services.set_exchange_rate(currency="USD", rate_to_irt=Decimal("999999"))

        proforma.refresh_from_db()
        self.assertEqual(proforma.total_irt, Decimal("19800000.0000"))
        line = proforma.lines.first()
        self.assertEqual(line.unit_price_original, Decimal("100.0000"))
        self.assertEqual(line.exchange_rate_applied, Decimal("60000.0000"))

    def test_cannot_issue_proforma_twice(self):
        pricing_services.issue_proforma_invoice(order=self.order)
        with self.assertRaises(pricing_services.ProformaAlreadyIssuedError):
            pricing_services.issue_proforma_invoice(order=self.order)

    def test_payment_intent_is_idempotent(self):
        proforma = pricing_services.issue_proforma_invoice(order=self.order)
        p1 = services.create_payment_intent(
            proforma=proforma, idempotency_key="client-key-1"
        )
        p2 = services.create_payment_intent(
            proforma=proforma, idempotency_key="client-key-1"
        )
        self.assertEqual(p1.pk, p2.pk, "کلید Idempotency تکراری نباید Payment دوم بسازد")

    def test_successful_payment_confirms_order_and_updates_ledger(self):
        proforma = pricing_services.issue_proforma_invoice(order=self.order)
        payment = services.create_payment_intent(
            proforma=proforma, idempotency_key="client-key-2"
        )
        services.verify_payment(payment=payment, callback_data={"outcome": "success"})

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.CONFIRMED)

        balance = finance_services.contract_balance(self.contract)
        self.assertEqual(balance["debit"], Decimal("19800000.0000"))
        self.assertEqual(balance["credit"], Decimal("19800000.0000"))
        self.assertEqual(balance["balance"], Decimal("0.0000"))

    def test_webhook_replay_does_not_double_process(self):
        """اگر Webhook درگاه دو بار برسد، دو بار در دفتر مالی ثبت نشود."""
        proforma = pricing_services.issue_proforma_invoice(order=self.order)
        payment = services.create_payment_intent(
            proforma=proforma, idempotency_key="client-key-3"
        )
        services.verify_payment(payment=payment, callback_data={"outcome": "success"})
        services.verify_payment(payment=payment, callback_data={"outcome": "success"})

        balance = finance_services.contract_balance(self.contract)
        self.assertEqual(
            balance["credit"], Decimal("19800000.0000"), "پرداخت دوباره پردازش شده"
        )

    def test_amount_mismatch_fails_payment_even_if_gateway_says_success(self):
        proforma = pricing_services.issue_proforma_invoice(order=self.order)
        payment = services.create_payment_intent(
            proforma=proforma, idempotency_key="client-key-4"
        )
        payment = services.verify_payment(
            payment=payment,
            callback_data={"outcome": "success", "amount_irt": "1.0000"},
        )
        self.assertEqual(payment.status, services.Payment.Status.FAILED)

    def test_cannot_pay_expired_proforma(self):
        proforma = pricing_services.issue_proforma_invoice(order=self.order)
        proforma.valid_until = timezone.now() - datetime.timedelta(days=1)
        proforma.save(update_fields=["valid_until"])

        with self.assertRaises(services.ProformaExpiredError):
            services.create_payment_intent(
                proforma=proforma, idempotency_key="client-key-5"
            )
