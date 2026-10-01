from rest_framework.routers import DefaultRouter
from .views import OrderViewSet
from .fulfillment_views import ReturnRequestViewSet, ShipmentViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("shipments", ShipmentViewSet, basename="shipment")
router.register("returns", ReturnRequestViewSet, basename="return")

urlpatterns = router.urls
