
from rest_framework import serializers

from apps.accounts.models import User
from apps.organizations.models import Membership


class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )
    user_id = serializers.UUIDField(
        source="user.id",
        read_only=True,
    )

    class Meta:
        model = Membership
        fields = [
            "id",
            "user_id",
            "user_email",
            "role",
            "is_active",
            "joined_at",
        ]
        read_only_fields = fields


class MembershipCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[
            (Membership.Role.ADMIN, "Admin"),
            (Membership.Role.MEMBER, "Member"),
        ],
        default=Membership.Role.MEMBER,
    )

    def validate_email(self, value):
        normalized_email = User.objects.normalize_email(value.strip())
        user = User.objects.filter(email__iexact=normalized_email).first()

        if user is None:
            raise serializers.ValidationError(
                "No registered user was found with this email."
            )

        self.context["target_user"] = user
        return normalized_email

    def validate(self, attrs):
        organization = self.context["organization"]
        target_user = self.context["target_user"]

        if Membership.objects.filter(
            organization=organization,
            user=target_user,
        ).exists():
            raise serializers.ValidationError(
                {"email": "This user already has a membership."}
            )

        return attrs

    def create(self, validated_data):
        return Membership.objects.create(
            organization=self.context["organization"],
            user=self.context["target_user"],
            role=validated_data["role"],
        )


class MembershipUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=[
            (Membership.Role.ADMIN, "Admin"),
            (Membership.Role.MEMBER, "Member"),
        ],
        required=True,
    )

    class Meta:
        model = Membership
        fields = ["role"]

