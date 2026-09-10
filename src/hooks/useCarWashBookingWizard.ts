import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { getServices, getItems } from "@/services/item.service";
import {
  searchProviders,
  addProviderBooking,
  getServiceTypes,
  getTimeSlots,
  getProviderSlots,
  getProviderPrice,
} from "@/services/provider.service";
import { getAddonServices } from "@/services/pricing.service";
import { formatTimeSlot } from "@/utils/format";
import { checkCarWashOffered } from "@/utils/bookingValidation";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { VEHICLE_TYPES, TIME_WINDOWS } from "@/constants/booking";
import { clearCarWashBookingState } from "@/utils/bookingState";

export function useCarWashBookingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(() => {
    const paramStep = searchParams.get("step");
    return paramStep !== null ? Number(paramStep) : 0;
  });

  const [serviceType, setServiceType] = useState<number | null>(() => {
    const saved = localStorage.getItem("carwash_serviceType") || localStorage.getItem("servicetype_id");
    return saved ? Number(saved) : null;
  });

  const [dbItems, setDbItems] = useState<any[]>([]);
  const [serviceTypesList, setServiceTypesList] = useState<any[]>([]);
  const [slotsData, setSlotsData] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [providerSlots, setProviderSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [vehicle, setVehicle] = useState(() => {
    const saved = localStorage.getItem("carwash_vehicle") || "";
    const lower = saved.toLowerCase();
    if (lower.includes("sedan")) return "sedan";
    if (lower.includes("suv")) return "suv";
    if (lower.includes("truck")) return "truck";
    if (lower.includes("van")) return "van";
    if (lower.includes("other")) return "other";
    return saved;
  });

  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [service, setService] = useState<any>(() => {
    const saved = localStorage.getItem("carwash_service");
    return saved ? Number(saved) : "";
  });
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    () => searchParams.get("provider") || localStorage.getItem("carwash_provider") || null
  );

  const [filterRating, setFilterRating] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterCoords, setFilterCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDistance, setFilterDistance] = useState<number | null>(null);
  const [filterSlot, setFilterSlot] = useState<string | null>(null);

  const [date, setDate] = useState<Date>();
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);

  const [addOns, setAddOns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("carwash_addOns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [locType, setLocType] = useState<"provider" | "custom">(() => {
    return (localStorage.getItem("carwash_locType") as "provider" | "custom") || "provider";
  });

  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem("carwash_address");
      return saved ? JSON.parse(saved) : { street: "", apt: "", city: "", state: "", zip: "" };
    } catch {
      return { street: "", apt: "", city: "", state: "", zip: "" };
    }
  });

  const [notes, setNotes] = useState(() => {
    return localStorage.getItem("carwash_notes") || "";
  });

  const [providerData, setProviderData] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerPricing, setProviderPricing] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const {
    photos,
    photoPreviews,
    handlePhotoSelect,
    handleRemovePhoto
  } = usePhotoUpload();

  const [addressSearch, setAddressSearch] = useState(() => {
    return localStorage.getItem("carwash_address_search") || "";
  });

  const [dbAddons, setDbAddons] = useState<any[]>([]);
  const [providerAddons, setProviderAddons] = useState<any[]>([]);
  const [providerServicePricing, setProviderServicePricing] = useState<any[]>([]);

  // Search params sync
  useEffect(() => {
    const paramStep = searchParams.get("step");
    if (paramStep !== null) {
      setStep(Number(paramStep));
    }
    const paramProvider = searchParams.get("provider");
    if (paramProvider) {
      setSelectedProvider(paramProvider);
    }
  }, [searchParams]);

  // Addons fetch
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await getAddonServices(3);
        if (res?.success) {
          setDbAddons(res.data);
        }
      } catch (err) {
        console.error("Failed to load addons", err);
      }
    };
    fetchAddons();
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (serviceType !== null) {
      localStorage.setItem("carwash_serviceType", String(serviceType));
      localStorage.setItem("servicetype_id", String(serviceType));
    }
  }, [serviceType]);

  useEffect(() => {
    if (vehicle) {
      localStorage.setItem("carwash_vehicle", vehicle);
    }
  }, [vehicle]);

  useEffect(() => {
    if (service) {
      localStorage.setItem("carwash_service", String(service));
    }
  }, [service]);

  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("carwash_provider", String(selectedProvider));
    }
  }, [selectedProvider]);

  useEffect(() => {
    localStorage.setItem("carwash_addOns", JSON.stringify(addOns));
  }, [addOns]);

  useEffect(() => {
    localStorage.setItem("carwash_locType", locType);
  }, [locType]);

  useEffect(() => {
    localStorage.setItem("carwash_notes", notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("carwash_address", JSON.stringify(address));
  }, [address]);

  // Metadata fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [itemsRes, typesRes, slotsRes] = await Promise.all([
          getItems({ category_id: 3 }),
          getServiceTypes({ category_id: 3 }),
          getTimeSlots(),
        ]);
        setDbItems(itemsRes?.data || itemsRes || []);
        const types = typesRes || [];
        setServiceTypesList(types);
        if (types.length > 0) {
          const stored = localStorage.getItem("carwash_serviceType") || localStorage.getItem("servicetype_id");
          const found = types.find((t: any) => String(t.id) === String(stored));
          if (found) {
            setServiceType(found.id);
            const isCustom = found.name === "In-Home" || found.name === "Pick-Up";
            setLocType(isCustom ? "custom" : "provider");
          } else if (serviceType === null) {
            setServiceType(types[0].id);
            const isCustom = types[0].name === "In-Home" || types[0].name === "Pick-Up";
            setLocType(isCustom ? "custom" : "provider");
          }
        }
        setSlotsData(slotsRes || []);
        if (slotsRes && slotsRes.length > 0) {
          setSelectedSlot(slotsRes[0].id);
          setTimeWindow(slotsRes[0].slot_name);
        }
      } catch (err) {
        console.error("Failed to load car wash metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Provider slots fetch
  useEffect(() => {
    const fetchProviderSlots = async () => {
      if (!selectedProvider || !date) {
        setProviderSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        const payload = {
          provider_id: Number(selectedProvider),
          date: date ? format(date, "yyyy-MM-dd") : "",
        };
        const res = await getProviderSlots(payload);
        const fetched = res?.data?.slots || [];
        setProviderSlots(fetched);
        if (fetched.length > 0) {
          setSelectedSlot(fetched[0].slot_id);
          setTimeWindow(formatTimeSlot(fetched[0].start_time, fetched[0].end_time));
        } else {
          setSelectedSlot(null);
          setTimeWindow("");
        }
      } catch (err) {
        console.error("Failed to load provider slots", err);
        setProviderSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchProviderSlots();
  }, [selectedProvider, date]);

  // Services list fetch
  useEffect(() => {
    const fetchServicesList = async () => {
      try {
        setLoadingServices(true);
        const res = await getServices({ category_id: 3 });
        const fetched = res?.data || res || [];

        const descMap: Record<string, string> = {
          "Exterior Wash": "Quick outside clean",
          "Interior Cleaning": "Vacuum & wipe-down",
          "Full Detail": "Inside & outside detail",
          "Premium Detail": "Wax, polish, deep clean",
          "Custom Service": "Tell us what you need",
        };
        const priceMap: Record<string, number> = {
          "Exterior Wash": 15,
          "Interior Cleaning": 25,
          "Full Detail": 60,
          "Premium Detail": 120,
          "Custom Service": 0,
        };

        const mapped = fetched.map((s: any) => ({
          id: s.id,
          label: s.name,
          desc: descMap[s.name] || s.description || "Professional car wash service",
          price: priceMap[s.name] || 0,
        }));

        setServiceTypes(mapped);

        const storedService = localStorage.getItem("carwash_service");
        const storedServiceName = localStorage.getItem("carwash_serviceName");
        let matchedService = null;
        if (storedService) {
          matchedService = mapped.find((s: any) => String(s.id) === String(storedService));
        }
        if (!matchedService && storedServiceName) {
          matchedService = mapped.find((s: any) => s.label.toLowerCase() === storedServiceName.toLowerCase());
        }
        if (matchedService) {
          setService(matchedService.id);
          localStorage.setItem("carwash_service", String(matchedService.id));
        } else if (mapped.length > 0) {
          setService(mapped[0].id);
          localStorage.setItem("carwash_service", String(mapped[0].id));
        }
      } catch (err) {
        console.error("Failed to load car wash services", err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServicesList();
  }, []);

  const toggleAddOn = (v: string) =>
    setAddOns((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  // Search providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const payload: any = {
          service_category: "Car Wash",
          limit: 100,
        };
        if (filterRating) payload.rating = Number(filterRating);
        if (filterDistance) payload.miles = filterDistance;
        if (filterSlot) payload.slot_id = Number(filterSlot);
        const addrStr = typeof filterAddress === "string" ? filterAddress.trim() : ((filterAddress as any)?.address || "").trim();
        if (addrStr) payload.address = addrStr;
        if (filterCoords?.lat && filterCoords?.lng) {
          payload.latitude = filterCoords.lat;
          payload.longitude = filterCoords.lng;
        }

        if (serviceType) payload.service_type_id = Number(serviceType);
        if (service) payload.service_id = Number(service);

        const res = await searchProviders(payload);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setProviderData(data);
      } catch (err) {
        console.error("Failed to load car wash providers", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    const timer = setTimeout(() => {
      fetchProviders();
    }, 400);
    return () => clearTimeout(timer);
  }, [filterRating, filterDistance, filterSlot, filterAddress, filterCoords, locType, serviceTypesList, service, serviceType]);

  // Provider pricing fetch
  useEffect(() => {
    const fetchPricing = async () => {
      if (!selectedProvider) {
        setProviderPricing([]);
        return;
      }
      const selectedProv = providerData.find(
        (p) =>
          String(p.id) === String(selectedProvider) ||
          String(p.user_id) === String(selectedProvider) ||
          String(p.user?.id) === String(selectedProvider)
      );
      const selectedProviderUserId = selectedProv ? (selectedProv.user?.id || selectedProv.user_id) : null;
      if (!selectedProviderUserId) {
        setProviderPricing([]);
        return;
      }
      try {
        setLoadingPricing(true);
        const res = await getProviderPrice({ provider_id: Number(selectedProviderUserId) });
        if (res?.success && res?.data?.item_pricing) {
          setProviderPricing(res.data.item_pricing);
          setProviderAddons(res.data.addon_pricing || []);
          setProviderServicePricing(res.data.service_pricing || []);
        } else {
          setProviderPricing([]);
          setProviderAddons([]);
          setProviderServicePricing([]);
        }
      } catch (err) {
        console.error("Failed to load provider pricing", err);
        setProviderPricing([]);
        setProviderAddons([]);
      } finally {
        setLoadingPricing(false);
      }
    };
    fetchPricing();
  }, [selectedProvider, providerData]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const mappedProviders = providerData.map((p: any) => ({
    id: String(p.id),
    name: p.business_name,
    rating: p.rating,
    distance: p.distance ? `${parseFloat(p.distance).toFixed(1)} miles` : "N/A",
    startingPrice: p.min_price !== undefined && p.min_price !== null ? parseFloat(p.min_price) : 15,
    photo: p.profile_photo ? `${baseUrl}${p.profile_photo}` : (p.user?.profile_image || "/default-avatar.png"),
    services: p.service_categories || ["Car Wash"],
    user_id: p.user?.id || p.user_id,
    location: p.city ? `${p.city}, ${p.state}` : "—",
  }));

  const provider = mappedProviders.find((p) => p.id === selectedProvider);
  const serviceObj = serviceTypes.find((s) => s.id === service);

  const {
    isOffered: isCwServiceOfferedResult,
    cwPricingItem,
  } = checkCarWashOffered(
    dbItems,
    providerPricing,
    service,
    vehicle,
    serviceTypes,
    VEHICLE_TYPES
  );

  const isCwServiceOffered = !selectedProvider || isCwServiceOfferedResult;

  let vehicleMultiplier = 0;
  if (vehicle?.toLowerCase() === "suv") vehicleMultiplier = 10;
  else if (vehicle?.toLowerCase() === "truck") vehicleMultiplier = 15;
  else if (vehicle?.toLowerCase() === "van") vehicleMultiplier = 20;
  else if (vehicle?.toLowerCase() === "other") vehicleMultiplier = 10;

  const defaultBasePrice = (serviceObj?.price ?? 0) + vehicleMultiplier;
  const addOnPrice = addOns.reduce((sum, addonName) => {
    const addon = dbAddons.find((a) => a.name === addonName);
    if (!addon) return sum;
    const pricing = providerAddons.find((ap) => ap.addon_id === addon.id);
    return sum + (pricing ? parseFloat(String(pricing.price)) : 0);
  }, 0);
  const serviceTypePricing = providerServicePricing.find((s) => Number(s.service_type_id) === Number(serviceType));
  const serviceTypeFee = (selectedProvider && serviceTypePricing && serviceTypePricing.is_active) ? parseFloat(String(serviceTypePricing.amount)) : 0;
  const basePrice = (selectedProvider && cwPricingItem && isCwServiceOffered) ? parseFloat(String(cwPricingItem.price)) : defaultBasePrice;
  const priceLow = basePrice + addOnPrice + serviceTypeFee;
  const priceHigh = selectedProvider ? priceLow : basePrice + addOnPrice + 20 + serviceTypeFee;

  const canNext = () => {
    if (step === 0) return !!serviceType;
    if (step === 1) return !!vehicle;
    if (step === 2) return !!service;
    if (step === 3) return !!selectedProvider && isCwServiceOffered;
    if (step === 4) return !!date && !!selectedSlot;
    if (step === 6 && locType === "custom") return !!address.street && !!address.city;
    return true;
  };

  const handleConfirmBooking = async () => {
    try {
      const formData: any = new FormData();
      formData.append("provider_id", selectedProvider);
      formData.append("order_type", "item_based");
      formData.append("service_type_id", String(serviceType));
      formData.append("booking_date", date ? format(date, "yyyy-MM-dd") : "");
      formData.append("time_slot_id", String(selectedSlot));

      const pickupAdd = locType === "custom" ? `${address.street}${address.apt ? ", " + address.apt : ""}, ${address.city} ${address.state} ${address.zip}` : "";
      formData.append("pickup_address", pickupAdd);
      formData.append("delivery_address", "");
      formData.append("service_category", "Car Wash");

      const bookingItems: any[] = [];
      const vehicleItem = dbItems.find((i) => i.name.toLowerCase() === vehicle.toLowerCase());
      if (vehicleItem) {
        bookingItems.push({
          item_id: vehicleItem.id,
          service_id: Number(service),
          quantity: 1,
        });
      }

      if (addOns.length > 0) {
        const calculatedAddOnPrice = addOns.reduce((sum, addonName) => {
          const addon = dbAddons.find((a) => a.name === addonName);
          if (!addon) return sum;
          const pricing = providerAddons.find((ap) => ap.addon_id === addon.id);
          return sum + (pricing ? parseFloat(String(pricing.price)) : 0);
        }, 0);

        bookingItems.push({
          item_id: null,
          custom_item_name: `Add-ons: ${addOns.join(", ")}`,
          service_id: Number(service),
          quantity: 1,
          price: calculatedAddOnPrice,
        });
      }

      if (notes) {
        bookingItems.push({
          item_id: null,
          custom_item_name: `Notes: ${notes}`,
          service_id: Number(service),
          quantity: 1,
        });
      }

      formData.append("items", JSON.stringify(bookingItems));

      if (photos && photos.length > 0) {
        photos.forEach((photo) => {
          formData.append("photo", photo);
        });
      }

      await toast.promise(addProviderBooking(formData), {
        loading: "Processing your booking...",
        success: (res: any) => {
          if (res?.success) {
            clearCarWashBookingState();
            navigate("/orders");
            return "Booking created successfully!";
          }
          throw new Error(res?.message || "Failed to create booking");
        },
        error: (err: any) =>
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create booking",
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  return {
    navigate,
    step,
    setStep,
    serviceType,
    setServiceType,
    vehicle,
    setVehicle,
    service,
    setService,
    serviceTypes,
    loadingServices,
    selectedProvider,
    setSelectedProvider,
    filterRating,
    setFilterRating,
    filterAddress,
    setFilterAddress,
    filterCoords,
    setFilterCoords,
    filterDistance,
    setFilterDistance,
    filterSlot,
    setFilterSlot,
    date,
    setDate,
    timeWindow,
    setTimeWindow,
    addOns,
    toggleAddOn,
    locType,
    setLocType,
    address,
    setAddress,
    notes,
    setNotes,
    providerData,
    loadingProviders,
    providerPricing,
    loadingPricing,
    photos,
    photoPreviews,
    handlePhotoSelect,
    handleRemovePhoto,
    addressSearch,
    setAddressSearch,
    dbAddons,
    providerAddons,
    providerServicePricing,
    serviceTypesList,
    slotsData,
    selectedSlot,
    setSelectedSlot,
    providerSlots,
    loadingSlots,
    mappedProviders,
    filteredProviders: mappedProviders,
    provider,
    serviceObj,
    isCwServiceOffered,
    cwPricingItem,
    basePrice,
    serviceTypeFee,
    addOnPrice,
    priceLow,
    priceHigh,
    canNext,
    handleConfirmBooking,

  };
}
