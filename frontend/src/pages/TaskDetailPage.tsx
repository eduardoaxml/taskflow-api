import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { deleteTask, getTask } from "../services/taskService";
import type { Task, OrganizationMember } from "../types/api";

import TaskStatusBadge from "../components/TaskStatusBadge";
import TaskPriorityBadge from "../components/TaskPriorityBadge";
import TaskComments from "../components/TaskComments";
import TaskActivityTimeline from "../components/TaskActivityTimeline";

import EditTaskForm from "../components/EditTaskForm";
import { getAllOrganizationMembers } from "../services/organizationService";

export default function TaskDetailPage() {
  const { organizationId, projectId, taskId } = useParams<{
    organizationId: string;
    projectId: string;
    taskId: string;
  }>();

  const { request, user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const canManageTasks = members.some(
    (member) =>
      member.user_id === user?.id &&
      member.is_active &&
      ["OWNER", "ADMIN"].includes(member.role),
  );
  const loadTask = useCallback(async () => {
    if (!organizationId || !projectId || !taskId) {
      setError("Invalid task URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await getTask(
        organizationId,
        projectId,
        taskId,
        request,
      );

      setTask(response);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load task. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, projectId, taskId, request]);

  async function handleDeleteTask() {
    if (!organizationId || !projectId || !task) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteTask(organizationId, projectId, task.id, request);

      handleBack();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Unable to delete task. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;

    async function loadMembers() {
      try {
        const response = await getAllOrganizationMembers(
          organizationId!,
          request,
        );

        if (!cancelled) {
          setMembers(response.filter((member) => member.is_active));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unable to load organization members:", err);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [organizationId, request]);

  function handleBack() {
    if (!organizationId || !projectId) return;

    navigate(`/organizations/${organizationId}/projects/${projectId}`);
  }

  if (isLoading) {
    return <p>Loading task...</p>;
  }

  if (error || !task) {
    return (
      <section>
        <p role="alert">{error || "Task not found."}</p>

        <button type="button" onClick={() => void loadTask()}>
          Retry
        </button>

        <button type="button" onClick={handleBack}>
          Back to project
        </button>
      </section>
    );
  }

  return (
    <main className="task-detail-page">
      <button type="button" onClick={handleBack}>
        Back to project
      </button>

      <header className="task-detail-page__header">
        <div>
          <h1>{task.title}</h1>
          <p>{task.description || "No description provided."}</p>
        </div>
        {canManageTasks && (
          <div className="task-detail-page__actions">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
            >
              Edit task
            </button>

            <button
              type="button"
              className="button-danger"
              onClick={() => void handleDeleteTask()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete task"}
            </button>
          </div>
        )}
      </header>
      {deleteError && (
        <p role="alert" className="form-error">
          {deleteError}
        </p>
      )}
      {isEditing ? (
        <section className="task-detail-page__section">
          <h2>Edit task</h2>

          <EditTaskForm
            organizationId={organizationId!}
            projectId={projectId!}
            task={task}
            request={request}
            onSaved={() => {
              setIsEditing(false);
              void loadTask();
            }}
            onCancel={() => setIsEditing(false)}
          />
        </section>
      ) : (
        <>
          <section className="task-detail-page__metadata">
            <div className="task-detail-page__metadata-item">
              <strong>Status</strong>
              <TaskStatusBadge status={task.status} />
            </div>

            <div className="task-detail-page__metadata-item">
              <strong>Priority</strong>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="task-detail-page__metadata-item">
              <strong>Assignee</strong>
              <span>{task.assignee_email || "Unassigned"}</span>
            </div>

            <div className="task-detail-page__metadata-item">
              <strong>Due date</strong>
              <span>{task.due_date || "No due date"}</span>
            </div>

            {task.is_overdue && (
              <div className="task-detail-page__metadata-item">
                <strong>Deadline</strong>
                <span className="task-badge task-badge--overdue">Overdue</span>
              </div>
            )}
          </section>

          <section className="task-detail-page__section">
            <h2>Comments</h2>

            <TaskComments
              organizationId={organizationId!}
              projectId={projectId!}
              taskId={task.id}
              request={request}
            />
          </section>

          <section className="task-detail-page__section">
            <h2>Activity history</h2>

            <TaskActivityTimeline
              organizationId={organizationId!}
              projectId={projectId!}
              taskId={task.id}
              request={request}
            />
          </section>
        </>
      )}
    </main>
  );
}
