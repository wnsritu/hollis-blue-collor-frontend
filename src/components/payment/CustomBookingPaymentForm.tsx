import React, { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidZip } from "@/validations/common";
import { createPaymentIntent, confirmPayment } from "@/services/payment";
import toast from "react-hot-toast";

// ─── Stripe card element shared appearance ───────────────────────────────────
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

export interface CustomBookingPaymentFormProps {
  details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    notes?: string;
  };
  grandTotal: number;
  formattedPrices?: {
    subtotal?: string;
    service_fee?: string;
    tax_amount?: string;
    total?: string;
  };
  subtotal: number;
  serviceFee?: number;
  serviceFeeRate?: number;
  taxAmount?: number;
  businessName?: string;
  submitting?: boolean;
  onBack?: () => void;
  onPaySuccess: () => void;
  /** Pass either createBooking (for creating new booking in steps) OR bookingId (for existing booking) OR createIntent */
  createBooking?: () => Promise<number>;
  bookingId?: number;
  createIntent?: () => Promise<{ clientSecret: string; paymentIntentId?: string }>;
  onConfirmPayment?: (paymentIntentId: string) => Promise<any>;
  buttonText?: string;
  platformName?: string;
  paymentMethodTitle?: string;
  paymentMethodSubtitle?: string;
  summaryTitle?: string;
  summarySubtitle?: string;
  summaryItems?: Array<{ label: string; value: string | React.ReactNode; isMuted?: boolean }>;
  secureFooterNote?: string;
}

export default function CustomBookingPaymentForm({
  details,
  grandTotal,
  formattedPrices,
  subtotal,
  serviceFee = 0,
  serviceFeeRate = 10,
  taxAmount = 0,
  businessName = "Service Provider",
  submitting = false,
  onBack,
  onPaySuccess,
  createBooking,
  bookingId,
  createIntent,
  onConfirmPayment,
  buttonText,
  platformName = "Hollis",
  paymentMethodTitle = "Payment method",
  paymentMethodSubtitle,
  summaryTitle,
  summarySubtitle,
  summaryItems,
  secureFooterNote,
}: CustomBookingPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState(details?.name || "");
  const [zip, setZip] = useState(details?.zip || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState("");

  // Track Stripe elements validity & errors
  const [cardNumberState, setCardNumberState] = useState<{
    empty: boolean;
    complete: boolean;
    error?: string;
  }>({ empty: true, complete: false });

  const [cardExpiryState, setCardExpiryState] = useState<{
    empty: boolean;
    complete: boolean;
    error?: string;
  }>({ empty: true, complete: false });

  const [cardCvcState, setCardCvcState] = useState<{
    empty: boolean;
    complete: boolean;
    error?: string;
  }>({ empty: true, complete: false });

  const [fieldErrors, setFieldErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    zip?: string;
    nameOnCard?: string;
  }>({});

  const handlePay = async () => {
    // Validate all 5 payment fields
    const errors: {
      cardNumber?: string;
      expiry?: string;
      cvc?: string;
      zip?: string;
      nameOnCard?: string;
    } = {};

    // 1. Card number validation
    if (cardNumberState.empty) {
      errors.cardNumber = "Card number is required.";
    } else if (cardNumberState.error) {
      errors.cardNumber = cardNumberState.error;
    } else if (!cardNumberState.complete) {
      errors.cardNumber = "Please enter a valid card number.";
    }

    // 2. Expiry validation
    if (cardExpiryState.empty) {
      errors.expiry = "Expiry is required.";
    } else if (cardExpiryState.error) {
      errors.expiry = cardExpiryState.error;
    } else if (!cardExpiryState.complete) {
      errors.expiry = "Enter a valid expiry date.";
    }

    // 3. CVC validation
    if (cardCvcState.empty) {
      errors.cvc = "CVC is required.";
    } else if (cardCvcState.error) {
      errors.cvc = cardCvcState.error;
    } else if (!cardCvcState.complete) {
      errors.cvc = "Enter valid 3 or 4-digit CVC.";
    }

    // 4. Billing ZIP validation
    if (!zip || !zip.trim()) {
      errors.zip = "Billing ZIP is required.";
    } else if (!isValidZip(zip)) {
      errors.zip = "Enter a valid ZIP code.";
    }

    // 5. Name on card validation
    if (!nameOnCard.trim() || nameOnCard.trim().length < 2) {
      errors.nameOnCard = "Name on card is required (min 2 characters).";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please refresh.");
      return;
    }

    setIsProcessing(true);
    setCardError("");

    try {
      let clientSecret = "";
      let paymentIntentId = "";

      if (createIntent) {
        toast.loading("Initializing secure payment...", { id: "intent" });
        try {
          const intentData = await createIntent();
          toast.dismiss("intent");
          clientSecret = intentData.clientSecret;
          paymentIntentId = intentData.paymentIntentId || "";
        } catch (err: any) {
          toast.dismiss("intent");
          setCardError(err?.message || "Failed to initialize payment.");
          toast.error(err?.message || "Failed to initialize payment.");
          setIsProcessing(false);
          return;
        }
      } else {
        let resolvedBookingId = bookingId;

        // If createBooking is passed (new booking flow), execute it first
        if (createBooking) {
          toast.loading("Creating your booking...", { id: "booking" });
          try {
            resolvedBookingId = await createBooking();
            toast.dismiss("booking");
          } catch (err: any) {
            toast.dismiss("booking");
            setCardError(err?.message || "Failed to create booking.");
            toast.error(err?.message || "Failed to create booking.");
            setIsProcessing(false);
            return;
          }
        }

        if (!resolvedBookingId) {
          setCardError("Booking ID is required to process payment.");
          toast.error("Invalid booking information.");
          setIsProcessing(false);
          return;
        }

        // Initialize PaymentIntent on backend
        toast.loading("Initializing secure payment...", { id: "intent" });
        const intentRes = await createPaymentIntent({ booking_id: resolvedBookingId });
        toast.dismiss("intent");

        const intentData = intentRes?.data?.data;

        // Guard: Booking was already paid / auto-completed
        if (intentData?.alreadyPaid) {
          toast.success("Payment confirmed! Your booking is complete.");
          setTimeout(() => onPaySuccess(), 1000);
          return;
        }

        if (!intentRes?.data?.success || !intentData?.clientSecret) {
          const msg = intentRes?.data?.message || "Failed to initialize payment.";
          setCardError(msg);
          toast.error(msg);
          setIsProcessing(false);
          return;
        }

        clientSecret = intentData.clientSecret;
        paymentIntentId = intentData.paymentIntentId || "";
      }

      // Confirm payment with Stripe using the custom card elements
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        setCardError("Card element not found. Please refresh.");
        setIsProcessing(false);
        return;
      }

      toast.loading("Processing payment...", { id: "pay" });
      const billingDetails: any = { name: nameOnCard.trim() };
      if (details?.address || details?.city || zip) {
        billingDetails.address = {
          line1: details?.address || "Service Address",
          city: details?.city || "Indore",
          postal_code: zip || details?.zip || "452010",
          country: "IN",
        };
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: billingDetails,
          },
        }
      );
      toast.dismiss("pay");

      if (error) {
        setCardError(error.message || "Payment failed.");
        toast.error(error.message || "Payment failed.");
        setIsProcessing(false);
        return;
      }

      if (
        paymentIntent?.status === "succeeded" ||
        paymentIntent?.status === "processing"
      ) {
        if (onConfirmPayment) {
          try {
            await onConfirmPayment(paymentIntent.id);
          } catch (e) {
            console.warn("Custom confirm notice (non-fatal):", e);
          }
        } else {
          // Best-effort backend notify
          try {
            await confirmPayment({ payment_intent_id: paymentIntent.id });
          } catch (e) {
            console.warn("Backend confirm notice (non-fatal):", e);
          }
        }
        toast.success("Payment successful!");
        setTimeout(() => onPaySuccess(), 1200);
      }
    } catch (err: any) {
      toast.dismiss("booking");
      toast.dismiss("intent");
      toast.dismiss("pay");
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred.";
      setCardError(msg);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = !stripe || isProcessing || submitting;

  const displayTotal =
    formattedPrices?.total ||
    (typeof grandTotal === "number" ? `$${grandTotal.toFixed(2)}` : `$${grandTotal}`);

  const displaySubtotal =
    formattedPrices?.subtotal ||
    (typeof subtotal === "number" ? `$${subtotal.toFixed(2)}` : `$${subtotal}`);

  const displayServiceFee =
    formattedPrices?.service_fee ||
    (typeof serviceFee === "number" ? `$${serviceFee.toFixed(2)}` : `$${serviceFee}`);

  const displayTax =
    formattedPrices?.tax_amount ||
    (typeof taxAmount === "number" ? `$${taxAmount.toFixed(2)}` : `$${taxAmount}`);

  return (
    <div className="space-y-6">
      {/* Payment Method & Payment Summary Panels */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        {/* ── Payment Method Card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">
            {paymentMethodTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paymentMethodSubtitle ||
              "Enter your credit card or payment details below to complete your order securely."}
          </p>

          <div className="mt-5 grid gap-4">
            {/* Card Number */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Card number <span className="text-destructive">*</span>
              </Label>
              <div
                className={`relative flex items-center h-9 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-within:ring-1 ${
                  fieldErrors.cardNumber
                    ? "border-destructive focus-within:ring-destructive"
                    : "border-input focus-within:ring-ring"
                }`}
              >
                <CreditCard
                  size={15}
                  className={`mr-2 shrink-0 ${
                    fieldErrors.cardNumber
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  <CardNumberElement
                    options={{
                      style: CARD_ELEMENT_STYLE,
                      placeholder: "4242 4242 4242 4242",
                      showIcon: false,
                    }}
                    onChange={(event) => {
                      setCardNumberState({
                        empty: event.empty,
                        complete: event.complete,
                        error: event.error?.message,
                      });
                      if (event.complete || (!event.empty && !event.error)) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          cardNumber: undefined,
                        }));
                      } else if (event.error) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          cardNumber: event.error.message,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
              {fieldErrors.cardNumber && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {fieldErrors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry | CVC | Billing ZIP */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Expiry <span className="text-destructive">*</span>
                </Label>
                <div
                  className={`flex items-center h-9 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-within:ring-1 ${
                    fieldErrors.expiry
                      ? "border-destructive focus-within:ring-destructive"
                      : "border-input focus-within:ring-ring"
                  }`}
                >
                  <div className="w-full">
                    <CardExpiryElement
                      options={{
                        style: CARD_ELEMENT_STYLE,
                        placeholder: "09 / 29",
                      }}
                      onChange={(event) => {
                        setCardExpiryState({
                          empty: event.empty,
                          complete: event.complete,
                          error: event.error?.message,
                        });
                        if (event.complete || (!event.empty && !event.error)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            expiry: undefined,
                          }));
                        } else if (event.error) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            expiry: event.error.message,
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                {fieldErrors.expiry && (
                  <p className="text-[11px] text-destructive font-medium leading-tight mt-1">
                    {fieldErrors.expiry}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  CVC <span className="text-destructive">*</span>
                </Label>
                <div
                  className={`flex items-center h-9 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-within:ring-1 ${
                    fieldErrors.cvc
                      ? "border-destructive focus-within:ring-destructive"
                      : "border-input focus-within:ring-ring"
                  }`}
                >
                  <div className="w-full">
                    <CardCvcElement
                      options={{
                        style: CARD_ELEMENT_STYLE,
                        placeholder: "123",
                      }}
                      onChange={(event) => {
                        setCardCvcState({
                          empty: event.empty,
                          complete: event.complete,
                          error: event.error?.message,
                        });
                        if (event.complete || (!event.empty && !event.error)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            cvc: undefined,
                          }));
                        } else if (event.error) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            cvc: event.error.message,
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                {fieldErrors.cvc && (
                  <p className="text-[11px] text-destructive font-medium leading-tight mt-1">
                    {fieldErrors.cvc}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="billingZip" className="text-xs font-semibold">
                  Billing ZIP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="billingZip"
                  placeholder="78704"
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value);
                    if (fieldErrors.zip) {
                      setFieldErrors((prev) => ({ ...prev, zip: undefined }));
                    }
                  }}
                  inputMode="numeric"
                  className={`h-9 ${
                    fieldErrors.zip
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {fieldErrors.zip && (
                  <p className="text-[11px] text-destructive font-medium leading-tight mt-1">
                    {fieldErrors.zip}
                  </p>
                )}
              </div>
            </div>

            {/* Name on card */}
            <div className="space-y-1">
              <Label htmlFor="nameOnCard" className="text-xs font-semibold">
                Name on card <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameOnCard"
                placeholder="e.g. Sarah Whitfield"
                value={nameOnCard}
                onChange={(e) => {
                  setNameOnCard(e.target.value);
                  if (fieldErrors.nameOnCard) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      nameOnCard: undefined,
                    }));
                  }
                }}
                className={`h-9 ${
                  fieldErrors.nameOnCard
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
              {fieldErrors.nameOnCard && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {fieldErrors.nameOnCard}
                </p>
              )}
            </div>

            {/* Card error */}
            {cardError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cardError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-4">
            <ShieldCheck size={14} className="text-success" /> Secure 256-bit SSL encrypted transaction.
          </div>
        </div>

        {/* ── Payment Summary Card ── */}
        <div className="h-max rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">
            {summaryTitle || "Payment Summary"}
          </h2>
          {summarySubtitle !== undefined ? (
            summarySubtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {summarySubtitle}
              </p>
            ) : null
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Paying through {platformName} platform to {businessName}
            </p>
          )}

          <dl className="mt-5 space-y-3 text-sm">
            {summaryItems && summaryItems.length > 0 ? (
              summaryItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <dt
                    className={
                      item.isMuted
                        ? "text-muted-foreground"
                        : "text-foreground font-medium"
                    }
                  >
                    {item.label}
                  </dt>
                  <dd
                    className={
                      item.isMuted
                        ? "text-muted-foreground font-medium"
                        : "font-semibold text-foreground"
                    }
                  >
                    {item.value}
                  </dd>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-foreground">Subtotal (Services)</dt>
                  <dd className="font-semibold text-foreground">
                    {displaySubtotal}
                  </dd>
                </div>
                {serviceFee > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      Service Fee ({serviceFeeRate}%)
                    </dt>
                    <dd className="text-muted-foreground font-medium">
                      {displayServiceFee}
                    </dd>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Taxes</dt>
                    <dd className="text-muted-foreground font-medium">
                      {displayTax}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>

          <div className="my-4 border-t border-border/60" />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total due</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {displayTotal}
            </span>
          </div>

          {/* Pay Button */}
          <Button
            size="lg"
            type="button"
            onClick={handlePay}
            disabled={isDisabled}
            className="mt-5 w-full gap-2 shadow-sm font-semibold"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-1" />
                Processing...
              </>
            ) : (
              <>
                <Lock size={16} /> {buttonText || "Pay & Confirm Booking"}
              </>
            )}
          </Button>

          {secureFooterNote !== "" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {secureFooterNote ||
                `Payments are held securely by ${platformName} platform and paid out to provider after job completion.`}
            </p>
          )}
        </div>
      </div>

      {/* Back button (optional) */}
      {onBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft size={16} /> Back to Date &amp; Address
          </Button>
        </div>
      )}
    </div>
  );
}
