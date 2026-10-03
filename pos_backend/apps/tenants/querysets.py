"""Helpers for enforcing tenant boundaries in API querysets."""


def for_user_tenant(queryset, user, lookup="tenant_id", agent_lookup=None):
    """Return rows owned by the user's tenant (or all rows for platform admins)."""
    if getattr(user, "is_superuser", False):
        return queryset
    tenant_id = getattr(user, "tenant_id", None)
    if tenant_id is None:
        return queryset.none()
    queryset = queryset.filter(**{lookup: tenant_id})
    if getattr(user, "role", None) == "agent" and agent_lookup:
        agent_company_id = getattr(user, "agent_company_id", None)
        if agent_company_id is None:
            return queryset.none()
        queryset = queryset.filter(**{agent_lookup: agent_company_id})
    return queryset


def tenant_for_user(user):
    """Resolve the write tenant for business users and single-tenant admins."""
    tenant = getattr(user, "tenant", None)
    if tenant is not None:
        return tenant
    if getattr(user, "is_superuser", False):
        from .models import Company

        tenants = Company.objects.order_by("pk")[:2]
        if len(tenants) == 1:
            return tenants[0]
    return None
