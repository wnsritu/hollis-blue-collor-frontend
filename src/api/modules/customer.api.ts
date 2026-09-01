import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type { CustomerProfile, UpdateCustomerPayload } from "@/types/api/misc";

export const customerApi = {
  getMyProfile: () =>
    http.get<ApiSuccess<CustomerProfile>>(ENDPOINTS.customer.profile),

  updateMyProfile: (payload: UpdateCustomerPayload) =>
    http.put<ApiSuccess<CustomerProfile>>(ENDPOINTS.customer.profile, payload),

  getById: (id: number | string) =>
    http.get<ApiSuccess<CustomerProfile>>(ENDPOINTS.customer.byId(id)),

  updateById: (id: number | string, payload: UpdateCustomerPayload) =>
    http.put<ApiSuccess<CustomerProfile>>(ENDPOINTS.customer.byId(id), payload),

  deactivate: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.customer.deactivate(id)),

  getProjects: (id: number | string, params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.customer.projects(id), params),

  getReviews: (id: number | string, params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.customer.reviews(id), params),
};

export default customerApi;
