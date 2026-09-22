from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Order
from .serializers import OrderSerializer
from .services import place_order

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("tenant").prefetch_related("sub_orders__items")
    serializer_class = OrderSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["id"]
    ordering_fields = ["created_at", "total_amount"]

    def create(self, request, *args, **kwargs):
        """
        بازنویسی متد ثبت برای استفاده از سرویس رزرو اتمیک
        """
        # دریافت داده‌های ارسالی از فرانت‌اند
        tenant_id = request.data.get("tenant")
        items_data = request.data.get("items", [])
        
        if not items_data:
            return Response({"detail": "سفارش باید حداقل یک آیتم داشته باشد."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ارسال داده‌ها به سرویس برای ثبت و رزرو موجودی
            order = place_order(tenant_id=tenant_id, items_data=items_data)
            
            # برگرداندن اطلاعات سفارش ثبت شده به عنوان جواب
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # اگر در هر کجای کار (مثل کمبود موجودی انبار) خطایی رخ داد، به کاربر نمایش می‌دهیم
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)