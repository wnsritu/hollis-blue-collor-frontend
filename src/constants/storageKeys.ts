/** Centralized localStorage / sessionStorage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  USER_ID: "id",
  USER_ROLE: "userRole",
  USER_ROLE_ID: "userRoleId",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
