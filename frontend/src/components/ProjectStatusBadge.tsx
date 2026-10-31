import type { Project } from "../types/api";

type Props = {
  status: Project["status"];
};

const statusConfig: Record<
  Project["status"],
  { label: string; className: string }
> = {
  PLANNING: {
    label: "Planning",
    className: "project-status-badge--planning",
  },
  ACTIVE: {
    label: "Active",
    className: "project-status-badge--active",
  },
  COMPLETED: {
    label: "Completed",
    className: "project-status-badge--completed",
  },
  ARCHIVED: {
    label: "Archived",
    className: "project-status-badge--archived",
  },
};

export default function ProjectStatusBadge({ status }: Props) {
  const config = statusConfig[status];

  return (
    <span
      className={`project-status-badge ${config.className}`}
      aria-label={`Project status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
