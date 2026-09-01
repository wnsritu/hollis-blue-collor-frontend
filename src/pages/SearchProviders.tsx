import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Home,
  Truck,
  MapPin,
  Search,
  Star,
  Plus,
  Minus,
  Check,
  CalendarIcon,
  Clock,
  CreditCard,
  Package,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  MessageSquare,
  Camera,
  AlertTriangle,
  Weight,
  Info,
  X,
  Wand2,
  CalendarClock,
  Key,
  Shirt,
  Sparkles,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { providers, pricingData } from "@/data/mockData";
import {
  addProviderBooking,
  getProviderPrice,
  getProviderSlots,
  getServiceTypes,
  searchProviders,
} from "@/services/provider.service";
import { getItems, getServices } from "@/services/item.service";
import toast from "react-hot-toast";
import { getAllSlots } from "@/api/provider.api";
import { getBulkPricingAPI } from "@/api/pricing.api";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import StarRating from "@/components/StarRating";
import { clearLaundryBookingState } from "@/utils/bookingState";

const MOCK_CATEGORIES_BY_NAME: Record<string, string[]> = {
  "Maria's Laundry Care": ["Laundry"],
  "Fresh & Clean Co.": ["Laundry", "House Cleaning"],
  "Sparkle Wash Hub": ["Laundry", "Car Wash"],
  "Quick Press Laundry": ["Laundry"],
  "Elite Garment Care": ["Laundry", "House Cleaning"],
  "Sunshine Cleaners": ["Laundry", "House Cleaning", "Car Wash"],
};

const STEPS = [
  "Service Type",
  "Select Provider",
  "Build Order",
  "Schedule",
  "Review",
  "Pending",
  "Payment",
  "Track",
  "Complete",
];

const serviceTypes = [
  {
    // id: "in-home",
    id: 1,
    label: "In-Home Service",
    icon: Home,
    desc: "Provider comes to your home",
  },
  {
    // id: "pickup",
    id: 2,
    label: "Pick-Up Service",
    icon: Truck,
    desc: "We pick up and deliver",
  },
  {
    // id: "dropoff",
    id: 3,
    label: "Drop-Off Service",
    icon: MapPin,
    desc: "You drop off at provider",
  },
];

const timeWindows = [
  "06:00 AM – 10:00 AM",
  "10:00 AM – 2:00 PM",
  "02:00 PM – 6:00 PM",
  "06:00 PM – 10:00 PM",
];
const trackStatuses = ["Received", "In Process", "Finished", "Delivering"];


interface OrderItem {
  itemId: number | null; // null for custom items
  item: string; // Changed from 'item' to 'itemName'
  quantity: number;
  services: number[]; // Changed from string[] to number[] (service IDs)
  notes: string;
  isCustom?: boolean;
  id?: string | number;
}

interface BulkOrder {
  weight: number;
  notes: string;
}

type OrderMode = "standard" | "bulk";

const SearchProviders = () => {

  const location = useLocation();

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialStep = Number(searchParams.get("step")) || 0;
  const [step, setStep] = useState(initialStep);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const navigate = useNavigate();
  const servicetype_id =
    localStorage.getItem("laundry_serviceType") ||
    localStorage.getItem("servicetype_id");

  // Step 1
  const [serviceType, setServiceType] = useState<number | null>(
    servicetype_id ? Number(servicetype_id) : null
  );
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );
  const handleCategoryChange = (categoryId: number) => {
    clearLaundryBookingState();
    if (categoryId === 2) {
      navigate("/booking/cleaning");
      return;
    }
    if (categoryId === 3) {
      navigate("/booking/carwash");
      return;
    }
    setSelectedCategoryId(categoryId);
    setStep(0);
    setServiceType(null);
    setSelectedProvider(null);
    setProviderId(null);
    setSelectedProviderId(null);
    setSelectedOneProvider(null);
    setOrderItems([]);
    setBulkAdded(false);
    setBulkOrder({ weight: 0, notes: "" });
    setOrderMode("standard");
    setSelectedServiceId(null);
    setIsBulk(false);
  };

  // Step 2
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    searchParams.get("userid") || localStorage.getItem("laundry_userId") || null,
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    searchParams.get("provider") || localStorage.getItem("laundry_providerId") || null,
  );
  const [selectedOneProvider, setSelectedOneProvider] = useState<any | null>(null);
  const [providerId, setProviderId] = useState<string | null>(
    () => searchParams.get("provider") || localStorage.getItem("laundry_providerId") || null
  );
  const [filterDistance, setFilterDistance] = useState<number | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);  // Step 3
  const [orderMode, setOrderMode] = useState<OrderMode>(() => {
    const saved = localStorage.getItem("laundry_orderMode");
    return (saved as OrderMode) || "standard";
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem("laundry_orderItems");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [address, setAddress] = useState("");
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkOrder, setBulkOrder] = useState<BulkOrder>(() => {
    try {
      const saved = localStorage.getItem("laundry_bulkOrder");
      return saved ? JSON.parse(saved) : { weight: 0, notes: "" };
    } catch {
      return { weight: 0, notes: "" };
    }
  });
  const [bulkAdded, setBulkAdded] = useState(false);
  const [isBulk, setIsBulk] = useState(false);

  useEffect(() => {
    const paramStep = searchParams.get("step");
    if (paramStep !== null) {
      setStep(Number(paramStep));
    }
    const paramUserId = searchParams.get("userid");
    if (paramUserId) {
      setSelectedProvider(paramUserId);
      localStorage.setItem("laundry_userId", paramUserId);
    }
    const paramProvider = searchParams.get("provider");
    if (paramProvider) {
      setSelectedProviderId(paramProvider);
      setProviderId(paramProvider);
      localStorage.setItem("laundry_providerId", paramProvider);
    }
  }, [searchParams]);

  useEffect(() => {
    if (serviceType !== null) {
      localStorage.setItem("servicetype_id", String(serviceType));
      localStorage.setItem("laundry_serviceType", String(serviceType));
    }
  }, [serviceType]);

  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("laundry_userId", String(selectedProvider));
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedProviderId) {
      localStorage.setItem("laundry_providerId", String(selectedProviderId));
    }
  }, [selectedProviderId]);

  useEffect(() => {
    localStorage.setItem("laundry_orderMode", orderMode);
  }, [orderMode]);

  useEffect(() => {
    if (orderItems.length > 0) {
      localStorage.setItem("laundry_orderItems", JSON.stringify(orderItems));
    }
  }, [orderItems]);

  useEffect(() => {
    if (bulkOrder && bulkOrder.weight > 0) {
      localStorage.setItem("laundry_bulkOrder", JSON.stringify(bulkOrder));
    }
  }, [bulkOrder]);
  // Custom item
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemService, setCustomItemService] = useState(1);
  const [customItemQty, setCustomItemQty] = useState(1);
  // Switch confirm
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingSwitchMode, setPendingSwitchMode] =
    useState<OrderMode>("standard");
  // Step 4
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [timeWindow, setTimeWindow] = useState(timeWindows[0]);
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);

  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  // Step 5 - Pending
  const [pendingPhase, setPendingPhase] = useState<"waiting" | "priceReview">(
    "waiting",
  );
  // Step 8
  const [trackIndex] = useState(1);
  const [servicesTypes, setServicesTypes] = useState([]);
  const [providerData, setProviderData] = useState([]);
  const [providerPrice, setProviderPrice] = useState(null);
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [providerPricesMap, setProviderPricesMap] = useState({}); // For quick price lookup
  const [loading, setLoading] = useState({
    items: false,
    services: false,
    price: false,
    providers: false,
  });

  const [timeSlots, setTimeSlots] = useState([]); // Store available slots
  const [slotsData, setSlotsData] = useState([]); // Store available slots
  const [loadingSlots, setLoadingSlots] = useState(false); // Loading state
  const [selectedSlot, setSelectedSlot] = useState(""); // Selected slot ID
  const [slotError, setSlotError] = useState(""); // Error message

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [loadingBulkPrice, setLoadingBulkPrice] = useState(false);
  const BULK_PRICE_PER_LB = bulkPrice;


  // Mock provider-confirmed pricing for bulk/custom
  const providerConfirmedWeight = bulkOrder.weight + 3; // mock: provider says it's heavier
  const providerBulkTotal = providerConfirmedWeight * BULK_PRICE_PER_LB;
  const originalBulkEstimate = bulkOrder.weight * BULK_PRICE_PER_LB;

  useEffect(() => {
    const address = searchParams.get("address");
    if (address) {
      setAddress(address);
    }
  }, [searchParams]);

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date < today;
  };
  const fetchBulkPrice = async () => {
    // debugger
    try {
      setLoadingBulkPrice(true);

      const res = await getBulkPricingAPI({
        provider_id: providerId || selectedProviderId,
      });

      const data = res?.data?.data;

      if (data?.price_per_lb) {
        setBulkPrice(parseFloat(data.price_per_lb));
      }
    } catch (err) {
      console.error("Bulk price error", err);
    } finally {
      setLoadingBulkPrice(false);
    }
  };

  useEffect(() => {
    if (orderMode === "bulk" && providerId && servicetype_id) {
      fetchBulkPrice();
    }
  }, [orderMode, providerId, servicetype_id]);

  const addItem = (item: any) => {
    // Find first offered service for this item
    const firstOfferedService = services.find((service: any) =>
      isServiceOffered(item.id, service.id),
    );

    const defaultServices = firstOfferedService ? [firstOfferedService.id] : [];

    if (orderItems.find((i: OrderItem) => i.itemId === item.id)) return;

    setOrderItems([
      ...orderItems,
      {
        itemId: item.id,
        item: item.name,
        quantity: 1,
        services: defaultServices,
        notes: "",
        isCustom: false,
      },
    ]);
  };


  const addCustomItem = () => {
    if (!customItemName.trim()) return;
    setOrderItems([
      ...orderItems,
      {
        itemId: null,
        item: customItemName.trim(),
        quantity: customItemQty,
        services: [customItemService],
        notes: "",
        isCustom: true,
      },
    ]);
    setCustomItemName("");
    setCustomItemService(services[0]?.id || 1);
    setCustomItemQty(1);
    setShowCustomModal(false);
  };

  const updateItem = (idx: number, updates: Partial<OrderItem>) => {
    setOrderItems(
      orderItems.map((item, i) => (i === idx ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (idx: number) =>
    setOrderItems(orderItems.filter((_, i) => i !== idx));

  const toggleService = (idx: number, serviceId: number) => {
    const item = orderItems[idx];
    const svcs = item.services.includes(serviceId)
      ? item.services.filter((s) => s !== serviceId)
      : [...item.services, serviceId];
    updateItem(idx, { services: svcs });
  };

  const getProviderItemPrice = (itemId, serviceId) => {
    const key = `${itemId}_${serviceId}`;
    const priceData = providerPricesMap[key];

    if (!priceData || priceData.notOffered) {
      return null;
    }

    return parseFloat(priceData.price);
  };

  // console.log("selectedProvider", selectedProvider);
  const itemsTotal =
    orderMode === "bulk"
      ? bulkAdded
        ? bulkOrder.weight * BULK_PRICE_PER_LB
        : 0
      : orderItems.reduce((sum: number, oi: OrderItem) => {
        if (oi.isCustom) return sum;
        return (
          sum +
          oi.services.reduce((total: number, serviceId: number) => {
            const price = getProviderItemPrice(oi.itemId!, serviceId);
            return total + (price || 0) * oi.quantity;
          }, 0)
        );
      }, 0);

  const serviceTypePricing = providerPrice?.data?.service_pricing?.find(
    (s: any) => Number(s.service_type_id) === Number(serviceType),
  );
  const deliveryFee = (selectedProvider && serviceTypePricing && serviceTypePricing.is_active)
    ? parseFloat(String(serviceTypePricing.amount))
    : 0;
  const total = itemsTotal + deliveryFee;
  const provider = providers.find((p) => p.id === selectedProvider);

  const hasCustomItems = orderItems.some((i) => i.isCustom);

  const getTimeSlotLabel = (start, end) => {
    const formatTime = (time) => {
      const [hour, min] = time.split(":");
      let h = parseInt(hour);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}${ampm}`;
    };

    const startFormatted = formatTime(start);
    const endFormatted = formatTime(end);

    const startHour = parseInt(start.split(":")[0]);

    if (startHour >= 6 && startHour < 10)
      return `Morning (${startFormatted}–${endFormatted})`;
    if (startHour >= 10 && startHour < 14)
      return `Midday (${startFormatted}–${endFormatted})`;
    if (startHour >= 14 && startHour < 18)
      return `Afternoon (${startFormatted}–${endFormatted})`;
    if (startHour >= 18 && startHour < 21)
      return `Evening (${startFormatted}–${endFormatted})`;

    return `${startFormatted}–${endFormatted}`;
  };

  const canNext = () => {
    if (step === 0) return !!serviceType;
    if (step === 1) return !!selectedProvider;
    if (step === 2) {
      if (orderMode === "bulk") return bulkAdded;
      return orderItems.length > 0;
    }
    if (step === 3) return !!scheduleDate;
    return true;
  };

  const handleModeSwitch = (mode: OrderMode) => {
    if (mode === orderMode) return;
    const hasItems =
      orderMode === "standard" ? orderItems.length > 0 : bulkAdded;
    if (hasItems) {
      setPendingSwitchMode(mode);
      setShowSwitchConfirm(true);
    } else {
      setOrderMode(mode);
    }
  };

  const confirmModeSwitch = () => {
    if (pendingSwitchMode === "bulk") {
      setOrderItems([]);
      setSelectAll(false);
    } else {
      setBulkAdded(false);
      setBulkOrder({ weight: 0, notes: "" });
    }
    setOrderMode(pendingSwitchMode);
    setShowSwitchConfirm(false);
  };

  // Helper to check if service is offered for an item
  const isServiceOffered = (itemId, serviceId) => {
    const key = `${itemId}_${serviceId}`;
    return providerPricesMap[key] && !providerPricesMap[key].notOffered;
  };

  useEffect(() => {
    const fetchSlots = async () => {
      // debugger
      setLoading((prev) => ({ ...prev, providers: true }));
      try {
        // let payload = { service_type_id: serviceType };
        const response: any = await getAllSlots();
        setSlotsData(response.data.slots || []);
        // console.log("Provider data:", response);
      } catch (err) {
        console.error("Error fetching booking status:", err);
        setSlotsData([]);
      } finally {
        setLoading((prev) => ({ ...prev, providers: false }));
      }
    };

    fetchSlots();
  }, [serviceType]);

  useEffect(() => {
    if (step === 1 || step === 2) {
      if (step === 2) {
        getAllSlots();
      }
      fetchService();
    }
  }, [step, selectedCategoryId]);

  // Fetch Provider Price and create map
  const fetchProviderPrice = async () => {
    if (!selectedProvider)


      setLoading((prev) => ({ ...prev, price: true }));
    try {
      let data = { provider_id: selectedProvider };
      const response = await getProviderPrice(data);
      setProviderPrice(response);
      // console.log(response.bulk_pricing);

      // Only Add item_pricing, bulk_pricing in response 02-05-2026
      // Create price lookup map
      const priceMap = {};
      if (response?.data?.item_pricing && Array.isArray(response.data?.item_pricing)) {
        response?.data?.item_pricing.forEach((priceItem: any) => {
          const key = `${priceItem.item_id}_${priceItem.service_id}`;
          priceMap[key] = {
            price: priceItem.price,
            notOffered: priceItem.not_offered,
          };
        });
      }
      setProviderPricesMap(priceMap);
    } catch (err) {
      console.error("Error fetching provider price:", err);
      setProviderPrice(null);
      setProviderPricesMap({});
    } finally {
      setLoading((prev) => ({ ...prev, price: false }));
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    setLoading((prev) => ({ ...prev, items: true }));
    try {
      const response = await getItems({ category_id: selectedCategoryId });
      if (response?.data && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching items", err);
      setItems([]);
    } finally {
      setLoading((prev) => ({ ...prev, items: false }));
    }
  };

  // Fetch Services
  const fetchService = async () => {
    setLoading((prev) => ({ ...prev, services: true }));
    try {
      const response: any = await getServices({ category_id: selectedCategoryId });
      if (response?.data && Array.isArray(response.data)) {
        setServices(response.data);
        // console.log("Services fetched:", response.data);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error("Error fetching services", err);
      setServices([]);
    } finally {
      setLoading((prev) => ({ ...prev, services: false }));
    }
  };

  // Fetch items and services when step becomes 2
  useEffect(() => {
    const handleStep = async () => {
      if (step == 2) {
        try {
          await fetchProviderPrice();
          await fetchItems();
        } catch (err) {
          console.error("Error in step 2:", err);
        }
      }
    };

    handleStep();
  }, [step, location.pathname, selectedCategoryId, selectedProvider]);

  useEffect(() => {
    if (selectedProvider) {
      fetchProviderPrice();
      setOrderMode("standard");
      fetchBulkPrice();
      console.log(selectedOneProvider);
      console.log(selectedProvider);
      // applyFilters();
      // console.log(providerData);
      // console.log(searchParams.get("provider"));
      setSelectedProviderId(selectedOneProvider?.id || searchParams.get("provider"));
      // debugger
    }
  }, [selectedProvider]);

  useEffect(() => {
    const fetchSlots = async () => {
      // Don't fetch if no provider selected or no date selected
      if (!selectedProvider || !scheduleDate) {
        setTimeSlots([]);
        setSelectedSlot("");
        return;
      }

      setLoadingSlots(true);
      setSlotError("");

      try {
        // Format date to YYYY-MM-DD
        const formattedDate = format(scheduleDate, "yyyy-MM-dd");
        let payload = {
          provider_id: providerId || selectedProviderId,
          date: formattedDate,
        };
        // Call API
        const response = await getProviderSlots(payload);

        if (response.success) {
          // Store slots in state
          setTimeSlots(response.data.slots);
          // Auto-select first slot if available
          if (response.data.slots && response.data.slots.length > 0) {
            setSelectedSlot(response.data.slots[0].slot_id);
          } else {
            setSelectedSlot("");
            setSlotError("No slots available for this date");
          }
        } else {
          setTimeSlots([]);
          setSlotError(response.message || "Failed to fetch slots");
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        setTimeSlots([]);
        setSlotError(error.message || "Something went wrong");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [providerId || selectedProviderId, scheduleDate]); // Dependencies: runs when provider or date changes


  const createBooking = async () => {
    try {

      if (!providerId && !selectedProviderId) {
        return toast.error("Provider not selected");
      }

      if (!servicetype_id) {
        return toast.error("Service type missing");
      }

      if (!scheduleDate || !selectedSlot) {
        return toast.error("Select date & time slot");
      }

      // 👉 STANDARD / CUSTOM VALIDATION
      if (orderMode === "standard") {
        if (!orderItems || orderItems.length === 0) {
          return toast.error("Add at least one item");
        }

        for (const item of orderItems) {
          if (item.quantity <= 0) {
            return toast.error("Invalid quantity");
          }

          if (!item.services || item.services.length === 0) {
            return toast.error(`Select service for ${item.item}`);
          }

          if (item.isCustom && !item.item) {
            return toast.error("Enter custom item name");
          }
        }
      }

      // 👉 BULK VALIDATION
      if (orderMode === "bulk") {
        if (!bulkOrder.weight || bulkOrder.weight <= 0) {
          return toast.error("Enter valid weight");
        }
      }

      // =============================
      // ✅ FORM DATA
      // =============================

      const formData: any = new FormData();

      formData.append("provider_id", providerId || selectedProviderId);
      formData.append(
        "order_type",
        orderMode === "standard" ? "item_based" : "bulk",
      );
      formData.append("service_type_id", String(serviceType));
      formData.append("booking_date", format(scheduleDate, "yyyy-MM-dd"));
      formData.append("time_slot_id", selectedSlot);
      formData.append("pickup_address", pickupLocation || "");
      formData.append("delivery_address", deliveryLocation || "");
      formData.append("service_category", "Laundry");

      // =============================
      // ✅ IMAGES (MULTIPLE)
      // =============================
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((file: File) => {
          formData.append("photo", file);
        });
      }

      // =============================
      // ✅ STANDARD + CUSTOM ITEMS
      // =============================
      if (orderMode === "standard") {
        const itemResult = orderItems.flatMap((item) =>
          item.services.map((serviceId: number) => ({
            item_id: item.isCustom ? null : item.itemId,
            custom_item_name: item.isCustom ? item.item : null,
            service_id: serviceId, // 👈 each service separate object
            quantity: item.quantity,
            is_custom: item.isCustom,
          })),
        );

        formData.append("items", JSON.stringify(itemResult));
      }

      // =============================
      // ✅ BULK ORDER
      // =============================
      if (orderMode === "bulk") {
        formData.append("weight", bulkOrder.weight);
        formData.append("price_per_lb", BULK_PRICE_PER_LB);
      }

      // =============================
      // ✅ API CALL
      // =============================
      await toast.promise(addProviderBooking(formData), {
        loading: "Processing your booking...",
        success: (res: any) => {
          if (res?.success) {
            return "Booking created successfully!";
          }
          throw new Error(res?.message || "Failed to create booking");
        },
        error: (err: any) =>
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create booking",
      });

      // =============================
      // ✅ SUCCESS FLOW
      // =============================
      clearLaundryBookingState();
      setStep(5);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Something went wrong");
    }
  };

  let itemResult = orderItems.flatMap((item) =>
    item.services.map((serviceId) => ({
      item_id: item.itemId,
      service_id: serviceId,
      quantity: item.quantity,
    })),
  );


  const applyFilters = async () => {
    try {
      let payload: any = {};

      // ✅ Rating
      if (filterRating) {
        payload.rating = filterRating;
      }
      if (filterDistance) payload.miles = filterDistance;
      if (selectedSlot) payload.slot_id = selectedSlot;
      if (serviceType) payload.service_type_id = serviceType;

      // ✅ Service / Bulk (ONLY ONE should go)
      if (isBulk) {
        payload.bulk_enabled = true;
      } else if (selectedServiceId) {
        payload.service_id = selectedServiceId;
      }

      // ✅ Address & Coordinates
      const addressStr = typeof address === "string" ? address.trim() : ((address as any)?.address || "").trim();
      if (addressStr) {
        payload.address = addressStr;
      }
      if (addressCoords?.lat && addressCoords?.lng) {
        payload.latitude = addressCoords.lat;
        payload.longitude = addressCoords.lng;
      }
      payload.limit = 100;
      payload.service_category =
        selectedCategoryId === 1
          ? "Laundry"
          : selectedCategoryId === 2
          ? "House Cleaning"
          : "Car Wash";

      const response = await searchProviders(payload);
      const providersData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setProviderData(providersData);

      if (selectedProvider) {
        console.log(selectedProviderId);
        const selectedOneProvider: any = providersData?.find((item: any) => {
          return item.id === Number(selectedProviderId);
        });
        setSelectedOneProvider(selectedOneProvider);
        // debugger
      }

    } catch (err) {
      console.error(err);
      setProviderData([]);
    } finally {
      setLoading((prev) => ({ ...prev, providers: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [serviceType, filterRating, address, selectedServiceId, isBulk, selectedSlot, filterDistance, selectedCategoryId]);

  const fetchInitialData = async () => {
    try {
      const response = await getServiceTypes({ category_id: selectedCategoryId });
      setServicesTypes(response);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedCategoryId]);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  // console.log("Base URL:", baseUrl);

  const getServiceNameStatic = (serviceId: number | string) => {
    const found = services.find((s: any) => s.id === serviceId);
    if (found) return found.name;
    const serviceMap: Record<number, string> = {
      1: "Wash",
      2: "Fold",
      3: "Iron",
      4: "Hang"
    };
    return serviceMap[Number(serviceId)] || `Service ${serviceId}`;
  };

  const handleImageSelect = (event: any) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    // ❌ Max limit check (existing + new)
    if (imageFiles.length + files.length > 5) {
      toast.error("You can upload maximum 5 images");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    let validFiles: File[] = [];
    let previewUrls: string[] = [];

    files.forEach((file: File) => {
      // ❌ Type check
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image`);
        return;
      }

      // ❌ Size check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`);
        return;
      }

      validFiles.push(file);
      previewUrls.push(URL.createObjectURL(file));
    });

    // ✅ Append new files
    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previewUrls]);

    console.log("Selected Files:", validFiles);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));

    setImagePreviews((prev) => {
      // ❗ memory free (important)
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRadioChange = async (time: any) => {
    setSelectedSlot(time.id); // ✅ ADD THIS (most important)
    return
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = async () => {
    setFilterDistance(null);
    setFilterRating(null);
    setSelectedSlot(null);
    setAddress("");
    setAddressCoords(null);
    setSelectedServiceId(null);
    setIsBulk(false);
    // await searchProviders({});
  };

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  useEffect(() => {
    if (
      selectedSlot !== null &&
      Number(selectedSlot) >= 1 &&
      Number(selectedSlot) <= timeWindows.length
    ) {
      const index = Number(selectedSlot) - 1; // <-- backend slot 1-based, array 0-based
      setTimeWindow(timeWindows[index]);
    }
  }, [selectedSlot]);

  const filteredProviders = providerData || [];

  return (
    <>
      {location.pathname !== "/search" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <Wand2 size={24} />
            </div>

            {/* Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <CalendarClock size={12} /> Smart Booking
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Booking Wizard Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              A guided booking experience will help you quickly select services,
              schedule pickups, and confirm your order step-by-step.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {t("bookService")}
              </h1>
              <span className="text-sm text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
            {/* <div className="flex flex-wrap gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < step
                      ? "bg-secondary" // ✅ completed = green
                      : i === step
                        ? "bg-primary" // 🔵 active = blue
                        : "bg-border" // ⚪ pending = grey
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-9 gap-1">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`text-xs px-2 py-0.5 rounded-full text-left justify-self-start ${
                    i === step
                      ? "bg-primary/10 text-primary font-medium"
                      : i < step
                        ? "text-secondary"
                        : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div> */}
            <div className="flex gap-2 flex-wrap pb-2">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className="flex flex-col items-start min-w-[70px] md:flex-1 flex-shrink-0"
                >
                  <div
                    className={`h-1.5 w-full rounded-full ${i < step
                        ? "bg-secondary"
                        : i === step
                          ? "bg-primary"
                          : "bg-border"
                      }`}
                  />
                  <span
                  key={s}
                  className={`mt-1.5 mb-1 md:mb-0 md:mt-2 text-xs px-2 py-0.5 rounded-full text-left justify-self-start ${
                    i === step
                      ? "bg-primary/10 text-primary font-medium"
                      : i < step
                        ? "text-secondary"
                        : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Selector Tabs */}
          <Tabs
            value="1"
            onValueChange={(val) => {
              if (val === "2") navigate("/booking/cleaning");
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

          {/* Step 0: Service Type */}
          {step === 0 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                How can we help?
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {servicesTypes.map((st: any) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setServiceType(st.id);
                      localStorage.setItem("servicetype_id", String(st.id));
                      setSelectedProvider(null);
                      setProviderId(null);
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

          {/* Step 1: Select Provider */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                Select a Provider
              </h2>
              <div className="flex flex-col md:flex-row gap-6">
                {/* ✅ LEFT SIDEBAR FILTER */}

                <div className="w-full md:w-64 bg-white p-4 rounded-xl h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Filter</h3>

                    <Button
                      type="button"
                      onClick={handleReset}
                      className="
                      inline-flex items-center justify-center
                      text-xs font-medium
                      px-5 py-1.5
                      rounded-md
                      bg-primary text-white
                      hover:bg-primary/90
                      active:scale-95
                      transition-all duration-150
                      shadow-sm
                    "
                    >
                      Reset
                    </Button>
                  </div>


                  {/* Address */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Address
                    </p>

                    <GooglePlaceAutocomplete
                      value={typeof address === "string" ? address : (address as any)?.address || ""}
                      placeholder="Enter address..."
                      onChange={(val) => {
                        setAddress(typeof val === "string" ? val : (val as any)?.address || "");
                        if (!val) setAddressCoords(null);
                      }}
                      onSelect={(place: any) => {
                        if (typeof place === "string") {
                          setAddress(place);
                          setAddressCoords(null);
                        } else if (place && typeof place === "object") {
                          setAddress(place.address || "");
                          if (place.lat && place.lng) {
                            setAddressCoords({ lat: place.lat, lng: place.lng });
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Distance */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Distance
                    </p>
                    {[1, 5, 10, 25, 50].map((d) => (
                      <label key={d} className="block text-sm mb-1">
                        <input
                          type="radio"
                          name="distance"
                          value={d}
                          checked={filterDistance == d}
                          onChange={() => setFilterDistance(d)}
                          className="mr-2"
                        />
                        {d} miles
                      </label>
                    ))}
                  </div>

                  {/* Availability */}
                  <div className="mb-4">
                    <p className="font-medium mb-2">Availability</p>
                    {slotsData.map((time) => (
                      <label key={time.id} className="block text-sm mb-1">
                        <input
                          type="radio"
                          name="timeSlot"
                          className="mr-2"
                          value={time.id}
                          checked={selectedSlot === time.id} // ✅ important
                          onChange={() => handleRadioChange(time)} // ✅ store ID
                        />
                        {time.slot_name}
                      </label>
                    ))}
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Service Type
                    </p>
                    <select
                      value={isBulk ? "bulk" : selectedServiceId || ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        if (val === "bulk") {
                          setIsBulk(true);
                          setSelectedServiceId(null);
                        } else if (val) {
                          setIsBulk(false);
                          setSelectedServiceId(Number(val));
                        } else {
                          setIsBulk(false);
                          setSelectedServiceId(null);
                        }
                      }}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm"
                    >
                      <option value="">Select Service Type</option>

                      {services?.map((service) => (
                        <option key={service?.id} value={service?.id}>
                          {service?.name}
                        </option>
                      ))}

                      <option value="bulk">Bulk</option>
                    </select>
                  </div>

                  {/* Rating */}
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Rating
                      </p>
                      {[5, 4, 3, 2, 1].map((d) => (
                        <label key={d} className="block text-sm mb-1">
                          <input
                            type="radio"
                            name="rating"
                            value={d}
                            checked={filterRating === d}
                            onChange={() => setFilterRating(d)}
                            className="mr-2"
                          />
                          {d} + stars
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ✅ RIGHT SIDE (YOUR EXISTING UI) */}
                <div className="flex-1">
                  {
                    !isLoggedIn ? (
                      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8">
                        <div className="max-w-md text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <Key className="h-6 w-6 text-muted-foreground" />
                          </div>

                          <h3 className="text-lg font-semibold text-foreground">
                            Please Login First
                          </h3>

                          <p className="mt-2 text-sm text-muted-foreground">
                            For a better booking experience, please login to view available providers.
                          </p>
                        </div>
                      </div>
                    ) :
                      filteredProviders?.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredProviders?.map((provider) => {
                            const isSelected =
                              String(providerId || selectedProviderId || selectedProvider) === String(provider.id);
                            return (
                              <button
                                key={provider.id}
                                onClick={() => {
                                  setSelectedProvider(String(provider.id));
                                  setProviderId(String(provider.id));
                                  setSelectedProviderId(String(provider.id));
                                  setSelectedOneProvider(provider);
                                }}
                                className={`rounded-xl border-2 p-4 text-left transition-all card-elevated ${
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border bg-card hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      provider.profile_photo
                                        ? `${baseUrl}${provider.profile_photo}`
                                        : provider.user?.profile_image ||
                                        "/default-avatar.png"
                                    }
                                    alt={provider.business_name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                                      {provider.business_name}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-3 text-sm">
                                      <span className="flex items-center gap-1 text-foreground">
                                        <StarRating rating={provider?.rating} />
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check
                                      className="text-primary shrink-0"
                                      size={20}
                                    />
                                  )}
                                </div>
                                <div className="mt-5 flex justify-between gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    From ${provider.min_price || "0"}
                                  </span>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/provider/${provider.user?.id || provider.id}?category=1&wizard=true`);
                                    }}
                                    className=" flex flex-wrap gap-1"
                                  >
                                    <div className="text-primary hover:underline">
                                      View Profile
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8">
                          <div className="max-w-md text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                              <Search className="h-6 w-6 text-muted-foreground" />
                            </div>

                            <h3 className="text-lg font-semibold text-foreground">
                              No Providers Available
                            </h3>

                            <p className="mt-2 text-sm text-muted-foreground">
                              No providers match your selected filters right now.
                              Try changing location, service, or availability filters.
                            </p>
                          </div>
                        </div>
                      )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Build Order */}
          {step === 2 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                Build Your Order
              </h2>

              {/* Order Mode Tabs */}
              {selectedCategoryId === 1 && (
                <div className="flex rounded-lg border border-border bg-muted p-1 mb-6 w-fit">
                  <button
                    onClick={() => handleModeSwitch("standard")}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all",
                      orderMode === "standard"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Package size={14} className="inline mr-2" />
                    Standard Items
                  </button>

                  <button
                    disabled={providerPrice?.data?.bulk_pricing?.length === 0}
                    title={
                      providerPrice?.data?.bulk_pricing?.length === 0
                        ? "Bulk price is not set"
                        : ""
                    }
                    onClick={() => handleModeSwitch("bulk")}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all",
                      orderMode === "bulk"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                      providerPrice?.data?.bulk_pricing?.length === 0 &&
                      "cursor-not-allowed opacity-60"
                    )}
                  >
                    <Weight size={14} className="inline mr-2" />
                    Bulk Order
                  </button>
                </div>
              )}

              {/* Standard Items Tab */}
              {orderMode === "standard" && (
                <div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* Show loading state */}
                      {loading.items ? (
                        <div className="text-sm text-muted-foreground">
                          Loading items...
                        </div>
                      ) : (
                        <>
                          {items.map((item: any) => (
                            <Button
                              key={item.id}
                              variant={
                                orderItems.find(
                                  (i: OrderItem) => i.itemId === item.id,
                                )
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => addItem(item)}
                            >
                              <Plus size={14} className="mr-1" /> {item.name}
                            </Button>
                          ))}
                        </>
                      )}

                      <Button
                        // disabled
                        variant="outline"
                        size="sm"
                        className="border-dashed border-primary text-primary hover:bg-primary/5"
                        onClick={() => setShowCustomModal(true)}
                      >
                        <Plus size={14} className="mr-1" /> Add Custom Item
                      </Button>
                    </div>

                    {/* Rest of your UI */}
                    {!loading.items && items.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No items available
                      </div>
                    )}
                  </div>
                  {orderItems?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOrderItems(
                            orderItems.map((i) => ({
                              ...i,
                              services: [...servicesList],
                            })),
                          );
                          setSelectAll(true);
                        }}
                      >
                        Select All Services
                      </Button> */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOrderItems(
                              orderItems.map((i: OrderItem) => ({
                                ...i,
                                services: i.isCustom
                                  ? i.services
                                  : services
                                    .filter((s: any) =>
                                      isServiceOffered(i.itemId!, s.id),
                                    )
                                    .map((s: any) => s.id),
                              })),
                            );
                            setSelectAll(true);
                          }}
                        >
                          Select All Services
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOrderItems(
                              orderItems.map((i) => ({ ...i, services: [] })),
                            );
                            setSelectAll(false);
                          }}
                        >
                          Unselect All
                        </Button>
                      </div>
                      {orderItems.map((oi: OrderItem, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                  {oi.item}
                                </h3>
                                {oi.isCustom && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs border-0 bg-amber-100 text-amber-700"
                                  >
                                    Custom
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="bg-red-500 text-white hover:bg-red-600"
                                onClick={() => removeItem(idx)}
                              >
                                Remove
                              </Button>
                            </div>
                            {/* Quantity controls */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                Qty:
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateItem(idx, {
                                    quantity: Math.max(1, oi.quantity - 1),
                                  })
                                }
                              >
                                <Minus size={14} />
                              </Button>
                              <span className="w-8 text-center font-medium text-foreground">
                                {oi.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateItem(idx, { quantity: oi.quantity + 1 })
                                }
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                            {/* Services checkboxes */}
                            <div className="flex flex-wrap gap-3">
                              {loading.services ? (
                                <div className="text-sm text-muted-foreground">
                                  Loading services...
                                </div>
                              ) : (
                                services.map((service: any) => {
                                  const isOffered = oi.isCustom
                                    ? true
                                    : isServiceOffered(oi.itemId!, service.id);
                                  const price = oi.isCustom
                                    ? null
                                    : getProviderItemPrice(
                                      oi.itemId!,
                                      service.id,
                                    );

                                  return (
                                    <label
                                      key={service.id}
                                      className={`flex items-center gap-2 text-sm cursor-pointer ${!isOffered
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                        }`}
                                    >
                                      <Checkbox
                                        checked={oi.services.includes(
                                          service.id,
                                        )}
                                        onCheckedChange={() => {
                                          if (isOffered) {
                                            toggleService(idx, service.id);
                                          }
                                        }}
                                        disabled={!isOffered}
                                      />
                                      <span className="text-foreground">
                                        {service.name}
                                      </span>
                                      {oi.isCustom ? (
                                        <span className="text-muted-foreground italic text-xs">
                                          (TBC)
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          {isOffered && price
                                            ? `($${price.toFixed(2)})`
                                            : "(Not offered)"}
                                        </span>
                                      )}
                                    </label>
                                  );
                                })
                              )}
                            </div>

                            {/* Custom item info */}
                            {oi.isCustom && (
                              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-700">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                Provider will review and confirm pricing for
                                custom items.
                              </div>
                            )}

                            {/* Notes input */}
                            <Input
                              placeholder="Add notes for this item..."
                              value={oi.notes}
                              onChange={(e) =>
                                updateItem(idx, { notes: e.target.value })
                              }
                            />
                          </CardContent>
                        </Card>
                      ))}

                      {/* Items Summary Table */}
                      {orderItems?.length > 0 && (
                        <Card>
                          <CardContent className="pt-4">
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                              Order Items
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="pb-2 pr-4 font-medium">
                                      Item
                                    </th>
                                    <th className="pb-2 pr-4 font-medium">
                                      Service
                                    </th>
                                    <th className="pb-2 pr-4 font-medium">
                                      Qty
                                    </th>
                                    <th className="pb-2 font-medium text-right">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderItems.map((oi, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-border last:border-0"
                                    >
                                      <td className="py-2 pr-4 text-muted-foreground">
                                        {oi.item}
                                      </td>
                                      <td className="py-2 pr-4 text-muted-foreground">
                                        {oi.services.length > 0 ? (
                                          oi.services
                                            .map((serviceId) =>
                                              getServiceNameStatic(serviceId),
                                            )
                                            .join(", ")
                                        ) : (
                                          <span className="italic">
                                            No services selected
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 pr-4 text-foreground">
                                        {oi.quantity}
                                      </td>
                                      <td className="py-2 text-right font-medium text-foreground">
                                        {oi.isCustom ? (
                                          <span className="text-amber-600 italic text-xs">
                                            To be confirmed
                                          </span>
                                        ) : (
                                          `$${oi.services
                                            .reduce((total, serviceId) => {
                                              const price =
                                                getProviderItemPrice(
                                                  oi.itemId,
                                                  serviceId,
                                                );
                                              return (
                                                total +
                                                (price || 0) * oi.quantity
                                              );
                                            }, 0)
                                            .toFixed(2)}`
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="w-full">
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer border-gray-300 hover:border-primary transition-colors text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Upload size={16} />
                            <span>Upload pre-pickup photos (optional)</span>
                          </div>

                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </label>

                        {imagePreviews?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {imagePreviews.map((src, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={src}
                                  alt="Preview"
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />

                                {/* 🔥 Lucide Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="
                                    absolute -top-2 -right-2
                                    bg-red-500 hover:bg-red-600
                                    text-white
                                    rounded-full
                                    w-6 h-6
                                    flex items-center justify-center
                                    shadow-md
                                    opacity-0 group-hover:opacity-100
                                    transition-all duration-200
                                  "
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Order Tab */}
              {orderMode === "bulk" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6 space-y-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Weight size={20} className="text-primary" />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Bulk Order
                        </h3>
                      </div>

                      {/* Weight Input */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Estimated Weight (lbs)
                        </label>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() =>
                              setBulkOrder({
                                ...bulkOrder,
                                weight: Math.max(1, bulkOrder.weight - 1),
                              })
                            }
                          >
                            <Minus size={16} />
                          </Button>
                          <div className="relative">
                            <Input
                              type="number"
                              min={1}
                              value={bulkOrder.weight}
                              onChange={(e) =>
                                setBulkOrder({
                                  ...bulkOrder,
                                  weight: Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  ),
                                })
                              }
                              className="w-24 text-center text-lg font-semibold"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() =>
                              setBulkOrder({
                                ...bulkOrder,
                                weight: bulkOrder.weight + 1,
                              })
                            }
                          >
                            <Plus size={16} />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            lbs
                          </span>
                        </div>
                      </div>

                      {/* Pricing Display */}
                      <div className="rounded-lg bg-accent p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Price per lb
                          </span>
                          <span className="font-medium text-foreground">
                            ${BULK_PRICE_PER_LB.toFixed(2)}/lb
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Estimated Weight
                          </span>
                          <span className="font-medium text-foreground">
                            {bulkOrder.weight} lbs
                          </span>
                        </div>
                        <hr className="border-border" />
                        <div className="flex justify-between text-base font-semibold">
                          <span className="text-foreground">
                            Estimated Total
                          </span>
                          <span className="text-primary">
                            ${(bulkOrder.weight * BULK_PRICE_PER_LB).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Info Box */}
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                        <Info
                          size={18}
                          className="text-blue-600 shrink-0 mt-0.5"
                        />
                        <p className="text-sm text-blue-700">
                          Final weight and price will be confirmed by the
                          provider after receiving the items.
                        </p>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Special Instructions (optional)
                        </label>
                        <Textarea
                          placeholder="Add special instructions for your bulk order..."
                          value={bulkOrder.notes}
                          onChange={(e) =>
                            setBulkOrder({
                              ...bulkOrder,
                              notes: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>

                      {/* Photo Upload */}
                      {/* <div className="w-full">
                        <div className="relative rounded-xl border border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />

                          {imagePreviews.length > 0 ? (
                            <div className="flex flex-wrap gap-3 justify-center">
                              {imagePreviews.map((src, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={src}
                                    className="w-20 h-20 object-cover rounded-lg border"
                                  />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // 👈 important
                                      handleRemoveImage(index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <X />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <Camera size={16} />
                              Upload photos of laundry (optional)
                            </>
                          )}
                        </div>
                      </div> */}

                      <div className="w-full">
                        <div className="rounded-xl border border-dashed border-border p-4 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors">

                          {/* 🔥 Preview */}
                          {imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-3 justify-center">
                              {imagePreviews.map((src, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={src}
                                    className="w-20 h-20 object-cover rounded-lg border"
                                  />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 🔥 Add Button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90"
                          >
                            <span className="text-lg font-bold">+</span>
                            {/* Add Image */}
                          </button>

                          {/* Hint text */}
                          <p className="text-xs text-gray-400">
                            You can upload multiple images
                          </p>
                        </div>

                        {/* Hidden input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>

                      {/* Add Bulk Order Button */}
                      {!bulkAdded ? (
                        <Button
                          className="w-full"
                          onClick={() => setBulkAdded(true)}
                        >
                          <Plus size={16} className="mr-2" /> Add Bulk Order
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-secondary bg-secondary/5 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle
                                size={20}
                                className="text-secondary"
                              />
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Bulk Order Added
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bulkOrder.weight} lbs · Est. $
                                  {(
                                    bulkOrder.weight * BULK_PRICE_PER_LB
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setBulkAdded(false)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bulk Summary Table */}
                  {bulkAdded && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Order Summary
                        </h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Type</th>
                              <th className="pb-2 pr-4 font-medium">Weight</th>
                              <th className="pb-2 font-medium text-right">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-2 pr-4 text-foreground">
                                Bulk Order
                              </td>
                              <td className="py-2 pr-4 text-foreground">
                                {bulkOrder.weight} lbs
                              </td>
                              <td className="py-2 text-right font-medium text-foreground">
                                <span className="text-amber-600 text-xs italic">
                                  Estimated{" "}
                                </span>
                                $
                                {(bulkOrder.weight * BULK_PRICE_PER_LB).toFixed(
                                  2,
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                Schedule Your Service
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Date Selection */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Select Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduleDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduleDate
                              ? format(scheduleDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduleDate}
                            onSelect={(date) => {
                              setScheduleDate(date);
                              setSelectedSlot(""); // Reset slot when date changes
                              setSlotError(""); // Reset error
                            }}
                            // disabled={(d) => d < new Date()}
                            disabled={isPastDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Slot Selection - Dynamic */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        {/* Select Time Slot */}
                        Time Window
                      </label>

                      {loadingSlots ? (
                        <div className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading available slots...
                        </div>
                      ) : timeSlots.length > 0 ? (
                        <select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {timeSlots.map((slot) => (
                            <option key={slot.slot_id} value={slot.slot_id}>
                              {getTimeSlotLabel(slot.start_time, slot.end_time)}
                            </option>
                          ))}
                        </select>
                      ) : scheduleDate ? (
                        <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          ⚠️ No time slots available for{" "}
                          {format(scheduleDate, "PPP")}. Please select another
                          date.
                        </div>
                      ) : (
                        <div className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                          Please select a date first
                        </div>
                      )}
                    </div>

                    {/* Pickup Location (if applicable) */}
                    {serviceType && Number(serviceType) !== 3 && (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">
                            {Number(serviceType) == 1 ? "Meeting" : "Pickup"} Location
                          </label>
                          <GooglePlaceAutocomplete
                            value={pickupLocation}
                            placeholder="Enter address"
                            onChange={(val) => {
                              setPickupLocation(val);
                            }}
                            onSelect={(place) => {
                              setPickupLocation(place.address);
                              setPickupLat(place.lat);
                              setPickupLng(place.lng);
                            }}
                          />
                        </div>

                        {Number(serviceType) !== 1 && (
                          <>
                            <div className="mt-3">
                              <label className="mb-1 block text-sm font-medium text-foreground">
                                Delivery Location
                              </label>
                              <GooglePlaceAutocomplete
                                value={deliveryLocation}
                                placeholder="Enter address"
                                onChange={(val) => {
                                  setDeliveryLocation(val);
                                }}
                                onSelect={(place) => {
                                  setDeliveryLocation(place.address);
                                  setDeliveryLat(place.lat);
                                  setDeliveryLng(place.lng);
                                }}
                              />
                            </div>

                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => setDeliveryLocation(pickupLocation)}
                                className="text-xs px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 transition"
                              >
                                Same as Pickup
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Dropoff Instructions (if applicable) */}
                    {serviceType === 3 && (
                      <div className="rounded-lg bg-accent p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">
                          Drop-Off Instructions
                        </p>
                        <p>
                          Provider's approximate location will be shared after
                          acceptance. Exact address details become visible once
                          the booking is confirmed.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Info Card */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-3">
                    Service Info
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {serviceType === 1
                      ? "We will Meet you at the specified location."
                      : serviceType === 2
                        ? "The provider will come to your home during the selected time window."
                        : "You will drop off items at the provider's location."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available hours: 6:00 AM – 11:00 PM
                  </p>

                  {/* Show selected slot info */}
                  {/* {selectedSlot && timeSlots.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Selected Slot:
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {
                        timeSlots.find(
                          (slot) => slot.slot_id === parseInt(selectedSlot),
                        )?.start_time
                      }{" "}
                      -{" "}
                      {
                        timeSlots.find(
                          (slot) => slot.slot_id === parseInt(selectedSlot),
                        )?.end_time
                      }
                    </p>
                  </div>
                )} */}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                Review & Request Booking
              </h2>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                        Provider
                      </h3>
                      {selectedOneProvider && (
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              selectedOneProvider.profile_photo
                                ? `${baseUrl}${selectedOneProvider.profile_photo}`
                                : selectedOneProvider?.profile_image ||
                                "/default-avatar.png"
                            }
                            alt={selectedOneProvider.business_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                              {selectedOneProvider.business_name}
                            </h3>
                            <div className="mt-1 flex items-center gap-3 text-sm">
                              <span className="flex items-center gap-1 text-foreground">
                                <Star
                                  size={14}
                                  className="text-yellow-500 fill-yellow-500"
                                />{" "}
                                {selectedOneProvider.rating || "New"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Review: Standard Items */}
                  {orderMode === "standard" && (
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                          Items
                        </h3>
                        <div className="space-y-2">
                          {orderItems.map((oi, i) => {
                            return (
                              <div
                                key={i}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-foreground">
                                  {oi.item} × {oi.quantity} (
                                  {oi.services.length > 0 ? (
                                    oi.services
                                      .map((serviceId) =>
                                        getServiceNameStatic(serviceId),
                                      )
                                      .join(", ")
                                  ) : (
                                    <span className="italic">
                                      No services selected
                                    </span>
                                  )}
                                  )
                                  {oi.isCustom && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-2 text-xs border-0 bg-amber-100 text-amber-700"
                                    >
                                      Custom
                                    </Badge>
                                  )}
                                </span>

                                <span className="font-medium text-foreground">
                                  {oi.isCustom ? (
                                    <span className="text-amber-600 italic text-xs">
                                      To be confirmed
                                    </span>
                                  ) : (
                                    `$${oi.services
                                      .reduce((total, serviceId) => {
                                        const price = getProviderItemPrice(
                                          oi.itemId,
                                          serviceId,
                                        );
                                        return (
                                          total + (price || 0) * oi.quantity
                                        );
                                      }, 0)
                                      .toFixed(2)}`
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Review: Bulk Order */}
                  {orderMode === "bulk" && bulkAdded && (
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                          Bulk Order
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Estimated Weight
                            </span>
                            <span className="text-foreground font-medium">
                              {bulkOrder.weight} lbs
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Price per lb
                            </span>
                            <span className="text-foreground font-medium">
                              ${BULK_PRICE_PER_LB.toFixed(2)}/lb
                            </span>
                          </div>
                          <hr className="border-border" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-foreground">
                              Estimated Total
                            </span>
                            <span className="text-primary">
                              $
                              {(bulkOrder.weight * BULK_PRICE_PER_LB).toFixed(
                                2,
                              )}
                            </span>
                          </div>
                          {bulkOrder.notes && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Notes:
                              </span>{" "}
                              {bulkOrder.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                        Schedule
                      </h3>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">
                            Service Type:
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {
                              serviceTypes.find(
                                (s: any) => s.id === serviceType,
                              )?.label ||
                              (localStorage.getItem("servicetype_id") === "1"
                                ? "In-Home/Office"
                                : localStorage.getItem("servicetype_id") === "2"
                                  ? "Pick-up Service"
                                  : localStorage.getItem("servicetype_id") === "3"
                                    ? "Drop-Off Service"
                                    : "")
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          <span className="font-medium text-foreground">
                            {scheduleDate ? format(scheduleDate, "PPP") : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>{" "}
                          <span className="font-medium text-foreground">
                            {timeWindow}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Warning */}
                  {orderMode === "bulk" && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                      <AlertTriangle
                        size={18}
                        className="text-amber-600 shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-amber-700">
                        Final price may change after provider confirms actual
                        weight or custom items.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-5 sticky top-24 h-fit">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-4">
                    {t("priceSummary")}
                  </h3>

                  {/* ✅ CUSTOM CASE */}
                  {hasCustomItems ? (
                    <div className="flex flex-col items-center justify-center h-24 rounded-xl bg-orange-50 border border-orange-200 text-center">
                      <p className="text-sm font-medium text-orange-500 italic">
                        To be confirmed
                      </p>

                      <p className="text-xs mt-1 italic text-orange-400">
                        Final price will be shared after review
                      </p>
                    </div>
                  ) : (
                    /* ✅ BULK + STANDARD */
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {orderMode === "bulk"
                            ? "Estimated Subtotal"
                            : t("subtotal")}
                        </span>
                        <span className="font-medium text-foreground">
                          ${itemsTotal.toFixed(2)}
                        </span>
                      </div>

                      {hasCustomItems && orderMode === "standard" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-xs italic">
                            + Custom items (TBC)
                          </span>
                        </div>
                      )}

                      {deliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {serviceType === 2 ? t("deliveryFee") : "Service Fee"}
                          </span>
                          <span className="font-medium text-foreground">
                            ${deliveryFee.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <hr className="border-border" />

                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-foreground">
                          {orderMode === "bulk" ? "Est. Total" : t("total")}
                        </span>
                        <span className="text-foreground">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pending Acceptance */}
          {step === 5 && pendingPhase === "waiting" && (
            <div className="max-w-lg mx-auto text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
                <Clock size={32} />
              </div>
              <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">
                Pending Acceptance
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your booking request has been sent to {provider?.name}.
              </p>
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    The provider has{" "}
                    <span className="font-semibold text-foreground">
                      30 Minutes
                    </span>{" "}
                    to accept or reject your request.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
                    <Clock size={16} /> Waiting for response...
                  </div>
                </CardContent>
              </Card>
              <p className="mt-4 text-xs text-muted-foreground">
                You will receive a notification once the provider responds.
              </p>
            </div>
          )}

          {/* Step 5: Price Review (after provider responds) */}
          {step === 5 && pendingPhase === "priceReview" && (
            <div className="max-w-lg mx-auto py-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check size={32} />
                </div>
                <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
                  Provider Accepted & Updated Pricing
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {provider?.name} has accepted your order and confirmed the
                  final pricing.
                </p>
              </div>

              {/* Price Comparison Card */}
              {orderMode === "bulk" && (
                <Card className="mb-4 border-primary/20">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                      <Weight size={16} className="text-primary" /> Bulk Order —
                      Updated Weight & Price
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-muted-foreground text-xs">
                          Your Estimate
                        </p>
                        <p className="font-semibold text-foreground">
                          {bulkOrder.weight} lbs
                        </p>
                        <p className="text-muted-foreground">
                          ${originalBulkEstimate.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                        <p className="text-primary text-xs font-medium">
                          Provider Confirmed
                        </p>
                        <p className="font-semibold text-foreground">
                          {providerConfirmedWeight} lbs
                        </p>
                        <p className="text-foreground font-medium">
                          ${providerBulkTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <span className="text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Price Difference
                      </span>
                      <span className="font-semibold text-amber-900">
                        +$
                        {(providerBulkTotal - originalBulkEstimate).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {orderMode === "standard" && (
                <Card className="mb-4 border-primary/20">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                      <Package size={16} className="text-primary" /> Updated
                      Order Pricing
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 text-muted-foreground font-medium">
                              Item
                            </th>
                            <th className="text-left p-2 text-muted-foreground font-medium">
                              Service
                            </th>
                            <th className="text-center p-2 text-muted-foreground font-medium">
                              Qty
                            </th>
                            <th className="text-right p-2 text-muted-foreground font-medium">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((oi: OrderItem, i: number) => (
                            <tr
                              key={i}
                              className="border-b border-border last:border-0"
                            >
                              <td className="py-2 pr-4 text-foreground">
                                {oi.item}
                                {oi.isCustom && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs border-0 bg-amber-100 text-amber-700"
                                  >
                                    Custom
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {oi.services
                                  .map((serviceId) => {
                                    const service = services.find(
                                      (s: any) => s.id === serviceId,
                                    );
                                    return service?.name;
                                  })
                                  .join(", ")}
                              </td>
                              <td className="py-2 pr-4 text-foreground">
                                {oi.quantity}
                              </td>
                              <td className="py-2 text-right font-medium text-foreground">
                                {oi.isCustom ? (
                                  <span className="text-amber-600 italic text-xs">
                                    To be confirmed
                                  </span>
                                ) : (
                                  `$${oi.services
                                    .reduce((total, serviceId) => {
                                      const price = getProviderItemPrice(
                                        oi.itemId!,
                                        serviceId,
                                      );
                                      return total + (price || 0) * oi.quantity;
                                    }, 0)
                                    .toFixed(2)}`
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {hasCustomItems && (
                      <div className="flex items-start gap-2 text-sm bg-green-50 rounded-lg p-3 border border-green-200">
                        <Check
                          size={14}
                          className="text-green-600 mt-0.5 shrink-0"
                        />
                        <span className="text-green-800">
                          Provider has confirmed pricing for custom items.
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Total Summary */}
              <Card className="mb-4">
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Total</span>
                    <span className="font-medium text-foreground">
                      $
                      {orderMode === "bulk"
                        ? providerBulkTotal.toFixed(2)
                        : (
                          itemsTotal +
                          (hasCustomItems
                            ? orderItems
                              .filter((i) => i.isCustom)
                              .reduce((s, i) => s + i.quantity * 8.5, 0)
                            : 0)
                        ).toFixed(2)}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {serviceType === 2 ? "Delivery Fee" : "Service Fee"}
                      </span>
                      <span className="font-medium text-foreground">
                        ${deliveryFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Final Total</span>
                    <span className="text-foreground">
                      $
                      {(orderMode === "bulk"
                        ? providerBulkTotal + deliveryFee
                        : total +
                        (hasCustomItems
                          ? orderItems
                            .filter((i) => i.isCustom)
                            .reduce((s, i) => s + i.quantity * 8.5, 0)
                          : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <div className="flex items-start gap-2 text-sm bg-blue-50 rounded-lg p-3 border border-blue-200 mb-6">
                <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <span className="text-blue-800">
                  By accepting, you agree to the provider's confirmed pricing.
                  You can reject and choose a different provider if needed.
                </span>
              </div>

              {/* Accept / Reject Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" onClick={() => setStep(6)}>
                  <Check size={16} className="mr-1" /> Accept & Proceed to
                  Payment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setPendingPhase("waiting");
                    setStep(1); // go back to provider selection
                  }}
                >
                  <X size={16} className="mr-1" /> Reject & Choose Another
                  Provider
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Payment */}
          {step === 6 && (
            <div className="max-w-lg mx-auto">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Payment
              </h2>
              <Card className="mb-4">
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Total</span>
                    <span className="font-medium text-foreground">
                      ${itemsTotal.toFixed(2)}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {serviceType === 2 ? "Delivery Fee" : "Service Fee"}
                      </span>
                      <span className="font-medium text-foreground">
                        ${deliveryFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={20} className="text-primary" />
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Card Details
                    </h3>
                  </div>
                  <Input placeholder="1234 5678 9012 3456" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="MM/YY" />
                    <Input placeholder="CVV" />
                  </div>
                  <Input placeholder="Name on card" />
                  <p className="text-xs text-muted-foreground">
                    Your order becomes active after payment.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 7: Track Order */}
          {step === 7 && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Track Your Order
              </h2>
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    {trackStatuses.map((status, i) => (
                      <div key={status} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${i <= trackIndex
                                ? "border-secondary bg-secondary text-secondary-foreground"
                                : "border-border bg-card text-muted-foreground"
                              }`}
                          >
                            {i + 1}
                          </div>
                          <span
                            className={`mt-2 text-xs font-medium text-center ${i <= trackIndex ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {status}
                          </span>
                          {i <= trackIndex && (
                            <span className="mt-1 text-xs text-muted-foreground">
                              10:{15 + i * 30} AM
                            </span>
                          )}
                        </div>
                        {i < trackStatuses.length - 1 && (
                          <div
                            className={`mx-2 h-0.5 flex-1 rounded ${i < trackIndex ? "bg-secondary" : "bg-border"}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                {trackStatuses.map((status, i) => (
                  <Card
                    key={status}
                    className={i <= trackIndex ? "" : "opacity-50"}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {status}
                        </h3>
                        <Badge
                          className={`border-0 ${i <= trackIndex ? "bg-secondary/10 text-secondary" : "bg-accent text-muted-foreground"}`}
                        >
                          {i <= trackIndex ? "Done" : "Pending"}
                        </Badge>
                      </div>
                      <div className="mt-3 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                        <Camera size={16} className="mx-auto mb-1" /> Photo
                        upload area
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Completion */}
          {step === 8 && (
            <div className="max-w-lg mx-auto text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <CheckCircle size={32} />
              </div>
              <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">
                Order Complete!
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your laundry has been delivered. Please confirm and rate your
                experience.
              </p>
              <div className="mt-8 space-y-3">
                <Button className="w-full" onClick={() => navigate("/rating")}>
                  Rate Provider
                </Button>
                <Button variant="outline" className="w-full">
                  Confirm Delivery
                </Button>
                <Button variant="ghost" className="w-full text-secondary">
                  Leave a Tip
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                If no action is taken, payment will auto-release after 4 hours.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
              disabled={step === 5}
            >
              <ChevronLeft size={16} className="mr-1" />{" "}
              {step === 0 ? t("cancel") : "Back"}
            </Button>
            {step < 4 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button onClick={() => createBooking()}>
                Request Booking <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 5 && pendingPhase === "waiting" && (
              <Button
                onClick={() => {
                  setPendingPhase("priceReview");
                  navigate("/dashboard", {
                    state: { phase: "priceReview" },
                  });
                }}
              >
                Go to Dashboard <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 6 && (
              <Button onClick={() => setStep(7)}>
                {t("payNow")} <CreditCard size={16} className="ml-1" />
              </Button>
            )}
            {step === 7 && (
              <Button onClick={() => setStep(8)}>
                Complete Order <CheckCircle size={16} className="ml-1" />
              </Button>
            )}
            {step === 8 && (
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                {t("backToOrders")}
              </Button>
            )}
          </div>

          {/* Custom Item Modal */}
          <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Custom Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Item Name
                  </label>
                  <Input
                    placeholder="e.g. Curtains, Rug, Wedding Dress..."
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Service Type
                  </label>
                  <select
                    value={customItemService}
                    onChange={(e) =>
                      setCustomItemService(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                      </option>
                    ))}
                  </select>
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setCustomItemQty(Math.max(1, customItemQty - 1))
                      }
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center font-medium text-foreground">
                      {customItemQty}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCustomItemQty(customItemQty + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-700">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  Provider will review and confirm pricing for custom items.
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addCustomItem}
                  disabled={!customItemName.trim()}
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Switch Mode Confirmation */}
          <Dialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Switch Order Type?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground py-2">
                Switching will remove your current items. Are you sure you want
                to continue?
              </p>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSwitchConfirm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmModeSwitch}>Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default SearchProviders;
