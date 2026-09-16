import React, { useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Tag,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  EmptyState,
  MockNotice,
  PageHeader,
  StatCard,
  StatusPill,
} from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

export type WeeklyPayoutRecord = {
  id: string;
  providerId: string;
  provider: string;
  startWeek: string;
  endWeek: string;
  totalServices: number;
  grossAmount: number;
  status: "Pending" | "Paid";
  paidDate?: string;
  services: {
    id: string;
    serviceName: string;
    customer: string;
    date: string;
    amount: number;
  }[];
};

const initialWeeklyPayouts: WeeklyPayoutRecord[] = [
  {
    id: "WPK-2026-34",
    providerId: "abc-plumbing",
    provider: "ABC Plumbing Co.",
    startWeek: "Aug 18, 2026",
    endWeek: "Aug 24, 2026",
    totalServices: 3,
    grossAmount: 1240,
    status: "Pending",
    services: [
      {
        id: "SVC-801",
        serviceName: "Water Heater Installation",
        customer: "Sarah Whitfield",
        date: "Aug 20, 2026",
        amount: 850,
      },
      {
        id: "SVC-802",
        serviceName: "Drain Cleaning & Hydro Jetting",
        customer: "Priya Raman",
        date: "Aug 22, 2026",
        amount: 210,
      },
      {
        id: "SVC-803",
        serviceName: "Leak Repair & Supply Line Fitting",
        customer: "Marcus Bell",
        date: "Aug 23, 2026",
        amount: 180,
      },
    ],
  },
  {
    id: "WPK-2026-34B",
    providerId: "summit-electric",
    provider: "Summit Electric",
    startWeek: "Aug 18, 2026",
    endWeek: "Aug 24, 2026",
    totalServices: 2,
    grossAmount: 2130,
    status: "Pending",
    services: [
      {
        id: "SVC-901",
        serviceName: "Recessed Lighting (8 Cans & Dimmer)",
        customer: "Sarah Whitfield",
        date: "Aug 19, 2026",
        amount: 1480,
      },
      {
        id: "SVC-902",
        serviceName: "EV Charger Level 2 Circuit Installation",
        customer: "Daniel Ortiz",
        date: "Aug 21, 2026",
        amount: 650,
      },
    ],
  },
  {
    id: "WPK-2026-33",
    providerId: "brighthome-cleaning",
    provider: "BrightHome Cleaning",
    startWeek: "Aug 11, 2026",
    endWeek: "Aug 17, 2026",
    totalServices: 2,
    grossAmount: 450,
    status: "Paid",
    paidDate: "Aug 18, 2026",
    services: [
      {
        id: "SVC-701",
        serviceName: "Deep Home Clean (1,850 sq ft)",
        customer: "Marcus Bell",
        date: "Aug 12, 2026",
        amount: 285,
      },
      {
        id: "SVC-702",
        serviceName: "Standard Whole-Home Maintenance Clean",
        customer: "Priya Raman",
        date: "Aug 15, 2026",
        amount: 165,
      },
    ],
  },
];

export function splitAmount(amount: number, rate: number = 15) {
  const commission = Math.round((amount * rate) / 100);
  const payable = amount - commission;
  return { commission, payable };
}

export function AdminPayouts() {
  const commissionRate = 15;
  const [weeklyPayouts, setWeeklyPayouts] = useState<WeeklyPayoutRecord[]>(initialWeeklyPayouts);
  const [selectedRecord, setSelectedRecord] = useState<WeeklyPayoutRecord | null>(null);

  const pendingQueue = weeklyPayouts.filter((p) => p.status === "Pending");
  const paidQueue = weeklyPayouts.filter((p) => p.status === "Paid");

  const pendingNetTotal = pendingQueue.reduce(
    (sum, p) => sum + splitAmount(p.grossAmount, commissionRate).payable,
    0
  );
  const paidNetTotal = paidQueue.reduce(
    (sum, p) => sum + splitAmount(p.grossAmount, commissionRate).payable,
    0
  );

  const handleReleasePayout = (recordId: string) => {
    setWeeklyPayouts((prev) =>
      prev.map((p) => (p.id === recordId ? { ...p, status: "Paid", paidDate: "Aug 31, 2026" } : p))
    );
    toast.success("Weekly payout released!", {
      description: "Marked as paid to provider bank account.",
    });
    setSelectedRecord(null);
  };

  const handleReleaseAll = () => {
    setWeeklyPayouts((prev) =>
      prev.map((p) => ({ ...p, status: "Paid", paidDate: "Aug 31, 2026" }))
    );
    toast.success("All pending weekly payouts released!", {
      description: `${usd(pendingNetTotal)} sent to providers.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Queue"
        subtitle="Release full weekly earnings to providers based on completed services."
        action={
          pendingQueue.length > 0 ? (
            <Button onClick={handleReleaseAll} className="gap-1.5">
              <CheckCircle2 size={16} /> Release All Pending Payouts
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Weekly Payouts"
          value={usd(pendingNetTotal)}
          hint={`${pendingQueue.length} provider weeks in queue`}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Released Payouts"
          value={usd(paidNetTotal)}
          hint={`${paidQueue.length} weekly payouts released`}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Providers Paid"
          value={new Set(weeklyPayouts.map((p) => p.providerId)).size}
          hint="Active platform providers"
          icon={CheckCircle2}
        />
      </div>

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

        {pendingQueue.length === 0 ? (
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
                  <TableHead className="text-right">Service Fee ({commissionRate}%)</TableHead>
                  <TableHead className="text-right font-bold">Net Payout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingQueue.map((p) => {
                  const s = splitAmount(p.grossAmount, commissionRate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold text-foreground">{p.provider}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.startWeek}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.endWeek}</TableCell>
                      <TableCell className="text-center font-medium">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                          <Tag size={12} /> {p.totalServices} services
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{usd(p.grossAmount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        −{usd(s.commission)}
                      </TableCell>
                      <TableCell className="text-right font-display text-base font-bold text-primary">
                        {usd(s.payable)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRecord(p)}
                            className="gap-1 text-xs"
                          >
                            <Eye size={14} /> View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayout(p.id)}
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
          </div>
        )}
      </section>

      {/* COMPLETED WEEKLY PAYOUT HISTORY */}
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
              {paidQueue.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.provider}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.startWeek}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.endWeek}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {usd(splitAmount(p.grossAmount, commissionRate).payable)}
                  </TableCell>
                  <TableCell className="text-xs">{p.paidDate}</TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRecord(p)}
                      className="gap-1 text-xs"
                    >
                      <Eye size={14} /> View Services
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 pt-4">
          <MockNotice>
            Payouts are compiled week-wise and processed manually by Admin.
          </MockNotice>
        </div>
      </section>

      {/* WEEKLY SERVICES VIEW MODAL */}
      {selectedRecord && (
        <Dialog open={Boolean(selectedRecord)} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Provider Weekly Services &amp; Earnings
              </DialogTitle>
              <DialogDescription className="text-xs">
                Week Period: <strong>{selectedRecord.startWeek}</strong> to{" "}
                <strong>{selectedRecord.endWeek}</strong> · Provider:{" "}
                <strong>{selectedRecord.provider}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Summary Banner */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Gross Earnings</span>
                  <span className="font-bold text-foreground text-sm">
                    {usd(selectedRecord.grossAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Service Fee ({commissionRate}%)
                  </span>
                  <span className="font-bold text-muted-foreground text-sm">
                    −{usd(splitAmount(selectedRecord.grossAmount, commissionRate).commission)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Net Weekly Payout</span>
                  <span className="font-bold text-primary text-sm font-display">
                    {usd(splitAmount(selectedRecord.grossAmount, commissionRate).payable)}
                  </span>
                </div>
              </div>

              {/* Compact Services List */}
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-muted-foreground" /> Services Performed This Week ({selectedRecord.services.length})
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedRecord.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{s.serviceName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Customer: {s.customer} · Completed on {s.date}
                        </p>
                      </div>
                      <span className="font-bold text-foreground text-sm">{usd(s.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between pt-1">
              <StatusPill status={selectedRecord.status} />

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                {selectedRecord.status === "Pending" && (
                  <Button onClick={() => handleReleasePayout(selectedRecord.id)} className="gap-1.5">
                    <CheckCircle2 size={15} /> Release Weekly Payout
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminPayouts;
