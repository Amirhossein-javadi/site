from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LedgerEntryViewSet, contract_balance

router = DefaultRouter()
router.register("finance/ledger", LedgerEntryViewSet, basename="ledger-entry")

urlpatterns = router.urls + [
    path("finance/balance/", contract_balance, name="finance-balance"),
]
