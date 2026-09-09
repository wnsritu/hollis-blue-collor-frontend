import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/primitives";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { parseGooglePlace } from "@/utils/googlePlaces";
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
    serviceTypes,
    handleSelectCategory,
    form,
    set,
    uploadingDoc,
    handleDocUpload,
    handleNext,
    handlePreviousStep,
    handleBackToHome,
  } = useProviderOnboarding();

  if (submitted) {
    return (
      <>
        <OnboardingHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
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
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login?role=provider">Go to Log in</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void handleBackToHome()}
            >
              Back to Home
            </Button>
          </div>
        </main>
        <SiteFooter />
      </>
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
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Select your service category
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose the primary category that best describes your services. You can
                  select exactly one category.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {categories.map((cat, idx) => {
                    const active = Number(selectedCategoryId) === Number(cat.id);
                    const Icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
                    const desc =
                      CATEGORY_FALLBACK_DESC[idx % CATEGORY_FALLBACK_DESC.length];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(Number(cat.id))}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-accent bg-accent-soft shadow-sm ring-2 ring-accent/20"
                            : "border-border bg-card hover:border-accent/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`grid size-10 place-items-center rounded-xl ${
                              active
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon size={20} />
                          </span>
                          {active && (
                            <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-foreground">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-foreground">{cat.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {categories.length === 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No categories available yet. Ask an admin to seed the catalog.
                  </p>
                )}
              </div>

              {selectedCategoryId != null && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Select the service you provide
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select the primary service area under{" "}
                        <span className="font-bold text-foreground">
                          {selectedCategory?.name}
                        </span>
                        . Only 1 service can be selected.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-soft-foreground">
                      {selectedServiceTypeId ? "1 Selected" : "0 Selected"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {serviceTypes.map((sub) => {
                      const checked = Number(selectedServiceTypeId) === Number(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedServiceTypeId(Number(sub.id));
                            setError("");
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                            checked
                              ? "border-accent bg-accent-soft font-semibold shadow-xs ring-2 ring-accent/20"
                              : "border-border bg-card hover:border-accent/40"
                          }`}
                        >
                          <div
                            className={`grid size-5 place-items-center rounded-full border text-[10px] transition-colors ${
                              checked
                                ? "border-accent bg-accent font-bold text-accent-foreground"
                                : "border-muted-foreground/40 bg-background"
                            }`}
                          >
                            {checked && <Check size={12} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{sub.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {serviceTypes.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No services under this category yet.
                    </p>
                  )}
                </div>
              )}
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
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <GooglePlaceAutocomplete
                    value={form.address}
                    placeholder="Start typing your street address..."
                    onChange={(val) => {
                      set({ address: val });
                      if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    onSelect={(place) => {
                      const parsed = parseGooglePlace(place);
                      set({
                        address: parsed.address,
                        city: parsed.city || form.city,
                        state: parsed.state || form.state,
                        zip: parsed.zip || form.zip,
                        country: parsed.country || form.country,
                        latitude: parsed.lat != null ? parsed.lat : null,
                        longitude: parsed.lng != null ? parsed.lng : null,
                      });
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.address;
                        if (parsed.city) delete next.city;
                        if (parsed.state) delete next.state;
                        if (parsed.zip) delete next.zip;
                        if (parsed.country) delete next.country;
                        return next;
                      });
                    }}
                    className={fieldErrors.address ? "border-destructive focus-visible:ring-destructive" : ""}
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
                  required
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
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className={`grid h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                        fieldErrors.licenseDocument
                          ? "border-destructive bg-destructive/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc === "license"}
                        onChange={(e) => {
                          if (fieldErrors.licenseDocument)
                            setFieldErrors({ ...fieldErrors, licenseDocument: undefined });
                          void handleDocUpload("license", e.target.files?.[0]);
                        }}
                      />
                      <FileCheck size={24} className="mb-1 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {uploadingDoc === "license"
                          ? "Uploading..."
                          : form.licenseFileName || "Upload License Document *"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        PDF, PNG, or JPG (max 25MB)
                      </span>
                    </label>
                    {fieldErrors.licenseDocument && (
                      <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.licenseDocument}</p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`grid h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                        fieldErrors.insuranceDocument
                          ? "border-destructive bg-destructive/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc === "insurance"}
                        onChange={(e) => {
                          if (fieldErrors.insuranceDocument)
                            setFieldErrors({ ...fieldErrors, insuranceDocument: undefined });
                          void handleDocUpload("insurance", e.target.files?.[0]);
                        }}
                      />
                      <FileCheck size={24} className="mb-1 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {uploadingDoc === "insurance"
                          ? "Uploading..."
                          : form.insuranceFileName || "Upload Insurance Certificate *"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        PDF, PNG, or JPG (max 25MB)
                      </span>
                    </label>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={label}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
