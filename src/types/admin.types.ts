export interface ServiceFlatRow {
  serviceId: number;
  serviceName: string;
  description: string;
  subcategoryId: number;
  subcategoryName: string;
  parentCategoryId: number;
  parentCategoryName: string;
  isActive: boolean;
  rawServiceType?: any;
}

export interface SupportAgent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  created_at?: string;
}

export interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

export interface CustomerUser {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  status?: string;
  is_active?: boolean;
  jobs_count?: number;
  total_spend?: number;
  total_bookings?: number;
  created_at?: string;
  createdAt?: string;
}

export interface DisputeItem {
  id: number;
  dispute_id: string;
  order_id: number;
  customer_name: string;
  provider_name: string;
  reason: string;
  status: "open" | "resolved" | "pending";
  created_at: string;
}
