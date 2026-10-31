import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface DashboardTopbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export default function DashboardTopbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
}: DashboardTopbarProps) {
  const { user, signOut } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!isProfileMenuOpen) return;

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

  return (
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
          aria-label="Search workspace"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
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
  );
}
