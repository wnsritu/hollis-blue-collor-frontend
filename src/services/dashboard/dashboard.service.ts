import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";

export interface CustomerDashboardStats {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_proposals: number;       // open projects waiting for provider quotes
  upcoming_appointments: number;   // bookings in the next 7 days
  next_upcoming_date?: string;     // e.g. "Aug 26, 8:00 AM"
  pending_payment: number;
  total_spent: number;
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
  // Correct service type split (based on project_id in bookings)
  direct_service_orders: number;   // customer booked directly
  request_quote_orders: number;    // came through marketplace proposal
  // Backward-compat aliases
  fixed_orders: number;
  quote_orders: number;
  total_amount: number;
  pending_payout: number;
  avg_rating: number;
  review_count: number;
  business_name?: string;
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
  reviews: any[];
}

export const FALLBACK_CUSTOMER_DASHBOARD: CustomerDashboardPayload = {
  stats: {
    total_orders: 5,
    active_orders: 2,
    completed_orders: 3,
    cancelled_orders: 0,
    pending_proposals: 1,
    upcoming_appointments: 2,
    next_upcoming_date: "Oct 12, 9:30 AM",
    pending_payment: 0,
    total_spent: 457.55,
  },
  recentBookings: [
    {
      id: 85,
      booking_number: "BK-20260916-TJMLPQA3",
      status: "finished",
      appointment_status: "Completed",
      payment_status: "paid",
      total_amount: 217.55,
      booking_date: "2026-09-16",
      service_category: "Electrical Wire Inspection & Panel Setup",
      provider: {
        id: 6,
        business_name: "Apex Electrical Solutions",
        rating: 4.9,
      },
    },
    {
      id: 86,
      booking_number: "BK-20260917-ABC86",
      status: "accepted",
      appointment_status: "Confirmed",
      payment_status: "paid",
      total_amount: 145.00,
      booking_date: "2026-09-17",
      service_category: "Deep Home Clean (3 Bedrooms)",
      provider: {
        id: 2,
        business_name: "BrightHome Cleaning Co.",
        rating: 4.8,
      },
    },
    {
      id: 87,
      booking_number: "BK-20260918-XYZ87",
      status: "pending",
      appointment_status: "Requested",
      payment_status: "pending",
      total_amount: 95.00,
      booking_date: "2026-09-18",
      service_category: "Drain Clearing & Pipe Leak Repair",
      provider: {
        id: 3,
        business_name: "ABC Plumbing Solutions",
        rating: 4.7,
      },
    }
  ],
  appointments: [
    {
      id: 101,
      booking_number: "BK-20260920-APT101",
      appointment_status: "Confirmed",
      status: "accepted",
      booking_date: "Oct 12, 2026",
      service_category: "Recessed Can Lighting Installation",
      total_amount: 180,
      time_slot: "9:30 AM - 11:30 AM",
      provider: {
        id: 6,
        business_name: "Apex Electrical Solutions",
        phone: "+1 305-555-0123",
      }
    },
    {
      id: 102,
      booking_number: "BK-20260921-APT102",
      appointment_status: "Scheduled",
      status: "pending",
      booking_date: "Oct 15, 2026",
      service_category: "Deep Home Maintenance Clean",
      total_amount: 145,
      time_slot: "2:00 PM - 5:00 PM",
      provider: {
        id: 2,
        business_name: "BrightHome Cleaning Co.",
        phone: "+1 305-555-0199",
      }
    }
  ],
  messages: [
    {
      chat_id: "c1",
      booking_id: 85,
      last_message: "Your electrical panel setup is completed cleanly!",
      last_message_time: "2026-09-17T10:30:00Z",
      provider: {
        id: 6,
        business_name: "Apex Electrical Solutions",
      }
    },
    {
      chat_id: "c2",
      booking_id: 86,
      last_message: "We will arrive at 10 AM tomorrow for your deep clean.",
      last_message_time: "2026-09-16T14:15:00Z",
      provider: {
        id: 2,
        business_name: "BrightHome Cleaning Co.",
      }
    }
  ],
  recommendedProviders: [
    {
      id: 6,
      business_name: "Apex Electrical Solutions",
      service_description: "Licensed electrician specializing in panel setup & wiring.",
      rating: 4.9,
      location: "Miami, FL",
      years_of_experience: 8,
      service_categories: "Electrical",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    },
    {
      id: 1,
      business_name: "Maria's Home & Cleaning Care",
      service_description: "Top-quality house cleaning and home management.",
      rating: 4.8,
      location: "Miami, FL",
      years_of_experience: 10,
      service_categories: "Cleaning",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    },
    {
      id: 2,
      business_name: "Fresh & Clean Co.",
      service_description: "Premium detailing and home care services.",
      rating: 4.6,
      location: "Miami, FL",
      years_of_experience: 6,
      service_categories: "Car Wash",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    }
  ]
};

export const FALLBACK_PROVIDER_DASHBOARD: ProviderDashboardPayload = {
  stats: {
    total_orders: 12,
    active_orders: 3,
    completed_orders: 9,
    cancelled_orders: 0,
    direct_service_orders: 2,
    request_quote_orders: 1,
    fixed_orders: 2,
    quote_orders: 1,
    total_amount: 1850.00,
    pending_payout: 420.00,
    avg_rating: 4.9,
    review_count: 14,
    business_name: "Apex Electrical Solutions",
  },
  jobs: [
    {
      id: 85,
      booking_number: "BK-20260916-TJMLPQA3",
      appointment_status: "Completed",
      status: "finished",
      payment_status: "paid",
      booking_date: "2026-09-16",
      service_category: "Electrical Wire Inspection & Panel Setup",
      total_amount: 217.55,
      customer: {
        id: 2,
        full_name: "Mr. Alonzo Raynor",
        phone: "9165474777",
      }
    },
    {
      id: 86,
      booking_number: "BK-20260917-ABC86",
      appointment_status: "Confirmed",
      status: "accepted",
      payment_status: "paid",
      booking_date: "2026-09-17",
      service_category: "Circuit Breaker Installation",
      total_amount: 145.00,
      customer: {
        id: 3,
        full_name: "Sarah Jenkins",
        phone: "3055550199",
      }
    },
    {
      id: 87,
      booking_number: "BK-20260918-XYZ87",
      appointment_status: "Requested",
      status: "pending",
      payment_status: "pending",
      booking_date: "2026-09-18",
      service_category: "Recessed Lighting & Dimmer Wiring",
      total_amount: 180.00,
      customer: {
        id: 4,
        full_name: "Marcus Vance",
        phone: "3055550244",
      }
    }
  ],
  appointments: [
    {
      id: 101,
      booking_number: "BK-20260920-APT101",
      appointment_status: "Confirmed",
      status: "accepted",
      booking_date: "Oct 12, 2026",
      service_category: "Electrical Panel Upgrade (200A)",
      total_amount: 250,
      time_slot: "9:30 AM - 12:30 PM",
      project_title: "Main Breaker Panel Replacement",
      customer: {
        id: 2,
        full_name: "Sarah Whitfield",
        phone: "+1 305-555-0123",
      }
    },
    {
      id: 102,
      booking_number: "BK-20260921-APT102",
      appointment_status: "In Progress",
      status: "in_process",
      booking_date: "Oct 14, 2026",
      service_category: "EV Charger Level 2 Circuit",
      total_amount: 320,
      time_slot: "2:00 PM - 5:00 PM",
      project_title: "Tesla Wall Connector Circuit Wiring",
      customer: {
        id: 3,
        full_name: "Daniel Ortiz",
        phone: "+1 305-555-0199",
      }
    }
  ],
  earnings: {
    gross_revenue: 1850.00,
    commission_paid: 277.50,
    net_earnings: 1572.50,
    settled_payouts: 1152.50,
    settled_payout_count: 3,
    pending_payout: 420.00,
    recent_payouts: [
      { id: "P-101", amount: 450.00, currency: "USD", status: "Paid", paid_at: "2026-09-10" },
      { id: "P-102", amount: 702.50, currency: "USD", status: "Paid", paid_at: "2026-09-03" }
    ]
  },
  reviews: [
    {
      id: 1,
      rating: 5,
      comment: "Jack did an amazing job on our home electrical wiring! Extremely professional, prompt, and neat.",
      customer: { full_name: "Alonzo Raynor" }
    },
    {
      id: 2,
      rating: 5,
      comment: "Fast diagnostic and clear pricing for the EV charger installation. Highly recommend!",
      customer: { full_name: "Sarah Jenkins" }
    }
  ]
};

// ─── CUSTOMER DASHBOARD APIS (Milestone 2 Static UI Insulation) ───
export const getCustomerDashboardApi = async () => {
  // Comment out network API call for M3-5 dashboard
  // return http.get<ApiSuccess<CustomerDashboardPayload>>(ENDPOINTS.userDashboard.root);
  return { data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD } } as any;
};

export const getCustomerStatsApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.stats } } as any);

export const getCustomerRecentBookingsApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.recentBookings } } as any);

export const getCustomerAppointmentsApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.appointments } } as any);

export const getCustomerMessagesApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.messages } } as any);

export const getRecommendedProvidersApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.recommendedProviders } } as any);

export const searchProvidersNearLocationApi = async () =>
  ({ data: { success: true, data: FALLBACK_CUSTOMER_DASHBOARD.recommendedProviders } } as any);

// ─── PROVIDER DASHBOARD APIS (Milestone 2 Static UI Insulation) ───
export const getProviderDashboardApi = async () => {
  // Comment out network API call for M3-5 dashboard
  // return http.get<ApiSuccess<ProviderDashboardPayload>>(ENDPOINTS.providerDashboard.root);
  return { data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD } } as any;
};

export const getProviderStatsApi = async () =>
  ({ data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD.stats } } as any);

export const getProviderJobsApi = async () =>
  ({ data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD.jobs } } as any);

export const getProviderAppointmentsApi = async () =>
  ({ data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD.appointments } } as any);

export const getProviderEarningsApi = async () =>
  ({ data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD.earnings } } as any);

export const getProviderReviewsApi = async () =>
  ({ data: { success: true, data: FALLBACK_PROVIDER_DASHBOARD.reviews } } as any);

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
  getProviderReviews: getProviderReviewsApi,
};
