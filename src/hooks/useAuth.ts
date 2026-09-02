import { useCallback, useSyncExternalStore } from "react";
import { authStore } from "@/store/authStore";
import { authApi } from "@/api/modules/auth.api";
import { setApiAuthHandlers } from "@/lib/api/interceptors";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/types/api/auth";
import { isAdmin, isCustomer, isProvider, isSupport } from "@/constants/roles";

function pickTokens(res: AuthResponse) {
  const nested = res.data;
  const accessToken =
    res.token || res.accessToken || nested?.token || nested?.accessToken || null;
  const refreshToken = res.refreshToken || nested?.refreshToken || null;
  const user = (res.user || (nested && "id" in nested ? nested : null)) as AuthUser | null;
  return { accessToken, refreshToken, user };
}

/**
 * Auth session hook — hydrate, login helpers, role flags.
 * Wire `setApiAuthHandlers` once in app bootstrap (see `bootstrapApi`).
 */
export function useAuthSession() {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState
  );

  const hydrate = useCallback(() => {
    authStore.hydrateFromStorage();
  }, []);

  const fetchMe = useCallback(async () => {
    const res = await authApi.me();
    const user = ((res as { data?: AuthUser }).data ?? res) as AuthUser;
    authStore.setUser(user);
    return user;
  }, []);

  const applyAuthResponse = useCallback((res: AuthResponse) => {
    const { accessToken, refreshToken, user } = pickTokens(res);
    authStore.setSession({ accessToken, refreshToken, user });
    return { accessToken, refreshToken, user };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await authApi.login(payload);
      return applyAuthResponse(res);
    },
    [applyAuthResponse]
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    // Register often returns user without tokens (email verification required)
    const res = await authApi.register(payload);
    const { accessToken, refreshToken, user } = pickTokens(res);
    if (accessToken) {
      authStore.setSession({ accessToken, refreshToken, user });
    }
    return { accessToken, refreshToken, user, raw: res };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* still clear local session */
    } finally {
      authStore.clearSession();
    }
  }, []);

  const roleId = state.user?.role_id;

  return {
    ...state,
    roleId,
    isCustomer: isCustomer(roleId),
    isProvider: isProvider(roleId),
    isAdmin: isAdmin(roleId),
    isSupport: isSupport(roleId),
    hydrate,
    fetchMe,
    login,
    register,
    logout,
    applyAuthResponse,
    clearSession: authStore.clearSession,
  };
}

/** Call once near app root (e.g. main.tsx) — no UI required */
export function bootstrapApi(options?: { onUnauthorized?: () => void }) {
  authStore.hydrateFromStorage();
  setApiAuthHandlers({
    onUnauthorized: () => {
      authStore.clearSession();
      options?.onUnauthorized?.();
    },
  });
}

export default useAuthSession;
