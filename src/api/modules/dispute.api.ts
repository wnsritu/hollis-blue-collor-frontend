import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const disputeApi = {
  create: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.create, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.dispute.list, params),

  /** Some backends still expect POST for details */
  getDetails: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.dispute.details(id)),

  updateStatus: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.dispute.updateStatus(id), payload),

  addEvidence: (id: number | string, formData: FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.addEvidence(id), formData),

  resolve: (id: number | string, payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.resolve(id), payload),
};

export default disputeApi;
