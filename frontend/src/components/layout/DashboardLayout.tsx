import type { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import "../../pages/DashboardPage.css";

interface DashboardLayoutProps {
  children: ReactNode;
  organizationCount?: number;
  activeSection: "dashboard" | "organizations";
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  organizationsTo: string;
}

export default function DashboardLayout({
  children,
  organizationCount,
  activeSection,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  organizationsTo,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        organizationCount={organizationCount}
        activeSection={activeSection}
        organizationsTo={organizationsTo}
      />

      <main className="dashboard-main">
        <DashboardTopbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />

        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
