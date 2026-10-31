import { apiRequest } from "./apiClient";
import type {
  LoginCredentials,
  RegisterPayload,
  TokenPair,
} from "../types/auth";

export function login(credentials: LoginCredentials): Promise<TokenPair> {
  return apiRequest<TokenPair>("auth/token/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(payload: RegisterPayload): Promise<unknown> {
  return apiRequest<unknown>("auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function refreshAccessToken(
  refresh: string,
): Promise<Pick<TokenPair, "access">> {
  return apiRequest<Pick<TokenPair, "access">>("auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}
export function logout(
  refresh: string,
  accessToken: string,
): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(
    "auth/logout/",
    {
      method: "POST",
      body: JSON.stringify({ refresh }),
    },
    accessToken,
  );
}
