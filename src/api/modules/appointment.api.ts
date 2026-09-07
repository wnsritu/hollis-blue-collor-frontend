import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  Appointment,
  AppointmentListParams,
  RescheduleAppointmentPayload,
  UpdateAppointmentStatusPayload,
} from "@/types/api/appointment";

/**
 * M3 Appointments — marketplace lifecycle on Booking.
 * Status values: Requested | Confirmed | Rescheduled | Completed | Cancelled | No-show
 */
export const appointmentApi = {
  listMine: (params?: AppointmentListParams) =>
    http.get<ApiSuccess<Appointment[]>>(ENDPOINTS.appointment.me, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess<Appointment>>(ENDPOINTS.appointment.byId(id)),

  updateStatus: (id: number | string, payload: UpdateAppointmentStatusPayload) =>
    http.put<ApiSuccess<Appointment>>(ENDPOINTS.appointment.status(id), payload),

  reschedule: (id: number | string, payload: RescheduleAppointmentPayload) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.reschedule(id), payload),

  confirmReschedule: (id: number | string) =>
    http.post<ApiSuccess<Appointment>>(ENDPOINTS.appointment.confirmReschedule(id)),
};

export default appointmentApi;
