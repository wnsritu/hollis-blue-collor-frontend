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
import { appointmentApi } from "@/services/booking";
import { chatApi } from "@/services/chat";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import { APPOINTMENT_FILTERS as FILTERS } from "@/constants";
import type { Appointment } from "@/types/api/appointment";
import { normalizeBooking, mapBookingToGeneric } from "@/utils/bookingAdapter";
import toast from "react-hot-toast";

import { useAppointments } from "@/hooks/useAppointments";

export const AppointmentsPage: React.FC = () => {
  const {
    navigate,
    user,
    appointments,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    rescheduleModalOpen,
    setRescheduleModalOpen,
    selectedAppointment,
    setSelectedAppointment,
    rescheduleDate,
    setRescheduleDate,
    rescheduleReason,
    setRescheduleReason,
    rescheduling,
    userIsCustomer,
    userIsProvider,
    handleMessagePartner,
    handleOpenReschedule,
    handleRescheduleSubmit,
    filteredAppointments,
  } = useAppointments();

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
          {filteredAppointments.map((apt: any) => {
            const bookingItem = mapBookingToGeneric(apt, userIsCustomer ? "customer" : "provider");
            return (
              <BookingCard
                key={apt.id}
                booking={bookingItem}
                side={userIsCustomer ? "customer" : "provider"}
                onClick={() =>
                  navigate(userIsCustomer ? `/customer/bookings/${apt.id}` : `/provider/order/${apt.id}`)
                }
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
