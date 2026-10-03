from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .access import ensure_user_access


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class ObtainExpiringAuthToken(APIView):
    """Authenticate credentials, rate-limit attempts, and issue expiring tokens."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = AuthTokenSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        ensure_user_access(user)

        with transaction.atomic():
            token, _ = Token.objects.get_or_create(user=user)
            expires_at = token.created + timedelta(
                seconds=settings.API_TOKEN_TTL_SECONDS
            )
            if expires_at <= timezone.now():
                token.delete()
                token = Token.objects.create(user=user)
                expires_at = token.created + timedelta(
                    seconds=settings.API_TOKEN_TTL_SECONDS
                )

        return Response(
            {"token": token.key, "expires_at": expires_at},
            status=status.HTTP_200_OK,
        )


class RevokeAuthToken(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if isinstance(request.auth, Token):
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
