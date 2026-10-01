import datetime

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.contracts.models import Contract
from apps.inventory import services as inventory_services
from apps.inventory.models import DeviceSerial, InventoryItem, Warehouse
from apps.tenants.models import AgentCompany, Company
from apps.users.models import User

from . import services
from .models import Order


class OrderLifecycleTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="تست", slug="test-co")
        self.user = User.objects.create_user(
            email="orders@example.invalid",
            password="test-password",
            tenant=self.company,
            role=User.Role.SALES_MANAGER,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
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
        self.agent = AgentCompany.objects.create(
            tenant=self.company, name="نماینده تست"
        )
        self.active_contract = Contract.objects.create(
            tenant=self.company, number="CT-TEST-1", title="قرارداد فعال",
            agent=self.agent, device_cap=3,
            end_date=timezone.now().date() + datetime.timedelta(days=30),
            status=Contract.Status.ACTIVE,
        )
        self.expired_contract = Contract.objects.create(
            tenant=self.company, number="CT-TEST-2", title="قرارداد منقضی",
            agent=self.agent, device_cap=10,
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

    def test_api_create_order_reserves_stock_and_returns_detail(self):
        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["items"][0]["quantity"], 1)
        self.assertEqual(response.data["data"]["status"], Order.Status.PENDING)
        self.assertEqual(InventoryItem.objects.get(variant=self.variant).reserved, 1)

    def test_api_rejects_order_without_items(self):
        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [],
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_api_rejects_duplicate_variant_rows(self):
        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [
                {"variant": self.variant.pk, "quantity": 1},
                {"variant": self.variant.pk, "quantity": 1},
            ],
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_api_enforces_variant_minimum_order_quantity(self):
        self.variant.min_order_quantity = 2
        self.variant.save(update_fields=["min_order_quantity"])

        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(InventoryItem.objects.get(variant=self.variant).reserved, 0)

    def test_api_rejects_warehouse_from_another_company(self):
        other_company = Company.objects.create(name="شرکت دیگر", slug="other-company")
        other_warehouse = Warehouse.objects.create(
            tenant=other_company, name="انبار دیگر", code="WH-OTHER"
        )

        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": other_warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_api_rejects_inactive_variant(self):
        self.variant.is_active = False
        self.variant.save(update_fields=["is_active"])

        response = self.client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(InventoryItem.objects.get(variant=self.variant).reserved, 0)

    def test_failed_multi_item_reservation_rolls_back_entire_order(self):
        accessory = ProductVariant.objects.create(
            product=self.variant.product, name="لوازم", sku="ACC-1",
            base_price="50000", requires_serial=False,
        )

        with self.assertRaises(inventory_services.InsufficientStockError):
            services.place_order(
                contract=self.active_contract, warehouse=self.warehouse,
                items=[
                    {"variant": self.variant, "quantity": 1},
                    {"variant": accessory, "quantity": 1},
                ],
            )

        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(InventoryItem.objects.get(variant=self.variant).reserved, 0)
        self.assertEqual(
            self.variant.ledger_entries.count(), 1,
            "رزرو ناموفق باید رکورد دفتر رزرو را هم rollback کند؛ فقط receipt اولیه باقی بماند.",
        )

    def test_api_cancel_releases_stock_and_records_note(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 1}],
        )

        response = self.client.post(f"/api/orders/{order.pk}/cancel/", {
            "note": "درخواست نماینده",
        }, format="json")

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(InventoryItem.objects.get(variant=self.variant).reserved, 0)
        self.assertEqual(
            order.status_history.get(to_status=Order.Status.CANCELLED).note,
            "درخواست نماینده",
        )

    def test_api_rejects_invalid_status_transition(self):
        order = services.place_order(
            contract=self.active_contract, warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 1}],
        )

        response = self.client.post(f"/api/orders/{order.pk}/transition/", {
            "to_status": Order.Status.SHIPPED,
        }, format="json")

        self.assertEqual(response.status_code, 409)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)

    def test_api_proforma_and_payment_success_auto_confirms_order(self):
        from apps.finance.models import LedgerEntry
        from apps.orders.models import OrderStatusHistory

        client = self.client
        create_response = client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")
        order_id = create_response.data["data"]["id"]

        proforma_response = client.post(
            "/api/proforma-invoices/issue/", {"order": order_id}, format="json"
        )
        self.assertEqual(proforma_response.status_code, 201)
        proforma_id = proforma_response.data["data"]["id"]

        payment_response = client.post("/api/payments/create/", {
            "proforma": proforma_id,
            "idempotency_key": "order-flow-test-key",
            "gateway": "mock",
        }, format="json")
        self.assertEqual(payment_response.status_code, 201)
        payment_id = payment_response.data["data"]["id"]

        verify_response = client.post(
            f"/api/payments/{payment_id}/verify/", {"outcome": "success"}, format="json"
        )
        self.assertEqual(verify_response.status_code, 200)
        self.assertEqual(verify_response.data["data"]["status"], "succeeded")

        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.status, Order.Status.CONFIRMED)
        self.assertTrue(OrderStatusHistory.objects.filter(
            order=order, to_status=Order.Status.CONFIRMED,
            note="تایید خودکار پس از پرداخت موفق",
        ).exists())
        self.assertEqual(LedgerEntry.objects.filter(contract=self.active_contract).count(), 2)

    def test_api_shipment_and_delivery_finish_order_lifecycle(self):
        client = self.client
        create_response = client.post("/api/orders/", {
            "contract": self.active_contract.pk,
            "warehouse": self.warehouse.pk,
            "items": [{"variant": self.variant.pk, "quantity": 1}],
        }, format="json")
        order_id = create_response.data["data"]["id"]

        # Confirm through the same mock-payment workflow used by the page.
        proforma = client.post(
            "/api/proforma-invoices/issue/", {"order": order_id}, format="json"
        ).data["data"]
        payment = client.post("/api/payments/create/", {
            "proforma": proforma["id"], "idempotency_key": "shipment-flow-key",
        }, format="json").data["data"]
        client.post(
            f"/api/payments/{payment['id']}/verify/", {"outcome": "success"}, format="json"
        )

        processing = client.post(f"/api/orders/{order_id}/transition/", {
            "to_status": Order.Status.PROCESSING,
        }, format="json")
        self.assertEqual(processing.status_code, 200)
        shipped = client.post(f"/api/orders/{order_id}/transition/", {
            "to_status": Order.Status.SHIPPED,
        }, format="json")
        self.assertEqual(shipped.status_code, 200)
        delivered = client.post(f"/api/orders/{order_id}/transition/", {
            "to_status": Order.Status.DELIVERED,
        }, format="json")
        self.assertEqual(delivered.status_code, 200)

        order = Order.objects.get(pk=order_id)
        item = InventoryItem.objects.get(variant=self.variant)
        self.assertEqual(order.status, Order.Status.DELIVERED)
        self.assertIsNotNone(order.stock_issued_at)
        self.assertEqual(item.on_hand, 4)
        self.assertEqual(item.reserved, 0)
        self.assertEqual(DeviceSerial.objects.filter(status=DeviceSerial.Status.SOLD).count(), 1)

    def test_api_lists_return_items(self):
        from apps.orders import fulfillment

        order = services.place_order(
            contract=self.active_contract,
            warehouse=self.warehouse,
            items=[{"variant": self.variant, "quantity": 1}],
        )
        services.transition_status(order=order, to_status=Order.Status.CONFIRMED)
        services.transition_status(order=order, to_status=Order.Status.PROCESSING)
        order = services.transition_status(order=order, to_status=Order.Status.SHIPPED)
        order_item = order.items.get()
        return_request = fulfillment.create_return_request(
            order=order,
            items=[{
                "order_item": order_item,
                "quantity": 1,
                "serial_numbers": order_item.serial_numbers,
            }],
            reason="تست نمایش مرجوعی",
            user=self.user,
        )

        response = self.client.get("/api/returns/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["return_number"], return_request.return_number)
        self.assertEqual(response.data[0]["items"][0]["order_item_id"], order_item.pk)
