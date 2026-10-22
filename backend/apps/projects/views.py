
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from drf_spectacular.utils import extend_schema

from apps.organizations.models import Organization
from apps.organizations.permissions import (
    IsOrganizationManager,
    IsOrganizationMember,
)
from apps.projects.models import Project, Task, TaskComment
from apps.projects.serializers import ProjectSerializer, TaskSerializer, TaskCommentSerializer

@extend_schema(
    summary="List project tasks",
    description=(
        "Returns tasks belonging to the specified project. "
        "The authenticated user must have active membership "
        "in the project's organization."
    ),
    tags=["Tasks"],
)

class OrganizationProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        classes = [permissions.IsAuthenticated]
        if self.request.method == "POST":
            classes.append(IsOrganizationManager)
        else:
            classes.append(IsOrganizationMember)
        return [permission() for permission in classes]

    def get_organization(self):
        return get_object_or_404(
            Organization,
            pk=self.kwargs["organization_id"],
        )

    def get_queryset(self):
        return Project.objects.filter(
            organization_id=self.kwargs["organization_id"],
            organization__memberships__user=self.request.user,
            organization__memberships__is_active=True,
        ).select_related("organization", "created_by").distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_organization()
        return context


class OrganizationProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "project_id"

    def get_permissions(self):
        classes = [permissions.IsAuthenticated]
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            classes.append(IsOrganizationManager)
        else:
            classes.append(IsOrganizationMember)
        return [permission() for permission in classes]

    def get_queryset(self):
        return (
            Project.objects.filter(
                organization_id=self.kwargs["organization_id"],
                organization__memberships__user=self.request.user,
                organization__memberships__is_active=True,
            )
            .select_related(
                "organization",
                "created_by",
            )
            .distinct()
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = get_object_or_404(
            Organization,
            pk=self.kwargs["organization_id"],
        )
        return context


class ProjectTaskListCreateView(generics.ListCreateAPIView):
    queryset = Task.objects.none()
    serializer_class = TaskSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizationMember,
    ]

    def get_project(self):
        return get_object_or_404(
            Project.objects.filter(
                organization_id=self.kwargs["organization_id"],
                organization__memberships__user=self.request.user,
                organization__memberships__is_active=True,
            ),
            pk=self.kwargs["project_id"],
        )

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.queryset
        return (
            Task.objects.filter(
                project_id=self.kwargs["project_id"],
                project__organization_id=self.kwargs["organization_id"],
                project__organization__memberships__user=self.request.user,
                project__organization__memberships__is_active=True,
            )
            .select_related(
                "project",
                "created_by",
                "assignee",
            )
            .distinct()
        )
        
        # return Task.objects.filter(
        #     project=self.get_project(),
        # ).select_related("project", "assignee", "created_by")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project = self.get_project()
        context["project"] = project
        context["organization"] = project.organization
        return context
    
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "priority",
        "assignee",
        "due_date",
    ]

    search_fields = [
        "title",
        "description",
    ]

    ordering_fields = [
        "title",
        "status",
        "priority",
        "due_date",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

class ProjectTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizationMember,
    ]
    lookup_url_kwarg = "task_id"

    def get_project(self):
        return get_object_or_404(
            Project.objects.filter(
                organization_id=self.kwargs["organization_id"],
                organization__memberships__user=self.request.user,
                organization__memberships__is_active=True,
            ),
            pk=self.kwargs["project_id"],
        )

    def get_queryset(self):
        return Task.objects.filter(
            project=self.get_project(),
        ).select_related("project", "assignee", "created_by")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project = self.get_project()
        context["project"] = project
        context["organization"] = project.organization
        return context
    
class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer

    def get_task(self):
        task = generics.get_object_or_404(
            Task.objects.select_related("project__organization"),
            id=self.kwargs["task_id"],
            project_id=self.kwargs["project_id"],
            project__organization_id=self.kwargs["organization_id"],
        )

        if not task.project.organization.memberships.filter(
            user=self.request.user,
            is_active=True,
        ).exists():
            raise PermissionDenied("Organization membership required.")

        return task

    def get_queryset(self):
        return TaskComment.objects.filter(
            task=self.get_task()
        ).select_related("author")

    def perform_create(self, serializer):
        serializer.save(
            task=self.get_task(),
            author=self.request.user,
        )