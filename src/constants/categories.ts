import { Home, Briefcase, User } from "lucide-react";

export interface CategoryMeta {
  id: string;
  name: string;
  description: string;
  pros: number;
}

export const HOME_SERVICE_CATEGORIES: CategoryMeta[] = [
  { id: "1", name: "Plumbing", description: "Leaks, pipe repair, drain clearing & water heater install.", pros: 128 },
  { id: "2", name: "Electrical", description: "Wiring, panel upgrades, light fixture install & outlets.", pros: 94 },
  { id: "3", name: "HVAC", description: "AC repair, furnace tune-up, duct cleaning & thermostats.", pros: 76 },
  { id: "4", name: "Cleaning", description: "Deep cleaning, move-in/out, maid service & carpet wash.", pros: 112 },
  { id: "5", name: "Roofing", description: "Shingle repair, leak patch, gutter cleaning & roof inspection.", pros: 64 },
  { id: "6", name: "Landscaping", description: "Lawn care, tree trimming, garden design & sprinkler repair.", pros: 88 },
  { id: "7", name: "Remodeling", description: "Kitchen remodel, bathroom update, flooring & drywall.", pros: 52 },
  { id: "8", name: "Handyman", description: "Small repairs, TV mounting, assembly & door fix.", pros: 140 },
];

export const CATEGORY_ICONS = [Home, Briefcase, User] as const;

export const CATEGORY_FALLBACK_DESC = [
  "Trades, maintenance and home improvement services.",
  "Business, accounting, IT and advisory services.",
  "Fitness, pet care, photography and event services.",
] as const;
