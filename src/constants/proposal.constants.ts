import type { CustomQuoteFormValues } from "@/types/proposal.types";

export const DEFAULT_CUSTOM_QUOTE_TERMS =
  "Full payment held in escrow until completion. Includes quality assurance guarantee and post-service cleanup.";

export interface ProposalTimeSlotOption {
  value: string;
  label: string;
  start_time: string;
  end_time: string;
}

export const PROPOSAL_TIME_SLOTS: ProposalTimeSlotOption[] = [
  { value: "Morning Slot", label: "Morning Slot (06:00 AM - 10:00 AM)", start_time: "06:00:00", end_time: "10:00:00" },
  { value: "Midday Slot", label: "Midday Slot (10:00 AM - 02:00 PM)", start_time: "10:00:00", end_time: "14:00:00" },
  { value: "Afternoon Slot", label: "Afternoon Slot (02:00 PM - 06:00 PM)", start_time: "14:00:00", end_time: "18:00:00" },
  { value: "Evening Slot", label: "Evening Slot (06:00 PM - 10:00 PM)", start_time: "18:00:00", end_time: "22:00:00" },
];

export const DEFAULT_CUSTOM_QUOTE_VALUES: CustomQuoteFormValues = {
  workDescription: "",
  labor: 150,
  materials: 0,
  fees: 0,
  discount: 0,
  tax: 0,
  completion: "1 business day",
  terms: DEFAULT_CUSTOM_QUOTE_TERMS,
  expires: "7 days",
  proposedDate: "",
  proposedTimeSlot: "Morning Slot",
};

export const PLATFORM_COMMISSION_PERCENT = 9;

export const CUSTOM_QUOTE_FORM_STYLES = {
  inputError: "border-destructive focus-visible:ring-destructive",
  errorText: "text-xs font-medium text-destructive mt-1",
  fieldWrapper: "grid gap-2",
  fieldGroupGrid: "grid gap-4 sm:grid-cols-2",
  label: "text-sm font-semibold",
  requiredStar: "text-destructive",
  summaryCard: "space-y-2 text-sm bg-muted/30 p-4 rounded-xl border border-border",
  summaryTotal: "flex items-center justify-between gap-4 font-bold text-foreground",
  summaryFee: "flex items-center justify-between gap-4 text-muted-foreground text-xs",
  summaryReceive:
    "flex items-center justify-between gap-4 font-semibold text-primary text-sm pt-1 border-t border-border",
  submitButton: "mt-2 w-full gap-2 shadow-sm font-semibold",
} as const;
