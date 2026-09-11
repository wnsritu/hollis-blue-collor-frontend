import type { CreateProjectFormValues } from "@/types/project.types";
import type { TimelineStepState } from "@/types/components.types";

export const DEFAULT_CREATE_PROJECT_VALUES: CreateProjectFormValues = {
  title: "",
  category_id: "",
  service_type_id: "",
  description: "",
  address_line: "",
  city: "",
  state: "",
  zip_code: "",
  latitude: null,
  longitude: null,
  budget_min: "",
  budget_max: "",
  urgency: "soon",
  preferred_date: "",
};

export const URGENCY_OPTIONS = [
  { value: "flexible", label: "Flexible timing" },
  { value: "soon", label: "Within next few days" },
  { value: "urgent", label: "Urgent (1-2 days)" },
] as const;

export const REQUEST_TIMELINE_STEPS = [
  "Request Sent",
  "Quote Pending",
  "Quote Received",
  "Accepted",
  "Payment Pending",
  "Paid",
  "Scheduled",
  "In Progress",
  "Completed",
  "Reviewed",
] as const;

export const STATUS_TIMELINE_STEPS = REQUEST_TIMELINE_STEPS;

export const mapProjectStatusToTimelineStep = (status?: string, proposalsCount = 0): string => {
  const s = (status || "").toLowerCase().trim();
  if (!s || s === "draft" || s === "request sent") {
    return "Request Sent";
  }
  if (["open", "matching", "requested", "pending", "pending review", "pending acceptance", "quote_pending", "quote pending"].includes(s)) {
    return proposalsCount > 0 ? "Quote Received" : "Quote Pending";
  }
  if (["proposals_received", "submitted", "quote_received", "quote received"].includes(s)) {
    return "Quote Received";
  }
  if (["accepted", "confirmed", "accepted_pending_payment"].includes(s)) {
    return "Accepted";
  }
  if (["payment_pending", "payment pending", "accepted_pending_payment"].includes(s)) {
    return "Payment Pending";
  }
  if (["paid", "succeeded"].includes(s)) {
    return "Paid";
  }
  if (["scheduled"].includes(s)) {
    return "Scheduled";
  }
  if (["in_progress", "in process", "in_process", "active", "en route", "arrived"].includes(s)) {
    return "In Progress";
  }
  if (["completed", "finished", "delivered"].includes(s)) {
    return "Completed";
  }
  if (["reviewed"].includes(s)) {
    return "Reviewed";
  }
  return proposalsCount > 0 ? "Quote Received" : "Quote Pending";
};

export const getProjectTimelineStepStates = (
  status?: string,
  paymentStatus?: string
): Record<string, TimelineStepState> => {
  const s = (status || "").toLowerCase().trim();
  const ps = (paymentStatus || "").toLowerCase().trim();

  // Paid if payment_status is explicitly paid, or status is paid
  const isPaid = ps === "paid" || ps === "succeeded" || s === "paid";

  // Status is at or past proposal acceptance
  const isPastAcceptance = [
    "accepted",
    "accepted_pending_payment",
    "confirmed",
    "payment_pending",
    "payment pending",
    "paid",
    "scheduled",
    "in_progress",
    "in process",
    "in_process",
    "en route",
    "arrived",
    "completed",
    "reviewed",
  ].includes(s);

  const states: Record<string, TimelineStepState> = {};

  if (isPastAcceptance) {
    if (isPaid) {
      states["Payment Pending"] = "done";
      states["Paid"] = "done";
    } else if (ps === "failed") {
      states["Paid"] = "crossed";
    }
  }

  return states;
};
