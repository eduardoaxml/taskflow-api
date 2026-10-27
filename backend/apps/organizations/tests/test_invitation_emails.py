from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from apps.organizations.emails import send_organization_invitation
from apps.organizations.models import Membership, OrganizationInvitation

api_client = APIClient()


@pytest.mark.django_db
def test_invitation_email_contains_acceptance_link(setup_organization):
    data = setup_organization

    invitation = OrganizationInvitation.objects.create(
        organization=data["organization"],
        email="newmember@example.com",
        role=Membership.Role.MEMBER,
        invited_by=data["admin"],
        expires_at=timezone.now() + timedelta(days=7),
    )

    send_organization_invitation(invitation)

    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["newmember@example.com"]
    assert data["organization"].name in mail.outbox[0].subject
    assert str(invitation.token) in mail.outbox[0].body



def test_cancelled_invitation_cannot_be_accepted(setup_organization):
    api_client = APIClient()

    owner = setup_organization["owner"]
    member = setup_organization["member"]
    organization = setup_organization["organization"]

    api_client.force_authenticate(user=owner)

    # Create the invitation.
    create_url = (
        f"/api/v1/{organization.id}/invitations/"
    )
    create_response = api_client.post(
        create_url,
        {
            "email": member.email,
            "role": "MEMBER",
        },
        format="json",
    )

    assert create_response.status_code == 201, (
        f"Invitation creation failed: {create_response.status_code}, "
        f"{getattr(create_response, 'data', create_response.content)!r}"
    )

    invitation_id = create_response.data["id"]

    # Cancel the invitation.
    cancel_url = f"/api/v1/invitations/{invitation_id}/cancel/"
    cancel_response = api_client.post(cancel_url, format="json")

    assert cancel_response.status_code == 200, (
        f"Invitation cancellation failed: {cancel_response.status_code}, "
        f"{getattr(cancel_response, 'data', cancel_response.content)!r}"
    )

    # A cancelled invitation must not be accepted.
    api_client.force_authenticate(user=member)

    accept_url = f"/api/v1/invitations/{invitation_id}/accept/"
    accept_response = api_client.post(accept_url, format="json")

    assert accept_response.status_code in (400, 409), (
        f"Expected cancelled invitation acceptance to fail, got "
        f"{accept_response.status_code}: "
        f"{getattr(accept_response, 'data', accept_response.content)!r}"
    )