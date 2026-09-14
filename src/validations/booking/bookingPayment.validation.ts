import * as Yup from "yup";
import { zipValidationSchema } from "../common";

export interface BookingPaymentFormValues {
  cardNumber: string;
  expiry: string;
  cvc: string;
  zip: string;
  nameOnCard: string;
}

export const DEFAULT_BOOKING_PAYMENT_VALUES: BookingPaymentFormValues = {
  cardNumber: "",
  expiry: "",
  cvc: "",
  zip: "",
  nameOnCard: "",
};

export const bookingPaymentValidationSchema = Yup.object().shape({
  cardNumber: Yup.string()
    .trim()
    .required("Card number is required")
    .test("is-card-valid", "Please enter a valid 16-digit card number", (val) => {
      if (!val) return false;
      const clean = val.replace(/\s+/g, "");
      return /^\d{15,19}$/.test(clean);
    }),

  expiry: Yup.string()
    .trim()
    .required("Expiry date is required")
    .test("is-expiry-valid", "Enter valid expiry (MM/YY)", (val) => {
      if (!val) return false;
      const clean = val.replace(/\s+/g, "");
      const match = clean.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
      if (!match) return false;
      const month = parseInt(match[1], 10);
      return month >= 1 && month <= 12;
    }),

  cvc: Yup.string()
    .trim()
    .required("CVC is required")
    .matches(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),

  zip: zipValidationSchema,

  nameOnCard: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .required("Name on card is required"),
});

export type BookingPaymentValidationSchema = typeof bookingPaymentValidationSchema;
