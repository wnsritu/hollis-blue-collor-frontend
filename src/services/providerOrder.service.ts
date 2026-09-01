import api from "@/api/axios";

// Get all provider orders
export const getProviderOrders = async (page = 1) => {
  const res = await api.get(`/provider/orders?page=${page}`);
  return res.data;
};

// Get single order detail
export const getOrderDetail = async (id: number) => {
  const res = await api.get(`/provider/orders/${id}`);
  return res.data;
};

// Get booking by ID
export const  getBookinById = async (id: any) => {
  const res = await api.get(`/booking/${id}`);
  return res.data;
};

// Update order status
export const  updateBookingStatus = async (data: any) => {
  const res = await api.post(`order/update-status`, data);
  return res.data;
};