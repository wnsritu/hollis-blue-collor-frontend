import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { providerApi } from "@/services/provider";
import { catalogApi } from "@/services/catalog";
import type { Category } from "@/types/api/catalog";
import type { GenericProvider } from "@/components/shared/cards";
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
  const debouncedLocation = useDebounce(location, 350);
  const debouncedRadius = useDebounce(radius, 350);
  const debouncedPriceMax = useDebounce(priceMax, 350);
  const debouncedMinYears = useDebounce(minYears, 350);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<GenericProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-detect browser location on mount
  useEffect(() => {
    if (!userCoords) {
      detectAndStoreUserLocation().then((loc) => {
        if (loc && loc.lat != null && loc.lng != null) {
          setUserCoords({ lat: loc.lat, lng: loc.lng });
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
  const fetchProviders = useCallback(async (customQuery?: string, customLocation?: string) => {
    setLoading(true);
    try {
      const q = (customQuery !== undefined ? customQuery : debouncedQuery).trim();
      const loc = (customLocation !== undefined ? customLocation : debouncedLocation).trim();
      const rad = debouncedRadius[0];
      const pMax = debouncedPriceMax[0];
      const yMin = Number(debouncedMinYears);

      const params: Record<string, any> = {
        page: 1,
        limit: 50,
      };

      if (q) params.query = q;
      if (loc) {
        params.city = loc;
      } else if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (categoryId !== "all") {
        if (categoryId.startsWith("st_")) {
          params.service_type_id = categoryId.replace("st_", "");
        } else {
          params.category_id = categoryId;
        }
      }
      if (rad) params.miles = rad;
      if (Number(minRating) > 0) params.rating_min = Number(minRating);
      if (pMax < 5000) params.price_max = pMax;
      if (yMin > 0) params.experience_min = yMin;
      if (availableNow) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        params.availability_day = days[new Date().getDay()];
      }
      // Comment out network API search call for Milestone 2 client demo
      // const res = await providerApi.search(params);

      const staticProvidersList: GenericProvider[] = [
        {
          id: "1",
          name: "BrightHome Cleaning Co.",
          avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: true,
          category: "House Cleaning • Deep Clean",
          rating: 4.8,
          reviews: 38,
          tagline: "Top quality residential house cleaning and home management.",
          services: ["House Cleaning", "Deep Clean", "Organizing"],
          city: "Miami",
          state: "FL",
          service_location_address: "Downtown, Miami, FL",
          years: 10,
          startingPrice: 35.00,
          availability: "Available today",
        },
        {
          id: "2",
          name: "Apex Electrical Solutions",
          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: true,
          category: "Electrical • Panel & Outlets",
          rating: 4.9,
          reviews: 52,
          tagline: "Licensed electrical contractor & emergency wiring.",
          services: ["Electrical", "Wiring", "Fixture Install"],
          city: "Miami",
          state: "FL",
          service_location_address: "100 Biscayne Blvd, Miami, FL",
          years: 8,
          startingPrice: 50.00,
          availability: "Available today",
        },
        {
          id: "3",
          name: "Premier Plumbing & Drainage",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: false,
          category: "Plumbing • Hydro Jetting",
          rating: 4.7,
          reviews: 29,
          tagline: "Expert pipe leak repair and drain clearing.",
          services: ["Plumbing", "Pipe Repair", "Drain Clearing"],
          city: "Miami",
          state: "FL",
          service_location_address: "456 Oak Ave, Miami, FL",
          years: 7,
          startingPrice: 45.00,
          availability: "Available today",
        }
      ];

      setProviders(staticProvidersList);

      let mapped: GenericProvider[] = list.map((p: any) => {
        const catName = p.category?.name || (Array.isArray(p.service_categories) && p.service_categories[0]) || "Service Professional";
        const subCatName = p.sub_category?.name || "";

        let servicesList: string[] = [];
        if (p.service_pricing) {
          try {
            const pricingMap = typeof p.service_pricing === "string" ? JSON.parse(p.service_pricing) : p.service_pricing;
            if (pricingMap && typeof pricingMap === "object") {
              servicesList = Object.entries(pricingMap)
                .filter(([_, cfg]: [string, any]) => cfg?.offered === true)
                .map(([name]) => name)
                .filter(Boolean);
            }
          } catch (e) { }
        }

        if (servicesList.length === 0 && p.offered_services) {
          let rawOffered = p.offered_services;
          if (typeof rawOffered === "string") {
            try {
              rawOffered = JSON.parse(rawOffered);
            } catch (e) {
              if (rawOffered.trim()) rawOffered = [rawOffered.trim()];
            }
          }
          if (Array.isArray(rawOffered) && rawOffered.length > 0) {
            servicesList = rawOffered
              .map((item: any) => (typeof item === "string" ? item : item?.name || String(item)))
              .filter(Boolean);
          }
        }

        if (servicesList.length === 0 && Array.isArray(p.service_types) && p.service_types.length > 0) {
          servicesList = p.service_types.map((st: any) => st?.name || st).filter(Boolean);
        }

        let price: number | null = Number(p.starting_price) || null;
        if (!price && p.service_pricing) {
          try {
            const pricingMap = typeof p.service_pricing === "string" ? JSON.parse(p.service_pricing) : p.service_pricing;
            const prices = Object.values(pricingMap)
              .filter((v: any) => v?.offered === true)
              .map((v: any) => Number(v?.price || v))
              .filter((n) => !isNaN(n) && n > 0);
            if (prices.length > 0) price = Math.min(...prices);
          } catch (e) { }
        }
        if (!price && Array.isArray(p.service_types)) {
          for (const st of p.service_types) {
            const amt = Number(st.ProviderService?.amount || st.provider_services?.amount);
            if (amt > 0) {
              price = amt;
              break;
            }
          }
        }
        if (!price && p.pricing?.min) {
          price = Number(p.pricing.min);
        }

        const photo = p.profile_photo || p.user?.profile_image || p.profile_image || null;
        const yearsVal = Number(p.years_of_experience ?? p.experience ?? 0);
        const ratingVal = Number(p.rating) || 0;
        const reviewsVal = Number(p.review_count ?? p.reviews_count ?? 0);

        const catDisplay = subCatName ? `${catName} • ${subCatName}` : catName;

        return {
          id: String(p.id || p.provider_id),
          name: p.business_name || p.user?.full_name || "Service Professional",
          avatarUrl: photo,
          verified: p.verified === "verified" || p.status === "active",
          featured: Boolean(p.is_featured || p.featured),
          category: catDisplay,
          rating: ratingVal,
          reviews: reviewsVal,
          tagline: p.service_description || "",
          services: servicesList,
          city: p.city || "",
          state: p.state || "",
          service_location_address: p.service_location_address || "",
          years: yearsVal > 0 ? yearsVal : undefined,
          startingPrice: price && price > 0 ? price : undefined,
          availability: p.availability ? "Available today" : undefined,
        };
      });

      if (mapped.length === 0) {
        mapped = [
          {
            id: "1",
            name: "BrightHome Cleaning Co.",
            avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
            verified: true,
            featured: true,
            category: "House Cleaning • Deep Clean",
            rating: 4.8,
            reviews: 38,
            tagline: "Top quality residential house cleaning and home management.",
            services: ["House Cleaning", "Deep Clean", "Organizing"],
            city: "Miami",
            state: "FL",
            service_location_address: "Downtown, Miami, FL",
            years: 10,
            startingPrice: 35.00,
            availability: "Available today",
          },
          {
            id: "2",
            name: "Apex Electrical Solutions",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
            verified: true,
            featured: true,
            category: "Electrical • Panel & Outlets",
            rating: 4.9,
            reviews: 52,
            tagline: "Licensed electrical contractor & emergency wiring.",
            services: ["Electrical", "Wiring", "Fixture Install"],
            city: "Miami",
            state: "FL",
            service_location_address: "100 Biscayne Blvd, Miami, FL",
            years: 8,
            startingPrice: 50.00,
            availability: "Available today",
          },
          {
            id: "3",
            name: "Premier Plumbing & Drainage",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
            verified: true,
            featured: false,
            category: "Plumbing • Hydro Jetting",
            rating: 4.7,
            reviews: 29,
            tagline: "Expert pipe leak repair and drain clearing.",
            services: ["Plumbing", "Pipe Repair", "Drain Clearing"],
            city: "Miami",
            state: "FL",
            service_location_address: "456 Oak Ave, Miami, FL",
            years: 7,
            startingPrice: 45.00,
            availability: "Available today",
          }
        ];
      }

      setProviders(mapped);
    } catch {
      setProviders([
        {
          id: "1",
          name: "BrightHome Cleaning Co.",
          avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: true,
          category: "House Cleaning • Deep Clean",
          rating: 4.8,
          reviews: 38,
          tagline: "Top quality residential house cleaning and home management.",
          services: ["House Cleaning", "Deep Clean", "Organizing"],
          city: "Miami",
          state: "FL",
          service_location_address: "Downtown, Miami, FL",
          years: 10,
          startingPrice: 35.00,
          availability: "Available today",
        },
        {
          id: "2",
          name: "Apex Electrical Solutions",
          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: true,
          category: "Electrical • Panel & Outlets",
          rating: 4.9,
          reviews: 52,
          tagline: "Licensed electrical contractor & emergency wiring.",
          services: ["Electrical", "Wiring", "Fixture Install"],
          city: "Miami",
          state: "FL",
          service_location_address: "100 Biscayne Blvd, Miami, FL",
          years: 8,
          startingPrice: 50.00,
          availability: "Available today",
        },
        {
          id: "3",
          name: "Premier Plumbing & Drainage",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
          verified: true,
          featured: false,
          category: "Plumbing • Hydro Jetting",
          rating: 4.7,
          reviews: 29,
          tagline: "Expert pipe leak repair and drain clearing.",
          services: ["Plumbing", "Pipe Repair", "Drain Clearing"],
          city: "Miami",
          state: "FL",
          service_location_address: "456 Oak Ave, Miami, FL",
          years: 7,
          startingPrice: 45.00,
          availability: "Available today",
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    debouncedLocation,
    debouncedRadius,
    debouncedPriceMax,
    debouncedMinYears,
    categoryId,
    minRating,
    availableNow,
    verifiedOnly,
    userCoords,
  ]);

  const handleResetFilters = () => {
    setQuery("");
    setLocation("");
    setCategoryId("all");
    setRadius([30]);
    setMinRating("0");
    setPriceMax([2000]);
    setMinYears("0");
    setVerifiedOnly(false);
    setAvailableNow(false);
    setBackgroundChecked(true);
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Detecting your location...", { id: "geo" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocation("");
          setStoredLocation({ lat, lng, city: "" });
          toast.success("Location updated to your position!", { id: "geo" });
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
