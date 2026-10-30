import type { Project, Task } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export interface WorkspaceMetrics {
  total_projects: number;
  projects_by_status: {
    PLANNING: number;
    ACTIVE: number;
    COMPLETED: number;
    ARCHIVED: number;
  };
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  tasks_by_status: {
    TODO: number;
    IN_PROGRESS: number;
    BLOCKED: number;
    DONE: number;
  };
  tasks_by_priority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

export interface WorkspaceOverview {
  metrics: WorkspaceMetrics;
  projects: Project[];
  tasks: Task[];
}

export function getWorkspaceOverview(
  request: AuthenticatedRequest,
): Promise<WorkspaceOverview> {
  return request<WorkspaceOverview>("workspace/overview/");
}
