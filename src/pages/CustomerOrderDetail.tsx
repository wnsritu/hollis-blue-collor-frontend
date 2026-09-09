import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Tag,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/shared/Timeline";
import { EmptyState, PageHeader, StatusPill, VerifiedBadge } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { getOrderDetails } from "@/services/order.service";
import { appointmentApi } from "@/api/modules/appointment.api";
import { ratingApi } from "@/api/modules/rating.api";
import { chatApi } from "@/api/modules/chat.api";
import { normalizeBooking, getTimelineStep } from "@/utils/bookingAdapter";
import { formatDisplayDate } from "@/utils/format";
import StripeBookingModal from "@/components/paymentModal/StripeBookingModal";
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
  const [existingReview, setExistingReview] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchBooking = async () => {
    if (!id) return;
    setLoading(true);
    const numericId = id.replace(/\D/g, "") || id;

    try {
      let rawRes: any = null;
      try {
        rawRes = await getOrderDetails(numericId);
      } catch (e) {
        rawRes = await appointmentApi.getById(numericId);
      }

      // Unwrap nested structures: res.data.booking, res.data.data.booking, res.data, res.booking, etc.
      const extracted =
        rawRes?.data?.booking ||
        rawRes?.data?.data?.booking ||
        rawRes?.data?.data ||
        rawRes?.data ||
        rawRes?.booking ||
        rawRes;

      if (extracted) {
        const itemData = extracted.booking || extracted;
        setBooking(itemData);
        if (itemData.review) {
          setReviewed(true);
          setExistingReview(itemData.review);
        } else if (
          itemData.reviewed ||
          itemData.status === "Reviewed" ||
          itemData.appointment_status === "Reviewed"
        ) {
          setReviewed(true);
        }
      }
    } catch (err) {
      console.error("Failed to load booking details:", err);
      toast.error("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
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
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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

  // Normalize details
  const normalized = normalizeBooking(booking);

  const bkgDisplayId = booking.booking_number || (typeof id === "string" && id.startsWith("BKG-") ? id : normalized.displayId);
  const status = normalized.appointmentStatus || normalized.status;
  const isCancelled = normalized.isCancelled;
  const isCompleted = normalized.isCompleted;
  const isPriceUpdated = normalized.isPriceUpdated;

  const serviceName = normalized.serviceName;
  const categoryName = normalized.categoryName;
  const providerName = normalized.providerName;
  const providerAddress = booking.provider?.service_location_address || "";
  const providerCityState = [booking.provider?.city, booking.provider?.state].filter(Boolean).join(", ");
  const isCustom = normalized.isCustom;
  const serviceDescription = normalized.serviceDescription;

  const formattedDate = normalized.formattedDate !== "Date to be confirmed" ? normalized.formattedDate : (booking.schedule?.date || normalized.date || "Date Pending");
  const formattedTime = normalized.timeSlotName
    ? `${normalized.timeSlotName} ${normalized.time ? `(${normalized.time})` : ""}`
    : normalized.formattedTime;
  const formattedAddress = normalized.address;

  // Pricing calculations
  const totalAmountNum = normalized.totalAmount;
  const subtotalNum = normalized.subtotal;
  const serviceFeeNum = normalized.serviceFee;
  const isPaid = normalized.isPaid;

  // Format Payment Date
  let formattedPaymentDate = "";
  if (normalized.paymentDate) {
    try {
      const d = new Date(normalized.paymentDate);
      if (!isNaN(d.getTime())) {
        formattedPaymentDate = d.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
    } catch {
      formattedPaymentDate = String(normalized.paymentDate);
    }
  }

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
    if (!isPaid) {
      toast.error("Payment must be completed before leaving a review.");
      return;
    }
    if (!reviewBody.trim()) {
      toast.error("Please write a comment for your review.");
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        booking_id: Number(booking?.id || id),
        provider_id: booking?.provider?.id || booking?.provider_id,
        rating,
        comment: reviewBody.trim(),
      };
      await ratingApi.add(payload);
      toast.success("Review submitted successfully!");
      setReviewed(true);
      fetchBooking();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/customer/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> Back to My Bookings
      </Link>

      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isCustom
                    ? "bg-amber-500/10 text-amber-600 border border-amber-200"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {isCustom ? <FileText size={12} /> : <Tag size={12} />}
                {isCustom ? "Custom Quote Request" : "Direct Service"}
              </span>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {bkgDisplayId}
              </span>
            </div>

            <h1 className="font-display text-2xl font-extrabold text-foreground mt-1">
              {serviceName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Category: <strong className="text-foreground">{categoryName}</strong> · Provider:{" "}
              <strong className="text-foreground">{providerName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={status} />

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                isPaid
                  ? "bg-success-soft text-success border border-success/20"
                  : "bg-amber-500/10 text-amber-700 border border-amber-200"
              }`}
            >
              <DollarSign size={13} />
              {isPaid ? "Payment: Paid" : "Payment: Pending"}
            </span>

            <Button variant="outline" size="sm" onClick={handleOpenChat} className="gap-1.5 text-xs">
              <MessageSquare size={14} /> Message Pro
            </Button>

            {!isPaid && !isCancelled && (
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CreditCard size={14} /> Pay Now ({usd(totalAmountNum)})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Price Adjustment Proposed Banner */}
          {isPriceUpdated && (
            <section className="rounded-2xl border border-amber-300 bg-amber-500/10 p-6 shadow-card space-y-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-800 shrink-0">
                  <Clock size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-amber-900 text-base">
                    Provider Proposed Price Adjustment: {usd(totalAmountNum)}
                  </h3>
                  {booking.notes && (
                    <p className="text-xs text-amber-800 mt-1 italic">"{booking.notes}"</p>
                  )}
                  <p className="text-xs text-amber-700 mt-1">
                    Please review the updated price proposal and proceed to payment if accepted.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Service Details & Schedule Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" /> Service &amp; Schedule Details
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Service Date" value={formattedDate} />
              <Detail icon={Clock} label="Time Slot" value={formattedTime} />
              <Detail icon={MapPin} label="Service Location" value={formattedAddress} />
              <Detail
                icon={User}
                label="Assigned Professional"
                value={
                  booking.provider?.verified === "verified"
                    ? `${providerName} (Verified)`
                    : providerName
                }
              />
            </dl>

            {providerAddress && (
              <div className="rounded-xl bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1">
                <span className="font-bold text-foreground block">Professional Base Address:</span>
                <p>{providerAddress} {providerCityState ? `(${providerCityState})` : ""}</p>
              </div>
            )}

            {serviceDescription && serviceDescription !== "Service details and requirements." && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs space-y-1">
                <span className="font-bold text-muted-foreground uppercase tracking-wider block text-[11px]">
                  Service Instructions &amp; Requirements
                </span>
                <p className="text-foreground leading-relaxed italic">
                  "{serviceDescription}"
                </p>
              </div>
            )}
          </section>

          {/* Ordered Line Items Table */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Ordered Services &amp; Line Items ({normalized.servicesList.length})
            </h2>

            {normalized.servicesList.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border text-xs">
                {normalized.servicesList.map((svc, idx) => (
                  <div key={svc.id || idx} className="p-4 bg-card flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-sm">{svc.name}</p>
                      <p className="text-muted-foreground mt-0.5">
                        Quantity: {svc.quantity} × {usd(svc.unit_price)}
                      </p>
                    </div>
                    <span className="font-extrabold text-foreground text-sm">
                      {usd(svc.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-4 bg-muted/20 text-xs text-muted-foreground italic">
                Direct service request — {serviceName}
              </div>
            )}
          </section>

          {/* Completed-Only & Paid-Only Rating & Reviews Section */}
          {isCompleted && isPaid && !reviewed && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
              <h2 className="font-display text-lg font-bold">Review this professional</h2>
              <p className="text-xs text-muted-foreground">
                Your service is marked <strong>Completed</strong>. Rate your experience to help the community.
              </p>
              <div className="flex items-center gap-1.5">
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
                rows={4}
                placeholder="How did the service go? Share details about quality, timeliness and communication..."
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
              />
              <Button onClick={handleSubmitReview} disabled={submittingReview} className="text-xs">
                {submittingReview ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Submit Review
              </Button>
            </section>
          )}

          {/* Rating Locked Notice for Completed but Unpaid Jobs */}
          {isCompleted && !isPaid && !reviewed && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs text-muted-foreground flex items-center gap-3">
              <Star size={18} className="text-muted-foreground shrink-0" />
              <p>
                <strong>Rating &amp; Review Locked:</strong> Payment must be marked as <strong>Paid</strong> before submitting a review.
              </p>
            </section>
          )}

          {/* Rating Locked Notice for Active/Upcoming Jobs */}
          {!isCompleted && !reviewed && !isCancelled && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs text-muted-foreground flex items-center gap-3">
              <Star size={18} className="text-muted-foreground shrink-0" />
              <p>
                <strong>Rating &amp; Review Locked:</strong> Reviews can only be submitted once the provider marks the job as <strong>Completed</strong>.
              </p>
            </section>
          )}

          {reviewed && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" />
                  Your Submitted Review
                </h3>
                {existingReview?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDisplayDate(existingReview.created_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={18}
                    className={
                      n <= (existingReview?.rating || rating)
                        ? "fill-accent text-accent"
                        : "fill-muted text-muted-foreground/30"
                    }
                  />
                ))}
                <span className="ml-2 text-xs font-bold text-foreground">
                  {existingReview?.rating || rating} / 5 Stars
                </span>
              </div>

              {existingReview?.comment && (
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border">
                  "{existingReview.comment}"
                </p>
              )}
            </section>
          )}
        </div>

        {/* Sidebar: Timeline & Payment Summary */}
        <div className="space-y-6">
          {/* Order Lifecycle Timeline */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Order Lifecycle Status</h2>
            <Timeline steps={BOOKING_FLOW} current={getTimelineStep(status)} />
          </section>

          {/* Payment Breakdown Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Payment Summary
              </h2>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isPaid
                    ? "bg-success-soft text-success border border-success/20"
                    : "bg-amber-500/10 text-amber-700 border border-amber-200"
                }`}
              >
                {isPaid ? "Paid" : "Pending"}
              </span>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Services)</span>
                <span className="font-semibold text-foreground">{usd(subtotalNum)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service &amp; Platform Fee</span>
                <span className="font-semibold text-foreground">{usd(serviceFeeNum)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="font-bold text-foreground">Total Amount</span>
                <span className="font-extrabold text-primary text-base">
                  {usd(totalAmountNum > 0 ? totalAmountNum : subtotalNum + serviceFeeNum)}
                </span>
              </div>
            </dl>

            {/* Payment Details Box */}
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Payment Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${isPaid ? "bg-success-soft text-success" : "bg-amber-500/10 text-amber-700"}`}>
                  {isPaid ? "Paid (Success)" : "Pending Payment"}
                </span>
              </div>

              {formattedPaymentDate && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                  <span>Payment Date:</span>
                  <span className="font-semibold text-foreground">{formattedPaymentDate}</span>
                </div>
              )}
            </div>

            {/* Pay Now Action Button if Payment Pending */}
            {!isPaid && !isCancelled && (
              <Button
                className="w-full gap-2 mt-2"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard size={15} /> Complete Payment ({usd(totalAmountNum)})
              </Button>
            )}
          </section>
        </div>
      </div>

      {/* STRIPE PAYMENT MODAL */}
      {showPaymentModal && (
        <StripeBookingModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingData={booking}
          onSuccess={() => {
            setShowPaymentModal(false);
            toast.success("Payment completed successfully!");
            fetchBooking();
          }}
        />
      )}
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
        <dd className="font-semibold text-foreground truncate">{value}</dd>
      </div>
    </div>
  );
}

export default CustomerOrderDetail;
