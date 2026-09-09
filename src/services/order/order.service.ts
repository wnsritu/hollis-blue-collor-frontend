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

// Customer Order Details
export const updateOrderStatusApi = (data: any) => {
  return apiClient.post(`/order/update-status`, data);
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
export const updateOrderStatus = async (data: any) => {
  const res = await apiClient.post(`order/update-status`, data);
  return res.data;
};

export const updateBookingStatus = updateOrderStatus;
