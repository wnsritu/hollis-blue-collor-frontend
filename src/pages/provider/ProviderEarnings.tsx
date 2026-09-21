import React, { useEffect, useState } from "react";
import { Banknote, Percent, Receipt, Wallet, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MockNotice, PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { dashboardService, type ProviderEarnings as ProviderEarningsData } from "@/services/dashboard/dashboard.service";
import toast from "react-hot-toast";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

export const ProviderEarnings: React.FC = () => {
  const [data, setData] = useState<ProviderEarningsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getProviderEarnings();
      const payload = (res as any)?.data?.data || (res as any)?.data || res;
      if (payload) {
        setData(payload);
      }
    } catch (err: any) {
      console.error("Failed to fetch provider earnings:", err);
      toast.error(err?.response?.data?.message || "Failed to load earnings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading earnings data...</p>
      </div>
    );
  }

  const commissionRate = data?.commission_rate ?? 10;
  const gross = data?.gross_revenue ?? 0;
  const commission = data?.commission_paid ?? 0;
  const payable = data?.payable_balance ?? data?.pending_payout ?? 0;
  const released = data?.released_payouts ?? data?.settled_payouts ?? 0;

  const revenueSeries = data?.revenue_series && data.revenue_series.length > 0
    ? data.revenue_series
    : [
        { month: "Feb", revenue: 0, commission: 0 },
        { month: "Mar", revenue: 0, commission: 0 },
        { month: "Apr", revenue: 0, commission: 0 },
        { month: "May", revenue: 0, commission: 0 },
        { month: "Jun", revenue: 0, commission: 0 },
        { month: "Jul", revenue: 0, commission: 0 },
        { month: "Aug", revenue: gross, commission: commission },
      ];

  const transactionsList = data?.transactions || [];
  const max = Math.max(...revenueSeries.map((r) => r.revenue || 1), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" subtitle={`Current platform commission rate: ${commissionRate}%`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross service revenue" value={usd(gross)} hint="All paid jobs" icon={Receipt} />
        <StatCard label="Platform commission" value={usd(commission)} hint={`${commissionRate}% of gross`} icon={Percent} tone="warning" />
        <StatCard label="Payable balance" value={usd(payable)} hint="Awaiting payout release" icon={Wallet} tone="accent" />
        <StatCard label="Paid out to date" value={usd(released)} hint="Deposited to your bank" icon={Banknote} tone="success" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Monthly earnings trend</h2>
        <div className="mt-6 flex h-52 items-end gap-3">
          {revenueSeries.map((r) => {
            const net = Math.max(0, r.revenue - r.commission);
            const commHeight = max > 0 ? (r.commission / max) * 100 : 0;
            const netHeight = max > 0 ? (net / max) * 100 : 0;

            return (
              <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t-md bg-warning/70 transition-all duration-300"
                    style={{ height: `${commHeight}%` }}
                    title={`Commission ${usd(r.commission)}`}
                  />
                  <div
                    className="w-full rounded-b-md bg-primary transition-all duration-300"
                    style={{ height: `${netHeight}%` }}
                    title={`Net ${usd(net)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{r.month}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" /> Net to provider
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-warning/70" /> Platform commission
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-card">
        <h2 className="px-6 pt-5 font-display text-lg font-bold">Transaction history</h2>
        <div className="mt-4 overflow-x-auto">
          {transactionsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">You receive</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsList.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell>{t.jobId}</TableCell>
                    <TableCell>{t.customer}</TableCell>
                    <TableCell className="text-right">{usd(t.amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">−{usd(t.commissionAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{usd(t.youReceive)}</TableCell>
                    <TableCell>
                      <StatusPill status={t.status} />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={t.payout} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              No transactions recorded yet.
            </div>
          )}
        </div>
        <div className="p-6 pt-4">
          <MockNotice>Payouts are processed according to the platform schedule and verified by administrators.</MockNotice>
        </div>
      </section>
    </div>
  );
};

export default ProviderEarnings;
