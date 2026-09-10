export type CustomerProfileTab = "profile" | "security";

export interface CustomerProfileData {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_picture?: string;
}

export interface CustomerProjectItem {
  id: number | string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  budget?: number;
  proposals_count?: number;
}

export interface CustomerReviewItem {
  id: number | string;
  provider_id: number | string;
  provider_name: string;
  service_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CustomerOrderSummary {
  id: number | string;
  booking_code: string;
  service_name: string;
  provider_name: string;
  status: string;
  scheduled_date: string;
  total_amount: number;
}
