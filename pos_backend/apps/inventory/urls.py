from rest_framework.routers import DefaultRouter

from .views import (
    DeviceSerialViewSet,
    InventoryItemViewSet,
    InventoryLedgerViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()
router.register("warehouses", WarehouseViewSet, basename="warehouse")
router.register("inventory", InventoryItemViewSet, basename="inventory")
router.register("serials", DeviceSerialViewSet, basename="serial")
router.register("inventory-ledger", InventoryLedgerViewSet, basename="ledger")

urlpatterns = router.urls
