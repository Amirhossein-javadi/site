"""
تست همزمانی رزرو موجودی.

این مهم‌ترین تست فاز فعلی است: اثبات می‌کند که وقتی چند درخواست هم‌زمان
برای آخرین دستگاه‌های موجود می‌رسند، مجموع رزروها هرگز از موجودی فیزیکی
بیشتر نمی‌شود.

TransactionTestCase (و نه TestCase) لازم است، چون TestCase کل تست را در
یک تراکنش می‌پیچد و رفتار قفل‌گذاری واقعی بین Threadها دیده نمی‌شود.
"""

import threading

from django.db import connection
from django.test import TransactionTestCase

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.inventory import services
from apps.inventory.models import DeviceSerial, InventoryItem, Warehouse
from apps.tenants.models import Company


class ReservationConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.company = Company.objects.create(name="تست", slug="test-co")
        self.warehouse = Warehouse.objects.create(
            tenant=self.company, name="انبار تست", code="WH-TEST"
        )
        category = Category.objects.create(name="کارتخوان", slug="pos-test")
        brand = Brand.objects.create(name="برند تست", slug="brand-test")
        product = Product.objects.create(
            tenant=self.company,
            name="دستگاه تست",
            code="TEST-1",
            category=category,
            brand=brand,
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            name="نسخه تست",
            sku="TEST-SKU-1",
            base_price="1000000.0000",
            requires_serial=True,
        )
        services.receive_stock(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity=10,
            serial_numbers=[f"TEST-SN-{i:04d}" for i in range(1, 11)],
            reference="TEST-RECEIPT",
        )

    def test_parallel_reservations_never_oversell(self):
        """۲۰ درخواست هم‌زمان برای ۱۰ دستگاه ⇒ دقیقاً ۱۰ موفقیت."""
        successes = []
        failures = []
        lock = threading.Lock()

        def attempt():
            try:
                services.reserve_stock(
                    warehouse=self.warehouse,
                    variant=self.variant,
                    quantity=1,
                    reference="CONCURRENT-TEST",
                )
                with lock:
                    successes.append(1)
            except services.InsufficientStockError:
                with lock:
                    failures.append(1)
            finally:
                # هر Thread اتصال دیتابیس خودش را می‌گیرد و باید ببندد
                connection.close()

        threads = [threading.Thread(target=attempt) for _ in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        item = InventoryItem.objects.get(
            warehouse=self.warehouse, variant=self.variant
        )

        self.assertEqual(len(successes), 10, "تعداد رزروهای موفق باید دقیقاً ۱۰ باشد")
        self.assertEqual(len(failures), 10, "۱۰ درخواست باید رد شده باشند")
        self.assertEqual(item.reserved, 10)
        self.assertEqual(item.on_hand, 10)
        self.assertEqual(item.available, 0, "موجودی قابل فروش نباید منفی شود")

        reserved_serials = DeviceSerial.objects.filter(
            variant=self.variant, status=DeviceSerial.Status.RESERVED
        ).count()
        self.assertEqual(
            reserved_serials, 10, "هر رزرو باید دقیقاً یک سریال را قفل کرده باشد"
        )

    def test_release_returns_stock_to_available(self):
        services.reserve_stock(
            warehouse=self.warehouse, variant=self.variant, quantity=4
        )
        services.release_reservation(
            warehouse=self.warehouse, variant=self.variant, quantity=4
        )

        item = InventoryItem.objects.get(
            warehouse=self.warehouse, variant=self.variant
        )
        self.assertEqual(item.reserved, 0)
        self.assertEqual(item.available, 10)
        self.assertEqual(
            DeviceSerial.objects.filter(
                variant=self.variant, status=DeviceSerial.Status.IN_STOCK
            ).count(),
            10,
        )

    def test_issue_converts_reservation_to_sale(self):
        services.reserve_stock(
            warehouse=self.warehouse, variant=self.variant, quantity=3
        )
        services.issue_stock(
            warehouse=self.warehouse, variant=self.variant, quantity=3
        )

        item = InventoryItem.objects.get(
            warehouse=self.warehouse, variant=self.variant
        )
        self.assertEqual(item.on_hand, 7)
        self.assertEqual(item.reserved, 0)
        self.assertEqual(
            DeviceSerial.objects.filter(
                variant=self.variant, status=DeviceSerial.Status.SOLD
            ).count(),
            3,
        )

    def test_duplicate_serial_is_rejected(self):
        with self.assertRaises(services.SerialConflictError):
            services.receive_stock(
                warehouse=self.warehouse,
                variant=self.variant,
                quantity=1,
                serial_numbers=["TEST-SN-0001"],  # قبلاً ثبت شده
            )

    def test_serial_count_must_match_quantity(self):
        with self.assertRaises(services.SerialConflictError):
            services.receive_stock(
                warehouse=self.warehouse,
                variant=self.variant,
                quantity=3,
                serial_numbers=["NEW-SN-1", "NEW-SN-2"],
            )
