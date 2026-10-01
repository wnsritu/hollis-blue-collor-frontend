/**
 * Centralized Provider Job Lifecycle Utilities (Frontend)
 * Controls time-based job execution windows, categories, and dynamic UI action enablement.
 */

export const EXECUTION_WINDOW_CONFIG = {
  EARLY_EN_ROUTE_LEAD_MINUTES: 360, // 6 hours prior to scheduled start time
  EARLY_ARRIVED_LEAD_MINUTES: 180,   // 3 hour prior to scheduled start time
  START_JOB_LEAD_MINUTES: 90,       // 1.5 hour prior to scheduled start time
};

export type LifecycleCategory = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

/**
 * Safely parse scheduled service start time from booking or adapter object into Date.
 */
export const getScheduledStartDateTime = (booking: any): Date => {
  if (!booking) return new Date();

  // Check backend serialized format or adapter format
  if (booking.scheduled_start_at) {
    const parsed = new Date(booking.scheduled_start_at);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const dateStr =
    booking.reschedule_date ||
    booking.reschedule?.date ||
    booking.booking_date ||
    booking.schedule?.date ||
    booking.formattedDate;

  if (!dateStr) {
    return booking.createdAt ? new Date(booking.createdAt) : new Date();
  }

  const cleanDateStr = String(dateStr).slice(0, 10);

  const rawTime =
    booking.time_slot?.start_time ||
    booking.time_slots?.start_time ||
    booking.schedule?.time_slot?.start_time ||
    booking.time_slot ||
    booking.timeSlot ||
    "09:00:00";

  let timePart = "09:00:00";

  if (typeof rawTime === "string") {
    const trimmed = rawTime.trim();
    const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10);
      const minutes = amPmMatch[2];
      const seconds = amPmMatch[3] || "00";
      const mer = amPmMatch[4].toUpperCase();

      if (mer === "PM" && hours < 12) hours += 12;
      if (mer === "AM" && hours === 12) hours = 0;

      const hh = String(hours).padStart(2, "0");
      timePart = `${hh}:${minutes}:${seconds}`;
    } else {
      const parts = trimmed.split(":");
      if (parts.length >= 2) {
        const hh = parts[0].padStart(2, "0");
        const mm = parts[1].padStart(2, "0");
        const ss = (parts[2] || "00").slice(0, 2).padStart(2, "0");
        timePart = `${hh}:${mm}:${ss}`;
      }
    }
  }

  const isoCombined = `${cleanDateStr}T${timePart}`;
  const dt = new Date(isoCombined);

  if (!isNaN(dt.getTime())) {
    return dt;
  }

  return new Date(cleanDateStr);
};

/**
 * Determine high-level category of booking for UI filtering.
 * Returns: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
 */
export const getBookingLifecycleCategory = (booking: any, currentTime = new Date()): LifecycleCategory => {
  if (!booking) return "UPCOMING";

  if (booking.lifecycle_category) {
    return booking.lifecycle_category as LifecycleCategory;
  }

  const aptStatus = String(booking.appointment_status || booking.appointmentStatus || booking.status || "").toLowerCase();

  // Completed status check
  if (["completed", "delivered", "reviewed", "finished", "work completed"].includes(aptStatus)) {
    return "COMPLETED";
  }

  // Cancelled / Rejected check
  if (["cancelled", "canceled", "rejected", "declined", "no-show", "expired"].includes(aptStatus)) {
    return "CANCELLED";
  }

  // Execution active status check (Provider currently executing service)
  if (["en route", "en_route", "arrived", "in progress", "in_progress", "in_process"].includes(aptStatus)) {
    return "ACTIVE";
  }

  // Future booking check based on execution window
  const scheduledStart = getScheduledStartDateTime(booking);
  const nowMs = new Date(currentTime).getTime();
  const windowStartMs = scheduledStart.getTime() - EXECUTION_WINDOW_CONFIG.EARLY_EN_ROUTE_LEAD_MINUTES * 60 * 1000;

  if (nowMs >= windowStartMs) {
    return "ACTIVE"; // Booking has entered allowed execution window
  }

  return "UPCOMING";
};

/**
 * Helper to check if a specific action (e.g., "En Route", "Arrived", "In Progress", "Completed") is currently allowed.
 */
export const canProviderPerformAction = (
  booking: any,
  targetAction: string,
  currentTime = new Date()
): { allowed: boolean; reason?: string; allowedStartAt?: Date } => {
  if (!booking) return { allowed: false, reason: "Booking record not found." };

  const nowMs = new Date(currentTime).getTime();
  const scheduledStart = getScheduledStartDateTime(booking);
  const scheduledStartMs = scheduledStart.getTime();

  const formattedStartStr = scheduledStart.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const target = String(targetAction || "").trim().toLowerCase();

  if (target === "en route" || target === "en_route") {
    const allowedStartMs = scheduledStartMs - EXECUTION_WINDOW_CONFIG.EARLY_EN_ROUTE_LEAD_MINUTES * 60 * 1000;
    if (nowMs < allowedStartMs) {
      return {
        allowed: false,
        reason: `This job cannot be started before the scheduled service time (${formattedStartStr}).`,
        allowedStartAt: new Date(allowedStartMs),
      };
    }
  }

  if (target === "arrived") {
    const allowedStartMs = scheduledStartMs - EXECUTION_WINDOW_CONFIG.EARLY_ARRIVED_LEAD_MINUTES * 60 * 1000;
    if (nowMs < allowedStartMs) {
      return {
        allowed: false,
        reason: `You cannot mark Arrived before the scheduled service window (${formattedStartStr}).`,
        allowedStartAt: new Date(allowedStartMs),
      };
    }
  }

  if (target === "in progress" || target === "in_progress") {
    const allowedStartMs = scheduledStartMs - EXECUTION_WINDOW_CONFIG.START_JOB_LEAD_MINUTES * 60 * 1000;
    if (nowMs < allowedStartMs) {
      return {
        allowed: false,
        reason: `This job cannot be marked In Progress before the scheduled service time (${formattedStartStr}).`,
        allowedStartAt: new Date(allowedStartMs),
      };
    }
  }

  return { allowed: true };
};

/**
 * Format string describing when execution window opens for an upcoming job.
 */
export const formatUpcomingTimeNotice = (booking: any): string => {
  const scheduledStart = getScheduledStartDateTime(booking);
  const windowStartMs = scheduledStart.getTime() - EXECUTION_WINDOW_CONFIG.EARLY_EN_ROUTE_LEAD_MINUTES * 60 * 1000;
  const windowStart = new Date(windowStartMs);

  const scheduledStr = scheduledStart.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const windowStartStr = windowStart.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `Scheduled for ${scheduledStr}. Execution opens at ${windowStartStr}.`;
};

export default {
  EXECUTION_WINDOW_CONFIG,
  getScheduledStartDateTime,
  getBookingLifecycleCategory,
  canProviderPerformAction,
  formatUpcomingTimeNotice,
};
