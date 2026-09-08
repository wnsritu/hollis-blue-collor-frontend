import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/shared/Timeline";
import { Avatar, VerifiedBadge } from "@/components/shared/primitives";
import StripeBookingModal from "@/components/paymentModal/StripeBookingModal";
import CreateProjectModal from "@/components/m3/CreateProjectModal";
import {
  getProviderData,
  getTimeSlots,
  addProviderBookApi,
  getProviderAvailabilityByProviderIdApi,
} from "@/api/provider.api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { useAuthSession } from "@/hooks/useAuth";

const STEPS = ["Services Selection", "Date, Time & Address", "Review & Pay"];

interface OfferedService {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

interface SelectedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  qty: number;
  unit: string;
}

// Generate upcoming 14 days dynamically with Day of Week
const getUpcomingDates = (daysCount = 14) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const iso = `${year}-${month}-${day}`;

    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayOfWeekLong = d.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    dates.push({
      iso,
      dayName,
      dayOfWeekLong,
      monthDay,
      fullLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
  }

  return dates;
};

export default function BookService() {
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
  const [details, setDetails] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: "",
    zip: "",
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

          // Parse provider custom services from service_pricing JSON
          let servicesList: OfferedService[] = [];
          if (provData.service_pricing) {
            try {
              const pricingMap =
                typeof provData.service_pricing === "string"
                  ? JSON.parse(provData.service_pricing)
                  : provData.service_pricing;

              servicesList = Object.entries(pricingMap).map(([name, config]: [string, any], idx) => ({
                id: `svc_${idx + 1}`,
                name,
                description: config.description || `${name} performed by ${provData.business_name || "Professional"}.`,
                price: Number(config.price) || 100,
                unit: config.unit || "flat rate",
              }));
            } catch (e) {
              console.error("Error parsing service_pricing:", e);
            }
          }

          // Fallback if no custom services exist
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

          // Handle initial service selection from query parameter or default
          let initialSvc = servicesList[0];
          if (serviceIdParam) {
            const matched = servicesList.find(
              (s) => s.id === serviceIdParam || s.name.toLowerCase() === serviceIdParam.toLowerCase()
            );
            if (matched) initialSvc = matched;
          }

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
        }

        // Format Provider Availability Schedule
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

        // If provider has configured specific slots, enforce schedule. Otherwise allow all slots.
        if (totalConfiguredSlots > 0) {
          activeSchedule = scheduleTemp;
        } else {
          activeSchedule = null;
        }

        setProviderSchedule(activeSchedule);

        // Format Time Slots
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

        // Auto-select first available date
        const firstAvailableDate = dates.find((d) => {
          if (!activeSchedule) return true;
          const slotsForDay = activeSchedule[d.dayOfWeekLong] || [];
          return slotsForDay.length > 0;
        });

        const initialDateIso = firstAvailableDate?.iso || dates[0]?.iso || "";
        setSelectedDate(initialDateIso);

        // Auto-select first available slot for that date
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

  // Update selected time slot automatically when date changes
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

  // Helper time slot formatter
  const formatSlotLabel = (s: any) => {
    if (s.start_time && s.end_time) {
      const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(":");
        let hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${ampm}`;
      };
      return `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`;
    }
    return s.slot_name || `Slot ${s.id}`;
  };

  // Cart handlers
  const updateQty = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
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
        return prev.map((i) => (i.id === svc.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          id: svc.id,
          name: svc.name,
          description: svc.description,
          price: svc.price,
          qty: 1,
          unit: svc.unit,
        },
      ];
    });
    toast.success(`${svc.name} added to booking.`);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Live Price calculations
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const serviceFee = Math.round(subtotal * 0.1); // 10% Platform Service Fee
  const grandTotal = subtotal + serviceFee;

  const selectedDateObj = dates.find((d) => d.iso === selectedDate);
  const unselectedServices = offeredServices.filter((svc) => !selectedItems.some((item) => item.id === svc.id));

  // Validation handlers
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

  // Submit Booking & Open Payment
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

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading provider schedule & booking options...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container-page py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Provider Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested service provider could not be found.</p>
        <Button onClick={() => navigate("/search")} className="mt-4">
          Browse Service Providers
        </Button>
      </div>
    );
  }

  const businessName = provider.business_name || provider.user?.full_name || "Service Professional";
  const initials = businessName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <section className="border-b border-border bg-card py-6">
        <div className="container-page space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
              <ArrowLeft size={16} /> Back
            </Button>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Book Services with {businessName}
            </h1>
          </div>
          <div className="pt-2">
            <Stepper steps={STEPS} current={Math.min(step, 2)} />
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid */}
      <section className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* STEP 0: SERVICES SELECTION */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Provider Info Summary Card */}
              <Card className="shadow-card border-border/80">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar initials={initials} image={resolveMediaUrl(provider.logo_url || provider.user?.photo)} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-foreground truncate">{businessName}</h2>
                        {(provider.verified === "verified" || provider.verified === "approved") && <VerifiedBadge compact />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {provider.category?.name || "Services"} • {provider.city || "Austin"}, {provider.state || "TX"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                        <Star size={13} className="fill-amber-500 text-amber-500" />
                        <span className="font-semibold">{provider.rating || "4.9"}</span>
                        <span className="text-muted-foreground">({provider.reviews_count || provider.review_count || 12} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setQuoteModalOpen(true)} className="hidden sm:flex gap-1.5 text-xs">
                    <HelpCircle size={14} /> Request a Quote
                  </Button>
                </CardContent>
              </Card>

              {/* Selected Services / Cart */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Selected Services</CardTitle>
                </CardHeader>
                <CardContent className="p-5 divide-y divide-border/60">
                  {selectedItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No services selected yet. Add a service below to get started.</p>
                  ) : (
                    selectedItems.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          <p className="text-xs font-semibold text-primary">
                            ${item.price} <span className="font-normal text-muted-foreground">/{item.unit || "flat rate"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-foreground shadow-xs hover:bg-accent transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-foreground">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-foreground shadow-xs hover:bg-accent transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                            title="Remove service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Additional Services Offered */}
              {unselectedServices.length > 0 && (
                <Card className="shadow-card border-border/80">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold text-foreground">
                      Additional Services Offered by {businessName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 divide-y divide-border/60">
                    {unselectedServices.map((svc) => (
                      <div key={svc.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-foreground">{svc.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                          <p className="text-xs font-semibold text-foreground">${svc.price} <span className="font-normal text-muted-foreground">/{svc.unit}</span></p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addItem(svc)}
                          className="gap-1.5 self-start sm:self-center border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Plus size={14} /> Add Service
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4">
                <Button size="lg" onClick={handleProceedToStep2} className="gap-2 shadow-sm">
                  Continue to Schedule & Address <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: DATE, TIME & ADDRESS */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Date Selection (Filtered by Provider Availability) */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary" /> Select Preferred Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {dates.map((d) => {
                      const isSelected = selectedDate === d.iso;
                      const activeSlotIds = providerSchedule ? providerSchedule[d.dayOfWeekLong] || [] : null;
                      const isUnavailable = providerSchedule ? activeSlotIds && activeSlotIds.length === 0 : false;

                      return (
                        <button
                          key={d.iso}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setSelectedDate(d.iso)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                            isUnavailable
                              ? "bg-muted/40 text-muted-foreground/60 border-border/40 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 shadow-xs"
                              : "bg-card text-foreground border-border hover:bg-accent cursor-pointer"
                          }`}
                        >
                          <span className="text-xs font-medium uppercase opacity-80">{d.dayName}</span>
                          <span className="text-sm font-bold mt-0.5">{d.monthDay}</span>
                          <span className="text-[10px] mt-1 font-semibold">
                            {isUnavailable ? (
                              <span className="text-destructive/80">Unavailable</span>
                            ) : activeSlotIds ? (
                              <span className={isSelected ? "text-primary-foreground" : "text-primary"}>
                                {activeSlotIds.length} slot(s)
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Available</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slot Selection (Filtered by Provider Availability for Selected Date) */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Select Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {(() => {
                    const currentDayLong = dates.find((d) => d.iso === selectedDate)?.dayOfWeekLong || "";
                    const activeSlotIds = providerSchedule && currentDayLong ? providerSchedule[currentDayLong] : null;

                    const availableSlots = activeSlotIds
                      ? timeSlots.filter((s) => activeSlotIds.includes(Number(s.id)))
                      : timeSlots;

                    if (availableSlots.length === 0) {
                      return (
                        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                          No active time slots configured by provider for {currentDayLong || "this date"}. Please select another date.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableSlots.map((s) => {
                          const id = Number(s.id);
                          const label = formatSlotLabel(s);
                          const isSelected = selectedTimeSlotId === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlotId(id);
                                setSelectedTimeSlotLabel(label);
                              }}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 shadow-xs font-semibold"
                                  : "bg-card text-foreground border-border hover:bg-accent"
                              }`}
                            >
                              <Clock size={16} className={isSelected ? "text-primary-foreground" : "text-muted-foreground"} />
                              <span className="text-sm">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Address & Instructions Form */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <MapPin size={18} className="text-primary" /> Service Address & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold">Your Full Name</Label>
                      <Input
                        id="name"
                        value={details.name}
                        onChange={(e) => setDetails({ ...details, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                      <Input
                        id="phone"
                        value={details.phone}
                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                        placeholder="(512) 555-0100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-semibold">Street Address</Label>
                    <Input
                      id="address"
                      value={details.address}
                      onChange={(e) => setDetails({ ...details, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                      <Input
                        id="city"
                        value={details.city}
                        onChange={(e) => setDetails({ ...details, city: e.target.value })}
                        placeholder="Austin"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zip" className="text-xs font-semibold">ZIP / Postal Code</Label>
                      <Input
                        id="zip"
                        value={details.zip}
                        onChange={(e) => setDetails({ ...details, zip: e.target.value })}
                        placeholder="78701"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold">Special Instructions or Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={details.notes}
                      onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                      placeholder="Gate code, parking instructions, or specific areas of focus..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft size={16} className="mr-1.5" /> Back to Services
                </Button>
                <Button size="lg" onClick={handleProceedToStep3} className="gap-2 shadow-sm">
                  Review & Pay <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & PAY */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <Card className="shadow-card border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Review Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {/* Provider Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                    <Avatar initials={initials} image={resolveMediaUrl(provider.logo_url || provider.user?.photo)} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{businessName}</h3>
                      <p className="text-xs text-muted-foreground">{provider.city || "Austin"}, {provider.state || "TX"}</p>
                    </div>
                  </div>

                  {/* Selected Services Breakdown */}
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-3">Services Requested</h4>
                    <div className="space-y-2.5">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium text-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">(x{item.qty})</span>
                          </div>
                          <span className="font-semibold text-foreground">${item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Schedule */}
                  <div className="pt-4 border-t border-border/60 grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Date & Time</h4>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <CalendarDays size={15} className="text-primary" />
                        {selectedDateObj?.fullLabel || selectedDate}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock size={14} />
                        {selectedTimeSlotLabel}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Service Address</h4>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <MapPin size={15} className="text-primary" />
                        {details.address}, {details.city}, {details.zip}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Secure Payment Card */}
              <Card className="shadow-card border-border/80">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Ready to Complete Booking</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Clicking below will create your booking and open the secure Stripe checkout modal to complete payment.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="lg"
                      onClick={handleCreateBookingAndPay}
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 gap-2 shadow-md"
                    >
                      <ShieldCheck size={18} />
                      {submitting ? "Creating Booking..." : `Pay Total $${grandTotal}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="mr-1.5" /> Back to Date & Address
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: STICKY ORDER SUMMARY */}
        <aside className="space-y-6">
          <Card className="shadow-card border-border/80 sticky top-20">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Provider Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                <Avatar initials={initials} image={resolveMediaUrl(provider.logo_url || provider.user?.photo)} size="sm" />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">{businessName}</p>
                  <p className="text-[11px] text-muted-foreground">{provider.city || "Austin"}, {provider.state || "TX"}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                {selectedItems.length === 0 ? (
                  <p className="text-muted-foreground italic">No items selected</p>
                ) : (
                  selectedItems.map((i) => (
                    <div key={i.id} className="flex justify-between items-center">
                      <span className="text-foreground truncate max-w-[190px]">
                        {i.name} <span className="text-muted-foreground font-semibold">(x{i.qty})</span>
                      </span>
                      <span className="font-semibold text-foreground">${i.price * i.qty}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Date & Address Preview */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                {selectedDateObj && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-primary shrink-0" />
                    <span className="truncate">{selectedDateObj.fullLabel}</span>
                  </div>
                )}
                {selectedTimeSlotLabel && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-primary shrink-0" />
                    <span className="truncate">{selectedTimeSlotLabel}</span>
                  </div>
                )}
                {details.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary shrink-0" />
                    <span className="truncate">{details.address}, {details.city}</span>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">${subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Fee (10%)</span>
                  <span className="font-semibold text-foreground">${serviceFee}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
                  <span>Total</span>
                  <span className="text-primary text-base">${grandTotal}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      {/* Quote Request Modal */}
      <CreateProjectModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        initialCategoryId={provider?.category_id}
        initialServiceTypeId={provider?.service_type_id}
        providerId={provider?.id}
        providerName={businessName}
        categoryName={provider?.category?.name || "Services"}
        subCategoryName={provider?.service_type?.name}
        onProjectCreated={() => {
          toast.success("Quote request submitted successfully!");
          navigate("/projects");
        }}
      />

      {/* Stripe Payment Modal */}
      {createdBooking && (
        <StripeBookingModal
          isOpen={stripeModalOpen}
          onClose={() => setStripeModalOpen(false)}
          bookingData={createdBooking}
          onSuccess={(paymentIntent) => {
            toast.success("Payment confirmed! Your booking is complete.");
            navigate("/appointments");
          }}
        />
      )}
    </div>
  );
}
