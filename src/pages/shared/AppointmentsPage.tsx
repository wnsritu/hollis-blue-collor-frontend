import React from "react";
import toast from "react-hot-toast";
import { CalendarDays, Clock, MapPin, Loader2, CalendarCheck, RefreshCw, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, StatusPill, EmptyState } from "@/components/shared/primitives";
import { useAppointments } from "@/hooks/useAppointments";
import { normalizeBooking } from "@/utils/bookingAdapter";
import { formatDisplayDate } from "@/utils/format";
import { APPOINTMENT_FILTERS as FILTERS } from "@/constants/options";
import { cn } from "@/lib/utils";

const timeSlots = ["8:00 AM", "9:30 AM", "11:00 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

export const AppointmentsPage: React.FC = () => {
  const {
    navigate,
    side,
    appointments,
    filteredAppointments,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedSlot,
    setSelectedSlot,
    rescheduleModalOpen,
    setRescheduleModalOpen,
    setSelectedAppointment,
    rescheduleDate,
    setRescheduleDate,
    rescheduleReason,
    setRescheduleReason,
    rescheduling,
    handleOpenReschedule,
    handleRescheduleSubmit,
    handleConfirmReschedule,
    handleRejectReschedule,
    handleUpdateStatus,
  } = useAppointments();

  const rescheduleModalMarkup = (
    <Dialog
      open={rescheduleModalOpen}
      onOpenChange={(v) => {
        if (!v) {
          setRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Reschedule appointment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Pick a new slot. The other party will be notified to confirm.
        </p>

        <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">New Date</Label>
            <Input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Time Slot</Label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedSlot(t)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    selectedSlot === t
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border hover:bg-muted text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reason (optional)</Label>
            <Input
              placeholder="e.g. Schedule conflict..."
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
              {rescheduling ? <Loader2 size={15} className="animate-spin" /> : "Request new time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Provider View (static style cards without calendar sidebar)
  if (side === "provider") {
    return (
      <div>
        <PageHeader
          title="Job schedule"
          subtitle="Confirm, reschedule or cancel upcoming service visits."
        />

        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading schedule...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No visits scheduled"
              description="You have no upcoming service visits."
            />
          ) : (
            filteredAppointments.map((apt) => {
              const n = normalizeBooking(apt);
              const isRescheduled = n.reschedule.requested || n.appointmentStatus === "Rescheduled";

              return (
                <div key={apt.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold">{n.serviceName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.displayId} · {n.customerName}
                      </p>
                    </div>
                    <StatusPill status={n.status} />
                  </div>

                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} /> {n.formattedDate || n.date || "Date TBD"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {n.formattedTime || n.time || "Time TBD"}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin size={14} /> <span className="truncate">{n.address}</span>
                    </span>
                  </dl>

                  {/* Reschedule Requested Details Banner */}
                  {isRescheduled && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <RefreshCw size={13} className="text-amber-500" />
                        <span>Reschedule Requested</span>
                      </div>
                      <div className="mt-1.5 space-y-1 text-muted-foreground">
                        {n.reschedule.date && (
                          <p>
                            <strong className="text-foreground">New Proposed Date:</strong>{" "}
                            {formatDisplayDate(n.reschedule.date)}
                          </p>
                        )}
                        {n.reschedule.reason && (
                          <p>
                            <strong className="text-foreground">Reason:</strong> {n.reschedule.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    {!n.isCompleted && !n.isCancelled && (
                      <>
                        {isRescheduled ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => handleConfirmReschedule(apt.id)}
                            >
                              Confirm Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleRejectReschedule(apt.id)}
                            >
                              Decline Reschedule
                            </Button>
                          </>
                        ) : (
                          <>
                            {n.appointmentStatus === "Requested" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(apt.id, "Confirmed")}
                              >
                                Confirm
                              </Button>
                            )}
                            {n.appointmentStatus === "Confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(apt.id, "En Route")}
                                >
                                  On My Way
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(apt.id, "Arrived")}
                                >
                                  Mark Arrived
                                </Button>
                              </>
                            )}
                            {n.appointmentStatus === "En Route" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(apt.id, "Arrived")}
                              >
                                Mark Arrived
                              </Button>
                            )}
                            {n.appointmentStatus === "Arrived" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(apt.id, "In Progress")}
                                >
                                  Start Job
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => handleUpdateStatus(apt.id, "Completed")}
                                >
                                  Mark Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
                                  onClick={() => handleUpdateStatus(apt.id, "No-show")}
                                >
                                  Mark No-Show
                                </Button>
                              </>
                            )}
                            {n.appointmentStatus === "In Progress" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => handleUpdateStatus(apt.id, "Completed")}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReschedule(apt)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(apt.id, "Cancelled")}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {n.isCompleted && (
                      <span className="text-sm text-muted-foreground">
                        Service completed on {n.formattedDate || n.date}.
                      </span>
                    )}
                    {n.isCancelled && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(apt.id, "Requested")}
                        >
                          Request again
                        </Button>
                        {n.isNoShow && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                const { http } = await import("@/lib/api/http");
                                await http.post("/disputes/create", {
                                  booking_id: apt.id,
                                  reason: "No-show Contest",
                                  description: "Customer contesting false no-show claim",
                                  refund_requested: n.totalAmount || 0,
                                });
                                toast.success("Dispute submitted successfully! Our support team will review your case.");
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || err?.message || "Failed to submit dispute.");
                              }
                            }}
                          >
                            Dispute No-Show
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {rescheduleModalMarkup}
      </div>
    );
  }

  // Customer View (Tabs UI + Grid Cards)
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map((apt) => {
            const n = normalizeBooking(apt);
            const isFixed = !n.isCustom;
            const displayPrice = n.totalAmount;
            const isRescheduled = n.reschedule.requested || n.appointmentStatus === "Rescheduled";

            return (
              <div
                key={apt.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          isFixed
                            ? "bg-primary-soft text-primary"
                            : "bg-amber-500/10 text-amber-700"
                        )}
                      >
                        {isFixed ? "Fixed Service" : "Request a Quote"}
                      </span>
                      <StatusPill status={n.status} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {n.displayId}
                    </span>
                  </div>

                  <h3 className="mt-3.5 font-display text-base font-bold leading-snug text-foreground">
                    {n.serviceName}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.providerName}
                  </p>
                  {n.serviceDescription && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {n.serviceDescription}
                    </p>
                  )}

                  {/* Reschedule Requested Details Banner */}
                  {isRescheduled && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <RefreshCw size={13} className="text-amber-500" />
                        <span>Reschedule Requested</span>
                      </div>
                      <div className="mt-1.5 space-y-1 text-muted-foreground">
                        {n.reschedule.date && (
                          <p>
                            <strong className="text-foreground">New Proposed Date:</strong>{" "}
                            {formatDisplayDate(n.reschedule.date)}
                          </p>
                        )}
                        {n.reschedule.reason && (
                          <p>
                            <strong className="text-foreground">Reason:</strong> {n.reschedule.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {n.date && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="shrink-0" /> {n.formattedDate || n.date}
                      </span>
                    )}
                    {n.time && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="shrink-0" /> {n.formattedTime || n.time}
                      </span>
                    )}
                    {displayPrice > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet size={14} className="shrink-0" /> ${displayPrice}
                      </span>
                    )}
                  </div>
                  {n.address && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground w-full">
                      <MapPin size={13} className="shrink-0" /> <span className="truncate">{n.address}</span>
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  {isRescheduled ? (
                    <Button
                      size="sm"
                      className="w-full justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 h-9"
                      onClick={() => handleConfirmReschedule(apt.id)}
                    >
                      Confirm Reschedule
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-center rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground hover:bg-muted/50 transition shadow-none h-9"
                      onClick={() => navigate(`/customer/bookings/${apt.id}`)}
                    >
                      View booking
                    </Button>
                  )}

                  {!n.isCompleted && !n.isCancelled && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleOpenReschedule(apt)}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-xs h-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleUpdateStatus(apt.id, "Cancelled")}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rescheduleModalMarkup}
    </div>
  );
};

export default AppointmentsPage;
