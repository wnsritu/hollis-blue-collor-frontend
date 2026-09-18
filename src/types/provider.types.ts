export interface Provider {
  id: number;
  user_id: number;
  business_name: string;
  service_description: string;
  language_spoken: string;
  service_location_address: string;
  city: string;
  state?: string;
  country?: string;
  zip_code: string;
  profile_photo: string;
  government_id: string;
  selfie_pic?: string;
  service_categories?: string[];
  rating: number;
  status: string;
  verified: "unverified" | "verified" | "rejected";
  latitude: string;
  longitude: string;
  full_name: string;

  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

export type ProviderProfileTab = "info" | "bank" | "faqs";

export interface FAQItem {
  id?: string | number;
  question: string;
  answer: string;
}

export interface BankForm {
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_account_type: any;
}

export interface ProviderServiceConfig {
  price?: number;
  offered?: boolean;
  unit?: string;
  service_id?: number;
  service_name?: string;
  category_id?: number;
  category_name?: string;
  is_active?: boolean;
  base_price?: number;
}

export interface ProviderLead {
  id: number | string;
  project_id: number | string;
  title: string;
  description: string;
  budget: number;
  location: string;
  distance: string;
  created_at: string;
  status: string;
}
