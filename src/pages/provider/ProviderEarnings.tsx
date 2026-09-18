import { Banknote, Percent, Receipt, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MockNotice, PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

const commissionRate = 10;

const revenueSeries = [
  { month: "Feb", revenue: 0, commission: 0 },
  { month: "Mar", revenue: 0, commission: 0 },
  { month: "Apr", revenue: 0, commission: 0 },
  { month: "May", revenue: 0, commission: 0 },
  { month: "Jun", revenue: 0, commission: 0 },
  { month: "Jul", revenue: 0, commission: 0 },
  { month: "Aug", revenue: 500, commission: 50 },
];

const transactions = [
  {
    id: "TRX-77188",
    jobId: "JOB-10310",
    customer: "Marcus Bell",
    providerId: "abc-plumbing",
    provider: "ABC Plumbing Co.",
    amount: 500,
    commissionRate: 10,
    status: "Paid",
    payout: "Paid",
    date: "Aug 8, 2026",
  },
];

export const ProviderEarnings = () => {
  const mine = transactions;
  const paid = mine.filter((t) => t.status === "Paid");
  const gross = paid.reduce((s, t) => s + t.amount, 0);
  const commission = paid.reduce((s, t) => s + (t.amount * commissionRate) / 100, 0);
  const payable = paid
    .filter((t) => t.payout === "Pending")
    .reduce((s, t) => s + (t.amount * (100 - commissionRate)) / 100, 0);
  const released = paid
    .filter((t) => t.payout === "Paid")
    .reduce((s, t) => s + (t.amount * (100 - commissionRate)) / 100, 0);
  const max = Math.max(...revenueSeries.map((r) => r.revenue || 1));

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
            const net = r.revenue - r.commission;
            return (
              <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t-md bg-warning/70"
                    style={{ height: `${(r.commission / max) * 100}%` }}
                    title={`Commission ${usd(r.commission)}`}
                  />
                  <div
                    className="w-full rounded-b-md bg-primary"
                    style={{ height: `${(net / max) * 100}%` }}
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
              {mine.map((t) => {
                const comm = (t.amount * commissionRate) / 100;
                const rec = t.amount - comm;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell>{t.jobId}</TableCell>
                    <TableCell>{t.customer}</TableCell>
                    <TableCell className="text-right">{usd(t.amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">−{usd(comm)}</TableCell>
                    <TableCell className="text-right font-semibold">{usd(rec)}</TableCell>
                    <TableCell>
                      <StatusPill status={t.status} />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={t.payout === "Paid" ? "Paid" : "Pending"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 pt-4">
          <MockNotice>Payouts are processed according to the platform schedule and verified by administrators.</MockNotice>
        </div>
      </section>
    </div>
  );
};

export default ProviderEarnings;
