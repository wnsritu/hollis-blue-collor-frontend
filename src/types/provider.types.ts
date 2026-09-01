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
    first_name?: string; last_name?: string; email?: string; phone?: string 
  };
}
