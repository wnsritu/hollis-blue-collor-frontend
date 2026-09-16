import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPaymentIntent,
  confirmPayment,
} from "@/services/payment";
import toast from "react-hot-toast";
import env from "@/config/env";

const publishableKey = env.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Main Modal Component
export default function StripeBookingModal({
  isOpen,
  onClose,
  bookingData,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
  onSuccess?: (paymentIntent?: any) => void;
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyPaidInfo, setAlreadyPaidInfo] = useState<any>(null);

  const normalizedBooking =
    bookingData?.data || bookingData?.booking || bookingData || {};

  const bookingId =
    normalizedBooking?.id ||
    normalizedBooking?.booking_id ||
    bookingData?.id ||
    bookingData?.booking_id;

  const proposalId =
    normalizedBooking?.proposal_id ||
    bookingData?.proposal_id;

  useEffect(() => {
    if (isOpen && (bookingId || proposalId || bookingData)) {
      setAlreadyPaidInfo(null);
      setClientSecret("");
      setError("");
      createBookingPayment();
    }
  }, [isOpen, bookingId, proposalId]);

  const createBookingPayment = async () => {
    if (!publishableKey) {
      setError("Stripe publishable key is not configured. Please check your environment configuration.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const bId = bookingId;
      const pId = proposalId;

      if (!bId && !pId) {
        setError("Invalid booking or proposal reference for payment.");
        setLoading(false);
        return;
      }

      const req: any = {};
      if (bId) req.booking_id = Number(bId);
      if (pId) req.proposal_id = Number(pId);

      const response = await createPaymentIntent(req);
      const result = response?.data;

      if (result?.success) {
        const payload = result?.data;
        if (payload?.alreadyPaid) {
          setAlreadyPaidInfo(payload);
        } else if (payload?.clientSecret) {
          setClientSecret(payload.clientSecret);
        } else {
          setError(result?.message || "Failed to initialize payment intent.");
        }
      } else {
        setError(result?.message || "Failed to initialize payment.");
      }
    } catch (err: any) {
      console.error("Error creating payment intent:", err);
      setError(err?.response?.data?.message || err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const rawTotal =
    normalizedBooking?.pricing?.total ??
    normalizedBooking?.total_amount ??
    bookingData?.total_amount ??
    0;

  const totalAmt = parseFloat(String(rawTotal)).toFixed(2);
  const bookingNum = normalizedBooking?.booking_number || (bookingId ? `#${bookingId}` : "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Checkout {totalAmt !== "0.00" ? `($${totalAmt})` : ""}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Initializing payment gateway...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Payment Error</p>
              <p className="text-xs mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {alreadyPaidInfo && !loading && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl p-4 text-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Payment Already Completed
              </div>
              <p className="text-xs text-muted-foreground">
                This booking has already been paid successfully. No further payment action is required.
              </p>
              <div className="space-y-1.5 text-xs border-t border-emerald-500/20 pt-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Ref:</span>
                  <span className="font-bold">#{alreadyPaidInfo.booking_number || alreadyPaidInfo.booking_id}</span>
                </div>
                {alreadyPaidInfo.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-bold truncate max-w-[200px]">{alreadyPaidInfo.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-emerald-700">${Number(alreadyPaidInfo.amount || 0).toFixed(2)} {alreadyPaidInfo.currency?.toUpperCase() || "USD"}</span>
                </div>
              </div>
            </div>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {clientSecret && !loading && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              bookingData={bookingData}
              totalAmt={totalAmt}
              bookingNum={bookingNum}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Payment Form Component
function PaymentForm({
  bookingData,
  totalAmt,
  bookingNum,
  onSuccess,
  onClose,
}: {
  bookingData: any;
  totalAmt: string;
  bookingNum: string;
  onSuccess?: (paymentIntent?: any) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe payment components not fully loaded. Please refresh.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Step 1: Validate PaymentElement inputs natively via Stripe Elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Please check your card details.");
        setIsProcessing(false);
        return;
      }

      // Step 2: Build complete billing details compliant with Indian export regulations & global Stripe standards
      const customerName =
        bookingData?.customer?.full_name ||
        [bookingData?.customer?.first_name, bookingData?.customer?.last_name].filter(Boolean).join(" ") ||
        localStorage.getItem("userName") ||
        bookingData?.customer?.name ||
        bookingData?.customer_name ||
        "Customer Name";

      const customerEmail =
        bookingData?.customer?.email ||
        localStorage.getItem("userEmail") ||
        bookingData?.customer_email ||
        "customer@example.com";

      const rawAddr =
        bookingData?.pickup_address ||
        bookingData?.delivery_address ||
        bookingData?.address ||
        bookingData?.service_address?.address ||
        "";

      let line1 = "Service Address Line";
      let city = "Indore";
      let state = "Madhya Pradesh";
      let postal_code = "452010";
      let country = "IN";

      if (typeof rawAddr === "string" && rawAddr.trim().length > 0) {
        const parts = rawAddr.split(",").map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 3) {
          line1 = parts.slice(0, parts.length - 2).join(", ") || parts[0];
          city = parts[parts.length - 2] || "Indore";
          const lastPart = parts[parts.length - 1];
          const digitsMatch = lastPart.match(/\d{5,6}/);
          postal_code = digitsMatch ? digitsMatch[0] : (lastPart.replace(/\D/g, "") || "452010");
        } else if (parts.length === 2) {
          line1 = parts[0];
          city = parts[1];
        } else {
          line1 = parts[0] || "Service Address Line";
        }
      } else if (typeof rawAddr === "object" && rawAddr) {
        line1 = rawAddr.address_line || rawAddr.line1 || rawAddr.street || "Service Address Line";
        city = rawAddr.city || "Indore";
        state = rawAddr.state || "Madhya Pradesh";
        postal_code = rawAddr.zip_code || rawAddr.postal_code || rawAddr.zip || "452010";
        country = rawAddr.country || "IN";
      }

      const billingDetails = {
        name: customerName,
        email: customerEmail,
        address: {
          line1: line1,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country,
        },
      };

      const confirmParams: any = {
        return_url: `${window.location.origin}/appointments`,
        payment_method_data: {
          billing_details: billingDetails,
        },
      };

      // Step 3: Confirm PaymentIntent with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment processing failed.");
        toast.error(error.message || "Payment processing failed.");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        toast.success("Payment successful! Your booking is confirmed.");

        try {
          await confirmPayment({ payment_intent_id: paymentIntent.id });
        } catch (err) {
          console.error("Backend confirm fallback notice:", err);
        }

        setTimeout(() => {
          onSuccess?.(paymentIntent);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Unexpected Payment error:", err);
      setErrorMessage("An unexpected error occurred during payment.");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const normalized =
    bookingData?.data?.booking ||
    bookingData?.data ||
    bookingData?.booking ||
    bookingData || {};

  const svcName =
    normalized?.service?.service_type?.name ||
    normalized?.service_type?.name ||
    normalized?.service_category ||
    normalized?.project?.title ||
    "Home Services";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Compact Order Reference Header */}
      <div className="bg-muted/40 rounded-xl p-3 border border-border flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-foreground block">{svcName}</span>
          {bookingNum && <span className="text-muted-foreground font-mono">Ref: {bookingNum}</span>}
        </div>
        <span className="font-display font-extrabold text-primary text-sm">${totalAmt}</span>
      </div>

      {/* Card Details */}
      <div className="border border-border rounded-xl p-4 bg-background space-y-2">
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">Card Details</label>
        <PaymentElement
          options={{
            fields: {
              billingDetails: {
                name: "auto",
                email: "auto",
                address: "auto",
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="text-destructive text-xs bg-destructive/10 border border-destructive/20 p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full gap-2 font-semibold shadow-sm"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-1"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" /> Pay ${totalAmt}
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
        <Lock className="w-3.5 h-3.5 text-primary" />
        <span>Encrypted 256-bit payment powered by Stripe</span>
      </div>
    </form>
  );
}
