import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Star, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Stars, StatusPill, EmptyState } from "@/components/shared/primitives";
import { appointmentApi } from "@/services/booking";
import { ratingApi } from "@/services/rating";
import { useAuthSession } from "@/hooks/useAuth";
import { normalizeBooking } from "@/utils/bookingAdapter";
import { formatDisplayDate } from "@/utils/format";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export const CustomerReviews: React.FC = () => {
  const { user } = useAuthSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [unreviewedJobs, setUnreviewedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviewsAndJobs = async () => {
    setLoading(true);
    try {
      // 1. Fetch user appointments
      const apptRes = await appointmentApi.listMine();
      const rawList = (apptRes as any)?.data || apptRes || [];
      const list = Array.isArray(rawList) ? rawList : [];

      // Filter completed AND paid jobs that have NO review attached
      const unreviewed = list.filter((apt: any) => {
        const norm = normalizeBooking(apt);
        return norm.isCompleted && norm.isPaid && !norm.review;
      });
      setUnreviewedJobs(unreviewed);

      // 2. Fetch customer submitted reviews
      if (user?.id) {
        const reviewRes = await ratingApi.list({ customer_id: user.id });
        const resData = (reviewRes as any)?.data || reviewRes;
        const revList = Array.isArray(resData) ? resData : resData?.rows || [];
        setReviews(revList);
      }
    } catch (err) {
      console.error("Failed to load customer reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndJobs();
  }, [user?.id]);

  const handleOpenWriteReview = (jobToRate?: any) => {
    setSelectedJob(jobToRate || unreviewedJobs[0] || null);
    setRating(5);
    setComment("");
    setSubmitted(false);
    setOpen(true);
  };

  const handleSubmitReview = async () => {
    const bookingId = selectedJob?.id;
    if (!bookingId) {
      toast.error("Please select a completed service to review.");
      return;
    }
    if (comment.trim().length < 5) {
      toast.error("Please write at least a short comment (5+ characters).");
      return;
    }

    setSubmitting(true);
    try {
      const normJob = selectedJob ? normalizeBooking(selectedJob) : null;
      await ratingApi.add({
        booking_id: bookingId,
        provider_id: normJob?.providerId || selectedJob?.provider_id || selectedJob?.provider?.id,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      toast.success("Review submitted successfully!");
      fetchReviewsAndJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Share how the work went — reviews only come from completed, paid jobs."
        action={
          <Button
            onClick={() => handleOpenWriteReview()}
            disabled={unreviewedJobs.length === 0}
          >
            <Star size={16} className="mr-1" /> Write a review
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your reviews...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main Content: Published Customer Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquareQuote}
                title="No reviews published yet"
                description="Once you complete a service and leave feedback, your reviews will appear here."
              />
            ) : (
              reviews.map((r: any) => {
                const normJobId = r.job_id || r.booking?.booking_number || (r.booking_id ? `BKG-${r.booking_id}` : `REV-${r.id}`);
                const providerName = r.provider_name || r.provider?.business_name || "Service Professional";
                const dateStr = formatDisplayDate(r.created_at || r.createdAt);
                const statusLabel = r.status_label || (r.status === "visible" ? "Published" : r.status || "Published");

                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display font-bold text-base">
                          {providerName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {normJobId} · {dateStr}
                        </p>
                      </div>
                      <StatusPill status={statusLabel} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Stars rating={r.rating} />
                      <span className="text-xs font-semibold text-foreground">
                        {r.rating} / 5 Stars
                      </span>
                    </div>

                    {r.comment && (
                      <p className="text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/50">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Sidebar: Awaiting Your Review */}
          <aside className="h-max rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-display text-base font-bold">Awaiting your review</h2>
            {unreviewedJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                All your completed jobs have been reviewed!
              </p>
            ) : (
              <div className="space-y-3">
                {unreviewedJobs.map((job: any) => {
                  const norm = normalizeBooking(job);
                  return (
                    <div
                      key={job.id}
                      className="rounded-xl border border-border p-3 space-y-2 bg-muted/10"
                    >
                      <p className="truncate text-sm font-semibold">{norm.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {norm.providerName}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => handleOpenWriteReview(job)}
                      >
                        Rate this job
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Review Submission Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {submitted ? (
            <div className="text-center py-4">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
                <CheckCircle2 size={26} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold">Review submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Thank you! Your feedback helps other customers find top-rated professionals.
              </p>
              <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Rate your service</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {selectedJob && (
                  <div className="rounded-xl bg-muted/40 p-3 text-xs border border-border">
                    <p className="font-bold text-foreground">
                      {normalizeBooking(selectedJob).serviceName}
                    </p>
                    <p className="text-muted-foreground">
                      Provider: {normalizeBooking(selectedJob).providerName}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Overall rating</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        aria-label={`${i} stars`}
                      >
                        <Star
                          size={28}
                          className={cn(
                            i <= rating
                              ? "fill-accent text-accent"
                              : "fill-muted text-muted-foreground/40"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rbody">Your review</Label>
                  <Textarea
                    id="rbody"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What went well? Share details about quality, timeliness and communication..."
                  />
                </div>

                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || !selectedJob}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  Submit Review
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerReviews;
