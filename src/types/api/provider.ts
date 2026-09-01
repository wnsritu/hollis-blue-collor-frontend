export type BankAccountType = "checking" | "savings" | "other";

export type ProviderBankInfo = {
  bank_account_holder?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_routing_number?: string | null;
  bank_account_type?: BankAccountType | null;
  account_last4?: string | null;
};

export type UpdateBankInfoPayload = {
  bank_account_holder: string;
  bank_name: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_account_type: BankAccountType;
};

export type ProviderVerificationStatus = "unverified" | "verified" | "rejected";

export type ProviderProfile = {
  id: number;
  user_id: number;
  business_name: string;
  service_description?: string | null;
  service_location_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
  service_categories?: string[] | unknown;
  category_id?: number | null;
  rating?: number;
  status?: "active" | "paused" | string;
  verified?: ProviderVerificationStatus;
  latitude?: number | string | null;
  longitude?: number | string | null;
  years_of_experience?: number | null;
  service_radius_miles?: number | string | null;
  license_number?: string | null;
  insurance_policy?: string | null;
  license_document?: string | null;
  insurance_certificate?: string | null;
  license_document_url?: string | null;
  insurance_certificate_url?: string | null;
  [key: string]: unknown;
};

export type UpdateProviderPayload = Partial<ProviderProfile> & Record<string, unknown>;
