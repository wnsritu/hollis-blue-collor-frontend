/** M3 Provider marketplace search + leads */

export type ProviderSearchParams = {
  search?: string;
  category_id?: number | string;
  service_type_id?: number | string;
  city?: string;
  zip_code?: string;
  state?: string;
  lat?: number | string;
  lng?: number | string;
  miles?: number | string;
  rating_min?: number | string;
  rating_max?: number | string;
  price_min?: number | string;
  price_max?: number | string;
  verified?: string;
  experience_min?: number | string;
  availability_day?: string;
  time_slot_id?: number | string;
  /** distance | rating | price | newest */
  sort?: "distance" | "rating" | "price" | "newest" | string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
};

export type MarketplaceProvider = {
  id?: number;
  provider_id?: number;
  business_name?: string;
  profile_photo?: string | null;
  rating?: number;
  review_count?: number;
  verified?: string;
  experience?: number;
  pricing?: { min?: number; max?: number } | null;
  distance_miles?: number | null;
  availability?: boolean;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  [key: string]: unknown;
};

export type ProviderSearchResult = {
  data?: MarketplaceProvider[];
  total?: number;
  pagination?: {
    total?: number;
    totalPages?: number;
    currentPage?: number;
    pageSize?: number;
  };
  [key: string]: unknown;
};
