import React from "react";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  MapPin,
  Loader2,
  Sparkles,
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
import { ProviderCard, usd } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/primitives";
import { useSearchProviders } from "@/hooks/useSearchProviders";

export const SearchProviders: React.FC = () => {
  const {
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
  } = useSearchProviders();

  // Check if at least one valid search parameter is provided
  const hasValidSearchCriteria = Boolean(
    query.trim().length > 0 ||
    location.trim().length > 0 ||
    (categoryId && categoryId !== "all")
  );

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
                <SelectItem value={String(c.id)}>
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
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  hasValidSearchCriteria &&
                  fetchProviders(query, location)
                }
                className="h-11 bg-card pl-9"
              />
            </div>
            <div className="relative min-w-0">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={userCoords && !location ? "Near your location" : "ZIP Code or City"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  hasValidSearchCriteria &&
                  fetchProviders(query, location)
                }
                className="h-11 bg-card pl-9 pr-10"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                title="Use my current location"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Sparkles size={16} />
              </button>
            </div>
            <Button
              onClick={() => hasValidSearchCriteria && fetchProviders(query, location)}
              disabled={!hasValidSearchCriteria || loading}
              className="h-11 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
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
          <div className="mb-5 flex items-center justify-between gap-3">
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

              {/* <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="reviews">Most reviews</SelectItem>
                  <SelectItem value="price">Lowest price</SelectItem>
                </SelectContent>
              </Select> */}
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
