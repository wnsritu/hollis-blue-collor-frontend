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
    return "Mobile number is required.";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10 || phone.trim() !== digits) {
    return "Please enter a valid 10-digit mobile number.";
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  if (!email || !email.trim()) {
    return "Email address is required.";
  }
  const trimmed = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  if (trimmed.length > 255) {
    return "Email address cannot exceed 255 characters.";
  }
  return undefined;
}

export function validateBusinessName(name: string): string | undefined {
  if (!name || !name.trim()) {
    return "Business name is required.";
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return "Business name must be at least 3 characters.";
  }
  if (trimmed.length > 150) {
    return "Business name cannot exceed 150 characters.";
  }
  return undefined;
}

export function validateFullName(name: string): string | undefined {
  if (!name || !name.trim()) {
    return "Full name is required.";
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return "Name must be at least 3 characters.";
  }
  if (trimmed.length > 150) {
    return "Full name cannot exceed 150 characters.";
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (password.length > 128) {
    return "Password cannot exceed 128 characters.";
  }
  return undefined;
}

export function validateZipCode(zip: string): string | undefined {
  if (!zip || !zip.trim()) {
    return undefined;
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
  if (clean.length < 4 || clean.length > 50) {
    return "Routing number / IFSC must be between 4 and 50 characters.";
  }
  if (!/^[a-zA-Z0-9]+$/.test(clean)) {
    return "Routing number / IFSC must contain letters and numbers only.";
  }
  return undefined;
}

export function validateLicenseNumber(license: string): string | undefined {
  if (!license || !license.trim()) {
    return "License number is required.";
  }
  if (license.trim().length < 3) {
    return "License number must be at least 3 characters long.";
  }
  if (license.trim().length > 100) {
    return "License number cannot exceed 100 characters.";
  }
  return undefined;
}

export function validateInsurancePolicy(policy: string): string | undefined {
  if (!policy || !policy.trim()) {
    return "Insurance policy number is required.";
  }
  if (policy.trim().length < 3) {
    return "Insurance policy number must be at least 3 characters long.";
  }
  if (policy.trim().length > 100) {
    return "Insurance policy number cannot exceed 100 characters.";
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
  const topMessage = responseData?.message;

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

  const applyError = (field: string, msg: string) => {
    let cleanMsg = msg;
    if (msg.includes("fails to match the required pattern")) {
      cleanMsg = `${field.replace(/_/g, " ")} format is invalid (letters and numbers only)`;
    }
    const mappedKeys = keyMap[field];
    if (mappedKeys) {
      for (const k of mappedKeys) {
        if (!result[k]) result[k] = cleanMsg;
      }
    } else {
      if (!result[field]) result[field] = cleanMsg;
    }
  };

  if (Array.isArray(errorsList)) {
    for (const item of errorsList) {
      if (!item) continue;
      const rawPath = Array.isArray(item.path) ? item.path : [];
      const fieldName = rawPath.length > 0 ? String(rawPath[rawPath.length - 1]) : "";
      const msg = item.message || "Invalid field";

      if (fieldName) applyError(fieldName, msg);
    }
  }

  if (typeof topMessage === "string") {
    const match = topMessage.match(/^([a-zA-Z0-9_]+)\s+with\s+value/i) || topMessage.match(/^([a-zA-Z0-9_]+)\s+is\s+/i);
    if (match && match[1]) {
      applyError(match[1], topMessage);
    }
  }

  return result;
}
