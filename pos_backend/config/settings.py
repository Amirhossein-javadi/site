"""
تنظیمات پروژه — Foundation / Phase 1 + اتصال API به فرانت‌اند React
پلتفرم B2B SaaS مدیریت نمایندگان و ترمینال‌های POS
"""

from pathlib import Path
from urllib.parse import urlsplit
import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1"] if DEBUG else [],
)

if not DEBUG:
    if len(SECRET_KEY) < 50 or SECRET_KEY == "change-me-to-a-random-50-char-string":
        raise ImproperlyConfigured(
            "برای محیط غیرتوسعه، DJANGO_SECRET_KEY باید یک کلید تصادفی و حداقل ۵۰ نویسه‌ای باشد."
        )
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured(
            "در محیط غیرتوسعه، DJANGO_ALLOWED_HOSTS را با دامنه‌های واقعی سایت تنظیم کنید."
        )
    if "*" in ALLOWED_HOSTS or any(
        host.lower() in {"localhost", "127.0.0.1", "[::1]"}
        for host in ALLOWED_HOSTS
    ):
        raise ImproperlyConfigured(
            "در محیط غیرتوسعه، DJANGO_ALLOWED_HOSTS باید فقط دامنه‌های واقعی سایت را داشته باشد."
        )

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # اپ‌های شخص ثالث
    "rest_framework",
    "corsheaders",

    # اپ‌های پروژه
    "apps.tenants",
    "apps.users",
    "apps.contracts",
    "apps.catalog",
    "apps.inventory",
    "apps.orders",
    "apps.pricing",
    "apps.payments",
    "apps.finance",
    "apps.suppliers",
    "apps.customers",
    "rest_framework.authtoken",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # باید قبل از CommonMiddleware باشد
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # باید بعد از AuthenticationMiddleware باشد چون به request.user نیاز دارد
    "apps.tenants.middleware.TenantMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Multi-tenancy: Shared DB + Tenant FK ---
# DB_ENGINE از .env خوانده می‌شود: "sqlite" برای توسعه محلی سریع (پیش‌فرض)
# یا "postgres" برای هر جایی که همزمانی واقعی لازم است.
#
# هشدار مهم: select_for_update (قفل ردیف در apps/inventory/services.py)
# روی SQLite قفل واقعی سطح ردیف ایجاد نمی‌کند — کل فایل دیتابیس قفل
# می‌شود. یعنی تضمین «جلوگیری از Overselling در همزمانی» که این پروژه
# رویش ساخته شده، روی SQLite واقعاً برقرار نیست؛ SQLite فقط برای توسعه
# تک‌کاربره راحت است. قبل از هر تست بار واقعی یا استقرار، DB_ENGINE باید
# postgres باشد.
DB_ENGINE = env("DB_ENGINE", default="sqlite")
if not DEBUG and DB_ENGINE != "postgres":
    raise ImproperlyConfigured(
        "برای اجرای غیرتوسعه از PostgreSQL استفاده کنید؛ SQLite فقط برای توسعه محلی است."
    )

if DB_ENGINE == "postgres":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="pos_platform"),
            "USER": env("DB_USER", default="postgres"),
            "PASSWORD": env("DB_PASSWORD", default=""),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
            "CONN_MAX_AGE": env.int("DB_CONN_MAX_AGE", default=60),
            "OPTIONS": {
                "sslmode": env("DB_SSLMODE", default="prefer" if DEBUG else "require")
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

if not DEBUG:
    # Shared across web workers, so login throttling is not reset per process.
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.db.DatabaseCache",
            "LOCATION": env("CACHE_TABLE_NAME", default="django_cache"),
        }
    }

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- امنیت Production ---
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = env.int("SESSION_COOKIE_AGE", default=3600)
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=0 if DEBUG else 2592000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=not DEBUG
)
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

API_TOKEN_TTL_SECONDS = env.int("API_TOKEN_TTL_SECONDS", default=12 * 60 * 60)
if API_TOKEN_TTL_SECONDS <= 0:
    raise ImproperlyConfigured("API_TOKEN_TTL_SECONDS باید عددی بزرگ‌تر از صفر باشد.")
API_THROTTLE_NUM_PROXIES = env.int("API_THROTTLE_NUM_PROXIES", default=0)
if API_THROTTLE_NUM_PROXIES < 0:
    raise ImproperlyConfigured("API_THROTTLE_NUM_PROXIES نمی‌تواند منفی باشد.")

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
        "apps.users.permissions.RoleBasedWritePermission",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.users.authentication.ExpiringTokenAuthentication",
    ],
    "DEFAULT_THROTTLE_RATES": {"login": "5/minute"},
    "NUM_PROXIES": API_THROTTLE_NUM_PROXIES,
}

# --- CORS: اجازه دسترسی از سرور Dev فرانت‌اند (Vite) ---
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"] if DEBUG else [],
)
if not DEBUG:
    # مقادیر توسعه‌ای نمونه نباید با کپی .env.example به سایت زنده راه پیدا کنند.
    CORS_ALLOWED_ORIGINS = [
        origin for origin in CORS_ALLOWED_ORIGINS
        if urlsplit(origin).scheme == "https"
        and urlsplit(origin).hostname not in {"localhost", "127.0.0.1", "::1"}
    ]
CORS_EXPOSE_HEADERS = ["Content-Disposition"]
