import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Loader2,
  FileQuestion,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProviderCard, usd, type GenericProvider } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/primitives";
import { providerApi } from "@/api/modules/provider.api";
import { catalogApi } from "@/api/modules/catalog.api";
import type { Category } from "@/types/api/catalog";
import toast from "react-hot-toast";

export const SearchProviders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
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
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "recommended");

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<GenericProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: 1,
        limit: 50,
      };

      if (query.trim()) params.query = query.trim();
      if (location.trim()) params.city = location.trim();
      if (categoryId !== "all") {
        if (categoryId.startsWith("st_")) {
          params.service_type_id = categoryId.replace("st_", "");
        } else {
          params.category_id = categoryId;
        }
      }
      if (radius[0]) params.miles = radius[0];
      if (Number(minRating) > 0) params.rating_min = Number(minRating);
      if (priceMax[0] < 2000) params.price_max = priceMax[0];
      if (Number(minYears) > 0) params.experience_min = Number(minYears);
      if (availableNow) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        params.availability_day = days[new Date().getDay()];
      }
      if (verifiedOnly) params.verified = "verified";
      if (sort) params.sort = sort;

      const res = await providerApi.search(params);
      const rawData = (res as any)?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : rawData.data || [];

      // Map backend Provider models to GenericProvider card shape strictly from real data
      const mapped: GenericProvider[] = list.map((p: any) => {
        const catName = p.category?.name || (Array.isArray(p.service_categories) && p.service_categories[0]) || "Home Services";
        const subCatName = p.sub_category?.name || "";

        // Parse custom services strictly from provider data (no static/dummy fallbacks)
        let servicesList: string[] = [];
        if (p.service_pricing) {
          try {
            const pricingMap = typeof p.service_pricing === "string" ? JSON.parse(p.service_pricing) : p.service_pricing;
            if (pricingMap && typeof pricingMap === "object") {
              servicesList = Object.keys(pricingMap).filter(Boolean);
            }
          } catch (e) {}
        }

        if (servicesList.length === 0) {
          const rawOffered = p.offered_services || p.selected_services || p.services;
          if (Array.isArray(rawOffered) && rawOffered.length > 0) {
            servicesList = rawOffered.map((item: any) => (typeof item === "string" ? item : item?.name || String(item))).filter(Boolean);
          } else if (typeof rawOffered === "string") {
            try {
              const parsed = JSON.parse(rawOffered);
              if (Array.isArray(parsed)) servicesList = parsed.filter(Boolean);
            } catch (e) {
              if (rawOffered.trim()) servicesList = [rawOffered.trim()];
            }
          }
        }

        if (servicesList.length === 0 && Array.isArray(p.service_types) && p.service_types.length > 0) {
          servicesList = p.service_types.map((st: any) => st?.name || st).filter(Boolean);
        }

        if (servicesList.length === 0 && p.category?.service_types && Array.isArray(p.category.service_types) && p.category.service_types.length > 0) {
          servicesList = p.category.service_types.map((st: any) => st?.name || st).filter(Boolean);
        }

        // Calculate starting price purely from dynamic provider data
        let price: number | null = Number(p.starting_price) || null;
        if (!price && p.service_pricing) {
          try {
            const pricingMap = typeof p.service_pricing === "string" ? JSON.parse(p.service_pricing) : p.service_pricing;
            const prices = Object.values(pricingMap).map((v: any) => Number(v?.price || v)).filter((n) => !isNaN(n) && n > 0);
            if (prices.length > 0) price = Math.min(...prices);
          } catch (e) {}
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

      if (sort === "rating") {
        mapped.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      } else if (sort === "reviews") {
        mapped.sort((a, b) => (Number(b.reviews) || 0) - (Number(a.reviews) || 0));
      } else if (sort === "price") {
        mapped.sort((a, b) => (Number(a.startingPrice) || 999999) - (Number(b.startingPrice) || 999999));
      }

      setProviders(mapped);
    } catch (err) {
      console.error("Provider search failed", err);
      toast.error("Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  };

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
    setSort("recommended");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, location, categoryId, radius, minRating, priceMax, minYears, verifiedOnly, availableNow, backgroundChecked, sort]);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Service Category */}
      <div className="grid gap-2">
        <Label htmlFor="service-cat-select">Service category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="service-cat-select">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <React.Fragment key={c.id}>
                <SelectItem value={String(c.id)} className="font-bold">
                  {c.name}
                </SelectItem>
                {c.service_types?.map((st) => (
                  <SelectItem
                    key={st.id}
                    value={`st_${st.id}`}
                    className="pl-6 text-xs text-muted-foreground"
                  >
                    ↳ {st.name}
                  </SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Radius */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Search radius</Label>
          <span className="text-sm font-semibold text-primary">{radius[0]} mi</span>
        </div>
        <Slider
          value={radius}
          onValueChange={setRadius}
          min={5}
          max={60}
          step={5}
        />
      </div>

      {/* Minimum Rating */}
      <div className="grid gap-2">
        <Label htmlFor="min-rating-select">Minimum rating</Label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger id="min-rating-select">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any rating</SelectItem>
            <SelectItem value="4">4.0+</SelectItem>
            <SelectItem value="4.5">4.5+</SelectItem>
            <SelectItem value="4.8">4.8+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Starting Price */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Max starting price</Label>
          <span className="text-sm font-semibold text-primary">{usd(priceMax[0])}</span>
        </div>
        <Slider
          value={priceMax}
          onValueChange={setPriceMax}
          min={50}
          max={5000}
          step={50}
        />
      </div>

      {/* Experience */}
      <div className="grid gap-2">
        <Label htmlFor="exp-select">Experience</Label>
        <Select value={minYears} onValueChange={setMinYears}>
          <SelectTrigger id="exp-select">
            <SelectValue placeholder="Any experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any experience</SelectItem>
            <SelectItem value="5">5+ years</SelectItem>
            <SelectItem value="10">10+ years</SelectItem>
            <SelectItem value="15">15+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Toggle Controls Box */}
      <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="verified" className="text-sm font-normal cursor-pointer">
            Verified professionals only
          </Label>
          <Switch
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="avail" className="text-sm font-normal cursor-pointer">
            Available today
          </Label>
          <Switch
            id="avail"
            checked={availableNow}
            onCheckedChange={setAvailableNow}
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="bg"
            checked={backgroundChecked}
            onCheckedChange={(c: boolean) => setBackgroundChecked(Boolean(c))}
          />
          <Label htmlFor="bg" className="text-sm font-normal cursor-pointer">
            Background checked
          </Label>
        </div>
      </div>

      {/* Reset Filters Button */}
      <Button
        variant="outline"
        onClick={handleResetFilters}
        className="w-full"
      >
        Reset filters
      </Button>
    </div>
  );

  return (
    <div>
      {/* Search Header Banner */}
      <div className="border-b border-border bg-surface">
        <div className="container-page py-6">
          <h1 className="font-display text-2xl font-bold">Find a professional</h1>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1.3fr_1fr_auto]">
            <div className="relative min-w-0">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="What service do you need?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProviders()}
                className="h-11 bg-card pl-9"
              />
            </div>
            <div className="relative min-w-0">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="ZIP Code or City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProviders()}
                className="h-11 bg-card pl-9"
              />
            </div>
            <Button onClick={fetchProviders} className="h-11">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Results */}
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Desktop Filters */}
        <aside className="hidden h-max rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24 lg:block">
          <h2 className="mb-4 font-display text-base font-bold">Filters</h2>
          <FiltersContent />
        </aside>

        {/* Search Results Area */}
        <div className="min-w-0">
          {/* Results Top Bar */}
          <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {loading ? "Searching..." : providers.length}
              </span>{" "}
              {providers.length === 1 ? "professional matches" : "professionals match"} your search
            </p>

            <div className="flex shrink-0 items-center gap-2">
              {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal size={15} /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-6">
                  <h2 className="mb-4 mt-6 font-display text-lg font-bold">Filters</h2>
                  <FiltersContent />
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="reviews">Most reviews</SelectItem>
                  <SelectItem value="price">Lowest price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Searching for local professionals...
              </p>
            </div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No professionals match those filters"
              description="Try widening the radius, lowering the minimum rating or clearing the price cap."
              action={
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchProviders;
