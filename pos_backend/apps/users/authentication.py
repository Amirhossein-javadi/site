from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .access import ensure_user_access


class ExpiringTokenAuthentication(TokenAuthentication):
    """Reject and revoke API tokens after the configured session lifetime."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        ensure_user_access(user)
        expires_at = token.created + timedelta(seconds=settings.API_TOKEN_TTL_SECONDS)
        if expires_at <= timezone.now():
            token.delete()
            raise AuthenticationFailed("نشست شما منقضی شده است؛ دوباره وارد شوید.")
        return user, token
