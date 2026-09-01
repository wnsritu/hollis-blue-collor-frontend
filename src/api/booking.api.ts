import api from "./axios";

export const getBookingsApi = (data?: {
  page?: number;
  limit?: number;
  service_category?: string;
  // search?: string;
  // status?: string;
  // sortBy?: string;
  // sortOrder?: string;
}) => {
  return api.post("/booking/list", data || {});
};

// Optional: if you have an API for updating booking status
export const updateBookingStatusApi = (id: number, status: string) => {
  return api.put(`/booking/${id}/status`, { status });
};

export const getDashboardApi = () => {
  return api.post("/booking/dashboard");
};

export const getBookingById = (bookingId: number) => {
  return api.get(`/booking/${bookingId}`);
};