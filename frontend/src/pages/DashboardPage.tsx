import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import CreateOrganizationForm from "../components/CreateOrganizationForm";
import type { Organization } from "../types/api";
import "./DashboardPage.css";

type PaginatedOrganizations = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Organization[];
};

export default function DashboardPage() {
  const { tokens, signOut, request } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await request<PaginatedOrganizations>("organizations/");

      setOrganizations(response.results);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load your organizations. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  if (!tokens) {
    return (
      <main className="dashboard-loading">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Preparing your workspace…</p>
      </main>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/dashboard" className="dashboard-brand">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>TaskFlow</span>
        </Link>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="sidebar-link sidebar-link--active" href="#overview">
            <span aria-hidden="true">⌂</span>
            Dashboard
          </a>
          <a className="sidebar-link" href="#organizations">
            <span aria-hidden="true">▦</span>
            Organizations
            <span className="sidebar-count">{organizations.length}</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon" aria-hidden="true">
              ?
            </span>
            <div>
              <strong>Need a hand?</strong>
              <p>Your workspace starts here.</p>
            </div>
          </div>

          <button className="sidebar-logout" type="button" onClick={signOut}>
            <span aria-hidden="true">↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>Dashboard</strong>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            Workspace connected
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1>Good to see you.</h1>
              <p className="welcome-description">
                Organize your teams and keep your projects moving forward.
              </p>
            </div>

            <a className="primary-button" href="#create-organization">
              <span aria-hidden="true">+</span>
              New organization
            </a>
          </section>

          <section className="overview-grid" aria-label="Workspace overview">
            <article className="overview-card">
              <div className="overview-icon overview-icon--blue">▦</div>
              <div>
                <p className="overview-label">Your organizations</p>
                <p className="overview-value">
                  {isLoading ? "—" : organizations.length}
                </p>
                <p className="overview-caption">Available workspaces</p>
              </div>
            </article>

            <article className="overview-card overview-card--accent">
              <div className="overview-icon overview-icon--purple">↗</div>
              <div>
                <p className="overview-label">Your next step</p>
                <p className="overview-value overview-value--text">
                  {organizations.length > 0
                    ? "Open a workspace"
                    : "Create a workspace"}
                </p>
                <p className="overview-caption">
                  {organizations.length > 0
                    ? "Continue where your team works"
                    : "Start organizing your work"}
                </p>
              </div>
            </article>
          </section>

          <section className="organizations-section" id="organizations">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR TEAM SPACES</p>
                <h2>Organizations</h2>
                <p className="section-description">
                  All the workspaces you belong to, in one place.
                </p>
              </div>

              <span className="section-count">
                {organizations.length}{" "}
                {organizations.length === 1 ? "workspace" : "workspaces"}
              </span>
            </div>

            {isLoading && (
              <div className="dashboard-message">
                <span className="loading-spinner" aria-hidden="true" />
                <p>Loading your organizations…</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="dashboard-error" role="alert">
                <div>
                  <strong>We couldn't load your organizations</strong>
                  <p>{error}</p>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void loadOrganizations()}
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !error && organizations.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true">
                  ▦
                </div>
                <h3>Your workspace starts here</h3>
                <p>
                  Create your first organization to bring your projects and team
                  together.
                </p>
                <a className="primary-button" href="#create-organization">
                  <span aria-hidden="true">+</span>
                  Create your first organization
                </a>
              </div>
            )}

            {!isLoading && !error && organizations.length > 0 && (
              <div className="organization-grid">
                {organizations.map((organization, index) => (
                  <article className="organization-card" key={organization.id}>
                    <div className="organization-card-top">
                      <div
                        className={`organization-avatar organization-avatar--${index % 4}`}
                        aria-hidden="true"
                      >
                        {organization.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="organization-indicator">
                        <span className="status-dot" />
                        Workspace
                      </span>
                    </div>

                    <h3>{organization.name}</h3>
                    <p className="organization-slug">@{organization.slug}</p>

                    <div className="organization-card-footer">
                      <span>View workspace</span>
                      <Link
                        to={`/organizations/${organization.id}`}
                        aria-label={`Open ${organization.name}`}
                      >
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            className="create-organization-section"
            id="create-organization"
          >
            <div className="create-section-heading">
              <div className="create-section-icon" aria-hidden="true">
                +
              </div>
              <div>
                <h2>Create an organization</h2>
                <p>Set up a new workspace for a team, client, or project.</p>
              </div>
            </div>

            <div className="create-form-container">
              <CreateOrganizationForm
                accessToken={tokens.access}
                onCreated={() => void loadOrganizations()}
              />
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>TaskFlow</span>
            <span>Make teamwork flow.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
