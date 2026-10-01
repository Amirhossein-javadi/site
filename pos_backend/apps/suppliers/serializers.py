from rest_framework import serializers

from apps.tenants.querysets import tenant_for_user

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    def validate_code(self, value):
        request = self.context.get("request")
        tenant = tenant_for_user(getattr(request, "user", None))
        if tenant is None:
            raise serializers.ValidationError("حساب کاربری به شرکت متصل نیست.")

        matching = Supplier.objects.filter(tenant=tenant, code=value)
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
