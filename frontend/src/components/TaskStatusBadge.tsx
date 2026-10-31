import type { Task } from "../types/api";

type Props = {
  status: Task["status"];
};

const statusConfig: Record<
  Task["status"],
  { label: string; className: string }
> = {
  TODO: {
    label: "To do",
    className: "task-status-badge--todo",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "task-status-badge--in-progress",
  },
  BLOCKED: {
    label: "Blocked",
    className: "task-status-badge--blocked",
  },
  DONE: {
    label: "Done",
    className: "task-status-badge--done",
  },
};

export default function TaskStatusBadge({ status }: Props) {
  const config = statusConfig[status];

  return (
    <span
      className={`task-status-badge ${config.className}`}
      aria-label={`Task status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
