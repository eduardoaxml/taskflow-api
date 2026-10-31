from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserPasswordChangeSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserLogoutSerializer,
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
    summary="Get or update the authenticated user's profile",
    description=(
        "Retrieves or updates the profile of the currently "
        "authenticated user. Only first_name and last_name "
        "can be updated."
    ),
)
class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
    

@extend_schema(
    tags=["Authentication"],
    summary="Change the authenticated user's password",
    description=(
        "Changes the password of the currently authenticated user "
        "after validating their current password and the new password."
    ),
    request=UserPasswordChangeSerializer,
    responses={
        200: None,
    },
)
class UserPasswordChangeView(generics.GenericAPIView):
    serializer_class = UserPasswordChangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Your password has been changed successfully."},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Log out the authenticated user",
    description=(
        "Blacklists the authenticated user's refresh token "
        "to prevent further token refreshes."
    ),
    request=UserLogoutSerializer,
    responses={
        200: None,
    },
)
class UserLogoutView(generics.GenericAPIView):
    serializer_class = UserLogoutSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )