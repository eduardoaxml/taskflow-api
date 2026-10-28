import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "../types/api";
import { ApiError } from "../services/apiClient";
import { deleteTask, getTasks } from "../services/taskService";
import CreateTaskForm from "./CreateTaskForm";
import EditTaskForm from "./EditTaskForm";
import TaskComments from "./TaskComments";
import TaskActivityTimeline from "./TaskActivityTimeline";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

interface ProjectTasksProps {
  organizationId: string;
  projectId: string;
  request: AuthenticatedRequest;
}

export default function ProjectTasks({
  organizationId,
  projectId,
  request,
}: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">(
    "ALL",
  );
  const requestIdRef = useRef(0);

  const fetchTasks = useCallback(
    () => getTasks(organizationId, projectId, request),
    [organizationId, projectId, request],
  );

  const loadTasks = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetchTasks();

      if (requestId === requestIdRef.current) {
        setTasks(response.results);
      }
    } catch (err: unknown) {
      if (requestId === requestIdRef.current) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load tasks. Please try again.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchTasks]);

  async function handleDeleteTask(taskId: string, taskTitle: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingTaskId(taskId);
    setDeleteError("");

    try {
      await deleteTask(organizationId, projectId, taskId, request);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Unable to delete task. Please try again.",
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTasks() {
      try {
        const response = await fetchTasks();

        if (!cancelled) {
          setTasks(response.results);
          setError("");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load tasks. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialTasks();

    return () => {
      cancelled = true;
    };
  }, [fetchTasks]);

  return (
    <section>
      <h4>Tasks</h4>

      <div className="task-filters">
        <input
          className="task-filters__search"
          type="search"
          placeholder="Search tasks by title..."
          aria-label="Search tasks by title"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          className="task-filters__select"
          aria-label="Filter tasks by status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as TaskStatus | "ALL")
          }
        >
          <option value="ALL">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="DONE">Done</option>
        </select>

        <select
          className="task-filters__select"
          aria-label="Filter tasks by priority"
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as TaskPriority | "ALL")
          }
        >
          <option value="ALL">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {isLoading && <p>Loading tasks...</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => void loadTasks()}>Retry</button>
        </div>
      )}

      {deleteError && (
        <p role="alert" className="form-error">
          {deleteError}
        </p>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <p>No tasks yet. Create the first task for this project.</p>
      )}

      <section>
        <h5>Tasks</h5>

        {filteredTasks.length > 0 ? (
          <ul>
            {filteredTasks.map((task) => (
              <li key={task.id} className="task-card">
                {editingTaskId === task.id ? (
                  <EditTaskForm
                    organizationId={organizationId}
                    projectId={projectId}
                    task={task}
                    request={request}
                    onSaved={() => {
                      setEditingTaskId(null);
                      void loadTasks();
                    }}
                    onCancel={() => setEditingTaskId(null)}
                  />
                ) : (
                  <>
                    <div className="task-card__header">
                      <h5 className="task-card__title">{task.title}</h5>

                      <div className="task-card__actions">
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(task.id)}
                          disabled={deletingTaskId !== null}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="button-danger"
                          onClick={() =>
                            void handleDeleteTask(task.id, task.title)
                          }
                          disabled={deletingTaskId !== null}
                        >
                          {deletingTaskId === task.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    <p className="task-card__description">
                      {task.description || "No description provided."}
                    </p>

                    <div className="task-card__metadata">
                      <span
                        className={`status-badge status-badge--${task.status.toLowerCase()}`}
                      >
                        {task.status.replaceAll("_", " ")}
                      </span>

                      <span
                        className={`priority-badge priority-badge--${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="task-card__assignee">
                      <strong>Assigned to:</strong>{" "}
                      {task.assignee_email || "Unassigned"}
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
            ))}
          </ul>
        ) : (
          <p>No tasks match your search or selected filters.</p>
        )}
      </section>
      <CreateTaskForm
        organizationId={organizationId}
        projectId={projectId}
        request={request}
        onCreated={() => void loadTasks()}
      />
    </section>
  );
}
