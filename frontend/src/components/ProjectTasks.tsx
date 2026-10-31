import { useCallback, useEffect, useRef, useState } from "react";
import { getAllOrganizationMembers } from "../services/organizationService";

import type {
  Task,
  TaskPriority,
  TaskStatus,
  OrganizationMember,
} from "../types/api";
import { ApiError } from "../services/apiClient";
import {
  deleteTask,
  getTasks,
  type TaskOrdering,
} from "../services/taskService";
import CreateTaskForm from "./CreateTaskForm";
import TaskCard from "./TaskCard";
import { useAuth } from "../hooks/useAuth";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

interface ProjectTasksProps {
  organizationId: string;
  projectId: string;
  request: AuthenticatedRequest;
  statusFilter: TaskStatus | "ALL";
  onStatusFilterChange: (status: TaskStatus | "ALL") => void;
  onTasksChanged: () => void | Promise<void>;
  overdueFilter: boolean;
  onOverdueFilterChange: (overdue: boolean) => void;
}

export default function ProjectTasks({
  organizationId,
  projectId,
  request,
  statusFilter,
  onStatusFilterChange,
  onTasksChanged,
  overdueFilter,
  onOverdueFilterChange,
}: ProjectTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortBy, setSortBy] = useState<TaskOrdering>("-created_at");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "ALL">("ALL");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [unassignedFilter, setUnassignedFilter] = useState(false);
  const canManageTasks = members.some(
    (member) =>
      member.user_id === user?.id &&
      member.is_active &&
      ["OWNER", "ADMIN"].includes(member.role),
  );

  const fetchTasks = useCallback(
    () =>
      getTasks(organizationId, projectId, request, {
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        page: currentPage,
        ordering: sortBy,
        assignee: assigneeFilter === "ALL" ? undefined : assigneeFilter,
        unassigned: unassignedFilter,
        overdue: overdueFilter,
      }),
    [
      organizationId,
      projectId,
      request,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      currentPage,
      sortBy,
      assigneeFilter,
      unassignedFilter,
      overdueFilter,
    ],
  );

  const loadTasks = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    onStatusFilterChange("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setUnassignedFilter(false);
    onOverdueFilterChange(false);
    setSortBy("-created_at");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    unassignedFilter ||
    overdueFilter ||
    sortBy !== "-created_at";

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

      setPagination((current) => ({
        ...current,
        count: Math.max(0, current.count - 1),
      }));
      void onTasksChanged();
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

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    const load = async () => {
      const isInitialLoad = !hasLoadedRef.current;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError("");

      try {
        const response = await fetchTasks();

        if (!cancelled && requestId === requestIdRef.current) {
          setTasks(response.results);
          setPagination({
            count: response.count,
            next: response.next,
            previous: response.previous,
          });
          hasLoadedRef.current = true;
        }
      } catch (err: unknown) {
        if (!cancelled && requestId === requestIdRef.current) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load tasks. Please try again.",
          );
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          hasLoadedRef.current = true;
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchTasks, reloadKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
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
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          className="task-filters__select"
          aria-label="Filter tasks by status"
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as TaskStatus | "ALL")
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
          onChange={(event) => {
            setPriorityFilter(event.target.value as TaskPriority | "ALL");
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      {hasActiveFilters && (
        <div className="task-active-filters">
          <span>Active filters:</span>

          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearch("");
                setCurrentPage(1);
              }}
            >
              Search: {searchTerm} ×
            </button>
          )}

          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => {
                onStatusFilterChange("ALL");
                setCurrentPage(1);
              }}
            >
              Status: {statusFilter.replace("_", " ")} ×
            </button>
          )}

          {priorityFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => {
                setPriorityFilter("ALL");
                setCurrentPage(1);
              }}
            >
              Priority: {priorityFilter} ×
            </button>
          )}

          {assigneeFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => {
                setAssigneeFilter("ALL");
                setCurrentPage(1);
              }}
            >
              Assignee:{" "}
              {members.find((member) => member.user_id === assigneeFilter)
                ?.user_email ?? "Selected"}{" "}
              ×
            </button>
          )}

          {unassignedFilter && (
            <button
              type="button"
              onClick={() => {
                setUnassignedFilter(false);
                setCurrentPage(1);
              }}
            >
              Unassigned ×
            </button>
          )}

          {overdueFilter && (
            <button
              type="button"
              onClick={() => {
                onOverdueFilterChange(false);
                setCurrentPage(1);
              }}
            >
              Overdue ×
            </button>
          )}

          {sortBy !== "-created_at" && (
            <button
              type="button"
              onClick={() => {
                setSortBy("-created_at");
                setCurrentPage(1);
              }}
            >
              Custom sorting ×
            </button>
          )}

          <button type="button" onClick={handleClearFilters}>
            Clear all
          </button>
        </div>
      )}
      <label>
        Assignee
        <select
          value={unassignedFilter ? "UNASSIGNED" : String(assigneeFilter)}
          onChange={(event) => {
            const value = event.target.value;

            if (value === "UNASSIGNED") {
              setAssigneeFilter("ALL");
              setUnassignedFilter(true);
            } else {
              setUnassignedFilter(false);
              setAssigneeFilter(value === "ALL" ? "ALL" : Number(value));
            }

            setCurrentPage(1);
          }}
        >
          <option value="ALL">All assignees</option>
          <option value="UNASSIGNED">Unassigned tasks</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user_email}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sort by
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as TaskOrdering);
            setCurrentPage(1);
          }}
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="title">Title (A–Z)</option>
          <option value="-title">Title (Z–A)</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="due_date">Due date (earliest)</option>
          <option value="-due_date">Due date (latest)</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={overdueFilter}
          onChange={(event) => {
            onOverdueFilterChange(event.target.checked);
            setCurrentPage(1);
          }}
        />
        Show overdue only
      </label>

      {hasActiveFilters && (
        <button type="button" onClick={handleClearFilters}>
          Clear filters
        </button>
      )}

      {isLoading && <p>Loading tasks...</p>}
      {isRefreshing && (
        <p className="task-refresh-indicator" role="status">
          Updating tasks...
        </p>
      )}
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

      <section>
        <h5>Tasks</h5>

        {!isLoading &&
          !isRefreshing &&
          !error &&
          (tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  organizationId={organizationId}
                  projectId={projectId}
                  request={request}
                  isEditing={editingTaskId === task.id}
                  deletingTaskId={deletingTaskId}
                  onEdit={() => setEditingTaskId(task.id)}
                  onDelete={() => void handleDeleteTask(task.id, task.title)}
                  onSaved={() => {
                    setEditingTaskId(null);
                    void loadTasks();
                    void onTasksChanged();
                  }}
                  onCancel={() => setEditingTaskId(null)}
                  canManage={canManageTasks}
                />
              ))}
            </ul>
          ) : (
            <div className="task-empty-state">
              {hasActiveFilters ? (
                <>
                  <h3>No matching tasks</h3>
                  <p>No tasks match your current search or filters.</p>
                  <button type="button" onClick={handleClearFilters}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3>No tasks yet</h3>
                  <p>
                    Create your first task to start organizing this project.
                  </p>
                </>
              )}
            </div>
          ))}
        {pagination.count > 0 && (
          <div className="task-pagination">
            <p>
              Showing {tasks.length} tasks on this page
              {" · "}
              {pagination.count} total
            </p>

            <div className="task-pagination-actions">
              <button
                type="button"
                disabled={!pagination.previous || isLoading}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </button>

              <span>Page {currentPage}</span>

              <button
                type="button"
                disabled={!pagination.next || isLoading}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      <CreateTaskForm
        organizationId={organizationId}
        projectId={projectId}
        request={request}
        onCreated={() => {
          void loadTasks();
          void onTasksChanged();
        }}
      />
    </section>
  );
}
