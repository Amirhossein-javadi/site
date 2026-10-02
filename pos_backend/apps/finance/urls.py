from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LedgerEntryViewSet, contract_balance, ledger_export_csv

router = DefaultRouter()
router.register("finance/ledger", LedgerEntryViewSet, basename="ledger-entry")

urlpatterns = [
    path("finance/ledger/export/", ledger_export_csv, name="finance-ledger-export"),
    path("finance/balance/", contract_balance, name="finance-balance"),
] + router.urls
