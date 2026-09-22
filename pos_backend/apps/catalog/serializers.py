from rest_framework import serializers

from .models import Brand, Category, Product, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "is_active"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "is_active"]


class ProductVariantSerializer(serializers.ModelSerializer):
    """
    total_available از موجودی همه انبارها جمع زده می‌شود و در ViewSet با
    annotate پر می‌شود تا از مشکل N+1 جلوگیری شود.
    """

    currency_label = serializers.CharField(source="get_currency_display", read_only=True)
    total_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "name",
            "sku",
            "barcode",
            "base_price",
            "currency",
            "currency_label",
            "requires_serial",
            "min_order_quantity",
            "lead_time_days",
            "is_active",
            "total_available",
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "code",
            "category",
            "category_name",
            "brand",
            "brand_name",
            "description",
            "warranty_months",
            "is_active",
            "variants",
        ]
