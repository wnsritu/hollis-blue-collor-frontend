/**
 * Public API surface for the frontend app.
 *
 * Preferred imports:
 *   import { api, projectApi, catalogApi, http, ApiError, queryKeys } from "@/api";
 *   import { ENDPOINTS, ROLES } from "@/constants";
 *   import type { Project, Appointment } from "@/types/api";
 *
 * See `src/api/README.md` for module map and examples.
 */
export {
  apiClient,
  createApiClient,
  http,
  ApiError,
  getErrorMessage,
  queryKeys,
  setApiAuthHandlers,
} from "@/lib/api";
export { api } from "./modules";
export * from "./modules";

/** @deprecated Prefer `apiClient` from `@/api` or `@/lib/api` */
export { default as axiosInstance } from "@/lib/api/client";
