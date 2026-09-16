import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomBookingPaymentForm from "./CustomBookingPaymentForm";
import { normalizeBooking } from "@/utils/bookingAdapter";
import env from "@/config/env";
import { AlertCircle } from "lucide-react";

const publishableKey =
  env.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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
  const norm = normalizeBooking(bookingData);
  const rawBooking =
    bookingData?.data || bookingData?.booking || bookingData || {};

  const bookingId = Number(
    norm.id || rawBooking?.id || rawBooking?.booking_id || 0
  );
  const businessName =
    norm.providerName ||
    rawBooking?.provider?.business_name ||
    rawBooking?.provider?.name ||
    "Service Provider";

  const subtotal = Number(norm.subtotal || rawBooking?.subtotal || 0);
  const serviceFee = Number(norm.serviceFee || rawBooking?.service_fee || 0);
  const taxAmount = Number(rawBooking?.tax_amount || 0);
  const grandTotal = Number(
    norm.totalAmount ||
      rawBooking?.total_amount ||
      subtotal + serviceFee + taxAmount
  );

  // Address & customer info for billing
  const customerName =
    norm.customerName ||
    rawBooking?.customer?.name ||
    localStorage.getItem("userName") ||
    "";
  const address =
    norm.address ||
    rawBooking?.service_address?.address ||
    rawBooking?.pickup_address ||
    rawBooking?.address ||
    "";
  let zip =
    rawBooking?.service_address?.zip ||
    rawBooking?.zip ||
    rawBooking?.postal_code ||
    "";

  if (!zip && address) {
    const match = address.match(/\b\d{5,6}\b/);
    if (match) {
      zip = match[0];
    }
  }

  const serviceFeeRate =
    subtotal > 0 ? Math.round((serviceFee / subtotal) * 100) : 10;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Checkout</DialogTitle>
        </DialogHeader>

        {!stripePromise && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Configuration Error</p>
              <p className="text-xs mt-0.5 opacity-90">
                Stripe publishable key is not configured. Please check your
                environment configuration.
              </p>
            </div>
          </div>
        )}

        {stripePromise && (
          <Elements stripe={stripePromise}>
            <CustomBookingPaymentForm
              bookingId={bookingId}
              businessName={businessName}
              subtotal={subtotal}
              serviceFee={serviceFee}
              serviceFeeRate={serviceFeeRate}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              buttonText="Pay & Confirm Booking"
              platformName="Service Connect"
              details={{
                name: customerName,
                address: address,
                zip: zip,
              }}
              onPaySuccess={() => {
                onSuccess?.();
                onClose();
              }}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
