from datetime import timedelta
from django.utils import timezone
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView

from apps.organizations.models import Membership, Organization, OrganizationInvitation
from apps.organizations.serializers import OrganizationSerializer, OrganizationInvitationSerializer
from apps.organizations.membership_serializers import (
    MembershipCreateSerializer,
    MembershipSerializer,
    MembershipUpdateSerializer,
)
from apps.organizations.permissions import (
    IsOrganizationManager,
    IsOrganizationMember,
)

def require_invitation_manager(organization, user):
    membership = organization.memberships.filter(
        user=user,
        is_active=True,
    ).first()

    if membership is None:
        raise PermissionDenied(
            "Active organization membership required."
        )

    if membership.role not in ("OWNER", "ADMIN"):
        raise PermissionDenied(
            "Only organization owners and admins can manage invitations."
        )

    return membership

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



class OrganizationInvitationCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationInvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_organization(self):
        organization = generics.get_object_or_404(
            Organization,
            id=self.kwargs["organization_id"],
        )

        require_invitation_manager(organization, self.request.user)

        return organization

    def get_queryset(self):
        organization = self.get_organization()
        return OrganizationInvitation.objects.filter(
            organization=organization,
        ).select_related("invited_by", "organization")

    def create(self, request, *args, **kwargs):
        organization = self.get_organization()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        if OrganizationInvitation.objects.filter(
            organization=organization,
            email__iexact=email,
            status=OrganizationInvitation.Status.PENDING,
        ).exists():
            return Response(
                {"detail": "A pending invitation already exists for this email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = serializer.save(
            organization=organization,
            invited_by=request.user,
            role="MEMBER",
            expires_at=timezone.now() + timedelta(days=7),
        )

        return Response(
            self.get_serializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )

class OrganizationInvitationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id):
        invitation = generics.get_object_or_404(
            OrganizationInvitation,
            id=invitation_id,
        )

        if invitation.status != OrganizationInvitation.Status.PENDING:
            return Response(
                {"detail": "This invitation is no longer pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.expires_at <= timezone.now():
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.email.lower() != request.user.email.lower():
            return Response(
                {"detail": "This invitation belongs to another email address."},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership, created = Membership.objects.get_or_create(
            organization=invitation.organization,
            user=request.user,
            defaults={
                "role": invitation.role,
                "is_active": True,
            },
        )

        if not created and not membership.is_active:
            membership.is_active = True
            membership.role = invitation.role
            membership.save(update_fields=["is_active", "role"])

        invitation.status = OrganizationInvitation.Status.ACCEPTED
        invitation.save(update_fields=["status"])

        return Response(
            OrganizationInvitationSerializer(invitation).data,
            status=status.HTTP_200_OK,
        )
        

class OrganizationInvitationListView(generics.ListAPIView):
    serializer_class = OrganizationInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        organization = generics.get_object_or_404(
            Organization,
            id=self.kwargs["organization_id"],
        )

        is_member = organization.memberships.filter(
            user=self.request.user,
            is_active=True,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "Active organization membership required."
            )

        return OrganizationInvitation.objects.filter(
            organization=organization,
        ).select_related("invited_by", "organization")

class OrganizationInvitationCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id):
        invitation = generics.get_object_or_404(
            OrganizationInvitation,
            id=invitation_id,
        )

        require_invitation_manager(
            invitation.organization,
            request.user,
        )

        if invitation.status != OrganizationInvitation.Status.PENDING:
            return Response(
                {"detail": "Only pending invitations can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.status = OrganizationInvitation.Status.CANCELLED
        invitation.save(update_fields=["status"])

        return Response(
            OrganizationInvitationSerializer(invitation).data,
            status=status.HTTP_200_OK,
        )