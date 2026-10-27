from typing import ClassVar

from django.contrib import admin

from apps.organizations.models import Membership, Organization


class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0
    autocomplete_fields = ("user",)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "created_by",
        "created_at",
    )
    search_fields = (
        "name",
        "slug",
        "created_by__email",
    )
    prepopulated_fields: ClassVar[dict[str, tuple[str, ...]]] = {
        "slug": ("name",),
    }
    inlines = (MembershipInline,)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "organization",
        "role",
        "is_active",
        "joined_at",
    )
    list_filter = ("role", "is_active",)
    search_fields = (
        "user__email",
        "organization__name",
    )