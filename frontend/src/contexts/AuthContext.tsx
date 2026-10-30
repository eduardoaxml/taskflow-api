import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./auth-context";
import type { LoginCredentials, TokenPair, UserProfile } from "../types/auth";
import { ApiError, apiRequest } from "../services/apiClient";
import * as authService from "../services/authService";

const STORAGE_KEY = "taskflow.auth";

function readStoredTokens(): TokenPair | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "access" in parsed &&
      "refresh" in parsed &&
      typeof parsed.access === "string" &&
      typeof parsed.refresh === "string"
    ) {
      return {
        access: parsed.access,
        refresh: parsed.refresh,
      };
    }
  } catch {
    // Storage may be unavailable or contain invalid JSON.
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<TokenPair | null>(readStoredTokens);

  const [isLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      if (tokens) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Authentication can still work for the current page.
    }
  }, [tokens]);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const tokenPair = await authService.login(credentials);
    setTokens(tokenPair);
  }, []);

  const signOut = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      if (!tokens?.access) {
        throw new Error("Authentication is required.");
      }

      try {
        return await apiRequest<T>(path, options, tokens.access);
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 401 ||
          !tokens.refresh
        ) {
          throw error;
        }

        try {
          const refreshed = await authService.refreshAccessToken(
            tokens.refresh,
          );

          const updatedTokens: TokenPair = {
            access: refreshed.access,
            refresh: tokens.refresh,
          };

          setTokens(updatedTokens);

          return await apiRequest<T>(path, options, updatedTokens.access);
        } catch (refreshError) {
          signOut();
          throw refreshError;
        }
      }
    },
    [tokens, signOut],
  );

  useEffect(() => {
    if (!tokens?.access) {
      return;
    }

    let isActive = true;

    const loadUser = async () => {
      try {
        const profile = await request<UserProfile>("auth/me/");

        if (isActive) {
          setUser(profile);
        }
      } catch {
        if (isActive) {
          setUser(null);
        }
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [tokens, request]);

  const value = useMemo(
    () => ({
      tokens,
      user,
      isAuthenticated: Boolean(tokens?.access),
      isLoading,
      signIn,
      signOut,
      request,
    }),
    [tokens, user, isLoading, signIn, signOut, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
