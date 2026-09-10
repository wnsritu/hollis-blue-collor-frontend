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
  estimated_duration_hours?: number;
  valid_until?: string;
  line_items: CustomQuoteLineItem[];
}
