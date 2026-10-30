import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { getAllPages } from "../services/pagination";
import type { Organization, TaskActivity } from "../types/api";
import CreateOrganizationForm from "../components/CreateOrganizationForm";
import "./DashboardPage.css";
import { getOrganizationActivities } from "../services/activityService";
import { getWorkspaceOverview } from "../services/workspaceService";
import type { WorkspaceMetrics } from "../services/workspaceService";

export default function DashboardPage() {
  const { tokens, user, signOut, request } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Account";

  const profileInitials =
    [user?.first_name?.[0], user?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [recentActivities, setRecentActivities] = useState<TaskActivity[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;

      if (target instanceof Node && !profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [isProfileMenuOpen]);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const results = await getAllPages<Organization>(
        "organizations/",
        request,
      );
      setOrganizations(results);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrganizations();
  }, [loadOrganizations]);

  const loadWorkspaceOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    setOverviewError("");

    try {
      const overview = await getWorkspaceOverview(request);

      setMetrics(overview.metrics);
    } catch (err) {
      console.error("Workspace overview error:", err);

      setOverviewError("Unable to load workspace metrics. Please try again.");
    } finally {
      setIsOverviewLoading(false);
    }
  }, [request]);

  const loadRecentActivity = useCallback(async () => {
    setIsActivityLoading(true);
    setActivityError("");

    try {
      const activitiesByOrganization = await Promise.all(
        organizations.map((organization) =>
          getOrganizationActivities(organization.id, request),
        ),
      );

      const activities = activitiesByOrganization
        .flatMap((response) => response.results)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      setRecentActivities(activities.slice(0, 8));
    } catch {
      setActivityError("Unable to load recent activity.");
    } finally {
      setIsActivityLoading(false);
    }
  }, [organizations, request]);

  const filteredOrganizations = organizations.filter((organization) => {
    const query = searchQuery.trim().toLowerCase();

    return (
      organization.name.toLowerCase().includes(query) ||
      organization.slug.toLowerCase().includes(query)
    );
  });

  const totalProjects = metrics?.total_projects ?? 0;
  const totalTasks = metrics?.total_tasks ?? 0;
  const completedTasks = metrics?.completed_tasks ?? 0;
  const pendingTasks = metrics?.pending_tasks ?? 0;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const projectStatusItems = [
    {
      label: "Planning",
      value: metrics?.projects_by_status.PLANNING ?? 0,
      color: "planning",
    },
    {
      label: "Active",
      value: metrics?.projects_by_status.ACTIVE ?? 0,
      color: "active",
    },
    {
      label: "Completed",
      value: metrics?.projects_by_status.COMPLETED ?? 0,
      color: "completed",
    },
    {
      label: "Archived",
      value: metrics?.projects_by_status.ARCHIVED ?? 0,
      color: "archived",
    },
  ];
  const taskStatusItems = [
    {
      label: "To do",
      value: metrics?.tasks_by_status.TODO ?? 0,
      color: "todo",
    },
    {
      label: "In progress",
      value: metrics?.tasks_by_status.IN_PROGRESS ?? 0,
      color: "in-progress",
    },
    {
      label: "Blocked",
      value: metrics?.tasks_by_status.BLOCKED ?? 0,
      color: "blocked",
    },
    {
      label: "Done",
      value: metrics?.tasks_by_status.DONE ?? 0,
      color: "done",
    },
  ];

  const taskPriorityItems = [
    {
      label: "Low",
      value: metrics?.tasks_by_priority.LOW ?? 0,
      color: "low",
    },
    {
      label: "Medium",
      value: metrics?.tasks_by_priority.MEDIUM ?? 0,
      color: "medium",
    },
    {
      label: "High",
      value: metrics?.tasks_by_priority.HIGH ?? 0,
      color: "high",
    },
    {
      label: "Urgent",
      value: metrics?.tasks_by_priority.URGENT ?? 0,
      color: "urgent",
    },
  ];

  useEffect(() => {
    if (isLoading || error) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWorkspaceOverview();
  }, [isLoading, error, loadWorkspaceOverview]);

  useEffect(() => {
    if (isLoading || error) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecentActivity();
  }, [isLoading, error, loadRecentActivity]);

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
          <form
            className="dashboard-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <span className="dashboard-search-icon" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              aria-label="Search organizations"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>

          <div className="topbar-actions">
            <div className="topbar-status">
              <span className="status-dot" />
              Workspace connected
            </div>

            <div className="profile-menu" ref={profileMenuRef}>
              <button
                ref={profileTriggerRef}
                type="button"
                className="profile-trigger"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-controls="profile-dropdown"
                aria-label={`Account menu for ${profileName}`}
                onClick={() => setIsProfileMenuOpen((open) => !open)}
              >
                <span className="profile-avatar" aria-hidden="true">
                  {profileInitials}
                </span>

                <span className="profile-trigger-info">
                  <span className="profile-trigger-name">{profileName}</span>
                  <span className="profile-trigger-email">{user?.email}</span>
                </span>

                <span className="profile-chevron" aria-hidden="true">
                  {isProfileMenuOpen ? "⌃" : "⌄"}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  id="profile-dropdown"
                  className="profile-dropdown"
                  aria-label="Account options"
                >
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-identity">
                      <span className="profile-avatar" aria-hidden="true">
                        {profileInitials}
                      </span>

                      <div className="profile-dropdown-user">
                        <strong>{profileName}</strong>
                        <span>{user?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-signout"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                  >
                    <span className="profile-signout-icon" aria-hidden="true">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                    </span>

                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
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
                <p className="overview-label">Organizations</p>
                <p className="overview-value">
                  {isLoading ? "—" : organizations.length}
                </p>
                <p className="overview-caption">Available workspaces</p>
              </div>
            </article>

            <article className="overview-card">
              <div className="overview-icon overview-icon--purple">↗</div>
              <div>
                <p className="overview-label">Total projects</p>
                <p className="overview-value">
                  {isOverviewLoading ? "—" : totalProjects}
                </p>
                <p className="overview-caption">Across your organizations</p>
              </div>
            </article>

            <article className="overview-card">
              <div className="overview-icon overview-icon--blue">☷</div>
              <div>
                <p className="overview-label">Total tasks</p>
                <p className="overview-value">
                  {isOverviewLoading ? "—" : totalTasks}
                </p>
                <p className="overview-caption">Tasks across all projects</p>
              </div>
            </article>

            <article className="overview-card">
              <div className="overview-icon overview-icon--purple">✓</div>
              <div>
                <p className="overview-label">Completed tasks</p>
                <p className="overview-value">
                  {isOverviewLoading ? "—" : completedTasks}
                </p>
                <p className="overview-caption">Tasks marked as done</p>
              </div>
            </article>

            <article className="overview-card">
              <div className="overview-icon overview-icon--blue">◷</div>
              <div>
                <p className="overview-label">Pending tasks</p>
                <p className="overview-value">
                  {isOverviewLoading ? "—" : pendingTasks}
                </p>
                <p className="overview-caption">Tasks not yet completed</p>
              </div>
            </article>

            <article className="overview-card overview-card--accent">
              <div className="overview-icon overview-icon--purple">%</div>
              <div>
                <p className="overview-label">Completion rate</p>
                <p className="overview-value">
                  {isOverviewLoading ? "—" : `${completionRate}%`}
                </p>
                <p className="overview-caption">Overall task completion</p>
              </div>
            </article>
          </section>
          <section className="task-breakdown-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TASK INSIGHTS</p>
                <h2>Task breakdown</h2>
                <p className="section-description">
                  Understand the status and priority of your workspace tasks.
                </p>
              </div>
            </div>

            {overviewError ? (
              <div className="dashboard-message">
                <p>Task breakdown is unavailable.</p>
              </div>
            ) : (
              <div className="task-breakdown-grid">
                <article className="task-breakdown-card">
                  <div className="task-breakdown-header">
                    <div>
                      <h3>Projects by status</h3>
                      <p>Current lifecycle of your projects</p>
                    </div>

                    <span className="task-breakdown-total">
                      {isOverviewLoading ? "—" : totalProjects}
                    </span>
                  </div>

                  <div className="task-breakdown-list">
                    {projectStatusItems.map((item) => {
                      const percentage =
                        totalProjects > 0
                          ? Math.round((item.value / totalProjects) * 100)
                          : 0;

                      return (
                        <div className="task-breakdown-item" key={item.color}>
                          <div className="task-breakdown-item-header">
                            <span>
                              <span
                                className={`task-breakdown-dot task-breakdown-dot--${item.color}`}
                              />
                              {item.label}
                            </span>

                            <strong>
                              {isOverviewLoading ? "—" : item.value}
                            </strong>
                          </div>

                          <div
                            className="task-breakdown-track"
                            role="progressbar"
                            aria-label={`${item.label} projects`}
                            aria-valuenow={isOverviewLoading ? 0 : percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`task-breakdown-bar task-breakdown-bar--${item.color}`}
                              style={{
                                width: isOverviewLoading
                                  ? "0%"
                                  : `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
                <article className="task-breakdown-card">
                  <div className="task-breakdown-header">
                    <div>
                      <h3>Tasks by status</h3>
                      <p>Current progress across your tasks</p>
                    </div>
                    <span className="task-breakdown-total">
                      {isOverviewLoading ? "—" : totalTasks}
                    </span>
                  </div>

                  <div className="task-breakdown-list">
                    {taskStatusItems.map((item) => {
                      const percentage =
                        totalTasks > 0
                          ? Math.round((item.value / totalTasks) * 100)
                          : 0;

                      return (
                        <div className="task-breakdown-item" key={item.color}>
                          <div className="task-breakdown-item-header">
                            <span>
                              <span
                                className={`task-breakdown-dot task-breakdown-dot--${item.color}`}
                              />
                              {item.label}
                            </span>

                            <strong>
                              {isOverviewLoading ? "—" : item.value}
                            </strong>
                          </div>

                          <div
                            className="task-breakdown-track"
                            role="progressbar"
                            aria-label={`${item.label} tasks`}
                            aria-valuenow={isOverviewLoading ? 0 : percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`task-breakdown-bar task-breakdown-bar--${item.color}`}
                              style={{
                                width: isOverviewLoading
                                  ? "0%"
                                  : `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="task-breakdown-card">
                  <div className="task-breakdown-header">
                    <div>
                      <h3>Tasks by priority</h3>
                      <p>Distribution of task priorities</p>
                    </div>
                    <span className="task-breakdown-total">
                      {isOverviewLoading ? "—" : totalTasks}
                    </span>
                  </div>

                  <div className="task-breakdown-list">
                    {taskPriorityItems.map((item) => {
                      const percentage =
                        totalTasks > 0
                          ? Math.round((item.value / totalTasks) * 100)
                          : 0;

                      return (
                        <div className="task-breakdown-item" key={item.color}>
                          <div className="task-breakdown-item-header">
                            <span>
                              <span
                                className={`task-breakdown-dot task-breakdown-dot--${item.color}`}
                              />
                              {item.label}
                            </span>

                            <strong>
                              {isOverviewLoading ? "—" : item.value}
                            </strong>
                          </div>

                          <div
                            className="task-breakdown-track"
                            role="progressbar"
                            aria-label={`${item.label} priority tasks`}
                            aria-valuenow={isOverviewLoading ? 0 : percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`task-breakdown-bar task-breakdown-bar--${item.color}`}
                              style={{
                                width: isOverviewLoading
                                  ? "0%"
                                  : `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>
            )}
          </section>
          <section className="recent-activity-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">WHAT'S HAPPENING</p>
                <h2>Recent activity</h2>
                <p className="section-description">
                  The latest updates across your workspace.
                </p>
              </div>
            </div>

            {isActivityLoading && (
              <div className="dashboard-message">
                <span className="loading-spinner" aria-hidden="true" />
                <p>Loading recent activity…</p>
              </div>
            )}

            {!isActivityLoading && activityError && (
              <div className="dashboard-error" role="alert">
                <p>{activityError}</p>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void loadRecentActivity()}
                >
                  Try again
                </button>
              </div>
            )}

            {!isActivityLoading &&
              !activityError &&
              recentActivities.length === 0 && (
                <div className="empty-state">
                  <h3>No recent activity yet</h3>
                  <p>
                    Updates from your tasks will appear here as your team works.
                  </p>
                </div>
              )}

            {!isActivityLoading &&
              !activityError &&
              recentActivities.length > 0 && (
                <div className="recent-activity-list">
                  {recentActivities.map((activity) => (
                    <article className="recent-activity-item" key={activity.id}>
                      <div
                        className="recent-activity-indicator"
                        aria-hidden="true"
                      >
                        {activity.action === "CREATED"
                          ? "+"
                          : activity.action === "COMMENT_ADDED"
                            ? "▤"
                            : activity.action === "ASSIGNED"
                              ? "↗"
                              : "✓"}
                      </div>

                      <div className="recent-activity-content">
                        <p className="recent-activity-description">
                          {activity.description}
                        </p>

                        <p className="recent-activity-meta">
                          {activity.actor_email}
                          {" · "}
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </section>

          {overviewError && (
            <div className="dashboard-error" role="alert">
              <div>
                <strong>We couldn't load your workspace metrics.</strong>
                <p>{overviewError}</p>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() => void loadWorkspaceOverview()}
              >
                Try again
              </button>
            </div>
          )}

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

            {!isLoading && !error && filteredOrganizations.length > 0 && (
              <div className="organization-grid">
                {filteredOrganizations.map((organization, index) => (
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
                {!isLoading &&
                  !error &&
                  organizations.length > 0 &&
                  filteredOrganizations.length === 0 && (
                    <p role="status" className="dashboard-message">
                      No organizations match "{searchQuery}".
                    </p>
                  )}
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
