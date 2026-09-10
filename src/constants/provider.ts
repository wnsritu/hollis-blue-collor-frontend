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
  Monday: [1, 2, 3],
  Tuesday: [1, 2, 3],
  Wednesday: [1, 2, 3],
  Thursday: [1, 2, 3],
  Friday: [1, 2, 3, 4],
  Saturday: [2, 3],
  Sunday: [],
};
