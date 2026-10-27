
import pytest
from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.organizations.models import Membership, Organization


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="developer@example.com",
        password="Secure-TaskFlow-2026!",
    )


@pytest.fixture
def organization(user):
    return Organization.objects.create(
        name="Acme Corporation",
        slug="acme-corporation",
        created_by=user,
    )


@pytest.mark.django_db
def test_organization_can_be_created(user, organization):
    assert organization.name == "Acme Corporation"
    assert organization.created_by == user
    assert organization.id is not None


@pytest.mark.django_db
def test_membership_defaults_to_member(user, organization):
    membership = Membership.objects.create(
        organization=organization,
        user=user,
    )

    assert membership.role == Membership.Role.MEMBER
    assert membership.is_active is True


@pytest.mark.django_db
def test_user_can_belong_to_multiple_organizations(user):
    organization_one = Organization.objects.create(
        name="Company One",
        slug="company-one",
        created_by=user,
    )
    organization_two = Organization.objects.create(
        name="Company Two",
        slug="company-two",
        created_by=user,
    )

    Membership.objects.create(
        organization=organization_one,
        user=user,
        role=Membership.Role.OWNER,
    )
    Membership.objects.create(
        organization=organization_two,
        user=user,
        role=Membership.Role.MEMBER,
    )

    assert user.organization_memberships.count() == 2


@pytest.mark.django_db
def test_duplicate_membership_is_rejected(user, organization):
    Membership.objects.create(
        organization=organization,
        user=user,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        Membership.objects.create(
            organization=organization,
            user=user,
        )
