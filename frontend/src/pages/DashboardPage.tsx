import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/apiClient";
// import { getOrganizations } from "../services/organizationService";
import type { Organization } from "../types/api";
import CreateOrganizationForm from "../components/CreateOrganizationForm";

export default function DashboardPage() {
  const { tokens, signOut, request } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await request<{
        count: number;
        next: string | null;
        previous: string | null;
        results: Organization[];
      }>("organizations/");

      setOrganizations(response.results);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load organizations.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  if (!tokens) {
    return <p>Loading authentication...</p>;
  }

  return (
    <main>
      <header>
        <h1>TaskFlow Dashboard</h1>
        <button onClick={signOut}>Log out</button>
      </header>

      <section>
        <h2>Your organizations</h2>

        {isLoading && <p>Loading organizations...</p>}

        {error && (
          <div role="alert">
            <p>{error}</p>
            <button onClick={() => void loadOrganizations()}>Retry</button>
          </div>
        )}

        {!isLoading && !error && organizations.length === 0 && (
          <p>You don't belong to any organizations yet. Create one below.</p>
        )}

        {!isLoading && organizations.length > 0 && (
          <ul>
            {organizations.map((organization) => (
              <li key={organization.id}>
                <h3>{organization.name}</h3>
                <p>{organization.slug}</p>

                <Link to={`/organizations/${organization.id}`}>
                  View projects
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <CreateOrganizationForm
          accessToken={tokens.access}
          onCreated={() => void loadOrganizations()}
        />
      </section>
    </main>
  );
}
