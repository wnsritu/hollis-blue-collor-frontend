import type { Appointment } from "@/types/api/appointment";
import type { GenericBooking } from "@/components/shared/cards";
import { formatDisplayDate, formatDisplayTime } from "@/utils/format";

export interface NormalizedBooking {
  id: number;
  displayId: string;
  bookingNumber: string | null;
  status: string;
  rawStatus: string;
  appointmentStatus: string;
  serviceName: string;
  serviceDescription: string;
  categoryName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAvatar: string | null;
  providerName: string;
  providerId: number | null;
  address: string;
  date: string;
  formattedDate: string;
  time: string;
  formattedTime: string;
  timeSlotName: string;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  isPaid: boolean;
  paymentStatus: string;
  paymentDate: string | null;
  receiptUrl: string | null;
  bookingType: string;
  isCustom: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isPriceUpdated: boolean;
  servicesList: Array<{
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  reschedule: {
    requested: boolean;
    requestedBy: string | number | null;
    date: string | null;
    timeSlotId: number | null;
    reason?: string | null;
  };
  dispute: {
    isDisputed: boolean;
    status: string;
    deadlineAt: string | null;
  };
  review?: {
    id: number;
    rating: number;
    comment: string | null;
    status: string;
    created_at: string | null;
  } | null;
  raw: any;
}

/**
 * Normalizes any booking/appointment payload (whether from new BookingSerializer
 * or legacy endpoints) into a clean, predictable, strongly-typed domain model.
 */
export function normalizeBooking(b: any): NormalizedBooking {
  if (!b) {
    return {
      id: 0,
      displayId: "BKG-0",
      bookingNumber: null,
      status: "Requested",
      rawStatus: "requested",
      appointmentStatus: "Requested",
      serviceName: "Service Details",
      serviceDescription: "",
      categoryName: "Home Services",
      customerName: "Customer",
      customerPhone: "",
      customerEmail: "",
      customerAvatar: null,
      providerName: "Professional",
      providerId: null,
      address: "Address not provided",
      date: "",
      formattedDate: "Date to be confirmed",
      time: "",
      formattedTime: "Time to be confirmed",
      timeSlotName: "",
      subtotal: 0,
      serviceFee: 0,
      totalAmount: 0,
      currency: "USD",
      isPaid: false,
      paymentStatus: "pending",
      paymentDate: null,
      receiptUrl: null,
      bookingType: "direct_service",
      isCustom: false,
      isCompleted: false,
      isCancelled: false,
      isPriceUpdated: false,
      servicesList: [],
      reschedule: { requested: false, requestedBy: null, date: null, timeSlotId: null },
      dispute: { isDisputed: false, status: "none", deadlineAt: null },
      raw: b,
    };
  }

  const id = Number(b.id) || 0;
  const bookingNumber = b.booking_number || null;
  const displayId =
    bookingNumber ||
    (typeof b.id === "string" && b.id.startsWith("BKG-") ? b.id : `BKG-${id}`);

  // Status mapping
  const rawStatus = String(b.appointment_status || b.status || "Requested");
  const normalizedRaw = rawStatus.toLowerCase();
  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const appointmentStatus = String(b.appointment_status || status);

  const isCancelled = ["cancelled", "canceled", "rejected", "no-show"].includes(normalizedRaw);
  const isCompleted = ["completed", "delivered", "reviewed", "finished", "work completed"].includes(normalizedRaw);
  const isPriceUpdated = normalizedRaw === "price updated" || normalizedRaw === "price_updated";

  // Service Line items
  const servicesList = Array.isArray(b.services)
    ? b.services
    : Array.isArray(b.items)
    ? b.items.map((it: any) => ({
        id: it.id,
        name: it.custom_item_name || it.item_name || it.item?.name || it.name || "Service Item",
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.price || it.unit_price) || 0,
        total: Number(it.total || (Number(it.price || it.unit_price || 0) * (Number(it.quantity) || 1))),
      }))
    : [];

  // Service Title
  const serviceName =
    servicesList.map((s: any) => s.name).filter(Boolean).join(", ") ||
    b.service?.service_type?.name ||
    b.service?.category_name ||
    b.service_type?.name ||
    b.project?.title ||
    b.service_category ||
    "Service Details";

  const categoryName =
    b.service?.category_name ||
    b.service_category ||
    "Home Services";

  const serviceDescription =
    b.notes ||
    b.description ||
    b.service?.service_type?.description ||
    b.service_description ||
    "Service details and requirements.";

  // Customer info
  const customerName =
    b.customer?.full_name ||
    [b.customer?.first_name, b.customer?.last_name].filter(Boolean).join(" ") ||
    b.customer_name ||
    "Customer";
  const customerPhone = b.customer?.phone || "";
  const customerEmail = b.customer?.email || "";
  const customerAvatar = b.customer?.profile_image || null;

  // Provider info
  const providerName =
    b.provider?.business_name ||
    b.provider?.user?.full_name ||
    b.provider_name ||
    "Professional";
  const providerId = b.provider?.id ? Number(b.provider.id) : (b.provider_id ? Number(b.provider_id) : null);

  // Address
  const address =
    b.service_address?.address ||
    b.customer?.addresses?.[0]?.address_line ||
    b.pickup_address ||
    b.delivery_address ||
    b.address ||
    "Address not provided";

  // Schedule & Time
  const date = b.schedule?.date || b.booking_date || "";
  const formattedDate = formatDisplayDate(date);

  const timeSlot = b.schedule?.time_slot || b.time_slot || null;
  const timeSlotName = timeSlot?.name || timeSlot?.slot_name || "";
  const rawStartTime = timeSlot?.start_time || b.time || "";
  const rawEndTime = timeSlot?.end_time || "";
  const time = rawStartTime ? (rawEndTime ? `${rawStartTime} - ${rawEndTime}` : rawStartTime) : "";
  const formattedTime = formatDisplayTime(rawStartTime);

  // Pricing
  const totalAmount = Number(
    b.pricing?.total ??
    b.payment?.amount ??
    b.total_amount ??
    b.price ??
    0
  );

  const subtotal = Number(
    b.pricing?.subtotal ??
    (totalAmount > 0 ? Math.round((totalAmount / 1.1) * 100) / 100 : 0)
  );

  const serviceFee = Number(
    b.pricing?.service_fee ??
    Math.max(0, Math.round((totalAmount - subtotal) * 100) / 100)
  );

  const currency = b.pricing?.currency || b.payment?.currency || "USD";

  // Payment
  const paymentStatus = b.payment?.payment_status || b.payment_status || "pending";
  const normPayStatus = String(paymentStatus).toLowerCase();
  const isPaid = ["paid", "success", "succeeded", "completed"].includes(normPayStatus) || Boolean(b.paid);
  const paymentDate = b.payment?.payment_date || b.payment?.createdAt || b.payment_date || null;
  const receiptUrl = b.payment?.receipt_url || null;

  // Booking Type & Quote
  const isCustom =
    b.booking_type === "request_quote" ||
    b.order_type === "custom" ||
    b.order_type === "quote" ||
    Boolean(b.project_id || b.proposal_id);

  const bookingType = b.booking_type || (isCustom ? "request_quote" : "direct_service");

  // Reschedule info
  const reschedule = {
    requested: Boolean(b.reschedule?.requested ?? b.reschedule_requested_by ?? (normalizedRaw === "rescheduled")),
    requestedBy: b.reschedule?.requested_by ?? b.reschedule_requested_by ?? null,
    date: b.reschedule?.date ?? b.reschedule_date ?? null,
    timeSlotId: b.reschedule?.time_slot_id ?? b.reschedule_time_slot_id ?? null,
    reason: b.reschedule?.reason ?? b.reschedule_reason ?? b.notes ?? null,
  };

  // Dispute info
  const dispute = {
    isDisputed: Boolean(b.dispute?.is_disputed ?? b.is_disputed),
    status: b.dispute?.status ?? b.dispute_status ?? "none",
    deadlineAt: b.dispute?.deadline_at ?? b.dispute_deadline_at ?? null,
  };

  // Review info
  const review = b.review && b.review.status !== "removed"
    ? {
        id: Number(b.review.id),
        rating: Number(b.review.rating) || 0,
        comment: b.review.comment || null,
        status: b.review.status || "visible",
        created_at: b.review.created_at || b.review.createdAt || null,
      }
    : null;

  return {
    id,
    displayId,
    bookingNumber,
    status,
    rawStatus: normalizedRaw,
    appointmentStatus,
    serviceName,
    serviceDescription,
    categoryName,
    customerName,
    customerPhone,
    customerEmail,
    customerAvatar,
    providerName,
    providerId,
    address,
    date,
    formattedDate,
    time,
    formattedTime,
    timeSlotName,
    subtotal,
    serviceFee,
    totalAmount,
    currency,
    isPaid,
    paymentStatus,
    paymentDate,
    receiptUrl,
    bookingType,
    isCustom,
    isCompleted,
    isCancelled,
    isPriceUpdated,
    servicesList,
    reschedule,
    dispute,
    review,
    raw: b,
  };
}

/**
 * Maps any booking payload into a GenericBooking object consumable by BookingCard.
 */
export function mapBookingToGeneric(
  b: any,
  side: "customer" | "provider" = "customer"
): GenericBooking {
  const n = normalizeBooking(b);

  return {
    id: n.id,
    status: n.status,
    serviceName: n.serviceName,
    provider: side === "customer" ? n.providerName : undefined,
    customer: side === "provider" ? n.customerName : undefined,
    serviceDescription: n.serviceDescription,
    price: n.totalAmount,
    proposedPrice: b.proposed_amount || b.proposed_price || b.pricing?.proposed_price,
    kind: n.isCustom ? "Custom Request" : "Standard",
    requestKind: n.isCustom ? "Request a Quote" : "Fixed Service",
    date: n.formattedDate,
    time: n.formattedTime,
    address: n.address,
    paymentStatus: n.paymentStatus,
    isPaid: n.isPaid,
  };
}

/**
 * Maps appointment / order status into the standard booking timeline steps.
 */
export function getTimelineStep(rawStatus: string): string {
  const s = (rawStatus || "").toLowerCase();
  if (["requested", "pending", "pending review", "pending acceptance"].includes(s)) {
    return "Pending Acceptance";
  }
  if (["confirmed", "accepted"].includes(s)) return "Confirmed";
  if (["paid", "payment pending"].includes(s)) return "Paid";
  if (["scheduled"].includes(s)) return "Scheduled";
  if (["in_process", "in progress", "en route", "arrived"].includes(s)) return "In Progress";
  if (["finished", "completed", "delivered"].includes(s)) return "Completed";
  if (["reviewed"].includes(s)) return "Reviewed";
  return "Scheduled";
}
