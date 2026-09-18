export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DEFAULT_SLOTS = [
  { id: 1, label: "6:00 AM - 10:00 AM" },
  { id: 2, label: "10:00 AM - 2:00 PM" },
  { id: 3, label: "2:00 PM - 6:00 PM" },
  { id: 4, label: "6:00 PM - 10:00 PM" },
];

export const DEFAULT_SCHEDULE: Record<string, number[]> = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};
