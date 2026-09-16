import * as Yup from "yup";

/**
 * BookingPaymentFormValues
 *
 * Only non-sensitive billing fields are collected via custom form inputs.
 * Sensitive card data (number, expiry, CVC) is handled exclusively by
 * Stripe Elements inside the Stripe secure iframe — never by our inputs.
 */
export interface BookingPaymentFormValues {
  nameOnCard: string;
}

export const DEFAULT_BOOKING_PAYMENT_VALUES: BookingPaymentFormValues = {
  nameOnCard: "",
};

export const bookingPaymentValidationSchema = Yup.object().shape({
  nameOnCard: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .required("Name on card is required"),
});

export type BookingPaymentValidationSchema = typeof bookingPaymentValidationSchema;

