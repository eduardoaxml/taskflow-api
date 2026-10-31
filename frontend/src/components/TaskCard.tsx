import { Link } from "react-router";
import type { Task } from "../types/api";
import EditTaskForm from "./EditTaskForm";
import TaskComments from "./TaskComments";
import TaskActivityTimeline from "./TaskActivityTimeline";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

interface TaskCardProps {
  task: Task;
  organizationId: string;
  projectId: string;
  request: AuthenticatedRequest;
  isEditing: boolean;
  deletingTaskId: string | null;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onCancel: () => void;
}

function formatTaskDueDate(date: string | null): string {
  if (!date) {
    return "No due date";
  }

  const [year, month, day] = date.split("-").map(Number);

  const parsedDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export default function TaskCard({
  task,
  organizationId,
  projectId,
  request,
  isEditing,
  deletingTaskId,
  canManage,
  onEdit,
  onDelete,
  onSaved,
  onCancel,
}: TaskCardProps) {
  return (
    <li className="task-card">
      {isEditing ? (
        <EditTaskForm
          organizationId={organizationId}
          projectId={projectId}
          task={task}
          request={request}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      ) : (
        <>
          <div className="task-card__header">
            <Link
              to={`/organizations/${organizationId}/projects/${projectId}/tasks/${task.id}`}
              className="task-card__title-link"
            >
              <h5 className="task-card__title">{task.title}</h5>
            </Link>
            {canManage && (
              <div className="task-card__actions">
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={deletingTaskId !== null}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="button-danger"
                  onClick={onDelete}
                  disabled={deletingTaskId !== null}
                >
                  {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>

          <p className="task-card__description">
            {task.description || "No description provided."}
          </p>

          <div className="task-card__metadata">
            <div className="task-card__metadata-item">
              <span className="task-card__metadata-label">Status</span>
              <TaskStatusBadge status={task.status} />
            </div>

            <div className="task-card__metadata-item">
              <span className="task-card__metadata-label">Priority</span>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            {task.is_overdue && (
              <div className="task-card__metadata-item">
                <span className="task-badge task-badge--overdue">Overdue</span>
              </div>
            )}
          </div>

          <div className="task-card__assignee">
            <span className="task-card__assignee-label">Assignee</span>

            <span className="task-card__assignee-value">
              {task.assignee_email || "Unassigned"}
            </span>
          </div>

          <div className="task-card__due-date">
            <span className="task-card__due-date-label">Due date</span>

            <span
              className={
                task.is_overdue
                  ? "task-card__due-date-value task-card__due-date-value--overdue"
                  : "task-card__due-date-value"
              }
            >
              {formatTaskDueDate(task.due_date)}
            </span>
          </div>

          <TaskComments
            organizationId={organizationId}
            projectId={projectId}
            taskId={task.id}
            request={request}
          />

          <TaskActivityTimeline
            organizationId={organizationId}
            projectId={projectId}
            taskId={task.id}
            request={request}
          />
        </>
      )}
    </li>
  );
}
