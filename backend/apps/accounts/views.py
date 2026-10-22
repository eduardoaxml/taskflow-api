from rest_framework import generics, permissions

from apps.accounts.models import User
from apps.accounts.serializers import UserRegistrationSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=["Authentication"],
    summary="Register a user",
    description=(
        "Creates a new user account using an email address "
        "and password."
    ),
)
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]