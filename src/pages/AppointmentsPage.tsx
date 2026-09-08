import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Search,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/shared/primitives";
import { BookingCard, type GenericBooking } from "@/components/shared/cards";
import { appointmentApi } from "@/api/modules/appointment.api";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import type { Appointment } from "@/types/api/appointment";
import { formatDisplayDate, formatDisplayTime } from "@/utils/format";
import toast from "react-hot-toast";

const FILTERS = ["All", "Upcoming", "In Progress", "Completed"];

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const filteredAppointments = appointments
    .filter((apt) => {
      const status = (apt.appointment_status || apt.status || "").toLowerCase();
      if (activeTab === "All") return true;
      if (activeTab === "Upcoming") {
        return ["requested", "confirmed", "rescheduled", "pending", "payment pending", "paid", "scheduled"].includes(status);
      }
      if (activeTab === "In Progress") {
        return ["accepted", "in_process", "in progress", "en route", "arrived"].includes(status);
      }
      if (activeTab === "Completed") {
        return ["completed", "delivered", "paid", "reviewed"].includes(status);
      }
      return true;
    })
    .filter((apt: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const sName = apt.project?.title || apt.service_type?.name || apt.service_category || "";
      const other = userIsCustomer
        ? apt.provider?.business_name || apt.provider?.user?.full_name || ""
        : apt.customer?.full_name || "";
      const idStr = `bkg-${apt.id} ${apt.id}`;
      const desc = apt.notes || apt.description || "";
      const addr = apt.address || apt.delivery_address || apt.pickup_address || "";
      return (
        sName.toLowerCase().includes(q) ||
        other.toLowerCase().includes(q) ||
        idStr.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        addr.toLowerCase().includes(q)
      );
    });

  return (
    <div>
      <PageHeader
        title="My Bookings"
        subtitle={`${appointments.length} services booked with professionals`}
        action={
          <Button onClick={() => navigate("/search")}>
            Find a Professional
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          description={
            searchQuery
              ? `No bookings match "${searchQuery}".`
              : `No bookings found under ${activeTab.toLowerCase()}.`
          }
          action={
            <Button onClick={() => navigate("/search")}>
              Find a Professional
            </Button>
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

            const bookingItem: GenericBooking = {
              id: apt.id,
              status: status,
              serviceName: apt.project?.title || apt.service_type?.name || apt.service_category || "Home Services",
              provider: userIsCustomer ? otherPartyName : undefined,
              customer: !userIsCustomer ? otherPartyName : undefined,
              serviceDescription: apt.notes || apt.description || apt.service_description || "Service details and requirements.",
              price: apt.total_amount,
              proposedPrice: apt.proposed_amount || apt.proposed_price,
              kind: apt.order_type || (apt.proposal_id ? "Custom Request" : "Standard"),
              requestKind: apt.order_type === "custom" || apt.order_type === "quote" ? "Request a Quote" : "Fixed Service",
              date: formatDisplayDate(apt.booking_date),
              time: formatDisplayTime(apt.time_slot?.start_time || apt.time),
              address: apt.address || apt.delivery_address || apt.pickup_address || "",
            };

            return (
              <BookingCard
                key={apt.id}
                booking={bookingItem}
                side={userIsCustomer ? "customer" : "provider"}
              />
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
