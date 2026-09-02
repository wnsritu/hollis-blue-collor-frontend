import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type { SubscriptionPlan } from "@/types/api/misc";

export const subscriptionApi = {
  getPlans: () =>
    http.get<ApiSuccess<SubscriptionPlan[]>>(ENDPOINTS.subscription.plans),

  createCheckout: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.createCheckout, payload),

  createIntent: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.createIntent, payload),

  confirm: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.confirm, payload),

  getCurrent: () => http.get<ApiSuccess>(ENDPOINTS.subscription.current),

  cancel: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.cancel, payload),

  getHistory: () => http.get<ApiSuccess>(ENDPOINTS.subscription.history),

  getStatus: () => http.get<ApiSuccess>(ENDPOINTS.subscription.status),

  listAllProviders: () =>
    http.get<ApiSuccess>(ENDPOINTS.subscription.allProviders),
};

export default subscriptionApi;
