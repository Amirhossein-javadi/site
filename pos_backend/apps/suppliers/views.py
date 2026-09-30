from rest_framework import viewsets
from rest_framework.filters import SearchFilter

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Supplier.objects.select_related("tenant")
    serializer_class = SupplierSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name", "code", "contact_person", "phone"]
