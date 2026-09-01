import api from "./axios";

// 💳 Create payment intent
export const createPaymentIntent = (data: any) => {
  return api.post("/payments/create-payment-intent", data);
};

// 💳 Confirm Payment
export const confirmPayment = (data: any) => {
  return api.post("/payments/confirm-payment", data);
};

// 💳 Create Stripe Checkout Session
export const createCheckoutSessionApi = (data: {
  booking_id: number;
  amount: number;
}) => {
  return api.post("/payment/create-checkout-session", data);
};

// -------------------
// Subscription Payment APi
// -------------------
// 💳 Create payment intent
export const createPaymentSubscription = (data: any) => {
  return api.post("/subscriptions/create-payment", data);
};

// 💳 Confirm Payment
export const confirmPaymentSubscription = (data: any) => {
  return api.post("/subscriptions/confirm-payment", data);
};
