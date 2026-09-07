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
} from "lucide-react";
import toast from "react-hot-toast";
import { sanitizePhoneInput } from "@/utils/format";

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

  const setTab = (tab: ProfileTab) => {
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
    if (selectedSubcategoryObj?.services && selectedSubcategoryObj.services.length > 0) {
      return selectedSubcategoryObj.services;
    }
    const subName = selectedSubcategoryObj?.name || "Service";
    return [
      { id: 101, name: `General ${subName} Repair` },
      { id: 102, name: `${subName} Installation & Setup` },
      { id: 103, name: `Emergency ${subName} Service` },
      { id: 104, name: `Routine ${subName} Maintenance` },
    ];
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

      // Bank — prefer dedicated endpoint (full numbers for owner)
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

      // Contact name / phone on user record
      if (providerId && (ownerName.trim() || mobile.trim())) {
        try {
          await userApi.updateProviderProfile(providerId, {
            full_name: ownerName.trim() || undefined,
            phone: mobile.trim() || undefined,
          });
        } catch {
          /* non-blocking — profile business fields already saved */
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
            Manage your business information, operating address, FAQs and
            deposit bank account.
          </p>
        </div>
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as ProfileTab)}
        >
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
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <User size={18} className="text-primary" /> Primary Account
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">Full Name</Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pemail">Email Address</Label>
                      <Input id="pemail" type="email" value={email} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pmobile">Mobile Number</Label>
                      <Input
                        id="pmobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(sanitizePhoneInput(e.target.value))}
                        placeholder="(512) 555-0148"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Building2 size={18} className="text-primary" /> Business
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="bn">Business Name</Label>
                      <Input
                        id="bn"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5">
                        Primary Category <span className="text-[10px] text-muted-foreground font-normal">(Fixed at registration)</span>
                      </Label>
                      <Input
                        value={selectedCategoryObj?.name || "Home Services"}
                        disabled
                        className="bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5">
                        Subcategory <span className="text-[10px] text-muted-foreground font-normal">(Fixed at registration)</span>
                      </Label>
                      <Input
                        value={selectedSubcategoryObj?.name || "Plumbing"}
                        disabled
                        className="bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="years">Years of Experience</Label>
                      <Input
                        id="years"
                        type="number"
                        min={0}
                        placeholder="e.g. 14"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                      />
                    </div>
                  </div>


                  <div className="grid gap-2">
                    <Label htmlFor="ab">About Your Business</Label>
                    <Textarea
                      id="ab"
                      rows={5}
                      placeholder="Describe your services, experience, and why customers should choose your business..."
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <MapPin size={18} className="text-primary" /> Operating
                    Address &amp; Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <GooglePlaceAutocomplete
                        value={address}
                        onChange={setAddress}
                        placeholder="Enter street address..."
                        onSelect={(place) => {
                          setAddress(place.address);
                          setLat(place.lat);
                          setLng(place.lng);
                          const comps = place.fullPlace?.address_components || [];
                          const get = (type: string) =>
                            comps.find((c) => c.types.includes(type))
                              ?.long_name || "";
                          const cityVal =
                            get("locality") || get("sublocality") || city;
                          const stateVal =
                            get("administrative_area_level_1") || state;
                          const zipVal = get("postal_code") || zip;
                          const countryVal = get("country") || country;
                          if (cityVal) setCity(cityVal);
                          if (stateVal) setState(stateVal);
                          if (zipVal) setZip(zipVal);
                          if (countryVal) setCountry(countryVal);
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input
                        id="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <ShieldCheck size={18} className="text-primary" /> Verified
                    Credentials &amp; Licensing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="lic">License Number</Label>
                      <Input
                        id="lic"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ins">Insurance Policy Number</Label>
                      <Input
                        id="ins"
                        value={insurancePolicy}
                        onChange={(e) => setInsurancePolicy(e.target.value)}
                      />
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
                    Document uploads are verified by Admin during onboarding
                    review. Use verification docs upload during onboarding if
                    needed.
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
                    Click &apos;+ Add FAQ&apos; above to create answers to common
                    customer questions.
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
            <Card>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Landmark size={18} className="text-primary" /> Bank
                  Information &amp; Payout Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bankname">Bank Name</Label>
                    <Input
                      id="bankname"
                      placeholder="e.g. Chase Bank"
                      value={bank.bank_name}
                      onChange={(e) =>
                        setBank((b) => ({ ...b, bank_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="holder">Account Holder Name</Label>
                    <Input
                      id="holder"
                      placeholder="e.g. ABC Plumbing LLC"
                      value={bank.bank_account_holder}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_holder: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account">Account Number</Label>
                    <Input
                      id="account"
                      placeholder="Enter account number (digits only)"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={bank.bank_account_number}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_number: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="routing">Routing Number / IFSC</Label>
                    <Input
                      id="routing"
                      placeholder="Enter routing number or IFSC"
                      value={bank.bank_routing_number}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_routing_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="btype">Account Type</Label>
                    <Select
                      value={bank.bank_account_type}
                      onValueChange={(v) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_type: v as BankAccountType,
                        }))
                      }
                    >
                      <SelectTrigger id="btype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={saveBank} disabled={saving}>
                    {saving ? "Saving…" : "Save Bank Details"}
                  </Button>
                </div>

                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Deposit account details remain strictly private to your
                  provider account and are used for payout releases.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Upload size={18} className="text-primary" /> Business Logo
                Uploader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 text-center">
              <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                    {initialsFrom(businessName)}
                  </div>
                )}
              </div>
              <div>
                <Label
                  htmlFor="logo_upload"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Upload size={14} /> {logoPreview ? "Change Logo" : "Upload New Logo"}
                </Label>
                <input
                  id="logo_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  PNG, JPG or SVG logo image (Max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initialsFrom(businessName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">
                    {businessName || "Your Business"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryName || "Category"}
                  </p>
                </div>
              </div>

              {verified === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} /> Verified
                </span>
              )}

              <Separator />

              <dl className="space-y-2.5 text-xs">
                {rating != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Rating</dt>
                    <dd className="font-bold text-foreground">
                      {rating.toFixed(1)} ★
                    </dd>
                  </div>
                )}
                {years !== "" && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Years in Business</dt>
                    <dd className="font-semibold text-foreground">
                      {years} Years
                    </dd>
                  </div>
                )}
                {(city || state) && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-semibold text-foreground">
                      {[city, state].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
                {planName && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-semibold text-foreground">{planName}</dd>
                  </div>
                )}
              </dl>

              <Separator />

              <Button
                onClick={
                  activeTab === "bank"
                    ? saveBank
                    : activeTab === "faqs"
                      ? saveFaqsOnly
                      : saveProfile
                }
                className="w-full"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle size={18} className="text-primary" />
              {editingFaq ? "Edit FAQ" : "Add Frequently Asked Question"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingFaq
                ? "Update your existing FAQ entry for potential customers."
                : "Add a new question and answer to display on your public business profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faq_question" className="text-xs font-bold">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="faq_question"
                placeholder="e.g. Do you provide same-day service?"
                value={faqForm.question}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, question: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq_answer" className="text-xs font-bold">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="faq_answer"
                rows={4}
                placeholder="Enter the answer to this question..."
                value={faqForm.answer}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answer: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-2">
            <Button variant="outline" onClick={() => setFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFaqLocal}>
              {editingFaq ? "Save Changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfileSettings;
