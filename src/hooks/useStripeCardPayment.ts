/**
 * useStripeCardPayment
 *
 * Reusable hook encapsulating all Stripe payment logic:
 *   - Stripe.js loading (singleton stripePromise)
 *   - PaymentIntent creation from backend
 *   - Payment confirmation via Stripe Elements
 *
 * Can be reused on both Customer Panel (BookService) and
 * Provider Panel (future) without duplicating any Stripe logic.
 */

import { useState, useRef } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import env from "@/config/env";
import {
  createPaymentIntent,
  confirmPayment as confirmPaymentApi,
} from "@/services/payment";

// ─── Singleton Stripe Promise ─────────────────────────────────────────────────
// Loaded once for the entire app lifetime; safe to share across panel uses.
const publishableKey =
  env.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";

export const stripePromise: Promise<Stripe | null> = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseStripeCardPaymentOptions {
  /** Called after successful payment confirmation */
  onSuccess?: (paymentIntentId: string) => void;
  /** Called after a payment failure */
  onError?: (message: string) => void;
  /** Where Stripe redirects for 3DS flows; defaults to /appointments */
  returnUrl?: string;
}

export interface UseStripeCardPaymentReturn {
  /** Client secret returned by backend's createPaymentIntent */
  clientSecret: string;
  /** Whether PaymentIntent is being fetched from backend */
  fetchingIntent: boolean;
  /** Whether confirmPayment is in flight */
  confirming: boolean;
  /** Last error message (empty string = no error) */
  paymentError: string;
  /** Whether booking was already paid (idempotency guard) */
  alreadyPaid: boolean;
  /** Info about the already-paid payment (only set when alreadyPaid = true) */
  alreadyPaidInfo: AlreadyPaidInfo | null;
  /**
   * Fetch a PaymentIntent from the backend.
   * Pass booking_id for item-based bookings OR proposal_id for marketplace proposals.
   */
  initPayment: (params: { booking_id?: number; proposal_id?: number }) => Promise<void>;
  /**
   * Confirm the payment using Stripe Elements.
   * Call this from your custom Pay button's onClick/onSubmit.
   */
  confirmStripePayment: (
    stripe: Stripe,
    elements: StripeElements,
    billingDetails?: BillingDetails
  ) => Promise<void>;
  /** Clear all state (e.g. when modal closes) */
  resetPayment: () => void;
}

export interface AlreadyPaidInfo {
  booking_id?: number;
  booking_number?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
}

export interface BillingDetails {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStripeCardPayment(
  options: UseStripeCardPaymentOptions = {}
): UseStripeCardPaymentReturn {
  const { onSuccess, onError, returnUrl = "/appointments" } = options;

  const [clientSecret, setClientSecret] = useState("");
  const [fetchingIntent, setFetchingIntent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [alreadyPaidInfo, setAlreadyPaidInfo] = useState<AlreadyPaidInfo | null>(null);

  // Guard against calling initPayment multiple times concurrently
  const fetchingRef = useRef(false);

  // ── initPayment ─────────────────────────────────────────────────────────────
  const initPayment = async (params: {
    booking_id?: number;
    proposal_id?: number;
  }) => {
    if (fetchingRef.current) return;
    if (!params.booking_id && !params.proposal_id) {
      setPaymentError("Invalid booking or proposal reference for payment.");
      return;
    }

    if (!publishableKey) {
      setPaymentError(
        "Stripe publishable key is not configured. Please check your environment."
      );
      return;
    }

    fetchingRef.current = true;
    setFetchingIntent(true);
    setPaymentError("");
    setAlreadyPaid(false);
    setAlreadyPaidInfo(null);
    setClientSecret("");

    try {
      const payload: Record<string, number> = {};
      if (params.booking_id) payload.booking_id = params.booking_id;
      if (params.proposal_id) payload.proposal_id = params.proposal_id;

      const response = await createPaymentIntent(payload);
      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Failed to initialize payment.");
      }

      const data = result?.data;

      if (data?.alreadyPaid) {
        setAlreadyPaid(true);
        setAlreadyPaidInfo(data);
      } else if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(result?.message || "Failed to initialize payment intent.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please try again.";
      setPaymentError(msg);
      onError?.(msg);
    } finally {
      setFetchingIntent(false);
      fetchingRef.current = false;
    }
  };

  // ── confirmStripePayment ─────────────────────────────────────────────────────
  const confirmStripePayment = async (
    stripe: Stripe,
    elements: StripeElements,
    billingDetails?: BillingDetails
  ) => {
    setConfirming(true);
    setPaymentError("");

    try {
      // Step 1: Validate Elements (triggers inline field errors)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPaymentError(submitError.message || "Please check your card details.");
        setConfirming(false);
        return;
      }

      // Step 2: Build confirmParams
      const confirmParams: any = {
        return_url: `${window.location.origin}${returnUrl}`,
      };
      if (billingDetails) {
        confirmParams.payment_method_data = { billing_details: billingDetails };
      }

      // Step 3: Confirm with Stripe — no redirect for standard card payments
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: "if_required",
      });

      if (error) {
        const msg = error.message || "Payment processing failed.";
        setPaymentError(msg);
        toast.error(msg);
        onError?.(msg);
        return;
      }

      if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing")
      ) {
        // Notify backend (best-effort; Stripe webhook is the source of truth)
        try {
          await confirmPaymentApi({ payment_intent_id: paymentIntent.id });
        } catch (backendErr) {
          console.warn("Backend confirm notice (non-fatal):", backendErr);
        }

        toast.success("Payment successful! Your booking is confirmed.");
        onSuccess?.(paymentIntent.id);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred during payment.";
      setPaymentError(msg);
      toast.error("Payment failed. Please try again.");
      onError?.(msg);
    } finally {
      setConfirming(false);
    }
  };

  // ── resetPayment ─────────────────────────────────────────────────────────────
  const resetPayment = () => {
    setClientSecret("");
    setFetchingIntent(false);
    setConfirming(false);
    setPaymentError("");
    setAlreadyPaid(false);
    setAlreadyPaidInfo(null);
    fetchingRef.current = false;
  };

  return {
    clientSecret,
    fetchingIntent,
    confirming,
    paymentError,
    alreadyPaid,
    alreadyPaidInfo,
    initPayment,
    confirmStripePayment,
    resetPayment,
  };
}

export default useStripeCardPayment;
