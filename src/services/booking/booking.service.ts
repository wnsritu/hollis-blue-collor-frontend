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

export const normalizeToAppointmentStatus = (status?: string): string => {
  if (!status) return "Requested";
  const s = String(status).trim().toLowerCase().replace(/[-_]/g, " ");
  if (["requested", "pending", "pending review", "pending acceptance"].includes(s)) return "Requested";
  if (["confirmed", "accepted"].includes(s)) return "Confirmed";
  if (["en route", "enroute"].includes(s)) return "En Route";
  if (["arrived"].includes(s)) return "Arrived";
  if (["in progress", "inprocess", "progress"].includes(s)) return "In Progress";
  if (["rescheduled"].includes(s)) return "Rescheduled";
  if (["completed", "finished", "delivered"].includes(s)) return "Completed";
  if (["cancelled", "canceled", "rejected"].includes(s)) return "Cancelled";
  if (["no show", "noshow"].includes(s)) return "No-show";
  return status;
};

export const updateBookingStatusApi = (id: number, status: string) => {
  const norm = normalizeToAppointmentStatus(status);
  return apiClient.patch(`/appointments/${id}/status`, {
    appointment_status: norm,
    status: norm,
  });
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

  updateStatus: (id: number | string, payload: UpdateAppointmentStatusPayload) => {
    const raw = payload.appointment_status || payload.status;
    const norm = normalizeToAppointmentStatus(raw);
    return http.patch<ApiSuccess<Appointment>>(ENDPOINTS.appointment.status(id), {
      appointment_status: norm as any,
      status: norm as any,
    });
  },

  reschedule: (id: number | string, payload: RescheduleAppointmentPayload) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.reschedule(id), payload),

  confirmReschedule: (id: number | string) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.confirmReschedule(id)),
};
