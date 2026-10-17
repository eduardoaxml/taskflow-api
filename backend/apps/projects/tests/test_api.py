
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.organizations.models import Membership, Organization
from apps.projects.models import Project, Task


@pytest.fixture
def project_setup(db):
    owner = User.objects.create_user(
        email="owner@example.com",
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

    Membership.objects.create(
        organization=organization,
        user=owner,
        role=Membership.Role.OWNER,
    )
    Membership.objects.create(
        organization=organization,
        user=member,
        role=Membership.Role.MEMBER,
    )

    project = Project.objects.create(
        organization=organization,
        name="Website Redesign",
        slug="website-redesign",
        created_by=owner,
    )

    return {
        "owner": owner,
        "member": member,
        "outsider": outsider,
        "organization": organization,
        "project": project,
    }


@pytest.mark.django_db
def test_owner_can_create_project(project_setup):
    data = project_setup
    client = APIClient()
    client.force_authenticate(user=data["owner"])

    response = client.post(
        reverse(
            "projects:project-list",
            kwargs={"organization_id": data["organization"].id},
        ),
        {
            "name": "Mobile Application",
            "slug": "mobile-application",
            "description": "Build the TaskFlow mobile application.",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["name"] == "Mobile Application"
    assert Project.objects.filter(
        organization=data["organization"],
        slug="mobile-application",
        created_by=data["owner"],
    ).exists()


@pytest.mark.django_db
def test_member_cannot_create_project(project_setup):
    data = project_setup
    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.post(
        reverse(
            "projects:project-list",
            kwargs={"organization_id": data["organization"].id},
        ),
        {"name": "Unauthorized Project", "slug": "unauthorized-project"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_outsider_cannot_list_projects(project_setup):
    data = project_setup
    client = APIClient()
    client.force_authenticate(user=data["outsider"])

    response = client.get(
        reverse(
            "projects:project-list",
            kwargs={"organization_id": data["organization"].id},
        )
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_member_can_create_task(project_setup):
    data = project_setup
    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.post(
        reverse(
            "projects:task-list",
            kwargs={
                "organization_id": data["organization"].id,
                "project_id": data["project"].id,
            },
        ),
        {
            "title": "Create homepage",
            "description": "Implement the homepage layout.",
            "priority": "HIGH",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Create homepage"

    task = Task.objects.get(title="Create homepage")
    assert task.project == data["project"]
    assert task.created_by == data["member"]
    assert task.priority == Task.Priority.HIGH


@pytest.mark.django_db
def test_task_cannot_be_assigned_to_outsider(project_setup):
    data = project_setup
    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.post(
        reverse(
            "projects:task-list",
            kwargs={
                "organization_id": data["organization"].id,
                "project_id": data["project"].id,
            },
        ),
        {
            "title": "Restricted task",
            "assignee": data["outsider"].id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not Task.objects.filter(title="Restricted task").exists()


@pytest.mark.django_db
def test_task_from_another_organization_is_not_accessible(project_setup):
    data = project_setup

    other_organization = Organization.objects.create(
        name="Other Company",
        slug="other-company",
        created_by=data["outsider"],
    )
    Membership.objects.create(
        organization=other_organization,
        user=data["outsider"],
        role=Membership.Role.OWNER,
    )
    other_project = Project.objects.create(
        organization=other_organization,
        name="Private Project",
        slug="private-project",
        created_by=data["outsider"],
    )
    task = Task.objects.create(
        project=other_project,
        title="Private task",
        created_by=data["outsider"],
    )

    client = APIClient()
    client.force_authenticate(user=data["member"])

    response = client.get(
        reverse(
            "projects:task-detail",
            kwargs={
                "organization_id": data["organization"].id,
                "project_id": data["project"].id,
                "task_id": task.id,
            },
        )
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
