import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const getAdminDashboardApi = () => {
  return apiClient.get("/admin/dashboard");
};

export const getAdminDashboard = async () => {
  const res = await getAdminDashboardApi();
  return res.data;
};

export const getAllPlans = () => {
  return apiClient.get("/admin/plans/all");
};

export const getAllProviderPlans = (data: any) => {
  return apiClient.post("/subscriptions/all-provider-plan", data);
};

export const updatePlans = (data: any) => {
  return apiClient.put("/admin/plans/update", data);
};

export const approvePlanByAdmin = () => {
  return apiClient.get("/approve-plan/:id");
};

export const getAllProvider = (data: any) => {
  return apiClient.post("/provider/get-all-provider", data);
};

export const getAllCoinHistory = (data: any) => {
  return apiClient.post("/coins/history", data);
};

export const addUpdateCoins = (data: any) => {
  return apiClient.post("/coins/manage", data);
};

export const updateProfile = async (payload: any) => {
  const res = await apiClient.put("/user/update-profile", payload);
  return res.data;
};

export const uploadProfilePhotoApi = async (file: File) => {
  const formData = new FormData();
  formData.append("profile_photo", file);
  const res = await apiClient.put("/user/profile/photo", formData);
  return res.data;
};

export const uploadProfilePhotoService = async (file: File) => {
  try {
    const res = await uploadProfilePhotoApi(file);
    return res;
  } catch (error: any) {
    console.log("SERVICE ERROR:", error?.response || error);
    throw error;
  }
};

export const getPlatformSettings = async () => {
  const res = await apiClient.get("/admin/platform-settings");
  return res.data;
};

export const updatePlatformSettings = async (payload: any) => {
  const res = await apiClient.put("/admin/platform-settings", payload);
  return res.data;
};

export const adminApi = {
  getDashboard: () => http.get<ApiSuccess>(ENDPOINTS.admin.dashboard),

  listProviders: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.providers, params),

  getProvider: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.providerDetails(id)),

  approveProvider: (id: number | string, payload?: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.approveProvider(id), payload),

  rejectProvider: (id: number | string, payload: { reason: string }) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.rejectProvider(id), payload),

  suspendProvider: (id: number | string, payload?: { reason?: string }) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.suspendProvider(id), payload),

  unsuspendProvider: (id: number | string) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.unsuspendProvider(id)),

  listCustomers: (params?: ApiListParams & { search?: string; status?: string }) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.customers, params),

  getCustomer: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.customerDetails(id)),

  updateCustomerStatus: (id: number | string, payload: { status: "active" | "inactive" | "blocked" }) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.updateCustomerStatus(id), payload),

  activateCustomer: (id: number | string) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.activateCustomer(id)),

  deactivateCustomer: (id: number | string) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.deactivateCustomer(id)),

  getPlans: () => http.get<ApiSuccess>(ENDPOINTS.admin.plansAll),

  updatePlans: (payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.plansUpdate, payload),

  getPlatformSettings: () =>
    http.get<ApiSuccess>(ENDPOINTS.admin.platformSettings),

  updatePlatformSettings: (payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.admin.platformSettings, payload),
};

export const availabilityApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.providerAvailability.root, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.providerAvailability.byId(id)),

  getByProviderId: (providerId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.providerAvailability.byProviderId(providerId)),

  create: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.providerAvailability.root, payload),

  update: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.providerAvailability.byId(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.providerAvailability.byId(id)),
};

export const timeSlotApi = {
  list: () => http.get<ApiSuccess>(ENDPOINTS.timeSlot.list),
  create: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.timeSlot.add, payload),
  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.timeSlot.byId(id)),
};

export const coinApi = {
  getBalance: () => http.get<ApiSuccess>(ENDPOINTS.coin.balance),
  getTransactions: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.coin.transactions, params),
  add: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.coin.add, payload),
  deduct: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.coin.deduct, payload),
};

export const sponsoredApi = {
  list: () => http.get<ApiSuccess>(ENDPOINTS.sponsored.list),
  create: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.sponsored.create, payload),
  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.sponsored.byId(id)),
};

export default adminApi;
