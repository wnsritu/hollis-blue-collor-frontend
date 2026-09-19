import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { appointmentApi } from "@/services/booking";
import { chatApi } from "@/services/chat";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import type { Appointment } from "@/types/api/appointment";
import { normalizeBooking } from "@/utils/bookingAdapter";

export function useAppointments() {
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

  const handleMessagePartner = async (b: any) => {
    const normalized = normalizeBooking(b);
    if (normalized.isCancelled) {
      toast.error("Chat is unavailable for cancelled bookings.");
      return;
    }
    try {
      const res = await chatApi.createChat({
        project_id: b.project_id || undefined,
        booking_id: b.id,
      });
      const raw = (res as any)?.data || res;
      const chat = raw?.data || raw;
      const chatId = chat?.id || chat?.chat_id || raw?.id || raw?.chat_id || b.id;
      navigate("/messages", { state: { selectedChatId: chatId } });
    } catch {
      navigate("/messages", { state: { selectedChatId: b.id } });
    }
  };

  // Calendar state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("9:30 AM");

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelAppointment, setSelectedCancelAppointment] = useState<Appointment | null>(null);
  const [cancelPresetReason, setCancelPresetReason] = useState<string>("Schedule conflict / Unavailable");
  const [cancelCustomNotes, setCancelCustomNotes] = useState<string>("");
  const [cancelling, setCancelling] = useState(false);

  const handleUpdateStatus = async (id: number | string, newStatus: string, reason?: string) => {
    try {
      await appointmentApi.updateStatus(id, { appointment_status: newStatus, reason });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update appointment status.");
    }
  };

  const handleOpenCancelModal = (apt: Appointment) => {
    setSelectedCancelAppointment(apt);
    setCancelPresetReason(userIsProvider ? "Schedule conflict / Unavailable" : "Schedule change / No longer needed");
    setCancelCustomNotes("");
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCancelAppointment) return;

    const fullReason = cancelCustomNotes.trim()
      ? `${cancelPresetReason} - ${cancelCustomNotes.trim()}`
      : cancelPresetReason;

    setCancelling(true);
    try {
      await appointmentApi.updateStatus(selectedCancelAppointment.id, {
        appointment_status: "Cancelled",
        reason: fullReason,
        cancellation_reason: fullReason,
      });
      toast.success("Appointment cancelled successfully");
      setCancelModalOpen(false);
      setSelectedCancelAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    const normalized = normalizeBooking(apt);
    setSelectedAppointment(apt);
    setRescheduleDate(normalized.date || "");
    setRescheduleReason("");
    setSelectedSlot("9:30 AM");
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment || !rescheduleDate) {
      toast.error("Please select a new date.");
      return;
    }
    setRescheduling(true);
    try {
      const timeSlotId = selectedAppointment.schedule?.time_slot?.id || selectedAppointment.time_slot_id || undefined;
      await appointmentApi.reschedule(selectedAppointment.id, {
        booking_date: rescheduleDate,
        proposed_date: rescheduleDate,
        ...(timeSlotId ? { time_slot_id: timeSlotId } : {}),
        reason: rescheduleReason,
        time_slot_name: selectedSlot,
      } as any);
      toast.success(`Reschedule requested: ${rescheduleDate} at ${selectedSlot}`);
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      try {
        await appointmentApi.updateStatus(selectedAppointment.id, { appointment_status: "Rescheduled" });
        toast.success(`Reschedule requested: ${rescheduleDate} at ${selectedSlot}`);
        setRescheduleModalOpen(false);
        fetchAppointments();
      } catch (err2: any) {
        toast.error(err?.response?.data?.message || err?.message || "Reschedule failed.");
      }
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmReschedule = async (id: number | string) => {
    try {
      await appointmentApi.confirmReschedule(id);
      toast.success("Reschedule confirmed successfully!");
      fetchAppointments();
    } catch (err: any) {
      try {
        await appointmentApi.updateStatus(id, { appointment_status: "Confirmed" });
        toast.success("Reschedule confirmed!");
        fetchAppointments();
      } catch (err2: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to confirm reschedule.");
      }
    }
  };

  const handleRejectReschedule = async (id: number | string) => {
    try {
      await appointmentApi.rejectReschedule(id);
      toast.success("Reschedule request declined.");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to decline reschedule.");
    }
  };

  const fetchAppointments = async (overrideParams?: {
    tab?: string;
    query?: string;
    day?: number | null;
  }) => {
    setLoading(true);
    try {
      const tabToUse = overrideParams?.tab !== undefined ? overrideParams.tab : activeTab;
      const queryToUse = overrideParams?.query !== undefined ? overrideParams.query : searchQuery;
      const dayToUse = overrideParams?.day !== undefined ? overrideParams.day : selectedDay;

      let statusTab: string | undefined = undefined;
      if (tabToUse === "Upcoming") statusTab = "upcoming";
      else if (tabToUse === "In Progress") statusTab = "in_progress";
      else if (tabToUse === "Completed") statusTab = "completed";
      else if (tabToUse === "Cancelled") statusTab = "cancelled";

      const params: Record<string, unknown> = {};
      if (statusTab) params.status_tab = statusTab;
      if (queryToUse && queryToUse.trim()) params.search = queryToUse.trim();
      if (dayToUse !== null && dayToUse !== undefined) params.day = dayToUse;

      const res = await appointmentApi.listMine(params);
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
    const handler = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(handler);
  }, [activeTab, searchQuery, selectedDay]);

  // Status tab filtering matching backend business rules & UI requirements
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const n = normalizeBooking(apt);
      const tab = (activeTab || "All").toLowerCase();

      if (tab === "all") return true;

      const raw = (n.rawStatus || "").toLowerCase();
      const apptSt = n.appointmentStatus || "";

      const isCompleted = n.isCompleted || ["completed", "finished", "delivered", "reviewed", "work completed"].includes(raw);
      const isCancelled = n.isCancelled || ["cancelled", "canceled", "rejected", "declined", "no-show", "noshow", "expired"].includes(raw);
      const isInProgress = ["en route", "en_route", "arrived", "arrived at site", "in_progress", "in progress", "in_process", "in process"].includes(raw) ||
        ["En Route", "Arrived", "In Progress"].includes(apptSt);

      if (tab === "upcoming") {
        return !isCompleted && !isCancelled && !isInProgress;
      }
      if (tab === "in progress" || tab === "in_progress") {
        return !isCompleted && !isCancelled && isInProgress;
      }
      if (tab === "completed") {
        return isCompleted;
      }
      if (tab === "cancelled" || tab === "canceled") {
        return isCancelled;
      }
      return true;
    });
  }, [appointments, activeTab]);

  return {
    navigate,
    user,
    appointments,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedDay,
    setSelectedDay,
    selectedSlot,
    setSelectedSlot,
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
    side: userIsProvider ? ("provider" as const) : ("customer" as const),
    handleMessagePartner,
    handleOpenReschedule,
    handleRescheduleSubmit,
    handleConfirmReschedule,
    handleRejectReschedule,
    handleUpdateStatus,
    filteredAppointments,
    fetchAppointments,
    cancelModalOpen,
    setCancelModalOpen,
    selectedCancelAppointment,
    setSelectedCancelAppointment,
    cancelPresetReason,
    setCancelPresetReason,
    cancelCustomNotes,
    setCancelCustomNotes,
    cancelling,
    handleOpenCancelModal,
    handleCancelSubmit,
  };
}
