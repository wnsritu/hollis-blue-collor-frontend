import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Flag,
  Loader2,
  MessageSquareQuote,
  Search,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Stars, StatusPill, EmptyState } from "@/components/shared/primitives";
import { ratingApi } from "@/api/modules/rating.api";
import { formatDisplayDate } from "@/utils/format";
import toast from "react-hot-toast";

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await ratingApi.adminList();
      const resData = (res as any)?.data || res;
      const list = Array.isArray(resData) ? resData : resData?.rows || [];
      setReviews(list);
    } catch (err) {
      console.error("Failed to load admin reviews", err);
      toast.error("Failed to load reviews directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId: number, action: string) => {
    setModeratingId(reviewId);
    try {
      await ratingApi.moderate(reviewId, { action });
      toast.success(`Review ${action} action applied.`);
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Moderation failed.");
    } finally {
      setModeratingId(null);
    }
  };

  const filteredReviews = reviews.filter((r: any) => {
    const textStr = `${r.customer_name || r.customer?.full_name || ""} ${r.provider_name || r.provider?.business_name || ""} ${r.comment || ""} ${r.job_id || ""}`.toLowerCase();
    const matchesSearch = !searchQuery.trim() || textStr.includes(searchQuery.toLowerCase());

    const statusMap = {
      visible: "Published",
      Published: "Published",
      hidden: "Hidden",
      Hidden: "Hidden",
      flagged: "Flagged",
      Flagged: "Flagged",
      removed: "Removed",
      Removed: "Removed",
    };
    const normStatus = statusMap[r.status] || r.status || "Published";

    const matchesStatus =
      statusFilter === "all" ||
      normStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews Directory"
        subtitle={`${reviews.length} customer reviews across the platform`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by customer, provider, job ID..."
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Hidden">Hidden</SelectItem>
            <SelectItem value="Flagged">Flagged</SelectItem>
            <SelectItem value="Removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading marketplace reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No reviews match filter"
          description={
            searchQuery
              ? `No reviews match "${searchQuery}".`
              : "No customer reviews found."
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r: any) => {
            const customerName = r.customer_name || r.customer?.full_name || "Customer";
            const providerName = r.provider_name || r.provider?.business_name || "Professional";
            const jobId = r.job_id || r.booking?.booking_number || (r.booking_id ? `JOB-${r.booking_id}` : `REV-${r.id}`);
            const dateStr = formatDisplayDate(r.created_at || r.createdAt);
            const statusLabel = r.status_label || (r.status === "visible" ? "Published" : r.status || "Published");
            const isModerating = moderatingId === r.id;

            return (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={r.rating} />
                      <span className="font-semibold text-sm text-foreground">
                        {r.rating} / 5 Stars
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{customerName}</strong> →{" "}
                      <strong className="text-foreground">{providerName}</strong> ·{" "}
                      {jobId} · {dateStr}
                    </p>
                  </div>
                  <StatusPill status={statusLabel} />
                </div>

                {r.comment && (
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/50">
                    "{r.comment}"
                  </p>
                )}

                {/* Moderation Controls */}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {statusLabel === "Published" || r.status === "visible" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isModerating}
                      onClick={() => handleModerate(r.id, "hide")}
                      className="text-xs"
                    >
                      <EyeOff size={14} className="mr-1.5" /> Hide Review
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isModerating}
                      onClick={() => handleModerate(r.id, "restore")}
                      className="text-xs text-success border-success/30 hover:bg-success-soft"
                    >
                      <RotateCcw size={14} className="mr-1.5" /> Publish / Restore
                    </Button>
                  )}

                  {r.status !== "flagged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isModerating}
                      onClick={() => handleModerate(r.id, "flag")}
                      className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      <Flag size={14} className="mr-1.5" /> Flag
                    </Button>
                  )}

                  {r.status !== "removed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isModerating}
                      onClick={() => handleModerate(r.id, "remove")}
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 size={14} className="mr-1.5" /> Remove
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
