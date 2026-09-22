from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models


class UserManager(BaseUserManager):
    """چون USERNAME_FIELD به email تغییر کرده، UserManager سفارشی لازم است."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("ایمیل الزامی است")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        # سوپریوزر پلتفرم (تیم عملیات SaaS) به هیچ Tenant خاصی محدود نیست
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser باید is_staff=True باشد")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser باید is_superuser=True باشد")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model پلتفرم.
    - احراز هویت با ایمیل (نه username)
    - Role برای RBAC سطح اپلیکیشن
    - tenant برای مرز Multi-tenancy
    """

    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "ادمین ارشد"
        SALES_MANAGER = "sales_manager", "مدیر فروش"
        SALES_EXPERT = "sales_expert", "کارشناس فروش"
        FINANCE = "finance", "مالی"
        WAREHOUSE = "warehouse", "انباردار"
        AGENT = "agent", "نماینده"
        OBSERVER = "observer", "ناظر"

    email = models.EmailField(unique=True, verbose_name="ایمیل")
    first_name = models.CharField(max_length=150, blank=True, verbose_name="نام")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="نام خانوادگی")

    role = models.CharField(
        max_length=20, choices=Role.choices, blank=True, null=True, verbose_name="نقش"
    )
    tenant = models.ForeignKey(
        "tenants.Company",
        on_delete=models.PROTECT,
        related_name="users",
        blank=True,
        null=True,
        verbose_name="شرکت (Tenant)",
        help_text="مرز Multi-tenancy؛ فقط برای Superuser پلتفرمی خالی می‌ماند.",
    )

    is_active = models.BooleanField(default=True, verbose_name="فعال")
    is_staff = models.BooleanField(
        default=False,
        verbose_name="دسترسی Django Admin",
        help_text="مستقل از Role بیزینسی — فقط دسترسی پنل ادمین جنگو.",
    )
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ عضویت")

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self):
        return self.email

    def clean(self):
        super().clean()
        if not self.is_superuser:
            if not self.tenant_id:
                raise ValidationError({"tenant": "برای کاربران غیر Superuser، Tenant الزامی است."})
            if not self.role:
                raise ValidationError({"role": "برای کاربران غیر Superuser، Role الزامی است."})

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_short_name(self):
        return self.first_name or self.email
