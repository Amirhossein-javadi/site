from django.db.models import F, IntegerField, Prefetch, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import Brand, Category, Product, ProductVariant
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    ProductSerializer,
    ProductVariantSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer


# موجودی قابل فروش = on_hand - reserved، جمع‌زده روی همه انبارها.
# Coalesce لازم است چون نسخه‌ای که هنوز هیچ ردیف موجودی ندارد باید صفر
# برگرداند، نه null.
_AVAILABLE = Coalesce(
    Sum(F("inventory_items__on_hand") - F("inventory_items__reserved")),
    Value(0),
    output_field=IntegerField(),
)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    فهرست محصولات همراه با نسخه‌ها و موجودی قابل فروش هرکدام.
    """

    serializer_class = ProductSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "code", "variants__sku", "brand__name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        variants = (
            ProductVariant.objects.filter(is_active=True)
            .annotate(total_available=_AVAILABLE)
            .order_by("name")
        )
        return (
            Product.objects.filter(is_active=True)
            .select_related("category", "brand")
            .prefetch_related(Prefetch("variants", queryset=variants))
            .distinct()
        )


class ProductVariantViewSet(viewsets.ReadOnlyModelViewSet):
    """فهرست تخت نسخه‌های محصول — برای فرم‌های انتخاب کالا مناسب‌تر است."""

    serializer_class = ProductVariantSerializer
    filter_backends = [SearchFilter]
    search_fields = ["sku", "name", "product__name"]

    def get_queryset(self):
        return (
            ProductVariant.objects.filter(is_active=True)
            .select_related("product")
            .annotate(total_available=_AVAILABLE)
        )
