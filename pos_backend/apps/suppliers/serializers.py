from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    def validate_code(self, value):
        request = self.context.get("request")
        tenant_id = getattr(getattr(request, "user", None), "tenant_id", None)
        if tenant_id is None:
            raise serializers.ValidationError("حساب کاربری به شرکت متصل نیست.")

        matching = Supplier.objects.filter(tenant_id=tenant_id, code=value)
        if self.instance:
            matching = matching.exclude(pk=self.instance.pk)
        if matching.exists():
            raise serializers.ValidationError("این کد قبلاً برای شرکت شما ثبت شده است.")
        return value

    class Meta:
        model = Supplier
        fields = [
            "id", "name", "code", "contact_person", "phone",
            "lead_time_days", "status", "status_label",
        ]
