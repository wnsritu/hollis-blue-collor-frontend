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
    const ymdMatch = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const localDate = new Date(year, month, day);
      return isValid(localDate) ? localDate : null;
    }
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

/**
 * Checks if a given date and optional time slot string is in the past.
 * If date is before today, returns true.
 * If date is today, checks if the time slot has already passed.
 */
export function isPastDateTime(dateInput: DateInput, timeInput?: string | null): boolean {
  const d = toValidDate(dateInput);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (checkDate.getTime() < today.getTime()) return true;
  if (checkDate.getTime() > today.getTime()) return false;

  // Same day - parse time slot if available
  if (!timeInput) return false;
  const times = String(timeInput).split("-").map((t) => t.trim());
  const targetTimeStr = times[1] || times[0];
  const amPmMatch = targetTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const mer = (amPmMatch[4] || "").toUpperCase();
    if (mer === "PM" && hours < 12) hours += 12;
    if (mer === "AM" && hours === 12) hours = 0;
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    return now.getTime() > slotTime.getTime();
  }
  return false;
}

/**
 * Checks if a time slot for a given date has already passed.
 * - If date is before today, returns true.
 * - If date is after today, returns false.
 * - If date is today, checks if the slot end time has already passed.
 */
export function isSlotEarlierThanNow(dateInput: DateInput, slotInput: any): boolean {
  const d = toValidDate(dateInput);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (checkDate.getTime() < today.getTime()) return true;
  if (checkDate.getTime() > today.getTime()) return false;

  if (!slotInput) return false;

  // Determine target time: for a range (e.g. 10:00 AM - 2:00 PM), use end_time so current window is available
  let targetStr = "";
  if (typeof slotInput === "object" && slotInput !== null) {
    if (slotInput.end_time) {
      targetStr = String(slotInput.end_time);
    } else if (slotInput.slot_name && slotInput.slot_name.includes("-")) {
      targetStr = slotInput.slot_name.split("-")[1].trim();
    } else if (slotInput.name && slotInput.name.includes("-")) {
      targetStr = slotInput.name.split("-")[1].trim();
    } else if (slotInput.start_time) {
      targetStr = String(slotInput.start_time);
    } else if (slotInput.slot_name) {
      targetStr = String(slotInput.slot_name);
    } else if (slotInput.name) {
      targetStr = String(slotInput.name);
    }
  } else if (typeof slotInput === "string") {
    if (slotInput.includes("-")) {
      targetStr = slotInput.split("-")[1].trim();
    } else {
      targetStr = slotInput.trim();
    }
  }

  if (!targetStr) return false;

  // Support standard slot names if string doesn't contain a direct timestamp
  const lower = targetStr.toLowerCase();
  if (lower.includes("morning") && !targetStr.includes(":")) targetStr = "10:00:00";
  else if (lower.includes("midday") && !targetStr.includes(":")) targetStr = "14:00:00";
  else if (lower.includes("afternoon") && !targetStr.includes(":")) targetStr = "18:00:00";
  else if (lower.includes("evening") && !targetStr.includes(":")) targetStr = "22:00:00";

  // Try parsing 12-hour AM/PM format (e.g. "10:00 AM", "02:00 PM")
  const amPmMatch = targetStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const mer = (amPmMatch[4] || "").toUpperCase();
    if (mer === "PM" && hours < 12) hours += 12;
    if (mer === "AM" && hours === 12) hours = 0;

    const slotEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    return now.getTime() >= slotEndTime.getTime();
  }

  // Try parsing 24-hour format (e.g. "10:00:00", "14:00")
  const parts = targetStr.split(":").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const slotEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1], 0);
    return now.getTime() >= slotEndTime.getTime();
  }

  return false;
}

