import { useEffect, useState } from "react";
import type { OrganizationMember } from "../types/api";
import { getOrganizationMembers } from "../services/memberService";

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
        const response = await getOrganizationMembers(organizationId, request);

        if (active) {
          setMembers(response.results.filter((member) => member.is_active));
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
      <h3>Organization members</h3>

      {loading && <p>Loading members...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && members.length === 0 && (
        <p>No active members found.</p>
      )}

      {!loading && !error && members.length > 0 && (
        <ul>
          {members.map((member) => (
            <li key={member.id}>
              <strong>{member.user_email}</strong>
              <span>{member.role}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
