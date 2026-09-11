import React, { useEffect, useState } from "react";
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
    try {
      const res = await chatApi.createChat({
        project_id: b.project_id || undefined,
        booking_id: b.id,
      });
      const chat = (res as any)?.data || res;
      navigate("/messages", { state: { selectedChatId: chat.id || chat.chat_id } });
    } catch {
      navigate("/messages");
    }
  };

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

  // Calendar state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("9:30 AM");

  const handleUpdateStatus = async (id: number | string, newStatus: string) => {
    try {
      await appointmentApi.updateStatus(id, { appointment_status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update appointment status.");
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
      toast.success("Reschedule requested", {
        description: `${rescheduleDate} at ${selectedSlot}`,
      });
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      try {
        await appointmentApi.updateStatus(selectedAppointment.id, { appointment_status: "Rescheduled" });
        toast.success("Reschedule requested", {
          description: `${rescheduleDate} at ${selectedSlot}`,
        });
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

  const filteredAppointments = appointments
    .filter((apt) => {
      const normalized = normalizeBooking(apt);
      const status = normalized.rawStatus;
      if (activeTab === "All") return true;
      if (activeTab === "Upcoming") {
        return ["requested", "confirmed", "rescheduled", "pending", "payment pending", "paid", "scheduled"].includes(status);
      }
      if (activeTab === "In Progress") {
        return ["accepted", "in_process", "in progress", "en route", "arrived"].includes(status);
      }
      if (activeTab === "Completed") {
        return ["completed", "delivered", "paid", "reviewed", "finished", "work completed"].includes(status);
      }
      return true;
    })
    .filter((apt: any) => {
      if (selectedDay === null) return true;
      const n = normalizeBooking(apt);
      if (!n.date) return false;
      const d = new Date(n.date);
      if (!isNaN(d.getTime())) {
        return d.getDate() === selectedDay;
      }
      return false;
    })
    .filter((apt: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const n = normalizeBooking(apt);
      const other = userIsCustomer ? n.providerName : n.customerName;
      const idStr = `${n.displayId} ${n.id}`;
      return (
        n.serviceName.toLowerCase().includes(q) ||
        other.toLowerCase().includes(q) ||
        idStr.toLowerCase().includes(q) ||
        n.serviceDescription.toLowerCase().includes(q) ||
        n.address.toLowerCase().includes(q)
      );
    });

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
    handleUpdateStatus,
    filteredAppointments,
    fetchAppointments,
  };
}
