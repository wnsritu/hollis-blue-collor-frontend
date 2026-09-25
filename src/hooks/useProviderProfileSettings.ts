import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { userApi } from "@/services/customer";
import { providerApi } from "@/services/provider";
import { catalogApi } from "@/services/catalog";
import { subscriptionApi } from "@/services/payment";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuthSession } from "@/hooks/useAuth";
import { providerCompletionStore } from "@/store/providerCompletionStore";
import type { Category } from "@/types/api/catalog";
import type { BankAccountType } from "@/types/api/provider";
import type { ProviderProfileTab, FAQItem, BankForm } from "@/types/provider.types";
import { isValidZip } from "@/validations/common/rules";
import { validateImageFile } from "@/validations/common/file";
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
import { sanitizePhoneInput } from "@/utils/format";

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

export function useProviderProfileSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as ProviderProfileTab) || "info";
  const activeTab: ProviderProfileTab =
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
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [years, setYears] = useState<string>("");
  const [about, setAbout] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

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
    const sanitized = val.replace(/\D/g, "").slice(0, 10);
    setMobile(sanitized);
    const err = validatePhone(sanitized);
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

  const setTab = (tab: ProviderProfileTab) => {
    setSearchParams(tab === "info" ? {} : { tab });
  };

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => String(c.id) === categoryId);
  }, [categories, categoryId]);

  const availableSubcategories = useMemo(() => {
    return selectedCategoryObj?.service_types || [];
  }, [selectedCategoryObj]);

  const selectedSubcategoryObj = useMemo(() => {
    return availableSubcategories.find((s) => String(s.id) === subcategoryId);
  }, [availableSubcategories, subcategoryId]);

  const availableServiceItems = useMemo(() => {
    return (selectedSubcategoryObj?.services || []).filter((s: any) => s.is_active !== false);
  }, [selectedSubcategoryObj]);

  const categoryName = useMemo(() => {
    return selectedCategoryObj?.name || "";
  }, [selectedCategoryObj]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      const [meRes, userRes, catRes, planMaybe] = await Promise.all([
        providerApi.getMyMarketplaceProfile().catch(() => null),
        userApi.getMyProfile().catch(() => null),
        catalogApi.getTree().catch(() => null),
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
      setCountry(provider?.country || "United States");
      setYears(
        provider?.years_of_experience != null
          ? String(provider.years_of_experience)
          : ""
      );
      setCategoryId(
        provider?.category_id != null ? String(provider.category_id) : ""
      );
      const subId =
        provider?.service_type_id != null
          ? String(provider.service_type_id)
          : provider?.sub_category?.id != null
          ? String(provider.sub_category.id)
          : provider?.service_types?.[0]?.id != null
          ? String(provider.service_types[0].id)
          : "";
      setSubcategoryId(subId);

      let initialServices: string[] = [];
      if (Array.isArray(provider?.offered_services) && provider.offered_services.length > 0) {
        initialServices = provider.offered_services.map(String);
      } else if (Array.isArray(provider?.services) && provider.services.length > 0) {
        initialServices = provider.services.map((s: any) => (typeof s === "string" ? s : String(s.id || s.name)));
      }
      setSelectedServiceIds(initialServices);

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

      if (provider) {
        providerCompletionStore.updateFromData(provider, user);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const checkBusinessInfoErrors = (): Record<string, string> => {
    const errs: Record<string, string> = {};

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

  const checkBankDetailsErrors = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!bank.bank_name.trim()) errs.bank_name = "Bank name is required.";
    if (!bank.bank_account_holder.trim()) errs.bank_account_holder = "Account holder name is required.";

    const accErr = validateBankAccountNumber(bank.bank_account_number);
    if (accErr) errs.bank_account_number = accErr;

    const routeErr = validateBankRoutingNumber(bank.bank_routing_number);
    if (routeErr) errs.bank_routing_number = routeErr;

    return errs;
  };

  const buildProfilePayload = () => {
    const chosenServiceNames = availableServiceItems
      .filter((svc) => selectedServiceIds.includes(String(svc.id)) || selectedServiceIds.includes(svc.name))
      .map((svc) => svc.name);

    const certList = Array.isArray(certifications)
      ? certifications
      : typeof certifications === "string"
      ? certifications.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

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
      years_of_experience: years === "" ? null : Number(years),
      category_id: categoryId ? Number(categoryId) : null,
      service_type_id: subcategoryId ? Number(subcategoryId) : null,
      offered_services: chosenServiceNames,
      service_categories: selectedSubcategoryObj ? [selectedSubcategoryObj.name] : [],
      services: chosenServiceNames,
      certifications: certList,
      faqs: faqs.map(({ question, answer }) => ({ question, answer })),
      license_number: licenseNumber.trim(),
      insurance_policy: insurancePolicy.trim(),
    };
  };

  const saveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const errs = checkBusinessInfoErrors();
    const keys = Object.keys(errs);

    if (keys.length > 0) {
      setFieldErrors(errs);
      toast.error("Please fix the validation errors before saving.");

      if (activeTab !== "info") {
        setSearchParams({});
      }

      const elemIdMap: Record<string, string> = {
        ownerName: "ownerName",
        businessName: "bn",
        about: "ab",
        mobile: "pmobile",
        years: "years",
        address: "address",
        city: "city",
        state: "state",
        zip: "zip",
        country: "country",
        licenseNumber: "lic",
        license: "lic",
        insurancePolicy: "ins",
        insurance: "ins",
      };

      setTimeout(() => {
        let scrolled = false;
        for (const k of keys) {
          const id = elemIdMap[k] || k;
          const elem = document.getElementById(id);
          if (elem) {
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
            try { elem.focus(); } catch {}
            scrolled = true;
            break;
          }
        }
        if (!scrolled) {
          const firstError = document.querySelector(".border-destructive, p.text-destructive");
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
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
      setSavedOwnerName(ownerName.trim());
      setSavedBusinessName(businessName.trim());
      toast.success("Profile saved successfully.");
      await loadAll();
      providerCompletionStore.refresh();
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
    const keys = Object.keys(errs);

    if (keys.length > 0) {
      setFieldErrors(errs);
      toast.error("Please fix the bank details validation errors.");

      const elemIdMap: Record<string, string> = {
        bank_name: "bankname",
        bank_account_holder: "holder",
        bank_account_number: "account",
        bank_routing_number: "routing",
      };

      setTimeout(() => {
        let scrolled = false;
        for (const k of keys) {
          const id = elemIdMap[k] || k;
          const elem = document.getElementById(id);
          if (elem) {
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
            try { elem.focus(); } catch {}
            scrolled = true;
            break;
          }
        }
        if (!scrolled) {
          const firstError = document.querySelector(".border-destructive, p.text-destructive");
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
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
      providerCompletionStore.refresh();
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
      toast.success("FAQs saved.");
      await loadAll();
      providerCompletionStore.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save FAQs."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file, { maxSizeBytes: 5 * 1024 * 1024 });
    if (!validation.valid) {
      toast.error(validation.error || "Logo must be under 5MB.");
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
      toast.success("Logo uploaded.");
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

  const handleDeleteFaq = (id: string | number) => {
    setFaqs((prev) => prev.filter((f) => String(f.id) !== String(id)));
    toast.success("FAQ removed — click Save to persist.");
  };

  return {
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
  };
}
