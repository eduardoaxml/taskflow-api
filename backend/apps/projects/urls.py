
from django.urls import path

from apps.projects.views import (
    OrganizationProjectDetailView,
    OrganizationProjectListCreateView,
    ProjectTaskDetailView,
    ProjectTaskListCreateView,
    TaskCommentListCreateView,
    TaskActivityListView
)
from .views import TaskCommentListCreateView

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
    path(
        "organizations/<uuid:organization_id>/projects/"
        "<uuid:project_id>/tasks/<uuid:task_id>/comments/",
        TaskCommentListCreateView.as_view(),
        name="task-comment-list-create",
    ),
    path(
        "organizations/<uuid:organization_id>/projects/<uuid:project_id>/tasks/<uuid:task_id>/comments/",
        TaskCommentListCreateView.as_view(),
        name="task-comment-list-create",
    ),
    path(
        "organizations/<uuid:organization_id>/projects/<uuid:project_id>/tasks/<uuid:task_id>/activities/",
        TaskActivityListView.as_view(),
        name="task-activity-list",
    ),
]
