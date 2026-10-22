import type { TaskActivity } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export async function getTaskActivities(
  organizationId: string,
  projectId: string,
  taskId: string,
  request: AuthenticatedRequest,
): Promise<TaskActivity[]> {
  const response = await request<{ results?: TaskActivity[] } | TaskActivity[]>(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/activities/`,
  );

  return Array.isArray(response) ? response : (response.results ?? []);
}
