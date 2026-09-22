from django.db import models


class LedgerEntry(models.Model):
    """
    دفتر مالی نماینده — append-only، مثل دفتر موجودی.

    بدهکار (DEBIT) وقتی ثبت می‌شود که پیش‌فاکتور صادر می‌شود (نماینده به
    ما بدهکار می‌شود). بستانکار (CREDIT) وقتی ثبت می‌شود که پرداخت موفق
    تایید می‌شود. مانده حساب = مجموع بدهکار − مجموع بستانکار.

    فعلاً به Contract وصل است چون هنوز مدل مستقل Agent/AgentCompany
    نداریم؛ contract.agent_name نماینده را نشان می‌دهد.
    """

    class Kind(models.TextChoices):
        DEBIT = "debit", "بدهکار"
        CREDIT = "credit", "بستانکار"

    contract = models.ForeignKey(
        "contracts.Contract", on_delete=models.PROTECT, related_name="ledger_entries"
    )
    kind = models.CharField(max_length=10, choices=Kind.choices, verbose_name="نوع")
    amount_irt = models.DecimalField(
        max_digits=20, decimal_places=4, verbose_name="مبلغ (تومان)"
    )
    reference = models.CharField(
        max_length=100, verbose_name="مرجع", help_text="شماره پیش‌فاکتور یا ارجاع پرداخت"
    )
    note = models.CharField(max_length=255, blank=True, verbose_name="توضیح")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "ردیف دفتر مالی"
        verbose_name_plural = "دفتر مالی"
        ordering = ["-created_at"]

    def __str__(self):
        sign = "+" if self.kind == self.Kind.CREDIT else "-"
        return f"{self.contract.number} {sign}{self.amount_irt} ({self.reference})"
