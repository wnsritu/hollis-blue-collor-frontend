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
      });
      toast.success("Reschedule request submitted.");
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Reschedule failed.");
    } finally {
      setRescheduling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const status = (apt.appointment_status || apt.status || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return status === "requested" || status === "confirmed" || status === "scheduled";
    if (activeTab === "in_progress") return status === "in_progress";
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
          { id: "upcoming", label: "Upcoming / Scheduled" },
          { id: "in_progress", label: "In Progress" },
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
          {filteredAppointments.map((apt) => {
            const status = apt.appointment_status || apt.status || "Confirmed";
            const otherPartyName = userIsCustomer
              ? apt.provider?.business_name || apt.provider?.user?.full_name || "Provider"
              : apt.customer?.full_name || "Customer";
            const dateStr = apt.booking_date
              ? new Date(apt.booking_date).toLocaleDateString()
              : "Date TBD";

            return (
              <div
                key={apt.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-muted-foreground">
                      Appt #{apt.id}
                    </span>
                    <StatusPill status={status} />
                  </div>

                  <h3 className="font-display text-base font-bold line-clamp-1">
                    {apt.project?.title || apt.service_category || "Service Appointment"}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground font-medium">
                    {userIsCustomer ? "Pro: " : "Client: "}
                    <span className="text-foreground">{otherPartyName}</span>
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="shrink-0 text-primary" />
                      <span>{dateStr}</span>
                    </div>
                    {apt.address && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="shrink-0 text-primary" />
                        <span className="truncate">{apt.address}</span>
                      </div>
                    )}
                    {apt.total_amount && (
                      <div className="flex items-center justify-between pt-1">
                        <span>Total Price:</span>
                        <span className="font-bold text-foreground">
                          {usd(apt.total_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenChat(apt)}
                      className="flex-1 text-xs gap-1"
                    >
                      <MessageSquare size={13} /> Chat
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReschedule(apt)}
                      className="text-xs"
                    >
                      Reschedule
                    </Button>
                  </div>

                  {/* Status Machine Actions */}
                  {status === "Requested" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(apt.id, "Confirmed")}
                      disabled={updatingId === apt.id}
                      className="w-full text-xs gap-1 bg-success hover:bg-success/90"
                    >
                      <CheckCircle size={13} /> Confirm Appointment
                    </Button>
                  )}

                  {status === "Confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(apt.id, "In_progress")}
                      disabled={updatingId === apt.id}
                      className="w-full text-xs gap-1"
                    >
                      Start Work (In Progress)
                    </Button>
                  )}

                  {status === "In_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(apt.id, "Completed")}
                      disabled={updatingId === apt.id}
                      className="w-full text-xs gap-1 bg-success hover:bg-success/90"
                    >
                      <CheckCircle size={13} /> Mark Completed
                    </Button>
                  )}
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
