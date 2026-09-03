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
        const res = await catalogApi.getCategories();
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
      if (verifiedOnly) params.verified = "verified";
      if (sort) params.sort = sort;

      const res = await providerApi.search(params);
      const rawData = (res as any)?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : rawData.data || [];

      // Map backend Provider models to GenericProvider card shape
      const mapped: GenericProvider[] = list.map((p: any) => {
        let servicesList: string[] = [];
        if (p.category?.service_types && Array.isArray(p.category.service_types)) {
          servicesList = p.category.service_types.map((st: any) => st.name);
        }

        const raw = p.services || p.service_categories;
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              servicesList = Array.from(new Set([...servicesList, ...parsed]));
            }
          } catch {}
        } else if (Array.isArray(raw)) {
          const names = raw.map((item) => (typeof item === "string" ? item : item?.name || String(item)));
          servicesList = Array.from(new Set([...servicesList, ...names]));
        }

        if (servicesList.length === 0) {
          servicesList = ["General Service"];
        }

        let price = Number(p.starting_price) || 0;
        if (!price && p.category?.service_types && Array.isArray(p.category.service_types)) {
          for (const st of p.category.service_types) {
            const amt = Number(st.provider_services?.amount);
            if (amt > 0) {
              price = amt;
              break;
            }
          }
        }
        if (!price) price = 75;

        const photo = p.profile_photo || p.user?.profile_image || p.profile_image || null;
        const yearsVal = p.years_of_experience ?? p.experience ?? 0;
        const ratingVal = Number(p.rating) || 0;
        const reviewsVal = p.review_count ?? p.reviews_count ?? 0;

        return {
          id: String(p.id || p.provider_id),
          name: p.business_name || p.user?.full_name || "Service Professional",
          avatarUrl: photo,
          verified: p.verified === "verified" || p.status === "active",
          featured: Boolean(p.is_featured || p.featured),
          category: p.category?.name || servicesList[0] || "General Service",
          rating: ratingVal,
          reviews: Number(reviewsVal),
          tagline: p.service_description || "",
          services: servicesList,
          city: p.city || "",
          state: p.state || "",
          years: Number(yearsVal),
          startingPrice: price,
          availability: p.availability ? "Available Today" : "Available",
        };
      });

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
        className="w-full rounded-xl"
      >
        Reset filters
      </Button>
    </div>
  );

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
        {/* Search Header Banner */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6 sm:p-8 shadow-card mb-8">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Find Verified Local Service Professionals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by service category, city, zip code, rating, or budget range.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="relative">
              <SearchIcon
                size={16}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Input
                placeholder="What service do you need? (e.g. Plumber, Electrician)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Input
                placeholder="City or Zip Code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <Button onClick={fetchProviders} className="gap-2">
              <SearchIcon size={16} /> Search
            </Button>
          </div>
        </div>

        {/* Main Grid: Sidebar + Results */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Desktop Filters */}
          <aside className="hidden lg:block rounded-2xl border border-border bg-card p-6 shadow-card h-fit sticky top-24">
            <div className="pb-4 mb-2">
              <h3 className="font-display font-bold text-lg text-foreground">
                Filters
              </h3>
            </div>
            <FiltersContent />
          </aside>

          {/* Search Results Area */}
          <div>
            {/* Results Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <Filter size={15} /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <h3 className="font-display font-bold text-lg mb-4">Search Filters</h3>
                    <FiltersContent />
                  </SheetContent>
                </Sheet>

                <p className="text-sm font-semibold text-foreground">
                  {loading
                    ? "Searching..."
                    : `${providers.length} verified pros found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Sort by:
                </Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 w-[160px] text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price">Lowest Price</SelectItem>
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
                icon={FileQuestion}
                title="No professionals match your search"
                description="Try broadening your category or expanding your location/radius search."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setLocation("");
                      setCategoryId("all");
                      setVerifiedOnly(false);
                    }}
                  >
                    Clear Search Filters
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
