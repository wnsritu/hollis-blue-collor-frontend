/** Centralized localStorage / sessionStorage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  USER_ID: "id",
  USER_ROLE: "userRole",
  USER_ROLE_ID: "userRoleId",
  PROVIDER_SIGNUP_DRAFT: "hollis_provider_signup_draft",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
