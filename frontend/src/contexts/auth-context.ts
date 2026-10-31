import { createContext } from "react";
import type { TokenPair, LoginCredentials, UserProfile } from "../types/auth";

export interface AuthContextValue {
  tokens: TokenPair | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  updateUser: (user: UserProfile) => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
