import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

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

  listCustomers: (params?: ApiListParams & { status?: string; search?: string }) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.customers, params),

  getCustomer: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.admin.customerDetails(id)),

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
