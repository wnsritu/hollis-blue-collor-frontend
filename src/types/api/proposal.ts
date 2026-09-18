export type ProposalStatus =
  | "draft"
  | "submitted"
  | "withdrawn"
  | "rejected"
  | "accepted"
  | "expired";

export type ProposalLineItem = {
  id?: number;
  description: string;
  quantity?: number;
  unit_price: number;
  line_total?: number;
  sort_order?: number;
  item_id?: number | null;
  service_id?: number | null;
};

export type Proposal = {
  id: number;
  project_id: number;
  provider_id: number;
  status: ProposalStatus;
  amount: number;
  currency?: string;
  message?: string | null;
  estimated_duration_hours?: number | null;
  proposed_date?: string | null;
  proposed_time_slot_id?: number | null;
  valid_until?: string | null;
  submitted_at?: string | null;
  responded_at?: string | null;
  line_items?: ProposalLineItem[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type CreateProposalPayload = {
  amount: number;
  currency?: string;
  message?: string | null;
  estimated_duration_hours?: number | null;
  proposed_date?: string | null;
  proposed_time_slot_id?: number | null;
  valid_until?: string | null;
  expiration_date?: string | null;
  status?: "draft" | "submitted";
  line_items?: ProposalLineItem[];
};

export type UpdateProposalPayload = Partial<CreateProposalPayload> & {
  status?: "draft" | "submitted" | "withdrawn";
};
