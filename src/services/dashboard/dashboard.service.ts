import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";

export interface CustomerDashboardStats {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_payment: number;
  total_spent: number;
  laundry_orders: number;
  house_cleaning_orders: number;
  car_wash_orders: number;
}

export interface CustomerRecentBooking {
  id: number | string;
  booking_number: string;
  status: string;
  appointment_status: string;
  payment_status: string;
  total_amount: number;
  booking_date: string;
  service_category: string;
  provider?: {
    id: number | string;
    business_name: string;
    rating: number;
    avatar?: string;
  };
  time_slot?: string;
  created_at?: string;
}

export interface CustomerAppointment {
  id: number | string;
  booking_number: string;
  appointment_status: string;
  status: string;
  booking_date: string;
  service_category: string;
  total_amount: number;
  provider?: {
    id: number | string;
    business_name: string;
    phone?: string;
    city?: string;
    avatar?: string;
  };
  time_slot?: string;
}

export interface CustomerMessage {
  chat_id: number | string;
  booking_id?: number | string;
  project_id?: number | string;
  last_message: string;
  last_message_time: string;
  provider?: {
    id: number | string;
    business_name: string;
    avatar?: string;
  };
  project_title?: string;
}

export interface RecommendedProvider {
  id: number | string;
  business_name: string;
  service_description?: string;
  rating: number;
  location?: string;
  years_of_experience?: number;
  service_categories?: string;
  avatar?: string;
}

export interface CustomerDashboardPayload {
  stats: CustomerDashboardStats;
  recentBookings: CustomerRecentBooking[];
  appointments: CustomerAppointment[];
  messages: CustomerMessage[];
  recommendedProviders: RecommendedProvider[];
}

export interface ProviderDashboardStats {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_amount: number;
  pending_payout: number;
  avg_rating: number;
  review_count: number;
  laundry_orders: number;
  house_cleaning_orders: number;
  car_wash_orders: number;
}

export interface ProviderJob {
  id: number | string;
  booking_number: string;
  appointment_status: string;
  status: string;
  payment_status: string;
  booking_date: string;
  service_category: string;
  total_amount: number;
  customer?: {
    id: number | string;
    full_name: string;
    phone?: string;
    avatar?: string;
  };
  time_slot?: string;
  created_at?: string;
}

export interface ProviderAppointment {
  id: number | string;
  booking_number: string;
  appointment_status: string;
  status: string;
  booking_date: string;
  service_category: string;
  total_amount: number;
  customer?: {
    id: number | string;
    full_name: string;
    phone?: string;
    avatar?: string;
  };
  time_slot?: string;
  project_title?: string;
}

export interface ProviderPayout {
  id: number | string;
  amount: number;
  currency: string;
  status: string;
  booking_id?: number | string;
  project_id?: number | string;
  eligible_at?: string;
  paid_at?: string;
  created_at?: string;
}

export interface ProviderEarnings {
  gross_revenue: number;
  commission_paid: number;
  net_earnings: number;
  settled_payouts: number;
  settled_payout_count: number;
  pending_payout: number;
  recent_payouts: ProviderPayout[];
}

export interface ProviderDashboardPayload {
  stats: ProviderDashboardStats;
  jobs: ProviderJob[];
  appointments: ProviderAppointment[];
  earnings: ProviderEarnings;
}

// ─── CUSTOMER DASHBOARD APIS ──────────────────────────────────────
export const getCustomerDashboardApi = () =>
  http.get<ApiSuccess<CustomerDashboardPayload>>(ENDPOINTS.userDashboard.root);

export const getCustomerStatsApi = () =>
  http.get<ApiSuccess<CustomerDashboardStats>>(ENDPOINTS.userDashboard.stats);

export const getCustomerRecentBookingsApi = () =>
  http.get<ApiSuccess<CustomerRecentBooking[]>>(ENDPOINTS.userDashboard.recentBookings);

export const getCustomerAppointmentsApi = () =>
  http.get<ApiSuccess<CustomerAppointment[]>>(ENDPOINTS.userDashboard.appointments);

export const getCustomerMessagesApi = () =>
  http.get<ApiSuccess<CustomerMessage[]>>(ENDPOINTS.userDashboard.messages);

export const getRecommendedProvidersApi = () =>
  http.get<ApiSuccess<RecommendedProvider[]>>(ENDPOINTS.userDashboard.recommendedProviders);

export const searchProvidersNearLocationApi = (miles = 10, page = 1, limit = 5) =>
  http.get<ApiSuccess<any>>("/providers/search", { miles, page, limit });

// ─── PROVIDER DASHBOARD APIS ──────────────────────────────────────
export const getProviderDashboardApi = () =>
  http.get<ApiSuccess<ProviderDashboardPayload>>(ENDPOINTS.providerDashboard.root);

export const getProviderStatsApi = () =>
  http.get<ApiSuccess<ProviderDashboardStats>>(ENDPOINTS.providerDashboard.stats);

export const getProviderJobsApi = () =>
  http.get<ApiSuccess<ProviderJob[]>>(ENDPOINTS.providerDashboard.jobs);

export const getProviderAppointmentsApi = () =>
  http.get<ApiSuccess<ProviderAppointment[]>>(ENDPOINTS.providerDashboard.appointments);

export const getProviderEarningsApi = () =>
  http.get<ApiSuccess<ProviderEarnings>>(ENDPOINTS.providerDashboard.earnings);

export const dashboardService = {
  getCustomerDashboard: getCustomerDashboardApi,
  getCustomerStats: getCustomerStatsApi,
  getCustomerRecentBookings: getCustomerRecentBookingsApi,
  getCustomerAppointments: getCustomerAppointmentsApi,
  getCustomerMessages: getCustomerMessagesApi,
  getRecommendedProviders: getRecommendedProvidersApi,
  searchProvidersNearLocation: searchProvidersNearLocationApi,

  getProviderDashboard: getProviderDashboardApi,
  getProviderStats: getProviderStatsApi,
  getProviderJobs: getProviderJobsApi,
  getProviderAppointments: getProviderAppointmentsApi,
  getProviderEarnings: getProviderEarningsApi,
};
