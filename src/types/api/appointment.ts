/** M3 Appointments (extends Booking) */

export type AppointmentStatus =
  | "Requested"
  | "Confirmed"
  | "Rescheduled"
  | "Completed"
  | "Cancelled"
  | "No-show";

export type Appointment = {
  id: number;
  customer_id: number;
  provider_id: number;
  project_id?: number | null;
  proposal_id?: number | null;
  booking_date?: string;
  time_slot_id?: number;
  total_amount?: number | string;
  status?: string;
  appointment_status?: AppointmentStatus | null;
  payment_status?: string;
  service_type_id?: number;
  reschedule_date?: string | null;
  reschedule_time_slot_id?: number | null;
  reschedule_requested_by?: number | null;
  [key: string]: unknown;
};

export type AppointmentListParams = {
  appointment_status?: AppointmentStatus | string;
  status?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
};

export type UpdateAppointmentStatusPayload = {
  appointment_status: AppointmentStatus;
  /** alias accepted by some callers */
  status?: AppointmentStatus;
};

export type RescheduleAppointmentPayload = {
  booking_date?: string;
  time_slot_id?: number | string;
};
