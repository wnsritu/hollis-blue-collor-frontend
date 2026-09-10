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
  return apiClient.post("/subscriptions/create-payment", data);
};

// 💳 Confirm subscription payment
export const confirmPaymentSubscription = (data: any) => {
  return apiClient.post("/subscriptions/confirm-payment", data);
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

  getCurrent: () => http.get<ApiSuccess>(ENDPOINTS.subscription.current),

  cancel: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.subscription.cancel, payload),

  getHistory: () => http.get<ApiSuccess>(ENDPOINTS.subscription.history),

  getStatus: () => http.get<ApiSuccess>(ENDPOINTS.subscription.status),

  listAllProviders: () =>
    http.get<ApiSuccess>(ENDPOINTS.subscription.allProviders),
};

export default {
  createPaymentIntent,
  confirmPayment,
  createCheckoutSessionApi,
  createPaymentSubscription,
  confirmPaymentSubscription,
  subscriptionApi,
};
