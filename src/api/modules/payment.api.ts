import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  CommissionRates,
  ConfirmPaymentPayload,
  CreatePaymentIntentPayload,
  MarkPayoutPaidPayload,
  Payout,
} from "@/types/api/payment";

export const paymentApi = {
  createIntent: (payload: CreatePaymentIntentPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.payment.createIntent, payload),

  confirm: (payload: ConfirmPaymentPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.payment.confirm, payload),

  refund: (payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.payment.refund, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.payment.list, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.payment.byId(id)),

  getStatusByBooking: (bookingId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.payment.statusByBooking(bookingId)),

  getCommissionBreakdown: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.payment.commissionBreakdown(id)),

  refundById: (id: number | string, payload?: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.payment.refundById(id), payload),
};

export const payoutApi = {
  getCommissionRates: () =>
    http.get<ApiSuccess<CommissionRates>>(ENDPOINTS.payout.commissionRates),

  updateCommissionRates: (payload: CommissionRates) =>
    http.put<ApiSuccess<CommissionRates>>(ENDPOINTS.payout.commissionRates, payload),

  listEligible: (params?: ApiListParams) =>
    http.get<ApiSuccess<Payout[]>>(ENDPOINTS.payout.adminPayouts, params),

  listHistory: (params?: ApiListParams) =>
    http.get<ApiSuccess<Payout[]>>(ENDPOINTS.payout.history, params),

  markPaid: (id: number | string, payload?: MarkPayoutPaidPayload) =>
    http.post<ApiSuccess<Payout>>(ENDPOINTS.payout.process(id), payload),

  markEligible: (id: number | string) =>
    http.post<ApiSuccess<Payout>>(ENDPOINTS.payout.markEligible(id)),
};

export default paymentApi;
