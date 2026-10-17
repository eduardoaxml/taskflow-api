
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.organizations.models import Membership, Organization


@pytest.fixture
def setup_organization(db):
    owner = User.objects.create_user(
        email="owner@example.com",
        password="Secure-TaskFlow-2026!",
    )
    admin = User.objects.create_user(
        email="admin@example.com",
        password="Secure-TaskFlow-2026!",
    )
    member = User.objects.create_user(
        email="member@example.com",
        password="Secure-TaskFlow-2026!",
    )
    outsider = User.objects.create_user(
        email="outsider@example.com",
        password="Secure-TaskFlow-2026!",
    )

    organization = Organization.objects.create(
        name="Acme Corporation",
        slug="acme-corporation",
        created_by=owner,
    )

    owner_membership = Membership.objects.create(
        organization=organization,
        user=owner,
        role=Membership.Role.OWNER,
    )
    admin_membership = Membership.objects.create(
        organization=organization,
        user=admin,
        role=Membership.Role.ADMIN,
    )
    member_membership = Membership.objects.create(
        organization=organization,
        user=member,
        role=Membership.Role.MEMBER,
    )

    return {
        "organization": organization,
        "owner": owner,
        "admin": admin,
        "member": member,
        "outsider": outsider,
        "owner_membership": owner_membership,
        "admin_membership": admin_membership,
        "member_membership": member_membership,
    }


@pytest.mark.django_db
def test_member_can_list_memberships(setup_organization):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.get(
        reverse(
            "organizations:membership-list",
            kwargs={"organization_id": data["organization"].id},
        )
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 3


@pytest.mark.django_db
def test_member_cannot_add_members(setup_organization):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.post(
        reverse(
            "organizations:membership-list",
            kwargs={"organization_id": data["organization"].id},
        ),
        {"email": data["outsider"].email, "role": "MEMBER"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_can_add_registered_member(setup_organization):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["admin"])

    response = client.post(
        reverse(
            "organizations:membership-list",
            kwargs={"organization_id": data["organization"].id},
        ),
        {"email": data["outsider"].email, "role": "MEMBER"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert Membership.objects.filter(
        organization=data["organization"],
        user=data["outsider"],
        role=Membership.Role.MEMBER,
    ).exists()


@pytest.mark.django_db
def test_admin_cannot_promote_member_to_owner(setup_organization):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["admin"])

    response = client.patch(
        reverse(
            "organizations:membership-detail",
            kwargs={
                "organization_id": data["organization"].id,
                "membership_id": data["member_membership"].id,
            },
        ),
        {"role": "OWNER"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_owner_membership_cannot_be_deleted_through_member_endpoint(
    setup_organization,
):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["admin"])

    response = client.delete(
        reverse(
            "organizations:membership-detail",
            kwargs={
                "organization_id": data["organization"].id,
                "membership_id": data["owner_membership"].id,
            },
        )
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Membership.objects.filter(
        pk=data["owner_membership"].id
    ).exists()


@pytest.mark.django_db
def test_outsider_cannot_list_memberships(setup_organization):
    data = setup_organization
    client = APIClient()
    client.force_authenticate(user=data["outsider"])

    response = client.get(
        reverse(
            "organizations:membership-list",
            kwargs={"organization_id": data["organization"].id},
        )
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
