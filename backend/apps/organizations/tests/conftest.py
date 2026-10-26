import pytest

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