import type { AuthUser } from "@/types/api/auth";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export type StoreListener<T> = (state: T) => void;
