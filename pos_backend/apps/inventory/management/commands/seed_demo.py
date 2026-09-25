"""
دستور ساخت داده اولیه برای محیط توسعه.

    python manage.py seed_demo

عمداً همه ورود کالا از طریق services.receive_stock انجام می‌شود، نه با
ساختن مستقیم رکورد InventoryItem — تا داده اولیه هم دفتر موجودی و هم
رکوردهای سریال را درست پر کند و شبیه داده واقعی باشد.
"""

import datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.contracts.models import Contract
from apps.inventory import services
from apps.inventory.models import Warehouse
from apps.tenants.models import Company, AgentCompany


class Command(BaseCommand):
    help = "ساخت داده نمونه برای محیط توسعه"

    @transaction.atomic
    def handle(self, *args, **options):
        company, _ = Company.objects.get_or_create(
            slug="negin-rasa", defaults={"name": "شرکت توسعه فناوری نگین رسا"}
        )

        # --- دسته‌بندی و برند ---
        cat_pos, _ = Category.objects.get_or_create(
            slug="pos-terminal", defaults={"name": "کارتخوان فروشگاهی"}
        )
        cat_acc, _ = Category.objects.get_or_create(
            slug="accessories", defaults={"name": "لوازم جانبی"}
        )
        brand_vanstone, _ = Brand.objects.get_or_create(
            slug="vanstone", defaults={"name": "Vanstone"}
        )
        brand_pax, _ = Brand.objects.get_or_create(
            slug="pax", defaults={"name": "PAX"}
        )

        # --- محصولات و نسخه‌ها ---
        specs = [
            {
                "code": "VS-V72",
                "name": "کارتخوان سیار Vanstone V72",
                "category": cat_pos,
                "brand": brand_vanstone,
                "warranty": 18,
                "variants": [
                    ("GPRS - مشکی", "VS-V72-GPRS-BK", "18500000.0000", "IRT", True, 30),
                    ("WiFi - مشکی", "VS-V72-WIFI-BK", "19750000.0000", "IRT", True, 20),
                ],
            },
            {
                "code": "VS-V72P",
                "name": "کارتخوان سیار Vanstone V72P",
                "category": cat_pos,
                "brand": brand_vanstone,
                "warranty": 24,
                "variants": [
                    ("نسخه استاندارد", "VS-V72P-STD", "23400000.0000", "IRT", True, 15),
                ],
            },
            {
                "code": "PAX-A920",
                "name": "کارتخوان هوشمند PAX A920",
                "category": cat_pos,
                "brand": brand_pax,
                "warranty": 12,
                "variants": [
                    ("Android - 4G", "PAX-A920-4G", "420.0000", "USD", True, 12),
                ],
            },
            {
                "code": "ACC-ROLL",
                "name": "رول کاغذ حرارتی ۵۷ میلی‌متر",
                "category": cat_acc,
                "brand": brand_vanstone,
                "warranty": 0,
                "variants": [
                    ("بسته ۱۰ عددی", "ACC-ROLL-10", "145000.0000", "IRT", False, 500),
                ],
            },
        ]

        # --- انبارها ---
        wh_main, _ = Warehouse.objects.get_or_create(
            tenant=company,
            code="WH-TEH",
            defaults={"name": "انبار مرکزی تهران", "address": "تهران"},
        )
        wh_mashhad, _ = Warehouse.objects.get_or_create(
            tenant=company,
            code="WH-MSH",
            defaults={"name": "انبار مشهد", "address": "مشهد"},
        )

        created_variants = []
        for spec in specs:
            product, _ = Product.objects.get_or_create(
                tenant=company,
                code=spec["code"],
                defaults={
                    "name": spec["name"],
                    "category": spec["category"],
                    "brand": spec["brand"],
                    "warranty_months": spec["warranty"],
                },
            )
            for name, sku, price, currency, needs_serial, qty in spec["variants"]:
                variant, created = ProductVariant.objects.get_or_create(
                    sku=sku,
                    defaults={
                        "product": product,
                        "name": name,
                        "base_price": price,
                        "currency": currency,
                        "requires_serial": needs_serial,
                        "lead_time_days": 3 if needs_serial else 1,
                    },
                )
                if created:
                    created_variants.append((variant, qty))

        # --- ورود کالا به انبار از مسیر سرویس واقعی ---
        for variant, qty in created_variants:
            warehouse = wh_main
            if variant.requires_serial:
                serials = [
                    f"{variant.sku}-{str(i).zfill(4)}" for i in range(1, qty + 1)
                ]
                services.receive_stock(
                    warehouse=warehouse,
                    variant=variant,
                    quantity=qty,
                    serial_numbers=serials,
                    reference="SEED-RECEIPT",
                    note="داده اولیه توسعه",
                )
            else:
                services.receive_stock(
                    warehouse=warehouse,
                    variant=variant,
                    quantity=qty,
                    reference="SEED-RECEIPT",
                    note="داده اولیه توسعه",
                )

        # مقداری موجودی هم در انبار مشهد تا فیلتر انبار قابل تست باشد
        mashhad_variant = ProductVariant.objects.filter(sku="VS-V72-GPRS-BK").first()
        if mashhad_variant and not mashhad_variant.inventory_items.filter(
            warehouse=wh_mashhad
        ).exists():
            services.receive_stock(
                warehouse=wh_mashhad,
                variant=mashhad_variant,
                quantity=8,
                serial_numbers=[f"VS-V72-GPRS-BK-MSH-{str(i).zfill(4)}" for i in range(1, 9)],
                reference="SEED-RECEIPT",
                note="داده اولیه توسعه",
            )

        # --- نمایندگان ---
        agent1, _ = AgentCompany.objects.get_or_create(
            tenant=company, name="شرکت توسعه فناوری نگین رسا"
        )
        agent2, _ = AgentCompany.objects.get_or_create(
            tenant=company, name="بازرگانی پرداخت البرز"
        )

        # --- قراردادهای نمونه ---
        Contract.objects.get_or_create(
            number="CT-2026-001",
            defaults=dict(
                tenant=company,
                title="قرارداد تامین نمایندگی مرکزی",
                agent=agent1,
                device_cap=500,
                end_date=datetime.date(2026, 12, 21),
                status=Contract.Status.ACTIVE,
            ),
        )
        Contract.objects.get_or_create(
            number="CT-2026-002",
            defaults=dict(
                tenant=company,
                title="قرارداد تامین نمایندگی منطقه‌ای",
                agent=agent2,
                device_cap=200,
                end_date=datetime.date(2027, 2, 4),
                status=Contract.Status.ACTIVE,
            ),
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"داده نمونه ساخته شد: "
                f"{Product.objects.count()} محصول، "
                f"{ProductVariant.objects.count()} نسخه، "
                f"{Warehouse.objects.count()} انبار."
            )
        )