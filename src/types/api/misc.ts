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
  chat_id?: number | string;
  sender_id?: number;
  sender_role?: string;
  message?: string;
  text?: string;
  type?: "text" | "image" | "document" | string;
  file_url?: string | null;
  file_name?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment?: string | null;
  is_read?: boolean;
  createdAt?: string;
  created_at?: string;
  sender?: {
    id?: number;
    full_name?: string;
    profile_image?: string | null;
  };
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
  chat_id?: number | string;
  chatId?: number | string;
  message?: string;
  sender_role?: string;
  file_url?: string;
  file_name?: string;
  type?: string;
  attachment?: unknown;
  file?: unknown;
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
