import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/primitives";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceChipsInput } from "@/components/ui/service-chips-input";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { parseGooglePlace } from "@/utils/googlePlaces";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { CATEGORY_ICONS, CATEGORY_FALLBACK_DESC } from "@/constants";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

const OnboardingHeader = () => (
  <header className="border-b border-border/80 bg-background/95 backdrop-blur-md">
    <div className="container-page flex h-16 items-center justify-between">
      <Logo />
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        Provider Onboarding
      </span>
    </div>
  </header>
);

export default function ProviderOnboarding() {
  const {
    submitted,
    businessName,
    fullName,
    step,
    steps,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    loading,
    categories,
    selectedCategoryId,
    selectedCategory,
    selectedServiceTypeId,
    setSelectedServiceTypeId,
    selectedServiceTypeIds,
    handleToggleServiceType,
    searchTerm,
    setSearchTerm,
    customSpecialty,
    setCustomSpecialty,
    allServiceTypes,
    serviceTypes,
    handleSelectCategory,
    form,
    set,
    uploadingDoc,
    handleDocUpload,
    handleRemoveDoc,
    handleNext,
    handlePreviousStep,
    handleBackToHome,
    handleSignOut,
  } = useProviderOnboarding();

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="mx-auto max-w-lg flex-1 px-4 py-20 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success shadow-card">
            <CheckCircle2 size={34} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-foreground">
            Application Submitted
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thank you for completing your provider registration. Your application has been
            successfully submitted and is now pending admin verification. We&apos;ll notify you
            once your application has been reviewed.
          </p>

          <div className="mt-8 space-y-2 rounded-2xl border border-border bg-card p-5 text-left text-xs text-muted-foreground shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck size={16} className="text-primary" /> Application Summary
            </div>
            {businessName && (
              <p>
                <strong className="text-foreground">Business:</strong> {businessName}
              </p>
            )}
            {fullName && (
              <p>
                <strong className="text-foreground">Applicant:</strong> {fullName}
              </p>
            )}
            <p>
              <strong className="text-foreground">Status:</strong>{" "}
              <span className="inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 font-semibold text-warning">
                Pending Admin Verification
              </span>
            </p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              onClick={() => void handleBackToHome()}
            >
              Back to Home
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void handleSignOut()}
            >
              Sign Out
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <>
      <OnboardingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-10 sm:pb-14">
        <p className="text-sm font-semibold text-primary">Provider Onboarding</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
          Grow your business
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of {steps.length} · {steps[step]}
        </p>

        <Progress value={((step + 1) / steps.length) * 100} className="mt-4 h-2" />

        <div className="mt-6 grid grid-cols-3 gap-2">
          {steps.map((label, idx) => {
            const isDone = idx < step;
            const isCurrent = idx === step;
            return (
              <div
                key={label}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  isCurrent
                    ? "border-primary bg-primary-soft text-primary shadow-xs"
                    : isDone
                      ? "border-success/30 bg-success-soft/30 text-success"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check size={12} /> : idx + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Select your services & trades
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose all occupations and trade services your business provides. You can select multiple.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-soft-foreground">
                    {selectedServiceTypeIds.length} Selected
                  </span>
                </div>

                {/* Primary Category Switcher / Filter */}
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {categories.map((cat, idx) => {
                    const active = Number(selectedCategoryId) === Number(cat.id);
                    const Icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
                    const isNotListedCat = cat.name.toLowerCase().includes("not listed");
                    const countSelectedInCat = (cat.service_types || []).filter((st) =>
                      selectedServiceTypeIds.includes(Number(st.id))
                    ).length;
                    const customChipsCount = isNotListedCat
                      ? customSpecialty.split(",").map((s) => s.trim()).filter(Boolean).length
                      : 0;
                    const totalSelected = countSelectedInCat + customChipsCount;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(Number(cat.id))}
                        className={`rounded-2xl border p-3.5 text-left transition-all ${
                          active
                            ? "border-accent bg-accent-soft shadow-sm ring-2 ring-accent/20"
                            : "border-border bg-card hover:border-accent/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`grid size-9 place-items-center rounded-xl ${
                              active
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon size={18} />
                          </span>
                          {totalSelected > 0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                              {totalSelected} selected
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-foreground">{cat.name}</h3>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar for 35 Subcategories & 440 Services */}
              <div className="border-t border-border pt-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search all services & trades (e.g., Plumber, Cleaner, Electrician, Roof...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-9 pr-9 text-sm"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Selected Pills */}
                {(selectedServiceTypeIds.length > 0 || customSpecialty.trim()) && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">
                      Selected:
                    </span>
                    {selectedServiceTypeIds.map((id) => {
                      const item = allServiceTypes.find((st) => st.id === id);
                      if (!item) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-soft-foreground border border-accent/20"
                        >
                          {item.name}
                          <button
                            type="button"
                            onClick={() => handleToggleServiceType(id)}
                            className="hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                    {customSpecialty
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((chip) => (
                        <span
                          key={chip}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"
                        >
                          <Sparkles size={11} className="text-primary" />
                          {chip}
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = customSpecialty
                                .split(",")
                                .map((s) => s.trim())
                                .filter((s) => s && s.toLowerCase() !== chip.toLowerCase());
                              setCustomSpecialty(remaining.join(", "));
                            }}
                            className="hover:text-destructive"
                            title="Remove custom specialty"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {/* Services List Grid */}
                <div className="mt-4">
                  {(() => {
                    const sourceList = searchTerm.trim()
                      ? allServiceTypes.filter((st) =>
                          st.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
                        )
                      : (serviceTypes || []).map((st) => ({
                          id: Number(st.id),
                          name: st.name,
                          category_name: selectedCategory?.name,
                        }));

                    if (sourceList.length === 0) {
                      return (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          No services found matching &quot;{searchTerm}&quot;. Try a different keyword or check below.
                        </p>
                      );
                    }

                    return (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[380px] overflow-y-auto pr-1">
                        {sourceList.map((sub) => {
                          const checked = selectedServiceTypeIds.includes(Number(sub.id));
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleToggleServiceType(Number(sub.id))}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                                checked
                                  ? "border-accent bg-accent-soft font-semibold shadow-xs ring-2 ring-accent/20"
                                  : "border-border bg-card hover:border-accent/40"
                              }`}
                            >
                              <div
                                className={`grid size-4 shrink-0 place-items-center rounded-sm border text-[10px] transition-colors ${
                                  checked
                                    ? "border-accent bg-accent font-bold text-accent-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {checked && <Check size={11} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{sub.name}</p>
                                {searchTerm.trim() && sub.category_name && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {sub.category_name}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Not Listed — Add My Own Specialty Input (Only visible when 'Not Listed — Add My Own Specialty' category is selected) */}
                {Boolean(selectedCategory?.name?.toLowerCase().includes("not listed")) && (
                  <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-specialty" className="text-xs font-bold text-foreground">
                        Not Listed? Add Your Own Specialty
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Custom Field</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Type your custom trade or specialty service and press Enter.
                    </p>
                    <div className="mt-2">
                      <ServiceChipsInput
                        value={
                          customSpecialty.trim()
                            ? customSpecialty.split(",").map((s) => s.trim()).filter(Boolean)
                            : []
                        }
                        onChange={(chips) => setCustomSpecialty(chips.join(", "))}
                        placeholder="Type specialty and press Enter (e.g. Yacht Detailing, Custom Pergola)..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Service Coverage &amp; Location
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Specify your primary operating address and location details.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="address">
                    Street Address <span className="text-destructive font-bold ml-0.5">*</span>
                  </Label>
                  <GooglePlaceAutocomplete
                    value={form.address}
                    placeholder="Start typing your street address..."
                    className={fieldErrors.address ? "border-destructive focus-visible:ring-destructive" : ""}
                    onChange={(val) => {
                      set({ address: val });
                      if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    onSelect={(place) => {
                      const comps = place.fullPlace?.address_components || [];
                      const get = (type: string) =>
                        comps.find((c) => c.types.includes(type))?.long_name || "";
                      const addressVal = place.address || form.address;
                      const cityVal = get("locality") || get("sublocality") || form.city;
                      const stateVal = get("administrative_area_level_1") || form.state;
                      const zipVal = get("postal_code") || form.zip;
                      const countryVal = get("country") || form.country;

                      set({
                        address: addressVal,
                        city: cityVal,
                        state: stateVal,
                        zip: zipVal,
                        country: countryVal,
                        latitude: place.lat || null,
                        longitude: place.lng || null,
                      });

                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.address;
                        if (cityVal) delete next.city;
                        if (stateVal) delete next.state;
                        if (zipVal) delete next.zip;
                        if (countryVal) delete next.country;
                        return next;
                      });
                    }}
                  />
                  {fieldErrors.address && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.address}</p>
                  )}
                </div>
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => {
                    set({ city: v });
                    if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: undefined });
                  }}
                  error={fieldErrors.city}
                  required
                />
                <Field
                  label="State / Province"
                  value={form.state}
                  onChange={(v) => {
                    set({ state: v });
                    if (fieldErrors.state) setFieldErrors({ ...fieldErrors, state: undefined });
                  }}
                  error={fieldErrors.state}
                  required
                />
                <Field
                  label="ZIP / Postal Code"
                  value={form.zip}
                  onChange={(v) => {
                    set({ zip: v });
                    if (fieldErrors.zip) setFieldErrors({ ...fieldErrors, zip: undefined });
                  }}
                  error={fieldErrors.zip}
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => {
                    set({ country: v });
                    if (fieldErrors.country) setFieldErrors({ ...fieldErrors, country: undefined });
                  }}
                  error={fieldErrors.country}
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  License &amp; Insurance Verification
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Provide your professional licensing and insurance details for admin review.
                </p>
              </div>
              <div className="grid gap-4">
                <Field
                  label="License Number"
                  value={form.license}
                  onChange={(v) => {
                    set({ license: v });
                    if (fieldErrors.license) setFieldErrors({ ...fieldErrors, license: undefined });
                  }}
                  error={fieldErrors.license}
                  maxLength={100}
                  required
                />
                <Field
                  label="Insurance Policy"
                  value={form.insurance}
                  onChange={(v) => {
                    set({ insurance: v });
                    if (fieldErrors.insurance) setFieldErrors({ ...fieldErrors, insurance: undefined });
                  }}
                  error={fieldErrors.insurance}
                  maxLength={100}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* License Document Field */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Business License Document <span className="text-destructive">*</span>
                    </Label>
                    {form.licenseDocumentPath ? (
                      <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          {form.licenseIsImage || /\.(png|jpg|jpeg|webp|gif)$/i.test(form.licenseFileName || form.licenseDocumentPath) ? (
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/80">
                              <img
                                src={form.licensePreviewUrl || resolveMediaUrl(form.licenseDocumentPath) || ""}
                                alt="License preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary border border-primary/20">
                              <FileCheck size={22} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-foreground">
                              {form.licenseFileName || "License Document"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">Uploaded &amp; Ready</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp"
                                  className="hidden"
                                  disabled={uploadingDoc === "license"}
                                  onChange={(e) => {
                                    if (fieldErrors.licenseDocument)
                                      setFieldErrors({ ...fieldErrors, licenseDocument: undefined });
                                    void handleDocUpload("license", e.target.files?.[0]);
                                  }}
                                />
                                <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors">
                                  <RefreshCw size={11} /> Change
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc("license")}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive-soft transition-colors"
                              >
                                <Trash2 size={11} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`grid h-28 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                          fieldErrors.licenseDocument
                            ? "border-destructive bg-destructive-soft/20"
                            : "border-border bg-card hover:border-primary/50 hover:bg-primary-soft/20"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp"
                          className="hidden"
                          disabled={uploadingDoc === "license"}
                          onChange={(e) => {
                            if (fieldErrors.licenseDocument)
                              setFieldErrors({ ...fieldErrors, licenseDocument: undefined });
                            void handleDocUpload("license", e.target.files?.[0]);
                          }}
                        />
                        <Upload size={20} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingDoc === "license" ? "Uploading..." : "Upload License Document"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          PDF, PNG, JPG or WEBP (max 5MB for images)
                        </span>
                      </label>
                    )}
                    {fieldErrors.licenseDocument && (
                      <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.licenseDocument}</p>
                    )}
                  </div>

                  {/* Insurance Certificate Field */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Insurance Certificate <span className="text-destructive">*</span>
                    </Label>
                    {form.insuranceDocumentPath ? (
                      <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          {form.insuranceIsImage || /\.(png|jpg|jpeg|webp|gif)$/i.test(form.insuranceFileName || form.insuranceDocumentPath) ? (
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/80">
                              <img
                                src={form.insurancePreviewUrl || resolveMediaUrl(form.insuranceDocumentPath) || ""}
                                alt="Insurance preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary border border-primary/20">
                              <FileCheck size={22} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-foreground">
                              {form.insuranceFileName || "Insurance Certificate"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">Uploaded &amp; Ready</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp"
                                  className="hidden"
                                  disabled={uploadingDoc === "insurance"}
                                  onChange={(e) => {
                                    if (fieldErrors.insuranceDocument)
                                      setFieldErrors({ ...fieldErrors, insuranceDocument: undefined });
                                    void handleDocUpload("insurance", e.target.files?.[0]);
                                  }}
                                />
                                <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors">
                                  <RefreshCw size={11} /> Change
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc("insurance")}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive-soft transition-colors"
                              >
                                <Trash2 size={11} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`grid h-28 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                          fieldErrors.insuranceDocument
                            ? "border-destructive bg-destructive-soft/20"
                            : "border-border bg-card hover:border-primary/50 hover:bg-primary-soft/20"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp"
                          className="hidden"
                          disabled={uploadingDoc === "insurance"}
                          onChange={(e) => {
                            if (fieldErrors.insuranceDocument)
                              setFieldErrors({ ...fieldErrors, insuranceDocument: undefined });
                            void handleDocUpload("insurance", e.target.files?.[0]);
                          }}
                        />
                        <Upload size={20} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingDoc === "insurance" ? "Uploading..." : "Upload Insurance Certificate"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          PDF, PNG, JPG or WEBP (max 5MB for images)
                        </span>
                      </label>
                    )}
                    {fieldErrors.insuranceDocument && (
                      <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.insuranceDocument}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              disabled={step === 0 || loading}
            >
              <ArrowLeft size={16} /> Back
            </Button>

            {step < steps.length - 1 ? (
              <Button onClick={() => void handleNext()} disabled={loading}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => void handleNext()} disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={label}>
        {label} {required && <span className="text-destructive font-bold ml-0.5">*</span>}
      </Label>
      <Input
        id={label}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
