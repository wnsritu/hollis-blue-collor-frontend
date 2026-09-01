import { getBookingsApi, updateBookingStatusApi } from "@/api/booking.api";

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

/**
 * Fetch bookings
 */
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

/**
 * Update booking status
 */
export const updateBookingStatus = async (id: number, status: string) => {
  const res = await updateBookingStatusApi(id, status);
  return res.data;
};
