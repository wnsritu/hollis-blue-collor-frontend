/**
 * Shared Provider Validation Rules & Utilities
 */

export interface ProviderValidationErrors {
  fullName?: string;
  name?: string;
  businessName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agree?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string;
  country?: string;
  license?: string;
  insurance?: string;
  licenseDocument?: string;
  insuranceDocument?: string;
  about?: string;
  years?: string;
  bank_name?: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone || !phone.trim()) {
    return "Mobile phone number is required.";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return "Phone number must be between 10 and 15 digits.";
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  if (!email || !email.trim()) {
    return "Email address is required.";
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return undefined;
}

export function validateBusinessName(name: string): string | undefined {
  if (!name || !name.trim()) {
    return "Business name is required.";
  }
  if (name.trim().length < 2) {
    return "Business name must be at least 2 characters.";
  }
  if (name.trim().length > 150) {
    return "Business name cannot exceed 150 characters.";
  }
  return undefined;
}

export function validateFullName(name: string): string | undefined {
  if (!name || !name.trim()) {
    return "Full name is required.";
  }
  if (name.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  if (name.trim().length > 150) {
    return "Full name cannot exceed 150 characters.";
  }
  return undefined;
}

export function validateZipCode(zip: string): string | undefined {
  if (!zip || !zip.trim()) {
    return undefined;
  }
  const digits = zip.trim().replace(/\s/g, "");
  // Simple numeric / standard zip check (3 to 10 digits/characters if provided)
  if (!/^[a-zA-Z0-9\s\-]{3,10}$/.test(digits)) {
    return "ZIP / Postal code format is invalid.";
  }
  return undefined;
}

export function validateYearsOfExperience(years: string | number): string | undefined {
  if (years === "" || years === null || years === undefined) return undefined;
  const num = Number(years);
  if (isNaN(num) || num < 0 || num > 70) {
    return "Years of experience must be a number between 0 and 70.";
  }
  return undefined;
}

export function validateBankAccountNumber(acc: string): string | undefined {
  if (!acc || !acc.trim()) {
    return "Bank account number is required.";
  }
  const digits = acc.replace(/\D/g, "");
  if (!digits || digits.length < 4 || digits.length > 20) {
    return "Account number must be numeric (4 to 20 digits).";
  }
  return undefined;
}

export function validateBankRoutingNumber(routing: string): string | undefined {
  if (!routing || !routing.trim()) {
    return "Routing number / IFSC is required.";
  }
  const clean = routing.trim();
  if (clean.length < 4 || clean.length > 20) {
    return "Routing number / IFSC must be 4 to 20 characters.";
  }
  return undefined;
}

export function validateLicenseNumber(license: string): string | undefined {
  if (!license || !license.trim()) {
    return "License number is required.";
  }
  if (license.trim().length < 2 || license.trim().length > 100) {
    return "License number must be between 2 and 100 characters.";
  }
  return undefined;
}

export function validateInsurancePolicy(policy: string): string | undefined {
  if (!policy || !policy.trim()) {
    return "Insurance policy number is required.";
  }
  if (policy.trim().length < 2 || policy.trim().length > 100) {
    return "Insurance policy number must be between 2 and 100 characters.";
  }
  return undefined;
}

/**
 * Extract field-level errors from backend API response (e.g. Joi 422 validation errors)
 * Maps backend payload field names to frontend state error keys
 */
export function extractApiFieldErrors(err: any): Record<string, string> {
  const result: Record<string, string> = {};
  const responseData = err?.response?.data;
  const errorsList = responseData?.errors;

  if (Array.isArray(errorsList)) {
    for (const item of errorsList) {
      if (!item) continue;
      const rawPath = Array.isArray(item.path) ? item.path : [];
      const fieldName = rawPath.length > 0 ? String(rawPath[rawPath.length - 1]) : "";
      const msg = item.message || "Invalid field";

      if (!fieldName) continue;

      const keyMap: Record<string, string[]> = {
        full_name: ["ownerName", "fullName", "name"],
        phone: ["mobile", "mobileNumber", "phone"],
        business_name: ["businessName"],
        service_description: ["about"],
        years_of_experience: ["years"],
        zip_code: ["zip", "zipCode"],
        bank_name: ["bank_name"],
        bank_account_holder: ["bank_account_holder"],
        bank_account_number: ["bank_account_number"],
        bank_routing_number: ["bank_routing_number"],
        bank_account_type: ["bank_account_type"],
        license_number: ["licenseNumber", "license"],
        insurance_policy: ["insurancePolicy", "insurance"],
      };

      const mappedKeys = keyMap[fieldName];
      if (mappedKeys) {
        for (const k of mappedKeys) {
          if (!result[k]) result[k] = msg;
        }
      } else {
        if (!result[fieldName]) result[fieldName] = msg;
      }
    }
  }

  return result;
}
