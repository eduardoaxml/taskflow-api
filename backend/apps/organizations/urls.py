
from django.urls import path

from apps.organizations.views import (
    OrganizationDetailView,
    OrganizationInvitationAcceptView,
    OrganizationInvitationCancelView,
    OrganizationInvitationCreateView,
    OrganizationInvitationListView,
    OrganizationListCreateView,
    OrganizationMembershipDetailView,
    OrganizationMembershipListCreateView,
)

app_name = "organizations"

urlpatterns = [
    path(
        "",
        OrganizationListCreateView.as_view(),
        name="organization-list",
    ),
    path(
        "organizations/",
        OrganizationListCreateView.as_view(),
        name="organization-list",
    ),
    path(
        "<uuid:id>/",
        OrganizationDetailView.as_view(),
        name="organization-detail",
    ),
    path(
        "<uuid:organization_id>/members/",
        OrganizationMembershipListCreateView.as_view(),
        name="membership-list",
    ),
    path(
        "<uuid:organization_id>/members/<uuid:membership_id>/",
        OrganizationMembershipDetailView.as_view(),
        name="membership-detail",
    ),
    path(
        "<uuid:organization_id>/invitations/",
        OrganizationInvitationCreateView.as_view(),
        name="organization-invitation-list-create",
    ),
    path(
        "invitations/<uuid:invitation_id>/accept/",
        OrganizationInvitationAcceptView.as_view(),
        name="organization-invitation-accept",
    ),
    path(
        "<uuid:organization_id>/invitations/",
        OrganizationInvitationListView.as_view(),
        name="organization-invitation-list",
    ),
    path(
        "invitations/<uuid:invitation_id>/cancel/",
        OrganizationInvitationCancelView.as_view(),
        name="organization-invitation-cancel",
    ),
]
