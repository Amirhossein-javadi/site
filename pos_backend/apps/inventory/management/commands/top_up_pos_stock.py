"""Top up the seeded PAX catalog without replacing other database records."""

from django.conf import settings
from django.core.management import BaseCommand, CommandError
from django.db import connection

from apps.catalog.models import ProductVariant
from apps.inventory import services
from apps.inventory.models import InventoryItem, Warehouse


class Command(BaseCommand):
    help = "افزایش موجودی نمونه هر مدل PAX تا ۲۵۰ دستگاه"

    def handle(self, *args, **options):
        if not settings.DEBUG or connection.vendor != "sqlite":
            raise CommandError("این دستور فقط در DEBUG و روی SQLite محلی اجرا می‌شود.")

        variants = list(
            ProductVariant.objects.filter(
                product__brand__slug="pax",
                product__tenant__slug="negin-rasa",
            ).select_related("product", "product__tenant")
        )
        if not variants:
            raise CommandError("مدل PAX نمونه‌ای پیدا نشد؛ ابتدا seed_demo را اجرا کنید.")

        target_total = 250
        shiraz_target = 30
        tehran_target = target_total - shiraz_target
        total_added = 0

        for variant in variants:
            for code, target in [("WH-TEH", tehran_target), ("WH-SHIRAZ", shiraz_target)]:
                warehouse = Warehouse.objects.filter(
                    tenant=variant.product.tenant,
                    code=code,
                ).first()
                if not warehouse:
                    raise CommandError(f"انبار نمونه {code} پیدا نشد.")

                item = InventoryItem.objects.filter(
                    warehouse=warehouse,
                    variant=variant,
                ).first()
                current = item.on_hand if item else 0
                quantity = max(0, target - current)

                if quantity:
                    serial_numbers = None
                    if variant.requires_serial:
                        prefix = f"SAMPLE-{variant.sku}-{code}-"
                        existing = variant.serials.filter(
                            warehouse=warehouse,
                            serial_number__startswith=prefix,
                        ).values_list("serial_number", flat=True)
                        last_number = max(
                            (int(number.removeprefix(prefix)) for number in existing),
                            default=0,
                        )
                        serial_numbers = [
                            f"{prefix}{number:04d}"
                            for number in range(last_number + 1, last_number + quantity + 1)
                        ]

                    services.receive_stock(
                        warehouse=warehouse,
                        variant=variant,
                        quantity=quantity,
                        serial_numbers=serial_numbers,
                        reference="PAX-BULK-SEED",
                        note="تکمیل موجودی نمونه تا ۲۵۰ دستگاه برای هر مدل PAX.",
                    )
                    total_added += quantity

                InventoryItem.objects.filter(
                    warehouse=warehouse,
                    variant=variant,
                ).update(reorder_point=max(item.reorder_point if item else 0, 20))

        stock_total = sum(
            InventoryItem.objects.filter(variant__in=variants).values_list("on_hand", flat=True)
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"PAX inventory topped up: {len(variants)} models, "
                f"{len(variants) * target_total} target units, "
                f"{stock_total} units in these models, {total_added} new units."
            )
        )
