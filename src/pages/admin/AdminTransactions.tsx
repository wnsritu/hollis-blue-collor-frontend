import React, { useState } from "react";
import { Percent, Receipt, Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

export interface TransactionRecord {
  id: string;
  jobId: string;
  customer: string;
  provider: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Failed";
  payout: "Paid" | "Pending";
}

const mockTransactions: TransactionRecord[] = [
  {
    id: "TX-9012",
    jobId: "SVC-801",
    customer: "Sarah Whitfield",
    provider: "ABC Plumbing Co.",
    amount: 850,
    date: "Aug 20, 2026",
    status: "Paid",
    payout: "Pending",
  },
  {
    id: "TX-9013",
    jobId: "SVC-901",
    customer: "Sarah Whitfield",
    provider: "Summit Electric",
    amount: 1480,
    date: "Aug 19, 2026",
    status: "Paid",
    payout: "Pending",
  },
  {
    id: "TX-9014",
    jobId: "SVC-701",
    customer: "Marcus Bell",
    provider: "BrightHome Cleaning",
    amount: 285,
    date: "Aug 12, 2026",
    status: "Paid",
    payout: "Paid",
  },
  {
    id: "TX-9015",
    jobId: "SVC-802",
    customer: "Priya Raman",
    provider: "ABC Plumbing Co.",
    amount: 210,
    date: "Aug 22, 2026",
    status: "Paid",
    payout: "Pending",
  },
  {
    id: "TX-9016",
    jobId: "SVC-902",
    customer: "Daniel Ortiz",
    provider: "Summit Electric",
    amount: 650,
    date: "Aug 21, 2026",
    status: "Paid",
    payout: "Pending",
  },
];

export function splitAmount(amount: number, rate: number = 15) {
  const commission = Math.round((amount * rate) / 100);
  const payable = amount - commission;
  return { commission, payable };
}

export function AdminTransactions() {
  const commissionRate = 15;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const list = mockTransactions.filter(
    (t) =>
      `${t.id} ${t.customer} ${t.provider} ${t.jobId}`.toLowerCase().includes(q.toLowerCase()) &&
      (status === "all" || t.status === status)
  );

  const paid = mockTransactions.filter((t) => t.status === "Paid");
  const gross = paid.reduce((s, t) => s + t.amount, 0);
  const commission = paid.reduce(
    (s, t) => s + splitAmount(t.amount, commissionRate).commission,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions Ledger"
        subtitle="All marketplace payments with commission split and payout status"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Processed Volume"
          value={usd(gross)}
          hint={`${paid.length} paid transactions`}
          icon={Receipt}
        />
        <StatCard
          label="Commission Earned"
          value={usd(commission)}
          hint={`${commissionRate}% take rate`}
          icon={Percent}
          tone="accent"
        />
        <StatCard
          label="Owed to Providers"
          value={usd(gross - commission)}
          hint="Net of commission"
          icon={Wallet}
          tone="success"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transaction ID, customer or provider…"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tx ID</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Gross Amount</TableHead>
              <TableHead className="text-right">Commission ({commissionRate}%)</TableHead>
              <TableHead className="text-right font-bold">Provider Net</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Payout Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((t) => {
              const s = splitAmount(t.amount, commissionRate);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">{t.id}</TableCell>
                  <TableCell className="font-medium text-xs">{t.jobId}</TableCell>
                  <TableCell className="text-xs">{t.customer}</TableCell>
                  <TableCell className="text-xs font-medium">{t.provider}</TableCell>
                  <TableCell className="text-right font-medium">{usd(t.amount)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    −{usd(s.commission)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">{usd(s.payable)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
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
    </div>
  );
}

export default AdminTransactions;
