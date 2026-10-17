from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.organizations.models import Membership, Organization
from apps.organizations.serializers import OrganizationSerializer
from apps.organizations.membership_serializers import (
    MembershipCreateSerializer,
    MembershipSerializer,
    MembershipUpdateSerializer,
)
from apps.organizations.permissions import (
    IsOrganizationManager,
    IsOrganizationMember,
)

class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
        ).distinct()


class OrganizationDetailView(generics.RetrieveAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
        ).distinct()


class OrganizationMembershipListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()

        response_serializer = MembershipSerializer(
            membership,
            context=self.get_serializer_context(),
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def get_organization(self):
        return get_object_or_404(
            Organization,
            id=self.kwargs["organization_id"],
        )

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]

        if self.request.method == "POST":
            permission_classes.append(IsOrganizationManager)
        else:
            permission_classes.append(IsOrganizationMember)

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        return Membership.objects.filter(
            organization_id=self.kwargs["organization_id"],
            organization__memberships__user=self.request.user,
            organization__memberships__is_active=True,
        ).select_related("user", "organization").distinct()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MembershipCreateSerializer
        return MembershipSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_organization()
        return context

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            serializer.save()
        except IntegrityError as exc:
            raise ValidationError(
                {"email": "This user already has a membership."}
            ) from exc


class OrganizationMembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizationMember,
    ]
    serializer_class = MembershipSerializer
    lookup_url_kwarg = "membership_id"

    def get_queryset(self):
        return Membership.objects.filter(
            organization_id=self.kwargs["organization_id"],
            organization__memberships__user=self.request.user,
            organization__memberships__is_active=True,
        ).select_related("user", "organization").distinct()

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]

        if self.request.method in ("PATCH", "PUT", "DELETE"):
            permission_classes.append(IsOrganizationManager)
        else:
            permission_classes.append(IsOrganizationMember)

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return MembershipUpdateSerializer
        return MembershipSerializer

    def _validate_target(self, membership):
        actor_membership = get_object_or_404(
            Membership,
            organization_id=self.kwargs["organization_id"],
            user=self.request.user,
            is_active=True,
        )

        if membership.role == Membership.Role.OWNER:
            raise PermissionDenied(
                "The organization owner cannot be changed or removed "
                "through this endpoint."
            )

        if (
            actor_membership.role == Membership.Role.ADMIN
            and membership.role == Membership.Role.ADMIN
        ):
            raise PermissionDenied(
                "Administrators cannot modify other administrators."
            )

    def perform_update(self, serializer):
        membership = self.get_object()
        self._validate_target(membership)
        serializer.save()

    def perform_destroy(self, instance):
        self._validate_target(instance)
        instance.delete()
