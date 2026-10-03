from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.exceptions import PermissionDenied


class RoleBasedWritePermission(BasePermission):
    """Require each API view to explicitly list roles allowed to write."""

    message = "نقش کاربری شما اجازه انجام این عملیات را ندارد."

    def has_permission(self, request, view):
        user = request.user
        if request.method in SAFE_METHODS:
            read_roles = getattr(view, "read_roles", None)
            return bool(
                user
                and user.is_authenticated
                and (
                    read_roles is None
                    or user.is_superuser
                    or user.role in read_roles
                )
            )
        allowed_roles = getattr(view, "write_roles", ())
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in allowed_roles)
        )


def require_roles(user, *roles):
    """Enforce narrower role rules inside multi-action API endpoints."""
    if user.is_superuser or getattr(user, "role", None) in roles:
        return
    raise PermissionDenied("نقش کاربری شما اجازه انجام این عملیات را ندارد.")
