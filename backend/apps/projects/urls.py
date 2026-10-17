
from django.urls import path

from apps.projects.views import (
    OrganizationProjectDetailView,
    OrganizationProjectListCreateView,
    ProjectTaskDetailView,
    ProjectTaskListCreateView,
)

app_name = "projects"

urlpatterns = [
    path(
        "organizations/<uuid:organization_id>/projects/",
        OrganizationProjectListCreateView.as_view(),
        name="project-list",
    ),
    path(
        "organizations/<uuid:organization_id>/projects/<uuid:project_id>/",
        OrganizationProjectDetailView.as_view(),
        name="project-detail",
    ),
    path(
        "organizations/<uuid:organization_id>/projects/<uuid:project_id>/tasks/",
        ProjectTaskListCreateView.as_view(),
        name="task-list",
    ),
    path(
        "organizations/<uuid:organization_id>/projects/<uuid:project_id>/tasks/<uuid:task_id>/",
        ProjectTaskDetailView.as_view(),
        name="task-detail",
    ),
]
