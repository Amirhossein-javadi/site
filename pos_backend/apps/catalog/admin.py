from django.contrib import admin

from .models import Brand, Category, Product, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ("name", "sku", "base_price", "currency", "requires_serial", "is_active")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "category", "brand", "tenant", "is_active")
    list_filter = ("category", "brand", "is_active")
    search_fields = ("name", "code")
    inlines = [ProductVariantInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "name", "base_price", "currency", "requires_serial")
    list_filter = ("currency", "requires_serial", "is_active")
    search_fields = ("sku", "name", "product__name")
