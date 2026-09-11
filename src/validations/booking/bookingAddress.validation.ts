import * as Yup from "yup";

export interface BookingAddressFormValues {
  name: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  notes: string;
}

export const DEFAULT_BOOKING_ADDRESS_VALUES: BookingAddressFormValues = {
  name: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  notes: "",
};

export const bookingAddressValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .required("Full name is required"),

  phone: Yup.string()
    .trim()
    .required("Phone number is required")
    .test("is-valid-phone", "Please enter a valid phone number (at least 10 digits)", (val) => {
      if (!val) return false;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }),

  address: Yup.string()
    .trim()
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address cannot exceed 200 characters")
    .required("Street address is required"),

  city: Yup.string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters")
    .required("City is required"),

  zip: Yup.string()
    .trim()
    .required("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/, "ZIP code must be a valid 5-digit US ZIP code (e.g. 78701)"),

  notes: Yup.string()
    .trim()
    .max(500, "Special instructions cannot exceed 500 characters")
    .optional(),
});

export type BookingAddressValidationSchema = typeof bookingAddressValidationSchema;
