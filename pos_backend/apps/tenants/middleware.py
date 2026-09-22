class TenantMiddleware:
    """
    request.tenant را از روی کاربر لاگین‌کرده تنظیم می‌کند.
    فقط context را فراهم می‌کند؛ جایگزین فیلتر صریح QuerySet در هر View
    نیست. اجرای Row-Level Security واقعی در PostgreSQL (SET LOCAL
    app.current_tenant_id + POLICY) به فاز بعدی موکول شده.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = request.user.tenant if request.user.is_authenticated else None
        return self.get_response(request)
