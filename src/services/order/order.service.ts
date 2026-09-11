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

// Customer Orders(Booking) List
export const getOrderList = (data: any) => {
  return apiClient.post("/booking/list", data);
};

// Customer Order Details
export const getOrderDetails = (id: any) => {
  return apiClient.get(`/booking/${id}`);
};

export const getRatingByBookingId = (id: any) => {
  return apiClient.get(`/ratings/booking-ratings/${id}`);
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
export const updateOrderStatusApi = (data: any) => {
  const bookingId = typeof data === "object" ? (data?.booking_id || data?.id) : data;
  const rawStatus = typeof data === "object" ? (data?.appointment_status || data?.status) : arguments[1];
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
