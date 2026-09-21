import React, { useState } from "react";
import { Download, Percent, Receipt, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { MockNotice, PageHeader, StatCard } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

const mockPaidTransactions = [
  { id: "tx_101", providerName: "ABC Plumbing Co.", amount: 850, category: "Plumbing", rating: 4.9 },
  { id: "tx_102", providerName: "Summit Electric", amount: 1480, category: "Electrical", rating: 4.8 },
  { id: "tx_103", providerName: "BrightHome Cleaning", amount: 285, category: "Cleaning", rating: 4.7 },
  { id: "tx_104", providerName: "ABC Plumbing Co.", amount: 210, category: "Plumbing", rating: 4.9 },
  { id: "tx_105", providerName: "Summit Electric", amount: 650, category: "Electrical", rating: 4.8 },
  { id: "tx_106", providerName: "CoolAir HVAC Solutions", amount: 1200, category: "HVAC", rating: 4.9 },
  { id: "tx_107", providerName: "BrightHome Cleaning", amount: 165, category: "Cleaning", rating: 4.7 },
];

const mockCategories = [
  { name: "Electrical", openJobs: 18, pros: 34 },
  { name: "Plumbing", openJobs: 14, pros: 28 },
  { name: "HVAC", openJobs: 9, pros: 19 },
  { name: "Cleaning", openJobs: 22, pros: 42 },
  { name: "Lawn & Garden", openJobs: 11, pros: 15 },
];

export function splitAmount(amount: number, rate: number = 15) {
  const commission = Math.round((amount * rate) / 100);
  const payable = amount - commission;
  return { commission, payable };
}

export function AdminReports() {
  const [range, setRange] = useState("7m");
  const commissionRate = 15;

  const gross = mockPaidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const commission = mockPaidTransactions.reduce(
    (sum, t) => sum + splitAmount(t.amount, commissionRate).commission,
    0
  );
  const avgJobValue = mockPaidTransactions.length
    ? Math.round(gross / mockPaidTransactions.length)
    : 0;

  // Group by provider
  const providerMap: Record<string, { name: string; jobs: number; volume: number; rating: number }> = {};
  mockPaidTransactions.forEach((t) => {
    if (!providerMap[t.providerName]) {
      providerMap[t.providerName] = { name: t.providerName, jobs: 0, volume: 0, rating: t.rating };
    }
    providerMap[t.providerName].jobs += 1;
    providerMap[t.providerName].volume += t.amount;
  });

  const byProvider = Object.values(providerMap).sort((a, b) => b.volume - a.volume);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Marketplace analytics overview"
        action={
          <div className="flex items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="7m">Last 7 months</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Export queued", {
                  description: "Your CSV report download will begin shortly.",
                })
              }
              className="gap-2"
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross Volume" value={usd(gross)} hint="Paid transactions" icon={Receipt} />
        <StatCard
          label="Commission"
          value={usd(commission)}
          hint={`${commissionRate}% platform take rate`}
          icon={Percent}
          tone="accent"
        />
        <StatCard
          label="Avg. Job Value"
          value={usd(avgJobValue)}
          hint="Per completed service"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Active Providers"
          value={byProvider.length}
          hint="Top earners this month"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top Providers Table */}
        <section className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-lg font-bold">Top Providers by Volume</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProvider.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                  <TableCell className="text-right font-medium">{p.jobs}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{usd(p.volume)}</TableCell>
                  <TableCell className="text-right font-medium">{p.rating} ★</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Category Performance Table */}
        <section className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-lg font-bold">Category Performance</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Open Jobs</TableHead>
                <TableHead className="text-right">Active Pros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCategories.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                  <TableCell className="text-right font-medium">{c.openJobs}</TableCell>
                  <TableCell className="text-right font-bold">{c.pros}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      <MockNotice>
        Analytics reflect transactions and platform activity across active service categories.
      </MockNotice>
    </div>
  );
}

export default AdminReports;
