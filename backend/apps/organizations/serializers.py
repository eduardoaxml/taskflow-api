
from django.db import transaction
from rest_framework import serializers

from apps.organizations.models import Membership, Organization


class OrganizationSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]

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
