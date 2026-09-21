import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type { SubscriptionPlan } from "@/types/api/misc";

// 💳 Create payment intent
export const createPaymentIntent = (data: any) => {
  return apiClient.post("/payments/create-payment-intent", data);
};

// 💳 Confirm Payment
export const confirmPayment = (data: any) => {
  return apiClient.post("/payments/confirm-payment", data);
};

// 💳 Create Stripe Checkout Session
export const createCheckoutSessionApi = (data: {
  booking_id: number;
  amount: number;
}) => {
  return apiClient.post("/payment/create-checkout-session", data);
};

// 💳 Create subscription payment intent
export const createPaymentSubscription = (data: any) => {
  return apiClient.post("/subscriptions/create-intent", data);
};

// 💳 Confirm subscription payment
export const confirmPaymentSubscription = (data: any) => {
  return apiClient.post("/subscriptions/confirm", data);
};

export const subscriptionApi = {
  getPlans: () =>
    http.get<ApiSuccess<SubscriptionPlan[]>>(ENDPOINTS.subscription.plans),

  createCheckout: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.createCheckout, payload),

  createIntent: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.createIntent, payload),

  confirm: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.confirm, payload),

  getActivePublicPlans: () =>
    http.get<ApiSuccess<SubscriptionPlan[]>>(ENDPOINTS.subscription.activePublicPlans),

  getProviderSubscription: () =>
    http.get<ApiSuccess>(ENDPOINTS.subscription.providerCurrentSubscription),

  getCurrent: () => http.get<ApiSuccess>(ENDPOINTS.subscription.current),

  cancel: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.cancel, payload),

  getHistory: () => http.get<ApiSuccess>(ENDPOINTS.subscription.history),

  getStatus: () => http.get<ApiSuccess>(ENDPOINTS.subscription.status),

  listAllProviders: () =>
    http.get<ApiSuccess>(ENDPOINTS.subscription.allProviders),
};

export interface CommissionSettingsData {
  id?: number;
  admin_commission: number;
  platform_fee: number;
  tax_percentage?: number;
  currency: string;
}

// 💳 Admin & User Payments API
export const listPaymentsApi = (params?: Record<string, any>) => {
  return apiClient.get("/payments", { params });
};

// 💳 Payout Queue APIs
export const listEligiblePayoutsApi = (params?: Record<string, any>) => {
  return apiClient.get("/admin/payouts", { params });
};

export const listPayoutHistoryApi = (params?: Record<string, any>) => {
  return apiClient.get("/admin/payouts/history", { params });
};

export const processPayoutApi = (payoutId: number | string, data?: any) => {
  return apiClient.post(`/admin/payouts/${payoutId}/process`, data);
};

export const listOnHoldPayoutsApi = (params?: Record<string, any>) => {
  return apiClient.get("/admin/payouts/on-hold", { params });
};

export const markPayoutEligibleApi = (payoutId: number | string) => {
  return apiClient.post(`/admin/payouts/${payoutId}/eligible`);
};

export const markPayoutFailedApi = (payoutId: number | string, data?: any) => {
  return apiClient.post(`/admin/payouts/${payoutId}/fail`, data);
};

export const retryPayoutApi = (payoutId: number | string, data?: any) => {
  return apiClient.post(`/admin/payouts/${payoutId}/retry`, data);
};

export const payoutApi = {
  getCommissionRates: () =>
    http.get<ApiSuccess<CommissionSettingsData>>(ENDPOINTS.payout.commissionRates),
  listEligible: listEligiblePayoutsApi,
  listOnHold: listOnHoldPayoutsApi,
  listHistory: listPayoutHistoryApi,
  process: processPayoutApi,
  markEligible: markPayoutEligibleApi,
  markFailed: markPayoutFailedApi,
  retry: retryPayoutApi,
};

export default {
  createPaymentIntent,
  confirmPayment,
  createCheckoutSessionApi,
  createPaymentSubscription,
  confirmPaymentSubscription,
  listPaymentsApi,
  listEligiblePayoutsApi,
  listOnHoldPayoutsApi,
  listPayoutHistoryApi,
  processPayoutApi,
  markPayoutEligibleApi,
  markPayoutFailedApi,
  retryPayoutApi,
  subscriptionApi,
  payoutApi,
};
