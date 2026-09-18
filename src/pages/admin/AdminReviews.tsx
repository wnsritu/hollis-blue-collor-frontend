import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Stars, StatusPill } from "@/components/shared/primitives";

const reviews = [
  {
    id: "REV-901",
    providerId: "abc-plumbing",
    provider: "ABC Plumbing Co.",
    customer: "Marcus Bell",
    rating: 5,
    title: "Fast, clean, no surprises",
    body: "Called at 7am with a burst supply line, they had someone at the house by 9. The final invoice matched the proposal to the dollar.",
    date: "Aug 18, 2026",
    status: "Published",
    job: "JOB-10310",
  },
  {
    id: "REV-902",
    providerId: "summit-electric",
    provider: "Summit Electric",
    customer: "Kevin Nakamura",
    rating: 5,
    title: "Permit handled start to finish",
    body: "Panel upgrade went exactly as scheduled. They coordinated the utility disconnect and the inspection without me lifting a finger.",
    date: "Aug 14, 2026",
    status: "Published",
    job: "JOB-10288",
  },
  {
    id: "REV-903",
    providerId: "brighthome-cleaning",
    provider: "BrightHome Cleaning",
    customer: "Marcus Bell",
    rating: 5,
    title: "Same team every visit",
    body: "Third month on the bi-weekly plan. Consistent quality and they actually get the baseboards.",
    date: "Aug 12, 2026",
    status: "Published",
    job: "JOB-10402",
  },
  {
    id: "REV-904",
    providerId: "greenpro-landscaping",
    provider: "GreenPro Landscaping",
    customer: "Alicia Grant",
    rating: 4,
    title: "Great patio, slow start",
    body: "The finished patio looks fantastic. Crew started two days later than promised, but they communicated the delay.",
    date: "Aug 9, 2026",
    status: "Published",
    job: "JOB-10255",
  },
  {
    id: "REV-905",
    providerId: "ironclad-roofing",
    provider: "Ironclad Roofing",
    customer: "Daniel Ortiz",
    rating: 2,
    title: "Estimate never followed up",
    body: "Inspection was thorough but I waited nine days for the written estimate and had to chase it twice.",
    date: "Aug 6, 2026",
    status: "Pending",
    job: "JOB-10233",
  },
  {
    id: "REV-906",
    providerId: "comfort-hvac",
    provider: "Comfort HVAC",
    customer: "Priya Raman",
    rating: 5,
    title: "Saved us in 110 degree heat",
    body: "Same-day capacitor replacement on a Sunday. Tech explained exactly what failed and why.",
    date: "Aug 3, 2026",
    status: "Published",
    job: "JOB-10201",
  },
];

export const AdminReviews: React.FC = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const list = reviews.filter(
    (r) =>
      `${r.provider} ${r.customer} ${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase()) &&
      (status === "all" || r.status === status),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle={`${reviews.length} customer reviews across the platform`} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {["all", "Published", "Pending", "Hidden"].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {list.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={r.rating} />
                  <span className="truncate text-sm font-semibold">{r.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.customer} → {r.provider} · {r.job} · {r.date}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminReviews;
