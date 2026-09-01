import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";

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

export default userApi;
