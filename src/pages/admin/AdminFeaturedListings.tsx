import React, { useState } from "react";
import { Sparkles, Receipt } from "lucide-react";
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

export interface FeaturedListingItem {
  id: string;
  target: string;
  type: "Job" | "Provider";
  owner: string;
  plan: string;
  spend: number;
  starts: string;
  expires: string;
  status: "Active" | "Expired" | "Pending";
}

const mockFeaturedListings: FeaturedListingItem[] = [
  {
    id: "fl_1",
    target: "ABC Plumbing Co. Profile",
    type: "Provider",
    owner: "ABC Plumbing Co.",
    plan: "14-Day Power Promotion",
    spend: 35,
    starts: "Aug 15, 2026",
    expires: "Aug 29, 2026",
    status: "Active",
  },
  {
    id: "fl_2",
    target: "Commercial HVAC Overhaul Job",
    type: "Job",
    owner: "Marcus Bell",
    plan: "7-Day Top Search Boost",
    spend: 19,
    starts: "Aug 20, 2026",
    expires: "Aug 27, 2026",
    status: "Active",
  },
  {
    id: "fl_3",
    target: "Summit Electric Company Page",
    type: "Provider",
    owner: "Summit Electric",
    plan: "30-Day Market Leader",
    spend: 65,
    starts: "Aug 01, 2026",
    expires: "Aug 31, 2026",
    status: "Active",
  },
  {
    id: "fl_4",
    target: "BrightHome Cleaning Listing",
    type: "Provider",
    owner: "BrightHome Cleaning",
    plan: "7-Day Top Search Boost",
    spend: 19,
    starts: "Jul 10, 2026",
    expires: "Jul 17, 2026",
    status: "Expired",
  },
];

export function AdminFeaturedListings() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const list = mockFeaturedListings.filter(
    (l) =>
      `${l.target} ${l.owner}`.toLowerCase().includes(q.toLowerCase()) &&
      (type === "all" || l.type === type)
  );

  const activeCount = mockFeaturedListings.filter((l) => l.status === "Active").length;
  const spendTotal = mockFeaturedListings.reduce((s, l) => s + l.spend, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured Listings"
        subtitle="Paid placements currently active or completed on the marketplace"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Placements"
          value={activeCount}
          hint="Currently boosted in search"
          icon={Sparkles}
          tone="accent"
        />
        <StatCard
          label="Total Boost Spend"
          value={usd(spendTotal)}
          hint="Lifetime revenue from boost"
          icon={Receipt}
          tone="success"
        />
        <StatCard
          label="Total Listings"
          value={mockFeaturedListings.length}
          hint="Active and expired packages"
          icon={Sparkles}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings or owners…"
          className="max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Job">Job</SelectItem>
            <SelectItem value="Provider">Provider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing Target</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Boost Plan</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-semibold text-foreground">{l.target}</TableCell>
                <TableCell className="font-medium text-xs text-muted-foreground">{l.type}</TableCell>
                <TableCell className="font-medium">{l.owner}</TableCell>
                <TableCell className="text-xs">{l.plan}</TableCell>
                <TableCell className="text-right font-bold text-primary">{usd(l.spend)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.starts}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.expires}</TableCell>
                <TableCell>
                  <StatusPill status={l.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AdminFeaturedListings;
