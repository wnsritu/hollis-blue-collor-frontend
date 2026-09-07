import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  Loader2,
  FileQuestion,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserCheck,
  Eye,
  Receipt,
  CreditCard,
  Wallet,
  User as UserIcon,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomerPortal, ProviderPortal, RolePortal } from "@/components/layout/portals";
import { StatusPill, EmptyState } from "@/components/shared/primitives";
import { getBookingById } from "@/api/booking.api";
import { appointmentApi } from "@/api/modules/appointment.api";
import { chatApi } from "@/api/modules/chat.api";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import type { Appointment } from "@/types/api/appointment";
import { usd } from "@/components/shared/cards";
import toast from "react-hot-toast";

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Booking Details Modal State (/booking/:booking_id)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Reschedule state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const userIsCustomer = isCustomer(user?.role_id);
  const userIsProvider = isProvider(user?.role_id);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.listMine();
      const list = (res as any)?.data || res || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      toast.error("Failed to load your appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleOpenBookingDetails = async (id: number) => {
    setLoadingDetails(true);
    setDetailsModalOpen(true);
    try {
      const res = await getBookingById(id);
      const data = res?.data?.data || res?.data?.booking || res?.data || res;
      setBookingDetails(data);
    } catch (err: any) {
      console.error("Failed to load booking details", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load booking details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await appointmentApi.updateStatus(id, { status } as any);
      toast.success(`Appointment status updated to ${status}.`);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenChat = async (apt: Appointment) => {
    try {
      const res = await chatApi.createChat({
        project_id: apt.project_id || undefined,
        booking_id: apt.id,
      });
      const chat = (res as any)?.data || res;
      navigate("/messages", { state: { selectedChatId: chat.id || chat.chat_id } });
    } catch (err) {
      toast.error("Could not open chat room.");
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDate(apt.booking_date || "");
    setRescheduleReason("");
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !rescheduleDate) {
      toast.error("Please select a new date.");
      return;
    }
    setRescheduling(true);
    try {
      await appointmentApi.reschedule(selectedAppointment.id, {
        proposed_date: rescheduleDate,
        reason: rescheduleReason,
      } as any);
      toast.success("Reschedule request submitted.");
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Reschedule failed.");
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmReschedule = async (id: number) => {
    setUpdatingId(id);
    try {
      await appointmentApi.confirmReschedule(id);
      toast.success("Reschedule confirmed successfully.");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to confirm reschedule.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const status = (apt.appointment_status || apt.status || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "requested") return status === "requested";
    if (activeTab === "confirmed") return status === "confirmed";
    if (activeTab === "rescheduled") return status === "rescheduled";
    if (activeTab === "completed") return status === "completed";
    if (activeTab === "cancelled") return status === "cancelled" || status === "no-show";
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Appointments & Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {userIsCustomer
              ? "Track your scheduled service appointments and manage job progress."
              : "Manage your client bookings, confirm appointments, and update service progress."}
          </p>
        </div>
        <Button variant="outline" onClick={fetchAppointments} className="gap-2 text-xs">
          <RefreshCw size={14} /> Refresh Schedule
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-3 mb-6 scrollbar-none">
        {[
          { id: "all", label: "All Appointments" },
          { id: "requested", label: "Requested" },
          { id: "confirmed", label: "Confirmed" },
          { id: "rescheduled", label: "Rescheduled" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled / No-show" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No appointments found"
          description={
            activeTab === "all"
              ? "You don't have any appointments scheduled yet. Appointments are generated automatically when a quote/proposal is accepted."
              : `No appointments found under ${activeTab.replace("_", " ")}.`
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((apt: any) => {
            const rawStatus = apt.appointment_status || apt.status || "Requested";
            const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            const otherPartyName = userIsCustomer
              ? apt.provider?.business_name || apt.provider?.user?.full_name || "Provider"
              : apt.customer?.full_name || "Customer";
            const dateStr = apt.booking_date
              ? new Date(apt.booking_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Date TBD";

            const canReschedule = ["Requested", "Confirmed", "Rescheduled"].includes(status);
            const isRescheduleRequestedByMe = Number(apt.reschedule_requested_by) === Number(user?.id);

            return (
              <div
                key={apt.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                {/* Top Row: Pills & ID */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="rounded-full bg-[#f0f4ff] text-[#2563eb] px-3 py-1 text-xs font-bold whitespace-nowrap">
                    {apt.order_type === "fixed" ? "Fixed Service" : apt.order_type || "Fixed Service"}
                  </span>
                  <StatusPill status={status} />
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    BKG-{apt.id}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-display text-lg font-bold text-foreground">
                  {apt.project?.title || apt.service_category || "Service Appointment"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {otherPartyName}
                </p>

                {/* Description */}
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {apt.notes || apt.description || "Service details and requirements."}
                </p>

                {/* Date, Time, Price row */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={15} />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} />
                    <span>{apt.time_slot?.start_time || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={15} />
                    <span>{usd(apt.total_amount)}</span>
                  </div>
                </div>

                {/* Address row */}
                <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{apt.address || apt.delivery_address || apt.pickup_address || "Address not provided"}</span>
                </div>

                {/* Action Button */}
                <div className="mt-5 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-center font-semibold text-foreground/80"
                    onClick={() => handleOpenBookingDetails(apt.id)}
                  >
                    View booking
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal (/booking/:booking_id) */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                  <Receipt className="text-primary size-5" />
                  Booking Details #{bookingDetails?.booking_number || bookingDetails?.id}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full service breakdown and scheduled appointment data from API.
                </p>
              </div>
              {bookingDetails && (
                <StatusPill
                  status={
                    bookingDetails.appointment_status ||
                    bookingDetails.status ||
                    "Requested"
                  }
                />
              )}
            </div>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading booking details from API...</p>
            </div>
          ) : !bookingDetails ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No booking details found.
            </div>
          ) : (
            <div className="space-y-5 text-sm">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date & Time Slot */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Appointment Schedule
                  </span>
                  <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                    <CalendarDays size={16} className="text-primary shrink-0" />
                    <span>
                      {bookingDetails.booking_date
                        ? new Date(bookingDetails.booking_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Date not specified"}
                    </span>
                  </div>
                  {bookingDetails.time_slot && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Clock size={14} className="text-primary shrink-0" />
                      <span>
                        {bookingDetails.time_slot.slot_name || "Slot"} (
                        {bookingDetails.time_slot.start_time} - {bookingDetails.time_slot.end_time})
                      </span>
                    </div>
                  )}
                </div>

                {/* Service Category */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Service Category
                  </span>
                  <div className="font-bold text-foreground text-base">
                    {bookingDetails.service_type?.name ||
                      bookingDetails.service_category ||
                      bookingDetails.project?.title ||
                      "Home Services"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order Type: <span className="font-medium text-foreground capitalize">{bookingDetails.order_type || "Standard"}</span>
                  </div>
                </div>
              </div>

              {/* Parties: Provider & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Provider Card */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Service Professional
                  </span>
                  <div className="font-bold text-foreground text-sm">
                    {bookingDetails.provider?.business_name || "Provider"}
                  </div>
                  {bookingDetails.provider?.city && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span>
                        {[bookingDetails.provider.city, bookingDetails.provider.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer Card */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Customer Details
                  </span>
                  <div className="font-bold text-foreground text-sm">
                    {bookingDetails.customer?.full_name || user?.full_name || "Customer"}
                  </div>
                  {bookingDetails.customer?.phone && (
                    <div className="text-xs text-muted-foreground">
                      Phone: <span className="font-medium text-foreground">{bookingDetails.customer.phone}</span>
                    </div>
                  )}
                  {(bookingDetails.delivery_address || bookingDetails.pickup_address) && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span className="truncate">{bookingDetails.delivery_address || bookingDetails.pickup_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items / Services Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Booked Services & Items
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {bookingDetails.items?.length || 0} item(s)
                  </span>
                </div>
                <div className="divide-y divide-border/60">
                  {bookingDetails.items && bookingDetails.items.length > 0 ? (
                    bookingDetails.items.map((it: any, index: number) => {
                      const itemName =
                        it.custom_item_name ||
                        it.item?.name ||
                        it.service_name ||
                        `Service Line Item ${index + 1}`;
                      const qty = Number(it.quantity) || 1;
                      const unitPrice = Number(it.price) || 0;
                      const lineTotal = Number(it.total_price) || qty * unitPrice;

                      return (
                        <div key={it.id || index} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-sm">{itemName}</p>
                            <p className="text-muted-foreground mt-0.5">
                              Quantity: {qty} × {usd(unitPrice)}
                            </p>
                          </div>
                          <span className="font-bold text-foreground text-sm shrink-0">
                            {usd(lineTotal)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-xs text-muted-foreground text-center">
                      Standard service package: {bookingDetails.service_category || "Home Services"}
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Payment Summary */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Payment Status:</span>
                  <span className="font-bold uppercase tracking-wide text-foreground">
                    {bookingDetails.payment_status || "Pending"}
                  </span>
                </div>
                {bookingDetails.payment?.transaction_id && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-foreground">{bookingDetails.payment.transaction_id}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">Total Booking Amount:</span>
                  <span className="font-bold text-base text-primary">
                    {usd(bookingDetails.total_amount)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {bookingDetails.notes && (
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-1 text-xs">
                  <span className="font-semibold text-muted-foreground block">Customer Notes / Instructions:</span>
                  <p className="text-foreground leading-relaxed">{bookingDetails.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between gap-2">
            {bookingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleOpenChat(bookingDetails);
                }}
                className="gap-1.5 text-xs"
              >
                <MessageSquare size={14} /> Open Chat
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDetailsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Request Appointment Reschedule
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="resDate" className="text-xs font-medium">
                New Proposed Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="resDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resReason" className="text-xs font-medium">
                Reason for Rescheduling
              </Label>
              <Input
                id="resReason"
                placeholder="e.g. Schedule conflict, weather issue..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleModalOpen(false)}
                disabled={rescheduling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rescheduling}>
                {rescheduling ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  "Submit Reschedule"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;
