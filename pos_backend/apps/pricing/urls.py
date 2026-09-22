from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ExchangeRateViewSet, ProformaInvoiceViewSet, issue_proforma

router = DefaultRouter()
router.register("exchange-rates", ExchangeRateViewSet, basename="exchange-rate")
router.register("proforma-invoices", ProformaInvoiceViewSet, basename="proforma-invoice")

# نکته مهم: مسیر دستی issue/ باید قبل از router.urls بیاید؛ وگرنه الگوی
# جزئیات router یعنی ^proforma-invoices/(?P<pk>...)/$ زودتر «issue» را
# به‌عنوان pk می‌گیرد و هیچ‌وقت به این مسیر نمی‌رسیم (405 Method Not
# Allowed به‌جای اجرای واقعی view).
urlpatterns = [
    path("proforma-invoices/issue/", issue_proforma, name="proforma-issue"),
] + router.urls
