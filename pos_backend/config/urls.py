from django.contrib import admin
from django.urls import include, path

from apps.users.auth_views import ObtainExpiringAuthToken, RevokeAuthToken

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/login/", ObtainExpiringAuthToken.as_view(), name="api-login"),
    path("api/logout/", RevokeAuthToken.as_view(), name="api-logout"),
    path("api/", include("apps.contracts.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.inventory.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.pricing.urls")),
    path("api/", include("apps.payments.urls")),
    path("api/", include("apps.finance.urls")),
    path("api/", include("apps.suppliers.urls")),
    path("api/", include("apps.customers.urls")),
]
