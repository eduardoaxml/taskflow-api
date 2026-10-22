import type { CreateTaskPayload, PaginatedResponse, Task } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export function getTasks(
  organizationId: string,
  projectId: string,
  request: AuthenticatedRequest,
): Promise<PaginatedResponse<Task>> {
  return request<PaginatedResponse<Task>>(
    `organizations/${organizationId}/projects/${projectId}/tasks/`,
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
