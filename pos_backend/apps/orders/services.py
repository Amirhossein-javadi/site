from django.db import transaction
from .models import Order, SubOrder, OrderItem
from apps.inventory.services import reserve_stock
from apps.inventory.models import Warehouse
from apps.tenants.models import Company
from apps.catalog.models import ProductVariant

@transaction.atomic
def place_order(tenant_id, items_data):
    """
    سرویس ثبت سفارش جدید:
    ۱. ساخت سفارش و زیر‌سفارش
    ۲. محاسبه قیمت کل
    ۳. رزرو موجودی از انبار
    """
    tenant = Company.objects.get(id=tenant_id)
    
    # ۱. ساخت سفارش اصلی
    order = Order.objects.create(
        tenant=tenant,
        status=Order.Status.PENDING,
        total_amount=0
    )
    
    # ۲. ساخت یک زیر‌سفارش پیش‌فرض برای این سفارش
    sub_order = SubOrder.objects.create(
        order=order,
        status=Order.Status.PENDING
    )
    
    total_amount = 0
    # برای الان فرض می‌کنیم کالا از اولین انبار شرکت کسر می‌شود
    warehouse = Warehouse.objects.filter(tenant=tenant).first()

    # ۳. ثبت آیتم‌ها و رزرو موجودی
    # ۳. ثبت آیتم‌ها و رزرو موجودی
    for item in items_data:
        variant_id = item['variant']
        quantity = item['quantity']
        unit_price = int(item['unit_price'])  # تبدیل قیمت به عدد
        
        # پیدا کردن آبجکت محصول از دیتابیس با استفاده از ID
        variant_instance = ProductVariant.objects.get(id=variant_id)
        
        # ثبت ردیف فاکتور
        OrderItem.objects.create(
            sub_order=sub_order,
            variant=variant_instance,  # اینجا آبجکت رو می‌دیم، نه عدد رو
            quantity=quantity,
            unit_price=unit_price
        )
        
        total_amount += (unit_price * quantity)
        
        # صدا زدن سرویس انبار برای قفل کردن و رزرو موجودی
        if warehouse:
            reserve_stock(
                warehouse=warehouse, 
                variant=variant_instance,  # اینجا هم آبجکت رو پاس می‌دیم
                quantity=quantity, 
                reference=f"ORDER-{order.id}"
            )
            
    # ۴. آپدیت قیمت نهایی سفارش
    order.total_amount = total_amount
    order.save()
    
    return order