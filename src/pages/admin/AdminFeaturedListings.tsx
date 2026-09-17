import React, { useEffect, useState } from "react";
import { Sparkles, Receipt, Loader2 } from "lucide-react";
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
import { getAdminFeaturedListings } from "@/services/featured/featured.service";
import type { FeaturedListingItem } from "@/types/featured";

export function AdminFeaturedListings() {
  const [listings, setListings] = useState<FeaturedListingItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await getAdminFeaturedListings();
      if (res?.data) {
        setListings(res.data.listings || []);
        setActiveCount(res.data.active_count || 0);
        setTotalSpend(res.data.total_spend || 0);
      }
    } catch (err) {
      console.error("Failed to load featured listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const list = listings.filter(
    (l) =>
      `${l.target || ""} ${l.owner || ""}`.toLowerCase().includes(q.toLowerCase()) &&
      (type === "all" || l.type === type)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured listings"
        subtitle="Paid placements currently running on the marketplace"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active placements"
          value={activeCount}
          hint="Currently boosted"
          icon={Sparkles}
          tone="accent"
        />
        <StatCard
          label="Total boost spend"
          value={usd(totalSpend)}
          hint="All time"
          icon={Receipt}
          tone="success"
        />
        <StatCard
          label="Listings"
          value={listings.length}
          hint="Active and expired"
          icon={Sparkles}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings…"
          className="max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "Provider", "Job"].map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No featured listings found
                  </TableCell>
                </TableRow>
              ) : (
                list.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-foreground">{l.target}</TableCell>
                    <TableCell>{l.type || "Provider"}</TableCell>
                    <TableCell>{l.owner}</TableCell>
                    <TableCell>{l.plan}</TableCell>
                    <TableCell className="text-right font-medium">{usd(l.spend)}</TableCell>
                    <TableCell>{l.starts}</TableCell>
                    <TableCell>{l.expires}</TableCell>
                    <TableCell>
                      <StatusPill status={l.status as any} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default AdminFeaturedListings;
