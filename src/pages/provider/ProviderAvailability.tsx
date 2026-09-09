import { useEffect, useState } from "react";
import { Check, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/primitives";
import {
  getTimeSlots,
  saveProviderSetup,
  getProviderAvailability,
} from "@/services/provider.service";
import toast from "react-hot-toast";
import { DAYS, DEFAULT_SLOTS, DEFAULT_SCHEDULE as defaultSchedule } from "@/constants";

const ProviderAvailability = () => {
  const [schedule, setSchedule] = useState<Record<string, number[]>>(defaultSchedule);
  const [slots, setSlots] = useState<{ id: number; label: string }[]>(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleSlot = (day: string, slotId: number) => {
    setSchedule((prev) => {
      const curSlots = prev[day] || [];
      const nextSlots = curSlots.includes(slotId)
        ? curSlots.filter((id) => id !== slotId)
        : [...curSlots, slotId];
      return {
        ...prev,
        [day]: nextSlots,
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const availabilityPayload = Object.entries(schedule).map(([day, slotIds]) => ({
        day_of_week: day,
        time_slot_ids: slotIds,
      }));

      await saveProviderSetup({
        schedule,
        availability: availabilityPayload,
      });

      toast.success("Availability saved successfully!", {
        description: "Your active time slots have been updated for bookings.",
      } as any);
    } catch (err: any) {
      console.error("SAVE AVAILABILITY ERROR:", err);
      toast.error("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [slotRes, availabilityRes] = await Promise.all([
          getTimeSlots().catch(() => []),
          getProviderAvailability().catch(() => null),
        ]);

        if (Array.isArray(slotRes) && slotRes.length > 0) {
          const formattedSlots = slotRes.map((s: any) => {
            const id = Number(s.id);
            let label = s.slot_name;
            if (s.start_time && s.end_time) {
              const formatTime = (timeStr: string) => {
                const [h, m] = timeStr.split(":");
                let hour = parseInt(h, 10);
                const ampm = hour >= 12 ? "PM" : "AM";
                const formattedHour = hour % 12 || 12;
                return `${formattedHour}:${m} ${ampm}`;
              };
              label = `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`;
            }
            return { id, label: label || `Slot ${id}` };
          });
          setSlots(formattedSlots);
        }

        const rawAvail = availabilityRes?.data?.availability || availabilityRes?.availability;
        if (rawAvail && typeof rawAvail === "object") {
          const formattedSchedule: Record<string, number[]> = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
          };

          Object.entries(rawAvail).forEach(([day, slotIds]: [string, any]) => {
            if (formattedSchedule[day] !== undefined && Array.isArray(slotIds)) {
              formattedSchedule[day] = slotIds.map((id: any) => Number(id));
            }
          });

          setSchedule(formattedSchedule);
        }
      } catch (err) {
        console.error("FETCH AVAILABILITY ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading availability schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Availability"
        subtitle="Manage your active time slots for each day of the week."
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-sm">
            <Save size={16} /> {saving ? "Saving..." : "Save Availability"}
          </Button>
        }
      />

      {/* Days & Time Slots List */}
      <div className="space-y-3.5">
        {DAYS.map((day) => {
          const selectedSlots = schedule[day] || [];
          return (
            <Card key={day} className="shadow-card border-border/80">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Day Label */}
                  <div className="min-w-[140px]">
                    <span className="font-bold text-base text-foreground">{day}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSlots.length === 0
                        ? "Unavailable"
                        : `${selectedSlots.length} slot(s) active`}
                    </p>
                  </div>

                  {/* Time Slot Chips */}
                  <div className="flex flex-wrap gap-2.5 sm:justify-end flex-1">
                    {slots.map((slot) => {
                      const active = selectedSlots.includes(slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlot(day, slot.id)}
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                            active
                              ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20"
                              : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
                          }`}
                        >
                          {active ? <Check size={14} /> : <Plus size={14} />}
                          <span>{slot.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-sm">
          <Save size={16} /> {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>
    </div>
  );
};

export default ProviderAvailability;
