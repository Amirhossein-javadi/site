import csv

from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.contracts.models import Contract
from apps.tenants.querysets import for_user_tenant
from apps.users.models import User
from apps.users.permissions import require_roles

from . import services
from .models import LedgerEntry
from .serializers import LedgerEntrySerializer


def _ledger_queryset(user, params):
    qs = for_user_tenant(
        LedgerEntry.objects.select_related("contract"),
        user,
        lookup="contract__tenant_id",
        agent_lookup="contract__agent_id",
    )

    contract_id = params.get("contract")
    if contract_id:
        if not contract_id.isdecimal():
            raise ValidationError({"contract": "شناسه قرارداد معتبر نیست."})
        qs = qs.filter(contract_id=contract_id)

    from_raw = params.get("from_date")
    to_raw = params.get("to_date")
    from_date = parse_date(from_raw) if from_raw else None
    to_date = parse_date(to_raw) if to_raw else None
    if from_raw and from_date is None:
        raise ValidationError({"from_date": "تاریخ شروع معتبر نیست؛ قالب YYYY-MM-DD را وارد کنید."})
    if to_raw and to_date is None:
        raise ValidationError({"to_date": "تاریخ پایان معتبر نیست؛ قالب YYYY-MM-DD را وارد کنید."})
    if from_date and to_date and from_date > to_date:
        raise ValidationError({"to_date": "تاریخ پایان نباید پیش از تاریخ شروع باشد."})
    if from_date:
        qs = qs.filter(created_at__date__gte=from_date)
    if to_date:
        qs = qs.filter(created_at__date__lte=to_date)

    return qs.order_by("-created_at", "-pk")


class LedgerEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """Filter ledger rows by contract and an inclusive date range."""

    serializer_class = LedgerEntrySerializer
    read_roles = (
        User.Role.SUPER_ADMIN,
        User.Role.FINANCE,
        User.Role.SALES_MANAGER,
    )

    def get_queryset(self):
        return _ledger_queryset(self.request.user, self.request.query_params)


class _CsvEcho:
    def write(self, value):
        return value


def _safe_csv_cell(value):
    text = "" if value is None else str(value)
    candidate = text.lstrip(" \t\r\n")
    if text.startswith(("\t", "\r", "\n")) or candidate.startswith(("=", "+", "-", "@")):
        return f"'{text}"
    return text


@api_view(["GET"])
def ledger_export_csv(request):
    """Export the same tenant-scoped ledger filters as the list endpoint."""
    require_roles(
        request.user,
        User.Role.SUPER_ADMIN,
        User.Role.FINANCE,
        User.Role.SALES_MANAGER,
    )
    entries = _ledger_queryset(request.user, request.query_params)
    writer = csv.writer(_CsvEcho())

    def rows():
        yield "\ufeff"
        yield writer.writerow(
            [
                "تاریخ ثبت",
                "شماره قرارداد",
                "نوع گردش",
                "بدهکار (تومان)",
                "بستانکار (تومان)",
                "مرجع",
                "توضیح",
            ]
        )
        for entry in entries.iterator(chunk_size=2000):
            local_created_at = timezone.localtime(entry.created_at)
            is_debit = entry.kind == LedgerEntry.Kind.DEBIT
            yield writer.writerow(
                [
                    local_created_at.isoformat(timespec="seconds"),
                    _safe_csv_cell(entry.contract.number),
                    entry.get_kind_display(),
                    str(entry.amount_irt) if is_debit else "",
                    "" if is_debit else str(entry.amount_irt),
                    _safe_csv_cell(entry.reference),
                    _safe_csv_cell(entry.note),
                ]
            )

    response = StreamingHttpResponse(
        rows(), content_type="text/csv; charset=utf-8"
    )
    response["Content-Disposition"] = 'attachment; filename="finance-ledger.csv"'
    response["Cache-Control"] = "no-store"
    return response


@api_view(["GET"])
def contract_balance(request):
    """GET /api/finance/balance/?contract=<id>"""
    require_roles(
        request.user,
        User.Role.SUPER_ADMIN,
        User.Role.FINANCE,
        User.Role.SALES_MANAGER,
    )
    contract_id = request.query_params.get("contract")
    contract = get_object_or_404(
        for_user_tenant(Contract.objects.all(), request.user), pk=contract_id
    )
    balance = services.contract_balance(contract)
    return Response(
        {
            "success": True,
            "data": {
                "contract": contract.id,
                "contract_number": contract.number,
                "debit": str(balance["debit"]),
                "credit": str(balance["credit"]),
                "balance": str(balance["balance"]),
            },
        }
    )
