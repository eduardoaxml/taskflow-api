from django.utils import timezone
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter

from apps.organizations.models import Organization
from apps.organizations.permissions import (
    IsOrganizationManager,
    IsOrganizationMember,
)
from apps.projects.models import Project, Task, TaskActivity, TaskComment
from apps.projects.serializers import (
    ProjectSerializer,
    TaskActivitySerializer,
    TaskCommentSerializer,
    TaskSerializer,
    WorkspaceOverviewSerializer,
)


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
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )

    search_fields = ("name", "slug")

    ordering_fields = ("name", "status", "created_at")

    ordering = ("-created_at",)

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
        queryset = (
            Project.objects.filter(
                organization_id=self.kwargs["organization_id"],
                organization__memberships__user=self.request.user,
                organization__memberships__is_active=True,
            )
            .select_related("organization", "created_by")
            .distinct()
        )

        status = self.request.query_params.get("status")

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_organization()
        return context


class OrganizationProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_url_kwarg = "project_id"

    def get_permissions(self):
        classes = list(self.permission_classes)
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
    permission_classes = (
        permissions.IsAuthenticated,
        IsOrganizationMember,
    )

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

        queryset = (
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

        unassigned = self.request.query_params.get("unassigned")

        if unassigned == "true":
            queryset = queryset.filter(assignee__isnull=True)
            
        overdue = self.request.query_params.get("overdue")

        if overdue == "true":
            queryset = queryset.filter(
                due_date__lt=timezone.localdate(),
            ).exclude(
                status=Task.Status.DONE,
            )

        return queryset
    
    def perform_create(self, serializer):
        task = serializer.save()

        TaskActivity.objects.create(
            task=task,
            actor=self.request.user,
            action="CREATED",
            description="Created the task.",
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
    
    filter_backends = (
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    )

    filterset_fields = (
        "status",
        "priority",
        "assignee",
        "due_date",
    )

    search_fields = (
        "title",
        "description",
    )

    ordering_fields = (
        "title",
        "status",
        "priority",
        "due_date",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)

class ProjectTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_url_kwarg = "task_id"
    
    def get_permissions(self):
        classes = [permissions.IsAuthenticated]

        if self.request.method in ("PATCH", "PUT", "DELETE"):
            classes.append(IsOrganizationManager)
        else:
            classes.append(IsOrganizationMember)

        return [permission() for permission in classes]
    
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
    
    
    def perform_update(self, serializer):
        old_task = self.get_object()
        old_status = old_task.status
        old_priority = old_task.priority
        old_assignee_id = old_task.assignee_id
        
        task = serializer.save()

        if old_status != task.status:
            TaskActivity.objects.create(
                task=task,
                actor=self.request.user,
                action="STATUS_CHANGED",
                description=f"Status changed from {old_status} to {task.status}.",
            )

        if old_priority != task.priority:
            TaskActivity.objects.create(
                task=task,
                actor=self.request.user,
                action="PRIORITY_CHANGED",
                description=f"Priority changed from {old_priority} to {task.priority}.",
            )
        
        if old_assignee_id != task.assignee_id:
            description = (
                f"Assigned task to {task.assignee.email}."
                if task.assignee
                else "Task unassigned."
            )

            TaskActivity.objects.create(
                task=task,
                actor=self.request.user,
                action="ASSIGNED",
                description=description,
            )

    
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
        task = self.get_task()

        TaskActivity.objects.create(
            task=task,
            actor=self.request.user,
            action="COMMENT_ADDED",
            description="Added a comment.",
        )


class TaskActivityListView(generics.ListAPIView):
    serializer_class = TaskActivitySerializer

    def get_queryset(self):
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

        return task.activities.select_related("actor").all()

class OrganizationTaskActivityListView(generics.ListAPIView):
    serializer_class = TaskActivitySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return (
            TaskActivity.objects.filter(
                task__project__organization_id=self.kwargs["organization_id"],
                task__project__organization__memberships__user=self.request.user,
                task__project__organization__memberships__is_active=True,
            )
            .select_related(
                "actor",
                "task",
                "task__project",
            )
            .distinct()
            .order_by("-created_at")
        )


class WorkspaceOverviewView(generics.GenericAPIView):
    serializer_class = WorkspaceOverviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        membership_filters = {
            "organization__memberships__user": request.user,
            "organization__memberships__is_active": True,
        }

        projects = (
            Project.objects.filter(**membership_filters)
            .select_related("organization", "created_by")
            .distinct()
        )

        tasks = (
            Task.objects.filter(
                project__organization__memberships__user=request.user,
                project__organization__memberships__is_active=True,
            )
            .select_related(
                "project",
                "project__organization",
                "created_by",
                "assignee",
            )
            .distinct()
        )

        project_metrics = projects.aggregate(
            total_projects=Count("id", distinct=True),
            planning=Count(
                "id",
                filter=Q(status="PLANNING"),
                distinct=True,
            ),
            active=Count(
                "id",
                filter=Q(status="ACTIVE"),
                distinct=True,
            ),
            completed=Count(
                "id",
                filter=Q(status="COMPLETED"),
                distinct=True,
            ),
            archived=Count(
                "id",
                filter=Q(status="ARCHIVED"),
                distinct=True,
            ),
        )

        task_metrics = tasks.aggregate(
            
            total_tasks=Count("id", distinct=True),
            completed_tasks=Count(
                "id",
                filter=Q(status="DONE"),
                distinct=True,
            ),
            pending_tasks=Count(
                "id",
                filter=~Q(status="DONE"),
                distinct=True,
            ),
            todo=Count(
                "id",
                filter=Q(status="TODO"),
                distinct=True,
            ),
            in_progress=Count(
                "id",
                filter=Q(status="IN_PROGRESS"),
                distinct=True,
            ),
            blocked=Count(
                "id",
                filter=Q(status="BLOCKED"),
                distinct=True,
            ),
            done=Count(
                "id",
                filter=Q(status="DONE"),
                distinct=True,
            ),
            low=Count(
                "id",
                filter=Q(priority="LOW"),
                distinct=True,
            ),
            medium=Count(
                "id",
                filter=Q(priority="MEDIUM"),
                distinct=True,
            ),
            high=Count(
                "id",
                filter=Q(priority="HIGH"),
                distinct=True,
            ),
            urgent=Count(
                "id",
                filter=Q(priority="URGENT"),
                distinct=True,
            ),
        )

        metrics = {
            "total_projects": project_metrics["total_projects"],
            "total_tasks": task_metrics["total_tasks"],
            "completed_tasks": task_metrics["completed_tasks"],
            "pending_tasks": task_metrics["pending_tasks"],
            "projects_by_status": {
                "PLANNING": project_metrics["planning"],
                "ACTIVE": project_metrics["active"],
                "COMPLETED": project_metrics["completed"],
                "ARCHIVED": project_metrics["archived"],
            },
            "tasks_by_status": {
                "TODO": task_metrics["todo"],
                "IN_PROGRESS": task_metrics["in_progress"],
                "BLOCKED": task_metrics["blocked"],
                "DONE": task_metrics["done"],
            },
            "tasks_by_priority": {
                "LOW": task_metrics["low"],
                "MEDIUM": task_metrics["medium"],
                "HIGH": task_metrics["high"],
                "URGENT": task_metrics["urgent"],
            },
        }

        serializer = self.get_serializer({
            "metrics": metrics,
            "projects": projects,
            "tasks": tasks,
        })

        return Response(serializer.data)