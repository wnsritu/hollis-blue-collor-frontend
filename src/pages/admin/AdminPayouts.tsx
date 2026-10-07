import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  PauseCircle,
  Percent,
  Receipt,
  RotateCw,
  Search,
  ShieldAlert,
  Tag,
  Wallet,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaginationController from "@/components/ui/PaginationController";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  MockNotice,
  PageHeader,
  StatCard,
  StatusPill,
} from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import {
  listPaymentsApi,
  listEligiblePayoutsApi,
  listOnHoldPayoutsApi,
  listPayoutHistoryApi,
  processPayoutApi,
  releasePayoutApi,
  overridePayoutHoldApi,
  getPayoutSummaryApi,
  retryPayoutApi,
  markPayoutFailedApi,
} from "@/services/payment/payment.service";

export interface AdminPaymentRecord {
  id: number;
  booking_id: number | null;
  provider_id: number | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  refund_id?: string | null;
  refund_amount?: number | string;
  payment_method_type?: string | null;
  metadata?: any;
  payment_date?: string | null;
  gross_amount?: number | string;
  commission_rate?: number | string;
  commission_amount?: number | string;
  platform_fee_amount?: number | string;
  provider_amount?: number | string;
  payout_id?: number | null;
  idempotency_key?: string | null;
  failure_reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  booking?: {
    id: number;
    booking_number: string;
    customer_id: number;
    status: string;
    appointment_status?: string;
    service_category?: string;
    customer?: {
      id: number;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
  };
  provider?: {
    id: number;
    business_name?: string;
    user?: {
      id: number;
      full_name?: string;
      email?: string;
    };
  };
  payout?: {
    id: number;
    status: string;
    amount: number | string;
    eligible_at?: string;
    paid_at?: string;
  };
}

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export interface PayoutRecord {
  id: number;
  provider_id: number;
  payment_id: number;
  booking_id?: number | null;
  gross_amount?: number | string;
  commission_amount?: number | string;
  amount: number | string;
  currency: string;
  status: string;
  hold_reason?: string | null;
  notes?: string;
  eligible_at?: string;
  processed_at?: string;
  paid_at?: string;
  failed_at?: string;
  failure_reason?: string | null;
  transfer_reference?: string;
  createdAt?: string;
  updatedAt?: string;
  provider?: {
    id: number;
    business_name?: string;
    bank_account_holder?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_routing_number?: string;
    bank_account_type?: string;
  };
  payment?: {
    id: number;
    amount: number | string;
    gross_amount: number | string;
    commission_amount: number | string;
    provider_amount: number | string;
    status: string;
    booking?: any;
  };
  booking?: {
    id: number;
    booking_number?: string;
    service_category?: string;
    appointment_status?: string;
    delivered_at?: string;
    dispute_deadline_at?: string;
    booking_date?: string;
    scheduled_date?: string;
    createdAt?: string;
    customer?: {
      id: number;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    service_type?: {
      id: number;
      name?: string;
    };
    dispute?: {
      id: number;
      status: string;
      issue_type?: string;
      admin_decision?: string;
    };
  };
}

export interface SummaryStats {
  pendingPayoutsAmount: number;
  releasedPayoutsAmount: number;
  providersPaidCount: number;
  onHoldAmount: number;
}

export function AdminPayouts() {
  const [activeTab, setActiveTab] = useState("payouts");
  const [loading, setLoading] = useState(true);

  // Summary stats state
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    pendingPayoutsAmount: 0,
    releasedPayoutsAmount: 0,
    providersPaidCount: 0,
    onHoldAmount: 0,
  });

  // Payments Ledger State (GET /payments)
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payments Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Payout Queue & On-Hold States
  const [eligiblePayouts, setEligiblePayouts] = useState<PayoutRecord[]>([]);
  const [onHoldPayouts, setOnHoldPayouts] = useState<PayoutRecord[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Release Modal State
  const [releaseModalPayout, setReleaseModalPayout] = useState<PayoutRecord | null>(null);
  const [releasingPayout, setReleasingPayout] = useState(false);
  const [releasingAll, setReleasingAll] = useState(false);

  // Mark Paid Modal State
  const [markPaidModalPayout, setMarkPaidModalPayout] = useState<PayoutRecord | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Admin Override Modal State (On-Hold Override)
  const [overrideModalPayout, setOverrideModalPayout] = useState<PayoutRecord | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    onConfirm: () => { },
  });

  // Pagination States for Payouts
  const [eligiblePage, setEligiblePage] = useState(1);
  const [eligibleLimit] = useState(20);
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [eligibleTotalPages, setEligibleTotalPages] = useState(1);

  const [onHoldPage, setOnHoldPage] = useState(1);
  const [onHoldLimit] = useState(20);
  const [onHoldTotal, setOnHoldTotal] = useState(0);
  const [onHoldTotalPages, setOnHoldTotalPages] = useState(1);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Reset payment page when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listPaymentsApi({
        page,
        limit,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      const resPayload = res?.data;
      const dataArray = resPayload?.data || (Array.isArray(resPayload) ? resPayload : []);
      const pagination = resPayload?.pagination;

      setPayments(Array.isArray(dataArray) ? dataArray : []);
      if (pagination) {
        setTotal(pagination.total ?? dataArray.length ?? 0);
        setTotalPages(pagination.totalPages ?? Math.ceil((pagination.total || dataArray.length || 1) / limit));
      } else {
        setTotal(dataArray.length || 0);
        setTotalPages(Math.max(1, Math.ceil((dataArray.length || 1) / limit)));
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("Failed to load payments ledger.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getPayoutSummaryApi();
      if (res?.data?.data) {
        setSummaryStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payout summary:", err);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      const [eligibleRes, onHoldRes, historyRes] = await Promise.all([
        listEligiblePayoutsApi({ page: eligiblePage, limit: eligibleLimit }).catch(() => null),
        listOnHoldPayoutsApi({ page: onHoldPage, limit: onHoldLimit }).catch(() => null),
        listPayoutHistoryApi({ page: historyPage, limit: historyLimit }).catch(() => null),
      ]);

      const eligiblePayload = eligibleRes?.data;
      const eligibleData = eligiblePayload?.data || (Array.isArray(eligiblePayload) ? eligiblePayload : []);
      const eligiblePagination = eligiblePayload?.pagination;
      setEligiblePayouts(Array.isArray(eligibleData) ? eligibleData : []);
      setEligibleTotal(eligiblePagination?.total ?? eligibleData.length ?? 0);
      setEligibleTotalPages(
        eligiblePagination?.totalPages ??
        Math.max(1, Math.ceil((eligiblePagination?.total || eligibleData.length || 1) / eligibleLimit))
      );

      const onHoldPayload = onHoldRes?.data;
      const onHoldData = onHoldPayload?.data || (Array.isArray(onHoldPayload) ? onHoldPayload : []);
      const onHoldPagination = onHoldPayload?.pagination;
      setOnHoldPayouts(Array.isArray(onHoldData) ? onHoldData : []);
      setOnHoldTotal(onHoldPagination?.total ?? onHoldData.length ?? 0);
      setOnHoldTotalPages(
        onHoldPagination?.totalPages ??
        Math.max(1, Math.ceil((onHoldPagination?.total || onHoldData.length || 1) / onHoldLimit))
      );

      const historyPayload = historyRes?.data;
      const historyData = historyPayload?.data || (Array.isArray(historyPayload) ? historyPayload : []);
      const historyPagination = historyPayload?.pagination;
      setPayoutHistory(Array.isArray(historyData) ? historyData : []);
      setHistoryTotal(historyPagination?.total ?? historyData.length ?? 0);
      setHistoryTotalPages(
        historyPagination?.totalPages ??
        Math.max(1, Math.ceil((historyPagination?.total || historyData.length || 1) / historyLimit))
      );
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    }
  }, [eligiblePage, eligibleLimit, onHoldPage, onHoldLimit, historyPage, historyLimit]);

  useEffect(() => {
    fetchPayments();
    fetchPayouts();
    fetchSummary();
  }, [fetchPayments, fetchPayouts, fetchSummary]);

  // Open Release Confirmation Drawer/Modal
  const openReleaseModal = (payout: PayoutRecord) => {
    setReleaseModalPayout(payout);
  };

  const handleConfirmRelease = async () => {
    if (!releaseModalPayout) return;
    setReleasingPayout(true);
    try {
      await releasePayoutApi(releaseModalPayout.id);
      toast.success(`Payout PO-${releaseModalPayout.id} released for processing!`);
      setReleaseModalPayout(null);
      fetchPayouts();
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to release payout.");
    } finally {
      setReleasingPayout(false);
    }
  };

  // Open Mark Paid Modal
  const openMarkPaidModal = (payout: PayoutRecord) => {
    setMarkPaidModalPayout(payout);
    setTransferReference("");
    setPayoutNotes("Manual bank transfer completed by admin");
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidModalPayout) return;
    if (!transferReference.trim()) {
      toast.error("Transfer reference code is required");
      return;
    }

    setSubmittingPayout(true);
    try {
      await processPayoutApi(markPaidModalPayout.id, {
        transfer_reference: transferReference.trim(),
        notes: payoutNotes.trim() || undefined,
      });
      toast.success(`Payout PO-${markPaidModalPayout.id} marked as PAID!`);
      setMarkPaidModalPayout(null);
      fetchPayouts();
      fetchPayments();
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to mark payout as paid.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Open Admin Override Modal
  const openOverrideModal = (payout: PayoutRecord) => {
    setOverrideModalPayout(payout);
    setOverrideReason("");
  };

  const handleConfirmOverride = async () => {
    if (!overrideModalPayout) return;
    if (!overrideReason.trim()) {
      toast.error("Mandatory override reason is required");
      return;
    }

    setConfirmModal({
      open: true,
      title: "Confirm Admin Hold Override",
      description: `Are you sure you want to override hold and force Payout PO-${overrideModalPayout.id} to ELIGIBLE? Reason: "${overrideReason.trim()}"`,
      confirmText: "Confirm Override",
      variant: "default",
      onConfirm: async () => {
        setSubmittingOverride(true);
        try {
          await overridePayoutHoldApi(overrideModalPayout.id, {
            reason: overrideReason.trim(),
          });
          toast.success(`Payout PO-${overrideModalPayout.id} overridden to ELIGIBLE!`);
          setOverrideModalPayout(null);
          setSelectedPayout(null);
          fetchPayouts();
          fetchSummary();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to override hold.");
        } finally {
          setSubmittingOverride(false);
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleRetryPayout = async (payoutId: number) => {
    setProcessingId(payoutId);
    try {
      await retryPayoutApi(payoutId);
      toast.success(`Payout PO-${payoutId} reset for retry.`);
      fetchPayouts();
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to retry payout.");
    } finally {
      setProcessingId(null);
    }
  };

  // Helper for masking bank account number
  const maskBankAccount = (accountNum?: string) => {
    if (!accountNum) return "****1234";
    const str = String(accountNum).trim();
    if (str.length <= 4) return `****${str}`;
    return `****${str.slice(-4)}`;
  };

  const handleReleaseAllPending = async () => {
    const readyPayouts = eligiblePayouts.filter(
      (p) => (p.status || "").toLowerCase() === "eligible"
    );

    if (readyPayouts.length === 0) {
      toast.error("No eligible payouts ready for release.");
      return;
    }

    const totalToRelease = readyPayouts.reduce(
      (acc, p) => acc + Number(p.amount || 0),
      0
    );

    setConfirmModal({
      open: true,
      title: "Release All Pending Payouts",
      description: `Are you sure you want to release all ${readyPayouts.length} eligible payout(s) totaling ${usd(totalToRelease)} for processing?`,
      confirmText: `Release ${readyPayouts.length} Payouts`,
      variant: "default",
      onConfirm: async () => {
        setReleasingAll(true);
        try {
          let count = 0;
          for (const p of readyPayouts) {
            try {
              await releasePayoutApi(p.id);
              count++;
            } catch (e) {
              console.error(`Failed to release payout PO-${p.id}`, e);
            }
          }
          toast.success(`Successfully released ${count} payout(s) for processing!`);
          fetchPayouts();
          fetchSummary();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to release pending payouts.");
        } finally {
          setReleasingAll(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Queue"
        subtitle="Release full weekly earnings to providers based on completed services."
        action={
          <Button
            onClick={handleReleaseAllPending}
            disabled={releasingAll || eligiblePayouts.filter((p) => (p.status || "").toLowerCase() === "eligible").length === 0}
            className="gap-2 bg-[#0B2A4A] text-white hover:bg-[#081F38] font-bold shadow-sm"
          >
            {releasingAll ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            Release All Pending Payouts
          </Button>
        }
      />

      {/* Top Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Weekly Payouts"
          value={usd(summaryStats.pendingPayoutsAmount)}
          hint="Eligible & Ready for Admin Release"
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Released Payouts"
          value={usd(summaryStats.releasedPayoutsAmount)}
          hint="Total Provider Earnings Paid"
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="On Hold Payouts"
          value={usd(summaryStats.onHoldAmount)}
          hint="Awaiting Service / Dispute Expiry"
          icon={PauseCircle}
          tone="accent"
        />
        <StatCard
          label="Providers Paid"
          value={summaryStats.providersPaidCount}
          hint="Distinct Providers Paid"
          icon={CheckCircle2}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="payouts">Payout Queue ({eligiblePayouts.length})</TabsTrigger>
          <TabsTrigger value="payments">Transactions Ledger</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold ({onHoldPayouts.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: PAYOUT QUEUE & HISTORY (ELIGIBLE & PROCESSING ONLY) */}
        <TabsContent value="payouts" className="space-y-6">
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Payout Queue</h2>
                <p className="text-xs text-muted-foreground">
                  Money currently owed to providers and ready for release.
                </p>
              </div>
            </div>

            {eligiblePayouts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="Payout queue is empty"
                  description="No eligible payouts awaiting release at this time."
                />
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-center">Bookings</TableHead>
                      <TableHead className="text-right">Eligible Earnings</TableHead>
                      <TableHead className="text-right">Platform Commission</TableHead>
                      <TableHead className="text-right font-bold">Provider Payable</TableHead>
                      <TableHead>Eligible Since</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligiblePayouts.map((p) => {
                      const gross = Number(p.gross_amount ?? p.payment?.gross_amount ?? p.payment?.amount ?? p.amount ?? 0);
                      const comm = Number(p.commission_amount ?? p.payment?.commission_amount ?? 0);
                      const net = Number(p.amount || Math.max(0, gross - comm));
                      const providerName = p.provider?.business_name || `Provider #${p.provider_id}`;
                      const eligibleDate = formatDate(p.eligible_at || p.createdAt);

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-bold text-foreground">{providerName}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                              <Tag size={12} /> 1 service
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{usd(gross)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            −{usd(comm)}
                          </TableCell>
                          <TableCell className="text-right font-display text-base font-bold text-primary">
                            {usd(net)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{eligibleDate}</TableCell>
                          <TableCell>
                            <StatusPill status={p.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPayout(p)}
                                className="gap-1 text-xs"
                              >
                                <Eye size={14} /> View
                              </Button>
                              {p.status === "eligible" ? (
                                <Button
                                  size="sm"
                                  onClick={() => openReleaseModal(p)}
                                  className="text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                                >
                                  Release Payout
                                </Button>
                              ) : p.status === "processing" ? (
                                <Button
                                  size="sm"
                                  onClick={() => openMarkPaidModal(p)}
                                  className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                >
                                  Mark Paid
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Eligible Payout Queue Pagination */}
                {eligibleTotalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page <strong className="text-foreground">{eligiblePage}</strong> of{" "}
                      <strong className="text-foreground">{eligibleTotalPages}</strong> ({eligibleTotal} total eligible payouts)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={eligiblePage <= 1}
                        onClick={() => setEligiblePage((pg) => Math.max(1, pg - 1))}
                        className="h-8 text-xs gap-1"
                      >
                        <ChevronLeft size={14} /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={eligiblePage >= eligibleTotalPages}
                        onClick={() => setEligiblePage((pg) => Math.min(eligibleTotalPages, pg + 1))}
                        className="h-8 text-xs gap-1"
                      >
                        Next <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* COMPLETED PAYOUT HISTORY SECTION */}
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <h2 className="px-6 pt-5 font-display text-lg font-bold">Payout History</h2>
            <div className="mt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Transfer Ref</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                        No released payouts in history yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs font-bold">PO-{p.id}</TableCell>
                        <TableCell className="font-medium text-xs">{p.provider?.business_name || `Provider #${p.provider_id}`}</TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          {usd(Number(p.amount))}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.transfer_reference || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(p.paid_at || p.updatedAt)}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedPayout(p)}
                              className="gap-1 text-xs"
                            >
                              <Eye size={14} /> View
                            </Button>
                            {p.status === "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingId === p.id}
                                onClick={() => handleRetryPayout(p.id)}
                                className="text-xs gap-1 h-7 border-amber-500/50 text-amber-600 hover:bg-amber-50"
                              >
                                {processingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-6 pt-4">
              <MockNotice>
                Provider payouts are processed manually by Admin and tracked on ledger.
              </MockNotice>
            </div>
          </section>
        </TabsContent>

        {/* TAB 2: TRANSACTIONS LEDGER (GET /payments) */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tx ID, customer or provider…"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading payments ledger...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Receipt}
                  title="No payments found"
                  description="No marketplace transactions match your filter criteria."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tx ID</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Gross Amount</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right font-bold">Provider Net</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const txId = p.stripe_payment_intent_id || `TX-${p.id}`;
                    const bookingNum = p.booking?.booking_number || (p.booking_id ? `BK-${p.booking_id}` : "N/A");
                    const customerName =
                      p.booking?.customer?.full_name ||
                      (p.booking?.customer?.first_name
                        ? `${p.booking.customer.first_name} ${p.booking.customer.last_name || ""}`
                        : `Customer #${p.booking?.customer_id || "N/A"}`);
                    const providerName =
                      p.provider?.business_name ||
                      p.provider?.user?.full_name ||
                      `Provider #${p.provider_id || "N/A"}`;

                    const gross = Number(p.gross_amount ?? p.amount ?? 0);
                    const comm = Number(p.commission_amount || 0);
                    const platFee = Number(p.platform_fee_amount || 0);
                    const totalFee = comm + platFee;
                    const net = Number(p.provider_amount || Math.max(0, gross - totalFee));

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs font-bold text-foreground max-w-[140px] truncate" title={txId}>
                          {txId}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-foreground">{bookingNum}</TableCell>
                        <TableCell className="text-xs">{customerName}</TableCell>
                        <TableCell className="text-xs font-medium">{providerName}</TableCell>
                        <TableCell className="text-right font-medium">{usd(gross)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          −{usd(totalFee)}
                          {p.commission_rate ? (
                            <span className="block text-[10px] text-muted-foreground">({p.commission_rate}%)</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{usd(net)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(p.payment_date || p.createdAt)}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPayment(p)}
                            className="gap-1 text-xs"
                          >
                            <Eye size={14} /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Payments Ledger Pagination */}
            {total > 0 && (
              <div className="px-6 py-4 border-t border-border">
                <PaginationController
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  onPageChange={setPage}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: ON HOLD PAYOUTS */}
        <TabsContent value="on_hold" className="space-y-6">
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">On-Hold Payouts</h2>
                <p className="text-xs text-muted-foreground">
                  Payouts waiting for service completion, 24h dispute window, missing bank details, or admin review.
                </p>
              </div>
            </div>

            {onHoldPayouts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={PauseCircle}
                  title="No on-hold payouts"
                  description="There are currently no payouts held."
                />
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Booking / Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Payout Amount</TableHead>
                      <TableHead>Hold Reason</TableHead>
                      <TableHead>Eligible On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onHoldPayouts.map((p) => {
                      const bookingStr = p.booking?.booking_number
                        ? `${p.booking.booking_number}`
                        : p.booking?.id
                          ? `BK-${p.booking.id}`
                          : "N/A";
                      const bookingStatus = p.booking?.appointment_status || "Requested";
                      const holdReasonText = p.hold_reason || "Service not completed";
                      const eligibleOnDate = formatDate(p.eligible_at);

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">PO-{p.id}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {bookingStr} · <span className="capitalize">{bookingStatus}</span>
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-xs">
                            {p.provider?.business_name || `Provider #${p.provider_id}`}
                          </TableCell>
                          <TableCell className="text-right font-display text-base font-bold text-primary">
                            {usd(Number(p.amount))}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            {holdReasonText}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {eligibleOnDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPayout(p)}
                              className="text-xs gap-1 h-8"
                            >
                              <Eye size={14} /> View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {onHoldTotalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page <strong className="text-foreground">{onHoldPage}</strong> of{" "}
                      <strong className="text-foreground">{onHoldTotalPages}</strong> ({onHoldTotal} total on-hold payouts)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={onHoldPage <= 1}
                        onClick={() => setOnHoldPage((pg) => Math.max(1, pg - 1))}
                        className="h-8 text-xs gap-1"
                      >
                        <ChevronLeft size={14} /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={onHoldPage >= onHoldTotalPages}
                        onClick={() => setOnHoldPage((pg) => Math.min(onHoldTotalPages, pg + 1))}
                        className="h-8 text-xs gap-1"
                      >
                        Next <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* RELEASE CONFIRMATION MODAL / DRAWER */}
      {releaseModalPayout && (
        <Dialog open={Boolean(releaseModalPayout)} onOpenChange={() => setReleaseModalPayout(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" /> Confirm Payout Release
              </DialogTitle>
              <DialogDescription className="text-xs">
                Release payout to processing for manual admin bank transfer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border border-border p-3.5 bg-card space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <strong className="text-foreground font-semibold">{releaseModalPayout.provider?.business_name || `Provider #${releaseModalPayout.provider_id}`}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout ID:</span>
                  <strong className="font-mono text-foreground">PO-{releaseModalPayout.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bookings Count:</span>
                  <strong className="text-foreground">1 service</strong>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span className="font-medium text-foreground">{usd(Number(releaseModalPayout.gross_amount ?? releaseModalPayout.payment?.gross_amount ?? releaseModalPayout.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Commission:</span>
                  <span className="text-muted-foreground">−{usd(Number(releaseModalPayout.commission_amount ?? releaseModalPayout.payment?.commission_amount ?? 0))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 text-primary">
                  <span>Provider Payable:</span>
                  <span className="font-display">{usd(Number(releaseModalPayout.amount))}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Account:</span>
                  <strong className="font-mono text-foreground">{maskBankAccount(releaseModalPayout.provider?.bank_account_number)} ({releaseModalPayout.provider?.bank_name || "Bank"})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eligible Since:</span>
                  <span className="text-foreground">{formatDate(releaseModalPayout.eligible_at || releaseModalPayout.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReleaseModalPayout(null)} disabled={releasingPayout}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmRelease} disabled={releasingPayout} className="gap-1.5 font-semibold">
                {releasingPayout ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Release
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MARK PAID MODAL */}
      {markPaidModalPayout && (
        <Dialog open={Boolean(markPaidModalPayout)} onOpenChange={() => setMarkPaidModalPayout(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Banknote size={18} className="text-emerald-600" /> Record Manual Bank Transfer (Mark Paid)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record transfer reference code for Payout <strong className="font-mono">PO-{markPaidModalPayout.id}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border p-3 bg-card space-y-1">
                <p className="text-muted-foreground">Provider: <strong className="text-foreground">{markPaidModalPayout.provider?.business_name || `Provider #${markPaidModalPayout.provider_id}`}</strong></p>
                <p className="text-muted-foreground">Bank Account: <strong className="text-foreground">{maskBankAccount(markPaidModalPayout.provider?.bank_account_number)} ({markPaidModalPayout.provider?.bank_name || "Bank"})</strong></p>
                <p className="text-muted-foreground">Payable Amount: <strong className="text-primary font-bold text-sm">{usd(Number(markPaidModalPayout.amount))}</strong></p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transferRef" className="text-xs font-bold">Transfer / Reference Code <span className="text-destructive">*</span></Label>
                <Input
                  id="transferRef"
                  placeholder="e.g. WIRE-88492015 or CHASE-TX-993"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payoutNotes" className="text-xs font-medium">Notes (optional)</Label>
                <Textarea
                  id="payoutNotes"
                  placeholder="Additional transfer notes..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMarkPaidModalPayout(null)} disabled={submittingPayout}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmMarkPaid} disabled={submittingPayout} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {submittingPayout ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Paid
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* VIEW PAYOUT DETAILS MODAL */}
      {selectedPayout && (
        <Dialog open={Boolean(selectedPayout)} onOpenChange={() => { setSelectedPayout(null); setOverrideModalPayout(null); }}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Payout Details — PO-{selectedPayout.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Status: <StatusPill status={selectedPayout.status} /> · Provider:{" "}
                <strong>{selectedPayout.provider?.business_name || `Provider #${selectedPayout.provider_id}`}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Summary Banner */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Gross Amount</span>
                  <span className="font-bold text-foreground text-sm">
                    {usd(Number(selectedPayout.gross_amount ?? selectedPayout.payment?.gross_amount ?? selectedPayout.amount))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Platform Commission</span>
                  <span className="font-bold text-muted-foreground text-sm">
                    −{usd(Number(selectedPayout.commission_amount ?? selectedPayout.payment?.commission_amount ?? 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Provider Payable</span>
                  <span className="font-bold text-primary text-sm font-display">
                    {usd(Number(selectedPayout.amount))}
                  </span>
                </div>
              </div>

              {/* Hold Reason Banner if On Hold */}
              {selectedPayout.status === "on_hold" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                    <AlertCircle size={15} /> Hold Reason
                  </div>
                  <p className="text-amber-900 dark:text-amber-200 font-medium">
                    {selectedPayout.hold_reason || "Service not completed or dispute window active"}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Expected Eligibility Date: <strong>{formatDate(selectedPayout.eligible_at)}</strong>
                  </p>
                </div>
              )}

              {/* Bank Account Details */}
              <div className="rounded-xl border border-border p-3.5 bg-card text-xs space-y-1">
                <p className="font-bold text-foreground mb-1">Provider Bank Information</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Account Holder:</span>
                  <strong className="text-foreground">{selectedPayout.provider?.bank_account_holder || selectedPayout.provider?.business_name || "N/A"}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Bank Name:</span>
                  <strong className="text-foreground">{selectedPayout.provider?.bank_name || "N/A"}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Account Number:</span>
                  <strong className="font-mono text-foreground">{maskBankAccount(selectedPayout.provider?.bank_account_number)}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Routing / Swift:</span>
                  <strong className="font-mono text-foreground">{selectedPayout.provider?.bank_routing_number || "N/A"}</strong>
                </div>
              </div>

              {/* Controlled Admin Override Box for ON_HOLD */}
              {selectedPayout.status === "on_hold" && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                    <ShieldAlert size={15} /> Admin Override Action
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    If required by policy, you may force override this hold to make the payout ELIGIBLE. This requires a mandatory reason and will be permanently recorded in the audit log.
                  </p>
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="overrideReasonInput" className="text-[11px] font-bold">Mandatory Override Reason *</Label>
                    <Textarea
                      id="overrideReasonInput"
                      placeholder="Enter justification for manual override..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="text-xs min-h-[50px] bg-background"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!overrideReason.trim() || submittingOverride}
                    onClick={() => { openOverrideModal(selectedPayout); handleConfirmOverride(); }}
                    className="w-full text-xs font-semibold gap-1 mt-1"
                  >
                    {submittingOverride ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Override Hold &amp; Mark Eligible
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between pt-1">
              <StatusPill status={selectedPayout.status} />

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                  Close
                </Button>
                {selectedPayout.status === "eligible" && (
                  <Button onClick={() => { setSelectedPayout(null); openReleaseModal(selectedPayout); }} className="gap-1.5">
                    <CheckCircle2 size={15} /> Release Payout
                  </Button>
                )}
                {selectedPayout.status === "processing" && (
                  <Button onClick={() => { setSelectedPayout(null); openMarkPaidModal(selectedPayout); }} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Banknote size={15} /> Mark Paid
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PAYMENT DETAILS DIALOG MODAL (FOR TRANSACTIONS LEDGER) */}
      {selectedPayment && (
        <Dialog open={Boolean(selectedPayment)} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Receipt size={18} className="text-primary" /> Payment Breakdown &amp; Audit
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transaction ID: <strong className="font-mono">{selectedPayment.stripe_payment_intent_id || `TX-${selectedPayment.id}`}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border p-3 bg-card">
                  <p className="text-muted-foreground font-semibold">Booking Info</p>
                  <p className="font-bold text-foreground mt-0.5">
                    {selectedPayment.booking?.booking_number || (selectedPayment.booking_id ? `BK-${selectedPayment.booking_id}` : "N/A")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Category: {selectedPayment.booking?.service_category || "General Service"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-card">
                  <p className="text-muted-foreground font-semibold">Customer</p>
                  <p className="font-bold text-foreground mt-0.5">
                    {selectedPayment.booking?.customer?.full_name ||
                      (selectedPayment.booking?.customer?.first_name
                        ? `${selectedPayment.booking.customer.first_name} ${selectedPayment.booking.customer.last_name || ""}`
                        : `Customer #${selectedPayment.booking?.customer_id || "N/A"}`)}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{selectedPayment.booking?.customer?.email || selectedPayment.booking?.customer?.phone || ""}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-card text-xs">
                <p className="text-muted-foreground font-semibold">Provider / Business</p>
                <p className="font-bold text-foreground mt-0.5">
                  {selectedPayment.provider?.business_name || selectedPayment.provider?.user?.full_name || `Provider #${selectedPayment.provider_id || "N/A"}`}
                </p>
              </div>

              {/* Commission Split Box */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span>Gross Job Amount:</span>
                  <span className="font-bold">{usd(Number(selectedPayment.gross_amount ?? selectedPayment.amount))}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Platform Commission ({selectedPayment.commission_rate ?? 0}%):</span>
                  <span>−{usd(Number(selectedPayment.commission_amount || 0))}</span>
                </div>
                {/* <div className="flex items-center justify-between text-muted-foreground">
                  <span>Platform Fixed Fee:</span>
                  <span>−{usd(Number(selectedPayment.platform_fee_amount || 0))}</span>
                </div> */}
                <Separator />
                <div className="flex items-center justify-between font-bold text-sm text-primary pt-1">
                  <span>Net Provider Payout:</span>
                  <span>{usd(Number(selectedPayment.provider_amount || 0))}</span>
                </div>
              </div>

              {/* Refund Info Callout */}
              {(selectedPayment.refund_id || Number(selectedPayment.refund_amount) > 0) && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs space-y-1">
                  <p className="font-bold text-amber-600 dark:text-amber-400">Refund Summary</p>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Refund ID:</span>
                    <span className="font-mono text-foreground">{selectedPayment.refund_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Refund Amount:</span>
                    <span className="font-bold text-foreground">{usd(Number(selectedPayment.refund_amount))}</span>
                  </div>
                </div>
              )}

              {/* Failure Reason Callout */}
              {selectedPayment.failure_reason && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs">
                  <p className="font-bold text-destructive">Failure Reason</p>
                  <p className="text-muted-foreground mt-0.5">{selectedPayment.failure_reason}</p>
                </div>
              )}

              {/* System Identifiers */}
              <div className="rounded-xl border border-border p-3 bg-card space-y-1.5 text-xs">
                <p className="font-bold text-foreground mb-1">Gateway Identifiers &amp; Audit</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Stripe PaymentIntent:</span>
                  <span className="font-mono text-foreground">{selectedPayment.stripe_payment_intent_id || "N/A"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Stripe Customer:</span>
                  <span className="font-mono text-foreground">{selectedPayment.stripe_customer_id || "N/A"}</span>
                </div>
                {selectedPayment.payout_id && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Linked Payout:</span>
                    <span className="font-bold text-primary">PO-{selectedPayment.payout_id} ({selectedPayment.payout?.status || "linked"})</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between pt-1">
              <StatusPill status={selectedPayment.status} />
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}

export default AdminPayouts;
