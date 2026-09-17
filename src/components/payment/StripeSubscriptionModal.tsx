import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usd } from "@/components/shared/cards";
import { createPaymentSubscription, confirmPaymentSubscription } from "@/services/payment";
import { getMyPlan } from "@/services/provider";
import toast from "react-hot-toast";
import env from "@/config/env";

const publishableKey = env.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const CARD_ELEMENT_STYLE = {
  base: {
    fontSize: "14px",
    color: "#0f172a",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "::placeholder": {
      color: "#94a3b8",
    },
  },
  invalid: {
    color: "#ef4444",
  },
};

export interface StripeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  coins?: number;
  onSuccess?: (subscriptionData?: any) => void;
}

export default function StripeSubscriptionModal({
  isOpen,
  onClose,
  plan,
  coins = 0,
  onSuccess,
}: StripeSubscriptionModalProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && plan) {
      initPaymentIntent();
    } else {
      setClientSecret("");
      setError("");
    }
  }, [isOpen, plan]);

  const initPaymentIntent = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        plan_id: plan?.id,
        use_coins: coins > 0 && plan?.discount > 0,
        coins_used: plan?.coins_used || 0,
        discount_amount: plan?.discount || 0,
        final_amount: plan?.price || plan?.original_price,
      };

      const response = await createPaymentSubscription(payload);
      const result = response?.data;

      if (result?.success && result?.data?.clientSecret) {
        setClientSecret(result.data.clientSecret);
      } else {
        setError(result?.message || "Failed to initialize payment session.");
      }
    } catch (err: any) {
      console.error("Error creating subscription payment intent:", err);
      setError(
        err?.response?.data?.message || "Network error. Failed to initialize payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            Confirm plan change
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Initializing secure checkout...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-2 my-4">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <AlertCircle size={16} />
              <span>Payment Initialization Error</span>
            </div>
            <p className="text-xs text-destructive/90">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={initPaymentIntent}
              className="mt-2 text-xs"
            >
              Retry Payment
            </Button>
          </div>
        )}

        {clientSecret && !loading && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscriptionPaymentForm
              clientSecret={clientSecret}
              plan={plan}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionPaymentForm({
  clientSecret,
  plan,
  onSuccess,
  onClose,
}: {
  clientSecret: string;
  plan: any;
  onSuccess?: (data?: any) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [nameOnCard, setNameOnCard] = useState(
    localStorage.getItem("userName") || ""
  );
  const [zip, setZip] = useState("78704");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState("");
  const [useSplitElements, setUseSplitElements] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not fully loaded. Please refresh.");
      return;
    }

    if (!nameOnCard.trim()) {
      setCardError("Name on card is required.");
      return;
    }

    setIsProcessing(true);
    setCardError("");

    try {
      let confirmResult: any;

      const billingDetails = {
        name: nameOnCard.trim() || "Provider Account",
        address: {
          line1: "123 Business Way",
          city: "Austin",
          state: "TX",
          postal_code: zip.trim() || "78704",
          country: "US",
        },
      };

      if (useSplitElements) {
        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) {
          throw new Error("Card input element not ready.");
        }

        confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumber,
            billing_details: billingDetails,
          },
        });
      } else {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setCardError(submitError.message || "Please check card details.");
          setIsProcessing(false);
          return;
        }

        confirmResult = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/provider/subscription`,
            payment_method_data: {
              billing_details: billingDetails,
            },
          },
          redirect: "if_required",
        });
      }

      if (confirmResult.error) {
        setCardError(confirmResult.error.message || "Payment failed.");
        toast.error(confirmResult.error.message || "Payment failed.");
        setIsProcessing(false);
        return;
      }

      const paymentIntent = confirmResult.paymentIntent;

      if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.loading("Payment confirmed! Activating subscription...", {
          id: "sub-activate",
        });

        // Call confirm endpoint on backend
        try {
          await confirmPaymentSubscription({
            payment_intent_id: paymentIntent.id,
          });
        } catch (confirmErr) {
          console.error("Direct confirm API error:", confirmErr);
        }

        // Fetch updated subscription data
        let updatedSub = null;
        try {
          const res = await getMyPlan().catch(() => null);
          updatedSub = res?.data?.subscription || null;
        } catch { }

        toast.dismiss("sub-activate");
        toast.success(`You're on the ${plan.name} plan!`, {
          // description: "Your new benefits are active immediately.",
        });

        setTimeout(() => {
          onSuccess?.(updatedSub);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setCardError(
        err?.message || "An unexpected payment error occurred. Please try again."
      );
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const planPrice = Number(plan?.price || 0);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Left Column: Payment method */}
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Payment method
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your credit card or payment details below to complete your order securely.
            </p>
          </div>

          {useSplitElements ? (
            <div className="space-y-3">
              {/* Card Number */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Card number</Label>
                <div className="rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <CardNumberElement
                    options={{
                      style: CARD_ELEMENT_STYLE,
                      showIcon: true,
                      placeholder: "4242 4242 4242 4242",
                    }}
                  />
                </div>
              </div>

              {/* Expiry, CVC, Billing ZIP */}
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">Expiry</Label>
                  <div className="rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                    <CardExpiryElement options={{ style: CARD_ELEMENT_STYLE }} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">CVC</Label>
                  <div className="rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                    <CardCvcElement options={{ style: CARD_ELEMENT_STYLE }} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">Billing ZIP</Label>
                  <Input
                    placeholder="78704"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="h-[38px] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Name on Card */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Name on card</Label>
                <Input
                  placeholder="Sarah Whitfield"
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  className="h-10 text-xs font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-input p-3">
              <PaymentElement />
            </div>
          )}

          {cardError ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{cardError}</span>
            </div>
          ) : null}

          {/* SSL Badge Footer */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secure 256-bit SSL encrypted transaction.</span>
          </div>
        </div>

        {/* Right Column: Order Summary Box */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col justify-between h-full min-h-[280px]">
          <div>
            <h4 className="font-display font-bold text-base text-foreground">
              {plan.name} plan — monthly
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Billed monthly, cancel anytime.
            </p>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{plan.name} subscription</span>
              <span className="font-semibold text-foreground">{usd(planPrice)}</span>
            </div>

            <Separator className="my-4" />

            <div className="flex items-baseline justify-between">
              <span className="font-bold text-sm text-foreground">Total due</span>
              <span className="font-extrabold text-2xl text-foreground font-display">
                {usd(planPrice)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4">
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full h-11 font-bold text-xs gap-1.5 shadow-md bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Pay {usd(planPrice)} and switch
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
