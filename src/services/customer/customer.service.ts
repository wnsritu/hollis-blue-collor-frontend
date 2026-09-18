import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type { CustomerProfile, UpdateCustomerPayload } from "@/types/api/misc";

export const getMyProfileApi = () => {
  return apiClient.get("/user/my-profile");
};

export const updateMyProfileApi = (data: any) => {
  return apiClient.put("/user/customer/profile", data);
};

export const getMyProfile = async () => {
  const res = await getMyProfileApi();
  return res.data;
};

export const updateMyProfile = async (payload: any) => {
  const res = await updateMyProfileApi(payload);
  return res.data;
};

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

export const userApi = {
  getMyProfile: () => http.get<ApiSuccess>(ENDPOINTS.user.myProfile),

  updateCustomerProfile: (payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.user.updateCustomerProfile, payload),

  updateProviderProfile: (
    providerId: number | string,
    payload: Record<string, unknown> | FormData
  ) => http.put<ApiSuccess>(ENDPOINTS.user.updateProviderProfile(providerId), payload),

  updateAdminProfile: (payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.user.updateAdminProfile, payload),

  updateProfilePhoto: (formData: FormData) =>
    http.put<ApiSuccess>(ENDPOINTS.user.updateProfilePhoto, formData),

  registerAddress: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.user.registerAddress, payload),

  updateAddress: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.user.updateAddress(id), payload),

  getAddressesByUserId: (userId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.user.getAddressByUserId(userId)),
};

export default customerApi;
