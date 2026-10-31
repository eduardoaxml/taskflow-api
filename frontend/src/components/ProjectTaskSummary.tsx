import type { ProjectTaskSummary as ProjectTaskSummaryData } from "../services/taskService";
import type { TaskStatus } from "../types/api";
import "./ProjectTaskSummary.css";

interface ProjectTaskSummaryProps {
  summary: ProjectTaskSummaryData;
  onSelectStatus: (status: TaskStatus | "ALL") => void;
  isOverdueSelected: boolean;
  onSelectOverdue: () => void;
}

const summaryCards = [
  { key: "total", label: "Total tasks", className: "total", status: "ALL" },
  { key: "todo", label: "To do", className: "todo", status: "TODO" },
  {
    key: "in_progress",
    label: "In progress",
    className: "in-progress",
    status: "IN_PROGRESS",
  },
  { key: "blocked", label: "Blocked", className: "blocked", status: "BLOCKED" },
  {
    key: "completed",
    label: "Completed",
    className: "completed",
    status: "DONE",
  },
] as const;

export default function ProjectTaskSummary({
  summary,
  onSelectStatus,
  isOverdueSelected,
  onSelectOverdue,
}: ProjectTaskSummaryProps) {
  return (
    <section className="project-task-summary" aria-label="Project task summary">
      {summaryCards.map((card) => (
        <button
          key={card.key}
          type="button"
          className={`project-task-summary__card project-task-summary__card--${card.className}`}
          onClick={() => onSelectStatus(card.status)}
          aria-label={`Show ${card.label.toLowerCase()}`}
        >
          <span className="project-task-summary__label">{card.label}</span>
          <strong className="project-task-summary__value">
            {summary[card.key]}
          </strong>
        </button>
      ))}

      <button
        type="button"
        className={`project-task-summary__card project-task-summary__card--overdue ${
          isOverdueSelected ? "is-selected" : ""
        }`}
        onClick={onSelectOverdue}
        aria-pressed={isOverdueSelected}
        aria-label="Toggle overdue tasks filter"
      >
        <span className="project-task-summary__label">Overdue</span>
        <strong className="project-task-summary__value">
          {summary.overdue}
        </strong>
      </button>
    </section>
  );
}
