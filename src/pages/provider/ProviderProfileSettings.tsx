import { useMemo, useEffect } from "react";
import {
  Building2,
  HelpCircle,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { sanitizePhoneInput } from "@/utils/format";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceChipsInput } from "@/components/ui/service-chips-input";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { parseGooglePlace } from "@/utils/googlePlaces";
import Spinner from "@/components/ui/spinner";
import { BANK_TYPE_OPTIONS } from "@/constants";
import { useProviderProfileSettings } from "@/hooks/useProviderProfileSettings";
import { ProfileCompletionBanner } from "@/components/provider/ProfileCompletionBanner";
import type { ProviderProfileTab } from "@/types/provider.types";
import type { BankAccountType } from "@/types/api/provider";






function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ProviderProfileSettings = () => {
  const {
    activeTab,
    setTab,
    loading,
    saving,
    providerId,
    verified,
    rating,
    categories,
    planName,
    ownerName,
    setOwnerName,
    email,
    mobile,
    setMobile,
    businessName,
    setBusinessName,
    categoryId,
    setCategoryId,
    subcategoryId,
    setSubcategoryId,
    selectedServiceIds,
    setSelectedServiceIds,
    years,
    setYears,
    about,
    setAbout,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zip,
    setZip,
    country,
    setCountry,
    lat,
    setLat,
    lng,
    setLng,
    licenseNumber,
    setLicenseNumber,
    insurancePolicy,
    setInsurancePolicy,
    certifications,
    setCertifications,
    logoPreview,
    handleLogoChange,
    bank,
    setBank,
    saveBank,
    faqs,
    faqModalOpen,
    setFaqModalOpen,
    editingFaq,
    faqForm,
    setFaqForm,
    handleOpenAddFaq,
    handleOpenEditFaq,
    handleSaveFaqLocal,
    handleDeleteFaq,
    saveFaqsOnly,
    selectedCategoryObj,
    availableSubcategories,
    allSubcategories,
    selectedSubcategories,
    selectedSubcategoryIds,
    handleToggleSubcategory,
    selectedSubcategoryNames,
    subcategorySearchTerm,
    setSubcategorySearchTerm,
    customSpecialty,
    setCustomSpecialty,
    customPricing,
    updateCustomServicePricing,
    selectedSubcategoryObj,
    availableServiceItems,
    categoryName,
    saveProfile,
    savedOwnerName,
    savedBusinessName,
    fieldErrors,
    setFieldErrors,
    handleOwnerNameChange,
    handleBusinessNameChange,
    handleAboutChange,
    handleMobileChange,
    handleYearsChange,
    handleZipChange,
    handleAddressChange,
    handleCityChange,
    handleStateChange,
    handleCountryChange,
    handleLicenseNumberChange,
    handleInsurancePolicyChange,
    handleBankFieldChange,
    servicePricing,
    providerStartingPrice,
  } = useProviderProfileSettings();

  const startingPrice = useMemo(() => {
    const validPrices: number[] = [];

    // 1. Check provider's configured service pricing
    if (servicePricing) {
      try {
        const pricingMap =
          typeof servicePricing === "string"
            ? JSON.parse(servicePricing)
            : servicePricing;
        if (pricingMap && typeof pricingMap === "object") {
          Object.values(pricingMap).forEach((v: any) => {
            if (v && (v.offered === true || v.offered === undefined)) {
              const p = Number(v.price !== undefined ? v.price : v);
              if (!isNaN(p) && p > 0) validPrices.push(p);
            }
          });
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    // 2. Check provider's starting_price field
    if (providerStartingPrice && providerStartingPrice > 0) {
      validPrices.push(providerStartingPrice);
    }

    // 3. Fallback to catalog services if available
    if (validPrices.length === 0 && availableServiceItems && availableServiceItems.length > 0) {
      const catPrices = availableServiceItems
        .map((s: any) => Number(s.base_price || s.price || s.hourly_rate))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (catPrices.length > 0) validPrices.push(...catPrices);
    }

    if (validPrices.length > 0) {
      return Math.min(...validPrices);
    }
    return 0;
  }, [servicePricing, providerStartingPrice, availableServiceItems]);

  const customSpecialtyChips = useMemo(() => {
    if (!customSpecialty || !customSpecialty.trim()) return [];
    try {
      if (customSpecialty.startsWith("[")) {
        return JSON.parse(customSpecialty);
      }
    } catch {
      /* fallback */
    }
    return customSpecialty.split(",").map((s) => s.trim()).filter(Boolean);
  }, [customSpecialty]);

  const isNotListedCategorySelected = Boolean(
    selectedCategoryObj?.name?.toLowerCase().includes("not listed")
  );

  // Filter categories: active categories are always shown;
  // Inactive categories are ONLY shown if the existing provider already selected services / custom specialties in them.
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      const isNotListed = cat.name?.toLowerCase().includes("not listed");
      const isCatActive =
        cat.is_active !== false &&
        (cat as any).is_active !== 0 &&
        (cat as any).is_active !== "false";

      // If category is active in admin, show it
      if (isCatActive) return true;

      // If category is inactive:
      // For "Not Listed", ONLY display if the provider ALREADY has saved custom specialty chips!
      if (isNotListed) {
        return customSpecialtyChips.length > 0;
      }

      // For standard categories, ONLY display if provider already has subcategories selected in it
      const hasSelectedInCat = (cat.service_types || []).some((st) =>
        selectedSubcategoryIds.includes(String(st.id))
      );
      return hasSelectedInCat;
    });
  }, [categories, customSpecialtyChips.length, selectedSubcategoryIds]);

  // If the active category tab was deactivated and provider removes all items from it, smoothly reset to "All Categories"
  useEffect(() => {
    if (categoryId && !visibleCategories.some((c) => String(c.id) === String(categoryId))) {
      setCategoryId("");
    }
  }, [categoryId, visibleCategories]);

  if (loading) {
    return (
      <div className="container-grid flex min-h-[50vh] items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Business Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business information, operating address, FAQs and deposit bank account.
          </p>
        </div>
        <Button type="button" onClick={(e) => saveProfile(e)} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Profile Completion Progress Banner */}
      <ProfileCompletionBanner
        currentTab={activeTab}
        onSelectTab={(t) => setTab(t)}
        className="mb-6"
      />

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ProviderProfileTab)}>
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-3">
            <TabsTrigger value="info" className="gap-2 py-2">
              <Building2 size={16} /> Business Info
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2 py-2">
              <Landmark size={16} /> Bank Account Details
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2 py-2">
              <HelpCircle size={16} /> FAQs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6 min-w-0">
          {/* ── Business Info ── */}
          {activeTab === "info" && (
            <>
              {/* {Object.values(fieldErrors).some(Boolean) && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-bold text-base">Please fix the following validation errors:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                        {Object.entries(fieldErrors)
                          .filter(([, msg]) => Boolean(msg))
                          .map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )} */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <User size={18} className="text-primary" /> Primary Account Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">
                        Full Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => handleOwnerNameChange(e.target.value)}
                        onBlur={() => handleOwnerNameChange(ownerName)}
                        placeholder="John Doe"
                        className={cn(
                          fieldErrors.ownerName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.ownerName && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.ownerName}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pemail">Email Address</Label>
                      <Input id="pemail" type="email" value={email} readOnly className="bg-muted/50" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pmobile">Mobile Number</Label>
                      <Input
                        id="pmobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        onBlur={() => handleMobileChange(mobile)}
                        placeholder="(512) 555-0148"
                        className={cn(
                          fieldErrors.mobile && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.mobile && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.mobile}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Building2 size={18} className="text-primary" /> Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6 min-w-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="bn">
                        Business Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="bn"
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        onBlur={() => handleBusinessNameChange(businessName)}
                        className={cn(
                          fieldErrors.businessName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.businessName && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.businessName}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="years">Years of Experience</Label>
                      <Input
                        id="years"
                        type="number"
                        min={0}
                        placeholder="e.g. 14"
                        value={years}
                        onChange={(e) => handleYearsChange(e.target.value)}
                        onBlur={() => handleYearsChange(years)}
                        className={cn(
                          fieldErrors.years && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.years && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.years}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ab">
                      About Your Business <span className="text-destructive font-bold ml-0.5">*</span>
                    </Label>
                    <Textarea
                      id="ab"
                      rows={4}
                      placeholder="Describe your services, experience, and why customers should choose your business..."
                      value={about}
                      onChange={(e) => handleAboutChange(e.target.value)}
                      onBlur={() => handleAboutChange(about)}
                      className={cn(
                        fieldErrors.about && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {fieldErrors.about && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.about}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Dynamic Master Category & Services Directory ── */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base font-bold">
                        <Layers size={18} className="text-primary" /> Master Category &amp; Services Directory
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select all categories and trades your business provides. Clients will find and book you for any of these services.
                      </p>
                    </div>
                    <span className="shrink-0 self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-soft-foreground border border-accent/20 sm:self-auto">
                      {selectedSubcategoryIds.length} Selected
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 min-w-0">
                  {/* Selected Badges */}
                  {(selectedSubcategoryIds.length > 0 || customSpecialtyChips.length > 0) && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Current Selected Services:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {selectedSubcategoryIds.map((id) => {
                          const found = allSubcategories.find((s) => String(s.id) === String(id));
                          if (!found) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-foreground border border-accent/20"
                            >
                              {found.name}
                              <button
                                type="button"
                                onClick={() => handleToggleSubcategory(String(id))}
                                className="hover:text-destructive transition-colors ml-0.5"
                                title="Remove service"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                        {customSpecialtyChips.map((chip) => (
                          <span
                            key={chip}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20"
                          >
                            <Sparkles size={11} className="text-primary" />
                            {chip}
                            <button
                              type="button"
                              onClick={() => {
                                const next = customSpecialtyChips.filter((c) => c !== chip);
                                setCustomSpecialty(next.join(", "));
                              }}
                              className="hover:text-destructive transition-colors ml-0.5"
                              title="Remove custom specialty"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search & Category Filter Pills */}
                  <div className="space-y-3 pt-1">
                    <div className="relative">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        placeholder="Search all services and trades (e.g. Carpet Cleaning, Tile Cleaning, HVAC, Plumbing, Electrical...)"
                        value={subcategorySearchTerm}
                        onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                        className="h-10 pl-9 pr-8 text-xs"
                      />
                      {subcategorySearchTerm && (
                        <button
                          type="button"
                          onClick={() => setSubcategorySearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills (Dynamic from backend) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => setCategoryId("")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                          !categoryId
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        All Categories
                      </button>
                      {visibleCategories.map((c) => {
                        const isActive = String(c.id) === categoryId;
                        const isNotListed = c.name?.toLowerCase().includes("not listed");
                        const isCatActive =
                          c.is_active !== false &&
                          (c as any).is_active !== 0 &&
                          (c as any).is_active !== "false";
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategoryId(String(c.id))}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0 inline-flex items-center gap-1.5 ${
                              isActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            <span>{c.name}</span>
                            {!isCatActive && (
                              <span className="rounded-full bg-destructive/15 text-destructive text-[9px] font-bold px-1.5 py-0.2">
                                Deactivated
                              </span>
                            )}
                            {isNotListed && customSpecialtyChips.length > 0 && (
                              <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-bold text-accent-foreground">
                                {customSpecialtyChips.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Subcategories Checkbox Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 max-h-[300px] overflow-y-auto p-1 border rounded-xl bg-card">
                      {(() => {
                        let filtered = allSubcategories;
                        if (categoryId) {
                          filtered = filtered.filter((s) => String(s.category_id) === categoryId);
                        }
                        if (subcategorySearchTerm.trim()) {
                          const q = subcategorySearchTerm.toLowerCase().trim();
                          filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
                        }
                        if (filtered.length === 0) {
                          return (
                            <p className="col-span-full py-8 text-center text-xs text-muted-foreground">
                              No services matching &quot;{subcategorySearchTerm}&quot;.
                            </p>
                          );
                        }
                        return filtered.map((sub) => {
                          const isChecked = selectedSubcategoryIds.includes(String(sub.id));
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleToggleSubcategory(String(sub.id))}
                              className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-all ${
                                isChecked
                                  ? "border-primary bg-primary-soft font-semibold text-primary shadow-xs ring-1 ring-primary/20"
                                  : "border-border bg-background hover:border-primary/40 text-foreground"
                              }`}
                            >
                              <div
                                className={`grid size-4 shrink-0 place-items-center rounded-sm border text-[10px] ${
                                  isChecked
                                    ? "border-primary bg-primary text-primary-foreground font-bold"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {isChecked && <Check size={11} />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{sub.name}</p>
                                {!categoryId && sub.category_name && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {sub.category_name}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Custom Specialty Input Field - Only visible when "Not Listed — Add My Own Specialty" is selected */}
                    {isNotListedCategorySelected && (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="custom-specialty-profile" className="text-xs font-bold text-foreground">
                            Not Listed — Add My Own Specialty
                          </Label>
                          {selectedCategoryObj?.is_active === false ? (
                            <span className="rounded-full bg-destructive/15 text-destructive text-[10px] font-bold px-2 py-0.5">
                              Deactivated by Admin
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Custom Field</span>
                          )}
                        </div>
                        {selectedCategoryObj?.is_active === false && (
                          <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                            Notice: This category is currently deactivated by administrators. You can modify your existing specialties and pricing below, but if you remove all of them from your profile, this category will no longer be available to select.
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Enter any specialty trade not listed above (e.g., Yacht Detailing, Custom Pergola Specialist, Historic Restoration).
                        </p>
                        <div className="mt-2">
                          <ServiceChipsInput
                            value={customSpecialtyChips}
                            onChange={(chips) => setCustomSpecialty(chips.join(", "))}
                            placeholder="Type specialty and press Enter (e.g. Yacht Detailing, Custom Pergola)..."
                          />
                        </div>
                        {customSpecialtyChips.length > 0 && (
                          <>
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 size={13} />
                              {customSpecialtyChips.length} custom {customSpecialtyChips.length === 1 ? "specialty" : "specialties"} added. Saved as service tags on your profile.
                            </div>

                            {/* Custom Service Pricing Config */}
                            <div className="mt-3.5 pt-3 border-t border-border space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <Sparkles size={13} className="text-accent" />
                                  Custom Service Pricing &amp; Rates
                                </span>
                                <span className="text-[10px] text-muted-foreground">Required for 100% profile completion</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Set your starting price and deposit requirement for each custom service so customers can book you.
                              </p>

                              <div className="space-y-2">
                                {customSpecialtyChips.map((chip) => {
                                  const cfg = (customPricing && customPricing[chip]) || {
                                    price: 100,
                                    unit: "flat rate",
                                    partial_payment_percentage: 100,
                                  };
                                  return (
                                    <div
                                      key={chip}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-3 shadow-2xs"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{chip}</p>
                                        <span className="text-[10px] text-muted-foreground">Custom Service</span>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                                        {/* Price Input */}
                                        <div className="w-28 relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                                            $
                                          </span>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={cfg.price || ""}
                                            onChange={(e) =>
                                              updateCustomServicePricing(chip, { price: parseFloat(e.target.value) || 0 })
                                            }
                                            placeholder="Price"
                                            className="h-8 pl-6 pr-2 text-xs font-semibold"
                                          />
                                        </div>

                                        {/* Rate Unit */}
                                        <div className="w-28">
                                          <Select
                                            value={cfg.unit || "flat rate"}
                                            onValueChange={(val) => updateCustomServicePricing(chip, { unit: val })}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="flat rate">Flat Rate</SelectItem>
                                              <SelectItem value="hourly">Hourly</SelectItem>
                                              <SelectItem value="per sq ft">Per Sq Ft</SelectItem>
                                              <SelectItem value="per item">Per Item</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Deposit % */}
                                        <div className="w-24">
                                          <Select
                                            value={String(cfg.partial_payment_percentage ?? 100)}
                                            onValueChange={(val) =>
                                              updateCustomServicePricing(chip, {
                                                partial_payment_percentage: Number(val),
                                              })
                                            }
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Deposit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="10">10% Deposit</SelectItem>
                                              <SelectItem value="20">20% Deposit</SelectItem>
                                              <SelectItem value="30">30% Deposit</SelectItem>
                                              <SelectItem value="50">50% Deposit</SelectItem>
                                              <SelectItem value="100">100% Full</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <MapPin size={18} className="text-primary" /> Operating Address &amp; Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="address">
                        Street Address <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <GooglePlaceAutocomplete
                        value={address}
                        onChange={(val) => handleAddressChange(val)}
                        placeholder="Enter street address..."
                        onSelect={(place) => {
                          const parsed = parseGooglePlace(place);
                          setAddress(parsed.address);
                          setLat(parsed.lat);
                          setLng(parsed.lng);
                          if (parsed.city) setCity(parsed.city);
                          if (parsed.state) setState(parsed.state);
                          if (parsed.zip) setZip(parsed.zip);
                          if (parsed.country) setCountry(parsed.country);
                        }}
                      />
                      {fieldErrors.address && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.address}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        onBlur={() => handleCityChange(city)}
                        className={cn(
                          fieldErrors.city && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.city && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.city}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">
                        State / Province <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        onBlur={() => handleStateChange(state)}
                        className={cn(
                          fieldErrors.state && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.state && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.state}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input
                        id="zip"
                        value={zip}
                        onChange={(e) => handleZipChange(e.target.value)}
                        onBlur={() => handleZipChange(zip)}
                        className={cn(
                          fieldErrors.zip && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.zip && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.zip}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">
                        Country <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        onBlur={() => handleCountryChange(country)}
                        className={cn(
                          fieldErrors.country && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.country && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.country}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <ShieldCheck size={18} className="text-primary" /> Verified Credentials &amp; Licensing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="lic">
                        License Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="lic"
                        value={licenseNumber}
                        onChange={(e) => handleLicenseNumberChange(e.target.value)}
                        onBlur={() => handleLicenseNumberChange(licenseNumber)}
                        className={cn(
                          (fieldErrors.licenseNumber || fieldErrors.license) &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {(fieldErrors.licenseNumber || fieldErrors.license) && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.licenseNumber || fieldErrors.license}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ins">
                        Insurance Policy Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="ins"
                        value={insurancePolicy}
                        onChange={(e) => handleInsurancePolicyChange(e.target.value)}
                        onBlur={() => handleInsurancePolicyChange(insurancePolicy)}
                        className={cn(
                          (fieldErrors.insurancePolicy || fieldErrors.insurance) &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {(fieldErrors.insurancePolicy || fieldErrors.insurance) && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.insurancePolicy || fieldErrors.insurance}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="certs">
                      Certifications (comma separated)
                    </Label>
                    <Input
                      id="certs"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="EPA Certified, Master Plumber, …"
                    />
                  </div>
                  <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Document uploads are verified by Admin during onboarding review.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── FAQs ── */}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage FAQs displayed on your public provider profile.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveFaqsOnly}
                    disabled={saving || faqs.length === 0}
                  >
                    Save FAQs
                  </Button>
                  <Button onClick={handleOpenAddFaq} className="gap-1.5 shrink-0">
                    <Plus size={16} /> Add FAQ
                  </Button>
                </div>
              </div>

              {faqs.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle
                    size={32}
                    className="mx-auto mb-2 text-muted-foreground opacity-50"
                  />
                  <h3 className="font-bold text-foreground">
                    No FAQs added yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Click &apos;+ Add FAQ&apos; above to create answers to common customer questions.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card key={faq.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                              <HelpCircle
                                size={17}
                                className="shrink-0 text-primary"
                              />
                              {faq.question}
                            </h3>
                            <p className="pl-6 text-sm leading-relaxed text-muted-foreground">
                              {faq.answer}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditFaq(faq)}
                              className="gap-1 text-xs"
                            >
                              <Pencil size={14} /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} /> Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Bank ── */}
          {activeTab === "bank" && (
            <>
              {/* {Object.values(fieldErrors).some(Boolean) && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-bold text-base">Please fix the following bank account errors:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                        {Object.entries(fieldErrors)
                          .filter(([, msg]) => Boolean(msg))
                          .map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )} */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Landmark size={18} className="text-primary" /> Bank Information &amp; Payout Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="bankname">
                        Bank Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="bankname"
                        placeholder="e.g. Chase Bank"
                        value={bank.bank_name}
                        onChange={(e) => handleBankFieldChange("bank_name", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_name", bank.bank_name)}
                        className={cn(
                          fieldErrors.bank_name && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_name && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_name}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="holder">
                        Account Holder Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="holder"
                        placeholder="e.g. ABC Plumbing LLC"
                        value={bank.bank_account_holder}
                        onChange={(e) => handleBankFieldChange("bank_account_holder", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_account_holder", bank.bank_account_holder)}
                        className={cn(
                          fieldErrors.bank_account_holder && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_account_holder && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_account_holder}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="account">
                        Account Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="account"
                        placeholder="Enter account number (digits only)"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={bank.bank_account_number}
                        onChange={(e) => handleBankFieldChange("bank_account_number", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_account_number", bank.bank_account_number)}
                        className={cn(
                          fieldErrors.bank_account_number && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_account_number && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_account_number}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="routing">
                        Routing Number / IFSC <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="routing"
                        placeholder="Enter routing number or IFSC"
                        value={bank.bank_routing_number}
                        onChange={(e) => handleBankFieldChange("bank_routing_number", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_routing_number", bank.bank_routing_number)}
                        className={cn(
                          fieldErrors.bank_routing_number && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_routing_number && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_routing_number}</p>
                      )}
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                      <Label>
                        Account Type <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Select
                        value={bank.bank_account_type}
                        onValueChange={(val) =>
                          setBank((b) => ({
                            ...b,
                            bank_account_type: val as BankAccountType,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BANK_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="button" onClick={(e) => saveBank(e)} disabled={saving}>
                      {saving ? "Saving…" : "Save Bank Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Sidebar Summary Cards ── */}
        <aside className="space-y-6 min-w-0">
          {/* LOGO IMAGE UPLOADER CARD */}
          <Card className="shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload size={18} className="text-primary" /> Business Logo Uploader
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto flex size-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden relative shadow-sm">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={businessName || "Business Logo"}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-primary/10 font-heading text-2xl font-bold text-primary">
                    {initialsFrom(businessName || ownerName)}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="logo-upload-input-sidebar"
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Upload size={14} /> Upload New Logo
                  <input
                    id="logo-upload-input-sidebar"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  PNG, JPG or SVG logo image (Max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* BUSINESS QUICK OVERVIEW CARD */}
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={businessName || "Logo"}
                    className="size-12 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-heading text-sm font-bold text-primary">
                    {initialsFrom(businessName || ownerName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground text-sm">
                    {businessName.trim() || savedBusinessName.trim() || ownerName.trim() || savedOwnerName.trim() || "Your Business"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryName || "Provider"}
                  </p>
                </div>
              </div>

              {verified === "verified" && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 size={14} /> Verified Business
                </div>
              )}

              <Separator />

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Rating</dt>
                  <dd className="font-bold text-foreground">
                    {rating != null ? `${rating.toFixed(1)} ★` : "0.0 ★"}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Years in Business</dt>
                  <dd className="font-semibold text-foreground">
                    {years ? `${years} Years` : "0 years"}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Starting Price</dt>
                  <dd className="font-bold text-primary text-sm">
                    {startingPrice > 0 ? `$${startingPrice}` : "Not set"}
                  </dd>
                </div>

                {planName && (
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Subscription</dt>
                    <dd className="font-semibold text-primary">{planName}</dd>
                  </div>
                )}

                {/* {address && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border">
                    <dt className="shrink-0 text-muted-foreground">Address</dt>
                    <dd className="text-right font-medium text-foreground">
                      {[address, city, state, zip].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )} */}
              </dl>

              <Separator />

              <Button onClick={(e) => saveProfile(e)} disabled={saving} className="w-full font-bold">
                {saving ? "Saving Changes…" : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── FAQ Modal ── */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "Edit FAQ" : "Add Frequently Asked Question"}
            </DialogTitle>
            <DialogDescription>
              Provide answers to questions your customers ask often.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faq-q">Question</Label>
              <Input
                id="faq-q"
                placeholder="e.g. Do you offer emergency services?"
                value={faqForm.question}
                onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-a">Answer</Label>
              <Textarea
                id="faq-a"
                rows={4}
                placeholder="e.g. Yes, we offer 24/7 emergency dispatch for urgent issues."
                value={faqForm.answer}
                onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFaqLocal}>
              {editingFaq ? "Update FAQ" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfileSettings;
