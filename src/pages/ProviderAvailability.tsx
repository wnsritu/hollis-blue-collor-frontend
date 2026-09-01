import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Home, Truck, MapPin, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getServiceTypes,
  getTimeSlots,
  saveProviderSetup,
  getProviderAvailability,
} from "@/services/provider.service";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ✅ DEFAULT STRUCTURE (IMPORTANT)
const defaultSchedule: Record<string, number[]> = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

const ProviderAvailability = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(defaultSchedule);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes("home")) return <Home size={16} />;
    if (lower.includes("pick")) return <Truck size={16} />;
    if (lower.includes("drop")) return <MapPin size={16} />;

    return null;
  };

  const toggleSlot = (day: string, slotId: number) => {
    setSchedule((prev) => {
      const daySlots = prev[day] || [];
      return {
        ...prev,
        [day]: daySlots.includes(slotId)
          ? daySlots.filter((id) => id !== slotId)
          : [...daySlots, slotId],
      };
    });
  };

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    // console.log("Selected Services:", selectedServices);
  }, [selectedServices]);

  useEffect(() => {
    // console.log("Services List:", services);
  }, [services]);

  const formatTime = (time: string, startTime?: string) => {
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);

    if (startTime) {
      const startHour = parseInt(startTime.split(":")[0], 10);
      if (hour < startHour) hour += 12;
    }

    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    try {
      const availabilityPayload = Object.entries(schedule).map(
        ([day, slotIds]) => ({
          day_of_week: day,
          time_slot_ids: slotIds,
        }),
      );

      const payload = {
        service_type_ids: selectedServices,
        availability: availabilityPayload,
      };

      // console.log("FINAL PAYLOAD:", payload);

      await saveProviderSetup(payload);
      toast.success("Availability Saved successfully");
      // toast.success("Availability & Service-types Saved successfully");
      navigate("/provider/dashboard");
    } catch (err) {
      console.log("SAVE ERROR:", err);
      toast.error("Availability & Service-types not Saved successfully");
      alert("Failed to save");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [serviceRes, slotRes, availabilityRes] = await Promise.all([
          getServiceTypes(),
          getTimeSlots(),
          getProviderAvailability(),
        ]);

        // ✅ services
        const servicesData = (serviceRes || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
        }));

        // ✅ slots
        const slotsData = (slotRes || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
        }));

        setServices(servicesData);
        setSlots(slotsData);
        // debugger
        // ✅ availability (🔥 MAIN FIX)
        if (availabilityRes?.status) {
          const formattedAvailability: Record<string, number[]> = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
          };

          Object.entries(availabilityRes.availability || {}).forEach(
            ([day, ids]: [string, any]) => {
              formattedAvailability[day] = (ids || []).map((id: any) =>
                Number(id),
              );
            },
          );

          const serviceIds = (availabilityRes.service_type_ids || []).map(
            (id: any) => Number(id),
          );

          // console.log("SETTING SERVICES:", serviceIds);

          setSelectedServices(serviceIds);
          setSchedule(formattedAvailability);
        }
      } catch (err) {
        console.log("FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {location.pathname !== "/provider/availability" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <Calendar size={24} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Availability Setup Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We're working on availability features. You'll be able to manage your schedule here very soon.            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("manageAvailability")}
          </h1>

          {/* SERVICES */}
          {/* <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
              {t("Select Services")}
            </h3>

            <div className="flex flex-wrap gap-3">
              {services.map((service) => {
                const active = selectedServices.includes(service.id);
                console.log(
                  `Service: ${service.name}, ID: ${service.id}, Active: ${active}`,
                );
                const getIcon = () => {
                  if (service.name === "In-Home") return <Home size={16} />;
                  if (service.name === "Pick-Up") return <Truck size={16} />;
                  if (service.name === "Drop-Off") return <MapPin size={16} />;
                  return null;
                };

                return (
                  <label
                    key={service.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer border ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                          active
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {service.name?.toLowerCase().includes("home") ? (
                          <Home size={16} />
                        ) : service.name?.toLowerCase().includes("pick") ? (
                          <Truck size={16} />
                        ) : service.name?.toLowerCase().includes("drop") ? (
                          <MapPin size={16} />
                        ) : null}
                      </span>

                      <span
                        className={`text-sm ${
                          active ? "text-primary" : "text-gray-700"
                        }`}
                      >
                        {service.name} Service
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleService(Number(service.id))} // 🔥 FIX
                    />
                  </label>
                );
              })}
            </div>
          </div> */}

          {/* DAYS */}
          <div className="mt-6 space-y-4">
            {days.map((day) => (
              <div key={day} className="rounded-xl border p-5">
                <h3 className="mb-3 font-semibold">{day}</h3>

                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const label = `${formatTime(
                      slot.start_time,
                      slot.start_time,
                    )} - ${formatTime(slot.end_time, slot.start_time)}`;

                    const active = (schedule[day] || []).includes(slot.id);

                    return (
                      <button
                        key={slot.id}
                        onClick={() => toggleSlot(day, slot.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
                          active
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {active ? <X size={12} /> : <Plus size={12} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={handleSave}>{t("saveAvailability")}</Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderAvailability;
