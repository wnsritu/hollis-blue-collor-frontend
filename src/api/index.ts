/**
 * Public API surface for the frontend app.
 *
 * Preferred imports:
 *   import { api, projectApi, http, ApiError } from "@/api";
 *   import { ENDPOINTS, ROLES } from "@/constants";
 */
export { apiClient, createApiClient, http, ApiError, getErrorMessage, queryKeys, setApiAuthHandlers } from "@/lib/api";
export { api } from "./modules";
export * from "./modules";

/** @deprecated Prefer `apiClient` from `@/api` or `@/lib/api` */
export { default as axiosInstance } from "@/lib/api/client";
