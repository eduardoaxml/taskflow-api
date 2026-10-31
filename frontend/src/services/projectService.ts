import type { PaginatedResponse, Project } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export interface CreateProjectPayload {
  name: string;
  slug: string;
}

export interface UpdateProjectPayload {
  name: string;
  description: string;
  status: Project["status"];
}

export type ProjectOrdering =
  | "name"
  | "-name"
  | "status"
  | "created_at"
  | "-created_at";

export interface ProjectListFilters {
  search?: string;
  status?: Project["status"] | "ALL";
  ordering?: ProjectOrdering;
}

export function getProjects(
  organizationId: string,
  request: AuthenticatedRequest,
  page = 1,
  filters: ProjectListFilters = {},
): Promise<PaginatedResponse<Project>> {
  const params = new URLSearchParams({
    page: String(page),
  });

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.ordering) {
    params.set("ordering", filters.ordering);
  }

  return request<PaginatedResponse<Project>>(
    `organizations/${organizationId}/projects/?${params.toString()}`,
  );
}

export function getProject(
  organizationId: string,
  projectId: string,
  request: AuthenticatedRequest,
): Promise<Project> {
  return request<Project>(
    `organizations/${organizationId}/projects/${projectId}/`,
  );
}

export function createProject(
  organizationId: string,
  payload: CreateProjectPayload,
  request: AuthenticatedRequest,
): Promise<Project> {
  return request<Project>(`organizations/${organizationId}/projects/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(
  organizationId: string,
  projectId: string,
  payload: UpdateProjectPayload,
  request: AuthenticatedRequest,
): Promise<Project> {
  return request<Project>(
    `organizations/${organizationId}/projects/${projectId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteProject(
  organizationId: string,
  projectId: string,
  request: AuthenticatedRequest,
): Promise<void> {
  return request<void>(
    `organizations/${organizationId}/projects/${projectId}/`,
    {
      method: "DELETE",
    },
  );
}
