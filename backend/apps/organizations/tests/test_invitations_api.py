
import pytest
from datetime import timedelta

from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.organizations.models import Membership, OrganizationInvitation


@pytest.fixture
def invitation_client_setup(setup_organization):
    data = setup_organization
    client = APIClient()

    return {
        **data,
        "client": client,
    }


def invitation_list_url(organization):
    return reverse(
        "organizations:organization-invitation-list-create",
        kwargs={"organization_id": organization.id},
    )


@pytest.mark.django_db
def test_admin_can_create_invitation(invitation_client_setup):
    data = invitation_client_setup
    data["client"].force_authenticate(user=data["admin"])

    response = data["client"].post(
        invitation_list_url(data["organization"]),
        {
            "email": "newmember@example.com",
            "role": "MEMBER",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert OrganizationInvitation.objects.filter(
        organization=data["organization"],
        email="newmember@example.com",
        status=OrganizationInvitation.Status.PENDING,
    ).exists()


@pytest.mark.django_db
def test_member_cannot_create_invitation(invitation_client_setup):
    data = invitation_client_setup
    data["client"].force_authenticate(user=data["member"])

    response = data["client"].post(
        invitation_list_url(data["organization"]),
        {
            "email": "newmember@example.com",
            "role": "MEMBER",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_duplicate_pending_invitation_is_rejected(
    invitation_client_setup,
):
    data = invitation_client_setup
    organization = data["organization"]

    OrganizationInvitation.objects.create(
        organization=organization,
        email="newmember@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=data["admin"])

    response = data["client"].post(
        invitation_list_url(organization),
        {
            "email": "newmember@example.com",
            "role": "MEMBER",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_admin_can_list_invitations(invitation_client_setup):
    data = invitation_client_setup
    organization = data["organization"]

    invitation = OrganizationInvitation.objects.create(
        organization=organization,
        email="pending@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=data["admin"])

    response = data["client"].get(
        invitation_list_url(organization),
    )

    assert response.status_code == status.HTTP_200_OK

    invitation_ids = [
        item["id"] for item in response.data["results"]
    ]
    assert str(invitation.id) in invitation_ids
    


@pytest.mark.django_db
def test_invited_user_can_accept_invitation(invitation_client_setup):
    data = invitation_client_setup
    organization = data["organization"]

    invited_user = User.objects.create_user(
        email="newmember@example.com",
        password="Secure-TaskFlow-2026!",
    )

    invitation = OrganizationInvitation.objects.create(
        organization=organization,
        email=invited_user.email,
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=invited_user)

    response = data["client"].post(
        reverse(
            "organizations:organization-invitation-accept",
            kwargs={"invitation_id": invitation.id},
        ),
    )

    assert response.status_code == status.HTTP_200_OK

    invitation.refresh_from_db()
    assert invitation.status == OrganizationInvitation.Status.ACCEPTED

    assert Membership.objects.filter(
        organization=organization,
        user=invited_user,
        is_active=True,
    ).exists()


@pytest.mark.django_db
def test_user_with_different_email_cannot_accept_invitation(
    invitation_client_setup,
):
    data = invitation_client_setup

    invitation = OrganizationInvitation.objects.create(
        organization=data["organization"],
        email="invited@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=data["outsider"])

    response = data["client"].post(
        reverse(
            "organizations:organization-invitation-accept",
            kwargs={"invitation_id": invitation.id},
        ),
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_expired_invitation_cannot_be_accepted(invitation_client_setup):
    data = invitation_client_setup

    invited_user = User.objects.create_user(
        email="expired@example.com",
        password="Secure-TaskFlow-2026!",
    )

    invitation = OrganizationInvitation.objects.create(
        organization=data["organization"],
        email=invited_user.email,
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() - timedelta(days=1),
    )

    data["client"].force_authenticate(user=invited_user)

    response = data["client"].post(
        reverse(
            "organizations:organization-invitation-accept",
            kwargs={"invitation_id": invitation.id},
        ),
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_admin_can_cancel_pending_invitation(invitation_client_setup):
    data = invitation_client_setup

    invitation = OrganizationInvitation.objects.create(
        organization=data["organization"],
        email="cancel-me@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=data["admin"])

    response = data["client"].post(
        reverse(
            "organizations:organization-invitation-cancel",
            kwargs={"invitation_id": invitation.id},
        ),
    )

    assert response.status_code == status.HTTP_200_OK

    invitation.refresh_from_db()
    assert invitation.status == OrganizationInvitation.Status.CANCELLED


@pytest.mark.django_db
def test_accepted_invitation_cannot_be_cancelled(
    invitation_client_setup,
):
    data = invitation_client_setup

    invitation = OrganizationInvitation.objects.create(
        organization=data["organization"],
        email="accepted@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        status=OrganizationInvitation.Status.ACCEPTED,
        expires_at=timezone.now() + timedelta(days=7),
    )

    data["client"].force_authenticate(user=data["admin"])

    response = data["client"].post(
        reverse(
            "organizations:organization-invitation-cancel",
            kwargs={"invitation_id": invitation.id},
        ),
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST

