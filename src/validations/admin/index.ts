import * as Yup from "yup";

/**
 * Common 10-digit phone number validation schema
 */
export const tenDigitPhoneSchema = Yup.string()
  .trim()
  .required("Phone number is required")
  .matches(/^\d{10}$/, "Phone number must be exactly 10 digits");

/**
 * Admin Profile validation schema (Name, Email)
 */
export const adminProfileSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .required("Name is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
});

/**
 * Platform General Settings validation schema
 */
export const platformGeneralSettingsSchema = Yup.object({
  name: Yup.string().trim().optional(),
  tagline: Yup.string().trim().optional(),
  support: Yup.string()
    .trim()
    .email("Enter a valid support email address")
    .required("Support email is required"),
  phone: Yup.string()
    .trim()
    .required("Support phone is required")
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  address: Yup.string().trim().optional(),
});

/**
 * Admin Password Change & Security validation schema
 */
export const adminPasswordChangeSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(6, "New password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "New passwords do not match")
    .required("Confirm password is required"),
});
