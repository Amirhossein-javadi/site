from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.contracts.models import Contract

from . import services
from .models import LedgerEntry
from .serializers import LedgerEntrySerializer


class LedgerEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """?contract=<id> برای محدود کردن به یک قرارداد."""

    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        qs = LedgerEntry.objects.select_related("contract")
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            qs = qs.filter(contract_id=contract_id)
        return qs


@api_view(["GET"])
def contract_balance(request):
    """GET /api/finance/balance/?contract=<id>"""
    contract_id = request.query_params.get("contract")
    contract = get_object_or_404(Contract, pk=contract_id)
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
