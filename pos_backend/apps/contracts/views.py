from rest_framework import viewsets
from rest_framework.filters import SearchFilter

from .models import Contract
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ReadOnlyModelViewSet):
    """
    فعلاً فقط خواندن (list/retrieve)؛ ثبت/ویرایش قرارداد در فاز بیزینسی
    بعدی که قوانین اعتبارسنجی (سقف خرید، تاریخ اعتبار) هم اضافه می‌شود.

    نکته: فیلتر بر اساس request.tenant عمداً هنوز اضافه نشده چون فرانت
    فعلاً صفحه Login ندارد؛ وقتی احراز هویت وصل شد، این ViewSet باید
    فقط qs مربوط به request.tenant را برگرداند.
    """

    queryset = Contract.objects.select_related("tenant").all()
    serializer_class = ContractSerializer
    filter_backends = [SearchFilter]
    search_fields = ["number", "title", "agent_name"]
