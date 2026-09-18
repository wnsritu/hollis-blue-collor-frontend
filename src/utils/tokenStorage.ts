import { STORAGE_KEYS } from "@/constants/storageKeys";
import type { AuthUser } from "@/types/api/auth";
import { roleNameFromId } from "@/constants/roles";

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const tokenStorage = {
  getAccessToken: () => safeGet(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => safeGet(STORAGE_KEYS.REFRESH_TOKEN),

  setTokens: (accessToken?: string | null, refreshToken?: string | null) => {
    if (accessToken) safeSet(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) safeSet(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearTokens: () => {
    safeRemove(STORAGE_KEYS.ACCESS_TOKEN);
    safeRemove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUserId: () => {
    const raw = safeGet(STORAGE_KEYS.USER_ID);
    return raw ? Number(raw) : null;
  },

  getRoleId: () => {
    const raw = safeGet(STORAGE_KEYS.USER_ROLE_ID);
    return raw ? Number(raw) : null;
  },

  getRoleName: () => safeGet(STORAGE_KEYS.USER_ROLE),

  setSessionMeta: (user: Partial<AuthUser> | null | undefined) => {
    if (!user) return;
    if (user.id != null) safeSet(STORAGE_KEYS.USER_ID, String(user.id));
    if (user.role_id != null) {
      safeSet(STORAGE_KEYS.USER_ROLE_ID, String(user.role_id));
      const name =
        (typeof user.role === "string" && user.role) ||
        roleNameFromId(Number(user.role_id));
      if (name) safeSet(STORAGE_KEYS.USER_ROLE, name);
    }
  },

  clearSession: () => {
    tokenStorage.clearTokens();
    safeRemove(STORAGE_KEYS.USER_ID);
    safeRemove(STORAGE_KEYS.USER_ROLE);
    safeRemove(STORAGE_KEYS.USER_ROLE_ID);
  },
};

export default tokenStorage;
