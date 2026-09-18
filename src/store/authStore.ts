import type { AuthUser } from "@/types/api/auth";
import { tokenStorage } from "@/utils/tokenStorage";
import { roleNameFromId, type RoleId } from "@/constants/roles";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
};

type Listener = (state: AuthState) => void;

const listeners = new Set<Listener>();

let state: AuthState = {
  user: null,
  accessToken: tokenStorage.getAccessToken(),
  refreshToken: tokenStorage.getRefreshToken(),
  isAuthenticated: Boolean(tokenStorage.getAccessToken()),
  isHydrated: false,
};

const emit = () => {
  listeners.forEach((l) => l(state));
};

const setState = (partial: Partial<AuthState>) => {
  state = { ...state, ...partial };
  emit();
};

export const authStore = {
  getState: () => state,

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  hydrateFromStorage: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const id = tokenStorage.getUserId();
    const roleId = tokenStorage.getRoleId();
    const role = tokenStorage.getRoleName();

    const user: AuthUser | null =
      id != null
        ? {
            id,
            role_id: (roleId ?? 0) as RoleId,
            role: role ?? roleNameFromId(roleId) ?? undefined,
          }
        : null;

    setState({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrated: true,
    });
  },

  setSession: (params: {
    user?: AuthUser | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  }) => {
    const accessToken = params.accessToken ?? state.accessToken;
    const refreshToken = params.refreshToken ?? state.refreshToken;
    const user = params.user !== undefined ? params.user : state.user;

    if (accessToken) tokenStorage.setTokens(accessToken, refreshToken);
    if (user) tokenStorage.setSessionMeta(user);

    setState({
      user,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      isAuthenticated: Boolean(accessToken),
      isHydrated: true,
    });
  },

  setUser: (user: AuthUser | null) => {
    if (user) tokenStorage.setSessionMeta(user);
    setState({ user, isAuthenticated: Boolean(state.accessToken || user) });
  },

  updateUser: (partial: Partial<AuthUser>) => {
    if (!state.user) return;
    const updated = { ...state.user, ...partial };
    tokenStorage.setSessionMeta(updated);
    setState({ user: updated });
  },

  clearSession: () => {
    tokenStorage.clearSession();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
};

export default authStore;
