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
  Tag,
  Wallet,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  markPayoutEligibleApi,
  markPayoutFailedApi,
  retryPayoutApi,
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
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
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
  amount: number | string;
  currency: string;
  status: string;
  notes?: string;
  eligible_at?: string;
  paid_at?: string;
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

export function AdminPayouts() {
  const [activeTab, setActiveTab] = useState("payouts");
  const [loading, setLoading] = useState(true);
  const [releasingAll, setReleasingAll] = useState(false);

  // Payments State (GET /payments)
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payments Pagination State (Default limit = 20)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Payout Queue States
  const [eligiblePayouts, setEligiblePayouts] = useState<PayoutRecord[]>([]);
  const [onHoldPayouts, setOnHoldPayouts] = useState<PayoutRecord[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Mark Paid Modal State
  const [markPaidModalPayout, setMarkPaidModalPayout] = useState<PayoutRecord | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

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
    onConfirm: () => {},
  });

  // Pagination States
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
  }, [fetchPayments, fetchPayouts]);

  const openMarkPaidModal = (payout: PayoutRecord) => {
    setMarkPaidModalPayout(payout);
    setTransferReference("");
    setPayoutNotes("External bank transfer completed by admin");
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidModalPayout) return;
    if (!transferReference.trim()) {
      toast.error("Please enter a valid bank transfer reference code");
      return;
    }

    setSubmittingPayout(true);
    try {
      await processPayoutApi(markPaidModalPayout.id, {
        transfer_reference: transferReference.trim(),
        notes: payoutNotes.trim() || undefined,
      });
      toast.success(`Payout PO-${markPaidModalPayout.id} marked as paid!`);
      setMarkPaidModalPayout(null);
      fetchPayouts();
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to mark payout as paid.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleReleaseAll = () => {
    if (!eligiblePayouts.length) return;
    setConfirmModal({
      open: true,
      title: "Release All Payouts",
      description: `Are you sure you want to release all ${eligiblePayouts.length} pending payouts?`,
      confirmText: "Release Payouts",
      variant: "default",
      onConfirm: async () => {
        const ref = `BULK-RELEASE-${Date.now().toString().slice(-6)}`;
        setReleasingAll(true);
        let successCount = 0;
        try {
          for (const p of eligiblePayouts) {
            try {
              await processPayoutApi(p.id, {
                transfer_reference: ref,
                notes: "Bulk payout release by admin",
              });
              successCount++;
            } catch {
              /* continue remaining payouts */
            }
          }
          toast.success(`Released ${successCount} of ${eligiblePayouts.length} pending payouts!`);
          fetchPayouts();
          fetchPayments();
        } catch (err: any) {
          toast.error("An error occurred during bulk payout release.");
        } finally {
          setReleasingAll(false);
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleMarkFailed = async (payoutId: number) => {
    const reason = prompt("Enter reason for marking this payout as failed (optional):");
    if (reason === null) return;

    setProcessingId(payoutId);
    try {
      await markPayoutFailedApi(payoutId, { notes: reason.trim() || "Marked failed by admin" });
      toast.success(`Payout PO-${payoutId} marked as failed.`);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to mark payout as failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkEligible = (payoutId: number) => {
    setConfirmModal({
      open: true,
      title: "Promote Payout",
      description: `Are you sure you want to promote Payout PO-${payoutId} to eligible?`,
      confirmText: "Promote",
      variant: "default",
      onConfirm: async () => {
        setProcessingId(payoutId);
        try {
          await markPayoutEligibleApi(payoutId);
          toast.success(`Payout PO-${payoutId} promoted to eligible.`);
          fetchPayouts();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to promote payout.");
        } finally {
          setProcessingId(null);
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to retry payout.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Metrics calculations
  const pendingNetTotal = eligiblePayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidNetTotal = payoutHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const allProvidersSet = new Set([
    ...eligiblePayouts.map((p) => p.provider_id || p.provider?.id),
    ...payoutHistory.map((p) => p.provider_id || p.provider?.id),
  ].filter(Boolean));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Queue"
        subtitle="Release full weekly earnings to providers based on completed services."
        action={
          eligiblePayouts.length > 0 ? (
            <Button onClick={handleReleaseAll} disabled={releasingAll} className="gap-1.5 font-semibold">
              {releasingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Release All Pending Payouts
            </Button>
          ) : undefined
        }
      />

      {/* Overview Stat Cards matching Service Connect exact design */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Weekly Payouts"
          value={usd(pendingNetTotal)}
          hint={`${eligiblePayouts.length} provider weeks in queue`}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Released Payouts"
          value={usd(paidNetTotal)}
          hint={`${payoutHistory.length} weekly payouts released`}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Providers Paid"
          value={allProvidersSet.size || 0}
          hint="Active platform providers"
          icon={CheckCircle2}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="payouts">Payout Queue ({eligiblePayouts.length})</TabsTrigger>
          <TabsTrigger value="payments">Transactions Ledger</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold ({onHoldPayouts.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: WEEKLY PAYOUT QUEUE & HISTORY (DEFAULT TAB) */}
        <TabsContent value="payouts" className="space-y-6">
          {/* PENDING PAYOUT QUEUE SECTION */}
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Weekly Payout Queue</h2>
                <p className="text-xs text-muted-foreground">
                  Full week earnings compiled per provider (No individual job IDs).
                </p>
              </div>
            </div>

            {eligiblePayouts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="Payout queue is clear"
                  description="All provider weekly earnings have been reviewed and paid out."
                />
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Start Week</TableHead>
                      <TableHead>End Week</TableHead>
                      <TableHead className="text-center">Completed Services</TableHead>
                      <TableHead className="text-right">Gross Earnings</TableHead>
                      <TableHead className="text-right">Service Fee</TableHead>
                      <TableHead className="text-right font-bold">Net Payout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligiblePayouts.map((p) => {
                      const gross = Number(p.payment?.gross_amount ?? p.payment?.amount ?? p.amount ?? 0);
                      const comm = Number(p.payment?.commission_amount || 0);
                      const net = Number(p.amount || (gross - comm));
                      const providerName = p.provider?.business_name || `Provider #${p.provider_id}`;
                      const startDate = formatDate(p.eligible_at || p.createdAt);
                      const endDate = formatDate(p.eligible_at || p.createdAt);

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-bold text-foreground">{providerName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{startDate}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{endDate}</TableCell>
                          <TableCell className="text-center font-medium">
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                              <Tag size={12} /> 1 service
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{usd(gross || net)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            −{usd(comm)}
                          </TableCell>
                          <TableCell className="text-right font-display text-base font-bold text-primary">
                            {usd(net)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPayout(p)}
                                className="gap-1 text-xs"
                              >
                                <Eye size={14} /> View Page
                              </Button>
                              <Button
                                size="sm"
                                disabled={processingId === p.id}
                                onClick={() => openMarkPaidModal(p)}
                                className="text-xs"
                              >
                                Mark Paid
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Eligible Payout Queue Pagination Bar */}
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
                        onClick={() => setEligiblePage((p) => Math.max(1, p - 1))}
                        className="h-8 text-xs gap-1"
                      >
                        <ChevronLeft size={14} /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={eligiblePage >= eligibleTotalPages}
                        onClick={() => setEligiblePage((p) => Math.min(eligibleTotalPages, p + 1))}
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

          {/* COMPLETED WEEKLY PAYOUT HISTORY SECTION */}
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <h2 className="px-6 pt-5 font-display text-lg font-bold">Weekly Payout History</h2>
            <div className="mt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Start Week</TableHead>
                    <TableHead>End Week</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                        No released weekly payouts in history yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.provider?.business_name || `Provider #${p.provider_id}`}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(p.eligible_at || p.createdAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(p.paid_at || p.updatedAt)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {usd(Number(p.amount))}
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(p.paid_at || p.updatedAt)}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status || "Paid"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPayout(p)}
                            className="gap-1 text-xs"
                          >
                            <Eye size={14} /> View Services
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-6 pt-4">
              <MockNotice>
                Payouts are compiled week-wise and processed manually by Admin.
              </MockNotice>
            </div>
          </section>
        </TabsContent>

        {/* TAB 2: REAL PAYMENTS LEDGER (GET /payments) */}
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

            {/* Payments Ledger Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page <strong className="text-foreground">{page}</strong> of{" "}
                  <strong className="text-foreground">{totalPages}</strong> ({total} total transactions)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft size={14} /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 text-xs gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
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
                  Payouts waiting for job completion, dispute window expiry (24h), or admin review.
                </p>
              </div>
            </div>

            {onHoldPayouts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={PauseCircle}
                  title="No on-hold payouts"
                  description="There are currently no payouts frozen on hold."
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
                      {/* <TableHead>Dispute Deadline</TableHead>
                      <TableHead>Dispute Status</TableHead> */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onHoldPayouts.map((p) => {
                      const dispute = p.booking?.dispute;
                      const deadlinePassed = p.booking?.dispute_deadline_at
                        ? new Date(p.booking.dispute_deadline_at).getTime() <= Date.now()
                        : false;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">PO-{p.id}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {p.booking?.id ? `BK-${p.booking.id}` : "N/A"}
                            <span className="block text-[10px] text-muted-foreground">
                              {p.booking?.appointment_status || "Pending"}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-xs">
                            {p.provider?.business_name || `Provider #${p.provider_id}`}
                          </TableCell>
                          <TableCell className="text-right font-display text-base font-bold text-primary">
                            {usd(Number(p.amount))}
                          </TableCell>
                          {/* <TableCell className="text-xs text-muted-foreground">
                            {formatDate(p.booking?.dispute_deadline_at)}
                            {deadlinePassed ? (
                              <span className="block text-[10px] text-emerald-600 font-medium">Window Expired</span>
                            ) : (
                              <span className="block text-[10px] text-amber-600 font-medium">In Dispute Window</span>
                            )}
                          </TableCell> */}
                          {/* <TableCell>
                            {dispute ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                                  Dispute #{dispute.id} ({dispute.status})
                                </span>
                                {dispute.issue_type && (
                                  <span className="block text-[10px] text-muted-foreground capitalize">
                                    Issue: {dispute.issue_type.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No dispute</span>
                            )}
                          </TableCell> */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingId === p.id}
                                onClick={() => handleMarkEligible(p.id)}
                                className="text-xs gap-1 h-7"
                              >
                                {processingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                Mark Eligible
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === p.id}
                                onClick={() => handleMarkFailed(p.id)}
                                className="text-xs gap-1 h-7"
                              >
                                Mark Failed
                              </Button>
                            </div>
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
                        onClick={() => setOnHoldPage((p) => Math.max(1, p - 1))}
                        className="h-8 text-xs gap-1"
                      >
                        <ChevronLeft size={14} /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={onHoldPage >= onHoldTotalPages}
                        onClick={() => setOnHoldPage((p) => Math.min(onHoldTotalPages, p + 1))}
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

      {/* WEEKLY SERVICES VIEW MODAL */}
      {selectedPayout && (
        <Dialog open={Boolean(selectedPayout)} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Provider Weekly Services &amp; Earnings
              </DialogTitle>
              <DialogDescription className="text-xs">
                Period: <strong>{formatDate(selectedPayout.eligible_at || selectedPayout.createdAt)}</strong> · Provider:{" "}
                <strong>{selectedPayout.provider?.business_name || `Provider #${selectedPayout.provider_id}`}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Summary Banner */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Gross Earnings</span>
                  <span className="font-bold text-foreground text-sm">
                    {usd(Number(selectedPayout.payment?.gross_amount ?? selectedPayout.payment?.amount ?? selectedPayout.amount))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Service Fee</span>
                  <span className="font-bold text-muted-foreground text-sm">
                    −{usd(Number(selectedPayout.payment?.commission_amount || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Net Weekly Payout</span>
                  <span className="font-bold text-primary text-sm font-display">
                    {usd(Number(selectedPayout.amount))}
                  </span>
                </div>
              </div>

              {/* Compact Services List performed */}
              {(() => {
                const booking = selectedPayout.booking || selectedPayout.payment?.booking;
                const customer = booking?.customer;
                const serviceTitle =
                  booking?.service_type?.name ||
                  booking?.service_category ||
                  (booking?.booking_number ? `Booking #${booking.booking_number}` : `Booking #${selectedPayout.booking_id || selectedPayout.payment_id}`);

                const customerName = customer
                  ? customer.full_name || customer.email
                  : null;

                const completedDate = formatDate(
                  booking?.delivered_at || booking?.booking_date || selectedPayout.eligible_at || selectedPayout.createdAt
                );

                const itemGrossAmount = Number(
                  selectedPayout.payment?.gross_amount ?? selectedPayout.payment?.amount ?? selectedPayout.amount
                );

                return (
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <FileText size={14} className="text-muted-foreground" /> Services Performed
                    </h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {serviceTitle}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {customerName ? (
                              <span>Customer: <strong className="text-foreground font-medium">{customerName}</strong> · </span>
                            ) : null}
                            <span>Completed on {completedDate}</span>
                          </p>
                        </div>
                        <span className="font-bold text-foreground text-sm">{usd(itemGrossAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between pt-1">
              <StatusPill status={selectedPayout.status} />

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                  Close
                </Button>
                {selectedPayout.status === "eligible" || selectedPayout.status === "pending" ? (
                  <Button onClick={() => { setSelectedPayout(null); openMarkPaidModal(selectedPayout); }} className="gap-1.5">
                    <CheckCircle2 size={15} /> Release Weekly Payout
                  </Button>
                ) : null}
              </div>
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
                <Banknote size={18} className="text-primary" /> Confirm External Bank Transfer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record manual wire/bank transfer for Payout <strong className="font-mono">PO-{markPaidModalPayout.id}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border p-3 bg-card space-y-1">
                <p className="text-muted-foreground">Provider: <strong className="text-foreground">{markPaidModalPayout.provider?.business_name || `Provider #${markPaidModalPayout.provider_id}`}</strong></p>
                <p className="text-muted-foreground">Bank: <strong className="text-foreground">{markPaidModalPayout.provider?.bank_name || "N/A"}</strong> ({markPaidModalPayout.provider?.bank_account_number || "••••"})</p>
                <p className="text-muted-foreground">Amount: <strong className="text-primary font-bold text-sm">{usd(Number(markPaidModalPayout.amount))}</strong></p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transferRef" className="text-xs font-bold">Bank Transfer Reference Code <span className="text-destructive">*</span></Label>
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
              <Button size="sm" onClick={handleConfirmMarkPaid} disabled={submittingPayout} className="gap-1">
                {submittingPayout ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Paid
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PAYMENT DETAILS DIALOG MODAL */}
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
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Platform Fixed Fee:</span>
                  <span>−{usd(Number(selectedPayment.platform_fee_amount || 0))}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold text-sm text-primary pt-1">
                  <span>Net Provider Payout:</span>
                  <span>{usd(Number(selectedPayment.provider_amount || 0))}</span>
                </div>
              </div>

              {/* Refund Info Callout if Refunded */}
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

              {/* System Identifiers & Gateway Metadata */}
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
                {selectedPayment.idempotency_key && (
                  <div className="flex justify-between text-muted-foreground truncate">
                    <span>Idempotency Key:</span>
                    <span className="font-mono text-foreground max-w-[200px] truncate" title={selectedPayment.idempotency_key}>
                      {selectedPayment.idempotency_key}
                    </span>
                  </div>
                )}
                {selectedPayment.payout_id && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Linked Payout:</span>
                    <span className="font-bold text-primary">PO-{selectedPayment.payout_id} ({selectedPayment.payout?.status || "linked"})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                <div>
                  <span>Payment Date: </span>
                  <strong className="text-foreground">{formatDate(selectedPayment.payment_date || selectedPayment.createdAt)}</strong>
                </div>
                <div>
                  <span>Payment Method: </span>
                  <strong className="text-foreground uppercase">{selectedPayment.payment_method_type || "card"}</strong>
                </div>
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

      {/* Confirmation Modal */}
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
