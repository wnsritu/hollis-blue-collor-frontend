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
  ShoppingBag,
  ArrowLeft,
  Check,
  Star,
  Search,
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

  const handleOpenBookingDetails = (id: any) => {
    navigate(`/order/${id}`);
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
    if (activeTab === "upcoming") return ["requested", "confirmed", "rescheduled", "pending"].includes(status);
    if (activeTab === "in-progress") return ["accepted", "in_process", "in progress"].includes(status);
    if (activeTab === "completed") return ["completed", "delivered", "paid"].includes(status);
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {appointments.length} services booked with professionals
          </p>
        </div>
        <Button onClick={() => navigate("/search")} className="rounded-full px-6 font-semibold shadow-md">
          Find a Professional
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "upcoming", label: "Upcoming" },
            { id: "in-progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-muted/80 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           <Input placeholder="Search bookings" className="pl-9 rounded-full bg-background border-border/60" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No bookings found"
          description={`No bookings found under ${activeTab.replace("-", " ")}.`}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-full flex-col">
                  {/* Header: Service Type & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-50 text-blue-600 px-3 py-1 text-xs font-semibold whitespace-nowrap">
                        {apt.order_type === "fixed" ? "Fixed Service" : apt.order_type || "Fixed Service"}
                      </span>
                      <span className="rounded-full bg-orange-50 text-orange-600 px-3 py-1 text-xs font-semibold whitespace-nowrap">
                        {status}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground/80">
                      BKG-{apt.id}
                    </span>
                  </div>

                  {/* Body: Title & Provider */}
                  <div className="mb-3">
                    <h3 className="font-display text-[17px] font-bold text-foreground">
                      {apt.project?.title || apt.service_category || "Service Appointment"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {otherPartyName}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-6">
                    {apt.notes || apt.description || "Service details and requirements."}
                  </p>

                  {/* Footer Info Grid */}
                  <div className="flex flex-col gap-2.5 mb-5 mt-auto">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{apt.time_slot?.start_time || "TBD"}</span>
                      </div>
                      <div className="font-medium text-foreground">
                        {usd(apt.total_amount)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{apt.address || apt.delivery_address || apt.pickup_address || "Address not provided"}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-border/60 mb-4" />

                  {/* Actions */}
                  <Button
                    variant="outline"
                    onClick={() => handleOpenBookingDetails(apt.id)}
                    className="w-full rounded-xl py-5 font-semibold text-foreground/80 transition-all hover:bg-muted/50 border-border/60"
                  >
                    View booking
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}


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
