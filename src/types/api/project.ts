export type ProjectStatus =
  | "draft"
  | "open"
  | "matching"
  | "proposals_received"
  | "accepted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired";

export type ProjectUrgency = "flexible" | "soon" | "urgent";

export type Project = {
  id: number;
  customer_id: number;
  category_id: number;
  service_type_id?: number | null;
  title: string;
  description: string;
  status: ProjectStatus;
  address_line: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  preferred_date?: string | null;
  preferred_time_slot_id?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  urgency?: ProjectUrgency;
  special_requirements?: string | null;
  contact_preferences?: Record<string, unknown> | unknown[] | null;
  accepted_proposal_id?: number | null;
  booking_id?: number | null;
  expires_at?: string | null;
  invited_provider_id?: number | null;
  request_type?: "open_match" | "direct_quote";
  created_at?: string;
  category?: { id: number; name: string } | null;
  service_type?: { id: number; name: string } | null;
  customer?: {
    id?: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  } | null;
  customer_notes?: string | null;
  invited_provider?: {
    id: number;
    business_name: string;
    name?: string;
    user_id?: number;
    rating?: number;
    verified?: boolean;
    city?: string;
  } | null;
  provider?: {
    id?: number;
    business_name?: string;
    name?: string;
    [key: string]: unknown;
  } | null;
  attachments?: Array<{
    id: number;
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    [key: string]: unknown;
  }> | null;
  [key: string]: unknown;
};

export type CreateProjectPayload = {
  category_id: number;
  service_type_id?: number | null;
  title: string;
  description: string;
  address_line: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  preferred_date?: string | null;
  preferred_time_slot_id?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  urgency?: ProjectUrgency;
  special_requirements?: string | null;
  contact_preferences?: Record<string, unknown> | unknown[] | null;
  status?: "draft" | "open";
  /** Direct quote: send request to this provider only */
  provider_id?: number;
  invited_provider_id?: number;
  request_type?: "open_match" | "direct_quote";
};

export type RequestQuotePayload = {
  service_type_id: number;
  address_line: string;
  category_id?: number;
  title?: string;
  description?: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  preferred_date?: string | null;
  preferred_time_slot_id?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  urgency?: ProjectUrgency;
  special_requirements?: string | null;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type UpdateProjectStatusPayload = {
  status: ProjectStatus;
};
