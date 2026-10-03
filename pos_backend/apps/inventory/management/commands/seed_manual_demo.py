"""Create reusable manual QA data in the local development database.

Run after migrations with ``python manage.py seed_manual_demo``. The command
also runs ``seed_demo`` to ensure the base catalog and stock are present.
All records use stable markers or unique codes, so re-running it is safe.
"""

import datetime

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connection, transaction
from django.utils import timezone

from apps.catalog.models import ProductVariant
from apps.contracts.models import Contract
from apps.inventory.models import Warehouse
from apps.orders import fulfillment, services as order_services
from apps.orders.models import Order, ReturnItem, Shipment
from apps.payments import services as payment_services
from apps.pricing import services as pricing_services
from apps.pricing.models import ProformaInvoice
from apps.suppliers.models import Supplier
from apps.tenants.models import AgentCompany, Company
from apps.users.models import User


DEMO_EMAIL = "demo@local.test"
DEMO_PASSWORD = "Manual-QA-2026!"


class Command(BaseCommand):
    help = "ساخت داده‌ی تکرارپذیر برای آزمایش دستی سایت در دیتابیس SQLite توسعه"

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG or connection.vendor != "sqlite":
            raise CommandError(
                "این دستور فقط روی SQLite محیط توسعه با DEBUG=True اجرا می‌شود."
            )

        call_command("seed_demo", stdout=self.stdout)
        company = Company.objects.get(slug="negin-rasa")
        user, user_created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={
                "tenant": company,
                "role": User.Role.SALES_MANAGER,
                "is_active": True,
            },
        )
        if user_created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])

        active_agent, _ = AgentCompany.objects.get_or_create(
            tenant=company,
            name="فروشگاه نمونه آفتاب",
            defaults={"is_active": True},
        )
        second_agent, _ = AgentCompany.objects.get_or_create(
            tenant=company,
            name="پرداخت‌گستر نمونه البرز",
            defaults={"is_active": True},
        )
        AgentCompany.objects.get_or_create(
            tenant=company,
            name="نمایندگی غیرفعال نمونه",
            defaults={"is_active": False},
        )

        today = timezone.localdate()
        contract_specs = [
            (
                "DEMO-ACT-001",
                "قرارداد فعال برای سفارش آزمایشی",
                active_agent,
                200,
                today + datetime.timedelta(days=180),
                Contract.Status.ACTIVE,
            ),
            (
                "DEMO-PND-001",
                "قرارداد در انتظار تایید",
                second_agent,
                40,
                today + datetime.timedelta(days=120),
                Contract.Status.PENDING,
            ),
            (
                "DEMO-EXP-001",
                "قرارداد منقضی برای بررسی فیلترها",
                second_agent,
                25,
                today - datetime.timedelta(days=30),
                Contract.Status.EXPIRED,
            ),
        ]
        for number, title, agent, cap, end_date, status in contract_specs:
            Contract.objects.get_or_create(
                number=number,
                defaults={
                    "tenant": company,
                    "title": title,
                    "agent": agent,
                    "device_cap": cap,
                    "end_date": end_date,
                    "status": status,
                },
            )

        supplier_specs = [
            ("DEMO-SUP-001", "تامین‌گستر نمونه", 5, Supplier.Status.ACTIVE),
            ("DEMO-SUP-002", "پخش تجهیزات نمونه", 12, Supplier.Status.ACTIVE),
            ("DEMO-SUP-003", "تامین‌کننده معلق نمونه", 20, Supplier.Status.SUSPENDED),
        ]
        for code, name, lead_time, status in supplier_specs:
            Supplier.objects.get_or_create(
                tenant=company,
                code=code,
                defaults={
                    "name": name,
                    "lead_time_days": lead_time,
                    "status": status,
                },
            )

        contract = Contract.objects.get(number="DEMO-ACT-001")
        warehouse = Warehouse.objects.get(tenant=company, code="WH-TEH")
        skus = ["VS-V72-WIFI-BK", "VS-V72-GPRS-BK", "VS-V72P-STD", "ACC-ROLL-10"]
        variants = {
            variant.sku: variant
            for variant in ProductVariant.objects.filter(sku__in=skus).select_related(
                "product"
            )
        }
        if len(variants) != len(skus):
            raise CommandError("کاتالوگ نمونه کامل نیست؛ اجرای seed_demo را بررسی کنید.")

        def get_order(marker, sku, quantity):
            order = Order.objects.filter(tenant=company, notes=marker).first()
            if order:
                return order
            return order_services.place_order(
                contract=contract,
                warehouse=warehouse,
                items=[{"variant": variants[sku], "quantity": quantity}],
                user=user,
                notes=marker,
            )

        pending_order = get_order(
            "[DEMO-PENDING-MANUAL-QA] سفارش باز برای تست دستی",
            "VS-V72-WIFI-BK",
            1,
        )
        paid_order = get_order(
            "[DEMO-PAID-MANUAL-QA] سفارش پرداخت‌شده برای تست دستی",
            "ACC-ROLL-10",
            10,
        )
        transit_order = get_order(
            "[DEMO-TRANSIT-MANUAL-QA] مرسوله در مسیر برای تست دستی",
            "VS-V72-GPRS-BK",
            1,
        )
        delivered_order = get_order(
            "[DEMO-DELIVERED-MANUAL-QA] سفارش تحویل‌شده برای تست دستی",
            "VS-V72P-STD",
            1,
        )

        def ensure_proforma(order):
            try:
                return order.proforma_invoice
            except ProformaInvoice.DoesNotExist:
                return pricing_services.issue_proforma_invoice(order=order)

        pending_invoice = ensure_proforma(pending_order)
        pending_key = f"demo-pending-{pending_invoice.pk}"
        if not pending_invoice.payments.filter(idempotency_key=pending_key).exists():
            attempt = payment_services.create_payment_intent(
                proforma=pending_invoice,
                idempotency_key=pending_key,
                gateway="mock",
            )
            payment_services.verify_payment(
                payment=attempt,
                callback_data={"outcome": "fail"},
            )

        paid_invoice = ensure_proforma(paid_order)
        if not paid_invoice.payments.filter(status="succeeded").exists():
            attempt = payment_services.create_payment_intent(
                proforma=paid_invoice,
                idempotency_key=f"demo-paid-{paid_invoice.pk}",
                gateway="mock",
            )
            payment_services.verify_payment(
                payment=attempt,
                callback_data={"outcome": "success"},
            )

        def advance_order(order, target):
            if order.status in (Order.Status.CANCELLED, Order.Status.DELIVERED):
                return order.status == target or (
                    target == Order.Status.SHIPPED
                    and order.status == Order.Status.DELIVERED
                )
            transitions = {
                Order.Status.PENDING: Order.Status.CONFIRMED,
                Order.Status.CONFIRMED: Order.Status.PROCESSING,
                Order.Status.PROCESSING: Order.Status.SHIPPED,
                Order.Status.SHIPPED: Order.Status.DELIVERED,
            }
            while order.status != target:
                next_status = transitions.get(order.status)
                if not next_status:
                    return False
                order = order_services.transition_status(
                    order=order,
                    to_status=next_status,
                    user=user,
                    note="داده نمونه تست دستی",
                )
            return True

        if advance_order(transit_order, Order.Status.SHIPPED):
            shipment = Shipment.objects.get(order=transit_order)
            shipment.carrier = "پست پیشتاز نمونه"
            shipment.tracking_number = "DEMO-TRACK-001"
            shipment.notes = "مرسوله آزمایشی؛ کد رهگیری واقعی نیست."
            shipment.save(update_fields=["carrier", "tracking_number", "notes", "updated_at"])

        if advance_order(delivered_order, Order.Status.DELIVERED):
            shipment = Shipment.objects.get(order=delivered_order)
            shipment.carrier = "باربری نمونه"
            shipment.tracking_number = "DEMO-TRACK-002"
            shipment.notes = "مرسوله آزمایشی تحویل‌شده؛ کد رهگیری واقعی نیست."
            shipment.save(update_fields=["carrier", "tracking_number", "notes", "updated_at"])
            if not delivered_order.returns.filter(
                reason="تست دستی: درخواست مرجوعی نمونه"
            ).exists():
                order_item = delivered_order.items.select_related("variant").get()
                fulfillment.create_return_request(
                    order=delivered_order,
                    items=[
                        {
                            "order_item": order_item,
                            "quantity": 1,
                            "serial_numbers": order_item.serial_numbers,
                            "condition": ReturnItem.Condition.RESTOCK,
                        }
                    ],
                    reason="تست دستی: درخواست مرجوعی نمونه",
                    notes=(
                        "این رکورد داده آزمایشی است؛ دریافت مرجوعی را می‌توان از پنل انجام داد."
                    ),
                    user=user,
                )

        self.stdout.write(self.style.SUCCESS("داده‌ی نمونه برای تست دستی آماده است."))
        self.stdout.write(f"مشتری نمونه: {AgentCompany.objects.filter(tenant=company).count()}")
        self.stdout.write(f"قرارداد نمونه: {Contract.objects.filter(number__startswith='DEMO-').count()}")
        self.stdout.write(f"تامین‌کننده نمونه: {Supplier.objects.filter(code__startswith='DEMO-').count()}")
        self.stdout.write(f"سفارش نمونه: {Order.objects.filter(notes__contains='[DEMO-').count()}")
        if user_created:
            self.stdout.write(f"ورود تست: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            self.stdout.write(f"حساب ورود تست موجود است: {DEMO_EMAIL} (رمز بازنشانی نشد)")
