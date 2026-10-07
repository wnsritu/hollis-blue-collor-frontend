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

  const defaultMonths = (() => {
    const months = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleString("en-US", { month: "short" });
      months.push({
        month: mStr,
        revenue: i === 0 ? gross : 0,
        commission: i === 0 ? commission : 0,
      });
    }
    return months;
  })();

  const revenueSeries = data?.revenue_series && data.revenue_series.length > 0
    ? data.revenue_series
    : defaultMonths;

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Monthly Earnings Trend</h2>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
            {usd(data?.net_earnings ?? (gross - commission))} net
          </span>
        </div>

        {(() => {
          if (revenueSeries.length === 0) {
            return (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
                <p className="text-sm text-muted-foreground">No revenue data yet.</p>
              </div>
            );
          }
          const maxRevenue = Math.max(...revenueSeries.map((s) => s.revenue), 1);
          return (
            <div
              className="grid h-40 items-end gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4"
              style={{ gridTemplateColumns: `repeat(${revenueSeries.length}, minmax(0, 1fr))` }}
            >
              {revenueSeries.map((item) => {
                const heightPct = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 8 : 4) : 4;
                return (
                  <div key={item.month} className="group flex h-full flex-col items-center justify-end gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground opacity-70 group-hover:opacity-100">
                      ${item.revenue > 0 ? item.revenue.toFixed(0) : "0"}
                    </span>
                    <div
                      className="w-full max-w-[32px] rounded-t-lg bg-primary/85 transition-all group-hover:bg-primary"
                      style={{ height: `${heightPct}%` }}
                      title={`${item.month}: $${item.revenue.toFixed(2)} revenue, $${item.commission.toFixed(2)} commission`}
                    />
                    <span className="text-xs font-medium text-muted-foreground">{item.month}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
