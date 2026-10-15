import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_user_can_register_with_email(api_client):
    response = api_client.post(
        reverse("accounts:register"),
        {
            "email": "developer@example.com",
            "first_name": "Alex",
            "last_name": "Developer",
            "password": "Secure-TaskFlow-2026!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["email"] == "developer@example.com"
    assert "password" not in response.data

    user = User.objects.get(email="developer@example.com")

    assert user.check_password("Secure-TaskFlow-2026!")
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False


@pytest.mark.django_db
def test_registration_rejects_duplicate_email(api_client):
    User.objects.create_user(
        email="developer@example.com",
        password="Secure-TaskFlow-2026!",
    )

    response = api_client.post(
        reverse("accounts:register"),
        {
            "email": "developer@example.com",
            "first_name": "Alex",
            "last_name": "Developer",
            "password": "Another-Secure-Password-2026!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_registration_rejects_weak_password(api_client):
    response = api_client.post(
        reverse("accounts:register"),
        {
            "email": "developer@example.com",
            "first_name": "Alex",
            "last_name": "Developer",
            "password": "password",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in response.data
    assert not User.objects.filter(
        email="developer@example.com"
    ).exists()


@pytest.mark.django_db
def test_user_can_obtain_jwt_tokens(api_client):
    User.objects.create_user(
        email="developer@example.com",
        password="Secure-TaskFlow-2026!",
    )

    response = api_client.post(
        reverse("accounts:token_obtain_pair"),
        {
            "email": "developer@example.com",
            "password": "Secure-TaskFlow-2026!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data