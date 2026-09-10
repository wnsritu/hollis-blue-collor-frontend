import { Car, Truck } from "lucide-react";

export const BOOK_SERVICE_STEPS = [
  "Services Selection", "Date, Time & Address", "Review & Pay",
];

export const CAR_WASH_STEPS = [
  "Service Type", "Vehicle", "Service", "Provider", "Schedule",
  "Add-ons", "Location", "Notes", "Estimate", "Summary",
];

export const CLEANING_STEPS = [
  "Service Type", "Cleaning Type", "Property", "Provider", "Schedule",
  "Checklist", "Details", "Address", "Estimate", "Summary",
];

export const VEHICLE_TYPES = [
  { id: "sedan", label: "Sedan", icon: Car },
  { id: "suv", label: "SUV", icon: Car },
  { id: "truck", label: "Truck", icon: Truck },
  { id: "van", label: "Van", icon: Truck },
  { id: "other", label: "Other", icon: Car },
];

export const TIME_WINDOWS = [
  "6:00 AM – 10:00 AM",
  "10:00 AM – 2:00 PM",
  "2:00 PM – 6:00 PM",
  "6:00 PM – 10:00 PM",
];

export const CAR_WASH_ADD_ONS = [
  "Wax",
  "Tire Shine",
  "Engine Cleaning",
  "Pet Hair Removal",
  "Odor Removal",
  "Interior Shampoo",
];

export const BOOKING_FLOW = [
  "Pending Acceptance",
  "Confirmed",
  "Paid",
  "Scheduled",
  "In Progress",
  "Completed",
  "Reviewed",
];

export const PROJECT_STEPS = [
  "Project Published",
  "Provider Matching",
  "Proposals Received",
  "Proposal Accepted",
  "Job Scheduled",
  "Service Completed",
];

export const getBookingTimelineStepStates = (
  isPaid: boolean
): Record<string, import("@/types/components.types").TimelineStepState> => ({
  Paid: isPaid ? "done" : "crossed",
});
