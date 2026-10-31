import { useEffect, useState } from "react";
import type { OrganizationMember } from "../types/api";
import { getAllOrganizationMembers } from "../services/memberService";

type Props = {
  organizationId: string;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
};

export default function OrganizationMembers({
  organizationId,
  request,
}: Props) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      try {
        const response = await getAllOrganizationMembers(
          organizationId,
          request,
        );

        if (active) {
          setMembers(
            response.filter((member: OrganizationMember) => member.is_active),
          );
          setError("");
        }
      } catch {
        if (active) setError("Unable to load organization members.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMembers();

    return () => {
      active = false;
    };
  }, [organizationId, request]);

  return (
    <section className="organization-members">
      <div className="organization-members__header">
        <div>
          <p className="eyebrow">YOUR TEAM</p>
          <h2>Organization members</h2>
          <p className="organization-members__description">
            People who have access to this organization.
          </p>
        </div>

        {!loading && !error && (
          <span className="organization-members__count">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        )}
      </div>

      {loading && (
        <div className="organization-members__state">
          <span className="organization-members__spinner" />
          <p>Loading members...</p>
        </div>
      )}

      {error && (
        <p className="organization-members__error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="organization-members__empty">
          <span aria-hidden="true">👥</span>
          <p>No active members found.</p>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <ul className="organization-members__list">
          {members.map((member) => {
            const initials = member.user_email
              .split("@")[0]
              .slice(0, 2)
              .toUpperCase();

            return (
              <li key={member.id} className="organization-members__item">
                <div className="organization-members__identity">
                  <span
                    className="organization-members__avatar"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>

                  <div className="organization-members__details">
                    <strong>{member.user_email}</strong>
                    <span>Organization member</span>
                  </div>
                </div>

                <span
                  className={`organization-members__role organization-members__role--${member.role.toLowerCase()}`}
                >
                  {member.role}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
