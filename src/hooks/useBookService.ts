import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getProviderData,
  getTimeSlots,
  addProviderBookApi,
  getProviderAvailabilityByProviderIdApi,
} from "@/services/provider";
import { useAuthSession } from "@/hooks/useAuth";
import type {
  OfferedService,
  SelectedItem,
  CustomerBookingDetails,
} from "@/types/booking.types";
import { getUpcomingDays } from "@/utils/date";

const getUpcomingDates = (daysCount = 14) => getUpcomingDays(daysCount);

export const formatSlotLabel = (s: any) => {
  if (s?.start_time && s?.end_time) {
    const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(":");
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    };
    return `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`;
  }
  return s?.slot_name || (s?.id ? `Slot ${s.id}` : "");
};

export function useBookService() {
  const { providerId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const serviceIdParam = searchParams.get("serviceId");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthSession();

  const [provider, setProvider] = useState<any>(null);
  const [offeredServices, setOfferedServices] = useState<OfferedService[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [providerSchedule, setProviderSchedule] = useState<Record<string, number[]> | null>(null);
  const [loading, setLoading] = useState(true);

  // Stepper step state (0, 1, 2)
  const [step, setStep] = useState(0);

  // Cart state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Dates & Time slot selection
  const dates = getUpcomingDates(14);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  const [selectedTimeSlotLabel, setSelectedTimeSlotLabel] = useState<string>("");

  // Customer details form
  const [details, setDetails] = useState<CustomerBookingDetails>({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: (user?.address as string) || "",
    city: (user?.city as string) || "",
    zip: (user?.zip_code as string) || "",
    notes: "",
  });

  // Quote modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // Booking completion / Payment state
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Provider Data, Time Slots & Availability Schedule
  useEffect(() => {
    const fetchData = async () => {
      if (!providerId) return;
      try {
        setLoading(true);
        const [provRes, slotRes, availRes] = await Promise.all([
          getProviderData({ id: providerId }).catch(() => null),
          getTimeSlots().catch(() => null),
          getProviderAvailabilityByProviderIdApi(providerId).catch(() => null),
        ]);

        const provData = provRes?.data?.data || provRes?.data || null;
        if (provData) {
          setProvider(provData);
          setDetails((prev) => ({
            ...prev,
            city: provData.city || prev.city,
            zip: provData.zip_code || prev.zip,
          }));

          let servicesList: OfferedService[] = [];
          if (provData.service_pricing) {
            try {
              const pricingMap =
                typeof provData.service_pricing === "string"
                  ? JSON.parse(provData.service_pricing)
                  : provData.service_pricing;

              if (pricingMap && typeof pricingMap === "object") {
                servicesList = Object.entries(pricingMap)
                  .filter(([_, config]: [string, any]) => config?.offered === true)
                  .map(([name, config]: [string, any], idx) => ({
                    id: `svc_${idx + 1}`,
                    name,
                    description: (config.description as string) || `${name} performed by ${provData.business_name || "Professional"}.`,
                    price: Number(config.price) || 100,
                    unit: (config.unit as string) || "flat rate",
                  }));
              }
            } catch (e) {
              console.error("Error parsing service_pricing:", e);
            }
          }

          if (servicesList.length === 0 && provData.offered_services) {
            let rawOffered = provData.offered_services;
            if (typeof rawOffered === "string") {
              try {
                rawOffered = JSON.parse(rawOffered);
              } catch {}
            }
            if (Array.isArray(rawOffered)) {
              servicesList = rawOffered.map((name: any, idx) => ({
                id: `svc_${idx + 1}`,
                name: typeof name === "string" ? name : name?.name || String(name),
                description: `Service performed by ${provData.business_name || "Professional"}.`,
                price: 100,
                unit: "flat rate",
              }));
            }
          }

          if (servicesList.length === 0) {
            const mainSvcName = provData.service_type?.name || provData.category?.name || "Professional Service";
            servicesList = [
              {
                id: "svc_default_1",
                name: mainSvcName,
                description: `Standard ${mainSvcName} provided by ${provData.business_name || "Professional"}.`,
                price: 120,
                unit: "flat rate",
              },
            ];
          }

          setOfferedServices(servicesList);

          let initialSvc = servicesList[0];
          if (serviceIdParam) {
            const matched = servicesList.find(
              (s) => s.id === serviceIdParam || s.name.toLowerCase() === serviceIdParam.toLowerCase()
            );
            if (matched) initialSvc = matched;
          }

          if (initialSvc) {
            setSelectedItems([
              {
                id: initialSvc.id,
                name: initialSvc.name,
                description: initialSvc.description,
                price: initialSvc.price,
                qty: 1,
                unit: initialSvc.unit,
              },
            ]);
          } else {
            setSelectedItems([]);
          }
        }

        const availPayload = availRes?.data?.data || availRes?.data || availRes;
        const availabilityMap = availPayload?.availability;
        const recordsList = Array.isArray(availPayload?.records)
          ? availPayload.records
          : Array.isArray(availPayload)
          ? availPayload
          : null;

        let activeSchedule: Record<string, number[]> | null = null;

        const normalizeDay = (dayStr: string) => {
          if (!dayStr) return "";
          const lower = dayStr.trim().toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        };

        const scheduleTemp: Record<string, number[]> = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        };

        let totalConfiguredSlots = 0;

        if (availabilityMap && typeof availabilityMap === "object") {
          Object.entries(availabilityMap).forEach(([day, ids]: [string, any]) => {
            const dayName = normalizeDay(day);
            if (Array.isArray(ids) && scheduleTemp[dayName] !== undefined) {
              scheduleTemp[dayName] = ids.map(Number);
              totalConfiguredSlots += ids.length;
            }
          });
        } else if (recordsList && Array.isArray(recordsList)) {
          recordsList.forEach((rec: any) => {
            const day = normalizeDay(rec.day_of_week);
            if (day && scheduleTemp[day] !== undefined && rec.time_slot_id) {
              scheduleTemp[day].push(Number(rec.time_slot_id));
              totalConfiguredSlots++;
            }
          });
        }

        if (totalConfiguredSlots > 0) {
          activeSchedule = scheduleTemp;
        } else {
          activeSchedule = null;
        }

        setProviderSchedule(activeSchedule);

        const slotsData = slotRes?.data?.slots || slotRes?.data?.data || slotRes?.data || (Array.isArray(slotRes) ? slotRes : []);
        let loadedSlots = [];
        if (Array.isArray(slotsData) && slotsData.length > 0) {
          loadedSlots = slotsData;
        } else {
          loadedSlots = [
            { id: 1, slot_name: "Morning", start_time: "06:00:00", end_time: "10:00:00" },
            { id: 2, slot_name: "Midday", start_time: "10:00:00", end_time: "14:00:00" },
            { id: 3, slot_name: "Afternoon", start_time: "14:00:00", end_time: "18:00:00" },
            { id: 4, slot_name: "Evening", start_time: "18:00:00", end_time: "22:00:00" },
          ];
        }
        setTimeSlots(loadedSlots);

        const firstAvailableDate = dates.find((d) => {
          if (!activeSchedule) return true;
          const slotsForDay = activeSchedule[d.dayOfWeekLong] || [];
          return slotsForDay.length > 0;
        });

        const initialDateIso = firstAvailableDate?.iso || dates[0]?.iso || "";
        setSelectedDate(initialDateIso);

        const initialDayName = firstAvailableDate?.dayOfWeekLong || dates[0]?.dayOfWeekLong || "";
        const initialActiveSlotIds = activeSchedule ? activeSchedule[initialDayName] || [] : null;
        const validSlotsForInitialDay = initialActiveSlotIds
          ? loadedSlots.filter((s: any) => initialActiveSlotIds.includes(Number(s.id)))
          : loadedSlots;

        if (validSlotsForInitialDay.length > 0) {
          setSelectedTimeSlotId(Number(validSlotsForInitialDay[0].id));
          setSelectedTimeSlotLabel(formatSlotLabel(validSlotsForInitialDay[0]));
        }
      } catch (err) {
        console.error("FETCH BOOKING DATA ERROR:", err);
        toast.error("Failed to load provider booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [providerId, serviceIdParam]);

  useEffect(() => {
    if (!selectedDate || !timeSlots.length) return;
    const currentDayLong = dates.find((d) => d.iso === selectedDate)?.dayOfWeekLong || "";
    const activeSlotIds = providerSchedule ? providerSchedule[currentDayLong] || [] : null;

    const availableForDate = activeSlotIds
      ? timeSlots.filter((s) => activeSlotIds.includes(Number(s.id)))
      : timeSlots;

    if (availableForDate.length > 0) {
      if (!selectedTimeSlotId || !availableForDate.some((s) => Number(s.id) === selectedTimeSlotId)) {
        setSelectedTimeSlotId(Number(availableForDate[0].id));
        setSelectedTimeSlotLabel(formatSlotLabel(availableForDate[0]));
      }
    } else {
      setSelectedTimeSlotId(null);
      setSelectedTimeSlotLabel("");
    }
  }, [selectedDate, providerSchedule, timeSlots]);

  const updateQty = (id: string | number, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = (item.qty || 1) + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const addItem = (svc: OfferedService) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === svc.id);
      if (existing) {
        return prev.map((i) => (i.id === svc.id ? { ...i, qty: (i.qty || 1) + 1 } : i));
      }
      return [
        ...prev,
        {
          id: svc.id,
          name: svc.name,
          description: svc.description,
          price: svc.price ?? 0,
          qty: 1,
          unit: svc.unit,
        },
      ];
    });
    toast.success(`${svc.name} added to booking.`);
  };

  const removeItem = (id: string | number) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);
  const serviceFee = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + serviceFee;

  const selectedDateObj = dates.find((d) => d.iso === selectedDate);
  const unselectedServices = offeredServices.filter((svc) => !selectedItems.some((item) => item.id === svc.id));

  const handleProceedToStep2 = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one service to proceed.");
      return;
    }
    setStep(1);
  };

  const handleProceedToStep3 = () => {
    if (!selectedDate) {
      toast.error("Please select a date.");
      return;
    }
    if (!selectedTimeSlotId) {
      toast.error("Please select a time slot available for this provider.");
      return;
    }
    if (!details.address || !details.city || !details.zip) {
      toast.error("Please enter complete service address details (Street, City, ZIP).");
      return;
    }
    setStep(2);
  };

  const handleCreateBookingAndPay = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to finalize your booking.");
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      setSubmitting(true);

      const bookingPayload = {
        provider_id: Number(providerId),
        service_type_id: provider?.service_type_id || provider?.sub_category_id || provider?.category_id || 1,
        service_category: provider?.category?.name || "Home Services",
        order_type: "item_based",
        booking_date: selectedDate,
        time_slot_id: selectedTimeSlotId,
        total_amount: grandTotal,
        pickup_address: `${details.address}, ${details.city}, ${details.zip}`,
        delivery_address: `${details.address}, ${details.city}, ${details.zip}`,
        notes: details.notes,
        items: selectedItems.map((item) => ({
          service_name: item.name,
          quantity: item.qty,
          price: item.price,
          unit: item.unit,
        })),
      };

      const res = await addProviderBookApi(bookingPayload);
      const bookingData = res?.data?.data || res?.data?.booking || res?.data || res;

      if (bookingData && (bookingData.id || bookingData.data?.id || bookingData.booking?.id)) {
        toast.success("Booking created successfully! Proceeding to payment...");
        setCreatedBooking(bookingData);
        setStripeModalOpen(true);
      } else {
        toast.error("Failed to create booking. Please try again.");
      }
    } catch (err: any) {
      console.error("CREATE BOOKING ERROR:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    providerId,
    navigate,
    isAuthenticated,
    user,
    provider,
    offeredServices,
    timeSlots,
    providerSchedule,
    loading,
    step,
    setStep,
    selectedItems,
    dates,
    selectedDate,
    setSelectedDate,
    selectedTimeSlotId,
    setSelectedTimeSlotId,
    selectedTimeSlotLabel,
    setSelectedTimeSlotLabel,
    formatSlotLabel,
    details,
    setDetails,
    quoteModalOpen,
    setQuoteModalOpen,
    createdBooking,
    stripeModalOpen,
    setStripeModalOpen,
    submitting,
    updateQty,
    addItem,
    removeItem,
    subtotal,
    serviceFee,
    grandTotal,
    selectedDateObj,
    unselectedServices,
    handleProceedToStep2,
    handleProceedToStep3,
    handleCreateBookingAndPay,
  };
}
