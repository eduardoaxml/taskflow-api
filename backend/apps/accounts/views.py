from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserProfileSerializer,
    UserRegistrationSerializer,
)

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
    permission_classes = (permissions.AllowAny,)
    

@extend_schema(
    tags=["Authentication"],
    summary="Get the authenticated user's profile",
    description="Returns the profile of the currently authenticated user.",
)
class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user