import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Sparkles, Home, Building2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

import { getServices, getCleaningConfig, getItems } from "@/services/item.service";
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
import { checkCleaningOffered } from "@/utils/bookingValidation";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { TIME_WINDOWS } from "@/constants/booking";
import { clearCleaningBookingState } from "@/utils/bookingState";

export function useCleaningBookingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(() => {
    const paramStep = searchParams.get("step");
    return paramStep !== null ? Number(paramStep) : 0;
  });

  const [serviceType, setServiceType] = useState<number | null>(() => {
    const saved = localStorage.getItem("cleaning_serviceType") || localStorage.getItem("servicetype_id");
    return saved ? Number(saved) : null;
  });

  const [propertyTypes, setPropertyTypes] = useState<string[]>([
    "House", "Apartment", "Condo", "Office", "Other"
  ]);

  const [checklistGroups, setChecklistGroups] = useState<any[]>([
    { name: "General Cleaning", items: ["Dusting", "Vacuuming", "Sweeping", "Mopping"] },
    { name: "Kitchen Cleaning", items: ["Countertops", "Stovetop", "Sink", "Appliance exteriors"] },
    { name: "Bathroom Cleaning", items: ["Toilet", "Shower/Tub", "Sink", "Mirrors"] },
    { name: "Add-On Services", items: ["Inside Fridge", "Inside Oven", "Cabinets", "Interior Windows", "Laundry", "Dishes", "Balcony / Patio"] },
  ]);

  const [dbItems, setDbItems] = useState<any[]>([]);
  const [serviceTypesList, setServiceTypesList] = useState<any[]>([]);
  const [slotsData, setSlotsData] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [providerSlots, setProviderSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [cleaningTypes, setCleaningTypes] = useState<any[]>([]);
  const [cleaningType, setCleaningType] = useState<any>(() => {
    const saved = localStorage.getItem("cleaning_cleaningType");
    return saved ? Number(saved) : "";
  });
  const [loadingServices, setLoadingServices] = useState(true);

  const [propertyType, setPropertyType] = useState(() => {
    return localStorage.getItem("cleaning_propertyType") || "House";
  });

  const [bedrooms, setBedrooms] = useState(() => {
    const saved = localStorage.getItem("cleaning_bedrooms");
    return saved ? Number(saved) : 2;
  });

  const [bathrooms, setBathrooms] = useState(() => {
    const saved = localStorage.getItem("cleaning_bathrooms");
    return saved ? Number(saved) : 1;
  });

  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    () => searchParams.get("provider") || localStorage.getItem("cleaning_provider") || null
  );

  const [filterRating, setFilterRating] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterCoords, setFilterCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDistance, setFilterDistance] = useState<number | null>(null);
  const [filterSlot, setFilterSlot] = useState<string | null>(null);

  const [date, setDate] = useState<Date>();
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);

  const [checked, setChecked] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cleaning_checked");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customRequest, setCustomRequest] = useState("");
  const [supplies, setSupplies] = useState<"customer" | "provider">(() => {
    const saved = localStorage.getItem("cleaning_supplies");
    return (saved as "customer" | "provider") || "provider";
  });

  const [pets, setPets] = useState<"yes" | "no">(() => {
    const saved = localStorage.getItem("cleaning_pets");
    return (saved as "yes" | "no") || "no";
  });

  const [petType, setPetType] = useState(() => {
    return localStorage.getItem("cleaning_petType") || "";
  });

  const [instructions, setInstructions] = useState(() => {
    return localStorage.getItem("cleaning_instructions") || "";
  });

  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem("cleaning_address");
      return saved ? JSON.parse(saved) : { street: "", apt: "", city: "", state: "", zip: "" };
    } catch {
      return { street: "", apt: "", city: "", state: "", zip: "" };
    }
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
    return localStorage.getItem("cleaning_address_search") || "";
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
        const res = await getAddonServices(2);
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
      localStorage.setItem("cleaning_serviceType", String(serviceType));
      localStorage.setItem("servicetype_id", String(serviceType));
    }
  }, [serviceType]);

  useEffect(() => {
    if (cleaningType) {
      localStorage.setItem("cleaning_cleaningType", String(cleaningType));
    }
  }, [cleaningType]);

  useEffect(() => {
    localStorage.setItem("cleaning_propertyType", propertyType);
  }, [propertyType]);

  useEffect(() => {
    localStorage.setItem("cleaning_bedrooms", String(bedrooms));
  }, [bedrooms]);

  useEffect(() => {
    localStorage.setItem("cleaning_bathrooms", String(bathrooms));
  }, [bathrooms]);

  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("cleaning_provider", String(selectedProvider));
    }
  }, [selectedProvider]);

  useEffect(() => {
    localStorage.setItem("cleaning_checked", JSON.stringify(checked));
  }, [checked]);

  useEffect(() => {
    localStorage.setItem("cleaning_supplies", supplies);
  }, [supplies]);

  useEffect(() => {
    localStorage.setItem("cleaning_pets", pets);
  }, [pets]);

  useEffect(() => {
    localStorage.setItem("cleaning_petType", petType);
  }, [petType]);

  useEffect(() => {
    localStorage.setItem("cleaning_instructions", instructions);
  }, [instructions]);

  useEffect(() => {
    localStorage.setItem("cleaning_address", JSON.stringify(address));
  }, [address]);

  // Metadata fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [config, itemsRes, typesRes, slotsRes] = await Promise.all([
          getCleaningConfig(),
          getItems({ category_id: 2 }),
          getServiceTypes({ category_id: 2 }),
          getTimeSlots(),
        ]);
        if (config?.propertyTypes) setPropertyTypes(config.propertyTypes);
        if (config?.checklistGroups) setChecklistGroups(config.checklistGroups);
        setDbItems(itemsRes?.data || itemsRes || []);
        const types = typesRes || [];
        setServiceTypesList(types);
        if (types.length > 0) {
          const stored = localStorage.getItem("cleaning_serviceType") || localStorage.getItem("servicetype_id");
          const found = types.find((t: any) => String(t.id) === String(stored));
          if (found) {
            setServiceType(found.id);
          } else if (serviceType === null) {
            setServiceType(types[0].id);
          }
        }
        setSlotsData(slotsRes || []);
        if (slotsRes && slotsRes.length > 0) {
          setSelectedSlot(slotsRes[0].id);
          setTimeWindow(slotsRes[0].slot_name);
        }
      } catch (err) {
        console.error("Failed to load cleaning metadata", err);
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
        const res = await getServices({ category_id: 2 });
        const fetched = res?.data || res || [];

        const iconMap: Record<string, any> = {
          "Standard Cleaning": Sparkles,
          "Deep Cleaning": Sparkles,
          "Move-In / Move-Out": Home,
          "Airbnb Turnover": Building2,
          "Office Cleaning": Briefcase,
          "Custom Cleaning": Sparkles,
        };
        const descMap: Record<string, string> = {
          "Standard Cleaning": "Regular home cleaning",
          "Deep Cleaning": "Thorough top-to-bottom clean",
          "Move-In / Move-Out": "Prepare your new or old home",
          "Airbnb Turnover": "Fast turnover between guests",
          "Office Cleaning": "Commercial workspace",
          "Custom Cleaning": "Tell us what you need",
        };

        const mapped = fetched.map((s: any) => ({
          id: s.id,
          label: s.name,
          icon: iconMap[s.name] || Sparkles,
          desc: descMap[s.name] || s.description || "Professional cleaning service",
        }));

        setCleaningTypes(mapped);

        const storedCleaningType = localStorage.getItem("cleaning_cleaningType");
        const storedServiceName = localStorage.getItem("cleaning_serviceName");
        let matchedService: any = null;
        if (storedCleaningType) {
          matchedService = mapped.find((s: any) => String(s.id) === String(storedCleaningType));
        }
        if (!matchedService && storedServiceName) {
          matchedService = mapped.find((s: any) => s.label.toLowerCase() === storedServiceName.toLowerCase());
        }
        if (matchedService) {
          setCleaningType(matchedService.id);
          localStorage.setItem("cleaning_cleaningType", String(matchedService.id));
        } else if (mapped.length > 0) {
          setCleaningType(mapped[0].id);
          localStorage.setItem("cleaning_cleaningType", String(mapped[0].id));
        }
      } catch (err) {
        console.error("Failed to load cleaning services", err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServicesList();
  }, []);

  const toggleCheck = (v: string) =>
    setChecked((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  // Search providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const payload: any = {
          service_category: "House Cleaning",
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
        if (cleaningType) payload.service_id = Number(cleaningType);

        const res = await searchProviders(payload);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setProviderData(data);
      } catch (err) {
        console.error("Failed to load cleaning providers", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    const timer = setTimeout(() => {
      fetchProviders();
    }, 400);
    return () => clearTimeout(timer);
  }, [filterRating, filterDistance, filterSlot, filterAddress, filterCoords, cleaningType, serviceTypesList, serviceType]);

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
    startingPrice: p.min_price !== undefined && p.min_price !== null ? parseFloat(p.min_price) : null,
    photo: p.profile_photo ? `${baseUrl}${p.profile_photo}` : (p.user?.profile_image || "/default-avatar.png"),
    services: p.service_categories || ["House Cleaning"],
    user_id: p.user?.id || p.user_id,
  }));

  const provider = mappedProviders.find((p) => p.id === selectedProvider);
  const estimatedDuration = bedrooms * 0.5 + bathrooms * 0.5;

  const {
    isOffered: isCleaningOffered,
    bedPricingItem,
    bathPricingItem,
  } = checkCleaningOffered(dbItems, providerPricing, cleaningType, bedrooms, bathrooms);

  const isBedOffered = !!bedPricingItem && !bedPricingItem.not_offered && parseFloat(String(bedPricingItem.price)) > 0;
  const isBathOffered = bathrooms <= 1 || (!!bathPricingItem && !bathPricingItem.not_offered);
  const isServiceOffered = !selectedProvider || isCleaningOffered;

  const bedPrice = isBedOffered ? parseFloat(String(bedPricingItem.price)) : 0;
  const bathPrice = (bathrooms > 1 && isBathOffered && bathPricingItem) ? parseFloat(String(bathPricingItem.price)) * (bathrooms - 1) : 0;
  const calculatedBasePrice = bedPrice + bathPrice;

  const addOnGroup = checklistGroups.find((g) => g.name === "Add-On Services");
  const selectedAddOns = checked
    .filter((itemKey) => itemKey.startsWith("Add-On Services:"))
    .map((itemKey) => itemKey.slice("Add-On Services:".length));
  const addOnsCost = selectedAddOns.reduce((sum, addonName) => {
    const addon = dbAddons.find((a) => a.name === addonName);
    if (!addon) return sum;
    const pricing = providerAddons.find((ap) => ap.addon_id === addon.id);
    return sum + (pricing ? parseFloat(String(pricing.price)) : 0);
  }, 0);

  const serviceTypePricing = providerServicePricing.find((s) => Number(s.service_type_id) === Number(serviceType));
  const serviceTypeFee = (selectedProvider && serviceTypePricing && serviceTypePricing.is_active) ? parseFloat(String(serviceTypePricing.amount)) : 0;

  const defaultPriceLow = 60 + bedrooms * 20 + bathrooms * 15;
  const defaultPriceHigh = defaultPriceLow + 40;
  const priceLow = (selectedProvider ? calculatedBasePrice : defaultPriceLow) + addOnsCost + serviceTypeFee;
  const priceHigh = selectedProvider ? priceLow : defaultPriceHigh + addOnsCost + serviceTypeFee;

  const canNext = () => {
    if (step === 0) return !!serviceType;
    if (step === 1) return !!cleaningType;
    if (step === 3) return !!selectedProvider && isServiceOffered;
    if (step === 4) return !!date && !!selectedSlot;
    if (step === 7) return !!address.street && !!address.city;
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
      formData.append("pickup_address", `${address.street}${address.apt ? ", " + address.apt : ""}, ${address.city} ${address.state} ${address.zip}`);
      formData.append("delivery_address", "");
      formData.append("service_category", "House Cleaning");
      formData.append("estimated_duration", String(estimatedDuration));

      const bookingItems: any[] = [];
      let bedItemName = "Studio/1 Bed";
      if (bedrooms === 2) bedItemName = "2 Bedrooms";
      else if (bedrooms === 3) bedItemName = "3 Bedrooms";
      else if (bedrooms >= 4) bedItemName = "4+ Bedrooms";

      const bedDbItem = dbItems.find((i) => i.name.toLowerCase() === bedItemName.toLowerCase());
      if (bedDbItem) {
        bookingItems.push({
          item_id: bedDbItem.id,
          service_id: Number(cleaningType),
          quantity: 1,
        });
      }

      if (bathrooms > 1) {
        const bathDbItem = dbItems.find((i) => i.name.toLowerCase() === "extra bathroom");
        if (bathDbItem) {
          bookingItems.push({
            item_id: bathDbItem.id,
            service_id: Number(cleaningType),
            quantity: bathrooms - 1,
          });
        }
      }

      const standardChecked = checked
        .filter((itemKey) => !itemKey.startsWith("Add-On Services:"))
        .map((itemKey) => itemKey.slice(itemKey.indexOf(":") + 1));
      const addOnChecked = checked
        .filter((itemKey) => itemKey.startsWith("Add-On Services:"))
        .map((itemKey) => itemKey.slice("Add-On Services:".length));

      if (standardChecked.length > 0) {
        bookingItems.push({
          item_id: null,
          custom_item_name: `Checklist: ${standardChecked.join(", ")}`,
          service_id: Number(cleaningType),
          quantity: 1,
        });
      }

      if (addOnChecked.length > 0) {
        const calculatedAddOnPrice = addOnChecked.reduce((sum, addonName) => {
          const addonObj = dbAddons.find((a) => a.name === addonName);
          if (!addonObj) return sum;
          const pricing = providerAddons.find((ap) => ap.addon_id === addonObj.id);
          return sum + (pricing ? parseFloat(String(pricing.price)) : 0);
        }, 0);

        bookingItems.push({
          item_id: null,
          custom_item_name: `Add-on Services: ${addOnChecked.join(", ")}`,
          service_id: Number(cleaningType),
          quantity: 1,
          price: calculatedAddOnPrice,
        });
      }

      if (customRequest) {
        bookingItems.push({
          item_id: null,
          custom_item_name: `Custom Request: ${customRequest}`,
          service_id: Number(cleaningType),
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
            clearCleaningBookingState();
            setStep(9);
            return "Booking created successfully!";
          }
          throw new Error(res?.message || "Failed to create booking");
        },
        error: (err: any) => err?.response?.data?.message || err?.message || "Booking failed",
      });
    } catch (err: any) {
      console.error("Booking error:", err);
    }
  };

  return {
    navigate,
    step,
    setStep,
    serviceType,
    setServiceType,
    propertyTypes,
    checklistGroups,
    dbItems,
    serviceTypesList,
    slotsData,
    selectedSlot,
    setSelectedSlot,
    providerSlots,
    loadingSlots,
    cleaningTypes,
    cleaningType,
    setCleaningType,
    loadingServices,
    propertyType,
    setPropertyType,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
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
    checked,
    toggleCheck,
    customRequest,
    setCustomRequest,
    supplies,
    setSupplies,
    pets,
    setPets,
    petType,
    setPetType,
    instructions,
    setInstructions,
    address,
    setAddress,
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
    mappedProviders,
    filteredProviders: mappedProviders,
    provider,
    estimatedDuration,
    isCleaningOffered,
    bedPricingItem,
    bathPricingItem,
    isBedOffered,
    isBathOffered,
    isServiceOffered,
    calculatedBasePrice,
    defaultPriceLow,
    defaultPriceHigh,
    addOnGroup,
    selectedAddOns,
    addOnsCost,
    serviceTypeFee,
    priceLow,
    priceHigh,
    canNext,
    handleConfirmBooking,
  };

}
