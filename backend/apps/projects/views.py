
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from apps.organizations.models import Organization
from apps.organizations.permissions import (
    IsOrganizationManager,
    IsOrganizationMember,
)
from apps.projects.models import Project, Task
from apps.projects.serializers import ProjectSerializer, TaskSerializer


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
        return Project.objects.filter(
            organization_id=self.kwargs["organization_id"],
            organization__memberships__user=self.request.user,
            organization__memberships__is_active=True,
        ).select_related("organization", "created_by").distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = get_object_or_404(
            Organization,
            pk=self.kwargs["organization_id"],
        )
        return context


class ProjectTaskListCreateView(generics.ListCreateAPIView):
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
        return Task.objects.filter(
            project=self.get_project(),
        ).select_related("project", "assignee", "created_by")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project = self.get_project()
        context["project"] = project
        context["organization"] = project.organization
        return context


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
