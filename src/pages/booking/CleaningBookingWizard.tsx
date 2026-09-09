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
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { formatTimeSlot } from "@/utils/format";
import { CLEANING_STEPS, TIME_WINDOWS } from "@/constants/booking";
import { formatDate } from "@/utils/date";
import { useCleaningBookingWizard } from "@/hooks/useCleaningBookingWizard";

const STEPS = CLEANING_STEPS;
const timeWindows = TIME_WINDOWS;

const CleaningBookingWizard = () => {
  const wizard = useCleaningBookingWizard();
  const {
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
    filteredProviders,
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
    mappedProviders,
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
  } = wizard;


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
