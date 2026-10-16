
from django.urls import path

from apps.organizations.views import (
    OrganizationDetailView,
    OrganizationListCreateView,
)

app_name = "organizations"

urlpatterns = [
    path(
        "",
        OrganizationListCreateView.as_view(),
        name="organization-list",
    ),
    path(
        "<uuid:id>/",
        OrganizationDetailView.as_view(),
        name="organization-detail",
    ),
]
