
from rest_framework import serializers

from apps.organizations.models import Membership
from apps.projects.models import Project, Task, TaskActivity, TaskComment


class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    organization = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "organization",
            "name",
            "slug",
            "description",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "organization",
            "created_by",
            "created_at",
            "updated_at",
        )

    def create(self, validated_data):
        return Project.objects.create(
            organization=self.context["organization"],
            created_by=self.context["request"].user,
            **validated_data,
        )


class TaskSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    project = serializers.PrimaryKeyRelatedField(read_only=True)
    assignee_email = serializers.EmailField(
        source="assignee.email",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "assignee",
            "assignee_email",
            "created_by",
            "due_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "project",
            "created_by",
            "created_at",
            "updated_at",
        )

    def validate_assignee(self, assignee):
        if assignee is None:
            return assignee

        organization = self.context["organization"]

        is_active_member = Membership.objects.filter(
            organization=organization,
            user=assignee,
            is_active=True,
        ).exists()

        if not is_active_member:
            raise serializers.ValidationError(
                "The assignee must be an active member "
                "of this organization."
            )

        return assignee

    def create(self, validated_data):
        return Task.objects.create(
            project=self.context["project"],
            created_by=self.context["request"].user,
            **validated_data,
        )


class TaskCommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(
        source="author.email",
        read_only=True,
    )

    class Meta:
        model = TaskComment
        fields = (
            "id",
            "task",
            "author",
            "author_email",
            "content",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "task",
            "author",
            "author_email",
            "created_at",
            "updated_at",
        )

    def validate_content(self, value):
        content = value.strip()

        if not content:
            raise serializers.ValidationError(
                "Comment content cannot be empty."
            )

        return content
    
class TaskActivitySerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(
        source="actor.email",
        read_only=True,
    )

    class Meta:
        model = TaskActivity
        fields = (
            "id",
            "task",
            "actor",
            "actor_email",
            "action",
            "description",
            "created_at",
        )
        read_only_fields = fields
