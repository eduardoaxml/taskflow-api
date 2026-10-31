from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from apps.accounts.models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=12,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "password",
        )
        read_only_fields = ("id",)

    def validate_email(self, value):
        normalized_email = User.objects.normalize_email(value.strip())

        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return normalized_email

    def validate_password(self, value):
        user = User(
            email=self.initial_data.get("email", ""),
            first_name=self.initial_data.get("first_name", ""),
            last_name=self.initial_data.get("last_name", ""),
        )

        try:
            password_validation.validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            **validated_data,
        )


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
        )
        read_only_fields = (
            "id",
            "email",
        )
        
class UserPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=12,
        style={"input_type": "password"},
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Your current password is incorrect."
            )

        return value

    def validate_new_password(self, value):
        user = self.context["request"].user

        try:
            password_validation.validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc

        return value

    def validate(self, attrs):
        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError({
                "new_password": (
                    "Your new password must be different "
                    "from your current password."
                )
            })

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user

        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        outstanding_tokens = OutstandingToken.objects.filter(
            user=user,
        )

        for outstanding_token in outstanding_tokens.iterator():
            BlacklistedToken.objects.get_or_create(
                token=outstanding_token,
            )

        return user


class UserLogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate_refresh(self, value):
        try:
            refresh_token = RefreshToken(value)
        except TokenError as exc:
            raise serializers.ValidationError(
                "The refresh token is invalid or expired."
            ) from exc

        user = self.context["request"].user
        user_id_claim = refresh_token.payload.get(
            "user_id"
        )

        if str(user_id_claim) != str(user.pk):
            raise serializers.ValidationError(
                "The refresh token does not belong to this user."
            )

        return value

    def save(self, **kwargs):
        refresh_token = RefreshToken(
            self.validated_data["refresh"]
        )
        refresh_token.blacklist()

        return refresh_token