from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/login/", obtain_auth_token),
    path("api/", include("apps.contracts.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.inventory.urls")),
    path("api/", include("apps.orders.urls")),
]
