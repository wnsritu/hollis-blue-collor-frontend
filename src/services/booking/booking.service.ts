import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  Appointment,
  AppointmentListParams,
  RescheduleAppointmentPayload,
  UpdateAppointmentStatusPayload,
} from "@/types/api/appointment";

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface Booking {
  id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  booking_date: string;
  customer?: Customer;
  customer_phone?: string;
  items?: any[];
  service_type_id?: number;
  service_category?: string;
}

export interface BookingResponse {
  success: boolean;
  total: number;
  current_page: number;
  total_pages: number;
  per_page: number;
  bookings: Booking[];
}

export const getBookingsApi = (data?: {
  page?: number;
  limit?: number;
  service_category?: string;
}) => {
  return apiClient.post("/booking/list", data || {});
};

export const updateBookingStatusApi = (id: number, status: string) => {
  return apiClient.put(`/booking/${id}/status`, { status });
};

export const getDashboardApi = () => {
  return apiClient.post("/booking/dashboard");
};

export const getBookingById = (bookingId: number) => {
  return apiClient.get(`/booking/${bookingId}`);
};

export const fetchBookings = async (
  page = 1,
  limit = 10,
  service_category?: string,
): Promise<BookingResponse> => {
  const data: any = { page, limit };
  if (service_category && service_category !== "All") {
    data.service_category = service_category;
  }
  const res = await getBookingsApi(data);
  return res.data;
};

export const updateBookingStatus = async (id: number, status: string) => {
  const res = await updateBookingStatusApi(id, status);
  return res.data;
};

export const bookingApi = {
  add: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.add, payload),

  list: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.list, payload),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.booking.details(id)),

  update: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.booking.edit(id), payload),

  updateStatus: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.booking.updateStatus(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.booking.delete(id)),

  updatePrice: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.updatePrice, payload),

  dashboard: (payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.booking.dashboard, payload),
};

export const appointmentApi = {
  listMine: (params?: AppointmentListParams) =>
    http.get<ApiSuccess<Appointment[]>>(ENDPOINTS.appointment.me, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess<Appointment>>(ENDPOINTS.appointment.byId(id)),

  updateStatus: (id: number | string, payload: UpdateAppointmentStatusPayload) =>
    http.patch<ApiSuccess<Appointment>>(ENDPOINTS.appointment.status(id), {
      appointment_status: payload.appointment_status || payload.status,
      status: payload.status || payload.appointment_status,
    }),

  reschedule: (id: number | string, payload: RescheduleAppointmentPayload) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.reschedule(id), payload),

  confirmReschedule: (id: number | string) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.confirmReschedule(id)),
};
