
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.organizations.models import Membership, Organization


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="owner@example.com",
        password="Secure-TaskFlow-2026!",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.com",
        password="Secure-TaskFlow-2026!",
    )


@pytest.fixture
def organization(user):
    organization = Organization.objects.create(
        name="Acme Corporation",
        slug="acme-corporation",
        created_by=user,
    )
    Membership.objects.create(
        organization=organization,
        user=user,
        role=Membership.Role.OWNER,
    )
    return organization


@pytest.mark.django_db
def test_anonymous_user_cannot_create_organization(api_client):
    response = api_client.post(
        reverse("organizations:organization-list"),
        {"name": "Acme Corporation", "slug": "acme-corporation"},
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_user_can_create_organization(api_client, user):
    api_client.force_authenticate(user=user)

    response = api_client.post(
        reverse("organizations:organization-list"),
        {"name": "Acme Corporation", "slug": "acme-corporation"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["name"] == "Acme Corporation"

    organization = Organization.objects.get(slug="acme-corporation")
    membership = Membership.objects.get(
        organization=organization,
        user=user,
    )

    assert organization.created_by == user
    assert membership.role == Membership.Role.OWNER


@pytest.mark.django_db
def test_user_only_sees_their_organizations(
    api_client, user, other_user, organization
):
    other_organization = Organization.objects.create(
        name="Other Company",
        slug="other-company",
        created_by=other_user,
    )
    Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=Membership.Role.OWNER,
    )

    api_client.force_authenticate(user=user)

    response = api_client.get(
        reverse("organizations:organization-list")
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == str(organization.id)


@pytest.mark.django_db
def test_user_cannot_retrieve_another_organizations_details(
    api_client, user, other_user, organization
):
    other_organization = Organization.objects.create(
        name="Other Company",
        slug="other-company",
        created_by=other_user,
    )
    Membership.objects.create(
        organization=other_organization,
        user=other_user,
        role=Membership.Role.OWNER,
    )

    api_client.force_authenticate(user=user)

    response = api_client.get(
        reverse(
            "organizations:organization-detail",
            kwargs={"id": other_organization.id},
        )
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_member_can_retrieve_their_organization(
    api_client, user, organization
):
    api_client.force_authenticate(user=user)

    response = api_client.get(
        reverse(
            "organizations:organization-detail",
            kwargs={"id": organization.id},
        )
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == organization.name


@pytest.mark.django_db
def test_inactive_membership_does_not_grant_access(
    api_client, user, organization
):
    Membership.objects.filter(
        organization=organization,
        user=user,
    ).update(is_active=False)

    api_client.force_authenticate(user=user)

    response = api_client.get(
        reverse(
            "organizations:organization-detail",
            kwargs={"id": organization.id},
        )
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
