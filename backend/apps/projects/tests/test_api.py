
from datetime import date, timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.organizations.models import Membership, Organization
from apps.projects.models import Project, Task


@pytest.fixture
def api_client():
    return APIClient()

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


@pytest.mark.django_db
def test_filter_tasks_by_status(api_client, task_setup):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Pending task",
        status=Task.Status.TODO,
    )
    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Completed task",
        status=Task.Status.DONE,
    )

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )
    response = api_client.get(url, {"status": Task.Status.DONE})

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["title"] == "Completed task"


@pytest.mark.django_db
def test_filter_tasks_by_priority(api_client, task_setup):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Urgent task",
        priority=Task.Priority.URGENT,
    )
    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Low priority task",
        priority=Task.Priority.LOW,
    )

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )
    response = api_client.get(url, {"priority": Task.Priority.URGENT})

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["title"] == "Urgent task"
    
@pytest.fixture
def task_setup(db):
    owner = User.objects.create_user(
        email="owner@example.com",
        password="StrongPassword123!",
    )
    member = User.objects.create_user(
        email="member@example.com",
        password="StrongPassword123!",
    )
    outsider = User.objects.create_user(
        email="outsider@example.com",
        password="StrongPassword123!",
    )

    organization = Organization.objects.create(
        name="TaskFlow Test Organization",
        slug="taskflow-test",
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
        name="Test Project",
        slug="test-project",
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
def test_search_tasks_by_title(api_client, task_setup):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Implement authentication",
    )
    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Update documentation",
    )

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )
    response = api_client.get(url, {"search": "authentication"})

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["title"] == (
        "Implement authentication"
    )

@pytest.mark.django_db
def test_order_tasks_by_due_date(api_client, task_setup):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    later_date = date.today() + timedelta(days=10)
    earlier_date = date.today() + timedelta(days=2)

    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Later task",
        due_date=later_date,
    )
    create_task(
        project=data["project"],
        created_by=data["member"],
        title="Earlier task",
        due_date=earlier_date,
    )

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )
    response = api_client.get(url, {"ordering": "due_date"})

    assert response.status_code == 200
    titles = [task["title"] for task in response.data["results"]]

    assert titles == ["Earlier task", "Later task"]

@pytest.mark.django_db
def test_task_list_queries_do_not_grow_per_task(
    api_client,
    task_setup,
):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )

    # Create a baseline of 10 tasks.
    for index in range(10):
        create_task(
            project=data["project"],
            created_by=data["member"],
            assignee=data["member"],
            title=f"Optimization task {index}",
        )

    # Warm up the endpoint before capturing queries.
    response = api_client.get(url)
    assert response.status_code == 200

    with CaptureQueriesContext(connection) as queries:
        response = api_client.get(url)

    assert response.status_code == 200
    assert len(queries) < 15, (
        f"Unexpectedly high query count: {len(queries)}"
    )

@pytest.mark.django_db
def test_task_rejects_inactive_assignee(api_client, task_setup):
    data = task_setup
    api_client.force_authenticate(user=data["member"])

    Membership.objects.filter(
        organization=data["organization"],
        user=data["member"],
    ).update(is_active=False)

    url = (
        f"/api/v1/organizations/{data['organization'].id}"
        f"/projects/{data['project'].id}/tasks/"
    )

    response = api_client.post(
        url,
        {
            "title": "Task assigned to inactive user",
            "assignee": data["member"].id,
        },
        format="json",
    )

    # The requesting user is now inactive, so access should be denied.
    assert response.status_code in (403, 404)

    
def create_task(
    *,
    project,
    created_by,
    title,
    status=Task.Status.TODO,
    priority=Task.Priority.MEDIUM,
    assignee=None,
    due_date=None,
):
    return Task.objects.create(
        project=project,
        created_by=created_by,
        title=title,
        status=status,
        priority=priority,
        assignee=assignee,
        due_date=due_date,
    )