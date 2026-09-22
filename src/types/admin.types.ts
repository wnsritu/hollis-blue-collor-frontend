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
  lifetime_spend?: number;
  total_bookings?: number;
  bookings_count?: number;
  created_at?: string;
  createdAt?: string;
  stats?: {
    total_projects?: number;
    total_reviews?: number;
    total_bookings?: number;
    total_spend?: number;
  };
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

export interface RevenueSeriesItem {
  month: string;
  revenue: number;
  commission: number;
}

export interface ProviderGrowthItem {
  month: string;
  providers: number;
  customers: number;
}

export interface PendingProviderItem {
  id: number | string;
  name: string;
  category: string;
  city: string;
  state: string;
  status: string;
}

export interface RecentTransactionItem {
  id: string;
  amount: number;
  customer: string;
  provider: string;
  date: string;
  status: string;
}

export interface AdminDashboardData {
  gmv?: number;
  commission?: number;
  commissionRate?: number;
  activeJobs?: number;
  providersCount?: number;
  customersCount?: number;
  pendingPayouts?: {
    totalAmount?: number;
    count?: number;
  };
  revenueSeries?: RevenueSeriesItem[];
  providerGrowth?: ProviderGrowthItem[];
  pendingProviders?: PendingProviderItem[];
  recentTransactions?: RecentTransactionItem[];
  stats?: {
    totalUsers?: number;
    totalProviders?: number;
    activeBookings?: number;
    totalRevenue?: number;
  };
}

export interface PlatformGeneralSettings {
  name: string;
  tagline: string;
  support: string;
  phone: string;
  address: string;
}

export interface AdminProfileFormValues {
  name: string;
  email: string;
}

