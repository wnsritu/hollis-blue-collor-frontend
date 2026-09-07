export type CustomerProfile = {
  id?: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};

export type UpdateCustomerPayload = Partial<CustomerProfile> & Record<string, unknown>;

export type ChatMessage = {
  id: number;
  chat_id?: number;
  sender_id?: number;
  message?: string;
  attachment_url?: string | null;
  is_read?: boolean;
  created_at?: string;
  [key: string]: unknown;
};

export type ChatThread = {
  id: number;
  customer_id?: number;
  provider_id?: number;
  project_id?: number | null;
  booking_id?: number | null;
  [key: string]: unknown;
};

export type SendMessagePayload = {
  chat_id?: number;
  message?: string;
  [key: string]: unknown;
};

export type CreateChatPayload = {
  customer_id?: number;
  provider_id?: number;
  project_id?: number;
  booking_id?: number;
  [key: string]: unknown;
};

export type CreateRatingPayload = {
  booking_id?: number;
  project_id?: number;
  provider_id?: number;
  rating: number;
  review?: string;
  [key: string]: unknown;
};

export type SubscriptionPlan = {
  id: number;
  name?: string;
  price?: number;
  interval?: string;
  is_active?: boolean;
  [key: string]: unknown;
};
