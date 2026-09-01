import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  ProviderBankInfo,
  ProviderProfile,
  UpdateBankInfoPayload,
  UpdateProviderPayload,
} from "@/types/api/provider";

export const providerApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess<ProviderProfile[]>>(ENDPOINTS.provider.list, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess<ProviderProfile>>(ENDPOINTS.provider.details(id)),

  update: (id: number | string, payload: UpdateProviderPayload | FormData) =>
    http.put<ApiSuccess<ProviderProfile>>(ENDPOINTS.provider.update(id), payload),

  getServices: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.provider.services, params),

  addService: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.provider.addService, payload),

  updateService: (id: number | string, payload: Record<string, unknown> | FormData) =>
    http.put<ApiSuccess>(ENDPOINTS.provider.serviceById(id), payload),

  deleteService: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.provider.serviceById(id)),

  /** Preferred when marketplace routes are wired on BE */
  getMarketplaceById: (id: number | string) =>
    http.get<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.byId(id)),

  getMyMarketplaceProfile: () =>
    http.get<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.profile),

  getBankInfo: (providerId: number | string) =>
    http.get<ApiSuccess<ProviderBankInfo>>(ENDPOINTS.provider.bankInfo(providerId)),

  updateBankInfo: (providerId: number | string, payload: UpdateBankInfoPayload) =>
    http.put<ApiSuccess<ProviderBankInfo>>(
      ENDPOINTS.provider.bankInfo(providerId),
      payload
    ),

  getVerificationStatus: (providerId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.provider.verificationStatus(providerId)),
};

export default providerApi;
