
from django.db import transaction
from rest_framework import serializers

from apps.organizations.models import Membership, Organization, OrganizationInvitation


class OrganizationSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Organization
        fields = (
            "id",
            "name",
            "slug",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "created_at",
            "updated_at",
        )

    @transaction.atomic
    def create(self, validated_data):
        organization = Organization.objects.create(
            created_by=self.context["request"].user,
            **validated_data,
        )

        Membership.objects.create(
            organization=organization,
            user=self.context["request"].user,
            role=Membership.Role.OWNER,
        )

        return organization


class OrganizationInvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(
        source="invited_by.email",
        read_only=True,
    )

    class Meta:
        model = OrganizationInvitation
        fields = (
            "id",
            "organization",
            "email",
            "role",
            "invited_by",
            "invited_by_email",
            "status",
            "created_at",
            "expires_at",
        )
        read_only_fields = (
            "id",
            "organization",
            "invited_by",
            "invited_by_email",
            "status",
            "created_at",
            "expires_at",
        )
