import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const orderApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.order.list, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.order.details(id)),
};

const FALLBACK_SEED_ORDERS = [
  {
    id: 85,
    order_id: "BK-20260916-TJMLPQA3",
    booking_number: "BK-20260916-TJMLPQA3",
    booking_type: "request_quote",
    status: "finished",
    appointment_status: "Completed",
    payment_status: "paid",
    total_amount: 217.55,
    booking_date: "2026-09-16",
    customer: {
      id: 2,
      first_name: "Alonzo",
      last_name: "Raynor",
      full_name: "Alonzo Raynor",
      email: "alonzo.raynor@example.com",
      phone: "3055550188",
      profile_image: null,
    },
    provider: {
      id: 6,
      user_id: 9,
      business_name: "Apex Electrical Solutions",
      service_location_address: "100 Biscayne Blvd, Miami, FL",
    },
    provider_name: "Apex Electrical Solutions",
    items: [
      { id: 1, name: "Electrical Wire Inspection & Panel Setup", price: 180.00, quantity: 1 },
      { id: 2, name: "Circuit Breaker Installation", price: 37.55, quantity: 1 }
    ]
  },
  {
    id: 86,
    order_id: "ORD-086",
    booking_number: "BK-20260917-ABC86",
    booking_type: "fixed_price",
    status: "accepted",
    appointment_status: "Confirmed",
    payment_status: "paid",
    total_amount: 145.00,
    booking_date: "2026-09-17",
    customer: {
      id: 3,
      first_name: "Sarah",
      last_name: "Jenkins",
      full_name: "Sarah Jenkins",
      email: "sarah.j@example.com",
      phone: "3055550199",
      profile_image: null,
    },
    provider: {
      id: 2,
      user_id: 5,
      business_name: "BrightHome Cleaning Co.",
      service_location_address: "123 Main St, Miami, FL",
    },
    provider_name: "BrightHome Cleaning Co.",
    items: [
      { id: 1, name: "Deep Home Clean (3 Bedrooms)", price: 145.00, quantity: 1 }
    ]
  },
  {
    id: 87,
    order_id: "ORD-087",
    booking_number: "BK-20260918-XYZ87",
    booking_type: "hourly",
    status: "pending",
    appointment_status: "Requested",
    payment_status: "pending",
    total_amount: 95.00,
    booking_date: "2026-09-18",
    customer: {
      id: 4,
      first_name: "Marcus",
      last_name: "Vance",
      full_name: "Marcus Vance",
      email: "marcus.v@example.com",
      phone: "3055550244",
      profile_image: null,
    },
    provider: {
      id: 3,
      user_id: 7,
      business_name: "ABC Plumbing Solutions",
      service_location_address: "456 Oak Ave, Miami, FL",
    },
    provider_name: "ABC Plumbing Solutions",
    items: [
      { id: 1, name: "Drain Clearing & Pipe Repair", price: 95.00, quantity: 1 }
    ]
  },
  {
    id: 88,
    order_id: "ORD-088",
    booking_number: "BK-20260919-DEF88",
    booking_type: "fixed_price",
    status: "in_process",
    appointment_status: "In Progress",
    payment_status: "paid",
    total_amount: 320.00,
    booking_date: "2026-09-19",
    customer: {
      id: 5,
      first_name: "Elena",
      last_name: "Rostova",
      full_name: "Elena Rostova",
      email: "elena.r@example.com",
      phone: "3055550388",
      profile_image: null,
    },
    provider: {
      id: 4,
      user_id: 8,
      business_name: "Pro HVAC Specialists",
      service_location_address: "789 Pine St, Miami, FL",
    },
    provider_name: "Pro HVAC Specialists",
    items: [
      { id: 1, name: "AC Maintenance & Duct Cleaning", price: 320.00, quantity: 1 }
    ]
  }
];

// Customer Orders(Booking) List - Zero Network Call Fallback for Milestone 2 Demo
export const getOrderList = async (data?: any) => {
  let filtered = [...FALLBACK_SEED_ORDERS];
  if (data?.status && data.status !== "all") {
    filtered = filtered.filter((o) => o.status.toLowerCase() === data.status.toLowerCase());
  }
  if (data?.search && String(data.search).trim()) {
    const q = String(data.search).toLowerCase().trim();
    filtered = filtered.filter(
      (o) =>
        o.order_id.toLowerCase().includes(q) ||
        o.customer.full_name.toLowerCase().includes(q) ||
        o.provider.business_name.toLowerCase().includes(q)
    );
  }
  return {
    data: {
      success: true,
      message: "Data fetched successfully",
      bookings: filtered,
      total: filtered.length,
      total_pages: 1,
      current_page: 1,
    },
  };
};

// Customer Order Details - Zero Network Call Fallback
export const getOrderDetails = async (id: any) => {
  const found = FALLBACK_SEED_ORDERS.find((o) => String(o.id) === String(id)) || FALLBACK_SEED_ORDERS[0];
  return {
    data: {
      success: true,
      message: "Data fetched successfully",
      data: found,
    },
  };
};

export const getRatingByBookingId = async (id: any) => {
  return {
    data: {
      success: true,
      data: {
        rating: 5,
        comment: "High-quality professional service! Arrived promptly on time and resolved the issue efficiently.",
        customer: { first_name: "Alonzo", last_name: "Raynor" },
      },
    },
  };
};

const normalizeStatus = (status?: string): string => {
  if (!status) return "Requested";
  const s = String(status).trim().toLowerCase().replace(/[-_]/g, " ");
  if (["requested", "pending", "pending review", "pending acceptance", "price updated"].includes(s)) return "Requested";
  if (["confirmed", "accepted"].includes(s)) return "Confirmed";
  if (["en route", "enroute"].includes(s)) return "En Route";
  if (["arrived"].includes(s)) return "Arrived";
  if (["in progress", "inprocess", "progress"].includes(s)) return "In Progress";
  if (["rescheduled"].includes(s)) return "Rescheduled";
  if (["completed", "finished", "delivered"].includes(s)) return "Completed";
  if (["cancelled", "canceled", "rejected", "expired", "payment failed"].includes(s)) return "Cancelled";
  if (["no show", "noshow"].includes(s)) return "No-show";
  return status;
};

// Rebound to real M3 Appointment Status Endpoint
export const updateOrderStatusApi = (data: any, statusArg?: any) => {
  const bookingId = typeof data === "object" ? (data?.booking_id || data?.id) : data;
  const rawStatus = typeof data === "object" ? (data?.appointment_status || data?.status) : statusArg;
  const norm = normalizeStatus(rawStatus);
  return apiClient.patch(`/appointments/${bookingId}/status`, {
    appointment_status: norm,
    status: norm,
    reason: typeof data === "object" ? data?.reason : undefined,
  });
};

export const getDisputeDetail = (data: any) => {
  return apiClient.post(`/disputes/details`, data);
};

export const getBookingPaymentSummary = () => {
  return apiClient.get(`/provider/provider-earning`);
};

// Get all provider orders
export const getProviderOrders = async (page = 1) => {
  const res = await apiClient.get(`/provider/orders?page=${page}`);
  return res.data;
};

// Get single order detail
export const getOrderDetail = async (id: number) => {
  const res = await apiClient.get(`/provider/orders/${id}`);
  return res.data;
};

// Get booking by ID
export const getBookinById = async (id: any) => {
  const res = await apiClient.get(`/booking/${id}`);
  return res.data;
};

// Update order status
export const updateOrderStatus = async (data: any, statusArg?: string) => {
  const payload = typeof data === "object" ? data : { booking_id: data, status: statusArg };
  const res = await updateOrderStatusApi(payload);
  return res.data;
};

export const updateBookingStatus = updateOrderStatus;
