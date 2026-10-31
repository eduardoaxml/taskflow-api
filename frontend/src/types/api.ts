export interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface Project {
  id: string;
  organization: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  project: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: number | null;
  assignee_email: string | null;
  created_by: number;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: number | null;
  due_date?: string | null;
}

export interface OrganizationMember {
  id: number;
  user_id: number;
  user_email: string;
  role: string;
  is_active: boolean;
  joined_at: string;
}

export interface TaskComment {
  id: string;
  task: string;
  author: number;
  author_email: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  task: string;
  actor: number;
  actor_email: string;
  action:
    | "CREATED"
    | "STATUS_CHANGED"
    | "PRIORITY_CHANGED"
    | "ASSIGNED"
    | "COMMENT_ADDED";
  description: string;
  created_at: string;
}
