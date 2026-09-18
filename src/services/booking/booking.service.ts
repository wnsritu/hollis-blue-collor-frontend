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

const FALLBACK_SEED_BOOKINGS: any[] = [
  {
    id: 1001,
    booking_number: "BK-2026-8801",
    status: "in_progress",
    appointment_status: "In Progress",
    total_amount: 350.0,
    payment_status: "escrow_held",
    booking_date: "2026-09-17",
    start_time: "10:00 AM",
    end_time: "01:00 PM",
    service_category: "Electrical",
    service_type: "Electrical Panel Inspection & Upgrade",
    job_type: "fixed",
    customer: { id: 101, first_name: "Sarah", last_name: "Whitfield", full_name: "Sarah Whitfield", phone: "(305) 555-0199", email: "sarah.whitfield@example.com" },
    provider: { id: 201, name: "Apex Electrical Solutions", business_name: "Apex Electrical Solutions" },
    address_line: "1420 Brickell Ave",
    city: "Miami",
    state: "FL",
    zip_code: "33131",
    notes: "Panel tripping under full load. Please inspect main breaker.",
    items: [{ id: 1, name: "200A Main Panel Replacement & Inspection", price: 350.0 }],
  },
  {
    id: 1002,
    booking_number: "BK-2026-8802",
    status: "confirmed",
    appointment_status: "Confirmed",
    total_amount: 220.0,
    payment_status: "escrow_held",
    booking_date: "2026-09-18",
    start_time: "02:00 PM",
    end_time: "04:00 PM",
    service_category: "Plumbing",
    service_type: "Emergency Plumbing & Water Leak Repair",
    job_type: "quote",
    customer: { id: 102, first_name: "Alonzo", last_name: "Raynor", full_name: "Alonzo Raynor", phone: "(916) 547-4777", email: "alonzo.raynor@example.com" },
    provider: { id: 202, name: "Premier Plumbing & Drainage", business_name: "Premier Plumbing & Drainage" },
    address_line: "850 Ocean Dr",
    city: "Miami",
    state: "FL",
    zip_code: "33139",
    notes: "Kitchen pipe joint leak repair.",
    items: [{ id: 1, name: "Leak Detection & Pipe Fitting Replacement", price: 220.0 }],
  },
  {
    id: 1003,
    booking_number: "BK-2026-8803",
    status: "completed",
    appointment_status: "Completed",
    total_amount: 180.0,
    payment_status: "paid",
    booking_date: "2026-09-15",
    start_time: "09:00 AM",
    end_time: "12:00 PM",
    service_category: "Cleaning",
    service_type: "Deep Office Cleaning & Sanitation",
    job_type: "fixed",
    customer: { id: 101, first_name: "Sarah", last_name: "Whitfield", full_name: "Sarah Whitfield", phone: "(305) 555-0199", email: "sarah.whitfield@example.com" },
    provider: { id: 203, name: "BrightHome Cleaning Co.", business_name: "BrightHome Cleaning Co." },
    address_line: "500 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    zip_code: "33132",
    notes: "Deep clean carpet and windows.",
    items: [{ id: 1, name: "Office Carpet Steam & Window Wash", price: 180.0 }],
  },
];

export const getBookingsApi = (_data?: any) => {
  return Promise.resolve({
    data: {
      success: true,
      total: FALLBACK_SEED_BOOKINGS.length,
      current_page: 1,
      total_pages: 1,
      per_page: 10,
      bookings: FALLBACK_SEED_BOOKINGS,
    },
  });
};

export const normalizeToAppointmentStatus = (status?: string): string => {
  if (!status) return "Requested";
  const s = String(status).trim().toLowerCase().replace(/[-_]/g, " ");
  if (["requested", "pending", "pending review", "pending acceptance", "price updated", "price_updated"].includes(s)) return "Requested";
  if (["confirmed", "accepted"].includes(s)) return "Confirmed";
  if (["en route", "enroute"].includes(s)) return "En Route";
  if (["arrived"].includes(s)) return "Arrived";
  if (["in progress", "inprocess", "progress", "in process"].includes(s)) return "In Progress";
  if (["rescheduled"].includes(s)) return "Rescheduled";
  if (["completed", "finished", "delivered"].includes(s)) return "Completed";
  if (["cancelled", "canceled", "rejected", "expired", "payment failed", "payment_failed"].includes(s)) return "Cancelled";
  if (["no show", "noshow"].includes(s)) return "No-show";
  return status;
};

export const updateBookingStatusApi = (id: number, status: string) => {
  const norm = normalizeToAppointmentStatus(status);
  return Promise.resolve({
    data: {
      status: "success",
      data: { ...FALLBACK_SEED_BOOKINGS[0], id, status: norm, appointment_status: norm },
    },
  });
};

export const getDashboardApi = () => {
  return Promise.resolve({
    data: {
      total_bookings: FALLBACK_SEED_BOOKINGS.length,
      active_jobs: 1,
      completed_jobs: 1,
      pending_jobs: 1,
    },
  });
};

export const getBookingById = (bookingId: number) => {
  const b = FALLBACK_SEED_BOOKINGS.find((x) => Number(x.id) === Number(bookingId)) || FALLBACK_SEED_BOOKINGS[0];
  return Promise.resolve({ data: { status: "success", data: b } });
};

export const fetchBookings = async (
  page = 1,
  limit = 10,
  _service_category?: string,
): Promise<BookingResponse> => {
  return {
    success: true,
    total: FALLBACK_SEED_BOOKINGS.length,
    current_page: page,
    total_pages: 1,
    per_page: limit,
    bookings: FALLBACK_SEED_BOOKINGS,
  };
};

export const updateBookingStatus = async (id: number, status: string) => {
  const norm = normalizeToAppointmentStatus(status);
  return { ...FALLBACK_SEED_BOOKINGS[0], id, status: norm, appointment_status: norm };
};

export const bookingApi = {
  add: (payload: Record<string, unknown> | FormData) => {
    const newB = {
      id: Date.now(),
      booking_number: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "confirmed",
      appointment_status: "Confirmed",
      total_amount: 150.0,
      payment_status: "escrow_held",
      booking_date: new Date().toISOString().split("T")[0],
    };
    return Promise.resolve({ status: "success", data: newB } as ApiSuccess);
  },

  list: (_payload?: Record<string, unknown>) =>
    Promise.resolve({
      status: "success",
      data: {
        bookings: FALLBACK_SEED_BOOKINGS,
        total: FALLBACK_SEED_BOOKINGS.length,
      },
      bookings: FALLBACK_SEED_BOOKINGS,
    } as unknown as ApiSuccess),

  getById: (id: number | string) => {
    const b = FALLBACK_SEED_BOOKINGS.find((x) => String(x.id) === String(id)) || FALLBACK_SEED_BOOKINGS[0];
    return Promise.resolve({ status: "success", data: b } as ApiSuccess);
  },

  update: (id: number | string, payload: Record<string, unknown>) => {
    const b = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), ...payload };
    return Promise.resolve({ status: "success", data: b } as ApiSuccess);
  },

  updateStatus: (id: number | string, payload: Record<string, unknown>) => {
    const raw = (payload.appointment_status || payload.status) as string;
    const norm = normalizeToAppointmentStatus(raw);
    const b = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), status: norm, appointment_status: norm };
    return Promise.resolve({ status: "success", data: b } as ApiSuccess);
  },

  remove: (_id: number | string) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  updatePrice: (_payload: Record<string, unknown>) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  dashboard: (_payload?: Record<string, unknown>) =>
    Promise.resolve({
      status: "success",
      data: {
        total_bookings: 3,
        active_jobs: 1,
        completed_jobs: 1,
      },
    } as ApiSuccess),
};

export const appointmentApi = {
  listMine: (_params?: AppointmentListParams) =>
    Promise.resolve({
      status: "success",
      data: FALLBACK_SEED_BOOKINGS as unknown as Appointment[],
    } as ApiSuccess<Appointment[]>),

  getById: (id: number | string) => {
    const apt = FALLBACK_SEED_BOOKINGS.find((x) => String(x.id) === String(id)) || FALLBACK_SEED_BOOKINGS[0];
    return Promise.resolve({
      status: "success",
      data: apt as unknown as Appointment,
    } as ApiSuccess<Appointment>);
  },

  updateStatus: (id: number | string, payload: UpdateAppointmentStatusPayload) => {
    const raw = payload.appointment_status || payload.status;
    const norm = normalizeToAppointmentStatus(raw);
    const apt = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), status: norm, appointment_status: norm };
    return Promise.resolve({
      status: "success",
      data: apt as unknown as Appointment,
    } as ApiSuccess<Appointment>);
  },

  reschedule: (id: number | string, _payload: RescheduleAppointmentPayload) => {
    const apt = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), status: "rescheduled" };
    return Promise.resolve({
      status: "success",
      data: apt as unknown as Appointment,
    } as ApiSuccess<Appointment>);
  },

  confirmReschedule: (id: number | string) => {
    const apt = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), status: "confirmed" };
    return Promise.resolve({
      status: "success",
      data: apt as unknown as Appointment,
    } as ApiSuccess<Appointment>);
  },

  rejectReschedule: (id: number | string) => {
    const apt = { ...FALLBACK_SEED_BOOKINGS[0], id: Number(id), status: "rejected" };
    return Promise.resolve({
      status: "success",
      data: apt as unknown as Appointment,
    } as ApiSuccess<Appointment>);
  },

  getHistory: (_id: number | string) =>
    Promise.resolve({ status: "success", data: [] } as ApiSuccess<any[]>),
};

