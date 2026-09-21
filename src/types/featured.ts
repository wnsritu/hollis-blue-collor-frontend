export interface FeaturedPlanItem {
  id: number | string;
  name: string;
  price: number;
  duration_days: number;
  days?: number;
  benefits: string[];
  is_active: boolean;
  active?: boolean;
  purchases?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedListingItem {
  id: string;
  raw_id?: number;
  target: string;
  type?: string;
  owner?: string;
  plan: string;
  spend: number;
  starts: string;
  expires: string;
  status: "Active" | "Expired" | "Pending" | "Cancelled" | string;
  is_active?: boolean;
  provider_id?: number;
}

export interface CreateFeaturedPlanPayload {
  name: string;
  price: number;
  duration_days: number;
  benefits: string[];
  is_active?: boolean;
}

export interface UpdateFeaturedPlanPayload {
  name?: string;
  price?: number;
  duration_days?: number;
  benefits?: string[];
  is_active?: boolean;
}

export interface AdminFeaturedPlansResponse {
  plans: FeaturedPlanItem[];
  lifetime_revenue: number;
  total_plans: number;
}

export interface AdminFeaturedListingsResponse {
  listings: FeaturedListingItem[];
  active_count: number;
  total_spend: number;
  total_listings: number;
}
