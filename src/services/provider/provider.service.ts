import apiClient from "@/services/axios";
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

// ── Raw API Methods ──

export const searchProvidersApi = (data: any) => {
  return apiClient.post("/provider/search/miles", data);
};

export const updateProviderProfileApi = (data: any) => {
  return apiClient.put("/user/provider/profile", data);
};

export const uploadProviderFileApi = (formData: FormData) => {
  return apiClient.put("/user/profile/photo", formData);
};

export const getServiceTypesApi = (params?: any) => {
  return apiClient.get("/services/service-types", { params });
};

export const saveProviderSetupApi = (data: any) => {
  return apiClient.post("/provider-availability/setup", data);
};

export const verifyProviderApi = (data: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
  reason?: string;
}) => {
  if (data.verified === "rejected") {
    return apiClient.put(ENDPOINTS.admin.rejectProvider(data.id), {
      rejection_reason: data.reason || "Provider verification rejected by admin",
    });
  }
  return apiClient.put(ENDPOINTS.admin.approveProvider(data.id));
};

export const updateSelfStatusApi = (status: "active" | "paused") => {
  return apiClient.patch(ENDPOINTS.provider.updateSelfStatus, { status });
};

export const getTimeSlotsApi = () => {
  return apiClient.get("/time-slots");
};
export const getTimeSlots = async () => {
  const res = await getTimeSlotsApi();
  return res.data?.data || res.data || [];
};

export const getProviderTimeSlotsApi = () => {
  return apiClient.get("/provider-availability");
};

export const getProviderAvailabilityByProviderIdApi = (providerId: number | string) => {
  return apiClient.get(`/provider-availability/provider/${providerId}`);
};

export const pauseProviderApi = (id: number, reason?: string) => {
  return apiClient.patch(`/provider/${id}/pause`, { reason });
};

export const resumeProviderApi = (id: number) => {
  return apiClient.patch(`/provider/${id}/resume`);
};

export const getProviderPriceApi = (data: any) => {
  return apiClient.post("/provider/provider-pricing", data);
};

export const getProviderSlotsApi = (data: any) => {
  return apiClient.post("/provider-availability/get-slots", data);
};

export const addProviderBookApi = (data: any) => {
  return apiClient.post("/booking/add", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const addPhotoInBookingApi = (data: any) => {
  return apiClient.post("/order/update-status", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getProviderServiceAmount = () => {
  return apiClient.get("/provider-availability/services");
};

export const addProviderServiceAmount = (data: any) => {
  return apiClient.put("/provider-availability/services", data);
};

export const getProviderData = (data: any) => {
  const providerId = typeof data === "object" ? (data.id || data.providerId) : data;
  return apiClient.get(`/providers/${providerId}`);
};

export const getAllSlots = () => {
  return apiClient.get("/time-slots");
};

export const selectPlan = (data: any) => {
  return apiClient.post("/provider/select-plan", data);
};

export const getWalletCoins = () => {
  return apiClient.get("/coins/my-wallet");
};

export const getMyPlan = () => {
  return apiClient.get("/subscriptions/my-subscription");
};

// ── High-Level Service Methods ──

export const searchProviders = async (payload: any) => {
  const res = await searchProvidersApi(payload);
  return res.data;
};

export const updateProviderProfile = async (payload: any) => {
  const res = await updateProviderProfileApi(payload);
  return res.data;
};

export const uploadProviderFile = async (formData: FormData) => {
  return uploadProviderFileApi(formData);
};

export const getServiceTypes = async (params?: any) => {
  const res = await getServiceTypesApi(params);
  return res.data?.data || res.data || [];
};

export const addProviderBooking = async (data: any) => {
  const res = await addProviderBookApi(data);
  return res.data;
};

export const saveProviderSetup = async (payload: any) => {
  const res = await saveProviderSetupApi(payload);
  return res.data;
};

export const verifyProvider = async (payload: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
}) => {
  const res = await verifyProviderApi(payload);
  return res.data;
};

export const getProviderAvailability = async () => {
  const res = await getProviderTimeSlotsApi();
  return res.data?.slots || [];
};

export const pauseProvider = async (id: number, reason?: string) => {
  const res = await pauseProviderApi(id, reason);
  return res.data;
};

export const resumeProvider = async (id: number) => {
  const res = await resumeProviderApi(id);
  return res.data;
};

export const getProviderPrice = async (payload: any) => {
  const res = await getProviderPriceApi(payload);
  return res.data;
};

export const getProviderSlots = async (payload: any) => {
  const res = await getProviderSlotsApi(payload);
  return res.data;
};

// ── Modern providerApi Module ──

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

  updateMyMarketplaceProfile: (payload: UpdateProviderPayload | Record<string, unknown>) =>
    http.put<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.profile, payload),

  getBankInfo: (id: number | string) =>
    http.get<ApiSuccess<ProviderBankInfo>>(ENDPOINTS.provider.bankInfo(id)),

  updateBankInfo: (id: number | string, payload: UpdateBankInfoPayload) =>
    http.put<ApiSuccess<ProviderBankInfo>>(ENDPOINTS.provider.bankInfo(id), payload),

  getVerificationStatus: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.provider.verificationStatus(id)),

  updateVerificationDocs: (
    id: number | string,
    payload: {
      license_number?: string | null;
      insurance_policy?: string | null;
      license_document?: string | null;
      insurance_certificate?: string | null;
    }
  ) =>
    http.put<ApiSuccess>(ENDPOINTS.provider.verificationDocs(id), payload),

  listMyLeads: () =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.marketplaceProvider.leads),
};

export const matchingApi = {
  runForProject: (projectId: number | string) =>
    http.post<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.runMatch(projectId)),

  listForProject: (projectId: number | string) =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.matches(projectId)),

  respond: (projectId: number | string, payload: any) =>
    http.post<ApiSuccess<ProjectMatch>>(
      ENDPOINTS.project.matchRespond(projectId),
      payload
    ),

  listMyLeads: () =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.marketplaceProvider.leads),

  getLeads: () =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.marketplaceProvider.leads),
};

// TODO: Replace with real backend API endpoint once provider earnings tracking endpoint is available
export const getProviderEarningsSummary = async () => {
  return {
    totalEarnings: 850.0,
    pendingPayouts: 200.0,
    availableBalance: 695.0,
  };
};

export default providerApi;
