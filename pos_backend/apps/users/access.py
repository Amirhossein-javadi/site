from rest_framework.exceptions import AuthenticationFailed


def ensure_user_access(user):
    """Fail closed for business users with missing or inactive tenant links."""
    if user.is_superuser:
        return
    if not user.tenant_id or not user.role:
        raise AuthenticationFailed("حساب کاربری به شرکت یا نقش فعال متصل نیست.")
    if not user.tenant.is_active:
        raise AuthenticationFailed("دسترسی این شرکت غیرفعال شده است.")
    if user.role == "agent":
        if not user.agent_company_id:
            raise AuthenticationFailed("حساب نماینده به شرکت نماینده متصل نیست.")
        agent_company = user.agent_company
        if agent_company.tenant_id != user.tenant_id or not agent_company.is_active:
            raise AuthenticationFailed("دسترسی این شرکت نماینده غیرفعال یا نامعتبر است.")
