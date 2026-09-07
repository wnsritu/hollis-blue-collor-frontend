import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const serviceApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.service.list, params),

  /** Prefer GET; some legacy callers used POST */
  listPost: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.service.list, payload),

  getCategories: () => http.get<ApiSuccess>(ENDPOINTS.service.categories),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.service.byId(id)),

  create: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.service.add, payload),

  update: (id: number | string, payload: Record<string, unknown> | FormData) =>
    http.put<ApiSuccess>(ENDPOINTS.service.byId(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.service.byId(id)),
};

export const itemApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.item.list, params),

  listPost: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.item.list, payload),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.item.byId(id)),

  create: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.item.add, payload),

  update: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.item.byId(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.item.byId(id)),
};

export default serviceApi;
