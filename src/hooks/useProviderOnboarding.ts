import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { catalogApi } from "@/services/catalog";
import { authApi } from "@/services/auth";
import { uploadApi } from "@/services/project";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import type { Category, ServiceType } from "@/types/api/catalog";
import {
  PROVIDER_SIGNUP_DRAFT_KEY,
  type ProviderSignupDraft,
} from "@/pages/auth/SignUp";
import { getErrorMessage } from "@/services";
import toast from "react-hot-toast";

export const ONBOARDING_STEPS = ["Services", "Coverage", "Credentials"] as const;

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

export function useProviderOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, logout } = useAuthSession();
  const submitted = searchParams.get("submitted") === "true";

  const [draft] = useState<ProviderSignupDraft | null>(() =>
    readDraft(location.state)
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
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
    latitude: null as number | null,
    longitude: null as number | null,
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

    if (step < ONBOARDING_STEPS.length - 1) {
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
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
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

  const handlePreviousStep = () => {
    setStep((s) => Math.max(0, s - 1));
    setError("");
    setFieldErrors({});
  };

  const handleBackToHome = async () => {
    if (isAuthenticated) await logout();
    navigate("/");
  };

  const businessName = searchParams.get("businessName") || draft?.businessName;
  const fullName = searchParams.get("fullName") || draft?.name;

  return {
    submitted,
    businessName,
    fullName,
    step,
    setStep,
    steps: ONBOARDING_STEPS,
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
    isAuthenticated,
  };
}
