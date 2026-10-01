export interface CustomQuoteFormValues {
  workDescription: string;
  labor: number | "";
  materials: number | "";
  fees: number | "";
  discount: number | "";
  tax: number | "";
  completion: string;
  terms: string;
  expires: string;
  proposedDate?: string;
  proposedTimeSlot?: string;
}

export interface CustomQuoteCalculation {
  total: number;
  commission: number;
  payable: number;
}

export interface CustomQuoteValidationErrors {
  workDescription?: string;
  labor?: string;
  total?: string;
}

export interface CustomQuoteLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CustomQuoteSubmitPayload {
  amount: number;
  currency: string;
  message: string;
  discount?: number;
  discount_amount?: number;
  estimated_duration_hours?: number;
  proposed_date?: string;
  proposed_time_slot_id?: number | string | null;
  time_slot_name?: string;
  valid_until?: string;
  line_items: CustomQuoteLineItem[];
}
