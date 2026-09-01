import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, X } from "lucide-react";
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
} from "@/api/stripe.api";
import toast from "react-hot-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// Main Modal Component
export default function StripeBookingModal({
  isOpen,
  onClose,
  bookingData,
  onSuccess,
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && bookingData) {
      createBookingPayment();
    }
  }, [isOpen, bookingData]);

  const createBookingPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const req = {
        booking_id: bookingData?.id,
      };

      const response = await createPaymentIntent(req);
      const result = response?.data;

      if (result?.success) {
        setClientSecret(result?.data?.clientSecret);
      } else {
        setError(result?.message || "Failed to initialize payment");
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Complete Booking Payment
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Initializing payment...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4">
            ❌ {error}
          </div>
        )}

        {clientSecret && !loading && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              bookingData={bookingData}
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
function PaymentForm({ bookingData, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Step 2: Confirm payment with Stripe (Webhook will handle database update)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: localStorage.getItem("userName") || "Customer",
              email:
                localStorage.getItem("userEmail") || "customer@example.com",
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // debugger
        // ✅ NO confirm API call needed! Webhook will auto-update database

        // ✅ Show success message
        toast.success("Payment successful! Your booking is confirmed.");

        // ✅ Call backend to confirm (ensures database is updated immediately)
        try {
          await confirmPayment({ payment_intent_id: paymentIntent.id });
        } catch (err) {
          console.error("Backend confirm error:", err);
          // Webhook will handle it as fallback, so don't show error to user
        }

        // ✅ Close modal
        setTimeout(() => {
          onSuccess?.(paymentIntent);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage("An unexpected error occurred");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-1">
        <h4 className="font-semibold text-sm mb-2">Order Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Booking ID</span>
            <span className="font-mono">#{bookingData?.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Service Type</span>
            <span>{bookingData?.service_type?.name || "Laundry Service"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Booking Date</span>
            <span>
              {new Date(bookingData?.booking_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t">
            <span>Total Amount</span>
            <span className="text-primary">
              ${parseFloat(bookingData?.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="border rounded-lg p-4 max-h-[320px] overflow-y-scroll">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          ❌ {errorMessage}
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          `Pay $${parseFloat(bookingData?.total_amount || 0).toFixed(2)}`
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Secure payment powered by Stripe
      </div>
    </form>
  );
}
