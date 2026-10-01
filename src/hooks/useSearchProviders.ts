import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { providerApi } from "@/services/provider";
import { catalogApi } from "@/services/catalog";
import type { Category } from "@/types/api/catalog";
import { mapProviderToGeneric, type GenericProvider } from "@/components/shared/cards";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getStoredLocation,
  setStoredLocation,
  detectAndStoreUserLocation,
} from "@/utils/userLocation";

export function useSearchProviders() {
  const [searchParams] = useSearchParams();
  const storedLoc = getStoredLocation();

  // Filter States
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    storedLoc?.lat != null && storedLoc?.lng != null
      ? { lat: storedLoc.lat, lng: storedLoc.lng }
      : null
  );
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("category_id") || "all"
  );
  const [radius, setRadius] = useState<number[]>([
    Number(searchParams.get("miles")) || 30,
  ]);
  const [minRating, setMinRating] = useState<string>(
    searchParams.get("rating_min") || "0"
  );
  const [priceMax, setPriceMax] = useState<number[]>([
    Number(searchParams.get("price_max")) || 2000,
  ]);
  const [minYears, setMinYears] = useState<string>(
    searchParams.get("min_years") || "0"
  );
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(
    searchParams.get("verified") === "true"
  );
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [backgroundChecked, setBackgroundChecked] = useState<boolean>(true);

  // Debounced inputs
  const debouncedQuery = useDebounce(query, 350);
  const debouncedRadius = useDebounce(radius, 350);
  const debouncedPriceMax = useDebounce(priceMax, 350);
  const debouncedMinYears = useDebounce(minYears, 350);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<GenericProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeRequestId = useRef(0);
  const lastParamsKey = useRef<string>("");

  const locationRef = useRef(location);
  locationRef.current = location;

  const selectedCoordsRef = useRef(selectedCoords);
  selectedCoordsRef.current = selectedCoords;

  const userCoordsRef = useRef(userCoords);
  userCoordsRef.current = userCoords;

  // Auto-detect browser location on mount
  useEffect(() => {
    if (!userCoords) {
      detectAndStoreUserLocation().then((loc) => {
        if (loc && loc.lat != null && loc.lng != null) {
          const coords = { lat: loc.lat, lng: loc.lng };
          setUserCoords(coords);
          userCoordsRef.current = coords;
          if (!locationRef.current && !selectedCoordsRef.current) {
            fetchProviders(undefined, undefined, coords);
          }
        }
      });
    }
  }, []);

  // Load Categories
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await catalogApi.getTree();
        const list = (res as any)?.data || res || [];
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load categories for search", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Providers Search from Real API
  const fetchProviders = useCallback(
    async (
      customQuery?: string,
      customLocation?: string,
      customCoords?: { lat: number; lng: number } | null,
      force: boolean = false
    ) => {
      const q = (customQuery !== undefined ? customQuery : debouncedQuery).trim();
      const loc = (customLocation !== undefined ? customLocation : locationRef.current).trim();
      const rad = debouncedRadius[0];
      const pMax = debouncedPriceMax[0];
      const yMin = Number(debouncedMinYears);

      const params: Record<string, any> = {
        page: 1,
        limit: 50,
      };

      if (q) params.query = q;

      const activeCoords =
        customCoords !== undefined
          ? customCoords
          : selectedCoordsRef.current || (loc ? null : userCoordsRef.current);

      if (activeCoords && activeCoords.lat != null && activeCoords.lng != null) {
        params.lat = activeCoords.lat;
        params.lng = activeCoords.lng;
        if (rad) params.miles = rad;
        if (loc) params.city = loc;
      } else if (loc) {
        params.city = loc;
        if (rad) params.miles = rad;
      }
      if (categoryId !== "all") {
        if (categoryId.startsWith("st_")) {
          params.service_type_id = categoryId.replace("st_", "");
        } else {
          params.category_id = categoryId;
        }
      }
      if (rad && !params.miles) params.miles = rad;
      if (Number(minRating) > 0) params.rating_min = Number(minRating);
      if (pMax < 5000) params.price_max = pMax;
      if (yMin > 0) params.experience_min = yMin;
      if (availableNow) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        params.availability_day = days[new Date().getDay()];
      }
      if (verifiedOnly) params.verified = "verified";

      const currentKey = JSON.stringify(params);
      if (!force && currentKey === lastParamsKey.current) {
        return;
      }
      lastParamsKey.current = currentKey;

      const requestId = ++activeRequestId.current;
      setLoading(true);
      try {
        const res = await providerApi.search(params);
        if (requestId !== activeRequestId.current) return;

        const rawData = (res as any)?.data || res || [];
        const list = Array.isArray(rawData) ? rawData : rawData.data || [];

        const mapped: GenericProvider[] = list.map(mapProviderToGeneric);
        setProviders(mapped);
      } catch (err) {
        if (requestId !== activeRequestId.current) return;
        lastParamsKey.current = "";
        console.error("Provider search failed", err);
        toast.error("Failed to fetch search results.");
      } finally {
        if (requestId === activeRequestId.current) {
          setLoading(false);
        }
      }
    },
    [
      debouncedQuery,
      debouncedRadius,
      debouncedPriceMax,
      debouncedMinYears,
      categoryId,
      minRating,
      availableNow,
      verifiedOnly,
    ]
  );

  const handleResetFilters = () => {
    setQuery("");
    setLocation("");
    setSelectedCoords(null);
    locationRef.current = "";
    selectedCoordsRef.current = null;
    setCategoryId("all");
    setRadius([30]);
    setMinRating("0");
    setPriceMax([2000]);
    setMinYears("0");
    setVerifiedOnly(false);
    setAvailableNow(false);
    setBackgroundChecked(true);
    lastParamsKey.current = "";
    fetchProviders("", "", null, true);
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Detecting your location...", { id: "geo" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords = { lat, lng };
          setUserCoords(coords);
          userCoordsRef.current = coords;
          setSelectedCoords(null);
          selectedCoordsRef.current = null;
          setLocation("");
          locationRef.current = "";
          setStoredLocation({ lat, lng, city: "" });
          toast.success("Location updated to your position!", { id: "geo" });
          fetchProviders(query, "", coords, true);
        },
        () => {
          toast.error("Could not fetch location. Please enter your city or ZIP.", { id: "geo" });
        }
      );
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    userCoords,
    selectedCoords,
    setSelectedCoords,
    query,
    setQuery,
    location,
    setLocation,
    categoryId,
    setCategoryId,
    radius,
    setRadius,
    minRating,
    setMinRating,
    priceMax,
    setPriceMax,
    minYears,
    setMinYears,
    verifiedOnly,
    setVerifiedOnly,
    availableNow,
    setAvailableNow,
    backgroundChecked,
    setBackgroundChecked,
    categories,
    providers,
    loading,
    handleResetFilters,
    handleUseMyLocation,
    fetchProviders,
  };
}
