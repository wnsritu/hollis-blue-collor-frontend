export type PayoutStatus = "on_hold" | "eligible" | "paid" | "cancelled" | string;

export type Payout = {
  id: number;
  payment_id?: number;
  provider_id?: number;
  gross_amount?: number;
  commission_amount?: number;
  net_amount?: number;
  status?: PayoutStatus;
  paid_at?: string | null;
  transfer_reference?: string | null;
  [key: string]: unknown;
};

export type CommissionRates = {
  admin_commission?: number;
  rate?: number;
  [key: string]: unknown;
};

export type MarkPayoutPaidPayload = {
  transfer_reference?: string;
  notes?: string;
  [key: string]: unknown;
};

export type CreatePaymentIntentPayload = {
  booking_id?: number;
  proposal_id?: number;
  amount?: number;
  currency?: string;
  idempotency_key?: string;
  [key: string]: unknown;
};

export type ConfirmPaymentPayload = {
  payment_intent_id: string;
  [key: string]: unknown;
};
