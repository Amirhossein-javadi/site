from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, create_payment_intent

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")

# همان نکته urls.py اپ pricing: مسیر دستی باید قبل از router.urls باشد.
urlpatterns = [
    path("payments/create/", create_payment_intent, name="payment-create"),
] + router.urls
