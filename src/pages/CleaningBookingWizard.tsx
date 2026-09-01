import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Sparkles, Home, Building2, Briefcase, CalendarIcon, Upload,
  Check, ChevronLeft, ChevronRight, Info, Plus, Minus,
  Shirt, Car, Truck, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProviderCard from "@/components/ProviderCard";
import { providers } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { getServices, getCleaningConfig, getItems } from "@/services/item.service";
import { searchProviders, addProviderBooking, getServiceTypes, getTimeSlots, getProviderSlots, getProviderPrice } from "@/services/provider.service";
import toast from "react-hot-toast";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { formatTimeSlot } from "@/utils/format";
import { checkCleaningOffered } from "@/utils/bookingValidation";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { getAddonServices } from "@/services/pricing.service";
import { CLEANING_STEPS, TIME_WINDOWS } from "@/constants/booking";
import { clearCleaningBookingState } from "@/utils/bookingState";

const STEPS = CLEANING_STEPS;
const timeWindows = TIME_WINDOWS;

const CleaningBookingWizard = () => {
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
  const [propertyTypes, setPropertyTypes] = useState<string[]>(["House", "Apartment", "Condo", "Office", "Other"]);
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
  const [timeWindow, setTimeWindow] = useState(timeWindows[0]);
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

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await getAddonServices(2); // Category 2 is House Cleaning
        if (res?.success) {
          setDbAddons(res.data);
        }
      } catch (err) {
        console.error("Failed to load addons", err);
      }
    };
    fetchAddons();
  }, []);

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
        if (config?.checklistGroups) {
          setChecklistGroups(config.checklistGroups);
        }
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

        if (serviceType) {
          payload.service_type_id = Number(serviceType);
        }

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

  const filteredProviders = mappedProviders;



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

      const bookingItems = [];
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

  return (
    <div className="container-grid py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">Book House Cleaning</h1>
          <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <span key={s} className={`whitespace-nowrap text-xs px-2 py-0.5 rounded-full ${i === step ? "bg-primary/10 text-primary font-medium" : i < step ? "text-secondary" : "text-muted-foreground"}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Category Selector Tabs */}
      <Tabs
        value="2"
        onValueChange={(val) => {
          if (val === "1") navigate("/search");
          if (val === "3") navigate("/booking/carwash");
        }}
        className="mb-8 w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-[600px] bg-muted/60 p-1 rounded-xl">
          <TabsTrigger
            value="1"
            className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Shirt size={16} /> Laundry
          </TabsTrigger>
          <TabsTrigger
            value="2"
            className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Sparkles size={16} /> House Cleaning
          </TabsTrigger>
          <TabsTrigger
            value="3"
            className="data-[state=active]:bg-[#00ba88] data-[state=active]:text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Car size={16} /> Car Wash
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {step === 0 && (
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
            How can we help?
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {serviceTypesList.map((st: any) => (
              <button
                key={st.id}
                onClick={() => {
                  setServiceType(st.id);
                  setSelectedProvider(null);
                }}
                className={`rounded-xl border-2 p-6 text-left transition-all card-elevated ${serviceType === st.id
                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
                  }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${serviceType === st.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {st.name === "In-Home" ? (
                    <Home size={24} />
                  ) : st.name === "Pick-Up" ? (
                    <Truck size={24} />
                  ) : (
                    <MapPin size={24} />
                  )}
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                  {st.name === "In-Home" ? "In-Home/Office" : st.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {st.name === "In-Home" ? "Service provided at customer’s home/Office" : st.description}
                </p>
                {serviceType === st.id && (
                  <Check className="mt-3 text-primary" size={20} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-heading text-xl font-semibold mb-6">What type of cleaning do you need?</h2>
          {loadingServices ? (
            <p className="text-sm text-muted-foreground">Loading services...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cleaningTypes.map((ct) => (
                <button key={ct.id} onClick={() => setCleaningType(ct.id)}
                  className={`rounded-xl border-2 p-6 text-left transition-all card-elevated ${cleaningType === ct.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    }`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${cleaningType === ct.id ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>
                    <ct.icon size={22} />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold">{ct.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{ct.desc}</p>
                  {cleaningType === ct.id && <Check className="mt-3 text-primary" size={20} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl space-y-6">
          <h2 className="font-heading text-xl font-semibold">Property Details</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Property Type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {propertyTypes.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {["Bedrooms", "Bathrooms"].map((label) => {
            const val = label === "Bedrooms" ? bedrooms : bathrooms;
            const setter = label === "Bedrooms" ? setBedrooms : setBathrooms;
            return (
              <div key={label}>
                <label className="mb-1.5 block text-sm font-medium">{label}</label>
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" onClick={() => setter(Math.max(0, val - 1))}><Minus size={14} /></Button>
                  <span className="w-8 text-center font-semibold">{val}</span>
                  <Button size="icon" variant="outline" onClick={() => setter(val + 1)}><Plus size={14} /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">Choose a Provider</h2>
          <div className="flex flex-col md:flex-row gap-6">

            {/* LEFT SIDEBAR FILTER */}
            <div className="w-full md:w-64 bg-white p-4 rounded-xl h-fit border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Filter</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterAddress("");
                    setFilterCoords(null);
                    setFilterDistance(null);
                    setFilterSlot(null);
                    setFilterRating("");
                  }}
                >
                  Reset
                </Button>
              </div>

              {/* Address */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Address</p>
                <GooglePlaceAutocomplete
                  value={typeof filterAddress === "string" ? filterAddress : (filterAddress as any)?.address || ""}
                  placeholder="Enter address..."
                  onChange={(val) => {
                    setFilterAddress(typeof val === "string" ? val : (val as any)?.address || "");
                    if (!val) setFilterCoords(null);
                  }}
                  onSelect={(place: any) => {
                    if (typeof place === "string") {
                      setFilterAddress(place);
                      setFilterCoords(null);
                    } else if (place && typeof place === "object") {
                      setFilterAddress(place.address || "");
                      if (place.lat && place.lng) {
                        setFilterCoords({ lat: place.lat, lng: place.lng });
                      }
                    }
                  }}
                />
              </div>

              {/* Distance */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Distance</p>
                {[1, 5, 10, 25, 50].map((d) => (
                  <label key={d} className="block text-sm mb-1 cursor-pointer">
                    <input
                      type="radio"
                      name="cleaning_distance"
                      value={d}
                      checked={filterDistance === d}
                      onChange={() => setFilterDistance(d)}
                      className="mr-2 accent-primary"
                    />
                    {d} miles
                  </label>
                ))}
              </div>

              {/* Availability */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Availability</p>
                {slotsData.map((time) => (
                  <label key={time.id} className="block text-sm mb-1 cursor-pointer">
                    <input
                      type="radio"
                      name="cleaning_timeSlot"
                      value={time.id}
                      checked={filterSlot === String(time.id)}
                      onChange={() => setFilterSlot(String(time.id))}
                      className="mr-2 accent-primary"
                    />
                    {time.slot_name}
                  </label>
                ))}
              </div>

              {/* Rating */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Rating</p>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.7">4.7+ Stars</option>
                </select>
              </div>
            </div>

            {/* RIGHT PROVIDER LIST GRID */}
            <div className="flex-1">
              {loadingProviders ? (
                <p className="text-sm text-muted-foreground">Loading providers...</p>
              ) : filteredProviders.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card">
                  <p className="text-sm text-muted-foreground">No providers available for House Cleaning currently.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProviders.map((p) => {
                    const isSelected = String(selectedProvider) === String(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProvider(String(p.id))}
                        className={`cursor-pointer rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent"
                        }`}
                      >
                        <ProviderCard {...p} services={p.services} />
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedProvider && !isServiceOffered && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    This provider does not offer the requested configuration ({bedrooms} Bed, {bathrooms} Bath) for {cleaningTypes.find((c) => c.id === cleaningType)?.label || "the selected cleaning type"}. Please select another provider.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-xl space-y-6">
          <h2 className="font-heading text-xl font-semibold">Preferred Date & Time</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2" size={16} />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Time Window</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Loading available slots...</p>
              ) : providerSlots.length === 0 ? (
                <p className="text-sm text-amber-600 font-medium col-span-2">⚠️ No time slots available for this provider on the selected date.</p>
              ) : (
                providerSlots.map((slot) => {
                  const slotLabel = formatTimeSlot(slot.start_time, slot.end_time);
                  return (
                    <button key={slot.slot_id} onClick={() => {
                      setSelectedSlot(slot.slot_id);
                      setTimeWindow(slotLabel);
                    }}
                      className={`rounded-lg border-2 p-3 text-sm transition-all ${selectedSlot === slot.slot_id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                      {slotLabel}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <h2 className="font-heading text-xl font-semibold">Cleaning Checklist</h2>
          {checklistGroups.map((g) => (
            <div key={g.name} className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 font-heading font-semibold text-foreground">{g.name}</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((it) => {
                  const itemKey = `${g.name}:${it}`;
                  if (g.name === "Add-On Services") {
                    const addonObj = dbAddons.find((a) => a.name === it);
                    const pricing = addonObj && selectedProvider ? providerAddons.find((ap) => ap.addon_id === addonObj.id) : null;
                    const isAvailable = !selectedProvider || (!!pricing && parseFloat(String(pricing.price)) > 0);
                    const priceText = pricing ? `+$${parseFloat(String(pricing.price)).toFixed(2)}` : "+$0.00";

                    return (
                      <div
                        key={it}
                        onClick={() => isAvailable && toggleCheck(itemKey)}
                        className={`relative group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-all ${isAvailable
                            ? "cursor-pointer hover:bg-accent"
                            : "cursor-not-allowed opacity-50 bg-muted/40"
                          }`}
                      >
                        <Checkbox
                          checked={checked.includes(itemKey)}
                          disabled={!isAvailable}
                          onCheckedChange={() => toggleCheck(itemKey)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={`flex-1 ${!isAvailable ? "text-muted-foreground line-through opacity-55" : ""}`}>{it}</span>
                        <span className="text-xs text-muted-foreground font-semibold shrink-0">
                          {isAvailable ? priceText : "Not available"}
                        </span>
                        {!isAvailable && (
                          <div className="absolute left-1/2 -top-10 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-foreground text-background text-xs rounded px-2 py-1 z-10 whitespace-nowrap shadow-md">
                            Not available with selected provider
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <label key={it} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                      <Checkbox checked={checked.includes(itemKey)} onCheckedChange={() => toggleCheck(itemKey)} />
                      <span className="flex-1">{it}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 font-heading font-semibold">Custom Request</h3>
            <Textarea placeholder="Anything specific we should know?" value={customRequest} onChange={(e) => setCustomRequest(e.target.value)} />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="max-w-xl space-y-6">
          <h2 className="font-heading text-xl font-semibold">Additional Details</h2>
          <div>
            <label className="mb-2 block text-sm font-medium">Cleaning Supplies</label>
            <div className="space-y-2">
              {[{ v: "customer", l: "I have my own supplies" }, { v: "provider", l: "Cleaner brings the supplies" }].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                  <input type="radio" checked={supplies === o.v} onChange={() => setSupplies(o.v as any)} className="accent-primary" />
                  {o.l}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Pets in the home?</label>
            <div className="flex gap-2">
              {(["no", "yes"] as const).map((v) => (
                <button key={v} onClick={() => setPets(v)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm capitalize ${pets === v ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  {v}
                </button>
              ))}
            </div>
            {pets === "yes" && (
              <Input placeholder="Pet type (e.g. dog, cat)" value={petType} onChange={(e) => setPetType(e.target.value)} className="mt-3" />
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Upload Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              id="photo-upload-cleaning"
              onChange={handlePhotoSelect}
            />
            <div
              onClick={() => document.getElementById("photo-upload-cleaning")?.click()}
              className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {photoPreviews.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-3 justify-center mb-4" onClick={(e) => e.stopPropagation()}>
                    {photoPreviews.map((src, index) => (
                      <div key={index} className="relative group">
                        <img src={src} className="w-20 h-20 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Click/tap again to add more photos (Max 5)</p>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Drag & drop photos here</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to upload photos (optional)</p>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Special Instructions</label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Access codes, focus areas, etc." />
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="max-w-xl space-y-4">
          <h2 className="font-heading text-xl font-semibold">Service Address</h2>

          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium">Search Address / Autocomplete</label>
            <GooglePlaceAutocomplete
              value={addressSearch}
              placeholder="Search or start typing your address..."
              onChange={(val) => {
                setAddressSearch(val);
              }}
              onSelect={(place) => {
                setAddressSearch(place.address);
                const components = place.fullPlace?.address_components || [];
                const getComponent = (type: string) => {
                  const comp = components.find((c: any) => c.types.includes(type));
                  return comp?.long_name || "";
                };

                let streetNumber = getComponent("street_number");
                let routeVal = getComponent("route");
                let streetVal = streetNumber ? `${streetNumber} ${routeVal}` : routeVal;
                if (!streetVal) {
                  streetVal = place.address.split(",")[0] || "";
                }

                let cityVal =
                  getComponent("locality") ||
                  getComponent("postal_town") ||
                  getComponent("sublocality_level_1") ||
                  getComponent("sublocality");

                let stateVal = getComponent("administrative_area_level_1");
                let zipVal = getComponent("postal_code");

                setAddress((prev) => ({
                  ...prev,
                  street: streetVal,
                  city: cityVal || prev.city,
                  state: stateVal || prev.state,
                  zip: zipVal || prev.zip,
                }));
              }}
            />
          </div>

          <Input placeholder="Street Address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          <Input placeholder="Apartment / Suite" value={address.apt} onChange={(e) => setAddress({ ...address, apt: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            <Input placeholder="ZIP" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="max-w-xl space-y-6">
          <h2 className="font-heading text-xl font-semibold">Estimate</h2>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 card-elevated">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated Duration</span>
              <span className="font-semibold">{estimatedDuration.toFixed(1)} hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base Cleaning Price</span>
              <span className="font-semibold">
                {selectedProvider ? `$${calculatedBasePrice.toFixed(2)}` : `$${defaultPriceLow} – $${defaultPriceHigh}`}
              </span>
            </div>
            {selectedProvider && serviceTypeFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-semibold">
                  +${serviceTypeFee.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Add-On Services</span>
              <span className="font-semibold text-emerald-600">
                +${addOnsCost.toFixed(2)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Total Estimated Price</span>
              <span className="font-heading text-xl font-bold text-primary">
                {selectedProvider && !isServiceOffered ? "Service not offered" : (
                  selectedProvider ? `$${priceLow.toFixed(2)}` : `$${priceLow} – $${priceHigh}`
                )}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Info size={16} className="mt-0.5 shrink-0" />
            Final pricing may be adjusted by the provider before accepting the booking.
          </div>
        </div>
      )}

      {step === 9 && (
        <div className="max-w-2xl space-y-4">
          <h2 className="font-heading text-xl font-semibold">Booking Summary</h2>
          {[
            ["Cleaning Type", cleaningTypes.find((c) => c.id === cleaningType)?.label],
            ["Property", `${propertyType} • ${bedrooms} bed • ${bathrooms} bath`],
            ["Checklist", checked.filter((itemKey) => !itemKey.startsWith("Add-On Services:")).length ? checked.filter((itemKey) => !itemKey.startsWith("Add-On Services:")).map((itemKey) => itemKey.slice(itemKey.indexOf(":") + 1)).join(", ") : "No standard checklist items selected (all tasks unchecked)"],
            ["Add-on Services", checked.filter((itemKey) => itemKey.startsWith("Add-On Services:")).length ? checked.filter((itemKey) => itemKey.startsWith("Add-On Services:")).map((itemKey) => {
              const name = itemKey.slice("Add-On Services:".length);
              const addonObj = dbAddons.find((a) => a.name === name);
              const pricing = addonObj && selectedProvider ? providerAddons.find((ap) => ap.addon_id === addonObj.id) : null;
              const price = pricing ? parseFloat(String(pricing.price)) : 0;
              return `${name} (+$${price.toFixed(2)})`;
            }).join(", ") : "—"],
            ["Service Fee", selectedProvider && serviceTypeFee > 0 ? `+$${serviceTypeFee.toFixed(2)}` : "Included / $0.00"],
            ["Custom Request", customRequest || "—"],
            ["Date", date ? format(date, "PPP") : "—"],
            ["Time", timeWindow],
            ["Address", `${address.street}${address.apt ? ", " + address.apt : ""}, ${address.city} ${address.state} ${address.zip}`],
            ["Estimated Cost", (selectedProvider && !isServiceOffered) ? "Service not offered" : (
              selectedProvider ? `$${priceLow.toFixed(2)}` : `$${priceLow} – $${priceHigh}`
            )],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between gap-4 rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <span className="text-right text-sm font-semibold text-foreground">{val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>
            {step === 8 ? "Continue" : "Next"} <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>Edit Booking</Button>
            <Button onClick={handleConfirmBooking} disabled={!!(selectedProvider && !isServiceOffered)}>Confirm Booking</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleaningBookingWizard;
