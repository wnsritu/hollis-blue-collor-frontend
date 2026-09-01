import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const bookingApi = {
  add: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.add, payload),

  list: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.list, payload),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.booking.details(id)),

  update: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.booking.edit(id), payload),

  updateStatus: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.booking.updateStatus(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.booking.delete(id)),

  updatePrice: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.updatePrice, payload),

  dashboard: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.dashboard, payload),
};

export const orderApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.order.list, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.order.details(id)),
};

export default bookingApi;
