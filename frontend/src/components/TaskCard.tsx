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
            <div>
              <span>Status: </span>
              <TaskStatusBadge status={task.status} />
            </div>

            <div>
              <span>Priority: </span>
              <TaskPriorityBadge priority={task.priority} />
            </div>
            {task.is_overdue && (
              <span className="task-badge task-badge--overdue">Overdue</span>
            )}
          </div>

          <p className="task-card__assignee">
            <strong>Assigned to:</strong> {task.assignee_email || "Unassigned"}
          </p>

          <p className="task-card__due-date">
            Due date: {task.due_date || "No due date"}
          </p>

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
