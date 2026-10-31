import type { CreateTaskPayload, PaginatedResponse, Task } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export type TaskOrdering =
  | "title"
  | "-title"
  | "status"
  | "priority"
  | "due_date"
  | "-due_date"
  | "created_at"
  | "-created_at";

export interface TaskListFilters {
  search?: string;
  status?: Task["status"] | "ALL";
  priority?: Task["priority"] | "ALL";
  ordering?: TaskOrdering;
  page?: number;
  assignee?: number;
  unassigned?: boolean;
  overdue?: boolean;
}

export function getTasks(
  organizationId: string,
  projectId: string,
  request: AuthenticatedRequest,
  filters: TaskListFilters = {},
): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.priority && filters.priority !== "ALL") {
    params.set("priority", filters.priority);
  }

  if (filters.assignee !== undefined) {
    params.set("assignee", String(filters.assignee));
  }

  if (filters.unassigned) {
    params.set("unassigned", "true");
  }

  if (filters.overdue) {
    params.set("overdue", "true");
  }

  if (filters.ordering) {
    params.set("ordering", filters.ordering);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const queryString = params.toString();
  const endpoint = `organizations/${organizationId}/projects/${projectId}/tasks/`;

  return request<PaginatedResponse<Task>>(
    queryString ? `${endpoint}?${queryString}` : endpoint,
  );
}

export function getTask(
  organizationId: string,
  projectId: string,
  taskId: string,
  request: AuthenticatedRequest,
): Promise<Task> {
  return request<Task>(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/`,
  );
}

export function createTask(
  organizationId: string,
  projectId: string,
  payload: CreateTaskPayload,
  request: AuthenticatedRequest,
): Promise<Task> {
  return request<Task>(
    `organizations/${organizationId}/projects/${projectId}/tasks/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateTask(
  organizationId: string,
  projectId: string,
  taskId: string,
  payload: Partial<CreateTaskPayload>,
  request: AuthenticatedRequest,
): Promise<Task> {
  return request<Task>(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTask(
  organizationId: string,
  projectId: string,
  taskId: string,
  request: AuthenticatedRequest,
): Promise<void> {
  return request<void>(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/`,
    { method: "DELETE" },
  );
}

export interface ProjectTaskSummary {
  total: number;
  todo: number;
  in_progress: number;
  blocked: number;
  completed: number;
  overdue: number;
}

export const getProjectTaskSummary = (
  organizationId: string,
  projectId: string,
  request: AuthenticatedRequest,
): Promise<ProjectTaskSummary> => {
  return request<ProjectTaskSummary>(
    `organizations/${organizationId}/projects/${projectId}/tasks/summary/`,
  );
};
