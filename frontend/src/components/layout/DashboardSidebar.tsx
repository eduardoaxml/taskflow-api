import { Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface DashboardSidebarProps {
  organizationCount?: number;
  activeSection: "dashboard" | "organizations";
  organizationsTo: string;
}
export default function DashboardSidebar({
  organizationCount,
  activeSection,
  organizationsTo,
}: DashboardSidebarProps) {
  const { signOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside className="dashboard-sidebar">
      <Link to="/dashboard" className="dashboard-brand">
        <span className="brand-mark" aria-hidden="true">
          T
        </span>
        <span>TaskFlow</span>
      </Link>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <Link
          className={`sidebar-link ${
            activeSection === "dashboard" && pathname !== "/profile"
              ? "sidebar-link--active"
              : ""
          }`}
          to="/dashboard"
        >
          <span aria-hidden="true">⌂</span>
          Dashboard
        </Link>

        <Link
          className={`sidebar-link ${
            activeSection === "organizations" ? "sidebar-link--active" : ""
          }`}
          to={organizationsTo}
        >
          <span aria-hidden="true">▦</span>
          Organizations
          {organizationCount !== undefined && (
            <span className="sidebar-count">{organizationCount}</span>
          )}
        </Link>
        <Link
          className={`sidebar-link ${
            pathname === "/profile" ? "sidebar-link--active" : ""
          }`}
          to="/profile"
        >
          <span aria-hidden="true">◉</span>
          Profile
        </Link>
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
  );
}
