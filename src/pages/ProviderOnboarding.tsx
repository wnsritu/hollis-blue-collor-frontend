import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileCheck,
  Home,
  ShieldCheck,
  User,
} from "lucide-react";
import Header from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { catalogApi } from "@/api/modules/catalog.api";
import { authApi } from "@/api/modules/auth.api";
import { uploadApi } from "@/api/modules/upload.api";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import type { Category, ServiceType } from "@/types/api/catalog";
import {
  PROVIDER_SIGNUP_DRAFT_KEY,
  type ProviderSignupDraft,
} from "@/pages/SignUp";
import { getErrorMessage } from "@/lib/api/errors";
import toast from "react-hot-toast";

const steps = ["Services", "Coverage", "Credentials"] as const;

const CATEGORY_ICONS = [Home, Briefcase, User] as const;

const CATEGORY_FALLBACK_DESC = [
  "Trades, maintenance and home improvement services.",
  "Business, accounting, IT and advisory services.",
  "Fitness, pet care, photography and event services.",
];

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object" && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
}

function readDraft(locationState: unknown): ProviderSignupDraft | null {
  if (locationState && typeof locationState === "object") {
    const s = locationState as Partial<ProviderSignupDraft>;
    if (s.email && s.password && s.name && s.businessName) {
      return {
        name: String(s.name),
        businessName: String(s.businessName),
        email: String(s.email),
        mobile: String(s.mobile || ""),
        password: String(s.password),
      };
    }
  }
  try {
    const raw = sessionStorage.getItem(PROVIDER_SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderSignupDraft;
  } catch {
    return null;
  }
}

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, logout } = useAuthSession();
  const submitted = searchParams.get("submitted") === "true";

  const [draft] = useState<ProviderSignupDraft | null>(() =>
    readDraft(location.state)
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);
  const [form, setForm] = useState({
    address: "",
    country: "United States",
    city: "",
    state: "",
    zip: "",
    license: "",
    insurance: "",
    licenseDocumentPath: "",
    insuranceDocumentPath: "",
    licenseFileName: "",
    insuranceFileName: "",
  });
  const [uploadingDoc, setUploadingDoc] = useState<"license" | "insurance" | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (submitted) return;
    if (!draft && !isAuthenticated) {
      toast.error("Start by creating a professional account.");
      navigate("/register?role=provider", { replace: true });
      return;
    }
    // Already registered + logged in: never re-run signup wizard — show pending portal
    if (!draft && isAuthenticated) {
      navigate("/provider/onboarding?submitted=true", { replace: true });
    }
  }, [draft, isAuthenticated, submitted, navigate]);

  // Prefill from existing provider profile only when continuing incomplete setup with draft cleared intentionally — skipped; pending redirect above handles logged-in users.

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await catalogApi.getTree();
        let list = unwrapList<Category>(res);
        if (!list.length) {
          const res2 = await catalogApi.listCategories();
          list = unwrapList<Category>(res2);
        }
        if (cancelled) return;
        setCategories(list);
        if (list[0]?.id != null) {
          setSelectedCategoryId(Number(list[0].id));
        }
      } catch {
        if (!cancelled) toast.error("Could not load service categories.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => Number(c.id) === Number(selectedCategoryId)),
    [categories, selectedCategoryId]
  );

  const serviceTypes: ServiceType[] = useMemo(() => {
    const nested = selectedCategory?.service_types;
    if (Array.isArray(nested) && nested.length) return nested;
    return [];
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategoryId || serviceTypes.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await catalogApi.listServiceTypes({
          category_id: selectedCategoryId,
          is_active: true,
        });
        const list = unwrapList<ServiceType>(res);
        if (cancelled || !list.length) return;
        setCategories((prev) =>
          prev.map((c) =>
            Number(c.id) === Number(selectedCategoryId)
              ? { ...c, service_types: list }
              : c
          )
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, serviceTypes.length]);

  useEffect(() => {
    if (serviceTypes.length && selectedServiceTypeId == null) {
      setSelectedServiceTypeId(Number(serviceTypes[0].id));
    }
  }, [serviceTypes, selectedServiceTypeId]);

  const handleSelectCategory = (id: number) => {
    setSelectedCategoryId(id);
    setSelectedServiceTypeId(null);
    setError("");
  };

  const handleNext = async () => {
    setError("");
    setFieldErrors({});

    if (step === 0) {
      if (!selectedCategoryId) {
        setError("Please select a service category.");
        return;
      }
      if (!selectedServiceTypeId) {
        setError("Please select a service area.");
        return;
      }
    }

    if (step === 1) {
      const errs: Record<string, string> = {};
      if (!form.address.trim()) errs.address = "Street address is required.";
      if (!form.city.trim()) errs.city = "City is required.";
      if (!form.state.trim()) errs.state = "State / Province is required.";
      if (!form.zip.trim()) {
        errs.zip = "ZIP / Postal code is required.";
      } else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim()) && form.zip.trim().length < 3) {
        errs.zip = "Please enter a valid 5-digit ZIP code.";
      }
      if (!form.country.trim()) errs.country = "Country is required.";

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setError("Please complete all required service coverage fields.");
        return;
      }
    }

    if (step === 2) {
      const errs: Record<string, string> = {};
      if (!form.license.trim()) errs.license = "License number is required.";
      if (!form.insurance.trim()) errs.insurance = "Insurance policy number is required.";
      if (!form.licenseDocumentPath) errs.licenseDocument = "Please upload your business license document.";
      if (!form.insuranceDocumentPath) errs.insuranceDocument = "Please upload your insurance certificate.";

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setError("Please provide all required license and insurance credentials.");
        return;
      }
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit
    try {
      setLoading(true);

      const profilePayload = {
        category_id: Number(selectedCategoryId),
        service_location_address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        zip_code: form.zip.trim(),
        license_number: form.license.trim() || undefined,
        insurance_policy: form.insurance.trim() || undefined,
        license_document: form.licenseDocumentPath || undefined,
        insurance_certificate: form.insuranceDocumentPath || undefined,
      };

      if (!draft) {
        setError("Signup details missing. Please start registration again.");
        return;
      }

      await authApi.register({
        full_name: draft.name,
        email: draft.email,
        phone: draft.mobile,
        password: draft.password,
        role: ROLES.PROVIDER,
        business_name: draft.businessName,
        category_id: Number(selectedCategoryId),
        service_type_ids: [Number(selectedServiceTypeId)],
        ...profilePayload,
      });
      try {
        sessionStorage.removeItem(PROVIDER_SIGNUP_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Account created. Enter the OTP sent to your email.");
      navigate(
        `/verify-email?email=${encodeURIComponent(draft.email)}&role=provider`,
        { replace: true }
      );
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Registration failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (
    kind: "license" | "insurance",
    file: File | null | undefined
  ) => {
    if (!file) return;
    const maxBytes = 25 * 1024 * 1024; // 25MB limit
    if (file.size > maxBytes) {
      toast.error("File size exceeds 25MB limit. Please choose a smaller file.");
      return;
    }

    const allowedExtensions = /\.(pdf|png|jpg|jpeg|doc|docx|webp)$/i;
    if (!allowedExtensions.test(file.name)) {
      toast.error("Invalid file format. Please upload a PDF, PNG, JPG, or DOC file.");
      return;
    }

    try {
      setUploadingDoc(kind);
      const isImage = file.type.startsWith("image/");
      const res = isImage
        ? await uploadApi.uploadProviderImage(file)
        : await uploadApi.uploadProviderDocument(file);
      const data = (res as { data?: { base_path?: string } })?.data ?? res;
      const path =
        (data as { base_path?: string })?.base_path ||
        (data as { name?: string })?.name ||
        "";
      if (!path) throw new Error("Upload succeeded but no file path returned");
      const normalized = path.startsWith("/") ? path : `/${path}`;
      if (kind === "license") {
        setForm((f) => ({
          ...f,
          licenseDocumentPath: normalized,
          licenseFileName: file.name,
        }));
      } else {
        setForm((f) => ({
          ...f,
          insuranceDocumentPath: normalized,
          insuranceFileName: file.name,
        }));
      }
      toast.success(`${file.name} uploaded successfully.`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "File upload failed"));
    } finally {
      setUploadingDoc(null);
    }
  };

  if (submitted) {
    const businessName = searchParams.get("businessName") || draft?.businessName;
    const fullName = searchParams.get("fullName") || draft?.name;

    return (
      <>
        <Header />
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
              onClick={async () => {
                if (isAuthenticated) await logout();
                navigate("/");
              }}
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
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
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
                  <Input
                    id="address"
                    placeholder="Start typing your street address..."
                    value={form.address}
                    onChange={(e) => {
                      set({ address: e.target.value });
                      if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined });
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
                    <label className={`grid h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                      fieldErrors.licenseDocument ? "border-destructive bg-destructive/5" : "border-border bg-card hover:border-primary/50"
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc === "license"}
                        onChange={(e) => {
                          if (fieldErrors.licenseDocument) setFieldErrors({ ...fieldErrors, licenseDocument: undefined });
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
                    <label className={`grid h-32 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                      fieldErrors.insuranceDocument ? "border-destructive bg-destructive/5" : "border-border bg-card hover:border-primary/50"
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc === "insurance"}
                        onChange={(e) => {
                          if (fieldErrors.insuranceDocument) setFieldErrors({ ...fieldErrors, insuranceDocument: undefined });
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
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
                setError("");
                setFieldErrors({});
              }}
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
