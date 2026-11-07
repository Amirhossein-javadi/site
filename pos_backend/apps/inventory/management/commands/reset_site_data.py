"""Replace local development data with the current curated demo dataset."""

import secrets

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connection

from apps.tenants.models import Company
from apps.users.models import User


class Command(BaseCommand):
    help = "پاک‌کردن کامل داده‌های محلی و ساخت مجموعه نمونه تازه"

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="تأیید حذف همه رکوردهای فعلی دیتابیس محلی",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG or connection.vendor != "sqlite":
            raise CommandError("این دستور فقط در DEBUG و روی SQLite محلی اجرا می‌شود.")
        if not options["confirm"]:
            raise CommandError("برای پاک‌سازی کامل، گزینه --confirm را اضافه کنید.")

        call_command("flush", interactive=False, reset_sequences=True, verbosity=0)
        call_command("seed_demo")

        tenant = Company.objects.get(slug="negin-rasa")
        password = secrets.token_urlsafe(24)
        User.objects.create_user(
            email="operator@local.test",
            password=password,
            tenant=tenant,
            role=User.Role.SALES_MANAGER,
        )

        self.stdout.write(self.style.SUCCESS("Legacy data cleared; fresh demo data created."))
        self.stdout.write("Dashboard login:")
        self.stdout.write("Email: operator@local.test")
        self.stdout.write(f"Temporary password: {password}")
