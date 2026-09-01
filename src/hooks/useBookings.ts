import { useState, useEffect, useCallback, useRef } from "react";
import {
  Booking,
  fetchBookings,
  updateBookingStatus,
} from "@/services/booking.service";

export const useBookings = (perPage = 10, serviceCategory = "All") => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(
    async (page: number, category = serviceCategory) => {
      setLoading(true);
      try {
        const res = await fetchBookings(page, perPage, category);
        if (res.success) {
          setBookings(res.bookings || []);
          setTotalPages(res.total_pages || 1);
        } else {
          setBookings([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching provider bookings:", error);
        setBookings([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [perPage, serviceCategory]
  );

  const changeStatus = async (id: number, status: string) => {
    try {
      await updateBookingStatus(id, status);

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const prevCategoryRef = useRef(serviceCategory);

  useEffect(() => {
    if (prevCategoryRef.current !== serviceCategory) {
      prevCategoryRef.current = serviceCategory;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }
    loadBookings(currentPage, serviceCategory);
  }, [currentPage, serviceCategory, loadBookings]);

  return {
    bookings,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    changeStatus,
    fetchBookings,
    loadBookings,
  };
};
