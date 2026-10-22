import type { TaskComment } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export async function getTaskComments(
  organizationId: string,
  projectId: string,
  taskId: string,
  request: AuthenticatedRequest,
): Promise<TaskComment[]> {
  const response = await request<
    | {
        results?: TaskComment[];
      }
    | TaskComment[]
  >(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/comments/`,
  );

  return Array.isArray(response) ? response : (response.results ?? []);
}

export async function createTaskComment(
  organizationId: string,
  projectId: string,
  taskId: string,
  content: string,
  request: AuthenticatedRequest,
): Promise<TaskComment> {
  return request<TaskComment>(
    `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/comments/`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}
