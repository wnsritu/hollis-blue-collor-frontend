import api from "@/api/axios";

// Customer Orders(Booking) List
export const getOrderList = (data: any) => {
  return api.post("/booking/list", data);
};

// Customer Order Details
export const getOrderDetails = (id: any) => {
  return api.get(`/booking/${id}`);
};

export const getRatingByBookingId = (id: any) => {
  return api.get(`/ratings/booking-ratings/${id}`);
};

// Customer Order Details
export const updateOrderStatus = (data: any) => {
  return api.post(`/order/update-status`, data);
};

export const getDisputeDetail = (data: any) => {
  return api.post(`/disputes/details`, data);
};

export const getBookingPaymentSummary = () => {
  return api.get(`/provider/provider-earning`);
};
