import type { PaginatedResponse, Project } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export interface CreateProjectPayload {
  name: string;
  slug: string;
}

export function getProjects(
  organizationId: string,
  request: <T>(path: string, options?: RequestInit) => Promise<T>,
): Promise<PaginatedResponse<Project>> {
  return request<PaginatedResponse<Project>>(
    `organizations/${organizationId}/projects/`,
  );
}

export function getProject(
  organizationId: string,
  projectId: string,
  request: <T>(path: string, options?: RequestInit) => Promise<T>,
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
