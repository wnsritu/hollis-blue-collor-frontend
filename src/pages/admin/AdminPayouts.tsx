import React, { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Percent,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PageHeader,
  StatCard,
  StatusPill,
} from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import {
  listPaymentsApi,
  listEligiblePayoutsApi,
  listPayoutHistoryApi,
  processPayoutApi,
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

export interface PayoutRecord {
  id: number;
  provider_id: number;
  payment_id: number;
  amount: number | string;
  currency: string;
  status: string;
  notes?: string;
  eligible_at?: string;
  paid_at?: string;
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
  };
}

export function AdminPayouts() {
  const [activeTab, setActiveTab] = useState("payments");
  const [loading, setLoading] = useState(true);

  // Payments State (GET /payments)
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payout Queue State (GET /admin/payouts & GET /admin/payouts/history)
  const [eligiblePayouts, setEligiblePayouts] = useState<PayoutRecord[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listPaymentsApi({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 50,
      });
      const data = res?.data?.data || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("Failed to load payments ledger.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  const fetchPayouts = useCallback(async () => {
    try {
      const [eligibleRes, historyRes] = await Promise.all([
        listEligiblePayoutsApi({ limit: 50 }).catch(() => null),
        listPayoutHistoryApi({ limit: 50 }).catch(() => null),
      ]);

      const eligibleData = eligibleRes?.data?.data || eligibleRes?.data || [];
      setEligiblePayouts(Array.isArray(eligibleData) ? eligibleData : []);

      const historyData = historyRes?.data?.data || historyRes?.data || [];
      setPayoutHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchPayouts();
  }, [fetchPayments, fetchPayouts]);

  const handleProcessPayout = async (payoutId: number) => {
    setProcessingId(payoutId);
    try {
      await processPayoutApi(payoutId, {
        transfer_reference: `TR-${Date.now()}`,
        notes: "Payout marked paid by admin.",
      });
      toast.success("Payout marked as paid to provider!");
      setSelectedPayout(null);
      fetchPayouts();
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to process payout.");
    } finally {
      setProcessingId(null);
    }
  };

  // Metrics calculations
  const successfulPayments = payments.filter((p) => p.status === "success" || p.status === "succeeded");
  const totalVolume = successfulPayments.reduce(
    (sum, p) => sum + Number(p.amount || p.gross_amount || 0),
    0
  );
  const totalCommission = successfulPayments.reduce(
    (sum, p) => sum + (Number(p.commission_amount || 0) + Number(p.platform_fee_amount || 0)),
    0
  );
  const totalProviderNet = successfulPayments.reduce(
    (sum, p) => sum + Number(p.provider_amount || 0),
    0
  );
  const eligiblePayoutTotal = eligiblePayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts & Payments Ledger"
        subtitle="Manage marketplace transactions, platform commission, and provider payouts."
      />

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Processed Volume"
          value={usd(totalVolume)}
          hint={`${successfulPayments.length} successful transactions`}
          icon={Receipt}
        />
        <StatCard
          label="Platform Earnings"
          value={usd(totalCommission)}
          hint="Commission + Platform Fees"
          icon={Percent}
          tone="accent"
        />
        <StatCard
          label="Owed to Providers"
          value={usd(totalProviderNet)}
          hint="Net payable earnings"
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Pending Payout Queue"
          value={usd(eligiblePayoutTotal)}
          hint={`${eligiblePayouts.length} eligible payouts`}
          icon={Banknote}
          tone="warning"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="payments">Transactions Ledger</TabsTrigger>
          <TabsTrigger value="payouts">Payout Queue ({eligiblePayouts.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: REAL PAYMENTS LEDGER (GET /payments) */}
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
          </div>
        </TabsContent>

        {/* TAB 2: PAYOUT QUEUE & HISTORY */}
        <TabsContent value="payouts" className="space-y-6">
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Eligible Provider Payout Queue</h2>
                <p className="text-xs text-muted-foreground">
                  Payouts ready for release after successful job completion.
                </p>
              </div>
            </div>

            {eligiblePayouts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={CheckCircle2}
                  title="Payout queue is clear"
                  description="All provider earnings have been reviewed and released."
                />
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Bank Account</TableHead>
                      <TableHead className="text-right">Payout Amount</TableHead>
                      <TableHead>Eligible Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligiblePayouts.map((p) => {
                      const bankInfo = p.provider?.bank_name
                        ? `${p.provider.bank_name} (${p.provider.bank_account_number || "••••"})`
                        : "Bank on file";
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">PO-{p.id}</TableCell>
                          <TableCell className="font-bold text-foreground">
                            {p.provider?.business_name || `Provider #${p.provider_id}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{bankInfo}</TableCell>
                          <TableCell className="text-right font-display text-base font-bold text-primary">
                            {usd(Number(p.amount))}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(p.eligible_at)}</TableCell>
                          <TableCell>
                            <StatusPill status={p.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              disabled={processingId === p.id}
                              onClick={() => handleProcessPayout(p.id)}
                              className="text-xs gap-1"
                            >
                              {processingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              Mark Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* COMPLETED PAYOUT HISTORY */}
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <h2 className="px-6 pt-5 font-display text-lg font-bold">Processed Payout History</h2>
            <div className="mt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">PO-{p.id}</TableCell>
                      <TableCell className="font-medium">{p.provider?.business_name || `Provider #${p.provider_id}`}</TableCell>
                      <TableCell className="text-right font-semibold">{usd(Number(p.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.paid_at)}</TableCell>
                      <TableCell>
                        <StatusPill status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

export default AdminPayouts;
