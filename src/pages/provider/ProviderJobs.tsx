import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  CornerDownRight,
  DollarSign,
  Edit3,
  FileText,
  MapPin,
  MessageSquare,
  Navigation,
  Play,
  Send,
  Star,
  Tag,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { appointmentApi, bookingApi } from "@/services/booking";
import { chatApi } from "@/services/chat";
import { ratingApi } from "@/services/rating";
import type { Appointment } from "@/types/api/appointment";
import { normalizeBooking } from "@/utils/bookingAdapter";
import { formatDisplayDate } from "@/utils/format";

const usd = (val: number) =>
  `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function ProviderJobs() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "fixed" | "quote">("all");

  // State for Price Update Modal
  const [selectedBookingForPrice, setSelectedBookingForPrice] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [counterNote, setCounterNote] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // State for Decline Job Modal
  const [selectedBookingForDecline, setSelectedBookingForDecline] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [customDeclineReason, setCustomDeclineReason] = useState("");
  const [declineError, setDeclineError] = useState("");
  const [submittingDecline, setSubmittingDecline] = useState(false);

  // State for View Review Modal
  const [viewReviewModalBooking, setViewReviewModalBooking] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchActiveJobs = async (tabOverride?: string) => {
    setLoading(true);
    try {
      const tabToUse = tabOverride !== undefined ? tabOverride : activeTab;
      const queryParams: Record<string, unknown> = { limit: 100 };
      if (tabToUse === "active") queryParams.status_tab = "in_progress";
      else if (tabToUse === "completed") queryParams.status_tab = "completed";
      else if (tabToUse === "fixed") queryParams.job_type = "fixed";
      else if (tabToUse === "quote") queryParams.job_type = "quote";

      const [aptRes, bookingRes] = await Promise.allSettled([
        appointmentApi.listMine(queryParams),
        bookingApi.list(queryParams),
      ]);

      let aptList: any[] = [];
      if (aptRes.status === "fulfilled") {
        const val = aptRes.value;
        aptList = (val as any)?.data || val || [];
        if (!Array.isArray(aptList)) aptList = [];
      }

      let bookingList: any[] = [];
      if (bookingRes.status === "fulfilled") {
        const val = bookingRes.value;
        bookingList =
          (val as any)?.bookings ||
          (val as any)?.data?.bookings ||
          (val as any)?.data ||
          val ||
          [];
        if (!Array.isArray(bookingList)) bookingList = [];
      }

      const map = new Map<number, any>();
      for (const b of [...aptList, ...bookingList]) {
        if (b && b.id) {
          map.set(Number(b.id), b);
        }
      }

      const combined = Array.from(map.values());

      // Sort newest created first (senior developer approach)
      combined.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || a.updatedAt || 0).getTime() || Number(a.id) || 0;
        const timeB = new Date(b.createdAt || b.created_at || b.updatedAt || 0).getTime() || Number(b.id) || 0;
        return timeB - timeA;
      });

      setAppointments(combined);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      toast.error("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
  }, [activeTab]);

  // Classify direct fixed services vs request a quote / project flow
  const isQuoteJob = (b: any) => Boolean(b.project_id || b.proposal_id);

  const isCompletedJob = (b: any) => {
    const apt = String(b.appointment_status || b.status || "").toLowerCase();
    return ["completed", "delivered", "reviewed", "finished", "work completed"].includes(apt);
  };

  const isCancelledJob = (b: any) => {
    const apt = String(b.appointment_status || b.status || "").toLowerCase();
    return ["cancelled", "canceled", "rejected", "no-show"].includes(apt);
  };

  const isActiveJob = (b: any) => !isCompletedJob(b) && !isCancelledJob(b);

  const myBookings = appointments;

  const filteredBookings = myBookings.filter((b: any) => {
    if (activeTab === "active") return isActiveJob(b);
    if (activeTab === "completed") return isCompletedJob(b);
    if (activeTab === "fixed") return !isQuoteJob(b);
    if (activeTab === "quote") return isQuoteJob(b);
    return true;
  });

  const activeCount = myBookings.filter(isActiveJob).length;
  const completedCount = myBookings.filter(isCompletedJob).length;
  const fixedCount = myBookings.filter((b) => !isQuoteJob(b)).length;
  const quoteCount = myBookings.filter((b) => isQuoteJob(b)).length;

  const handleUpdateStatus = async (bookingId: number, nextStatus: string, legacyStatus?: string, reason?: string) => {
    setActionLoadingId(bookingId);
    try {
      await appointmentApi.updateStatus(bookingId, {
        appointment_status: nextStatus,
        status: legacyStatus || nextStatus,
        reason: reason || undefined,
        cancellation_reason: reason || undefined,
      } as any);
      toast.success(`Job status updated to ${nextStatus}.`);
      await fetchActiveJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenDeclineModal = (booking: any) => {
    setSelectedBookingForDecline(booking);
    setDeclineReason("");
    setCustomDeclineReason("");
    setDeclineError("");
  };

  const handleConfirmDecline = async () => {
    if (!selectedBookingForDecline) return;

    const finalReason =
      declineReason === "Other"
        ? customDeclineReason.trim()
        : (declineReason.trim() || customDeclineReason.trim());

    if (!finalReason) {
      setDeclineError("Please select or enter a reason for declining this job.");
      return;
    }

    setSubmittingDecline(true);
    setActionLoadingId(selectedBookingForDecline.id);
    try {
      await appointmentApi.updateStatus(selectedBookingForDecline.id, {
        appointment_status: "Cancelled",
        status: "cancelled",
        reason: finalReason,
        cancellation_reason: finalReason,
      } as any);

      toast.success("Job request declined successfully.");
      setSelectedBookingForDecline(null);
      await fetchActiveJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to decline job.");
    } finally {
      setSubmittingDecline(false);
      setActionLoadingId(null);
    }
  };

  const handleOpenPriceModal = (b: any) => {
    setSelectedBookingForPrice(b);
    setNewPrice(Number(b.total_amount) || 0);
    setCounterNote(b.notes || "");
  };

  const handleSubmitPriceUpdate = async () => {
    if (!selectedBookingForPrice) return;
    if (newPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    setSubmittingPrice(true);
    try {
      await bookingApi.updatePrice({
        booking_id: selectedBookingForPrice.id,
        total_amount: newPrice,
        proposed_price: newPrice,
        notes: counterNote.trim(),
        counter_note: counterNote.trim(),
      });

      toast.success(`Updated price sent to customer! Proposed: ${usd(newPrice)}`);
      setSelectedBookingForPrice(null);
      await fetchActiveJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update price.");
    } finally {
      setSubmittingPrice(false);
    }
  };

  const handleMessageCustomer = async (b: any) => {
    try {
      const res = await chatApi.createChat({
        project_id: b.project_id || undefined,
        booking_id: b.id,
      });
      const raw = (res as any)?.data || res;
      const chat = raw?.data || raw;
      const chatId = chat?.id || chat?.chat_id || raw?.id || raw?.chat_id || b.id;
      navigate("/messages", { state: { selectedChatId: chatId } });
    } catch (err) {
      navigate("/messages", { state: { selectedChatId: b.id } });
    }
  };

  const handleOpenReviewModal = (booking: any) => {
    setViewReviewModalBooking(booking);
    const rev = normalizeBooking(booking).review || booking.review;
    const existing = rev?.provider_reply || rev?.reply || "";
    setReplyText(existing);
    setIsEditingReply(!existing);
  };

  const handleSendReply = async () => {
    if (!viewReviewModalBooking) return;
    const rev = normalizeBooking(viewReviewModalBooking).review || viewReviewModalBooking.review;
    const reviewId = rev?.id;
    if (!reviewId) {
      toast.error("Review ID not found.");
      return;
    }
    if (!replyText.trim()) {
      toast.error("Please enter a reply before submitting.");
      return;
    }

    setSubmittingReply(true);
    try {
      await ratingApi.reply(reviewId, { reply: replyText.trim() });
      toast.success("Reply submitted successfully!");

      const updatedReview = {
        ...rev,
        provider_reply: replyText.trim(),
        reply: replyText.trim(),
        reply_date: new Date().toISOString(),
        replied_at: new Date().toISOString(),
      };

      setViewReviewModalBooking((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          review: updatedReview,
        };
      });

      setAppointments((prev: any[]) =>
        prev.map((item) =>
          item.id === viewReviewModalBooking.id
            ? { ...item, review: updatedReview }
            : item
        )
      );

      setIsEditingReply(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit review reply."
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Jobs & Service Requests"
        subtitle="Review incoming requests, accept jobs or propose price adjustments."
      />

      {/* Filter Tabs & Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList flex-wrap="true">
            <TabsTrigger value="all">All Requests ({myBookings.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            <TabsTrigger value="fixed">Fixed Services ({fixedCount})</TabsTrigger>
            <TabsTrigger value="quote">Request a Quote ({quoteCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> {fixedCount} Fixed Bookings
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> {quoteCount} Custom Quotes
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
          <p className="text-sm">Loading active jobs...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No active requests in this view"
          description="When customers book services or submit custom quotes, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b: any) => {
            const n = normalizeBooking(b);
            const isFixed = !n.isCustom;
            const price = Number(n.totalAmount ?? b.pricing?.total ?? b.total_amount ?? 0);
            const serviceFee = Number(b.pricing?.service_fee ?? (n.serviceFee > 0 ? n.serviceFee : Math.round(price * 0.1)));
            const providerPayable = Math.max(0, price - serviceFee);
            const commissionRate = price > 0 ? Math.round((serviceFee / price) * 100) : 10;

            const aptStatus = n.appointmentStatus;
            const isPriceUpdated = n.isPriceUpdated;

            const normApt = (aptStatus || "").toLowerCase().trim();
            const isPendingAcceptance =
              ["requested", "pending", "pending acceptance", "request received"].includes(normApt);
            const isConfirmed =
              ["confirmed", "accepted", "scheduled", "job accepted", "job acceptance"].includes(normApt);
            const isEnRoute = ["en route", "en_route"].includes(normApt);
            const isArrived = ["arrived", "arrived at site"].includes(normApt);
            const isInProgress = ["in progress", "in_progress", "in_process", "in process"].includes(normApt);
            const isCompleted =
              ["completed", "finished", "delivered", "work completed", "reviewed"].includes(normApt);
            const isDeclined = ["cancelled", "canceled", "rejected", "declined", "no-show"].includes(normApt);

            let notesObj: any = null;
            if (b.notes && String(b.notes).trim().startsWith("{")) {
              try {
                notesObj = JSON.parse(b.notes);
              } catch (e) { }
            }
            const counterNote = notesObj?.counter_note || (!String(b.notes).trim().startsWith("{") ? b.notes : null);
            const originalPrice = Number(
              notesObj?.original_total_amount ||
              notesObj?.customer_total ||
              notesObj?.proposal_total ||
              b.original_total_amount ||
              b.proposal?.amount ||
              0
            );

            // Visual Stepper Index (0 to 5)
            let stepIdx = 0;
            if (isConfirmed) stepIdx = 1;
            if (isEnRoute) stepIdx = 2;
            if (isArrived) stepIdx = 3;
            if (isInProgress) stepIdx = 4;
            if (isCompleted) stepIdx = 5;

            const steps = [
              "Request Received",
              "Job Accepted",
              "En Route",
              "Arrived at Site",
              "In Progress",
              "Completed",
            ];

            const title =
              b.project?.title ||
              n.serviceName ||
              b.service?.service_type?.name ||
              b.service_type?.name ||
              b.services?.[0]?.name ||
              b.items?.[0]?.custom_item_name ||
              b.service?.category_name ||
              b.service_category ||
              "Service Job";

            const customerName = n.customerName || b.customer?.full_name || "Customer";
            const address =
              n.address && n.address !== "Address not provided"
                ? n.address
                : b.service_address?.address ||
                b.pickup_address ||
                b.delivery_address ||
                "Address provided upon booking";

            const bookingRef = b.booking_number || (n.displayId.startsWith("#") ? n.displayId : `#${n.displayId}`);

            const dateLabel =
              n.formattedDate && n.formattedDate !== "Date to be confirmed"
                ? n.formattedDate
                : b.schedule?.date || b.booking_date || "";
            const slotLabel =
              n.timeSlotName ||
              b.schedule?.time_slot?.name ||
              b.time_slot?.slot_name ||
              (b.time_slot?.start_time
                ? `${b.time_slot.start_time} - ${b.time_slot.end_time || ""}`
                : "") ||
              n.formattedTime ||
              "";

            const paymentStatusRaw = String(
              b.payment_status ||
              b.payment?.payment_status ||
              b.payment?.status ||
              (aptStatus === "Completed" || b.status === "finished" ? "paid" : "pending")
            ).toLowerCase();

            const isPaid =
              paymentStatusRaw === "paid" ||
              paymentStatusRaw === "succeeded" ||
              paymentStatusRaw === "completed" ||
              Boolean(b.paid);

            const paymentBadgeText = isPaid
              ? "Payment: Paid"
              : paymentStatusRaw === "escrow" || paymentStatusRaw === "held"
                ? "Payment: Escrow Held"
                : "Payment: Pending";

            return (
              <Card key={b.id} className="shadow-sm border border-border overflow-hidden bg-card">
                <CardContent className="p-6">
                  {/* Top Bar: Title & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isFixed
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-500/10 text-amber-600"
                            }`}
                        >
                          {isFixed ? <Tag size={12} /> : <FileText size={12} />}
                          {isFixed ? "Fixed Service" : "Request a Quote"}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {bookingRef}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-foreground mt-1">
                        {title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customer: <strong className="text-foreground">{customerName}</strong> ·{" "}
                        {address}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={n.providerStatusLabel || aptStatus} />
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isPaid
                            ? "bg-success-soft text-success border border-success/20"
                            : paymentStatusRaw === "escrow" || paymentStatusRaw === "held"
                              ? "bg-blue-500/10 text-blue-600 border border-blue-200"
                              : "bg-amber-500/10 text-amber-700 border border-amber-200"
                          }`}
                      >
                        <DollarSign size={12} />
                        {paymentBadgeText}
                      </span>
                    </div>
                  </div>

                  {/* VISUAL ORDER LIFECYCLE STEPPER */}
                  {!isDeclined && (
                    <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Order Lifecycle Status Progress
                      </p>
                      <div className="grid grid-cols-6 gap-1 text-center">
                        {steps.map((st, i) => {
                          const done = i <= stepIdx;
                          const active = i === stepIdx;
                          return (
                            <div key={st} className="flex flex-col items-center">
                              <div
                                className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${done
                                    ? active
                                      ? "bg-amber-500 text-white ring-2 ring-amber-500/30"
                                      : "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {done ? <Check size={12} /> : i + 1}
                              </div>
                              <span
                                className={`mt-1.5 text-[10px] font-semibold truncate max-w-full ${active
                                    ? "text-amber-600 font-bold"
                                    : done
                                      ? "text-foreground"
                                      : "text-muted-foreground opacity-60"
                                  }`}
                              >
                                {st}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Price Banner if Price Updated (matching Service Connect reference UI) */}
                  {isPriceUpdated && (
                    <div className="mt-4 rounded-2xl border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-3 shadow-sm">
                      <div className="grid size-7 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0 mt-0.5">
                        <Clock size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-amber-950 dark:text-amber-100 text-sm">
                          Price Adjustment Proposed: {usd(price)}
                        </p>
                        {originalPrice > 0 && originalPrice !== price && (
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                            Original Service Price: {usd(originalPrice)}
                          </p>
                        )}
                        {counterNote && (
                          <p className="text-xs italic text-amber-900/80 mt-1">"{counterNote}"</p>
                        )}
                        <p className="font-semibold text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                          Awaiting customer acceptance or rejection.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Informational Banners */}
                  {isEnRoute && (
                    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-500/10 p-3 text-xs text-indigo-900 flex items-center gap-2">
                      <Navigation size={15} className="text-indigo-600 shrink-0" />
                      <span>
                        <strong>En Route:</strong> You are traveling to customer address at {address}.
                      </span>
                    </div>
                  )}

                  {isArrived && (
                    <div className="mt-4 rounded-xl border border-purple-200 bg-purple-500/10 p-3 text-xs text-purple-900 flex items-center gap-2">
                      <MapPin size={15} className="text-purple-600 shrink-0" />
                      <span>
                        <strong>Arrived at Location:</strong> Perform initial inspection &amp; click 'Start Work' when ready.
                      </span>
                    </div>
                  )}

                  {isInProgress && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-500/10 p-3 text-xs text-blue-900 flex items-center gap-2">
                      <Play size={15} className="text-blue-600 shrink-0" />
                      <span>
                        <strong>In Progress:</strong> Service execution actively underway. Mark completed when finished.
                      </span>
                    </div>
                  )}

                  {/* Details Breakdown */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-5 text-xs">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">Service Price</span>
                      <span className="font-bold text-foreground text-sm">{usd(price)}</span>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">Payment Status</span>
                      <span className={`font-bold text-xs ${isPaid ? "text-success font-extrabold" : "text-amber-700"}`}>
                        {isPaid ? "Paid (Completed)" : paymentStatusRaw === "escrow" ? "Escrow Held" : "Pending Payment"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">
                        Booking Date &amp; Time
                      </span>
                      <span className="font-semibold text-foreground text-xs">
                        {dateLabel ? `${dateLabel} ${slotLabel ? `(${slotLabel})` : ""}` : (n.formattedDate || "Date to be confirmed")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">
                        Service Fee ({commissionRate}%)
                      </span>
                      <span className="font-semibold text-foreground text-xs">
                        {usd(serviceFee)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">Your Payable</span>
                      <span className="font-bold text-primary text-sm">{usd(providerPayable)}</span>
                    </div>
                  </div>

                  {b.notes && !isPriceUpdated && !String(b.notes).trim().startsWith("{") && (
                    <p className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                      <strong>Customer Notes:</strong> {b.notes}
                    </p>
                  )}

                  {/* STEP-BY-STEP ACTION BUTTONS */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => handleMessageCustomer(b)}
                      >
                        <MessageSquare size={14} /> Message Customer
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {actionLoadingId === b.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                      )}

                      {/* Step 1: Accept or Update Price for Pending Requests */}
                      {isPendingAcceptance && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeclineModal(b)}
                            className="gap-1 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                            disabled={actionLoadingId === b.id}
                          >
                            <XCircle size={14} /> Decline
                          </Button>

                          {/* <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPriceModal(b)}
                            className="gap-1 text-xs"
                            disabled={actionLoadingId === b.id}
                          >
                            <DollarSign size={14} /> Update Price
                          </Button> */}

                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, "Confirmed", "accepted")}
                            className="gap-1 text-xs"
                            disabled={actionLoadingId === b.id}
                          >
                            <CheckCircle2 size={14} /> Accept Job
                          </Button>
                        </>
                      )}

                      {/* Step 2: Start Travel when Confirmed */}
                      {isConfirmed && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(b.id, "En Route", "in_process")}
                          className="gap-1 text-xs"
                          disabled={actionLoadingId === b.id}
                        >
                          <Navigation size={14} /> Start Travel (En Route)
                        </Button>
                      )}

                      {/* Step 3: Mark Arrived when En Route */}
                      {isEnRoute && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(b.id, "Arrived", "in_process")}
                          className="gap-1 text-xs"
                          disabled={actionLoadingId === b.id}
                        >
                          <MapPin size={14} /> Mark Arrived at Location
                        </Button>
                      )}

                      {/* Step 4: Start Work when Arrived */}
                      {isArrived && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(b.id, "In Progress", "in_process")}
                          className="gap-1 text-xs"
                          disabled={actionLoadingId === b.id}
                        >
                          <Play size={14} /> Start Work
                        </Button>
                      )}

                      {/* Step 5: Complete Work when In Progress */}
                      {isInProgress && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(b.id, "Completed", "finished")}
                          className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={actionLoadingId === b.id}
                        >
                          <CheckCircle2 size={14} /> Complete Work &amp; Finish Job
                        </Button>
                      )}

                      {/* Completed State Indicator & Review Button */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 size={14} /> Job Completed &amp; Payout Released
                        </span>
                      )}

                      {(n.review || b.review) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReviewModal(b)}
                          className="gap-1 text-xs border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 font-bold"
                        >
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          View Review ({(n.review || b.review).rating} ★)
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* UPDATE PRICE MODAL */}
      {selectedBookingForPrice && (
        <Dialog
          open={Boolean(selectedBookingForPrice)}
          onOpenChange={() => setSelectedBookingForPrice(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign size={18} className="text-primary" /> Update / Counter Job Price
              </DialogTitle>
              <DialogDescription className="text-xs">
                Propose a new overall price for{" "}
                {selectedBookingForPrice.service_type?.name || "the requested service"} requested by{" "}
                <strong>{selectedBookingForPrice.customer?.full_name || "Customer"}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl bg-muted/40 p-3 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Original Customer Price:</span>
                <span className="font-bold text-foreground">
                  {usd(Number(selectedBookingForPrice.total_amount) || 0)}
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new_price" className="text-xs font-bold">
                  Proposed New Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new_price"
                  type="number"
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="counter_note" className="text-xs font-bold">
                  Explanation / Note to Customer (optional)
                </Label>
                <Textarea
                  id="counter_note"
                  rows={3}
                  placeholder="Explain why the price was updated (e.g. additional materials or labor required)..."
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedBookingForPrice(null)}
                disabled={submittingPrice}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPriceUpdate}
                className="gap-1.5"
                disabled={submittingPrice}
              >
                {submittingPrice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Propose New Price
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* VIEW REVIEW MODAL */}
      {viewReviewModalBooking && (
        <Dialog
          open={Boolean(viewReviewModalBooking)}
          onOpenChange={(openState) => {
            if (!openState) {
              setViewReviewModalBooking(null);
              setIsEditingReply(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Star size={18} className="fill-amber-500 text-amber-500" /> Customer Review
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review submitted by <strong>{normalizeBooking(viewReviewModalBooking).customerName}</strong> for booking{" "}
                <strong>{normalizeBooking(viewReviewModalBooking).displayId}</strong>.
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const rev = normalizeBooking(viewReviewModalBooking).review || viewReviewModalBooking.review;
              const ratingVal = Number(rev?.rating) || 0;
              const commentText = rev?.comment || "No written review comment provided.";
              const dateVal = rev?.created_at || rev?.createdAt;
              const hasExistingReply = Boolean(rev?.provider_reply || rev?.reply);
              const existingReplyText = rev?.provider_reply || rev?.reply || "";
              const replyDate = rev?.reply_date || rev?.replied_at;

              return (
                <div className="space-y-4 py-1">
                  {/* STAR RATING DISPLAY */}
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={22}
                          className={
                            star <= ratingVal
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted-foreground opacity-30"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      {ratingVal} out of 5 Stars
                    </p>
                  </div>

                  {/* COMMENT BOX */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Customer Feedback</Label>
                    <div className="rounded-xl bg-muted/40 p-3.5 text-xs text-foreground leading-relaxed italic border border-border">
                      "{commentText}"
                    </div>
                    {dateVal && (
                      <p className="text-[11px] text-muted-foreground text-right pt-0.5">
                        Submitted on {formatDisplayDate(dateVal)}
                      </p>
                    )}
                  </div>

                  {/* PROVIDER REPLY SECTION */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CornerDownRight size={15} className="text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          Your Reply to Customer
                        </span>
                        {hasExistingReply && (
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                            Replied
                          </span>
                        )}
                      </div>

                      {hasExistingReply && !isEditingReply && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyText(existingReplyText);
                            setIsEditingReply(true);
                          }}
                          className="h-7 text-xs gap-1 text-primary hover:text-primary"
                        >
                          <Edit3 size={13} /> Edit Reply
                        </Button>
                      )}
                    </div>

                    {/* Display existing reply card */}
                    {hasExistingReply && !isEditingReply ? (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1.5">
                        <p className="text-xs text-foreground leading-relaxed">
                          {existingReplyText}
                        </p>
                        {replyDate && (
                          <p className="text-[10px] text-muted-foreground">
                            Replied on {formatDisplayDate(replyDate)}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Reply input form */
                      <div className="space-y-2.5">
                        <Textarea
                          rows={3}
                          placeholder="Thank the customer or respond to their feedback (visible to customer)..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength={2000}
                          className="text-xs resize-none"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{replyText.length} / 2000 characters</span>
                          <div className="flex items-center gap-2">
                            {hasExistingReply && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setReplyText(existingReplyText);
                                  setIsEditingReply(false);
                                }}
                                disabled={submittingReply}
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={handleSendReply}
                              disabled={submittingReply || !replyText.trim()}
                            >
                              {submittingReply ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                              {hasExistingReply ? "Update Reply" : "Send Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewReviewModalBooking(null);
                  setIsEditingReply(false);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DECLINE JOB MODAL */}
      {selectedBookingForDecline && (
        <Dialog
          open={Boolean(selectedBookingForDecline)}
          onOpenChange={() => setSelectedBookingForDecline(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                <XCircle size={18} /> Decline Job Request
              </DialogTitle>
              <DialogDescription className="text-xs">
                Please provide a reason for declining job{" "}
                <strong>
                  {selectedBookingForDecline.booking_number || `#${selectedBookingForDecline.id}`}
                </strong>
                . This reason will be shared with the customer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1.5 block">
                  Select Reason for Declining <span className="text-destructive">*</span>
                </Label>
                <div className="grid gap-2">
                  {[
                    "Fully booked / Not available at requested time",
                    "Outside my operating service area",
                    "Unable to fulfill requested scope of work",
                    "Personal / Schedule conflict",
                    "Other",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDeclineReason(preset);
                        if (preset !== "Other") setCustomDeclineReason("");
                        if (declineError) setDeclineError("");
                      }}
                      className={cn(
                        "rounded-xl border p-2.5 text-left text-xs transition-all font-medium",
                        declineReason === preset
                          ? "border-destructive bg-destructive/10 font-bold text-destructive ring-1 ring-destructive/30"
                          : "border-border bg-card hover:border-destructive/40 text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {(declineReason === "Other" || (declineReason && declineReason !== "Other")) && (
                <div className="grid gap-2">
                  <Label htmlFor="decline_reason_input" className="text-xs font-bold text-foreground">
                    {declineReason === "Other" ? "Specify Reason" : "Additional Notes (optional)"}{" "}
                    {declineReason === "Other" && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    id="decline_reason_input"
                    rows={3}
                    placeholder="Enter reason for declining this job request..."
                    value={customDeclineReason}
                    onChange={(e) => {
                      setCustomDeclineReason(e.target.value);
                      if (declineError) setDeclineError("");
                    }}
                    className={cn(
                      "text-xs",
                      declineError && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>
              )}

              {declineError && (
                <p className="text-xs font-medium text-destructive">{declineError}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBookingForDecline(null)}
                disabled={submittingDecline}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDecline}
                disabled={submittingDecline}
                className="gap-1.5"
              >
                {submittingDecline ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Confirm Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ProviderJobs;
