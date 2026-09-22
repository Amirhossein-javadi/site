from decimal import Decimal

from django.db.models import Q, Sum

from .models import LedgerEntry


def record_debit(*, contract, amount_irt: Decimal, reference: str, note: str = "") -> LedgerEntry:
    return LedgerEntry.objects.create(
        contract=contract, kind=LedgerEntry.Kind.DEBIT,
        amount_irt=amount_irt, reference=reference, note=note,
    )


def record_credit(*, contract, amount_irt: Decimal, reference: str, note: str = "") -> LedgerEntry:
    return LedgerEntry.objects.create(
        contract=contract, kind=LedgerEntry.Kind.CREDIT,
        amount_irt=amount_irt, reference=reference, note=note,
    )


def contract_balance(contract) -> dict:
    """
    مانده حساب یک قرارداد.
    balance مثبت یعنی نماینده به ما بدهکار است (فاکتور بیشتر از پرداخت).
    """
    agg = LedgerEntry.objects.filter(contract=contract).aggregate(
        debit=Sum("amount_irt", filter=Q(kind=LedgerEntry.Kind.DEBIT)),
        credit=Sum("amount_irt", filter=Q(kind=LedgerEntry.Kind.CREDIT)),
    )
    debit = agg["debit"] or Decimal("0")
    credit = agg["credit"] or Decimal("0")
    return {"debit": debit, "credit": credit, "balance": debit - credit}
