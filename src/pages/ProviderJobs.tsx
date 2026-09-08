import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Navigation,
  Play,
  Tag,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortal } from "@/components/layout/portals";
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
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { appointmentApi } from "@/api/modules/appointment.api";
import { bookingApi } from "@/api/modules/booking.api";
import { chatApi } from "@/api/modules/chat.api";
import type { Appointment } from "@/types/api/appointment";
import { normalizeBooking } from "@/utils/bookingAdapter";

const usd = (val: number) =>
  `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function ProviderJobs() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "fixed" | "quote">("all");

  // State for Price Update Modal
  const [selectedBookingForPrice, setSelectedBookingForPrice] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [counterNote, setCounterNote] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchActiveJobs = async () => {
    setLoading(true);
    try {
      const [aptRes, bookingRes] = await Promise.allSettled([
        appointmentApi.listMine(),
        bookingApi.list({ limit: 100 }),
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

      // Filter active jobs only
      const activeList = combined.filter((b: any) => {
        const aptStatus = b.appointment_status;
        const legacyStatus = b.status;
        if (
          aptStatus === "Completed" ||
          aptStatus === "Cancelled" ||
          aptStatus === "No-show" ||
          legacyStatus === "finished" ||
          legacyStatus === "delivered" ||
          legacyStatus === "cancelled" ||
          legacyStatus === "rejected"
        ) {
          return false;
        }
        return true;
      });

      setAppointments(activeList);
    } catch (err) {
      console.error("Failed to load active jobs:", err);
      toast.error("Failed to load active jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
  }, []);

  // Classify direct fixed services vs request a quote / project flow
  const isQuoteJob = (b: any) => Boolean(b.project_id || b.proposal_id);

  const myBookings = appointments;

  const filteredBookings = myBookings.filter((b: any) => {
    if (activeTab === "fixed") return !isQuoteJob(b);
    if (activeTab === "quote") return isQuoteJob(b);
    return true;
  });

  const fixedCount = myBookings.filter((b) => !isQuoteJob(b)).length;
  const quoteCount = myBookings.filter((b) => isQuoteJob(b)).length;

  const handleUpdateStatus = async (bookingId: number, nextStatus: string, legacyStatus?: string) => {
    setActionLoadingId(bookingId);
    try {
      await appointmentApi.updateStatus(bookingId, {
        appointment_status: nextStatus,
        status: legacyStatus || nextStatus,
      } as any);
      toast.success(`Job status updated to ${nextStatus}.`);
      await fetchActiveJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
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
      const chat = (res as any)?.data || res;
      navigate("/messages", { state: { selectedChatId: chat.id || chat.chat_id } });
    } catch (err) {
      navigate("/messages");
    }
  };

  return (
    <ProviderPortal>
      <PageHeader
        title="Jobs & Service Requests"
        subtitle="Review incoming requests, accept jobs or propose price adjustments."
      />

      {/* Filter Tabs & Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All Requests ({myBookings.length})</TabsTrigger>
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

            const isPendingAcceptance =
              aptStatus === "Requested" || aptStatus === "pending" || aptStatus === "Pending Acceptance";
            const isConfirmed =
              aptStatus === "Confirmed" || aptStatus === "accepted" || aptStatus === "Scheduled";
            const isEnRoute = aptStatus === "En Route";
            const isArrived = aptStatus === "Arrived";
            const isInProgress = aptStatus === "In Progress" || aptStatus === "in_process";
            const isCompleted =
              aptStatus === "Completed" || aptStatus === "finished" || aptStatus === "Work Completed";
            const isDeclined = aptStatus === "Cancelled" || aptStatus === "cancelled" || aptStatus === "rejected";

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
              n.serviceName ||
              b.service?.service_type?.name ||
              b.service_type?.name ||
              b.project?.title ||
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

            return (
              <Card key={b.id} className="shadow-sm border border-border overflow-hidden bg-card">
                <CardContent className="p-6">
                  {/* Top Bar: Title & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isFixed
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

                    <StatusPill status={aptStatus} />
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
                                className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                                  done
                                    ? active
                                      ? "bg-amber-500 text-white ring-2 ring-amber-500/30"
                                      : "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {done ? <Check size={12} /> : i + 1}
                              </div>
                              <span
                                className={`mt-1.5 text-[10px] font-semibold truncate max-w-full ${
                                  active
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

                  {/* Price Banner if Price Updated */}
                  {isPriceUpdated && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-500/10 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Price Adjustment Proposed: {usd(price)}</p>
                        {b.notes && <p className="mt-1 text-xs italic">"{b.notes}"</p>}
                        <p className="mt-1 font-semibold text-[11px] text-amber-700">
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
                  <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <span className="text-muted-foreground block text-[11px]">Service Price</span>
                      <span className="font-bold text-foreground text-sm">{usd(price)}</span>
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

                  {b.notes && !isPriceUpdated && (
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
                            onClick={() => handleUpdateStatus(b.id, "Cancelled", "cancelled")}
                            className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                            disabled={actionLoadingId === b.id}
                          >
                            <XCircle size={14} /> Decline
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPriceModal(b)}
                            className="gap-1 text-xs"
                            disabled={actionLoadingId === b.id}
                          >
                            <DollarSign size={14} /> Update Price
                          </Button>

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

                      {/* Completed State Indicator */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 size={14} /> Job Completed &amp; Payout Released
                        </span>
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
    </ProviderPortal>
  );
}

export default ProviderJobs;
