
from rest_framework.permissions import BasePermission

from apps.organizations.models import Membership


class IsOrganizationMember(BasePermission):
    """Allow access only to active members of the requested organization."""

    message = "You are not an active member of this organization."

    def has_permission(self, request, view):
        organization_id = view.kwargs.get("organization_id")

        if not organization_id or not request.user.is_authenticated:
            return False

        return Membership.objects.filter(
            organization_id=organization_id,
            user=request.user,
            is_active=True,
        ).exists()


class IsOrganizationManager(BasePermission):
    """Allow organization management to owners and administrators."""

    message = "You need an owner or admin role to perform this action."

    def has_permission(self, request, view):
        organization_id = view.kwargs.get("organization_id")

        if not organization_id or not request.user.is_authenticated:
            return False

        return Membership.objects.filter(
            organization_id=organization_id,
            user=request.user,
            is_active=True,
            role__in=[
                Membership.Role.OWNER,
                Membership.Role.ADMIN,
            ],
        ).exists()
