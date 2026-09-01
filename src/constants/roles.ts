/**
 * Role IDs — MUST stay in sync with backend `src/constants/roles.js`
 */
export const ROLES = {
  CUSTOMER: 1,
  PROVIDER: 2,
  ADMIN: 3,
  SUPPORT: 4,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_NAMES = {
  [ROLES.CUSTOMER]: "customer",
  [ROLES.PROVIDER]: "provider",
  [ROLES.ADMIN]: "admin",
  [ROLES.SUPPORT]: "support",
} as const;

export type RoleName = (typeof ROLE_NAMES)[RoleId];

export const isCustomer = (roleId?: number | null) => Number(roleId) === ROLES.CUSTOMER;
export const isProvider = (roleId?: number | null) => Number(roleId) === ROLES.PROVIDER;
export const isAdmin = (roleId?: number | null) => Number(roleId) === ROLES.ADMIN;
export const isSupport = (roleId?: number | null) => Number(roleId) === ROLES.SUPPORT;

export const roleNameFromId = (roleId?: number | null): RoleName | null => {
  if (roleId == null) return null;
  return (ROLE_NAMES as Record<number, RoleName>)[Number(roleId)] ?? null;
};
