import type { Task } from "../types/api";

type Props = {
  priority: Task["priority"];
};

const priorityConfig: Record<
  Task["priority"],
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "task-priority-badge--low",
  },
  MEDIUM: {
    label: "Medium",
    className: "task-priority-badge--medium",
  },
  HIGH: {
    label: "High",
    className: "task-priority-badge--high",
  },
  URGENT: {
    label: "Urgent",
    className: "task-priority-badge--urgent",
  },
};

export default function TaskPriorityBadge({ priority }: Props) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`task-priority-badge ${config.className}`}
      aria-label={`Task priority: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
