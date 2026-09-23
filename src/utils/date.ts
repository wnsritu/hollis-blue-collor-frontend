import { format, isValid, parseISO, formatDistanceToNow } from "date-fns";

export type DateInput = Date | string | number | null | undefined | unknown;

/**
 * Coerces various date inputs (Date, ISO string, timestamp) into a valid Date object.
 * Returns null if invalid or missing.
 */
export function toValidDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }
  if (typeof input === "string") {
    // Try standard Date parsing, fallback to parseISO
    const d = new Date(input);
    if (isValid(d)) return d;
    const iso = parseISO(input);
    return isValid(iso) ? iso : null;
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  return null;
}

/**
 * Standard date formatting.
 * Default pattern: "MMM d, yyyy" (e.g., "Sep 9, 2026")
 */
export function formatDate(input: DateInput, pattern = "MMM d, yyyy"): string {
  const d = toValidDate(input);
  if (!d) return "";
  try {
    return format(d, pattern);
  } catch {
    return "";
  }
}

/**
 * Short date formatting: "MMM d" (e.g., "Sep 9")
 */
export function formatShortDate(input: DateInput): string {
  return formatDate(input, "MMM d");
}

/**
 * Standard time formatting: "h:mm a" (e.g., "05:30 PM")
 */
export function formatTime(input: DateInput, pattern = "h:mm a"): string {
  const d = toValidDate(input);
  if (!d) return "";
  try {
    return format(d, pattern);
  } catch {
    return "";
  }
}

/**
 * Standard date and time formatting: "MMM d, yyyy, h:mm a"
 */
export function formatDateTime(input: DateInput, pattern = "MMM d, yyyy, h:mm a"): string {
  const d = toValidDate(input);
  if (!d) return "";
  try {
    return format(d, pattern);
  } catch {
    return "";
  }
}

/**
 * Relative date description (e.g. "2 days ago", "about 1 hour ago")
 */
export function formatRelativeDate(input: DateInput): string {
  const d = toValidDate(input);
  if (!d) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export interface UpcomingDay {
  date: Date;
  iso: string;
  isoDate: string;
  dayName: string;
  dayOfWeekLong: string;
  monthDay: string;
  fullLabel: string;
  day: number;
  month: string;
}

/**
 * Generates an array of upcoming consecutive days starting from today.
 */
export function getUpcomingDays(daysCount = 14): UpcomingDay[] {
  const dates: UpcomingDay[] = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isoStr = format(d, "yyyy-MM-dd");

    dates.push({
      date: d,
      iso: isoStr,
      isoDate: isoStr,
      dayName: format(d, "EEE"), // "Mon", "Tue"
      dayOfWeekLong: format(d, "EEEE"), // "Monday"
      monthDay: format(d, "MMM d"), // "Sep 9"
      fullLabel: format(d, "MMM d, yyyy"), // "Sep 9, 2026"
      day: d.getDate(),
      month: format(d, "MMM"), // "Sep", "Aug"
    });
  }

  return dates;
}

/**
 * Returns today's date (or offset date) as a 'YYYY-MM-DD' string in local time,
 * perfect for setting HTML <input type="date" min={getTodayDateString()} />.
 */
export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date (string, Date, or timestamp) is strictly before today (00:00:00).
 */
export function isPastDate(input: DateInput): boolean {
  const d = toValidDate(input);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(d);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() < today.getTime();
}

