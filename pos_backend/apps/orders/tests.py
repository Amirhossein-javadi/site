import datetime

from django.test import TestCase
from django.utils import timezone

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.contracts.models import Contract
from apps.inventory import services as inventory_services
from apps.inventory.models import DeviceSerial, InventoryItem, Warehouse
from apps.tenants.models import Company

from . import services
from .models import Order


class OrderLifecycleTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="تست", slug="test-co")
        self.warehouse = Warehouse.objects.create(
            tenant=self.company, name="انبار تست", code="WH-T"
        )
        category = Category.objects.create(name="کارتخوان", slug="pos-t")
        brand = Brand.objects.create(name="برند", slug="brand-t")
        product = Product.objects.create(
            tenant=self.company, name="دستگاه", code="DEV-1",
            category=category, brand=brand,
        )
        self.variant = ProductVariant.objects.create(
            product=product, name="نسخه", sku="DEV-1-SKU",
            base_price="1000000.0000", requires_serial=True,
        )
        inventory_services.receive_stock(
            warehouse=self.warehouse, variant=self.variant, quantity=5,
            serial_numbers=[f"SN-{i:03d}" for i in range(1, 6)],
        )
        self.active_contract = Contract.objects.create(
            tenant=self.company, number="CT-TEST-1", title="قرارداد فعال",
            agent_name="نماینده تست", device_cap=3,
            end_date=timezone.now().date() + datetime.timedelta(days=30),
            status=Contract.Status.ACTIVE,
        )
        self.expired_contract = Contract.objects.create(
            tenant=self.company, number="CT-TEST-2", title="قرارداد منقضی",
            agent_name="نماینده تست", device_cap=10,
            end_date=timezone.now().date() - datetime.timedelta(days=1),
            status=Contract.Status.ACTIVE,
        )

    def test_place_order_reserves_stock(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 2}],
        )
        item = InventoryItem.objects.get(warehouse=self.warehouse, variant=self.variant)
        self.assertEqual(item.reserved, 2)
        self.assertEqual(item.available, 3)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.variant.refresh_from_db()
        self.assertEqual(order.items.first().unit_price, self.variant.base_price)

    def test_expired_contract_blocks_order(self):
        with self.assertRaises(services.ContractNotValidError):
            services.place_order(
                contract=self.expired_contract, warehouse=self.warehouse,
                items=[{"variant": self.variant, "quantity": 1}],
            )

    def test_device_cap_enforced_across_orders(self):
        # سقف قرارداد ۳ است؛ دو سفارش ۲تایی پشت‌سرهم باید دومی رد شود
        services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 2}],
        )
        with self.assertRaises(services.DeviceCapExceededError):
            services.place_order(
                contract=self.active_contract, warehouse=self.warehouse,
                items=[{"variant": self.variant, "quantity": 2}],
            )

    def test_cancel_releases_reservation(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 2}],
        )
        order = services.cancel_order(order=order)

        item = InventoryItem.objects.get(warehouse=self.warehouse, variant=self.variant)
        self.assertEqual(item.reserved, 0)
        self.assertEqual(order.status, Order.Status.CANCELLED)

        # بعد از لغو، همان سقف قرارداد باید دوباره آزاد باشد
        services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 3}],
        )

    def test_full_shipment_flow_issues_stock_and_locks_serials(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 2}],
        )
        services.transition_status(order=order, to_status=Order.Status.CONFIRMED)
        services.transition_status(order=order, to_status=Order.Status.PROCESSING)
        order = services.transition_status(order=order, to_status=Order.Status.SHIPPED)

        item = InventoryItem.objects.get(warehouse=self.warehouse, variant=self.variant)
        self.assertEqual(item.on_hand, 3)
        self.assertEqual(item.reserved, 0)
        self.assertIsNotNone(order.stock_issued_at)
        self.assertEqual(
            DeviceSerial.objects.filter(status=DeviceSerial.Status.SOLD).count(), 2
        )

    def test_cannot_cancel_after_shipped(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 1}],
        )
        services.transition_status(order=order, to_status=Order.Status.CONFIRMED)
        services.transition_status(order=order, to_status=Order.Status.PROCESSING)
        services.transition_status(order=order, to_status=Order.Status.SHIPPED)

        with self.assertRaises(services.InvalidTransitionError):
            services.cancel_order(order=order)

    def test_invalid_transition_rejected(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 1}],
        )
        with self.assertRaises(services.InvalidTransitionError):
            # از PENDING نمی‌شود مستقیم به SHIPPED پرید
            services.transition_status(order=order, to_status=Order.Status.SHIPPED)
