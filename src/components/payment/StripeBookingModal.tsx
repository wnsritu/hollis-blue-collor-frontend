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

export interface StripePaymentModalData {
  modalTitle?: string;
  businessName?: string;
  subtotal: number;
  grandTotal: number;
  serviceFee?: number;
  serviceFeeRate?: number;
  taxAmount?: number;
  buttonText?: string;
  platformName?: string;
  paymentMethodTitle?: string;
  paymentMethodSubtitle?: string;
  summaryTitle?: string;
  summarySubtitle?: string;
  summaryItems?: Array<{ label: string; value: string | React.ReactNode; isMuted?: boolean }>;
  details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  createIntent?: () => Promise<{ clientSecret: string; paymentIntentId?: string }>;
  onConfirmPayment?: (paymentIntentId: string) => Promise<any>;
  secureFooterNote?: string;
}

export interface StripeBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData?: any;
  paymentData?: StripePaymentModalData;
  onSuccess?: (paymentIntent?: any) => void;
}

export default function StripeBookingModal({
  isOpen,
  onClose,
  bookingData,
  paymentData,
  onSuccess,
}: StripeBookingModalProps) {
  const norm = bookingData ? normalizeBooking(bookingData) : null;
  const rawBooking =
    bookingData?.data || bookingData?.booking || bookingData || {};

  const bookingId = paymentData
    ? undefined
    : Number(norm?.id || rawBooking?.id || rawBooking?.booking_id || 0);

  const businessName =
    paymentData?.businessName ||
    norm?.providerName ||
    rawBooking?.provider?.business_name ||
    rawBooking?.provider?.name ||
    "Service Provider";

  const subtotal = Number(
    paymentData?.subtotal ?? (norm?.subtotal || rawBooking?.subtotal || 0)
  );
  const serviceFee = Number(
    paymentData?.serviceFee ?? (norm?.serviceFee || rawBooking?.service_fee || 0)
  );
  const taxAmount = Number(
    paymentData?.taxAmount ?? (rawBooking?.tax_amount || 0)
  );
  const grandTotal = Number(
    paymentData?.grandTotal ??
      (norm?.totalAmount ||
        rawBooking?.total_amount ||
        subtotal + serviceFee + taxAmount)
  );

  // Address & customer info for billing
  const customerName =
    paymentData?.details?.name ||
    norm?.customerName ||
    rawBooking?.customer?.name ||
    localStorage.getItem("userName") ||
    "";
  const address =
    paymentData?.details?.address ||
    norm?.address ||
    rawBooking?.service_address?.address ||
    rawBooking?.pickup_address ||
    rawBooking?.address ||
    "";
  let zip =
    paymentData?.details?.zip ||
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
    paymentData?.serviceFeeRate ??
    (subtotal > 0 ? Math.round((serviceFee / subtotal) * 100) : 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        <DialogHeader className={paymentData?.modalTitle ? "pb-2" : "sr-only"}>
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            {paymentData?.modalTitle || "Payment Checkout"}
          </DialogTitle>
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
              buttonText={paymentData?.buttonText || "Pay & Confirm Booking"}
              platformName={paymentData?.platformName || "Service Connect"}
              paymentMethodTitle={paymentData?.paymentMethodTitle}
              paymentMethodSubtitle={paymentData?.paymentMethodSubtitle}
              summaryTitle={paymentData?.summaryTitle}
              summarySubtitle={paymentData?.summarySubtitle}
              summaryItems={paymentData?.summaryItems}
              createIntent={paymentData?.createIntent}
              onConfirmPayment={paymentData?.onConfirmPayment}
              secureFooterNote={paymentData?.secureFooterNote}
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
