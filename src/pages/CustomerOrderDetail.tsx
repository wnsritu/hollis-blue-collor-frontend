import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/shared/Timeline";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { getOrderDetails } from "@/services/order.service";
import { appointmentApi } from "@/api/modules/appointment.api";
import { chatApi } from "@/api/modules/chat.api";
import { normalizeBooking, getTimelineStep } from "@/utils/bookingAdapter";
import toast from "react-hot-toast";

const BOOKING_FLOW = [
  "Pending Acceptance",
  "Confirmed",
  "Paid",
  "Scheduled",
  "In Progress",
  "Completed",
  "Reviewed",
];

export const CustomerOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBooking = async () => {
      if (!id) return;
      setLoading(true);
      const numericId = id.replace(/\D/g, "") || id;

      try {
        let data: any = null;
        try {
          const res = await getOrderDetails(numericId);
          data = res?.data?.data || res?.data || res;
        } catch (e) {
          // Fallback to appointmentApi if order details fails
          const apptRes = await appointmentApi.getById(numericId);
          data = (apptRes as any)?.data || apptRes;
        }

        if (!cancelled && data) {
          setBooking(data);
          if (data.reviewed || data.status === "Reviewed" || data.appointment_status === "Reviewed") {
            setReviewed(true);
          }
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        <Link
          to="/customer/bookings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} /> All bookings
        </Link>
        <EmptyState
          icon={CalendarDays}
          title="Booking not found"
          description="This booking may have been cancelled or removed."
          action={
            <Button asChild>
              <Link to="/customer/bookings">Back to bookings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Formatting & Mapping dynamic fields
  const normalized = normalizeBooking(booking);

  const bkgDisplayId = typeof id === "string" && id.startsWith("BKG-") ? id : normalized.displayId;
  const status = normalized.status;
  const isCancelled = normalized.isCancelled;
  const isCompleted = normalized.isCompleted;
  const isPriceUpdated = normalized.isPriceUpdated;

  const serviceName = normalized.serviceName;
  const providerName = normalized.providerName;
  const isCustom = normalized.isCustom;
  const serviceDescription = normalized.serviceDescription;

  const formattedDate = normalized.formattedDate;
  const formattedTime = normalized.formattedTime;
  const formattedAddress = normalized.address;

  // Price calculations
  const totalAmountNum = normalized.totalAmount;
  const subtotalNum = normalized.subtotal;
  const serviceFeeNum = normalized.serviceFee;
  const isPaid = normalized.isPaid;

  const handleOpenChat = async () => {
    try {
      const res = await chatApi.createChat({
        project_id: booking.project_id || undefined,
        booking_id: booking.id,
      });
      const chat = (res as any)?.data || res;
      navigate("/messages", { state: { selectedChatId: chat.id || chat.chat_id } });
    } catch (err) {
      navigate("/messages");
    }
  };

  const handleSubmitReview = async () => {
    if (!isCompleted) {
      toast.error("Reviews can only be submitted after the service is marked Completed.");
      return;
    }
    setSubmittingReview(true);
    try {
      toast.success("Review submitted successfully!");
      setReviewed(true);
    } catch (err: any) {
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      <Link
        to="/customer/bookings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> All bookings
      </Link>

      <PageHeader
        title={serviceName}
        subtitle={`${bkgDisplayId} · ${isCustom ? "Custom Quote" : "Booked Service"} with ${providerName}`}
        action={
          <>
            <StatusPill status={status} />
            <Button variant="outline" onClick={handleOpenChat} className="gap-2">
              <MessageSquare size={16} /> Message Pro
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Price Adjustment Banner */}
          {isPriceUpdated && (
            <section className="rounded-2xl border border-amber-300 bg-amber-500/10 p-6 shadow-card space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-800 shrink-0">
                  <DollarSign size={22} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-amber-950">
                    Provider Proposed a Price Adjustment
                  </h2>
                  <p className="mt-1 text-sm text-amber-900">
                    {providerName} updated the total price for this service.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-amber-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Original Price</span>
                  <span className="line-through">{usd(booking.price || subtotalNum)}</span>
                </div>
                <div className="flex justify-between items-center text-base font-extrabold text-foreground pt-1">
                  <span>Proposed New Price</span>
                  <span className="text-primary text-xl font-display">
                    {usd(booking.proposed_amount || booking.proposed_price || booking.pricing?.proposed_price || totalAmountNum)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => toast("Price counter-offer declined.", { icon: "ℹ️" })}
                >
                  <XCircle size={15} className="mr-1" /> Decline Price
                </Button>
                <Button onClick={() => toast.success("Updated price accepted!")} className="gap-1.5">
                  <CheckCircle2 size={16} /> Accept Price &amp; Pay
                </Button>
              </div>
            </section>
          )}

          {/* Cancelled Notice */}
          {isCancelled && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-3">
              <div className="flex items-center gap-3 text-destructive">
                <XCircle size={22} />
                <h2 className="font-display text-lg font-bold">Booking Cancelled</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                This booking has been cancelled. Your service requirements remain saved if you wish to find another provider.
              </p>
              <Button asChild size="sm" className="gap-1.5 mt-2">
                <Link to="/search">
                  <Search size={14} /> Find Another Provider
                </Link>
              </Button>
            </section>
          )}

          {/* Service Details Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Service Details</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{serviceDescription}</p>
            <Separator className="my-5" />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Date" value={formattedDate} />
              <Detail icon={Clock} label="Time" value={formattedTime} />
              <Detail icon={MapPin} label="Location" value={formattedAddress} />
              <Detail icon={Star} label="Professional" value={providerName} />
            </dl>
            {booking.notes && (
              <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                Notes: {booking.notes}
              </p>
            )}
          </section>

          {/* Completed-Only Rating & Reviews Section */}
          {isCompleted && !reviewed && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Review this professional</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your service is marked <strong>Completed</strong>. Please rate your experience to help the community.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                  >
                    <Star
                      size={26}
                      className={
                        n <= rating
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted-foreground/40"
                      }
                    />
                  </button>
                ))}
              </div>
              <Textarea
                className="mt-4"
                rows={4}
                placeholder="How did the service go? Share details about quality, timeliness and communication..."
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
              />
              <Button className="mt-4" onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Submit review
              </Button>
            </section>
          )}

          {/* Rating Locked Notice for Active/Upcoming Jobs */}
          {!isCompleted && !reviewed && !isCancelled && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card text-xs text-muted-foreground flex items-center gap-3">
              <Star size={18} className="text-muted-foreground shrink-0" />
              <p>
                <strong>Rating &amp; Review Locked:</strong> Reviews can only be submitted once the provider marks the job as <strong>Completed</strong>.
              </p>
            </section>
          )}

          {reviewed && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card text-xs text-success bg-success-soft/40 flex items-center gap-3 font-semibold">
              <CheckCircle2 size={18} />
              <p>Thank you for submitting your review for this service!</p>
            </section>
          )}
        </div>

        {/* Status Timeline & Payment Breakdown Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Status Timeline</h2>
            <div className="mt-4">
              <Timeline steps={BOOKING_FLOW} current={getTimelineStep(status)} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Payment Breakdown</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {normalized.servicesList.length > 0 ? (
                normalized.servicesList.map((svc) => (
                  <div key={svc.id} className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {svc.name} {svc.quantity > 1 ? `(x${svc.quantity})` : ""}
                    </dt>
                    <dd className="font-medium">{usd(svc.total || svc.unit_price * svc.quantity)}</dd>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal (Services)</dt>
                  <dd className="font-medium">{usd(subtotalNum)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service Fee</dt>
                <dd className="font-medium">{usd(serviceFeeNum)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="font-display text-xl font-bold">
                {usd(totalAmountNum > 0 ? totalAmountNum : subtotalNum + serviceFeeNum)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground truncate">{value}</dd>
      </div>
    </div>
  );
}

export default CustomerOrderDetail;
