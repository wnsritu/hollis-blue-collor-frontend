export type BookingLifecycleStatus =
  | "PENDING"
  | "CONFIRMED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const bookingRules = {
  /**
   * Validates if a booking status transition is valid according to business rules.
   */
  canUpdateStatus: (
    currentStatus: string,
    targetStatus: string
  ): boolean => {
    const current = (currentStatus || "").toUpperCase();
    const target = (targetStatus || "").toUpperCase();

    const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
    return allowed.includes(target);
  },

  /**
   * Checks if an appointment/booking is active and in-progress.
   */
  isInProgress: (status: string): boolean => {
    const s = (status || "").toUpperCase();
    return s === "IN_PROGRESS" || s === "EN_ROUTE" || s === "ARRIVED";
  },

  /**
   * Checks if an appointment/booking can be cancelled.
   */
  canCancel: (status: string): boolean => {
    const s = (status || "").toUpperCase();
    return ["CONFIRMED", "EN_ROUTE", "ARRIVED"].includes(s);
  },
};

export default bookingRules;
