import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  ProviderBankInfo,
  ProviderProfile,
  UpdateBankInfoPayload,
  UpdateProviderPayload,
} from "@/types/api/provider";
import type {
  MarketplaceProvider,
  ProviderSearchParams,
  ProviderSearchResult,
} from "@/types/api/search";
import type { ProjectMatch } from "@/types/api/matching";

/**
 * Provider APIs — legacy `/provider/*` + marketplace `/providers/*`.
 */
export const providerApi = {
  // ── Legacy list/detail ──
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

  // ── Marketplace search / detail ──
  search: (params?: ProviderSearchParams) =>
    http.get<ProviderSearchResult | ApiSuccess<MarketplaceProvider[]>>(
      ENDPOINTS.marketplaceProvider.search,
      params
    ),

  listMarketplace: (params?: ProviderSearchParams) =>
    http.get<ProviderSearchResult | ApiSuccess<MarketplaceProvider[]>>(
      ENDPOINTS.marketplaceProvider.root,
      params
    ),

  getMarketplaceById: (id: number | string) =>
    http.get<ApiSuccess<MarketplaceProvider | ProviderProfile>>(
      ENDPOINTS.marketplaceProvider.byId(id)
    ),

  getMyMarketplaceProfile: () =>
    http.get<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.profile),

  /** Provider matched leads (alias of matchingApi.listMyLeads) */
  listMyLeads: () =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.marketplaceProvider.leads),

  // ── Bank / verification (when wired) ──
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
