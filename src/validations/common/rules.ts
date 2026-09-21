import * as Yup from "yup";

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 && phone.trim() === digits;
};

export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value != null && value.trim().length > 0;
};

export const hasMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

/**
 * Validates that a ZIP / Postal code is valid (digits only, 3-10 digits, optional US 5+4 format).
 * Returns true if empty (not mandatory). Returns false if invalid or contains letters/symbols.
 */
export const isValidZip = (value: string | null | undefined): boolean => {
  if (!value || !value.trim()) return true;
  return /^\d{3,10}(-\d{4})?$/.test(value.trim());
};

/**
 * Reusable Yup schema for Formik forms:
 * - Not mandatory (optional)
 * - If provided, user cannot enter letters or invalid characters (digits only)
 */
export const zipValidationSchema = Yup.string()
  .trim()
  .test(
    "valid-zip",
    "Please enter a valid ZIP / Postal code (digits only, no letters)",
    (val) => isValidZip(val)
  )
  .optional();

