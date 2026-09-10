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
import type { Category } from "@/types/api/catalog";
import type { BankAccountType } from "@/types/api/provider";
import type { ProviderProfileTab, FAQItem, BankForm } from "@/types/provider.types";

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
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Business
  const [businessName, setBusinessName] = useState("");
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

      setBusinessName(provider?.business_name || "");
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
      setOwnerName(u?.full_name || "");
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
      license_number: licenseNumber.trim() || null,
      insurance_policy: insurancePolicy.trim() || null,
    };
  };

  const saveProfile = async () => {
    if (!businessName.trim()) {
      toast.error("Business name is required.");
      setTab("info");
      return;
    }
    if (!about.trim() || about.trim().length < 10) {
      toast.error("About / description must be at least 10 characters.");
      setTab("info");
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
        } catch {
          /* non-blocking */
        }
      }

      toast.success("Profile saved successfully.");
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    if (!providerId) {
      toast.error("Provider profile not found.");
      return;
    }
    if (
      !bank.bank_name.trim() ||
      !bank.bank_account_holder.trim() ||
      !bank.bank_account_number.trim() ||
      !bank.bank_routing_number.trim()
    ) {
      toast.error("Please fill all bank fields.");
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
      toast.success("Bank details saved.");
      await loadAll();
    } catch (err) {
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
  };
}
