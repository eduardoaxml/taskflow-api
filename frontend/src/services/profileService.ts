import type { UserProfile } from "../types/auth";

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
}

export function updateProfile(
  request: <T>(path: string, options?: RequestInit) => Promise<T>,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return request<UserProfile>("auth/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export function changePassword(
  request: <T>(path: string, options?: RequestInit) => Promise<T>,
  payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
  return request<{ detail: string }>("auth/me/change-password/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
