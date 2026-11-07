"""Create a fresh, reusable set of Persian payment-terminal demo data."""

import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.contracts.models import Contract
from apps.inventory import services
from apps.inventory.models import InventoryItem, Warehouse
from apps.suppliers.models import Supplier
from apps.tenants.models import AgentCompany, Company


class Command(BaseCommand):
    help = "ساخت داده نمونه PSP، کارتخوان‌های PAX و تجهیزات عمومی"

    @transaction.atomic
    def handle(self, *args, **options):
        company, _ = Company.objects.get_or_create(
            slug="negin-rasa",
            defaults={"name": "شرکت نمونه تجهیزات پرداخت"},
        )

        terminals, _ = Category.objects.get_or_create(
            slug="pos-terminals", defaults={"name": "کارتخوان"}
        )
        accessories, _ = Category.objects.get_or_create(
            slug="accessories", defaults={"name": "لوازم جانبی"}
        )
        retail, _ = Category.objects.get_or_create(
            slug="retail-equipment", defaults={"name": "تجهیزات فروشگاهی"}
        )

        pax, _ = Brand.objects.get_or_create(slug="pax", defaults={"name": "PAX"})
        general, _ = Brand.objects.get_or_create(
            slug="general", defaults={"name": "عمومی"}
        )

        products = [
            {
                "code": "PAX-A920-PRO",
                "name": "کارتخوان هوشمند PAX A920 Pro",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-A920P-4G",
                "variant": "Android، 4G و Wi-Fi",
                "price": "44900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-A920",
                "name": "کارتخوان هوشمند PAX A920",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-A920-4G",
                "variant": "Android، 4G",
                "price": "35900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-A910",
                "name": "کارتخوان هوشمند PAX A910",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-A910-4G",
                "variant": "Android، 4G",
                "price": "28900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-A930",
                "name": "کارتخوان هوشمند PAX A930",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-A930-4G",
                "variant": "Android، 4G و Wi-Fi",
                "price": "52900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-D210",
                "name": "کارتخوان سیار PAX D210",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-D210-4G",
                "variant": "4G، صفحه‌کلید فیزیکی",
                "price": "22500000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-D230",
                "name": "کارتخوان سیار PAX D230",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-D230-4G",
                "variant": "4G، نمایشگر رنگی",
                "price": "27900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "PAX-S90",
                "name": "کارتخوان رومیزی PAX S90",
                "category": terminals,
                "brand": pax,
                "warranty": 12,
                "sku": "PAX-S90-GPRS",
                "variant": "GPRS، رومیزی",
                "price": "13900000.0000",
                "quantity": 250,
                "reorder": 20,
                "secondary": 30,
                "serial": True,
            },
            {
                "code": "GEN-THERMAL-ROLL",
                "name": "رول حرارتی کارتخوان ۵۷ میلی‌متری",
                "category": accessories,
                "brand": general,
                "warranty": 0,
                "sku": "GEN-THERMAL-ROLL-10",
                "variant": "بسته ۱۰ عددی",
                "price": "350000.0000",
                "quantity": 800,
                "reorder": 100,
                "secondary": 0,
                "serial": False,
            },
            {
                "code": "GEN-POS-PRINTER",
                "name": "چاپگر حرارتی فروشگاهی",
                "category": retail,
                "brand": general,
                "warranty": 12,
                "sku": "GEN-PRINTER-80MM",
                "variant": "USB، عرض چاپ ۸۰ میلی‌متر",
                "price": "14900000.0000",
                "quantity": 18,
                "reorder": 4,
                "secondary": 0,
                "serial": True,
            },
            {
                "code": "GEN-BARCODE-SCANNER",
                "name": "بارکدخوان فروشگاهی",
                "category": retail,
                "brand": general,
                "warranty": 12,
                "sku": "GEN-BARCODE-USB",
                "variant": "USB، سیمی",
                "price": "8200000.0000",
                "quantity": 16,
                "reorder": 4,
                "secondary": 0,
                "serial": True,
            },
            {
                "code": "GEN-POS-CHARGER",
                "name": "شارژر و پایه کارتخوان",
                "category": accessories,
                "brand": general,
                "warranty": 3,
                "sku": "GEN-POS-CHARGER",
                "variant": "پایه رومیزی و کابل برق",
                "price": "1650000.0000",
                "quantity": 35,
                "reorder": 8,
                "secondary": 0,
                "serial": False,
            },
        ]

        warehouses = {}
        for code, name, address in [
            ("WH-TEH", "انبار مرکزی تهران", "تهران"),
            ("WH-SHIRAZ", "انبار شیراز", "شیراز"),
        ]:
            warehouse, _ = Warehouse.objects.get_or_create(
                tenant=company,
                code=code,
                defaults={"name": name, "address": address},
            )
            warehouses[code] = warehouse

        today = timezone.localdate()
        stocked_variants = []
        for spec in products:
            product, _ = Product.objects.update_or_create(
                tenant=company,
                code=spec["code"],
                defaults={
                    "name": spec["name"],
                    "category": spec["category"],
                    "brand": spec["brand"],
                    "warranty_months": spec["warranty"],
                    "description": "داده نمونه؛ قیمت و سریال‌ها برای راه‌اندازی آزمایشی هستند.",
                    "is_active": True,
                },
            )
            variant, _ = ProductVariant.objects.get_or_create(
                sku=spec["sku"],
                defaults={
                    "product": product,
                    "name": spec["variant"],
                    "base_price": spec["price"],
                    "currency": ProductVariant.Currency.IRT,
                    "requires_serial": spec["serial"],
                    "lead_time_days": 3 if spec["serial"] else 1,
                },
            )
            stocked_variants.append((variant, spec))

        for variant, spec in stocked_variants:
            main_qty = spec["quantity"] - spec["secondary"]
            for code, qty in [("WH-TEH", main_qty), ("WH-SHIRAZ", spec["secondary"])]:
                warehouse = warehouses[code]
                item = InventoryItem.objects.filter(
                    warehouse=warehouse, variant=variant
                ).first()
                current_qty = item.on_hand if item else 0
                add_qty = max(0, qty - current_qty)
                if add_qty:
                    serial_numbers = None
                    if variant.requires_serial:
                        prefix = f"SAMPLE-{variant.sku}-{code}-"
                        existing_serials = variant.serials.filter(
                            warehouse=warehouse,
                            serial_number__startswith=prefix,
                        ).values_list("serial_number", flat=True)
                        last_number = max(
                            (int(number.removeprefix(prefix)) for number in existing_serials),
                            default=0,
                        )
                        serial_numbers = [
                            f"{prefix}{number:04d}"
                            for number in range(last_number + 1, last_number + add_qty + 1)
                        ]
                    services.receive_stock(
                        warehouse=warehouse,
                        variant=variant,
                        quantity=add_qty,
                        serial_numbers=serial_numbers,
                        reference=f"FRESH-SEED-{today.isoformat()}",
                        note="موجودی نمونه جدید؛ شماره سریال‌ها آزمایشی هستند.",
                    )
                InventoryItem.objects.filter(
                    warehouse=warehouse, variant=variant
                ).update(reorder_point=spec["reorder"])

        psp_names = [
            "به‌پرداخت ملت",
            "پرداخت الکترونیک سامان (سپ)",
            "آسان‌پرداخت پرشین (آپ)",
            "پرداخت نوین آرین",
            "تجارت الکترونیک پارسیان (تاپ)",
            "پرداخت الکترونیک سداد",
            "ایران‌کیش",
            "فن‌آوا کارت",
        ]
        end_date = today + datetime.timedelta(days=365)
        for index, name in enumerate(psp_names, start=1):
            agent, _ = AgentCompany.objects.get_or_create(
                tenant=company,
                name=name,
                defaults={"is_active": True},
            )
            Contract.objects.update_or_create(
                number=f"PSP-2026-{index:03d}",
                defaults={
                    "tenant": company,
                    "title": f"قرارداد نمونه تأمین تجهیزات - {name}",
                    "agent": agent,
                    "device_cap": 250,
                    "end_date": end_date,
                    "status": Contract.Status.ACTIVE,
                },
            )

        suppliers = [
            ("SUP-TERMINALS", "تأمین‌گستر تجهیزات پرداخت", 7),
            ("SUP-ACCESSORIES", "پخش لوازم فروشگاهی", 5),
            ("SUP-SERVICE", "خدمات فنی پایانه‌ها", 10),
        ]
        for code, name, lead_time in suppliers:
            Supplier.objects.get_or_create(
                tenant=company,
                code=code,
                defaults={
                    "name": name,
                    "lead_time_days": lead_time,
                    "status": Supplier.Status.ACTIVE,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready: {len(psp_names)} PSPs, "
                f"{len(products)} products, {len(warehouses)} warehouses, "
                f"{sum(spec['quantity'] for spec in products if spec['brand'].slug == 'pax')} PAX units."
            )
        )
