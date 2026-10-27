import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

def send_organization_invitation(invitation):
    acceptance_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/invitations/{invitation.token}/accept"
    )

    subject = (
        f"Invitation to join {invitation.organization.name} on TaskFlow"
    )

    message = (
        f"You have been invited to join "
        f"{invitation.organization.name} on TaskFlow.\n\n"
        f"Invited by: {invitation.invited_by.email}\n\n"
        f"Accept your invitation here:\n{acceptance_url}\n\n"
        f"This invitation expires on "
        f"{invitation.expires_at:%Y-%m-%d %H:%M UTC}."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
        fail_silently=False,
    )


def send_organization_invitation_safely(invitation_id):
    from apps.organizations.models import OrganizationInvitation

    try:
        invitation = OrganizationInvitation.objects.select_related(
            "organization",
            "invited_by",
        ).get(pk=invitation_id)

        send_organization_invitation(invitation)
    except Exception:
        logger.exception(
            "Failed to send organization invitation email "
            "(invitation_id=%s).",
            invitation_id,
        )
