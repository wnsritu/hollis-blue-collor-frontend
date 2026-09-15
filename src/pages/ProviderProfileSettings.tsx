import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
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
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import Spinner from "@/components/ui/spinner";

import { userApi } from "@/api/modules/user.api";
import { providerApi } from "@/api/modules/provider.api";
import { catalogApi } from "@/api/modules/catalog.api";
import { subscriptionApi } from "@/api/modules/subscription.api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuthSession } from "@/hooks/useAuth";
import type { Category } from "@/types/api/catalog";
import type { BankAccountType } from "@/types/api/provider";

import {
  validateFullName,
  validatePhone,
  validateBusinessName,
  validateYearsOfExperience,
  validateZipCode,
  validateBankAccountNumber,
  validateBankRoutingNumber,
  validateLicenseNumber,
  validateInsurancePolicy,
  extractApiFieldErrors,
} from "@/utils/providerValidation";

type ProfileTab = "info" | "bank" | "faqs";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type BankForm = {
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_account_type: BankAccountType;
};

interface FieldErrors {
  ownerName?: string;
  businessName?: string;
  about?: string;
  mobile?: string;
  years?: string;
  zip?: string;
  bank_name?: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  [key: string]: string | undefined;
}

const BANK_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Business Checking" },
];

function unwrapData<T = unknown>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

function parseFaqs(raw: unknown): FAQItem[] {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map((item, i) => ({
    id: `faq-${i}-${String((item as FAQItem)?.question || "").slice(0, 12)}`,
    question: String((item as FAQItem)?.question || ""),
    answer: String((item as FAQItem)?.answer || ""),
  }));
}

function parseCerts(raw: unknown): string {
  if (!raw) return "";
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (!Array.isArray(list)) return String(raw);
  return list
    .map((c) => (typeof c === "string" ? c : (c as { name?: string })?.name || ""))
    .filter(Boolean)
    .join(", ");
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ProviderProfileSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as ProfileTab) || "info";
  const activeTab: ProfileTab =
    tabParam === "bank" || tabParam === "faqs" ? tabParam : "info";

  const { fetchMe, updateUser } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [verified, setVerified] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [planName, setPlanName] = useState<string | null>(null);

  // Contact
  const [ownerName, setOwnerName] = useState("");
  const [savedOwnerName, setSavedOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Business
  const [businessName, setBusinessName] = useState("");
  const [savedBusinessName, setSavedBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [years, setYears] = useState<string>("");
  const [about, setAbout] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Credentials
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [certifications, setCertifications] = useState("");

  // Logo
  const [logoPreview, setLogoPreview] = useState("");

  // Bank
  const [bank, setBank] = useState<BankForm>({
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
    bank_account_type: "checking",
  });

  // FAQs
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const setTab = (tab: ProfileTab) => {
    setFieldErrors({});
    setSearchParams(tab === "info" ? {} : { tab });
  };

  const categoryName = useMemo(() => {
    const found = categories.find((c) => String(c.id) === categoryId);
    return found?.name || "";
  }, [categories, categoryId]);

  // ── Real-Time Field Validation Handlers ──
  const handleOwnerNameChange = (val: string) => {
    setOwnerName(val);
    const err = validateFullName(val);
    setFieldErrors((prev) => ({ ...prev, ownerName: err }));
  };

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    const err = validateBusinessName(val);
    setFieldErrors((prev) => ({ ...prev, businessName: err }));
  };

  const handleAboutChange = (val: string) => {
    setAbout(val);
    let err: string | undefined;
    if (!val.trim()) {
      err = "Service description is required.";
    } else if (val.trim().length < 10) {
      err = "Service description must be at least 10 characters.";
    }
    setFieldErrors((prev) => ({ ...prev, about: err }));
  };

  const handleMobileChange = (val: string) => {
    const sanitized = sanitizePhoneInput(val);
    setMobile(sanitized);
    let err: string | undefined;
    if (sanitized.trim()) {
      err = validatePhone(sanitized);
    }
    setFieldErrors((prev) => ({ ...prev, mobile: err }));
  };

  const handleYearsChange = (val: string) => {
    setYears(val);
    const err = validateYearsOfExperience(val);
    setFieldErrors((prev) => ({ ...prev, years: err }));
  };

  const handleZipChange = (val: string) => {
    setZip(val);
    const err = validateZipCode(val);
    setFieldErrors((prev) => ({ ...prev, zip: err }));
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    let err: string | undefined;
    if (!val.trim()) err = "Service location address is required.";
    setFieldErrors((prev) => ({ ...prev, address: err }));
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    let err: string | undefined;
    if (!val.trim()) err = "City is required.";
    setFieldErrors((prev) => ({ ...prev, city: err }));
  };

  const handleStateChange = (val: string) => {
    setState(val);
    let err: string | undefined;
    if (!val.trim()) err = "State is required.";
    setFieldErrors((prev) => ({ ...prev, state: err }));
  };

  const handleCountryChange = (val: string) => {
    setCountry(val);
    let err: string | undefined;
    if (!val.trim()) err = "Country is required.";
    setFieldErrors((prev) => ({ ...prev, country: err }));
  };

  const handleLicenseNumberChange = (val: string) => {
    setLicenseNumber(val);
    const err = validateLicenseNumber(val);
    setFieldErrors((prev) => ({ ...prev, licenseNumber: err, license: err }));
  };

  const handleInsurancePolicyChange = (val: string) => {
    setInsurancePolicy(val);
    const err = validateInsurancePolicy(val);
    setFieldErrors((prev) => ({ ...prev, insurancePolicy: err, insurance: err }));
  };

  const handleBankFieldChange = (field: keyof BankForm, value: string) => {
    let cleanVal = value;
    if (field === "bank_account_number") {
      cleanVal = value.replace(/\D/g, "");
    }
    setBank((prev) => ({ ...prev, [field]: cleanVal }));

    let err: string | undefined;
    if (field === "bank_name") {
      if (!cleanVal.trim()) err = "Bank name is required.";
    } else if (field === "bank_account_holder") {
      if (!cleanVal.trim()) err = "Account holder name is required.";
    } else if (field === "bank_account_number") {
      err = validateBankAccountNumber(cleanVal);
    } else if (field === "bank_routing_number") {
      err = validateBankRoutingNumber(cleanVal);
    }
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const checkBusinessInfoErrors = (): FieldErrors => {
    const errs: FieldErrors = {};
    const nErr = validateFullName(ownerName);
    if (nErr) errs.ownerName = nErr;

    const bErr = validateBusinessName(businessName);
    if (bErr) errs.businessName = bErr;

    if (!about.trim()) {
      errs.about = "Service description is required.";
    } else if (about.trim().length < 10) {
      errs.about = "Service description must be at least 10 characters.";
    }

    if (mobile.trim()) {
      const pErr = validatePhone(mobile);
      if (pErr) errs.mobile = pErr;
    }

    const yErr = validateYearsOfExperience(years);
    if (yErr) errs.years = yErr;

    if (!address.trim()) errs.address = "Service location address is required.";
    if (!city.trim()) errs.city = "City is required.";
    if (!state.trim()) errs.state = "State is required.";
    if (!country.trim()) errs.country = "Country is required.";

    if (zip.trim()) {
      const zErr = validateZipCode(zip);
      if (zErr) errs.zip = zErr;
    }

    const licErr = validateLicenseNumber(licenseNumber);
    if (licErr) {
      errs.licenseNumber = licErr;
      errs.license = licErr;
    }

    const insErr = validateInsurancePolicy(insurancePolicy);
    if (insErr) {
      errs.insurancePolicy = insErr;
      errs.insurance = insErr;
    }

    return errs;
  };

  const checkBankDetailsErrors = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!bank.bank_name.trim()) errs.bank_name = "Bank name is required.";
    if (!bank.bank_account_holder.trim()) errs.bank_account_holder = "Account holder name is required.";

    const accErr = validateBankAccountNumber(bank.bank_account_number);
    if (accErr) errs.bank_account_number = accErr;

    const routeErr = validateBankRoutingNumber(bank.bank_routing_number);
    if (routeErr) errs.bank_routing_number = routeErr;

    return errs;
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      const [meRes, userRes, catRes, planMaybe] = await Promise.all([
        providerApi.getMyMarketplaceProfile().catch(() => null),
        userApi.getMyProfile().catch(() => null),
        catalogApi.listCategories().catch(() => null),
        subscriptionApi.getCurrent().catch(() => null),
      ]);

      const provider = unwrapData<any>(meRes) || unwrapData<any>(userRes)?.provider;
      const user = unwrapData<any>(userRes);
      const cats = unwrapData<Category[]>(catRes);
      if (Array.isArray(cats)) setCategories(cats);

      if (!provider?.id && !user) {
        toast.error("Could not load provider profile.");
        return;
      }

      const pid = provider?.id ? Number(provider.id) : null;
      if (pid) setProviderId(pid);

      const bName = provider?.business_name || "";
      setBusinessName(bName);
      setSavedBusinessName(bName);
      setAbout(provider?.service_description || "");
      setAddress(provider?.service_location_address || "");
      setCity(provider?.city || "");
      setState(provider?.state || "");
      setZip(provider?.zip_code || "");
      setCountry(provider?.country || "");
      setYears(
        provider?.years_of_experience != null
          ? String(provider.years_of_experience)
          : ""
      );
      setCategoryId(
        provider?.category_id != null ? String(provider.category_id) : ""
      );
      setVerified(provider?.verified || "");
      setRating(
        provider?.rating != null && provider.rating !== ""
          ? Number(provider.rating)
          : null
      );
      setLicenseNumber(provider?.license_number || "");
      setInsurancePolicy(provider?.insurance_policy || "");
      setCertifications(parseCerts(provider?.certifications));
      setFaqs(parseFaqs(provider?.faqs));

      if (provider?.latitude != null) setLat(Number(provider.latitude));
      if (provider?.longitude != null) setLng(Number(provider.longitude));

      const u = user || provider?.user;
      const oName = u?.full_name || "";
      setOwnerName(oName);
      setSavedOwnerName(oName);
      setEmail(u?.email || "");
      setMobile(u?.phone || "");

      const photo =
        u?.profile_image ||
        u?.profile_photo ||
        provider?.user?.profile_image ||
        provider?.profile_photo;
      if (photo) setLogoPreview(resolveMediaUrl(String(photo)) || "");

      if (pid) {
        try {
          const bankRes = await providerApi.getBankInfo(pid);
          const b = unwrapData<any>(bankRes);
          setBank({
            bank_name: b?.bank_name || provider?.bank_name || "",
            bank_account_holder:
              b?.bank_account_holder || provider?.bank_account_holder || "",
            bank_account_number:
              b?.bank_account_number || provider?.bank_account_number || "",
            bank_routing_number:
              b?.bank_routing_number || provider?.bank_routing_number || "",
            bank_account_type:
              (b?.bank_account_type as BankAccountType) ||
              (provider?.bank_account_type as BankAccountType) ||
              "checking",
          });
        } catch {
          setBank({
            bank_name: provider?.bank_name || "",
            bank_account_holder: provider?.bank_account_holder || "",
            bank_account_number: provider?.bank_account_number || "",
            bank_routing_number: provider?.bank_routing_number || "",
            bank_account_type:
              (provider?.bank_account_type as BankAccountType) || "checking",
          });
        }
      }

      const planData = unwrapData<any>(planMaybe);
      const sub = planData?.subscription || planData;
      setPlanName(sub?.plan?.name || sub?.plan_name || sub?.name || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const buildProfilePayload = () => {
    const certList = Array.isArray(certifications)
      ? certifications
      : typeof certifications === "string"
        ? certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

    const yearsNum = years === "" || isNaN(Number(years)) ? null : Number(years);

    return {
      business_name: businessName.trim(),
      service_description: about.trim(),
      service_location_address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zip_code: zip.trim(),
      latitude: lat,
      longitude: lng,
      years_of_experience: yearsNum,
      category_id: categoryId ? Number(categoryId) : null,
      certifications: certList,
      faqs: faqs.map(({ question, answer }) => ({ question, answer })),
      license_number: licenseNumber.trim() || null,
      insurance_policy: insurancePolicy.trim() || null,
    };
  };

  const saveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const errs = checkBusinessInfoErrors();
    setFieldErrors(errs);

    const keys = Object.keys(errs);
    if (keys.length > 0) {
      if (activeTab !== "info") {
        setSearchParams({});
      }

      const elemIdMap: Record<string, string> = {
        ownerName: "ownerName",
        businessName: "bn",
        about: "ab",
        mobile: "pmobile",
        years: "years",
        zip: "zip",
      };
      const elementId = elemIdMap[keys[0]] || keys[0];
      setTimeout(() => {
        const elem = document.getElementById(elementId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "center" });
          elem.focus();
        }
      }, 100);

      return;
    }

    try {
      setSaving(true);
      await providerApi.updateMyMarketplaceProfile(buildProfilePayload());

      if (providerId && (ownerName.trim() || mobile.trim())) {
        try {
          await userApi.updateProviderProfile(providerId, {
            full_name: ownerName.trim() || undefined,
            phone: mobile.trim() || undefined,
          });
        } catch (uErr: any) {
          const apiErrs = extractApiFieldErrors(uErr);
          if (Object.keys(apiErrs).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...apiErrs }));
          }
        }
      }

      setFieldErrors({});
      toast.success("Profile saved successfully.");
      await loadAll();
    } catch (err: any) {
      const apiErrs = extractApiFieldErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...apiErrs }));
      }
      toast.error(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!providerId) {
      toast.error("Provider profile not found.");
      return;
    }

    const errs = checkBankDetailsErrors();
    setFieldErrors(errs);

    const keys = Object.keys(errs);
    if (keys.length > 0) {
      const elemIdMap: Record<string, string> = {
        bank_name: "bankname",
        bank_account_holder: "holder",
        bank_account_number: "account",
        bank_routing_number: "routing",
      };
      const elementId = elemIdMap[keys[0]] || keys[0];
      setTimeout(() => {
        const elem = document.getElementById(elementId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "center" });
          elem.focus();
        }
      }, 100);

      return;
    }

    try {
      setSaving(true);
      await providerApi.updateBankInfo(providerId, {
        bank_name: bank.bank_name.trim(),
        bank_account_holder: bank.bank_account_holder.trim(),
        bank_account_number: bank.bank_account_number.trim(),
        bank_routing_number: bank.bank_routing_number.trim(),
        bank_account_type: bank.bank_account_type,
      });
      setFieldErrors({});
      toast.success("Bank details saved successfully.");
      await loadAll();
    } catch (err: any) {
      const apiErrs = extractApiFieldErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setFieldErrors(apiErrs);
      }
      toast.error(getErrorMessage(err, "Failed to save bank details."));
    } finally {
      setSaving(false);
    }
  };

  const saveFaqsOnly = async () => {
    try {
      setSaving(true);
      await providerApi.updateMyMarketplaceProfile({
        faqs: faqs.map(({ question, answer }) => ({ question, answer })),
      });
      toast.success("FAQs saved successfully.");
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save FAQs."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5MB.");
      return;
    }

    try {
      setLogoPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("profile_photo", file);
      const res: any = await userApi.updateProfilePhoto(formData);
      const photoPath =
        res?.profile_photo ||
        res?.profile_image ||
        res?.data?.profile_photo ||
        res?.data?.profile_image;
      if (photoPath) {
        updateUser({ profile_image: photoPath, profile_photo: photoPath });
      }
      toast.success("Logo uploaded successfully.");
      try {
        await fetchMe();
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Logo upload failed."));
    }
  };

  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: "", answer: "" });
    setFaqModalOpen(true);
  };

  const handleOpenEditFaq = (item: FAQItem) => {
    setEditingFaq(item);
    setFaqForm({ question: item.question, answer: item.answer });
    setFaqModalOpen(true);
  };

  const handleSaveFaqLocal = () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error("Please enter both question and answer.");
      return;
    }

    if (editingFaq) {
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === editingFaq.id ? { ...f, ...faqForm } : f
        )
      );
      toast.success("FAQ updated — click Save to persist.");
    } else {
      setFaqs((prev) => [
        {
          id: `faq-${Date.now()}`,
          question: faqForm.question.trim(),
          answer: faqForm.answer.trim(),
        },
        ...prev,
      ]);
      toast.success("FAQ added — click Save to persist.");
    }
    setFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    toast.success("FAQ removed — click Save to persist.");
  };

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

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ProfileTab)}>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
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
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
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
                      <Label>Primary Category</Label>
                      <Select
                        value={categoryId || undefined}
                        onValueChange={setCategoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      rows={5}
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
                          handleAddressChange(place.address);
                          setLat(place.lat);
                          setLng(place.lng);
                          const comps = place.fullPlace?.address_components || [];
                          const get = (type: string) =>
                            comps.find((c) => c.types.includes(type))?.long_name || "";
                          const cityVal = get("locality") || get("sublocality") || city;
                          const stateVal = get("administrative_area_level_1") || state;
                          const zipVal = get("postal_code") || zip;
                          const countryVal = get("country") || country;
                          if (cityVal) handleCityChange(cityVal);
                          if (stateVal) handleStateChange(stateVal);
                          if (zipVal) handleZipChange(zipVal);
                          if (countryVal) handleCountryChange(countryVal);
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
                    disabled={saving}
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
              {Object.values(fieldErrors).some(Boolean) && (
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
              )}
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

        {/* ── Sidebar Summary Card ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <div className="relative">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={businessName || "Provider Logo"}
                      className="size-20 rounded-full border-2 border-primary/20 object-cover"
                    />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary">
                      {initialsFrom(businessName || ownerName)}
                    </div>
                  )}
                  <label
                    htmlFor="logo-upload-input"
                    className="absolute bottom-0 right-0 grid size-7 cursor-pointer place-items-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-110"
                    title="Upload Business Logo"
                  >
                    <Upload size={14} />
                    <input
                      id="logo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <CardTitle className="text-base">
                {businessName.trim() || savedBusinessName.trim() || ownerName.trim() || savedOwnerName.trim() || "Your Business"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{categoryName || "Provider"}</p>

              {verified === "verified" && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={13} /> Verified Business
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-xs">
              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-bold text-foreground">
                  {rating != null ? `${rating.toFixed(1)} ★` : "New Provider"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-semibold text-foreground">
                  {years ? `${years} years` : "Not specified"}
                </span>
              </div>

              {planName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subscription</span>
                  <span className="font-semibold text-primary">{planName}</span>
                </div>
              )}

              {address && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-border">
                  <span className="shrink-0 text-muted-foreground">Address</span>
                  <span className="text-right font-medium text-foreground">
                    {[address, city, state, zip].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
