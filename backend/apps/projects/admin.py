
from django.contrib import admin

from apps.projects.models import Project, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "organization",
        "status",
        "created_by",
        "created_at",
    ]
    list_filter = ["status", "organization"]
    search_fields = [
        "name",
        "slug",
        "organization__name",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "project",
        "status",
        "priority",
        "assignee",
        "due_date",
    ]
    list_filter = ["status", "priority"]
    search_fields = [
        "title",
        "project__name",
        "assignee__email",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
