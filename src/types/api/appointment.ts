/** M3 Appointments (extends Booking & BookingSerializer output) */

export type AppointmentStatus =
  | "Requested"
  | "Confirmed"
  | "Rescheduled"
  | "En Route"
  | "Arrived"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No-show"
  | string;

export interface AppointmentCustomer {
  id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  profile_image?: string | null;
  addresses?: Array<{ address_line?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface AppointmentProvider {
  id: number;
  user_id?: number;
  business_name?: string;
  service_location_address?: string;
  city?: string;
  state?: string;
  rating?: number;
  verified?: string;
  status?: string;
  user?: {
    full_name?: string;
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AppointmentServiceItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  [key: string]: unknown;
}

export interface AppointmentServiceMeta {
  category_name?: string;
  service_type?: {
    id: number;
    name: string;
    description?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface AppointmentSchedule {
  date?: string | null;
  time_slot?: {
    id: number;
    name?: string;
    slot_name?: string;
    start_time?: string | null;
    end_time?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface AppointmentServiceAddress {
  address?: string;
  [key: string]: unknown;
}

export interface AppointmentPricing {
  subtotal: number;
  service_fee: number;
  total: number;
  currency?: string;
  [key: string]: unknown;
}

export interface AppointmentPayment {
  id?: number | null;
  payment_status: string;
  amount: number;
  currency?: string;
  payment_method_type?: string | null;
  receipt_url?: string | null;
  payment_date?: string | null;
  [key: string]: unknown;
}

export interface AppointmentReschedule {
  requested: boolean;
  requested_by?: string | number | null;
  date?: string | null;
  time_slot_id?: number | null;
  [key: string]: unknown;
}

export interface AppointmentDispute {
  is_disputed: boolean;
  status: string;
  deadline_at?: string | null;
  [key: string]: unknown;
}

export type Appointment = {
  id: number;
  booking_number?: string | null;
  booking_type?: "direct_service" | "request_quote" | string;
  status?: string;
  appointment_status?: AppointmentStatus | null;

  // New BookingSerializer nested domain structures
  customer?: AppointmentCustomer | null;
  provider?: AppointmentProvider | null;
  service?: AppointmentServiceMeta | null;
  services?: AppointmentServiceItem[];
  schedule?: AppointmentSchedule | null;
  service_address?: AppointmentServiceAddress | null;
  pricing?: AppointmentPricing | null;
  payment?: AppointmentPayment | null;
  reschedule?: AppointmentReschedule | null;
  dispute?: AppointmentDispute | null;
  notes?: string | null;

  // Legacy / Direct database fields (supported for backward compatibility)
  customer_id?: number;
  provider_id?: number;
  project_id?: number | null;
  proposal_id?: number | null;
  booking_date?: string;
  time_slot_id?: number;
  total_amount?: number | string;
  payment_status?: string;
  service_type_id?: number;
  service_category?: string;
  pickup_address?: string;
  delivery_address?: string;
  address?: string;
  description?: string;
  reschedule_date?: string | null;
  reschedule_time_slot_id?: number | null;
  reschedule_requested_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  proposed_date?: string;
  time_slot_id?: number | string;
  reason?: string;
  [key: string]: unknown;
};
