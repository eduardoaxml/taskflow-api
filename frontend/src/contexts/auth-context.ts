import { createContext } from "react";
import type { TokenPair, LoginCredentials } from "../types/auth";

export interface AuthContextValue {
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => void;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
